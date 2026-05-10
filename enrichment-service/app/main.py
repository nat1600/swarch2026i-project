import asyncio
from contextlib import asynccontextmanager
from typing import List

from fastapi import FastAPI, Query
from pydantic import BaseModel

from app.enricher import main as run_consumer
from app.mongo_client import get_db, close as close_mongo


class EnrichedPhraseOut(BaseModel):
    phrase_id: int
    word: str
    sentence: str
    correct_answer: str
    distractors: List[str]
    level: str
    language: str


@asynccontextmanager
async def lifespan(app: FastAPI):
    consumer_task = asyncio.create_task(run_consumer())
    yield
    consumer_task.cancel()
    await close_mongo()


app = FastAPI(title="Enrichment Service", lifespan=lifespan)


@app.get("/health")
def health():
    return {"status": "ok", "service": "enrichment-service"}


@app.get("/enriched-phrases", response_model=List[EnrichedPhraseOut])
async def get_enriched_phrases(
    phrase_ids: List[int] = Query(..., description="List of phrase IDs to look up"),
):
    col = get_db()
    cursor = col.find({"phrase_id": {"$in": phrase_ids}}, {"_id": 0})
    docs = await cursor.to_list(length=None)
    return docs
