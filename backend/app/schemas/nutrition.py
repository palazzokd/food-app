import uuid
from datetime import date

from pydantic import BaseModel


class NutritionTargetCreate(BaseModel):
    name: str
    emoji: str | None = None
    description: str | None = None
    examples: str | None = None


class NutritionTargetUpdate(BaseModel):
    name: str | None = None
    emoji: str | None = None
    description: str | None = None
    examples: str | None = None
    sort_order: int | None = None
    is_active: bool | None = None


class NutritionTargetResponse(BaseModel):
    id: uuid.UUID
    name: str
    emoji: str | None
    description: str | None
    examples: str | None
    sort_order: int
    is_active: bool

    model_config = {"from_attributes": True}


class NutritionDayStatus(BaseModel):
    date: date
    hits: dict[str, bool]  # target_id (str) -> hit
    notes: dict[str, str]  # target_id (str) -> note


class NutritionWeekResponse(BaseModel):
    week_start: date
    targets: list[NutritionTargetResponse]
    days: list[NutritionDayStatus]
    targets_hit: int
    targets_possible: int


class NutritionCheckToggle(BaseModel):
    target_id: uuid.UUID
    date: date
    hit: bool
    note: str | None = None
