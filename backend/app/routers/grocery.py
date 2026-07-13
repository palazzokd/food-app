import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_current_family_profile
from app.models.family import FamilyProfile
from app.schemas.grocery import (
    GroceryItemCreate,
    GroceryItemResponse,
    GroceryItemUpdate,
    GroceryListCreate,
    GroceryListResponse,
)
from app.services import grocery_service

router = APIRouter()


@router.get("/current", response_model=GroceryListResponse)
async def get_current_list(
    profile: FamilyProfile = Depends(get_current_family_profile),
    db: AsyncSession = Depends(get_db),
):
    grocery_list = await grocery_service.get_active_list(db, profile.id)
    if not grocery_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No active grocery list"
        )
    return GroceryListResponse.model_validate(grocery_list)


@router.post("", response_model=GroceryListResponse, status_code=status.HTTP_201_CREATED)
async def create_list(
    data: GroceryListCreate,
    profile: FamilyProfile = Depends(get_current_family_profile),
    db: AsyncSession = Depends(get_db),
):
    grocery_list = await grocery_service.create_list(db, profile.id, data)
    return GroceryListResponse.model_validate(grocery_list)


@router.post("/{list_id}/items", response_model=GroceryListResponse)
async def add_items(
    list_id: uuid.UUID,
    items: list[GroceryItemCreate],
    profile: FamilyProfile = Depends(get_current_family_profile),
    db: AsyncSession = Depends(get_db),
):
    grocery_list = await grocery_service.get_list(db, profile.id, list_id)
    if not grocery_list:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="List not found")
    grocery_list = await grocery_service.add_items(db, grocery_list, items)
    return GroceryListResponse.model_validate(grocery_list)


@router.patch("/items/{item_id}", response_model=GroceryItemResponse)
async def update_item(
    item_id: uuid.UUID,
    data: GroceryItemUpdate,
    profile: FamilyProfile = Depends(get_current_family_profile),
    db: AsyncSession = Depends(get_db),
):
    item = await grocery_service.update_item(db, profile.id, item_id, data)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    return GroceryItemResponse.model_validate(item)


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_item(
    item_id: uuid.UUID,
    profile: FamilyProfile = Depends(get_current_family_profile),
    db: AsyncSession = Depends(get_db),
):
    removed = await grocery_service.remove_item(db, profile.id, item_id)
    if not removed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")


@router.get("/{list_id}/pdf")
async def grocery_pdf(
    list_id: uuid.UUID,
    profile: FamilyProfile = Depends(get_current_family_profile),
    db: AsyncSession = Depends(get_db),
):
    grocery_list = await grocery_service.get_list(db, profile.id, list_id)
    if not grocery_list:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="List not found")

    from app.services.pdf_service import render_grocery_pdf

    pdf_bytes = render_grocery_pdf(grocery_list)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="grocery_list.pdf"'},
    )
