from sqlalchemy.orm import selectinload
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends, HTTPException

from app.models.user import User
from app.models.language import Language
from app.schemas.users import UserResponse, CreateUser
from app.core.dependencies import get_db, get_current_user_sub


router = APIRouter(prefix='/users', tags=['users'])


@router.get(
    '/exists',
    response_model=UserResponse
)
async def exists(
        auth0_id: str = Depends(get_current_user_sub),
        db: AsyncSession = Depends(get_db),
):
    user: User = await db.scalar(
        select(User)
        .where(User.auth0_id == auth0_id)
        .options(
            selectinload(User.native_language),
            selectinload(User.learning_language),
        )
    )
    if user is None:
        return UserResponse(data=None)
    user_response = UserResponse.from_db(user)

    await db.execute(
        update(User)
        .where(User.auth0_id == auth0_id)
        .values(last_login_at=func.now())
    )
    await db.commit()
    return user_response


@router.post(
    "/register",
    response_model=UserResponse
)
async def register(
    body: CreateUser,
    auth0_id: str = Depends(get_current_user_sub),
    db: AsyncSession = Depends(get_db),
):
    # Check if already registered
    existing: User | None = await db.scalar(
        select(User)
        .where(User.auth0_id == auth0_id)
        .options(
            selectinload(User.native_language),
            selectinload(User.learning_language),
        )
    )
    if existing:
        raise HTTPException(409, "User already exists")

    # Check
    native_language_id = await db.scalar(
        select(Language.id).where(Language.name == body.native_language)
    )
    if native_language_id is None:
        raise HTTPException(422, f"Unknown language: {body.native_language}")

    # Check
    learning_language_id = await db.scalar(
        select(Language.id).where(Language.name == body.learning_language)
    )
    if learning_language_id is None:
        raise HTTPException(422, f"Unknown language: {body.learning_language}")

    user = User(
        auth0_id=auth0_id,
        native_language_id=native_language_id,
        learning_language_id=learning_language_id,
        email=body.email,
        username=body.username,
        timezone=body.timezone,
        last_login_at=func.now()
    )
    db.add(user)
    await db.commit()

    user = await db.scalar(
        select(User)
        .where(User.auth0_id == auth0_id)
        .options(
            selectinload(User.native_language),
            selectinload(User.learning_language),
        )
        .execution_options(populate_existing=True)
    )
    return UserResponse.from_db(user)
