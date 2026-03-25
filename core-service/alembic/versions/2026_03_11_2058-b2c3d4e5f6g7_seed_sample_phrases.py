"""seed sample phrases and review data

Revision ID: b2c3d4e5f6g7
Revises: a1b2c3d4e5f6
Create Date: 2026-03-11 20:58:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6g7'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Insert sample phrases and review data for testing."""
    
    # Sample phrases for user_id = 1 (English -> Spanish)
    # Assuming language IDs: English=1, Spanish=2, Japanese=8
    phrases = [
        {
            'user_id': 1,
            'source_language_id': 1,  # English
            'target_language_id': 2,  # Spanish
            'original_text': 'Hello, how are you?',
            'translated_text': 'Hola, ¿cómo estás?',
            'pronunciation': None,
            'active': True,
        },
        {
            'user_id': 1,
            'source_language_id': 1,  # English
            'target_language_id': 2,  # Spanish
            'original_text': 'Thank you very much',
            'translated_text': 'Muchas gracias',
            'pronunciation': None,
            'active': True,
        },
        {
            'user_id': 1,
            'source_language_id': 1,  # English
            'target_language_id': 2,  # Spanish
            'original_text': 'Good morning',
            'translated_text': 'Buenos días',
            'pronunciation': None,
            'active': True,
        },
        {
            'user_id': 1,
            'source_language_id': 8,  # Japanese
            'target_language_id': 1,  # English
            'original_text': 'ありがとう',
            'translated_text': 'Thank you',
            'pronunciation': 'arigatou',
            'active': True,
        },
        {
            'user_id': 1,
            'source_language_id': 8,  # Japanese
            'target_language_id': 1,  # English
            'original_text': 'おはよう',
            'translated_text': 'Good morning',
            'pronunciation': 'ohayou',
            'active': True,
        },
        {
            'user_id': 2,
            'source_language_id': 2,  # Spanish
            'target_language_id': 1,  # English
            'original_text': 'Por favor',
            'translated_text': 'Please',
            'pronunciation': None,
            'active': True,
        },
        {
            'user_id': 2,
            'source_language_id': 2,  # Spanish
            'target_language_id': 1,  # English
            'original_text': 'De nada',
            'translated_text': "You're welcome",
            'pronunciation': None,
            'active': True,
        },
    ]
    
    # Insert phrases
    op.bulk_insert(
        sa.table(
            'phrases',
            sa.column('user_id', sa.Integer),
            sa.column('source_language_id', sa.Integer),
            sa.column('target_language_id', sa.Integer),
            sa.column('original_text', sa.String),
            sa.column('translated_text', sa.String),
            sa.column('pronunciation', sa.String),
            sa.column('active', sa.Boolean),
        ),
        phrases
    )
    
    # Insert review_data for the first 7 phrases (IDs 1-7)
    # Assuming phrases get sequential IDs starting from 1
    # easiness_factor must be BETWEEN 1.3 AND 2.5 per model constraint
    review_data = [
        {
            'phrase_id': 1,
            'repetition_number': 0,
            'easiness_factor': 2.5,
            'inner_repetition_interval': 0,
        },
        {
            'phrase_id': 2,
            'repetition_number': 1,
            'easiness_factor': 2.4,
            'inner_repetition_interval': 1,
        },
        {
            'phrase_id': 3,
            'repetition_number': 2,
            'easiness_factor': 2.3,
            'inner_repetition_interval': 6,
        },
        {
            'phrase_id': 4,
            'repetition_number': 0,
            'easiness_factor': 2.5,
            'inner_repetition_interval': 0,
        },
        {
            'phrase_id': 5,
            'repetition_number': 1,
            'easiness_factor': 2.2,
            'inner_repetition_interval': 1,
        },
        {
            'phrase_id': 6,
            'repetition_number': 0,
            'easiness_factor': 2.5,
            'inner_repetition_interval': 0,
        },
        {
            'phrase_id': 7,
            'repetition_number': 3,
            'easiness_factor': 2.5,
            'inner_repetition_interval': 15,
        },
    ]
    
    op.bulk_insert(
        sa.table(
            'review_data',
            sa.column('phrase_id', sa.Integer),
            sa.column('repetition_number', sa.Integer),
            sa.column('easiness_factor', sa.Numeric),
            sa.column('inner_repetition_interval', sa.Integer),
        ),
        review_data
    )
    
    # Insert sample review sessions
    review_sessions = [
        {'user_id': 1},
        {'user_id': 1},
        {'user_id': 2},
    ]
    
    op.bulk_insert(
        sa.table(
            'review_sessions',
            sa.column('user_id', sa.Integer),
        ),
        review_sessions
    )
    
    # Insert sample review session phrases
    # Assuming review_sessions get IDs 1-3
    review_session_phrases = [
        {
            'review_session_id': 1,
            'phrase_id': 1,
            'try_number': 0,
            'response_time': 3500,
            'recall_rating': 4,
        },
        {
            'review_session_id': 1,
            'phrase_id': 2,
            'try_number': 0,
            'response_time': 2800,
            'recall_rating': 5,
        },
        {
            'review_session_id': 1,
            'phrase_id': 3,
            'try_number': 0,
            'response_time': 4200,
            'recall_rating': 3,
        },
        {
            'review_session_id': 2,
            'phrase_id': 4,
            'try_number': 0,
            'response_time': 5100,
            'recall_rating': 4,
        },
        {
            'review_session_id': 2,
            'phrase_id': 5,
            'try_number': 0,
            'response_time': 3200,
            'recall_rating': 5,
        },
        {
            'review_session_id': 3,
            'phrase_id': 6,
            'try_number': 0,
            'response_time': 2900,
            'recall_rating': 4,
        },
        {
            'review_session_id': 3,
            'phrase_id': 7,
            'try_number': 0,
            'response_time': 2100,
            'recall_rating': 5,
        },
    ]
    
    op.bulk_insert(
        sa.table(
            'review_sessions_phrase',
            sa.column('review_session_id', sa.Integer),
            sa.column('phrase_id', sa.Integer),
            sa.column('try_number', sa.SmallInteger),
            sa.column('response_time', sa.Integer),
            sa.column('recall_rating', sa.SmallInteger),
        ),
        review_session_phrases
    )


def downgrade() -> None:
    """Remove seeded sample data."""
    # Delete in reverse order due to foreign key constraints
    op.execute("DELETE FROM review_sessions_phrase WHERE review_session_id IN (1, 2, 3)")
    op.execute("DELETE FROM review_sessions WHERE id IN (1, 2, 3)")
    op.execute("DELETE FROM review_data WHERE phrase_id IN (1, 2, 3, 4, 5, 6, 7)")
    op.execute("DELETE FROM phrases WHERE id IN (1, 2, 3, 4, 5, 6, 7)")
