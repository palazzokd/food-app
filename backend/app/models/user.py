import uuid

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    supabase_auth_id: Mapped[uuid.UUID] = mapped_column(unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    display_name: Mapped[str | None] = mapped_column(String(100))

    family_profile: Mapped["FamilyProfile"] = relationship(  # noqa: F821
        back_populates="owner", lazy="selectin"
    )
    conversations: Mapped[list["Conversation"]] = relationship(  # noqa: F821
        back_populates="user", lazy="selectin"
    )
