from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import ForeignKey, String, CheckConstraint, Index

from app.models.base import Base


class User(Base):
    """
    Registered application user; stores identity, language preferences, and
    gamification state.
    """

    __tablename__ = 'users'

    id: Mapped[int] = mapped_column(primary_key=True)
    native_language_id: Mapped[int] = mapped_column(
        ForeignKey('languages.id'), comment="Language the user already speaks natively"
    )
    learning_language_id: Mapped[int] = mapped_column(
        ForeignKey('languages.id'), comment="Language the user is currently learning"
    )
    active: Mapped[bool] = mapped_column(
        server_default='true',
        comment="Soft-delete flag; false means the account is deactivated"
    )
    email: Mapped[str] = mapped_column(unique=True)
    username: Mapped[str] = mapped_column(unique=True)
    timezone: Mapped[str] = mapped_column(
        String(255),
        comment="IANA timezone identifier used to calculate daily streak "
                "boundaries (e.g. 'America/New_York')"
    )
    accumulated_points: Mapped[int] = mapped_column(
        server_default='0',
        comment="Total gamification points earned across all review sessions"
    )

    __table_args__ = (
        CheckConstraint("accumulated_points >= 0", name="ck_users_accumulated_points"),
        Index('idx_active_users', 'id', postgresql_where=(active == True))
    )
