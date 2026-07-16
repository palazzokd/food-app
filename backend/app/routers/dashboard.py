from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_current_family_profile, get_current_user
from app.models.family import FamilyProfile
from app.models.recipe import Recipe
from app.models.user import User
from app.schemas.grocery import GroceryListResponse
from app.schemas.meal_plan import MealPlanResponse
from app.services import grocery_service, meal_plan_service, nutrition_service
from app.services.meal_plan_service import current_week_monday

router = APIRouter()


@router.get("")
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    profile: FamilyProfile = Depends(get_current_family_profile),
    db: AsyncSession = Depends(get_db),
):
    recipe_count = (
        await db.execute(
            select(func.count()).select_from(Recipe).where(
                Recipe.family_profile_id == profile.id
            )
        )
    ).scalar_one()
    favorite_count = (
        await db.execute(
            select(func.count()).select_from(Recipe).where(
                Recipe.family_profile_id == profile.id,
                Recipe.is_favorite == True,  # noqa: E712
            )
        )
    ).scalar_one()

    plan = await meal_plan_service.get_current_meal_plan(db, profile.id)
    grocery_list = await grocery_service.get_active_list(db, profile.id)

    from app.routers.nutrition import _build_week

    week_start = current_week_monday()
    nutrition_week = await _build_week(db, profile.id, week_start)

    trial_days_left = None
    if current_user.plan == "trial" and current_user.trial_ends_at:
        remaining = current_user.trial_ends_at - datetime.now(timezone.utc)
        trial_days_left = max(0, remaining.days)

    return {
        "recipe_count": recipe_count,
        "favorite_count": favorite_count,
        "meal_plan": MealPlanResponse.model_validate(plan) if plan else None,
        "grocery_list": (
            GroceryListResponse.model_validate(grocery_list) if grocery_list else None
        ),
        "nutrition": nutrition_week,
        "plan": current_user.plan,
        "trial_days_left": trial_days_left,
    }
