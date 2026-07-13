import enum
import uuid

from sqlalchemy import ARRAY, Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, generate_uuid


class MealType(str, enum.Enum):
    breakfast = "breakfast"
    lunch = "lunch"
    dinner = "dinner"
    snack = "snack"


class RecipeSource(str, enum.Enum):
    ai = "ai"
    manual = "manual"


class Recipe(Base, TimestampMixin):
    __tablename__ = "recipes"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    family_profile_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("family_profiles.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[MealType] = mapped_column(default=MealType.dinner)
    cuisine: Mapped[str | None] = mapped_column(String(50))
    protein: Mapped[str | None] = mapped_column(String(50))
    season: Mapped[str | None] = mapped_column(String(20))
    total_minutes: Mapped[int | None] = mapped_column(Integer)
    active_minutes: Mapped[int | None] = mapped_column(Integer)
    rating: Mapped[int | None] = mapped_column(Integer)
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False)
    nutrition_tags: Mapped[list[str]] = mapped_column(ARRAY(Text), default=list)
    ingredients: Mapped[list] = mapped_column(JSONB, default=list)
    instructions: Mapped[list] = mapped_column(JSONB, default=list)
    toddler_notes: Mapped[str | None] = mapped_column(Text)
    infant_notes: Mapped[str | None] = mapped_column(Text)
    night2_notes: Mapped[str | None] = mapped_column(Text)
    source: Mapped[RecipeSource] = mapped_column(default=RecipeSource.ai)
