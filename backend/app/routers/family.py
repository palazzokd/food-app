import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.family import (
    FamilyProfileCreate,
    FamilyProfileResponse,
    FamilyProfileUpdate,
    HouseholdMemberCreate,
    HouseholdMemberResponse,
    HouseholdMemberUpdate,
)
from app.services import family_service

router = APIRouter()


@router.post("/profile", response_model=FamilyProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_profile(
    data: FamilyProfileCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await family_service.get_family_profile(db, current_user.id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Family profile already exists",
        )
    profile = await family_service.create_family_profile(db, current_user.id, data)
    return FamilyProfileResponse.model_validate(profile)


@router.get("/profile", response_model=FamilyProfileResponse)
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = await family_service.get_family_profile(db, current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No family profile found"
        )
    return FamilyProfileResponse.model_validate(profile)


@router.patch("/profile", response_model=FamilyProfileResponse)
async def update_profile(
    data: FamilyProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = await family_service.update_family_profile(db, current_user.id, data)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No family profile found"
        )
    return FamilyProfileResponse.model_validate(profile)


@router.post("/members", response_model=HouseholdMemberResponse, status_code=status.HTTP_201_CREATED)
async def add_member(
    data: HouseholdMemberCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = await family_service.get_family_profile(db, current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Create a family profile first"
        )
    member = await family_service.add_household_member(db, profile.id, data)
    return HouseholdMemberResponse.model_validate(member)


@router.patch("/members/{member_id}", response_model=HouseholdMemberResponse)
async def update_member(
    member_id: uuid.UUID,
    data: HouseholdMemberUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    member = await family_service.update_household_member(db, member_id, data)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Member not found"
        )
    return HouseholdMemberResponse.model_validate(member)


@router.delete("/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_member(
    member_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deleted = await family_service.delete_household_member(db, member_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Member not found"
        )
