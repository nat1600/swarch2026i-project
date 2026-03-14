"""
Seed script for local development.
Populates PostgreSQL and MongoDB with realistic test data.

Usage:
    python -m scripts.seed_dev_data
"""

import sys
import asyncio
from pathlib import Path
from decimal import Decimal
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import get_settings
from app.models.language import Language
from app.models.phrase import Phrase, ReviewData
from app.models.review import ReviewSession, ReviewSessionPhrase


sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# ---------------------------------------------------------------------------
# Seed data
# ---------------------------------------------------------------------------

USERS = ["user1", "user2", "user3"]

LANGUAGES = [
    {"name": "English"},
    {"name": "French"},
    {"name": "Spanish"},
    {"name": "Japanese"},
]

now = datetime.now(timezone.utc)


def _phrases(lang_map: dict[str, int]) -> list[dict]:
    """Return phrase dicts. lang_map maps language name -> id."""
    en, fr, es, ja = (
        lang_map["English"],
        lang_map["French"],
        lang_map["Spanish"],
        lang_map["Japanese"],
    )
    return [
        # user1: learning French from English
        {"user_id": "user1", "source_language_id": fr, "target_language_id": en,
         "original_text": "bonjour", "translated_text": "hello",
         "pronunciation": "bɔ̃.ʒuʁ",
         "last_reviewed_date": now - timedelta(days=1),
         "next_review_date": now + timedelta(days=3)},
        {"user_id": "user1", "source_language_id": fr, "target_language_id": en,
         "original_text": "merci beaucoup", "translated_text": "thank you very much",
         "pronunciation": "mɛʁ.si bo.ku",
         "last_reviewed_date": now - timedelta(days=2),
         "next_review_date": now + timedelta(days=1)},
        {"user_id": "user1", "source_language_id": fr, "target_language_id": en,
         "original_text": "je ne sais pas", "translated_text": "I don't know",
         "pronunciation": "ʒə nə sɛ pa"},
        {"user_id": "user1", "source_language_id": fr, "target_language_id": en,
         "original_text": "s'il vous plaît", "translated_text": "please",
         "pronunciation": "sil vu plɛ"},
        {"user_id": "user1", "source_language_id": fr, "target_language_id": en,
         "original_text": "au revoir", "translated_text": "goodbye",
         "pronunciation": "o ʁə.vwaʁ"},

        # user2: learning Spanish from English
        {"user_id": "user2", "source_language_id": es, "target_language_id": en,
         "original_text": "buenos días", "translated_text": "good morning",
         "pronunciation": "ˈbwe.nos ˈdi.as",
         "last_reviewed_date": now - timedelta(hours=6),
         "next_review_date": now + timedelta(days=5)},
        {"user_id": "user2", "source_language_id": es, "target_language_id": en,
         "original_text": "¿cómo estás?", "translated_text": "how are you?",
         "pronunciation": "ˈko.mo esˈtas"},
        {"user_id": "user2", "source_language_id": es, "target_language_id": en,
         "original_text": "muchas gracias", "translated_text": "thank you very much"},
        {"user_id": "user2", "source_language_id": es, "target_language_id": en,
         "original_text": "no entiendo", "translated_text": "I don't understand"},
        {"user_id": "user2", "source_language_id": es, "target_language_id": en,
         "original_text": "hasta luego", "translated_text": "see you later"},

        # user3: learning Japanese from English
        {"user_id": "user3", "source_language_id": ja, "target_language_id": en,
         "original_text": "ありがとう", "translated_text": "thank you",
         "pronunciation": "arigatou",
         "last_reviewed_date": now - timedelta(days=3),
         "next_review_date": now + timedelta(days=7)},
        {"user_id": "user3", "source_language_id": ja, "target_language_id": en,
         "original_text": "おはようございます", "translated_text": "good morning",
         "pronunciation": "ohayou gozaimasu"},
        {"user_id": "user3", "source_language_id": ja, "target_language_id": en,
         "original_text": "すみません", "translated_text": "excuse me",
         "pronunciation": "sumimasen"},
        {"user_id": "user3", "source_language_id": ja, "target_language_id": en,
         "original_text": "お願いします", "translated_text": "please",
         "pronunciation": "onegaishimasu"},
        {"user_id": "user3", "source_language_id": ja, "target_language_id": en,
         "original_text": "さようなら", "translated_text": "goodbye",
         "pronunciation": "sayounara"},
    ]


# ReviewData for phrases that have been reviewed (indices 0, 1, 5, 10)
REVIEW_DATA_FOR_PHRASES = {
    0: {"repetition_number": 3, "easiness_factor": Decimal("2.3600"),
        "inner_repetition_interval": 8},
    1: {"repetition_number": 2, "easiness_factor": Decimal("2.5000"),
        "inner_repetition_interval": 6},
    5: {"repetition_number": 4, "easiness_factor": Decimal("2.1000"),
        "inner_repetition_interval": 15},
    10: {"repetition_number": 1, "easiness_factor": Decimal("2.5000"),
         "inner_repetition_interval": 1},
}


