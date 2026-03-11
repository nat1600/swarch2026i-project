from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from schemas.common import PyObjectId


# ── Request schemas ──────────────────────────────────────────


class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str = Field("", max_length=500)


# ── Response schemas ─────────────────────────────────────────


class CategoryResponse(BaseModel):
    id: PyObjectId = Field(alias="_id")
    name: str
    description: str
    created_at: datetime

    model_config = {"populate_by_name": True}
