import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.family import FamilyProfile, HouseholdMember
from app.schemas.family import (
    FamilyProfileCreate,
    FamilyProfileUpdate,
    HouseholdMemberCreate,
    HouseholdMemberUpdate,
)


async def create_family_profile(
    db: AsyncSession, user_id: uuid.UUID, data: FamilyProfileCreate
) -> FamilyProfile:
    profile = FamilyProfile(owner_user_id=user_id, **data.model_dump())
    db.add(profile)
    await db.commit()
    await db.refresh(profile)

    from app.services import nutrition_service

    await nutrition_service.seed_default_targets(db, profile.id)
    return profile


async def get_family_profile(
    db: AsyncSession, user_id: uuid.UUID
) -> FamilyProfile | None:
    result = await db.execute(
        select(FamilyProfile)
        .options(selectinload(FamilyProfile.members))
        .where(FamilyProfile.owner_user_id == user_id)
    )
    return result.scalar_one_or_none()


async def update_family_profile(
    db: AsyncSession, user_id: uuid.UUID, data: FamilyProfileUpdate
) -> FamilyProfile | None:
    profile = await get_family_profile(db, user_id)
    if not profile:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(profile, key, value)
    await db.commit()
    await db.refresh(profile)
    return profile


async def add_household_member(
    db: AsyncSession, profile_id: uuid.UUID, data: HouseholdMemberCreate
) -> HouseholdMember:
    member = HouseholdMember(family_profile_id=profile_id, **data.model_dump())
    db.add(member)
    await db.commit()
    await db.refresh(member)
    return member


async def update_household_member(
    db: AsyncSession,
    member_id: uuid.UUID,
    data: HouseholdMemberUpdate,
    family_profile_id: uuid.UUID | None = None,
) -> HouseholdMember | None:
    query = select(HouseholdMember).where(HouseholdMember.id == member_id)
    if family_profile_id:
        query = query.where(HouseholdMember.family_profile_id == family_profile_id)
    result = await db.execute(query)
    member = result.scalar_one_or_none()
    if not member:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(member, key, value)
    await db.commit()
    await db.refresh(member)
    return member


async def delete_household_member(
    db: AsyncSession,
    member_id: uuid.UUID,
    family_profile_id: uuid.UUID | None = None,
) -> bool:
    query = select(HouseholdMember).where(HouseholdMember.id == member_id)
    if family_profile_id:
        query = query.where(HouseholdMember.family_profile_id == family_profile_id)
    result = await db.execute(query)
    member = result.scalar_one_or_none()
    if not member:
        return False
    await db.delete(member)
    await db.commit()
    return True
