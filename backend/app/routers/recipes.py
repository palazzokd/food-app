import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_current_family_profile
from app.models.family import FamilyProfile
from app.models.recipe import MealType
from app.schemas.recipe import (
    RecipeCreate,
    RecipeResponse,
    RecipeSummary,
    RecipeUpdate,
    TrustedSourceCreate,
    TrustedSourceResponse,
    TrustedSourceUpdate,
)
from app.services import recipe_service

router = APIRouter()


@router.get("", response_model=list[RecipeSummary])
async def list_recipes(
    category: MealType | None = None,
    favorite: bool | None = None,
    search: str | None = None,
    profile: FamilyProfile = Depends(get_current_family_profile),
    db: AsyncSession = Depends(get_db),
):
    recipes = await recipe_service.list_recipes(
        db, profile.id, category=category, favorite=favorite, search=search
    )
    return [RecipeSummary.model_validate(r) for r in recipes]


@router.post("", response_model=RecipeResponse, status_code=status.HTTP_201_CREATED)
async def create_recipe(
    data: RecipeCreate,
    profile: FamilyProfile = Depends(get_current_family_profile),
    db: AsyncSession = Depends(get_db),
):
    recipe = await recipe_service.create_recipe(db, profile.id, data)
    return RecipeResponse.model_validate(recipe)


@router.get("/sources", response_model=list[TrustedSourceResponse])
async def list_sources(
    profile: FamilyProfile = Depends(get_current_family_profile),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select

    from app.models.recipe import TrustedSource

    result = await db.execute(
        select(TrustedSource)
        .where(TrustedSource.family_profile_id == profile.id)
        .order_by(TrustedSource.created_at)
    )
    return [TrustedSourceResponse.model_validate(s) for s in result.scalars().all()]


@router.post("/sources", response_model=TrustedSourceResponse, status_code=status.HTTP_201_CREATED)
async def create_source(
    data: TrustedSourceCreate,
    profile: FamilyProfile = Depends(get_current_family_profile),
    db: AsyncSession = Depends(get_db),
):
    from app.models.recipe import TrustedSource

    source = TrustedSource(family_profile_id=profile.id, **data.model_dump())
    db.add(source)
    try:
        await db.commit()
    except Exception:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="That site is already saved"
        )
    await db.refresh(source)
    return TrustedSourceResponse.model_validate(source)


@router.patch("/sources/{source_id}", response_model=TrustedSourceResponse)
async def update_source(
    source_id: uuid.UUID,
    data: TrustedSourceUpdate,
    profile: FamilyProfile = Depends(get_current_family_profile),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select

    from app.models.recipe import TrustedSource

    result = await db.execute(
        select(TrustedSource).where(
            TrustedSource.id == source_id,
            TrustedSource.family_profile_id == profile.id,
        )
    )
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(source, key, value)
    await db.commit()
    await db.refresh(source)
    return TrustedSourceResponse.model_validate(source)


@router.delete("/sources/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_source(
    source_id: uuid.UUID,
    profile: FamilyProfile = Depends(get_current_family_profile),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select

    from app.models.recipe import TrustedSource

    result = await db.execute(
        select(TrustedSource).where(
            TrustedSource.id == source_id,
            TrustedSource.family_profile_id == profile.id,
        )
    )
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found")
    await db.delete(source)
    await db.commit()


@router.get("/{recipe_id}", response_model=RecipeResponse)
async def get_recipe(
    recipe_id: uuid.UUID,
    profile: FamilyProfile = Depends(get_current_family_profile),
    db: AsyncSession = Depends(get_db),
):
    recipe = await recipe_service.get_recipe(db, profile.id, recipe_id)
    if not recipe:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")
    return RecipeResponse.model_validate(recipe)


@router.patch("/{recipe_id}", response_model=RecipeResponse)
async def update_recipe(
    recipe_id: uuid.UUID,
    data: RecipeUpdate,
    profile: FamilyProfile = Depends(get_current_family_profile),
    db: AsyncSession = Depends(get_db),
):
    recipe = await recipe_service.update_recipe(db, profile.id, recipe_id, data)
    if not recipe:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")
    return RecipeResponse.model_validate(recipe)


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recipe(
    recipe_id: uuid.UUID,
    profile: FamilyProfile = Depends(get_current_family_profile),
    db: AsyncSession = Depends(get_db),
):
    deleted = await recipe_service.delete_recipe(db, profile.id, recipe_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")


@router.get("/{recipe_id}/pdf")
async def recipe_pdf(
    recipe_id: uuid.UUID,
    profile: FamilyProfile = Depends(get_current_family_profile),
    db: AsyncSession = Depends(get_db),
):
    recipe = await recipe_service.get_recipe(db, profile.id, recipe_id)
    if not recipe:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")

    from app.services.pdf_service import render_recipe_pdf

    pdf_bytes = render_recipe_pdf(recipe)
    filename = recipe.title.replace(" ", "_")[:60]
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}.pdf"'},
    )
