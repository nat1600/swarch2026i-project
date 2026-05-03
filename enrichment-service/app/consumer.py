# app/consumer.py
import logging
from app.models import EnrichmentMessage
from app.tatoeba_client import get_sentences
from app.analyzer import get_pos
from app.llm_client import get_distractors
from app.mongo_client import save

logger = logging.getLogger(__name__)


async def enrich(msg: EnrichmentMessage) -> bool:

    """
    this is going to say if all goings well. False if not
        - Get example sentences from Tatoeba
        - Analyze the part of speech with spaCy
        - Get distractors from the LLM
        - Save everything in MongoDB    
    """
    logger.info(f"Enriqueciendo: '{msg.word}' (phrase_id={msg.phrase_id})")


    sentences = await get_sentences(msg.word)
    if not sentences:
        logger.warning(f"Sin frases para '{msg.word}', abortando")
        return False

    sentence = sentences[0]


    pos = get_pos(sentence, msg.word)

    distractors = await get_distractors(msg.word, sentence, pos)
    if not distractors:
        logger.warning(f"Sin distractores para '{msg.word}', abortando")
        return False


    await save({
        "phrase_id": msg.phrase_id,
        "sentence": sentence.replace(msg.word, "___"),
        "correct_answer": msg.word,
        "distractors": distractors,
    })

    return True

