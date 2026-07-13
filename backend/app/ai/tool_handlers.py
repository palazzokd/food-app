import uuid
from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chat import LearnedPreference
from app.models.family import FamilyProfile, HouseholdMember, MemberRole, NutritionalStage
from app.services import (
    family_service,
    grocery_service,
    meal_plan_service,
    nutrition_service,
    recipe_service,
)
from app.schemas.family import HouseholdMemberCreate
from app.schemas.grocery import GroceryItemCreate, GroceryListCreate
from app.schemas.meal_plan import MealPlanCreate, MealPlanEntryCreate
from app.schemas.nutrition import NutritionDayUpdate
from app.schemas.recipe import RecipeCreate, RecipeSource


async def handle_tool_call(
    tool_name: str,
    tool_input: dict,
    db: AsyncSession,
    user_id: uuid.UUID,
    family_profile_id: uuid.UUID | None,
) -> dict:
    handlers = {
        "quiz_options": _handle_quiz_options,
        "save_family_member": _handle_save_family_member,
        "save_preference": _handle_save_preference,
        "get_family_profile": _handle_get_family_profile,
        "save_recipe": _handle_save_recipe,
        "get_recipes": _handle_get_recipes,
        "save_meal_plan": _handle_save_meal_plan,
        "get_meal_plan": _handle_get_meal_plan,
        "save_grocery_list": _handle_save_grocery_list,
        "get_grocery_list": _handle_get_grocery_list,
        "update_grocery_items": _handle_update_grocery_items,
        "log_nutrition": _handle_log_nutrition,
    }

    handler = handlers.get(tool_name)
    if not handler:
        return {"error": f"Unknown tool: {tool_name}"}

    return await handler(
        tool_input, db=db, user_id=user_id, family_profile_id=family_profile_id
    )


async def _require_profile_id(
    db: AsyncSession, user_id: uuid.UUID, family_profile_id: uuid.UUID | None
) -> uuid.UUID | None:
    if family_profile_id:
        return family_profile_id
    profile = await family_service.get_family_profile(db, user_id)
    return profile.id if profile else None


async def _handle_quiz_options(tool_input: dict, **kwargs) -> dict:
    return {
        "type": "quiz_options",
        "question": tool_input["question"],
        "options": tool_input["options"],
        "allow_multiple": tool_input.get("allow_multiple", False),
    }


async def _handle_save_family_member(
    tool_input: dict,
    db: AsyncSession,
    user_id: uuid.UUID,
    family_profile_id: uuid.UUID | None,
    **kwargs,
) -> dict:
    profile = await family_service.get_family_profile(db, user_id)
    if not profile:
        from app.schemas.family import FamilyProfileCreate

        profile = await family_service.create_family_profile(
            db, user_id, FamilyProfileCreate()
        )

    role_str = tool_input.get("role", "adult")
    stage_str = tool_input.get("nutritional_stage")
    if not stage_str:
        stage_str = {
            "adult": "adult",
            "toddler": "palate_expansion",
            "infant": "allergen_introduction",
        }.get(role_str, "adult")

    member_data = HouseholdMemberCreate(
        name=tool_input["name"],
        age_months=tool_input.get("age_months"),
        role=MemberRole(role_str),
        nutritional_stage=NutritionalStage(stage_str),
        dietary_restrictions=tool_input.get("dietary_restrictions", []),
    )

    member = await family_service.add_household_member(db, profile.id, member_data)
    return {
        "status": "saved",
        "member_name": member.name,
        "member_id": str(member.id),
    }


async def _handle_save_preference(
    tool_input: dict,
    db: AsyncSession,
    family_profile_id: uuid.UUID | None,
    user_id: uuid.UUID,
    **kwargs,
) -> dict:
    if not family_profile_id:
        profile = await family_service.get_family_profile(db, user_id)
        if profile:
            family_profile_id = profile.id
        else:
            return {"error": "No family profile exists yet"}

    from sqlalchemy import select

    existing = await db.execute(
        select(LearnedPreference).where(
            LearnedPreference.family_profile_id == family_profile_id,
            LearnedPreference.category == tool_input["category"],
            LearnedPreference.preference_key == tool_input["key"],
        )
    )
    pref = existing.scalar_one_or_none()

    if pref:
        pref.preference_value = tool_input["value"]
    else:
        pref = LearnedPreference(
            family_profile_id=family_profile_id,
            category=tool_input["category"],
            preference_key=tool_input["key"],
            preference_value=tool_input["value"],
        )
        db.add(pref)

    await db.commit()
    return {"status": "saved", "category": tool_input["category"], "key": tool_input["key"]}


