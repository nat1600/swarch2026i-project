from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.dependencies import get_db
from app.schemas.post import PostCreate, PostResponse, ReplyCreate, ReplyResponse
from app.services.post_service import PostService

router = APIRouter(prefix='/posts', tags=['posts'])


def serialize(doc: dict) -> dict:
    """Convert ObjectId fields to str for Pydantic serialization."""
    doc['id'] = str(doc.pop('_id'))
    if 'post_id' in doc:
        doc['post_id'] = str(doc['post_id'])
    return doc


@router.get('/', response_model=list[PostResponse])
async def get_posts(db: AsyncIOMotorDatabase = Depends(get_db)):
    service = PostService(db)
    posts = await service.get_all_posts()
    return [serialize(p) for p in posts]


@router.get('/{post_id}', response_model=PostResponse)
async def get_post(post_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    service = PostService(db)
    post = await service.get_post_by_id(post_id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    return serialize(post)


@router.post('/', response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(body: PostCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    service = PostService(db)
    return serialize(await service.create_post(body))


@router.get('/{post_id}/replies', response_model=list[ReplyResponse])
async def get_replies(post_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    service = PostService(db)
    replies = await service.get_replies_by_post(post_id)
    return [serialize(r) for r in replies]


@router.post('/{post_id}/replies', response_model=ReplyResponse, status_code=status.HTTP_201_CREATED)
async def create_reply(post_id: str, body: ReplyCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    service = PostService(db)
    return serialize(await service.create_reply(post_id, body))