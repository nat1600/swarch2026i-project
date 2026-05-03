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


async def save(document: dict) -> None:

    collection = get_db()
    await collection.replace_one(
        {"phrase_id": document["phrase_id"]},
        document,
        upsert=True,
    )
    logger.info(f"MongoDB: guardado phrase_id={document['phrase_id']}")


async def close() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None