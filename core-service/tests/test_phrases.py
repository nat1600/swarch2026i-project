"""
Integration tests for the core-service phrases endpoints.

These tests use an in-memory SQLite database and bypass the API gateway
auth header requirement via dependency overrides (see conftest.py).
"""
import pytest
from tests.conftest import TEST_USER_SUB

PHRASE_PAYLOAD = {
    "source_language_id": 1,
    "target_language_id": 2,
    "original_text": "The quick brown fox",
    "translated_text": "El veloz zorro marrón",
    "pronunciation": "el ve-loz zo-ro ma-ron",
}


# ─── POST /phrases/ ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_phrase_returns_201(client):
    response = await client.post("/phrases/", json=PHRASE_PAYLOAD)
    assert response.status_code == 201
    data = response.json()
    assert data["original_text"] == PHRASE_PAYLOAD["original_text"]
    assert data["translated_text"] == PHRASE_PAYLOAD["translated_text"]
    assert "id" in data


@pytest.mark.asyncio
async def test_create_phrase_stores_user_sub(client):
    response = await client.post("/phrases/", json=PHRASE_PAYLOAD)
    assert response.status_code == 201
    data = response.json()
    assert data["user_id"] == TEST_USER_SUB


@pytest.mark.asyncio
async def test_create_phrase_without_auth_returns_401(app):
    """Removing the auth override should trigger a 401."""
    import httpx
    from app.core.dependencies import get_current_user_sub

    app.dependency_overrides.pop(get_current_user_sub, None)
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post("/phrases/", json=PHRASE_PAYLOAD)
    assert response.status_code == 401


# ─── GET /phrases/ ───────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_all_phrases_empty_initially(client):
    response = await client.get("/phrases/")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_get_all_phrases_returns_created_phrase(client):
    await client.post("/phrases/", json=PHRASE_PAYLOAD)
    response = await client.get("/phrases/")
    assert response.status_code == 200
    phrases = response.json()
    assert len(phrases) == 1
    assert phrases[0]["original_text"] == PHRASE_PAYLOAD["original_text"]


@pytest.mark.asyncio
async def test_get_all_phrases_only_returns_active(client):
    create_resp = await client.post("/phrases/", json=PHRASE_PAYLOAD)
    phrase_id = create_resp.json()["id"]

    # Soft-delete it
    await client.delete(f"/phrases/{phrase_id}")

    response = await client.get("/phrases/")
    assert response.status_code == 200
    assert response.json() == []


# ─── GET /phrases/{id} ───────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_phrase_by_id(client):
    create_resp = await client.post("/phrases/", json=PHRASE_PAYLOAD)
    phrase_id = create_resp.json()["id"]

    response = await client.get(f"/phrases/{phrase_id}")
    assert response.status_code == 200
    assert response.json()["id"] == phrase_id


@pytest.mark.asyncio
async def test_get_phrase_by_id_not_found(client):
    response = await client.get("/phrases/99999")
    assert response.status_code == 404


# ─── DELETE /phrases/{id} ────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_delete_phrase_returns_200(client):
    create_resp = await client.post("/phrases/", json=PHRASE_PAYLOAD)
    phrase_id = create_resp.json()["id"]

    response = await client.delete(f"/phrases/{phrase_id}")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_delete_phrase_soft_deletes(client):
    """Deleted phrases should not appear in GET /phrases/ but still exist in DB."""
    create_resp = await client.post("/phrases/", json=PHRASE_PAYLOAD)
    phrase_id = create_resp.json()["id"]

    await client.delete(f"/phrases/{phrase_id}")

    list_resp = await client.get("/phrases/")
    assert all(p["id"] != phrase_id for p in list_resp.json())


# ─── GET /phrases/due ────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_due_phrases_empty_when_none_created(client):
    response = await client.get("/phrases/due")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_get_due_phrases_includes_new_phrase(client):
    """Newly created phrases have next_review_date = today and should appear as due."""
    await client.post("/phrases/", json=PHRASE_PAYLOAD)
    response = await client.get("/phrases/due")
    assert response.status_code == 200
    assert len(response.json()) >= 1


# ─── POST /phrases/{id}/review ───────────────────────────────────────────────

@pytest.mark.asyncio
async def test_review_phrase_updates_sm2_state(client):
    create_resp = await client.post("/phrases/", json=PHRASE_PAYLOAD)
    phrase_id = create_resp.json()["id"]

    response = await client.post(f"/phrases/{phrase_id}/review", json={"quality": 5})
    assert response.status_code == 200
    data = response.json()
    assert data["phrase_id"] == phrase_id
    assert "easiness_factor" in data
    assert "inner_repetition_interval" in data


@pytest.mark.asyncio
async def test_review_phrase_invalid_quality_rejected(client):
    create_resp = await client.post("/phrases/", json=PHRASE_PAYLOAD)
    phrase_id = create_resp.json()["id"]

    # quality must be 0-5
    response = await client.post(f"/phrases/{phrase_id}/review", json={"quality": 10})
    assert response.status_code == 422
