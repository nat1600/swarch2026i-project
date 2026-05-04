# app/consumer.py
import logging
import nltk
from nltk.corpus import stopwords
from app.models import EnrichmentMessage
from app.llm_client import enrich_word
from app.mongo_client import save, word_exists

logger = logging.getLogger(__name__)

# Descargar stop words si no están disponibles
nltk.download("stopwords", quiet=True)


def get_content_words(text: str, language: str) -> list[str]:
    """
    Removes stop words from the text and returns a list of unique content words.
    """
    try:
        stop_words = set(stopwords.words(language))
    except OSError:
        logger.warning(f"No stop words found for language '{language}', using empty set")
        stop_words = set()

    words = text.lower().split()
    seen = set()
    content_words = []
    for word in words:
        # Limpiar puntuación básica
        clean = word.strip(".,!?;:\"'()-")
        if clean and clean not in stop_words and clean not in seen:
            seen.add(clean)
            content_words.append(clean)

    return content_words


async def enrich(msg: EnrichmentMessage) -> bool:
    """
    For each content word in the message:
      - Checks if it already exists in MongoDB
      - If not, calls the LLM and saves the result
    Returns True if at least one word was successfully enriched.
    """
    logger.info(
        f"Procesando frase phrase_id={msg.phrase_id} "
        f"nivel={msg.level} idioma={msg.language}"
    )

    words = get_content_words(msg.original_text, msg.language)
    if not words:
        logger.warning(f"Sin palabras de contenido para phrase_id={msg.phrase_id}")
        return False

    logger.info(f"Palabras a enriquecer: {words}")

    enriched_count = 0
    for word in words:
        if await word_exists(msg.phrase_id, word):
            logger.info(f"'{word}' ya existe para phrase_id={msg.phrase_id}, skipping")
            continue

        result = await enrich_word(word, msg.level, msg.language)
        if not result:
            logger.warning(f"Sin resultado para '{word}', skipping")
            continue

        await save({
            "phrase_id": msg.phrase_id,
            "word": word,
            "sentence": result["sentence"],
            "correct_answer": word,
            "distractors": result["distractors"],
            "level": msg.level,
            "language": msg.language,
        })
        enriched_count += 1

    logger.info(f"phrase_id={msg.phrase_id}: {enriched_count}/{len(words)} palabras enriquecidas")
    return enriched_count > 0