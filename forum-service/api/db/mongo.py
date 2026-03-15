import os

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from settings.settings import settings



MONGO_URI: str = settings.LOCAL_URI if settings.ENV == "local" else settings.get_mongo_uri
DB_NAME: str = settings.DB_NAME

client: AsyncIOMotorClient | None = None


def get_database():
    """Return the database instance. Call after connect_db()."""
    if client is None:
        raise RuntimeError(
            "Database client is not initialised. Call connect_db() first."
        )
    return client[DB_NAME]


async def connect_db() -> None:
    """Create the Motor client and verify the connection."""
    global client
    client = AsyncIOMotorClient(MONGO_URI)
    # Ping to verify the connection is alive
    await client.admin.command("ping")
    print(f"Connected to MongoDB at {MONGO_URI} — database: {DB_NAME}")


async def close_db() -> None:
    """Close the Motor client."""
    global client
    if client is not None:
        client.close()
        client = None
        print("MongoDB connection closed.")