async def _handle_get_family_profile(
    tool_input: dict,
    db: AsyncSession,
    user_id: uuid.UUID,
    **kwargs,
) -> dict:
    profile = await family_service.get_family_profile(db, user_id)
    if not profile:
        return {"status": "no_profile", "message": "No family profile has been created yet."}

    members = []
    for m in profile.members:
        members.append({
            "name": m.name,
            "age_months": m.age_months,
            "role": m.role.value,
            "nutritional_stage": m.nutritional_stage.value,
            "dietary_restrictions": m.dietary_restrictions,
            "flavor_preferences": m.flavor_preferences,
        })

    return {
        "household_name": profile.household_name,
        "max_prep_minutes": profile.max_prep_minutes,
        "planning_horizon_days": profile.planning_horizon_days,
        "dinners_per_cycle": profile.dinners_per_cycle,
        "batch_prep_day": profile.batch_prep_day,
        "members": members,
    }


async def _handle_save_recipe(
    tool_input: dict,
    db: AsyncSession,
    user_id: uuid.UUID,
    family_profile_id: uuid.UUID | None,
    **kwargs,
) -> dict:
    profile_id = await _require_profile_id(db, user_id, family_profile_id)
    if not profile_id:
        return {"error": "No family profile exists yet"}

    data = RecipeCreate(**{**tool_input, "source": RecipeSource.ai})
    recipe = await recipe_service.create_recipe(db, profile_id, data)
    return {
        "status": "saved",
        "type": "recipe_saved",
        "recipe_id": str(recipe.id),
        "title": recipe.title,
    }


async def _handle_get_recipes(
    tool_input: dict,
    db: AsyncSession,
    user_id: uuid.UUID,
    family_profile_id: uuid.UUID | None,
    **kwargs,
) -> dict:
    profile_id = await _require_profile_id(db, user_id, family_profile_id)
    if not profile_id:
        return {"error": "No family profile exists yet"}

    recipes = await recipe_service.list_recipes(
        db,
        profile_id,
        category=tool_input.get("category"),
        favorite=True if tool_input.get("favorites_only") else None,
        search=tool_input.get("search"),
    )
    return {
        "count": len(recipes),
        "recipes": [
            {
                "recipe_id": str(r.id),
                "title": r.title,
                "category": r.category.value,
                "cuisine": r.cuisine,
                "protein": r.protein,
                "total_minutes": r.total_minutes,
                "active_minutes": r.active_minutes,
                "is_favorite": r.is_favorite,
                "nutrition_tags": r.nutrition_tags,
            }
            for r in recipes
        ],
    }


async def _handle_save_meal_plan(
    tool_input: dict,
    db: AsyncSession,
    user_id: uuid.UUID,
    family_profile_id: uuid.UUID | None,
    **kwargs,
) -> dict:
    profile_id = await _require_profile_id(db, user_id, family_profile_id)
    if not profile_id:
        return {"error": "No family profile exists yet"}

    entries = []
    for e in tool_input.get("entries", []):
        recipe_id = e.get("recipe_id")
        entries.append(
            MealPlanEntryCreate(
                day_of_week=e["day_of_week"],
                meal_type=e["meal_type"],
                title=e["title"],
                recipe_id=uuid.UUID(recipe_id) if recipe_id else None,
                notes=e.get("notes"),
            )
        )
    data = MealPlanCreate(
        week_start_date=date.fromisoformat(tool_input["week_start_date"]),
        title=tool_input.get("title"),
        entries=entries,
    )
    plan = await meal_plan_service.upsert_meal_plan(db, profile_id, data)
    return {
        "status": "saved",
        "type": "meal_plan_saved",
        "meal_plan_id": str(plan.id),
        "week_start_date": plan.week_start_date.isoformat(),
        "entry_count": len(plan.entries),
    }


async def _handle_get_meal_plan(
    tool_input: dict,
    db: AsyncSession,
    user_id: uuid.UUID,
    family_profile_id: uuid.UUID | None,
    **kwargs,
) -> dict:
    profile_id = await _require_profile_id(db, user_id, family_profile_id)
    if not profile_id:
        return {"error": "No family profile exists yet"}

    week_str = tool_input.get("week_start_date")
    week_start = (
        date.fromisoformat(week_str)
        if week_str
        else meal_plan_service.current_week_monday()
    )
    plan = await meal_plan_service.get_meal_plan_by_week(db, profile_id, week_start)
    if not plan:
        return {
            "status": "no_plan",
            "week_start_date": week_start.isoformat(),
            "message": "No meal plan saved for this week yet.",
        }

    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    return {
        "meal_plan_id": str(plan.id),
        "week_start_date": plan.week_start_date.isoformat(),
        "title": plan.title,
        "entries": [
            {
                "day": days[e.day_of_week],
                "day_of_week": e.day_of_week,
                "meal_type": e.meal_type.value,
                "title": e.title,
                "recipe_id": str(e.recipe_id) if e.recipe_id else None,
                "notes": e.notes,
            }
            for e in plan.entries
        ],
    }


