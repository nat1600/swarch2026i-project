from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.post import PostDocument, ReplyDocument
from app.schemas.post import PostCreate, ReplyCreate


class PostService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db

    async def get_all_posts(self) -> list[dict]:
        cursor = self.db.forum_posts.find()
        return await cursor.to_list(length=100)

    async def get_post_by_id(self, post_id: str) -> dict | None:
        return await self.db.forum_posts.find_one({"_id": ObjectId(post_id)})

    async def create_post(self, data: PostCreate) -> dict:
        post = PostDocument(**data.model_dump())
        doc = post.model_dump(by_alias=True)
        await self.db.forum_posts.insert_one(doc)
        return doc

    async def get_replies_by_post(self, post_id: str) -> list[dict]:
        cursor = self.db.forum_replies.find({"post_id": ObjectId(post_id)})
        return await cursor.to_list(length=100)

    async def create_reply(self, post_id: str, data: ReplyCreate) -> dict:
        reply = ReplyDocument(post_id=ObjectId(post_id), **data.model_dump())
        doc = reply.model_dump(by_alias=True)
        await self.db.forum_replies.insert_one(doc)
        return doc