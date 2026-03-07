from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.post import Source


class PostCreate(BaseModel):
    user_id: int
    title: str
    body: str
    tags: list[str] | None = None
    source_language: str | None = None
    source: Source | None = None


class PostResponse(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    id: str
    user_id: int
    title: str
    body: str
    tags: list[str] | None
    source_language: str | None
    source: Source | None
    created_at: datetime


class ReplyCreate(BaseModel):
    user_id: int
    body: str


class ReplyResponse(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    id: str
    post_id: str
    user_id: int
    body: str
    created_at: datetime