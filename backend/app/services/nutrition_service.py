import uuid
from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.nutrition import NutritionDay
from app.schemas.nutrition import NutritionDayUpdate


async def get_week(
    db: AsyncSession, family_profile_id: uuid.UUID, week_start: date
) -> list[NutritionDay]:
    week_end = week_start + timedelta(days=6)
    result = await db.execute(
        select(NutritionDay)
        .where(
            NutritionDay.family_profile_id == family_profile_id,
            NutritionDay.date >= week_start,
            NutritionDay.date <= week_end,
        )
        .order_by(NutritionDay.date)
    )
    return list(result.scalars().all())


async def upsert_day(
    db: AsyncSession,
    family_profile_id: uuid.UUID,
    day: date,
    data: NutritionDayUpdate,
) -> NutritionDay:
    result = await db.execute(
        select(NutritionDay).where(
            NutritionDay.family_profile_id == family_profile_id,
            NutritionDay.date == day,
        )
    )
    record = result.scalar_one_or_none()
    if not record:
        record = NutritionDay(family_profile_id=family_profile_id, date=day)
        db.add(record)
    for key, value in data.model_dump(exclude_unset=True).items():
        if value is not None or key == "source_note":
            setattr(record, key, value)
    await db.commit()
    await db.refresh(record)
    return record
