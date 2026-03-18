# tests/routes/test_threads.py
import pytest
from unittest.mock import AsyncMock
from bson import ObjectId
from tests.conftest import make_thread

VALID_ID = str(ObjectId())
USER_HEADERS = {"x-user-sub": "user_abc"}
OTHER_USER_HEADERS = {"x-user-sub": "user_xyz"}


# ── GET /threads ─────────────────────────────────────────────

async def test_list_threads_empty(client):
    ac, db = client
    # El cursor ya devuelve [] por defecto en el fixture
    response = await ac.get("/threads")
    assert response.status_code == 200
    assert response.json()["items"] == []
    assert response.json()["has_more"] is False


async def test_list_threads_with_results(client):
    ac, db = client
    thread = make_thread()
    mock_cursor = db.threads.find.return_value
    mock_cursor.to_list = AsyncMock(return_value=[thread])

    response = await ac.get("/threads")
    assert response.status_code == 200
    assert len(response.json()["items"]) == 1


async def test_list_threads_invalid_cursor(client):
    ac, db = client
    response = await ac.get("/threads?after=cursor_invalido")
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid cursor."


# ── GET /threads/{id} ────────────────────────────────────────

async def test_get_thread_ok(client):
    ac, db = client
    thread = make_thread({"_id": ObjectId(VALID_ID)})
    db.threads.find_one = AsyncMock(return_value=thread)

    response = await ac.get(f"/threads/{VALID_ID}")
    assert response.status_code == 200
    assert response.json()["title"] == "Thread de prueba"


async def test_get_thread_not_found(client):
    ac, db = client
    db.threads.find_one = AsyncMock(return_value=None)

    response = await ac.get(f"/threads/{VALID_ID}")
    assert response.status_code == 404


async def test_get_thread_invalid_id(client):
    ac, db = client
    response = await ac.get("/threads/id_invalido")
    assert response.status_code == 400


# ── POST /threads ────────────────────────────────────────────

async def test_create_thread_ok(client):
    ac, db = client
    new_id = ObjectId()
    category_id = str(ObjectId())

    # La categoría existe
    db.categories.find_one = AsyncMock(return_value={"_id": ObjectId(category_id)})
    db.threads.insert_one = AsyncMock(return_value=__import__("unittest.mock", fromlist=["MagicMock"]).MagicMock(inserted_id=new_id))

    payload = {
        "category_id": category_id,
        "title": "Nuevo thread",
        "content": "Contenido del thread",
        "tags": ["python"],
    }
    response = await ac.post("/threads", json=payload, headers=USER_HEADERS)
    assert response.status_code == 201
    assert response.json()["title"] == "Nuevo thread"


async def test_create_thread_missing_user(client):
    ac, db = client
    payload = {"category_id": str(ObjectId()), "title": "T", "content": "C", "tags": []}
    response = await ac.post("/threads", json=payload)  # sin header
    assert response.status_code == 401


async def test_create_thread_category_not_found(client):
    ac, db = client
    db.categories.find_one = AsyncMock(return_value=None)

    payload = {"category_id": str(ObjectId()), "title": "T", "content": "C", "tags": []}
    response = await ac.post("/threads", json=payload, headers=USER_HEADERS)
    assert response.status_code == 404
    assert response.json()["detail"] == "Category not found."


# ── PATCH /threads/{id} ──────────────────────────────────────

async def test_update_thread_ok(client):
    ac, db = client
    thread = make_thread({"_id": ObjectId(VALID_ID), "user_id": "user_abc"})
    updated = {**thread, "title": "Título actualizado"}
    db.threads.find_one = AsyncMock(side_effect=[thread, updated])

    response = await ac.patch(
        f"/threads/{VALID_ID}",
        json={"title": "Título actualizado"},
        headers=USER_HEADERS,
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Título actualizado"


async def test_update_thread_forbidden(client):
    ac, db = client
    thread = make_thread({"_id": ObjectId(VALID_ID), "user_id": "user_abc"})
    db.threads.find_one = AsyncMock(return_value=thread)

    response = await ac.patch(
        f"/threads/{VALID_ID}",
        json={"title": "Intento"},
        headers=OTHER_USER_HEADERS,  # otro usuario
    )
    assert response.status_code == 403


async def test_update_thread_no_fields(client):
    ac, db = client
    thread = make_thread({"_id": ObjectId(VALID_ID), "user_id": "user_abc"})
    db.threads.find_one = AsyncMock(return_value=thread)

    response = await ac.patch(f"/threads/{VALID_ID}", json={}, headers=USER_HEADERS)
    assert response.status_code == 400
    assert response.json()["detail"] == "No fields to update."


# ── DELETE /threads/{id} ─────────────────────────────────────

async def test_delete_thread_ok(client):
    ac, db = client
    thread = make_thread({"_id": ObjectId(VALID_ID), "user_id": "user_abc"})
    db.threads.find_one = AsyncMock(return_value=thread)

    response = await ac.delete(f"/threads/{VALID_ID}", headers=USER_HEADERS)
    assert response.status_code == 204
    db.threads.delete_one.assert_called_once()
    db.replies.delete_many.assert_called_once()


async def test_delete_thread_forbidden(client):
    ac, db = client
    thread = make_thread({"_id": ObjectId(VALID_ID), "user_id": "user_abc"})
    db.threads.find_one = AsyncMock(return_value=thread)

    response = await ac.delete(f"/threads/{VALID_ID}", headers=OTHER_USER_HEADERS)
    assert response.status_code == 403


# ── POST /threads/{id}/like ──────────────────────────────────

async def test_like_thread_ok(client):
    ac, db = client
    thread = make_thread({"_id": ObjectId(VALID_ID), "likes": ["user_abc"], "likes_count": 1})
    db.threads.find_one = AsyncMock(return_value=thread)

    response = await ac.post(f"/threads/{VALID_ID}/like", headers=USER_HEADERS)
    assert response.status_code == 200
    assert response.json()["likes_count"] == 1


async def test_like_thread_not_found(client):
    ac, db = client
    from unittest.mock import MagicMock
    db.threads.update_one = AsyncMock(return_value=MagicMock(matched_count=0))

    response = await ac.post(f"/threads/{VALID_ID}/like", headers=USER_HEADERS)
    assert response.status_code == 404