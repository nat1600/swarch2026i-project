from decimal import Decimal
from datetime import datetime

from sqlalchemy.orm import mapped_column, Mapped, relationship
from sqlalchemy import TIMESTAMP, ForeignKey, CheckConstraint, Numeric

from app.models.base import Base
from app.models.language import Language
class Phrase(Base):
    """A vocabulary entry captured by a user from subtitles or other sources."""

    __tablename__ = 'phrases'

    id: Mapped[int] = mapped_column(primary_key=True)
    active: Mapped[bool] = mapped_column(
        server_default='true',
        comment="Soft-delete flag; false means the phrase is hidden from the user"
    )
    source_language_id: Mapped[int] = mapped_column(
        ForeignKey('languages.id'), comment="Language the phrase was captured from"
    )
    target_language_id: Mapped[int] = mapped_column(
        ForeignKey('languages.id'),
        comment="Language the user already knows (used for the translation)"
    )
    user_id: Mapped[int] = mapped_column(
        index=True, comment="Owner of this phrase; references a user in the auth-service"
    )
    original_text: Mapped[str] = mapped_column(
        comment="Text in the source language as it was captured"
    )
    translated_text: Mapped[str] = mapped_column(
        comment="Translation of the phrase in the target language"
    )
    pronunciation: Mapped[str | None] = mapped_column(
        comment="Optional phonetic guide (e.g. IPA or romaji)"
    )
    last_reviewed_date: Mapped[datetime | None] = mapped_column(
        TIMESTAMP(timezone=True),
        comment="Timestamp of the most recent review session that included this phrase"
    )
    next_review_date: Mapped[datetime | None] = mapped_column(
        TIMESTAMP(timezone=True),
        comment="SM-2 scheduled date for the next review; null until the first review "
                "is completed"
    )

    source_language: Mapped["Language"] = relationship(
        foreign_keys=[source_language_id]
    )
    target_language: Mapped["Language"] = relationship(
        foreign_keys=[target_language_id]
    )


class ReviewData(Base):
    """
    SM-2 algorithm state for a single phrase. One row per phrase, updated after every
    review.
    """

    __tablename__ = 'review_data'

    id: Mapped[int] = mapped_column(primary_key=True)
    phrase_id: Mapped[int] = mapped_column(
        ForeignKey('phrases.id'), comment="Phrase this scheduling data belongs to"
    )
    repetition_number: Mapped[int] = mapped_column(
        server_default='0',
        comment="Number of consecutive successful reviews "
                "(resets to 0 on a failing grade)"
    )
    easiness_factor: Mapped[Decimal] = mapped_column(
        Numeric(5, 4), server_default='2.5',
        comment="SM-2 E-factor controlling how fast the interval grows; "
                "clamped to [1.3, 2.5]"
    )
    inner_repetition_interval: Mapped[int] = mapped_column(
        server_default='0', comment="Current inter-repetition interval in days"
    )

    __table_args__ = (
        CheckConstraint(
            'repetition_number >= 0', name='ck_review_data_repetition_number'
        ),
        CheckConstraint(
            'easiness_factor BETWEEN 1.3 AND 2.5', name='ck_review_data_easiness_factor'
        )
    )
