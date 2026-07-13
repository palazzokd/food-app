from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_current_family_profile
from app.models.family import FamilyProfile
from app.schemas.nutrition import (
    NutritionDayResponse,
    NutritionDayUpdate,
    NutritionWeekResponse,
)
from app.services import nutrition_service
from app.services.meal_plan_service import current_week_monday

router = APIRouter()


@router.get("/week", response_model=NutritionWeekResponse)
async def get_week(
    start: date | None = Query(default=None, description="Week start (Monday); defaults to current week"),
    profile: FamilyProfile = Depends(get_current_family_profile),
    db: AsyncSession = Depends(get_db),
):
    week_start = start or current_week_monday()
    days = await nutrition_service.get_week(db, profile.id, week_start)
    targets_hit = sum(
        int(d.legumes) + int(d.leafy_greens) + int(d.nuts_seeds) for d in days
    )
    return NutritionWeekResponse(
        week_start=week_start,
        days=[NutritionDayResponse.model_validate(d) for d in days],
        targets_hit=targets_hit,
        targets_possible=7 * 3,
    )


@router.put("/{day}", response_model=NutritionDayResponse)
async def upsert_day(
    day: date,
    data: NutritionDayUpdate,
    profile: FamilyProfile = Depends(get_current_family_profile),
    db: AsyncSession = Depends(get_db),
):
    record = await nutrition_service.upsert_day(db, profile.id, day, data)
    return NutritionDayResponse.model_validate(record)
