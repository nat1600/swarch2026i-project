from sqlalchemy.orm import mapped_column, Mapped
from sqlalchemy import ForeignKey, SmallInteger, CheckConstraint

from app.models.base import Base


class ReviewSession(Base):
    """
    A single study session initiated by a user, grouping one or more phrase attempts.
    """

    __tablename__ = 'review_sessions'

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        index=True, comment="User who started this session; references auth-service"
    )


class ReviewSessionPhrase(Base):
    """
    One attempt at a phrase inside a review session. Multiple tries per phrase per
    session are allowed.
    """

    __tablename__ = 'review_sessions_phrase'

    id: Mapped[int] = mapped_column(primary_key=True)
    review_session_id: Mapped[int] = mapped_column(
        ForeignKey('review_sessions.id'), comment="Session this attempt belongs to"
    )
    phrase_id: Mapped[int] = mapped_column(
        ForeignKey('phrases.id'), comment="Phrase that was shown to the user"
    )
    try_number: Mapped[int] = mapped_column(
        SmallInteger, comment="Attempt index within the session, starting at 0"
    )
    response_time: Mapped[int] = mapped_column(
        comment="Time the user took to answer, in milliseconds"
    )
    recall_rating: Mapped[int] = mapped_column(
        SmallInteger,
        comment="SM-2 quality of recall: 0 (complete blackout) to 5 (perfect recall)"
    )

    __table_args__ = (
        CheckConstraint("try_number >= 0", name="ck_review_session_try_number"),
        CheckConstraint('response_time >= 0', name='ck_review_session_response_time'),
        CheckConstraint(
            "recall_rating BETWEEN 0 AND 5", name='ck_review_session_recall_rating'
        )
    )
