import spacy
import logging
from app.config import get_settings

logger = logging.getLogger(__name__)

_nlp = None


def get_nlp():
    global _nlp
    if _nlp is None:
        settings = get_settings()
        logger.info(f"Cargando modelo spaCy: {settings.spacy_model}")
        _nlp = spacy.load(settings.spacy_model)
    return _nlp


def get_pos(sentence: str, word: str) -> str:
    nlp = get_nlp()
    doc = nlp(sentence)

    for token in doc:
        if token.text.lower() == word.lower():
            logger.info(f"spaCy: '{word}' → {token.pos_} en '{sentence}'")
            return token.pos_

    logger.warning(f"spaCy: '{word}' no encontrado en '{sentence}', usando WORD")
    return "WORD"