from datetime import datetime, timezone
from enum import Enum
from bson import ObjectId
from pydantic import BaseModel, Field


class Source(str, Enum):
    """Supported content sources a post can reference."""
    NETFLIX = "Netflix"
    WEB_PAGE = "WebPage"
    SPOTIFY = "Spotify"
    BOOK = "Book"


class PostDocument(BaseModel):
    """MongoDB document representing a forum post."""
    id: ObjectId = Field(default_factory=ObjectId, alias="_id")
    user_id: int = Field(comment="Owner of this post; references a user in the auth-service")
    title: str
    body: str
    tags: list[str] | None = None
    source_language: str | None = Field(default=None, comment="Language being discussed e.g. english")
    source: Source | None = Field(default=None, comment="Content source the post references")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {"arbitrary_types_allowed": True}


class ReplyDocument(BaseModel):
    """MongoDB document representing a reply to a forum post."""
    id: ObjectId = Field(default_factory=ObjectId, alias="_id")
    post_id: ObjectId = Field(comment="Post this reply belongs to")
    user_id: int = Field(comment="Owner of this reply; references a user in the auth-service")
    body: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {"arbitrary_types_allowed": True}