import uuid
from datetime import datetime

from pydantic import BaseModel


class ConversationCreate(BaseModel):
    title: str | None = None


class ConversationResponse(BaseModel):
    id: uuid.UUID
    title: str | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class MessageResponse(BaseModel):
    id: uuid.UUID
    role: str
    content: str
    metadata_: dict = {}
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationDetailResponse(BaseModel):
    id: uuid.UUID
    title: str | None
    is_active: bool
    messages: list[MessageResponse]
    created_at: datetime

    model_config = {"from_attributes": True}


class SendMessageRequest(BaseModel):
    content: str
