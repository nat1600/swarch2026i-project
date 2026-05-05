import os
from pathlib import Path

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import get_app
from app.models.base import Base


@pytest.fixture(scope="session")
def settings():
    """Create test settings from environment."""
    # Load settings from .env, but override database URL for testing
    base_settings = Settings()
    
    # Create new settings instance with in-memory SQLite for testing
    return Settings(
        database_url="sqlite+aiosqlite:///:memory:",
        mercadopago_access_token=base_settings.mercadopago_access_token,
        mercadopago_public_key=base_settings.mercadopago_public_key,
        mercadopago_notification_url=base_settings.mercadopago_notification_url,
        vip_price=base_settings.vip_price,
        vip_currency=base_settings.vip_currency,
        vip_title=base_settings.vip_title,
        vip_description=base_settings.vip_description,
        debug=base_settings.debug,
    )


@pytest.fixture
async def test_db_engine(settings):
    """Create an in-memory SQLite database for testing."""
    engine = create_async_engine(
        settings.database_url,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()


@pytest.fixture
async def test_session(test_db_engine):
    """Create a test database session."""
    from sqlalchemy.ext.asyncio import async_sessionmaker
    
    SessionLocal = async_sessionmaker(
        bind=test_db_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    
    async with SessionLocal() as session:
        yield session


@pytest.fixture
def test_app(settings, test_db_engine):
    """Create a test FastAPI application."""
    from sqlalchemy.ext.asyncio import async_sessionmaker
    
    app = get_app()
    
    # Override settings
    app.state.settings = settings
    
    # Override session factory
    SessionLocal = async_sessionmaker(
        bind=test_db_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    app.state.session_factory = SessionLocal
    
    return app


@pytest.fixture
def client(test_app):
    """Create a test client for the FastAPI app."""
    return TestClient(test_app)
