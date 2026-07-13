import uuid
from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, generate_uuid


class NutritionDay(Base, TimestampMixin):
    __tablename__ = "nutrition_days"
    __table_args__ = (UniqueConstraint("family_profile_id", "date"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    family_profile_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("family_profiles.id", ondelete="CASCADE"), nullable=False
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    legumes: Mapped[bool] = mapped_column(Boolean, default=False)
    leafy_greens: Mapped[bool] = mapped_column(Boolean, default=False)
    nuts_seeds: Mapped[bool] = mapped_column(Boolean, default=False)
    source_note: Mapped[str | None] = mapped_column(Text)
