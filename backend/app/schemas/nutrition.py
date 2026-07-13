import uuid
from datetime import date

from pydantic import BaseModel


class NutritionDayUpdate(BaseModel):
    legumes: bool | None = None
    leafy_greens: bool | None = None
    nuts_seeds: bool | None = None
    source_note: str | None = None


class NutritionDayResponse(BaseModel):
    id: uuid.UUID
    date: date
    legumes: bool
    leafy_greens: bool
    nuts_seeds: bool
    source_note: str | None

    model_config = {"from_attributes": True}


class NutritionWeekResponse(BaseModel):
    week_start: date
    days: list[NutritionDayResponse]
    targets_hit: int
    targets_possible: int
