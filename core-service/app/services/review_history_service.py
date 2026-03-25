from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.review_history import ReviewHistoryDocument
from app.schemas.review_history import ReviewHistoryCreate


class ReviewHistoryService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db

    async def log_review(self, data: ReviewHistoryCreate, user_id: str) -> dict:
        data = data.model_dump()
        data['user_id'] = user_id
        doc = ReviewHistoryDocument(**data)
        document = doc.model_dump(by_alias=True)
        await self.db.review_history.insert_one(document)
        return document

    async def get_history_by_user(self, user_id: str) -> list[dict]:
        cursor = self.db.review_history.find({"user_id": user_id})
        return await cursor.to_list(length=100)

    async def get_history_by_phrase(self, phrase_id: int) -> list[dict]:
        cursor = self.db.review_history.find({"phrase_id": phrase_id})
        return await cursor.to_list(length=100)
