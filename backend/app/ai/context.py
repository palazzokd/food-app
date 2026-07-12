from app.models.chat import Message


MAX_HISTORY_MESSAGES = 40  # Keep last 40 messages (20 exchanges)
APPROX_CHARS_PER_TOKEN = 4
MAX_CONTEXT_TOKENS = 16000  # Budget for input context


def build_messages_for_api(messages: list[Message]) -> list[dict]:
    api_messages = []
    for msg in messages:
        if msg.role in ("user", "assistant"):
            api_messages.append({"role": msg.role, "content": msg.content})
    return api_messages


def trim_conversation_history(
    messages: list[dict],
    system_prompt: str,
) -> list[dict]:
    system_tokens = len(system_prompt) // APPROX_CHARS_PER_TOKEN
    available_tokens = MAX_CONTEXT_TOKENS - system_tokens

    if not messages:
        return messages

    # Always keep the most recent messages that fit
    trimmed = []
    total_tokens = 0

    for msg in reversed(messages):
        msg_tokens = len(msg["content"]) // APPROX_CHARS_PER_TOKEN
        if total_tokens + msg_tokens > available_tokens and trimmed:
            break
        trimmed.append(msg)
        total_tokens += msg_tokens

    trimmed.reverse()

    # Ensure first message is from user (API requirement)
    while trimmed and trimmed[0]["role"] != "user":
        trimmed.pop(0)

    return trimmed
