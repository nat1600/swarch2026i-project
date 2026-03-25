import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.language import Language


# ---------------------------------------------------------------------------
# Language seed fixtures (each adds a row, rolled back after the test)
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def english(db: AsyncSession) -> Language:
    lang = Language(name="English")
    db.add(lang)
    await db.commit()
    await db.refresh(lang)
    return lang


@pytest_asyncio.fixture
async def spanish(db: AsyncSession) -> Language:
    lang = Language(name="Spanish")
    db.add(lang)
    await db.commit()
    await db.refresh(lang)
    return lang


# ---------------------------------------------------------------------------
# GET /users/exists
# ---------------------------------------------------------------------------

async def test_exists_returns_null_when_no_user(client):
    resp = await client.get("/users/exists")
    assert resp.status_code == 200
    assert resp.json() == {"data": None}


# ---------------------------------------------------------------------------
# POST /users/register
# ---------------------------------------------------------------------------

REGISTER_PAYLOAD = {
    "native_language": "English",
    "learning_language": "Spanish",
    "email": "test@example.com",
    "username": "testuser",
    "timezone": "America/New_York",
}


async def test_register_creates_user(client, english, spanish):
    resp = await client.post("/users/register", json=REGISTER_PAYLOAD)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["email"] == "test@example.com"
    assert data["native_language"]["name"] == "English"
    assert data["learning_language"]["name"] == "Spanish"
    assert data["accumulated_points"] == 0


async def test_register_returns_409_when_user_already_exists(client, english, spanish):
    await client.post("/users/register", json=REGISTER_PAYLOAD)
    resp = await client.post("/users/register", json=REGISTER_PAYLOAD)
    assert resp.status_code == 409


async def test_register_returns_422_for_unknown_native_language(client, spanish):
    resp = await client.post("/users/register", json={
        **REGISTER_PAYLOAD,
        "native_language": "Klingon",
    })
    assert resp.status_code == 422


async def test_register_returns_422_for_unknown_learning_language(client, english):
    resp = await client.post("/users/register", json={
        **REGISTER_PAYLOAD,
        "learning_language": "Klingon",
    })
    assert resp.status_code == 422
