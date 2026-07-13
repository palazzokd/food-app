import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.recipe import MealType, Recipe
from app.schemas.recipe import RecipeCreate, RecipeUpdate


async def create_recipe(
    db: AsyncSession, family_profile_id: uuid.UUID, data: RecipeCreate
) -> Recipe:
    payload = data.model_dump(mode="json")
    recipe = Recipe(family_profile_id=family_profile_id, **payload)
    db.add(recipe)
    await db.commit()
    await db.refresh(recipe)
    return recipe


async def get_recipe(
    db: AsyncSession, family_profile_id: uuid.UUID, recipe_id: uuid.UUID
) -> Recipe | None:
    result = await db.execute(
        select(Recipe).where(
            Recipe.id == recipe_id, Recipe.family_profile_id == family_profile_id
        )
    )
    return result.scalar_one_or_none()


async def list_recipes(
    db: AsyncSession,
    family_profile_id: uuid.UUID,
    category: MealType | None = None,
    favorite: bool | None = None,
    search: str | None = None,
) -> list[Recipe]:
    query = select(Recipe).where(Recipe.family_profile_id == family_profile_id)
    if category:
        query = query.where(Recipe.category == category)
    if favorite is not None:
        query = query.where(Recipe.is_favorite == favorite)
    if search:
        query = query.where(Recipe.title.ilike(f"%{search}%"))
    query = query.order_by(Recipe.created_at.desc())
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_recipe(
    db: AsyncSession,
    family_profile_id: uuid.UUID,
    recipe_id: uuid.UUID,
    data: RecipeUpdate,
) -> Recipe | None:
    recipe = await get_recipe(db, family_profile_id, recipe_id)
    if not recipe:
        return None
    for key, value in data.model_dump(mode="json", exclude_unset=True).items():
        setattr(recipe, key, value)
    await db.commit()
    await db.refresh(recipe)
    return recipe


async def delete_recipe(
    db: AsyncSession, family_profile_id: uuid.UUID, recipe_id: uuid.UUID
) -> bool:
    recipe = await get_recipe(db, family_profile_id, recipe_id)
    if not recipe:
        return False
    await db.delete(recipe)
    await db.commit()
    return True
