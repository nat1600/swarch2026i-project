"""
Test configuration for core-service.

Uses an in-memory SQLite database and a mocked MongoDB so tests run without
any external infrastructure. The FastAPI ASGI app is tested directly via
httpx.AsyncClient.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.base import Base
from app.core.dependencies import get_db, get_mongo_db, get_current_user_sub
from app.main import get_app

TEST_USER_SUB = "auth0|test_user_123"

# SQLite in-memory engine (shared across a test session)
_engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
Base.metadata.create_all(bind=_engine)
_TestSession = sessionmaker(bind=_engine, autoflush=False)


def override_get_db():
    db = _TestSession()
    try:
        yield db
    finally:
        db.close()


def override_get_current_user_sub():
    return TEST_USER_SUB


def override_get_mongo_db():
    mock_db = MagicMock()
    mock_collection = AsyncMock()
    mock_collection.insert_one = AsyncMock(return_value=MagicMock(inserted_id="fake_id"))
    mock_collection.find_one = AsyncMock(return_value=None)
    mock_db.__getitem__ = MagicMock(return_value=mock_collection)
    return mock_db


@pytest.fixture()
def app():
    application = get_app()
    application.dependency_overrides[get_db] = override_get_db
    application.dependency_overrides[get_current_user_sub] = override_get_current_user_sub
    application.dependency_overrides[get_mongo_db] = override_get_mongo_db
    yield application
    application.dependency_overrides.clear()


@pytest.fixture()
async def client(app):
    import httpx
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