async def _handle_save_grocery_list(
    tool_input: dict,
    db: AsyncSession,
    user_id: uuid.UUID,
    family_profile_id: uuid.UUID | None,
    **kwargs,
) -> dict:
    profile_id = await _require_profile_id(db, user_id, family_profile_id)
    if not profile_id:
        return {"error": "No family profile exists yet"}

    data = GroceryListCreate(
        title=tool_input.get("title"),
        strategy_note=tool_input.get("strategy_note"),
        items=[GroceryItemCreate(**item) for item in tool_input.get("items", [])],
    )
    grocery_list = await grocery_service.create_list(db, profile_id, data)
    return {
        "status": "saved",
        "type": "grocery_list_saved",
        "grocery_list_id": str(grocery_list.id),
        "item_count": len(grocery_list.items),
    }


async def _handle_get_grocery_list(
    tool_input: dict,
    db: AsyncSession,
    user_id: uuid.UUID,
    family_profile_id: uuid.UUID | None,
    **kwargs,
) -> dict:
    profile_id = await _require_profile_id(db, user_id, family_profile_id)
    if not profile_id:
        return {"error": "No family profile exists yet"}

    grocery_list = await grocery_service.get_active_list(db, profile_id)
    if not grocery_list:
        return {"status": "no_list", "message": "No active grocery list."}

    return {
        "grocery_list_id": str(grocery_list.id),
        "title": grocery_list.title,
        "strategy_note": grocery_list.strategy_note,
        "items": [
            {
                "name": i.name,
                "quantity": i.quantity,
                "store": i.store,
                "deal_note": i.deal_note,
                "is_checked": i.is_checked,
            }
            for i in grocery_list.items
        ],
    }


async def _handle_update_grocery_items(
    tool_input: dict,
    db: AsyncSession,
    user_id: uuid.UUID,
    family_profile_id: uuid.UUID | None,
    **kwargs,
) -> dict:
    profile_id = await _require_profile_id(db, user_id, family_profile_id)
    if not profile_id:
        return {"error": "No family profile exists yet"}

    grocery_list = await grocery_service.get_active_list(db, profile_id)
    if not grocery_list:
        return {"error": "No active grocery list. Use save_grocery_list to create one."}

    added, removed, checked, unchecked, not_found = 0, 0, 0, 0, []

    def find_item(name: str):
        target = name.strip().lower()
        for item in grocery_list.items:
            if item.name.strip().lower() == target:
                return item
        return None

    for name in tool_input.get("remove", []):
        item = find_item(name)
        if item:
            await db.delete(item)
            removed += 1
        else:
            not_found.append(name)

    for name in tool_input.get("check", []):
        item = find_item(name)
        if item:
            item.is_checked = True
            checked += 1
        else:
            not_found.append(name)

    for name in tool_input.get("uncheck", []):
        item = find_item(name)
        if item:
            item.is_checked = False
            unchecked += 1
        else:
            not_found.append(name)

    await db.commit()
    await db.refresh(grocery_list)

    additions = [GroceryItemCreate(**item) for item in tool_input.get("add", [])]
    if additions:
        grocery_list = await grocery_service.add_items(db, grocery_list, additions)
        added = len(additions)

    result = {
        "status": "updated",
        "type": "grocery_list_saved",
        "grocery_list_id": str(grocery_list.id),
        "added": added,
        "removed": removed,
        "checked": checked,
        "unchecked": unchecked,
    }
    if not_found:
        result["not_found"] = not_found
    return result


async def _handle_log_nutrition(
    tool_input: dict,
    db: AsyncSession,
    user_id: uuid.UUID,
    family_profile_id: uuid.UUID | None,
    **kwargs,
) -> dict:
    profile_id = await _require_profile_id(db, user_id, family_profile_id)
    if not profile_id:
        return {"error": "No family profile exists yet"}

    day = date.fromisoformat(tool_input["date"])
    data = NutritionDayUpdate(
        legumes=tool_input.get("legumes"),
        leafy_greens=tool_input.get("leafy_greens"),
        nuts_seeds=tool_input.get("nuts_seeds"),
        source_note=tool_input.get("source_note"),
    )
    record = await nutrition_service.upsert_day(db, profile_id, day, data)
    return {
        "status": "saved",
        "type": "nutrition_logged",
        "date": record.date.isoformat(),
        "legumes": record.legumes,
        "leafy_greens": record.leafy_greens,
        "nuts_seeds": record.nuts_seeds,
    }
