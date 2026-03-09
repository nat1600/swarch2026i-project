from datetime import datetime, timezone
from bson import ObjectId
from pydantic import BaseModel, Field


class ReviewHistoryDocument(BaseModel):
    """MongoDB document representing a single flashcard review event."""
    id: ObjectId = Field(default_factory=ObjectId, alias="_id")
    user_id: int = Field(comment="User who performed the review; references auth-service")
    phrase_id: int = Field(comment="Phrase reviewed; references PostgreSQL phrases table")
    grade: int = Field(comment="SM-2 grade given by the user (0-5)")
    easiness_factor: float = Field(comment="E-factor after this review")
    interval_days: int = Field(comment="Interval in days until next review")
    reviewed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {"arbitrary_types_allowed": True}