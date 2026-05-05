from typing import List

from fastapi import APIRouter, Query, Request, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user_sub
from app.services.phrase_service import PhraseService

router = APIRouter(prefix='/enriched-phrases', tags=['enriched-phrases'])

ENRICHMENT_DB = "enrichment_db"
ENRICHMENT_COLLECTION = "enriched_phrases"


class EnrichedPhraseOut(BaseModel):
    phrase_id: int
    word: str
    sentence: str
    correct_answer: str
    distractors: List[str]
    level: str
    language: str


def _enrichment_col(request: Request):
    """Return the enrichment collection using the same MongoClient as core-service."""
    # request.app.state.mongo_db is already an AsyncIOMotorDatabase for core_db,
    # but the underlying client can access any database on the same instance.
    core_db = request.app.state.mongo_db
    client: AsyncIOMotorClient = core_db.client
    return client[ENRICHMENT_DB][ENRICHMENT_COLLECTION]


@router.get("/", response_model=List[EnrichedPhraseOut])
async def get_enriched_phrases(
    request: Request,
    phrase_ids: List[int] = Query(..., description="List of phrase IDs to look up"),
):
    col = _enrichment_col(request)
    cursor = col.find({"phrase_id": {"$in": phrase_ids}}, {"_id": 0})
    docs = await cursor.to_list(length=None)
    return docs


@router.post("/republish", status_code=202)
async def republish_all_for_enrichment(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_sub),
):
    """
    Re-publishes all active phrases for the current user to the enrichment queue.
    Use this to backfill phrases that were saved before the enrichment pipeline was wired up.
    """
    service = PhraseService(db_session=db)
    phrases = service.get_all_phrases(user_id)
    published = 0
    for phrase in phrases:
        if getattr(phrase, 'active', True) and phrase.original_text:
            await service._publish_enrichment(phrase)
            published += 1
    return {"published": published, "message": f"Queued {published} phrases for enrichment"}
