"""
Test configuration for auth-service.

Overrides the async PostgreSQL engine with an in-memory async SQLite
database so tests run without real infrastructure.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from app.main import get_app


TEST_DB_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture()
def app():
    application = get_app()
    yield application
    application.dependency_overrides.clear()


@pytest.fixture()
async def client(app):
    import httpx
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
