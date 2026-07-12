import enum
import uuid

from sqlalchemy import ARRAY, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid


class MemberRole(str, enum.Enum):
    adult = "adult"
    toddler = "toddler"
    infant = "infant"


class NutritionalStage(str, enum.Enum):
    adult = "adult"
    palate_expansion = "palate_expansion"
    allergen_introduction = "allergen_introduction"


class FamilyProfile(Base, TimestampMixin):
    __tablename__ = "family_profiles"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    owner_user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    household_name: Mapped[str | None] = mapped_column(String(100))
    max_prep_minutes: Mapped[int] = mapped_column(Integer, default=30)
    planning_horizon_days: Mapped[int] = mapped_column(Integer, default=4)
    dinners_per_cycle: Mapped[int] = mapped_column(Integer, default=2)
    nights_per_dinner: Mapped[int] = mapped_column(Integer, default=2)
    batch_prep_day: Mapped[str] = mapped_column(String(10), default="sunday")

    owner: Mapped["User"] = relationship(back_populates="family_profile")  # noqa: F821
    members: Mapped[list["HouseholdMember"]] = relationship(
        back_populates="family_profile", cascade="all, delete-orphan", lazy="selectin"
    )
    conversations: Mapped[list["Conversation"]] = relationship(  # noqa: F821
        back_populates="family_profile", lazy="selectin"
    )
    learned_preferences: Mapped[list["LearnedPreference"]] = relationship(  # noqa: F821
        back_populates="family_profile", cascade="all, delete-orphan", lazy="selectin"
    )


class HouseholdMember(Base, TimestampMixin):
    __tablename__ = "household_members"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    family_profile_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("family_profiles.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    age_months: Mapped[int | None] = mapped_column(Integer)
    role: Mapped[MemberRole] = mapped_column(default=MemberRole.adult)
    nutritional_stage: Mapped[NutritionalStage] = mapped_column(
        default=NutritionalStage.adult
    )
    dietary_restrictions: Mapped[list[str]] = mapped_column(
        ARRAY(Text), default=list
    )
    flavor_preferences: Mapped[list[str]] = mapped_column(
        ARRAY(Text), default=list
    )
    texture_preferences: Mapped[list[str]] = mapped_column(
        ARRAY(Text), default=list
    )
    allergens_introduced: Mapped[list[str]] = mapped_column(
        ARRAY(Text), default=list
    )

    family_profile: Mapped[FamilyProfile] = relationship(back_populates="members")
