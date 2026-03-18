# tests/conftest.py
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import AsyncClient, ASGITransport
from bson import ObjectId

from app import app  # tu instancia FastAPI


def make_thread(overrides: dict = {}) -> dict:
    """Factory: devuelve un documento de thread válido."""
    doc = {
        "_id": ObjectId(),
        "category_id": str(ObjectId()),
        "user_id": "user_abc",
        "title": "Thread de prueba",
        "content": "Contenido de prueba",
        "tags": ["python", "fastapi"],
        "likes": [],
        "likes_count": 0,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": None,
    }
    doc.update(overrides)
    return doc


@pytest.fixture
def mock_db():
    """Mock completo de la base de datos."""
    db = MagicMock()

    # Mock de la colección threads
    db.threads.find_one = AsyncMock(return_value=None)
    db.threads.insert_one = AsyncMock(return_value=MagicMock(inserted_id=ObjectId()))
    db.threads.update_one = AsyncMock(return_value=MagicMock(matched_count=1))
    db.threads.delete_one = AsyncMock(return_value=None)

    # Mock del cursor para .find()
    mock_cursor = MagicMock()
    mock_cursor.sort.return_value = mock_cursor
    mock_cursor.limit.return_value = mock_cursor
    mock_cursor.to_list = AsyncMock(return_value=[])
    db.threads.find.return_value = mock_cursor

    # Mock de otras colecciones
    db.categories.find_one = AsyncMock(return_value=None)
    db.replies.delete_many = AsyncMock(return_value=None)

    return db


@pytest.fixture
async def client(mock_db):
    """Cliente HTTP con la DB mockeada."""
    with patch("routes.threads.get_database", return_value=mock_db):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as ac:
            yield ac, mock_db  # devuelve ambos para poder hacer asserts sobre el mock