import uuid

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.grocery import GroceryItem, GroceryList
from app.schemas.grocery import GroceryItemCreate, GroceryItemUpdate, GroceryListCreate


async def get_active_list(
    db: AsyncSession, family_profile_id: uuid.UUID
) -> GroceryList | None:
    result = await db.execute(
        select(GroceryList)
        .where(
            GroceryList.family_profile_id == family_profile_id,
            GroceryList.is_active == True,  # noqa: E712
        )
        .order_by(GroceryList.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def get_list(
    db: AsyncSession, family_profile_id: uuid.UUID, list_id: uuid.UUID
) -> GroceryList | None:
    result = await db.execute(
        select(GroceryList).where(
            GroceryList.id == list_id,
            GroceryList.family_profile_id == family_profile_id,
        )
    )
    return result.scalar_one_or_none()


async def create_list(
    db: AsyncSession, family_profile_id: uuid.UUID, data: GroceryListCreate
) -> GroceryList:
    """Create a new active list; previous active lists are deactivated."""
    await db.execute(
        update(GroceryList)
        .where(
            GroceryList.family_profile_id == family_profile_id,
            GroceryList.is_active == True,  # noqa: E712
        )
        .values(is_active=False)
    )
    grocery_list = GroceryList(
        family_profile_id=family_profile_id,
        title=data.title,
        strategy_note=data.strategy_note,
        meal_plan_id=data.meal_plan_id,
    )
    db.add(grocery_list)
    await db.flush()
    for i, item in enumerate(data.items):
        payload = item.model_dump()
        if not payload.get("sort_order"):
            payload["sort_order"] = i
        db.add(GroceryItem(grocery_list_id=grocery_list.id, **payload))
    await db.commit()
    await db.refresh(grocery_list)
    return grocery_list


async def add_items(
    db: AsyncSession, grocery_list: GroceryList, items: list[GroceryItemCreate]
) -> GroceryList:
    base_order = max((i.sort_order for i in grocery_list.items), default=0) + 1
    for offset, item in enumerate(items):
        payload = item.model_dump()
        if not payload.get("sort_order"):
            payload["sort_order"] = base_order + offset
        db.add(GroceryItem(grocery_list_id=grocery_list.id, **payload))
    await db.commit()
    await db.refresh(grocery_list)
    return grocery_list


async def update_item(
    db: AsyncSession,
    family_profile_id: uuid.UUID,
    item_id: uuid.UUID,
    data: GroceryItemUpdate,
) -> GroceryItem | None:
    result = await db.execute(
        select(GroceryItem)
        .join(GroceryList)
        .where(
            GroceryItem.id == item_id,
            GroceryList.family_profile_id == family_profile_id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    await db.commit()
    await db.refresh(item)
    return item


async def remove_item(
    db: AsyncSession, family_profile_id: uuid.UUID, item_id: uuid.UUID
) -> bool:
    result = await db.execute(
        select(GroceryItem)
        .join(GroceryList)
        .where(
            GroceryItem.id == item_id,
            GroceryList.family_profile_id == family_profile_id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        return False
    await db.delete(item)
    await db.commit()
    return True
