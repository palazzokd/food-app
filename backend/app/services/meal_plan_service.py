import uuid
from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.meal_plan import MealPlan, MealPlanEntry
from app.schemas.meal_plan import MealPlanCreate, MealPlanEntryCreate


def current_week_monday(today: date | None = None) -> date:
    today = today or date.today()
    return today - timedelta(days=today.weekday())


async def get_meal_plan_by_week(
    db: AsyncSession, family_profile_id: uuid.UUID, week_start_date: date
) -> MealPlan | None:
    result = await db.execute(
        select(MealPlan).where(
            MealPlan.family_profile_id == family_profile_id,
            MealPlan.week_start_date == week_start_date,
        )
    )
    return result.scalar_one_or_none()


async def get_current_meal_plan(
    db: AsyncSession, family_profile_id: uuid.UUID
) -> MealPlan | None:
    return await get_meal_plan_by_week(db, family_profile_id, current_week_monday())


async def upsert_meal_plan(
    db: AsyncSession, family_profile_id: uuid.UUID, data: MealPlanCreate
) -> MealPlan:
    """Create the week's plan, or replace its entries if it already exists."""
    plan = await get_meal_plan_by_week(db, family_profile_id, data.week_start_date)
    if plan:
        plan.title = data.title or plan.title
        for entry in list(plan.entries):
            await db.delete(entry)
        await db.flush()
    else:
        plan = MealPlan(
            family_profile_id=family_profile_id,
            week_start_date=data.week_start_date,
            title=data.title,
        )
        db.add(plan)
        await db.flush()

    for entry_data in data.entries:
        db.add(MealPlanEntry(meal_plan_id=plan.id, **entry_data.model_dump()))

    await db.commit()
    await db.refresh(plan)
    return plan


async def upsert_entry(
    db: AsyncSession, plan: MealPlan, data: MealPlanEntryCreate
) -> MealPlanEntry:
    result = await db.execute(
        select(MealPlanEntry).where(
            MealPlanEntry.meal_plan_id == plan.id,
            MealPlanEntry.day_of_week == data.day_of_week,
            MealPlanEntry.meal_type == data.meal_type,
        )
    )
    entry = result.scalar_one_or_none()
    if entry:
        entry.title = data.title
        entry.recipe_id = data.recipe_id
        entry.notes = data.notes
    else:
        entry = MealPlanEntry(meal_plan_id=plan.id, **data.model_dump())
        db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


async def delete_entry(
    db: AsyncSession, plan: MealPlan, entry_id: uuid.UUID
) -> bool:
    result = await db.execute(
        select(MealPlanEntry).where(
            MealPlanEntry.id == entry_id, MealPlanEntry.meal_plan_id == plan.id
        )
    )
    entry = result.scalar_one_or_none()
    if not entry:
        return False
    await db.delete(entry)
    await db.commit()
    return True
