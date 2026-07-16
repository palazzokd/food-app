import json
import uuid
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.client import get_anthropic_client
from app.ai.context import build_messages_for_api, trim_conversation_history
from app.ai.prompts import build_onboarding_prompt, build_system_prompt
from app.ai.tool_handlers import handle_tool_call
from app.ai.tools import TOOL_DEFINITIONS
from app.config import settings
from app.models.chat import Conversation, LearnedPreference, Message
from app.models.family import FamilyProfile
from app.services import family_service


async def process_message(
    user_message: str,
    conversation: Conversation,
    db: AsyncSession,
    user_id: uuid.UUID,
    is_onboarding: bool = False,
) -> AsyncGenerator[dict, None]:
    """Process a user message and yield response events for WebSocket streaming."""

    # Save user message
    user_msg = Message(
        conversation_id=conversation.id,
        role="user",
        content=user_message,
    )
    db.add(user_msg)
    await db.commit()

    # Build context
    profile = await family_service.get_family_profile(db, user_id)
    family_profile_id = profile.id if profile else None

    if is_onboarding:
        system_prompt = build_onboarding_prompt()
    else:
        from app.services import nutrition_service

        learned_prefs = list(profile.learned_preferences) if profile else []
        targets = (
            await nutrition_service.list_targets(db, profile.id) if profile else []
        )
        system_prompt = build_system_prompt(profile, learned_prefs, targets)

    # Build message history
    api_messages = build_messages_for_api(list(conversation.messages))
    api_messages = trim_conversation_history(api_messages, system_prompt)

    # Ensure the new user message is included
    if not api_messages or api_messages[-1]["content"] != user_message:
        api_messages.append({"role": "user", "content": user_message})

    client = get_anthropic_client()
    max_tool_rounds = 10

    # Collect text across ALL tool rounds so the persisted assistant message
    # matches what the user actually saw streamed
    round_texts: list[str] = []

    for _ in range(max_tool_rounds):
        # Call Claude
        response = await client.messages.create(
            model=settings.claude_model,
            max_tokens=settings.claude_max_tokens,
            system=system_prompt,
            messages=api_messages,
            tools=TOOL_DEFINITIONS,
        )

        # Process response content blocks
        assistant_text_parts = []
        tool_uses = []

        for block in response.content:
            if block.type == "text":
                assistant_text_parts.append(block.text)
                yield {"type": "stream_chunk", "content": block.text}
            elif block.type == "tool_use":
                tool_uses.append(block)

        if assistant_text_parts:
            round_texts.append("".join(assistant_text_parts))

        # If there are tool uses, handle them
        if tool_uses:
            # Build the full assistant message content for the API
            assistant_content = []
            for block in response.content:
                if block.type == "text":
                    assistant_content.append({"type": "text", "text": block.text})
                elif block.type == "tool_use":
                    assistant_content.append({
                        "type": "tool_use",
                        "id": block.id,
                        "name": block.name,
                        "input": block.input,
                    })

            api_messages.append({"role": "assistant", "content": assistant_content})

            # Execute tools and build tool results
            tool_results = []
            for tool_use in tool_uses:
                yield {"type": "tool_status", "tool": tool_use.name, "status": "executing"}

                result = await handle_tool_call(
                    tool_use.name,
                    tool_use.input,
                    db=db,
                    user_id=user_id,
                    family_profile_id=family_profile_id,
                )

                # If it's a quiz_options result, yield it to the client
                if result.get("type") == "quiz_options":
                    yield {
                        "type": "quiz_options",
                        "question": result["question"],
                        "options": result["options"],
                        "allow_multiple": result.get("allow_multiple", False),
                    }
                elif result.get("type") in (
                    "recipe_saved",
                    "meal_plan_saved",
                    "grocery_list_saved",
                    "nutrition_logged",
                ):
                    # Tell the mobile app content was saved so it can refetch
                    # and render an inline card in the chat
                    yield {
                        "type": "content_saved",
                        "content_type": result["type"],
                        "data": result,
                    }

                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": tool_use.id,
                    "content": json.dumps(result),
                })

            api_messages.append({"role": "user", "content": tool_results})

            # If stop_reason is tool_use, continue the loop to get Claude's follow-up
            if response.stop_reason == "tool_use":
                continue

        # Save assistant message (all rounds' text, in order)
        full_text = "\n\n".join(round_texts)
        if full_text:
            assistant_msg = Message(
                conversation_id=conversation.id,
                role="assistant",
                content=full_text,
            )
            db.add(assistant_msg)
            await db.commit()

        yield {"type": "stream_end"}
        return

    # If we exhausted tool rounds, end gracefully
    yield {"type": "stream_end"}
