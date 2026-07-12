import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chat import LearnedPreference
from app.models.family import FamilyProfile, HouseholdMember, MemberRole, NutritionalStage
from app.services import family_service
from app.schemas.family import HouseholdMemberCreate


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
    }

    handler = handlers.get(tool_name)
    if not handler:
        return {"error": f"Unknown tool: {tool_name}"}

    return await handler(
        tool_input, db=db, user_id=user_id, family_profile_id=family_profile_id
    )


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
