from sqlalchemy.orm import mapped_column, Mapped
from sqlalchemy import ForeignKey, SmallInteger, CheckConstraint

from app.models.base import Base


class ReviewSession(Base):
    __tablename__ = 'review_sessions'

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(index=True)


class ReviewSessionPhrase(Base):
    __tablename__ = 'review_sessions_phrase'

    id: Mapped[int] = mapped_column(primary_key=True)
    review_session_id: Mapped[int] = mapped_column(ForeignKey('review_sessions.id'))
    phrase_id: Mapped[int] = mapped_column(ForeignKey('phrases.id'))
    try_number: Mapped[int] = mapped_column(SmallInteger)
    response_time: Mapped[int] = mapped_column()
    recall_rating: Mapped[int] = mapped_column(SmallInteger)

    __table_args__ = (
        CheckConstraint("try_number >= 0", name="ck_review_session_try_number"),
        CheckConstraint('response_time >= 0', name='ck_review_session_response_time'),
        CheckConstraint(
            "recall_rating BETWEEN 0 AND 5", name='ck_review_session_recall_rating'
        )
    )
