"""Seed languages

Revision ID: b1e2f3a4c5d6
Revises: 4627df25dde5
Create Date: 2026-03-16 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = 'b1e2f3a4c5d6'
down_revision: Union[str, Sequence[str], None] = '4627df25dde5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Same list and order as auth-service seed so IDs are consistent across services.
# Auto-increment assignments (1-based):
#   1=Arabic, 2=Chinese, 3=Dutch, 4=English, 5=French, 6=German,
#   7=Italian, 8=Japanese, 9=Korean, 10=Polish, 11=Portuguese,
#   12=Russian, 13=Spanish, 14=Swedish, 15=Turkish
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