# ---------------------------------------------------------------------------
# PostgreSQL seeding
# ---------------------------------------------------------------------------

def seed_postgres(database_url: str) -> None:
    engine = create_engine(database_url)
    session_maker = sessionmaker(bind=engine, autoflush=False)

    with session_maker() as session:
        # Check if data already exists
        existing = session.query(Language).first()
        if existing:
            print("[PG] Data already seeded, skipping.")
            return

        # Languages
        languages = [Language(**lang) for lang in LANGUAGES]
        session.add_all(languages)
        session.flush()  # populate ids

        lang_map = {lang.name: lang.id for lang in languages}

        # Phrases
        phrase_dicts = _phrases(lang_map)
        phrases = [Phrase(**p) for p in phrase_dicts]
        session.add_all(phrases)
        session.flush()

        # ReviewData (only for phrases that have review dates)
        for idx, rd_kwargs in REVIEW_DATA_FOR_PHRASES.items():
            rd = ReviewData(phrase_id=phrases[idx].id, **rd_kwargs)
            session.add(rd)
        session.flush()

        # ReviewSessions + attempts
        # user1 did one session reviewing phrases 0 and 1
        rs1 = ReviewSession(user_id="user1")
        session.add(rs1)
        session.flush()

        session.add_all([
            ReviewSessionPhrase(
                review_session_id=rs1.id, phrase_id=phrases[0].id,
                try_number=0, response_time=2300, recall_rating=4,
            ),
            ReviewSessionPhrase(
                review_session_id=rs1.id, phrase_id=phrases[1].id,
                try_number=0, response_time=4100, recall_rating=3,
            ),
        ])

        # user2 did one session reviewing phrase 5
        rs2 = ReviewSession(user_id="user2")
        session.add(rs2)
        session.flush()

        session.add(
            ReviewSessionPhrase(
                review_session_id=rs2.id, phrase_id=phrases[5].id,
                try_number=0, response_time=1800, recall_rating=5,
            )
        )

        # user3 did one session reviewing phrase 10, two tries
        rs3 = ReviewSession(user_id="user3")
        session.add(rs3)
        session.flush()

        session.add_all([
            ReviewSessionPhrase(
                review_session_id=rs3.id, phrase_id=phrases[10].id,
                try_number=0, response_time=6500, recall_rating=2,
            ),
            ReviewSessionPhrase(
                review_session_id=rs3.id, phrase_id=phrases[10].id,
                try_number=1, response_time=3200, recall_rating=4,
            ),
        ])

        session.commit()
        print(f"[PG] Seeded: {len(languages)} languages, {len(phrases)} phrases, "
              f"{len(REVIEW_DATA_FOR_PHRASES)} review_data, 3 sessions.")

    engine.dispose()


# ---------------------------------------------------------------------------
# MongoDB seeding
# ---------------------------------------------------------------------------

async def seed_mongo(mongo_url: str, mongo_db_name: str) -> None:
    client = AsyncIOMotorClient(mongo_url)
    db = client[mongo_db_name]
    collection = db["review_history"]

    existing = await collection.count_documents({})
    if existing > 0:
        print("[Mongo] Data already seeded, skipping.")
        client.close()
        return

    documents = [
        # user1 reviews
        {"user_id": "user1", "phrase_id": 1, "grade": 4,
         "easiness_factor": 2.36, "interval_days": 8,
         "reviewed_at": now - timedelta(days=1)},
        {"user_id": "user1", "phrase_id": 2, "grade": 3,
         "easiness_factor": 2.50, "interval_days": 6,
         "reviewed_at": now - timedelta(days=2)},

        # user2 reviews
        {"user_id": "user2", "phrase_id": 6, "grade": 5,
         "easiness_factor": 2.10, "interval_days": 15,
         "reviewed_at": now - timedelta(hours=6)},

        # user3 reviews (two attempts)
        {"user_id": "user3", "phrase_id": 11, "grade": 2,
         "easiness_factor": 2.50, "interval_days": 1,
         "reviewed_at": now - timedelta(days=3)},
        {"user_id": "user3", "phrase_id": 11, "grade": 4,
         "easiness_factor": 2.50, "interval_days": 1,
         "reviewed_at": now - timedelta(days=3, hours=-1)},
    ]

    await collection.insert_many(documents)
    print(f"[Mongo] Seeded: {len(documents)} review_history documents.")
    client.close()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    settings = get_settings()

    print("Seeding PostgreSQL...")
    seed_postgres(settings.database_url)

    print("Seeding MongoDB...")
    asyncio.run(seed_mongo(settings.mongo_url, settings.mongo_db))

    print("Done!")


if __name__ == "__main__":
    main()
