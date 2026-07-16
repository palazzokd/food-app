import uuid
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_current_family_profile
from app.models.family import FamilyProfile
from app.schemas.nutrition import (
    NutritionCheckToggle,
    NutritionDayStatus,
    NutritionTargetCreate,
    NutritionTargetResponse,
    NutritionTargetUpdate,
    NutritionWeekResponse,
)
from app.services import nutrition_service
from app.services.meal_plan_service import current_week_monday

router = APIRouter()


async def _build_week(
    db: AsyncSession, profile_id: uuid.UUID, week_start: date
) -> NutritionWeekResponse:
    targets = await nutrition_service.list_targets(db, profile_id)
    checks = await nutrition_service.get_week_checks(db, profile_id, week_start)

    checks_by_day: dict[date, dict[str, "object"]] = {}
    for check in checks:
        checks_by_day.setdefault(check.date, {})[str(check.target_id)] = check

    days: list[NutritionDayStatus] = []
    for offset in range(7):
        day = week_start + timedelta(days=offset)
        day_checks = checks_by_day.get(day, {})
        days.append(
            NutritionDayStatus(
                date=day,
                hits={str(t.id): str(t.id) in day_checks for t in targets},
                notes={
                    tid: c.note
                    for tid, c in day_checks.items()
                    if getattr(c, "note", None)
                },
            )
        )

    return NutritionWeekResponse(
        week_start=week_start,
        targets=[NutritionTargetResponse.model_validate(t) for t in targets],
        days=days,
        targets_hit=len(checks),
        targets_possible=7 * len(targets),
    )


@router.get("/week", response_model=NutritionWeekResponse)
async def get_week(
    start: date | None = Query(default=None, description="Week start (Monday); defaults to current week"),
    profile: FamilyProfile = Depends(get_current_family_profile),
    db: AsyncSession = Depends(get_db),
):
    return await _build_week(db, profile.id, start or current_week_monday())


@router.put("/check", status_code=status.HTTP_204_NO_CONTENT)
async def toggle_check(
    data: NutritionCheckToggle,
    profile: FamilyProfile = Depends(get_current_family_profile),
    db: AsyncSession = Depends(get_db),
):
    ok = await nutrition_service.set_check(
        db, profile.id, data.target_id, data.date, data.hit, data.note
    )
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target not found")


@router.get("/targets", response_model=list[NutritionTargetResponse])
async def list_targets(
    profile: FamilyProfile = Depends(get_current_family_profile),
    db: AsyncSession = Depends(get_db),
):
    targets = await nutrition_service.list_targets(db, profile.id, include_inactive=True)
    return [NutritionTargetResponse.model_validate(t) for t in targets]


@router.post("/targets", response_model=NutritionTargetResponse, status_code=status.HTTP_201_CREATED)
async def create_target(
    data: NutritionTargetCreate,
    profile: FamilyProfile = Depends(get_current_family_profile),
    db: AsyncSession = Depends(get_db),
):
    existing = await nutrition_service.list_targets(db, profile.id, include_inactive=True)
    if any(t.name.lower() == data.name.strip().lower() for t in existing):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="A target with that name already exists"
        )
    data.name = data.name.strip()
    target = await nutrition_service.create_target(db, profile.id, data)
    return NutritionTargetResponse.model_validate(target)


@router.patch("/targets/{target_id}", response_model=NutritionTargetResponse)
async def update_target(
    target_id: uuid.UUID,
    data: NutritionTargetUpdate,
    profile: FamilyProfile = Depends(get_current_family_profile),
    db: AsyncSession = Depends(get_db),
):
    target = await nutrition_service.update_target(db, profile.id, target_id, data)
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target not found")
    return NutritionTargetResponse.model_validate(target)


@router.delete("/targets/{target_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_target(
    target_id: uuid.UUID,
    profile: FamilyProfile = Depends(get_current_family_profile),
    db: AsyncSession = Depends(get_db),
):
    deleted = await nutrition_service.delete_target(db, profile.id, target_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target not found")
