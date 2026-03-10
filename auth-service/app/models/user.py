from datetime import datetime

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, String, CheckConstraint, Index, DateTime

from app.models.base import Base


class User(Base):
    """
    Registered application user; stores identity, language preferences, and
    gamification state.
    """

    __tablename__ = 'users'

    id: Mapped[int] = mapped_column(primary_key=True)
    auth0_id: Mapped[str] = mapped_column(
        String(128), unique=True, index=True
    )
    native_language_id: Mapped[int | None] = mapped_column(
        ForeignKey('languages.id'), comment="Language the user already speaks natively",
        default=None
    )
    learning_language_id: Mapped[int | None] = mapped_column(
        ForeignKey('languages.id'), comment="Language the user is currently learning",
        default=None
    )
    active: Mapped[bool] = mapped_column(
        server_default='true',
        comment="Soft-delete flag; false means the account is deactivated"
    )
    email: Mapped[str] = mapped_column(unique=True)
    email_verified: Mapped[bool] = mapped_column(default=True)
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
    last_login_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        comment="Last time the endpoint /users/exists was called."
    )

    native_language: Mapped["Language"] = relationship(
        foreign_keys=[native_language_id],lazy="raise"
    )
    learning_language: Mapped["Language"] = relationship(
        foreign_keys=[learning_language_id], lazy="raise"
    )

    __table_args__ = (
        CheckConstraint("accumulated_points >= 0", name="ck_users_accumulated_points"),
        Index('idx_active_users', 'id', postgresql_where=(active == True))
    )
