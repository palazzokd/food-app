import json
import uuid

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.chat import (
    ConversationCreate,
    ConversationDetailResponse,
    ConversationResponse,
    SendMessageRequest,
)
from app.services import chat_service, family_service
from app.services.auth_service import get_user_by_supabase_id, verify_token

router = APIRouter()


@router.post("/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    data: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = await family_service.get_family_profile(db, current_user.id)
    conversation = await chat_service.create_conversation(
        db, current_user.id, profile.id if profile else None, data.title
    )
    return ConversationResponse.model_validate(conversation)


@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conversations = await chat_service.list_conversations(db, current_user.id)
    return [ConversationResponse.model_validate(c) for c in conversations]


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conversation = await chat_service.get_conversation(db, conversation_id)
    if not conversation or conversation.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return ConversationDetailResponse.model_validate(conversation)


@router.websocket("/ws/{conversation_id}")
async def websocket_chat(
    websocket: WebSocket,
    conversation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    await websocket.accept()

    # Authenticate via first message or query param
    try:
        token = websocket.query_params.get("token", "")
        if not token:
            auth_msg = await websocket.receive_json()
            token = auth_msg.get("token", "")

        token_data = await verify_token(token)
        user = await get_user_by_supabase_id(db, token_data["supabase_auth_id"])
        if not user:
            await websocket.send_json({"type": "error", "message": "User not found"})
            await websocket.close()
            return
    except Exception:
        await websocket.send_json({"type": "error", "message": "Authentication failed"})
        await websocket.close()
        return

    user_id = user.id

    # Verify conversation belongs to user
    conversation = await chat_service.get_conversation(db, conversation_id)
    if not conversation or conversation.user_id != user_id:
        await websocket.send_json({"type": "error", "message": "Conversation not found"})
        await websocket.close()
        return

    await websocket.send_json({"type": "connected", "conversation_id": str(conversation_id)})

    # Check if this is an onboarding conversation
    profile = await family_service.get_family_profile(db, user_id)
    is_onboarding = profile is None or not profile.members

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type", "message")

            if msg_type == "message":
                content = data.get("content", "")
                if not content:
                    continue

                await websocket.send_json({"type": "stream_start"})

                from app.ai.orchestrator import process_message

                # The session lives for the whole socket with expire_on_commit=False,
                # so cached objects (message history, profile members) go stale after
                # commits. Expire everything so this turn reloads fresh state.
                db.expire_all()
                conversation = await chat_service.get_conversation(db, conversation_id)

                async for event in process_message(
                    content, conversation, db, user_id, is_onboarding=is_onboarding
                ):
                    await websocket.send_json(event)

                # Recheck onboarding status after processing (tools may have just
                # saved members — expire again so we see them)
                db.expire_all()
                profile = await family_service.get_family_profile(db, user_id)
                is_onboarding = profile is None or not profile.members

            elif msg_type == "quiz_response":
                # Treat quiz response as a regular message with the selected option
                selected = data.get("content", data.get("option_id", ""))
                if selected:
                    await websocket.send_json({"type": "stream_start"})

                    from app.ai.orchestrator import process_message

                    db.expire_all()
                    conversation = await chat_service.get_conversation(db, conversation_id)

                    async for event in process_message(
                        selected, conversation, db, user_id, is_onboarding=is_onboarding
                    ):
                        await websocket.send_json(event)

                    db.expire_all()
                    profile = await family_service.get_family_profile(db, user_id)
                    is_onboarding = profile is None or not profile.members

    except WebSocketDisconnect:
        pass
