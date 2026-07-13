import uuid
from datetime import date, datetime

from pydantic import BaseModel

from app.models.recipe import MealType


class MealPlanEntryCreate(BaseModel):
    day_of_week: int  # 0=Mon..6=Sun
    meal_type: MealType
    title: str
    recipe_id: uuid.UUID | None = None
    notes: str | None = None


class MealPlanEntryResponse(BaseModel):
    id: uuid.UUID
    day_of_week: int
    meal_type: MealType
    recipe_id: uuid.UUID | None
    title: str
    notes: str | None

    model_config = {"from_attributes": True}


class MealPlanCreate(BaseModel):
    week_start_date: date
    title: str | None = None
    entries: list[MealPlanEntryCreate] = []


class MealPlanResponse(BaseModel):
    id: uuid.UUID
    week_start_date: date
    title: str | None
    is_active: bool
    entries: list[MealPlanEntryResponse]
    created_at: datetime

    model_config = {"from_attributes": True}
