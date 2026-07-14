import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.chat import Conversation, Message


async def create_conversation(
    db: AsyncSession,
    user_id: uuid.UUID,
    family_profile_id: uuid.UUID | None,
    title: str | None = None,
) -> Conversation:
    if not family_profile_id:
        # New user chatting before onboarding — create an empty profile so the
        # conversation has a home. Onboarding stays active until members exist.
        from app.schemas.family import FamilyProfileCreate
        from app.services import family_service

        profile = await family_service.create_family_profile(
            db, user_id, FamilyProfileCreate()
        )
        family_profile_id = profile.id

    conversation = Conversation(
        user_id=user_id,
        family_profile_id=family_profile_id,
        title=title,
    )
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)
    return conversation


async def get_conversation(
    db: AsyncSession, conversation_id: uuid.UUID
) -> Conversation | None:
    result = await db.execute(
        select(Conversation)
        .options(selectinload(Conversation.messages))
        .where(Conversation.id == conversation_id)
    )
    return result.scalar_one_or_none()


async def list_conversations(
    db: AsyncSession, user_id: uuid.UUID
) -> list[Conversation]:
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == user_id)
        .order_by(Conversation.updated_at.desc())
    )
    return list(result.scalars().all())
