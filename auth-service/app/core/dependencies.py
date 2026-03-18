from collections.abc import AsyncGenerator
from datetime import timedelta

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession


_LOGIN_UPDATE_THRESHOLD = timedelta(hours=1)


async def get_db(request: Request) -> AsyncGenerator[AsyncSession, None]:
    async with request.app.state.session_factory() as session:
        yield session
