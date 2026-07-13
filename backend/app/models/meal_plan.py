import uuid
from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid
from app.models.recipe import MealType


class MealPlan(Base, TimestampMixin):
    __tablename__ = "meal_plans"
    __table_args__ = (UniqueConstraint("family_profile_id", "week_start_date"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    family_profile_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("family_profiles.id", ondelete="CASCADE"), nullable=False
    )
    week_start_date: Mapped[date] = mapped_column(Date, nullable=False)
    title: Mapped[str | None] = mapped_column(String(100))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    entries: Mapped[list["MealPlanEntry"]] = relationship(
        back_populates="meal_plan", cascade="all, delete-orphan", lazy="selectin",
        order_by="MealPlanEntry.day_of_week"
    )


class MealPlanEntry(Base, TimestampMixin):
    __tablename__ = "meal_plan_entries"
    __table_args__ = (UniqueConstraint("meal_plan_id", "day_of_week", "meal_type"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    meal_plan_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("meal_plans.id", ondelete="CASCADE"), nullable=False
    )
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)  # 0=Mon..6=Sun
    meal_type: Mapped[MealType] = mapped_column(nullable=False)
    recipe_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("recipes.id", ondelete="SET NULL")
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)

    meal_plan: Mapped[MealPlan] = relationship(back_populates="entries")
