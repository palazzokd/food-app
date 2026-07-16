import uuid
from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.nutrition import DEFAULT_TARGETS, NutritionCheck, NutritionTarget
from app.schemas.nutrition import NutritionTargetCreate, NutritionTargetUpdate


async def list_targets(
    db: AsyncSession, family_profile_id: uuid.UUID, include_inactive: bool = False
) -> list[NutritionTarget]:
    query = select(NutritionTarget).where(
        NutritionTarget.family_profile_id == family_profile_id
    )
    if not include_inactive:
        query = query.where(NutritionTarget.is_active == True)  # noqa: E712
    query = query.order_by(NutritionTarget.sort_order, NutritionTarget.created_at)
    result = await db.execute(query)
    return list(result.scalars().all())


async def seed_default_targets(
    db: AsyncSession, family_profile_id: uuid.UUID
) -> list[NutritionTarget]:
    """Give a new family the starter framework; they can edit or replace it."""
    existing = await list_targets(db, family_profile_id, include_inactive=True)
    if existing:
        return existing
    targets = [
        NutritionTarget(family_profile_id=family_profile_id, sort_order=i, **spec)
        for i, spec in enumerate(DEFAULT_TARGETS)
    ]
    db.add_all(targets)
    await db.commit()
    return await list_targets(db, family_profile_id, include_inactive=True)


async def create_target(
    db: AsyncSession, family_profile_id: uuid.UUID, data: NutritionTargetCreate
) -> NutritionTarget:
    existing = await list_targets(db, family_profile_id, include_inactive=True)
    target = NutritionTarget(
        family_profile_id=family_profile_id,
        sort_order=max((t.sort_order for t in existing), default=-1) + 1,
        **data.model_dump(),
    )
    db.add(target)
    await db.commit()
    await db.refresh(target)
    return target


async def get_target(
    db: AsyncSession, family_profile_id: uuid.UUID, target_id: uuid.UUID
) -> NutritionTarget | None:
    result = await db.execute(
        select(NutritionTarget).where(
            NutritionTarget.id == target_id,
            NutritionTarget.family_profile_id == family_profile_id,
        )
    )
    return result.scalar_one_or_none()


async def update_target(
    db: AsyncSession,
    family_profile_id: uuid.UUID,
    target_id: uuid.UUID,
    data: NutritionTargetUpdate,
) -> NutritionTarget | None:
    target = await get_target(db, family_profile_id, target_id)
    if not target:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(target, key, value)
    await db.commit()
    await db.refresh(target)
    return target


async def delete_target(
    db: AsyncSession, family_profile_id: uuid.UUID, target_id: uuid.UUID
) -> bool:
    target = await get_target(db, family_profile_id, target_id)
    if not target:
        return False
    await db.delete(target)
    await db.commit()
    return True


async def get_week_checks(
    db: AsyncSession, family_profile_id: uuid.UUID, week_start: date
) -> list[NutritionCheck]:
    week_end = week_start + timedelta(days=6)
    result = await db.execute(
        select(NutritionCheck)
        .join(NutritionTarget)
        .where(
            NutritionTarget.family_profile_id == family_profile_id,
            NutritionCheck.date >= week_start,
            NutritionCheck.date <= week_end,
        )
    )
    return list(result.scalars().all())


async def set_check(
    db: AsyncSession,
    family_profile_id: uuid.UUID,
    target_id: uuid.UUID,
    day: date,
    hit: bool,
    note: str | None = None,
) -> bool:
    """Set or clear a check; returns False if the target isn't this family's."""
    target = await get_target(db, family_profile_id, target_id)
    if not target:
        return False

    result = await db.execute(
        select(NutritionCheck).where(
            NutritionCheck.target_id == target_id, NutritionCheck.date == day
        )
    )
    check = result.scalar_one_or_none()

    if hit:
        if check:
            if note is not None:
                check.note = note
        else:
            db.add(NutritionCheck(target_id=target_id, date=day, note=note))
    elif check:
        await db.delete(check)

    await db.commit()
    return True
