"""Fix constraint names and add unique constraint on streaks.user_id

Revision ID: f1a2b3c4d5e6
Revises: a3f9c812d547
Create Date: 2026-03-14 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, Sequence[str], None] = 'a3f9c812d547'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE users RENAME CONSTRAINT"
        " ck_users_ck_users_accumulated_points TO ck_users_accumulated_points"
    )
    op.execute(
        "ALTER TABLE streaks RENAME CONSTRAINT"
        " ck_streaks_ck_users_current_streak TO ck_streaks_current_streak"
    )
    op.execute(
        "ALTER TABLE streaks RENAME CONSTRAINT"
        " ck_streaks_ck_users_longest_streak TO ck_streaks_longest_streak"
    )

    op.create_unique_constraint(
        op.f("uq_streaks_user_id"), "streaks", ["user_id"]
    )

    op.alter_column(
        "users", "email_verified",
        server_default="false",
    )


def downgrade() -> None:
    op.alter_column(
        "users", "email_verified",
        server_default=None,
    )

    op.drop_constraint(
        op.f("uq_streaks_user_id"), "streaks", type_="unique"
    )

    op.execute(
        "ALTER TABLE streaks RENAME CONSTRAINT"
        " ck_streaks_longest_streak TO ck_streaks_ck_users_longest_streak"
    )
    op.execute(
        "ALTER TABLE streaks RENAME CONSTRAINT"
        " ck_streaks_current_streak TO ck_streaks_ck_users_current_streak"
    )
    op.execute(
        "ALTER TABLE users RENAME CONSTRAINT"
        " ck_users_accumulated_points TO ck_users_ck_users_accumulated_points"
    )
