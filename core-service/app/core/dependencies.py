from typing import Generator

from sqlalchemy.orm import Session
from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi import Request, Header, HTTPException, status


def get_db(request: Request) -> Generator[Session, None, None]:
    db = request.app.state.session_factory()
    try:
        yield db
    finally:
        db.close()


def get_mongo_db(request: Request) -> AsyncIOMotorDatabase:
    return request.app.state.mongo_db


def get_current_user_sub(
    x_user_sub: str | None = Header(default=None),
) -> str:
    """
    Extracts the authenticated user's Auth0 subject (sub) from the
    X-User-Sub header set by the API Gateway after JWT validation.
    """
    if not x_user_sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing user identity",
        )
    return x_user_sub
