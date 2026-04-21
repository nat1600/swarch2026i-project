"""
Seed script for forum categories.

Usage:
    python -m scripts.seed_categories
"""

import asyncio
from datetime import datetime, timezone

from db.indexes import create_indexes
from db.mongo import close_db, connect_db, get_database

DEFAULT_CATEGORIES = [
    {
        "name": "General Discussion",
        "description": "Open discussion about language learning and community topics.",
    },
    {
        "name": "Grammar & Vocabulary",
        "description": "Questions and tips about grammar rules and vocabulary usage.",
    },
    {
        "name": "Pronunciation",
        "description": "Practice, feedback, and resources for pronunciation.",
    },
    {
        "name": "Language Exchange",
        "description": "Find language partners for conversation and writing practice.",
    },
    {
        "name": "Culture & Media",
        "description": "Discuss movies, series, songs, books, and cultural content.",
    },
]


async def seed_categories() -> tuple[int, int]:
    db = get_database()
    categories = db.categories

    inserted = 0
    existing = 0

    for category in DEFAULT_CATEGORIES:
        result = await categories.update_one(
            {"name": category["name"]},
            {
                "$setOnInsert": {
                    "name": category["name"],
                    "description": category["description"],
                    "created_at": datetime.now(timezone.utc),
                }
            },
            upsert=True,
        )

        if result.upserted_id is None:
            existing += 1
        else:
            inserted += 1

    return inserted, existing


async def main() -> None:
    await connect_db()
    await create_indexes()

    inserted, existing = await seed_categories()

    print("Forum categories seed complete")
    print(f"Inserted: {inserted}")
    print(f"Already existing: {existing}")

    await close_db()


if __name__ == "__main__":
    asyncio.run(main())
