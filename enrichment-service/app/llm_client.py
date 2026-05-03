# app/llm_client.py
import anthropic
import json
import logging
from app.config import get_settings

logger = logging.getLogger(__name__)

_client = None

POS_LABELS = {
    "VERB": "verbs",
    "NOUN": "nouns",
    "ADJ": "adjectives",
    "ADV": "adverbs",
    "WORD": "words", 
}

def get_client():
    global _client
    if _client is None:
        settings = get_settings()
        logger.info("Inicializando cliente de Anthropic")
        _client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _client


async def get_distractors(word: str, sentence: str, pos: str) -> list[str]:
    """
    Asks the LLM for 3 distractor words of the same part of speech
    to be used in a vocabulary quiz.
    """
    pos_label = POS_LABELS.get(pos, "words")

    prompt = f"""You are generating distractors for an English vocabulary quiz.

Target word: "{word}"
Part of speech: {pos_label}
Example sentence: "{sentence}"

Generate exactly 3 English {pos_label} that:
1. Are the same part of speech as "{word}"
2. Fit grammatically in the sentence above (replacing "{word}")
3. Are semantically related but clearly wrong in context — plausible distractors, not synonyms
4. Are common English words (B1-B2 level)

Respond ONLY with valid JSON, no explanation, no markdown, no code blocks:
{{"distractors": ["word1", "word2", "word3"]}}"""

    try:
        client = get_client()
        response = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=100,
            messages=[{"role": "user", "content": prompt}],
        )

        raw = response.content[0].text.strip()


        if "```" in raw: raw = raw.replace("```json", "").replace("```", "").strip() #por si modelo responde con un bloque de código
        logger.info(f"LLM raw response: '{raw}'")


        result = json.loads(raw)
        distractors = result.get("distractors", [])

        if len(distractors) != 3:
            raise ValueError(f"Se esperaban 3 distractores, llegaron {len(distractors)}")

        logger.info(f"LLM: distractores para '{word}': {distractors}")
        return distractors

    except (json.JSONDecodeError, ValueError, KeyError) as e:
        logger.error(f"LLM: respuesta inválida para '{word}': {e}")
        return []
    except anthropic.APIError as e:
        logger.error(f"LLM: error de API para '{word}': {e}")
        return []