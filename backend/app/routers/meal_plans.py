import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_current_family_profile
from app.models.family import FamilyProfile
from app.schemas.meal_plan import (
    MealPlanCreate,
    MealPlanEntryCreate,
    MealPlanEntryResponse,
    MealPlanResponse,
)
from app.services import meal_plan_service

router = APIRouter()


@router.get("/current", response_model=MealPlanResponse)
async def get_current_plan(
    profile: FamilyProfile = Depends(get_current_family_profile),
    db: AsyncSession = Depends(get_db),
):
    plan = await meal_plan_service.get_current_meal_plan(db, profile.id)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No meal plan for this week"
        )
    return MealPlanResponse.model_validate(plan)


@router.get("/week/{week_start}", response_model=MealPlanResponse)
async def get_plan_by_week(
    week_start: date,
    profile: FamilyProfile = Depends(get_current_family_profile),
    db: AsyncSession = Depends(get_db),
):
    plan = await meal_plan_service.get_meal_plan_by_week(db, profile.id, week_start)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No meal plan for that week"
        )
    return MealPlanResponse.model_validate(plan)


@router.put("", response_model=MealPlanResponse)
async def upsert_plan(
    data: MealPlanCreate,
    profile: FamilyProfile = Depends(get_current_family_profile),
    db: AsyncSession = Depends(get_db),
):
    plan = await meal_plan_service.upsert_meal_plan(db, profile.id, data)
    return MealPlanResponse.model_validate(plan)


@router.put("/{plan_id}/entries", response_model=MealPlanEntryResponse)
async def upsert_entry(
    plan_id: uuid.UUID,
    data: MealPlanEntryCreate,
    profile: FamilyProfile = Depends(get_current_family_profile),
    db: AsyncSession = Depends(get_db),
):
    plan = await meal_plan_service.get_meal_plan_by_week(
        db, profile.id, meal_plan_service.current_week_monday()
    )
    if not plan or plan.id != plan_id:
        from sqlalchemy import select

        from app.models.meal_plan import MealPlan

        result = await db.execute(
            select(MealPlan).where(
                MealPlan.id == plan_id, MealPlan.family_profile_id == profile.id
            )
        )
        plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meal plan not found")
    entry = await meal_plan_service.upsert_entry(db, plan, data)
    return MealPlanEntryResponse.model_validate(entry)
