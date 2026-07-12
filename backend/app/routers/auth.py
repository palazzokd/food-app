from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest, UserResponse
from app.services import auth_service

router = APIRouter()


@router.post("/register", response_model=AuthResponse)
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    try:
        result = await auth_service.register_user(
            db, request.email, request.password, request.display_name
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return AuthResponse(
        access_token=result["access_token"],
        refresh_token=result["refresh_token"],
        user=UserResponse.model_validate(result["user"]),
    )


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    try:
        result = await auth_service.login_user(db, request.email, request.password)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    return AuthResponse(
        access_token=result["access_token"],
        refresh_token=result["refresh_token"],
        user=UserResponse.model_validate(result["user"]),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)
