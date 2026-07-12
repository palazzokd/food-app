import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid


class Conversation(Base, TimestampMixin):
    __tablename__ = "conversations"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    family_profile_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("family_profiles.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str | None] = mapped_column(String(200))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    family_profile: Mapped["FamilyProfile"] = relationship(  # noqa: F821
        back_populates="conversations"
    )
    user: Mapped["User"] = relationship(back_populates="conversations")  # noqa: F821
    messages: Mapped[list["Message"]] = relationship(
        back_populates="conversation", cascade="all, delete-orphan", lazy="selectin",
        order_by="Message.created_at"
    )


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    conversation_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False
    )
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, default=dict)
    token_count: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    conversation: Mapped[Conversation] = relationship(back_populates="messages")


class LearnedPreference(Base, TimestampMixin):
    __tablename__ = "learned_preferences"
    __table_args__ = (
        UniqueConstraint("family_profile_id", "category", "preference_key"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    family_profile_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("family_profiles.id", ondelete="CASCADE"), nullable=False
    )
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    preference_key: Mapped[str] = mapped_column(String(200), nullable=False)
    preference_value: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=0.5)
    source_message_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("messages.id")
    )

    family_profile: Mapped["FamilyProfile"] = relationship(  # noqa: F821
        back_populates="learned_preferences"
    )
