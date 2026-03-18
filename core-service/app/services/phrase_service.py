from sqlalchemy.orm import Session

from app.models.phrase import Phrase


class PhraseService:
    def __init__(self, db_session: Session):
        self.db = db_session

    def get_all_phrases(self) -> list[Phrase]:
        return self.db.query(Phrase).all()
