import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from supabase import Client, create_client

from app.config import settings
from app.models.user import User


def get_supabase_client() -> Client:
    return create_client(settings.supabase_url, settings.supabase_service_key)


async def register_user(
    db: AsyncSession, email: str, password: str, display_name: str | None = None
) -> dict:
    supabase = get_supabase_client()
    try:
        auth_response = supabase.auth.sign_up({"email": email, "password": password})
    except Exception as e:
        raise ValueError(str(e))

    if not auth_response.user:
        raise ValueError("Registration failed")

    user = User(
        supabase_auth_id=uuid.UUID(auth_response.user.id),
        email=email,
        display_name=display_name,
        trial_ends_at=datetime.now(timezone.utc) + timedelta(days=21),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return {
        "access_token": auth_response.session.access_token if auth_response.session else "",
        "refresh_token": auth_response.session.refresh_token if auth_response.session else "",
        "user": user,
    }


async def login_user(db: AsyncSession, email: str, password: str) -> dict:
    supabase = get_supabase_client()
    auth_response = supabase.auth.sign_in_with_password(
        {"email": email, "password": password}
    )

    if not auth_response.user:
        raise ValueError("Login failed")

    user = await get_user_by_supabase_id(db, uuid.UUID(auth_response.user.id))
    if not user:
        raise ValueError("User not found in local database")

    return {
        "access_token": auth_response.session.access_token,
        "refresh_token": auth_response.session.refresh_token,
        "user": user,
    }


async def get_user_by_supabase_id(
    db: AsyncSession, supabase_auth_id: uuid.UUID
) -> User | None:
    result = await db.execute(
        select(User).where(User.supabase_auth_id == supabase_auth_id)
    )
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: uuid.UUID) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def verify_token(token: str) -> dict:
    supabase = get_supabase_client()
    user_response = supabase.auth.get_user(token)
    if not user_response.user:
        raise ValueError("Invalid token")
    return {"supabase_auth_id": uuid.UUID(user_response.user.id)}
