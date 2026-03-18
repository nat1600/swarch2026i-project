from decimal import Decimal
from datetime import datetime

from sqlalchemy.orm import mapped_column, Mapped, relationship
from sqlalchemy import TIMESTAMP, ForeignKey, CheckConstraint, Numeric

from app.models.base import Base


class Phrase(Base):
    __tablename__ = 'phrases'

    id: Mapped[int] = mapped_column(primary_key=True)
    active: Mapped[bool] = mapped_column(server_default='true')
    source_language_id: Mapped[int] = mapped_column(ForeignKey('languages.id'))
    target_language_id: Mapped[int] = mapped_column(ForeignKey('languages.id'))
    user_id: Mapped[int] = mapped_column(index=True)
    original_text: Mapped[str] = mapped_column()
    translated_text: Mapped[str] = mapped_column()
    pronunciation: Mapped[str | None] = mapped_column()
    last_reviewed_date: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    next_review_date: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))

    source_language: Mapped["Language"] = relationship(
        foreign_keys=[source_language_id]
    )
    target_language: Mapped["Language"] = relationship(
        foreign_keys=[target_language_id]
    )


class ReviewData(Base):
    __tablename__ = 'review_data'

    id: Mapped[int] = mapped_column(primary_key=True)
    phrase_id: Mapped[int] = mapped_column(ForeignKey('phrases.id'))
    repetition_number: Mapped[int] = mapped_column(server_default='0')
    easiness_factor: Mapped[Decimal] = mapped_column(Numeric(5, 4), server_default='2.5')
    inner_repetition_interval: Mapped[int] = mapped_column(server_default='0')

    __table_args__ = (
        CheckConstraint(
            'repetition_number >= 0', name='ck_review_data_repetition_number'
        ),
        CheckConstraint(
            'easiness_factor BETWEEN 1.3 AND 2.5', name='ck_review_data_easiness_factor'
        )
    )
