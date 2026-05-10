"""
Shared fixtures for all tests.

Strategy
--------
- A session-scoped engine points at a dedicated test database (auth_test_db).
  The database is created automatically if it does not exist yet.
  Tables are created once at the start of the session and dropped at the end.
- Each test gets its own connection with an open transaction. The session uses
  savepoints for its own commits, so the outer transaction can be rolled back
  unconditionally after the test — giving every test a clean slate without
  needing to truncate tables manually.
- Both `validate_token` and `get_db` are overridden in the FastAPI app so
  no real Auth0 token or the app's lifespan engine is ever touched.
"""
import asyncpg
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.pool import NullPool

from app.main import app
from app.models.base import Base
from app.core.config import get_settings
from app.core.dependencies import get_db, get_current_user_sub


def _test_db_name() -> str:
    return f"{get_settings().postgres_db}_test"


def _test_db_url() -> str:
    """Reuse all credentials from .env but point at the test database."""
    s = get_settings()
    return s.database_url.replace(f"/{s.postgres_db}", f"/{_test_db_name()}")


async def _ensure_test_db_exists() -> None:
    """
    Create the test database if it doesn't already exist.
    Connects to the maintenance 'postgres' database to issue CREATE DATABASE,
    which cannot run inside a transaction.
    """
    s = get_settings()
    test_db = _test_db_name()
    conn = await asyncpg.connect(
        host=s.postgres_host,
        port=s.postgres_port,
        user=s.postgres_user,
        password=s.postgres_password,
        database="postgres",
    )
    try:
        exists = await conn.fetchval(
            "SELECT 1 FROM pg_database WHERE datname = $1", test_db
        )
        if not exists:
            await conn.execute(f'CREATE DATABASE "{test_db}"')
    finally:
        await conn.close()


# ---------------------------------------------------------------------------
# Database fixtures
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture(scope="session")
async def engine():
    """
    Create the test database (if needed) and (re)create all tables once for
    the whole test session.
    """
    await _ensure_test_db_exists()
    _engine = create_async_engine(_test_db_url(), poolclass=NullPool)
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield _engine
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await _engine.dispose()


@pytest_asyncio.fixture
async def db(engine):
    """
    Function-scoped database session.

    Uses an outer transaction + savepoints so that any commits made inside a
    route are demoted to savepoints. Rolling back the outer transaction at the
    end undoes everything, leaving the DB pristine for the next test.
    """
    async with engine.connect() as conn:
        await conn.begin()
        session = AsyncSession(
            bind=conn,
            expire_on_commit=False,
            join_transaction_mode="create_savepoint",
        )
        yield session
        await session.close()
        await conn.rollback()


# ---------------------------------------------------------------------------
# HTTP client fixture
# ---------------------------------------------------------------------------

FAKE_USER_SUB = "test|user-abc123"


@pytest_asyncio.fixture
async def client(db):
    """
    Async HTTP client wired to the FastAPI app.

    Overrides:
    - get_current_user_sub → returns a static fake sub (no Auth0 needed)
    - get_db               → yields the test session (rolls back after the test)
    """
    async def _get_db_override():
        yield db

    app.dependency_overrides[get_current_user_sub] = lambda: FAKE_USER_SUB
    app.dependency_overrides[get_db] = _get_db_override

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c

    app.dependency_overrides.clear()
