from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from schemas.common import PyObjectId


# ── Request schemas ──────────────────────────────────────────


class ThreadCreate(BaseModel):
    category_id: str = Field(...)
    title: str = Field(..., min_length=1, max_length=300)
    content: str = Field(..., min_length=1)
    tags: Optional[List[str]] = Field(default=[])


class ThreadUpdate(BaseModel):
    """All fields optional — used for PATCH (partial update)."""

    title: Optional[str] = Field(None, min_length=1, max_length=300)
    content: Optional[str] = Field(None, min_length=1)
    tags: Optional[List[str]] = None


# ── Response schemas ─────────────────────────────────────────


class ThreadResponse(BaseModel):
    id: PyObjectId = Field(alias="_id")
    category_id: str
    user_id: str
    title: str
    content: str
    tags: List[str] = []
    likes: List[str] = []
    likes_count: int = 0
    replies_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"populate_by_name": True}
