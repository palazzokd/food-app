import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    display_name: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: "UserResponse"


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    display_name: str | None
    plan: str = "trial"
    plan_status: str = "active"
    trial_ends_at: datetime | None = None

    model_config = {"from_attributes": True}


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str


class RefreshRequest(BaseModel):
    refresh_token: str
