from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_key: str = ""

    # Database
    database_url: str = "postgresql+asyncpg://postgres:password@localhost:5432/familyplate"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Anthropic
    anthropic_api_key: str = ""
    claude_model: str = "claude-sonnet-4-6"
    claude_max_tokens: int = 8192

    # App
    app_env: str = "development"
    api_base_url: str = "http://localhost:8000"
    cors_origins: list[str] = ["http://localhost:19006", "http://localhost:8081"]

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
