from typing import Any

from sqlalchemy.orm import selectinload
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends, HTTPException

from app.models.user import User
from app.models.language import Language
from app.core.dependencies import get_db
from app.core.validation import validate_token
from app.schemas.users import UserResponse, CreateUser


router = APIRouter(prefix='/users', tags=['users'])


@router.get(
    '/exists',
    response_model=UserResponse
)
async def exists(
        token_payload: dict[str, Any] = Depends(validate_token),
        db: AsyncSession = Depends(get_db),
):
    auth0_id: str = token_payload["sub"]
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
    token_payload: dict[str, Any] = Depends(validate_token),
    db: AsyncSession = Depends(get_db),
):
    auth0_id = token_payload["sub"]

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
