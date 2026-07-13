import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.recipe import MealType, RecipeSource


class Ingredient(BaseModel):
    item: str
    quantity: str | None = None
    store_hint: str | None = None


class RecipeCreate(BaseModel):
    title: str
    category: MealType = MealType.dinner
    cuisine: str | None = None
    protein: str | None = None
    season: str | None = None
    total_minutes: int | None = None
    active_minutes: int | None = None
    rating: int | None = None
    is_favorite: bool = False
    nutrition_tags: list[str] = []
    ingredients: list[Ingredient] = []
    instructions: list[str] = []
    toddler_notes: str | None = None
    infant_notes: str | None = None
    night2_notes: str | None = None
    source: RecipeSource = RecipeSource.manual


class RecipeUpdate(BaseModel):
    title: str | None = None
    category: MealType | None = None
    cuisine: str | None = None
    protein: str | None = None
    season: str | None = None
    total_minutes: int | None = None
    active_minutes: int | None = None
    rating: int | None = None
    is_favorite: bool | None = None
    nutrition_tags: list[str] | None = None
    ingredients: list[Ingredient] | None = None
    instructions: list[str] | None = None
    toddler_notes: str | None = None
    infant_notes: str | None = None
    night2_notes: str | None = None


class RecipeResponse(BaseModel):
    id: uuid.UUID
    title: str
    category: MealType
    cuisine: str | None
    protein: str | None
    season: str | None
    total_minutes: int | None
    active_minutes: int | None
    rating: int | None
    is_favorite: bool
    nutrition_tags: list[str]
    ingredients: list[Ingredient]
    instructions: list[str]
    toddler_notes: str | None
    infant_notes: str | None
    night2_notes: str | None
    source: RecipeSource
    created_at: datetime

    model_config = {"from_attributes": True}


class RecipeSummary(BaseModel):
    id: uuid.UUID
    title: str
    category: MealType
    cuisine: str | None
    protein: str | None
    season: str | None
    total_minutes: int | None
    rating: int | None
    is_favorite: bool
    nutrition_tags: list[str]
    created_at: datetime

    model_config = {"from_attributes": True}
