# app/consumer.py
import logging
from app.models import EnrichmentMessage
from app.llm_client import enrich_word
from app.mongo_client import save

logger = logging.getLogger(__name__)


async def enrich(msg: EnrichmentMessage) -> bool:
    """
    Enriches a word using the LLM and saves the result to MongoDB.
    Returns True if successful, False otherwise.
    """
    logger.info(f"Enriqueciendo: '{msg.word}' nivel={msg.level} (phrase_id={msg.phrase_id})")

    result = await enrich_word(msg.word, msg.level)
    if not result:
        logger.warning(f"Sin resultado para '{msg.word}', abortando")
        return False

    await save({
        "phrase_id": msg.phrase_id,
        "sentence": result["sentence"],
        "correct_answer": msg.word,
        "distractors": result["distractors"],
        "level": msg.level,
    })
    return True