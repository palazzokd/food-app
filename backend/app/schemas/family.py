import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.family import MemberRole, NutritionalStage


class HouseholdMemberCreate(BaseModel):
    name: str
    age_months: int | None = None
    role: MemberRole = MemberRole.adult
    nutritional_stage: NutritionalStage = NutritionalStage.adult
    dietary_restrictions: list[str] = []
    flavor_preferences: list[str] = []
    texture_preferences: list[str] = []
    allergens_introduced: list[str] = []


class HouseholdMemberUpdate(BaseModel):
    name: str | None = None
    age_months: int | None = None
    role: MemberRole | None = None
    nutritional_stage: NutritionalStage | None = None
    dietary_restrictions: list[str] | None = None
    flavor_preferences: list[str] | None = None
    texture_preferences: list[str] | None = None
    allergens_introduced: list[str] | None = None


class HouseholdMemberResponse(BaseModel):
    id: uuid.UUID
    name: str
    age_months: int | None
    role: MemberRole
    nutritional_stage: NutritionalStage
    dietary_restrictions: list[str]
    flavor_preferences: list[str]
    texture_preferences: list[str]
    allergens_introduced: list[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class FamilyProfileCreate(BaseModel):
    household_name: str | None = None
    max_prep_minutes: int = 30
    planning_horizon_days: int = 4
    dinners_per_cycle: int = 2
    nights_per_dinner: int = 2
    batch_prep_day: str = "sunday"


class FamilyProfileUpdate(BaseModel):
    household_name: str | None = None
    max_prep_minutes: int | None = None
    planning_horizon_days: int | None = None
    dinners_per_cycle: int | None = None
    nights_per_dinner: int | None = None
    batch_prep_day: str | None = None


class FamilyProfileResponse(BaseModel):
    id: uuid.UUID
    household_name: str | None
    max_prep_minutes: int
    planning_horizon_days: int
    dinners_per_cycle: int
    nights_per_dinner: int
    batch_prep_day: str
    members: list[HouseholdMemberResponse]
    created_at: datetime

    model_config = {"from_attributes": True}
