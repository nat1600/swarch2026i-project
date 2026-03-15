from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Request, Header, HTTPException, status


async def get_current_user_sub(
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



async def get_db(request: Request) -> AsyncGenerator[AsyncSession, None]:
    """
    Yields an async database session from the session factory
    stored in the application state.
    """
    async with request.app.state.session_factory() as session:
        yield session
