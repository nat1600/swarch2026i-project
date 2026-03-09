from fastapi import APIRouter, Depends, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.dependencies import get_mongo_db
from app.schemas.review_history import ReviewHistoryCreate, ReviewHistoryResponse
from app.services.review_history_service import ReviewHistoryService

router = APIRouter(prefix='/review-history', tags=['review-history'])


def serialize(doc: dict) -> dict:
    """Convert ObjectId to str for Pydantic serialization."""
    doc['id'] = str(doc.pop('_id'))
    return doc


@router.post('/', response_model=ReviewHistoryResponse, status_code=status.HTTP_201_CREATED)
async def log_review(body: ReviewHistoryCreate, db: AsyncIOMotorDatabase = Depends(get_mongo_db)):
    service = ReviewHistoryService(db)
    return serialize(await service.log_review(body))


@router.get('/user/{user_id}', response_model=list[ReviewHistoryResponse])
async def get_history_by_user(user_id: int, db: AsyncIOMotorDatabase = Depends(get_mongo_db)):
    service = ReviewHistoryService(db)
    history = await service.get_history_by_user(user_id)
    return [serialize(h) for h in history]


@router.get('/phrase/{phrase_id}', response_model=list[ReviewHistoryResponse])
async def get_history_by_phrase(phrase_id: int, db: AsyncIOMotorDatabase = Depends(get_mongo_db)):
    service = ReviewHistoryService(db)
    history = await service.get_history_by_phrase(phrase_id)
    return [serialize(h) for h in history]