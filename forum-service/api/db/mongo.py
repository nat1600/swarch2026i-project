import os

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME: str = os.getenv("DB_NAME", "forum_db")

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
