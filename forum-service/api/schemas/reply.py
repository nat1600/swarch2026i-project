from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from schemas.common import PyObjectId


# ── Request schemas ──────────────────────────────────────────


class ReplyCreate(BaseModel):
    content: str = Field(..., min_length=1)
    parent_reply_id: Optional[str] = Field(
        None,
        description="If set, this reply is a response to another reply (nested).",
    )


class ReplyUpdate(BaseModel):
    """Only content can be edited — used for PATCH."""

    content: Optional[str] = Field(None, min_length=1)


# ── Response schemas ─────────────────────────────────────────


class ReplyResponse(BaseModel):
    id: PyObjectId = Field(alias="_id")
    thread_id: str
    user_id: str
    content: str
    parent_reply_id: Optional[str] = None
    likes: List[str] = []
    likes_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"populate_by_name": True}
