from sqlalchemy.orm import Session

from app.models.phrase import Phrase, ReviewData
from app.schemas.phrases import PhraseCreate
from datetime import date
from app.services.sm2 import apply_sm2

class PhraseService:
    def __init__(self, db_session: Session):
        self.db = db_session

    def get_all_phrases(self) -> list[Phrase]:
        return self.db.query(Phrase).all()
    
    def get_phrase(self, phrase_id: int) -> Phrase | None:
        return self.db.query(Phrase).filter(
            Phrase.id == phrase_id,
            Phrase.active == True
        ).first()

    
    def create_phrase(self, data: PhraseCreate) -> Phrase:
        try:
            phrase = Phrase(
                user_id=data.user_id,
                source_language_id=data.source_language_id,
                target_language_id=data.target_language_id,
                original_text=data.original_text,
                translated_text=data.translated_text,
                pronunciation=data.pronunciation,
            )
            self.db.add(phrase)
            self.db.flush()

            review_data = ReviewData(phrase_id=phrase.id)
            self.db.add(review_data)

            self.db.commit()
            self.db.refresh(phrase)
            return phrase

        except Exception:
            self.db.rollback()
            raise

    def delete_phrase(self, phrase_id: int) -> None:
        phrase = self.get_phrase(phrase_id)
        if phrase:
            phrase.active = False
            self.db.commit()

    ## THIS STARTS TO WORK WITH SM2
    def get_due_phrases(self, user_id: int) -> list[Phrase]:
        today = date.today()
        return self.db.query(Phrase).filter(
            Phrase.active == True,
            Phrase.user_id == user_id,
            Phrase.next_review_date <= today,
        ).all()
    
    def review_phrase(self, phrase_id: int, quality: int) -> ReviewData:
        phrase = self.get_phrase(phrase_id)

        if not phrase:
            raise ValueError("Phrase not found")
        
        review = self.db.query(ReviewData).filter(
            ReviewData.phrase_id == phrase_id
        ).first()

        repetitions, easiness, interval, next_review = apply_sm2(
            quality=quality,
            repetitions=review.repetition_number,
            easiness=float(review.easiness_factor),
            interval=review.inner_repetition_interval,
        )

        review.repetition_number = repetitions
        review.easiness_factor = easiness
        review.inner_repetition_interval = interval
        phrase.next_review_date = next_review
        phrase.last_reviewed_date = date.today()

        self.db.commit()
        self.db.refresh(review)
        return review
