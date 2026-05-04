# app/mongo_client.py
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import get_settings

logger = logging.getLogger(__name__)

_client = None


def get_db():
    global _client
    if _client is None:
        settings = get_settings()
        _client = AsyncIOMotorClient(settings.mongo_url)
    settings = get_settings()
    return _client[settings.mongo_db][settings.mongo_collection]


async def word_exists(phrase_id: int, word: str) -> bool:
    """
    Checks if a word for a given phrase_id already exists in MongoDB.
    The unique key is the combination (phrase_id, word).
    """
    collection = get_db()
    doc = await collection.find_one({"phrase_id": phrase_id, "word": word})
    return doc is not None


async def save(document: dict) -> None:
    """
    Saves or updates a document in MongoDB.
    Upsert based on (phrase_id, word) composite key.
    """
    collection = get_db()
    await collection.replace_one(
        {"phrase_id": document["phrase_id"], "word": document["word"]},
        document,
        upsert=True,
    )
    logger.info(
        f"MongoDB: guardado phrase_id={document['phrase_id']} word='{document['word']}'"
    )


async def close() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None