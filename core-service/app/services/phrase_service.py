import json
import logging
import aio_pika

from decimal import Decimal
from datetime import date, datetime, time, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.services.sm2 import apply_sm2
from app.core.config import get_settings
from app.schemas.phrases import PhraseCreate, PhraseUpdate
from app.models.phrase import Phrase, ReviewData



class PhraseService:
    def __init__(self, db_session: Session):
        self.db = db_session

    def get_all_phrases(self, user_id: str) -> list[Phrase]:
        stmt = select(Phrase).where(Phrase.user_id == user_id)
        return list(self.db.execute(stmt).scalars().all())
    
    def get_phrase(self, phrase_id: int) -> Phrase | None:
        return self.db.query(Phrase).filter(
            Phrase.id == phrase_id,
            Phrase.active == True
        ).first()
    
    async def create_phrase(self, data: PhraseCreate, user_id: str) -> Phrase:
        try:
            phrase = Phrase(
                user_id=user_id,
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

            ## We are going to send a message to RabbitMQ, in a second thread

            await self._publish_enrichment(phrase)
            return phrase

        except Exception:
            self.db.rollback()
            raise

    def update_phrase(self, phrase_id: int, data: PhraseUpdate) -> Phrase:
        phrase = self.get_phrase(phrase_id)
        if not phrase:
            raise ValueError("Phrase not found")

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(phrase, key, value)

        try:
            self.db.commit()
            self.db.refresh(phrase)
            return phrase
        except Exception:
            self.db.rollback()
            raise
        
    async def _publish_enrichment(self, phrase: Phrase) -> None:
        """
        Publishes to RabbitMQ for enrichment-service to process
        the phrase in the background. If it fails, only logs
        does not affect the user.
        """
        try:
            settings = get_settings()
            connection = await aio_pika.connect_robust(settings.rabbitmq_url)
            async with connection:
                channel = await connection.channel()
                await channel.default_exchange.publish(
                    aio_pika.Message(
                        body=json.dumps({
                            "phrase_id": phrase.id,
                            "original_text": phrase.original_text,
                            "level": "B1",
                            "language": "english",
                        }).encode(),
                        delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
                    ),
                    routing_key="word.enrichment",
                )
                logging.getLogger(__name__).info(
                    f"RabbitMQ: publicado phrase_id={phrase.id}"
                )
        except Exception as e:
            logging.getLogger(__name__).warning(f"RabbitMQ publish falló: {e}")



    def delete_phrase(self, phrase_id: int) -> None:
        phrase = self.get_phrase(phrase_id)
        if phrase:
            phrase.active = False
            self.db.commit()

    ## THIS STARTS TO WORK WITH SM2
    def get_due_phrases(self, user_id: str) -> list[Phrase]:
        today = date.today()
        stmt = select(Phrase).where(
            Phrase.active == True,
            Phrase.user_id == user_id,
            Phrase.next_review_date <= today,
        )
        return list(self.db.execute(stmt).scalars().all())
    
    def review_phrase(self, phrase_id: int, quality: int) -> ReviewData:
        phrase = self.get_phrase(phrase_id)

        if not phrase:
            raise ValueError("Phrase not found")

        stmt = select(ReviewData).where(ReviewData.phrase_id == phrase_id)
        review: ReviewData = self.db.execute(stmt).scalars().first()

        repetitions, easiness, interval, next_review = apply_sm2(
            quality=quality,
            repetitions=review.repetition_number,
            easiness=float(review.easiness_factor),
            interval=review.inner_repetition_interval,
        )

        review.repetition_number = repetitions
        review.easiness_factor = Decimal(str(easiness))
        review.inner_repetition_interval = interval
        phrase.next_review_date = datetime.combine(
            next_review, time.min, tzinfo=timezone.utc
        )
        phrase.last_reviewed_date = datetime.now(timezone.utc)

        self.db.commit()
        self.db.refresh(review)
        self.db.refresh(phrase)
        return review
