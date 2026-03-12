"""seed languages table

Revision ID: a1b2c3d4e5f6
Revises: c2c1fdd62711
Create Date: 2026-03-11 20:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'c2c1fdd62711'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Insert reference data for supported languages."""
    # Define common languages for language learning
    languages = [
        {'name': 'English'},
        {'name': 'Spanish'},
        {'name': 'French'},
        {'name': 'German'},
        {'name': 'Italian'},
        {'name': 'Portuguese'},
        {'name': 'Russian'},
        {'name': 'Japanese'},
        {'name': 'Korean'},
        {'name': 'Chinese (Mandarin)'},
        {'name': 'Arabic'},
        {'name': 'Hindi'},
        {'name': 'Dutch'},
        {'name': 'Swedish'},
        {'name': 'Norwegian'},
        {'name': 'Danish'},
        {'name': 'Finnish'},
        {'name': 'Polish'},
        {'name': 'Turkish'},
        {'name': 'Greek'},
        {'name': 'Hebrew'},
        {'name': 'Thai'},
        {'name': 'Vietnamese'},
        {'name': 'Indonesian'},
    ]
    
    # Insert languages into the table
    op.bulk_insert(
        sa.table(
            'languages',
            sa.column('name', sa.String)
        ),
        languages
    )


def downgrade() -> None:
    """Remove seeded language data."""
    # Delete all languages that were inserted
    op.execute(
        """
        DELETE FROM languages 
        WHERE name IN (
            'English', 'Spanish', 'French', 'German', 'Italian', 
            'Portuguese', 'Russian', 'Japanese', 'Korean', 'Chinese (Mandarin)',
            'Arabic', 'Hindi', 'Dutch', 'Swedish', 'Norwegian',
            'Danish', 'Finnish', 'Polish', 'Turkish', 'Greek',
            'Hebrew', 'Thai', 'Vietnamese', 'Indonesian'
        )
        """
    )
