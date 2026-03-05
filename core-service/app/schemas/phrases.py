from datetime import datetime

from pydantic import BaseModel, ConfigDict


class LanguageNested(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    name: str


class PhraseResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    active: bool
    source_language: LanguageNested
    target_language: LanguageNested
    user_id: int
    original_text: str
    translated_text: str
    pronunciation: str | None
    last_reviewed_date: datetime | None
    next_review_date: datetime | None
    created_at: datetime


class PhraseCreate(BaseModel):
    user_id: int
    source_language_id: int
    target_language_id: int
    original_text: str
    translated_text: str
    pronunciation: str | None = None