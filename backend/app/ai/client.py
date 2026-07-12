from anthropic import Anthropic

from app.config import settings

_client: Anthropic | None = None


def get_anthropic_client() -> Anthropic:
    global _client
    if _client is None:
        _client = Anthropic(api_key=settings.anthropic_api_key)
    return _client
