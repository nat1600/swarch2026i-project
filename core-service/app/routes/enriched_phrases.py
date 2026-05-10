from typing import List

import httpx
from fastapi import APIRouter, Query, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.dependencies import get_db, get_current_user_sub
from app.services.phrase_service import PhraseService

router = APIRouter(prefix='/enriched-phrases', tags=['enriched-phrases'])


class EnrichedPhraseOut(BaseModel):
    phrase_id: int
    word: str
    sentence: str
    correct_answer: str
    distractors: List[str]
    level: str
    language: str


@router.get("/", response_model=List[EnrichedPhraseOut])
async def get_enriched_phrases(
    phrase_ids: List[int] = Query(..., description="List of phrase IDs to look up"),
):
    url = f"{get_settings().enrichment_service_url}/enriched-phrases"
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params={"phrase_ids": phrase_ids}, timeout=10.0)
            response.raise_for_status()
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=str(e))
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Enrichment service unavailable: {e}")
    return response.json()


@router.post("/republish", status_code=202)
async def republish_all_for_enrichment(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_sub),
):
    service = PhraseService(db_session=db)
    phrases = service.get_all_phrases(user_id)
    published = 0
    for phrase in phrases:
        if getattr(phrase, 'active', True) and phrase.original_text:
            await service._publish_enrichment(phrase)
            published += 1
    return {"published": published, "message": f"Queued {published} phrases for enrichment"}
