from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ReviewHistoryCreate(BaseModel):
    user_id: int
    phrase_id: int
    grade: int
    easiness_factor: float
    interval_days: int


class ReviewHistoryResponse(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    id: str
    user_id: int
    phrase_id: int
    grade: int
    easiness_factor: float
    interval_days: int
    reviewed_at: datetime