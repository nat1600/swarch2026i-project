"""Seed languages

Revision ID: a3f9c812d547
Revises: 57e77ef4086a
Create Date: 2026-03-10 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = 'a3f9c812d547'
down_revision: Union[str, Sequence[str], None] = '57e77ef4086a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

LANGUAGES = [
    "Arabic",
    "Chinese",
    "Dutch",
    "English",
    "French",
    "German",
    "Italian",
    "Japanese",
    "Korean",
    "Polish",
    "Portuguese",
    "Russian",
    "Spanish",
    "Swedish",
    "Turkish",
]


def upgrade() -> None:
    values = ", ".join(f"('{lang}')" for lang in LANGUAGES)
    op.execute(
        f"INSERT INTO languages (name) VALUES {values} ON CONFLICT DO NOTHING"
    )


def downgrade() -> None:
    names = ", ".join(f"'{lang}'" for lang in LANGUAGES)
    op.execute(f"DELETE FROM languages WHERE name IN ({names})")
