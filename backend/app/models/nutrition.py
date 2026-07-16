import uuid
from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid

# Seeded for every new family; editable/removable afterwards
DEFAULT_TARGETS = [
    {"name": "Legumes", "emoji": "🫘", "description": "½ cup most days", "examples": "Black beans, chickpeas, lentils, edamame"},
    {"name": "Leafy Greens", "emoji": "🥬", "description": "1 serving daily", "examples": "Spinach, arugula, kale, romaine"},
    {"name": "Nuts & Seeds", "emoji": "🌰", "description": "Small handful most days", "examples": "Walnuts, pepitas, pine nuts, hemp, chia, flax"},
]


class NutritionTarget(Base, TimestampMixin):
    __tablename__ = "nutrition_targets"
    __table_args__ = (UniqueConstraint("family_profile_id", "name"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    family_profile_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("family_profiles.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(60), nullable=False)
    emoji: Mapped[str | None] = mapped_column(String(8))
    description: Mapped[str | None] = mapped_column(String(120))
    examples: Mapped[str | None] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    checks: Mapped[list["NutritionCheck"]] = relationship(
        back_populates="target", cascade="all, delete-orphan", lazy="selectin"
    )


class NutritionCheck(Base, TimestampMixin):
    __tablename__ = "nutrition_checks"
    __table_args__ = (UniqueConstraint("target_id", "date"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    target_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("nutrition_targets.id", ondelete="CASCADE"), nullable=False
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    note: Mapped[str | None] = mapped_column(Text)

    target: Mapped[NutritionTarget] = relationship(back_populates="checks")
