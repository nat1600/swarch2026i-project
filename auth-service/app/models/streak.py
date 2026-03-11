from sqlalchemy.orm import mapped_column, Mapped
from sqlalchemy import ForeignKey, SmallInteger, CheckConstraint

from app.models.base import Base


class Streak(Base):
    """Daily learning streak counters for a user. One row per user."""

    __tablename__ = 'streaks'

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey('users.id'), comment="User this streak record belongs to"
    )
    current_streak: Mapped[int] = mapped_column(
        SmallInteger, server_default='0',
        comment="Number of consecutive days the user has completed at least one review"
    )
    longest_streak: Mapped[int] = mapped_column(
        SmallInteger, server_default='0',
        comment="All-time longest consecutive-day streak the user has achieved"
    )

    __table_args__ = (
        CheckConstraint("current_streak >= 0", name="ck_users_current_streak"),
        CheckConstraint("longest_streak >= 0", name="ck_users_longest_streak")
    )
