import uuid
from datetime import datetime

from pydantic import BaseModel


class GroceryItemCreate(BaseModel):
    name: str
    quantity: str | None = None
    store: str | None = None
    deal_note: str | None = None
    sort_order: int = 0


class GroceryItemUpdate(BaseModel):
    name: str | None = None
    quantity: str | None = None
    store: str | None = None
    deal_note: str | None = None
    is_checked: bool | None = None
    sort_order: int | None = None


class GroceryItemResponse(BaseModel):
    id: uuid.UUID
    name: str
    quantity: str | None
    store: str | None
    deal_note: str | None
    is_checked: bool
    sort_order: int

    model_config = {"from_attributes": True}


class GroceryListCreate(BaseModel):
    title: str | None = None
    strategy_note: str | None = None
    meal_plan_id: uuid.UUID | None = None
    items: list[GroceryItemCreate] = []


class GroceryListResponse(BaseModel):
    id: uuid.UUID
    meal_plan_id: uuid.UUID | None
    title: str | None
    strategy_note: str | None
    is_active: bool
    items: list[GroceryItemResponse]
    created_at: datetime

    model_config = {"from_attributes": True}
