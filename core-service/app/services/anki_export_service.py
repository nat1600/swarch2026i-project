import os
import tempfile
import genanki
from sqlalchemy.orm import Session
from app.models.phrase import Phrase
from app.services.phrase_service import PhraseService


# Fixed IDs so Anki recognizes the same deck/model across exports
MODEL_ID = 1607392319
DECK_ID = 2059400110

LEXIFLOW_MODEL = genanki.Model(
    MODEL_ID,
    'LexiFlow Model',
    fields=[
        {'name': 'Original'},
        {'name': 'Translation'},
        {'name': 'Pronunciation'},
    ],
    templates=[
        {
            'name': 'Card 1',
            'qfmt': '<h2>{{Original}}</h2>{{#Pronunciation}}<p><i>{{Pronunciation}}</i></p>{{/Pronunciation}}',
            'afmt': '{{FrontSide}}<hr><h2>{{Translation}}</h2>',
        }
    ]
)


class AnkiExportService:
    def __init__(self, db_session: Session):
        self.db = db_session

    def export_deck(self, user_id: int) -> str:
        """
        Generates a .apkg file for all active phrases of a user.
        Returns the path to the temporary file.
        """
        service = PhraseService(db_session=self.db)
        phrases = self.db.query(Phrase).filter(
            Phrase.user_id == user_id,
            Phrase.active == True
        ).all()

        deck = genanki.Deck(DECK_ID, f'LexiFlow — User {user_id}')

        for phrase in phrases:
            note = genanki.Note(
                model=LEXIFLOW_MODEL,
                fields=[
                    phrase.original_text,
                    phrase.translated_text,
                    phrase.pronunciation or '',
                ]
            )
            deck.add_note(note)

        tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.apkg')
        genanki.Package(deck).write_to_file(tmp.name)
        return tmp.name