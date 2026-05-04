# app/llm_client.py
import anthropic
import json
import logging
from app.config import get_settings

logger = logging.getLogger(__name__)
_client = None

LEVEL_DESCRIPTIONS = {
    "A1": "very simple words and very short sentences, basic everyday vocabulary",
    "A2": "simple words and short sentences, elementary vocabulary",
    "B1": "intermediate vocabulary, clear and natural sentences",
    "B2": "upper-intermediate vocabulary, more complex sentences",
    "C1": "advanced vocabulary, sophisticated sentences",
    "C2": "mastery-level vocabulary, nuanced and complex sentences",
}


def get_client():
    global _client
    if _client is None:
        settings = get_settings()
        logger.info("Inicializando cliente de Anthropic")
        _client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _client


async def enrich_word(word: str, level: str, language: str = "english") -> dict | None:
    """
    Asks the LLM to generate a fill-in-the-blank sentence and 3 distractors
    for the given word, calibrated to the student's level and language.
    Returns a dict with 'sentence' and 'distractors', or None on failure.
    """
    level_desc = LEVEL_DESCRIPTIONS.get(level.upper(), LEVEL_DESCRIPTIONS["B1"])

    prompt = f"""You are creating a vocabulary quiz item for a language learning app.

Language: {language}
Student level: {level.upper()} ({level_desc})
Target word: "{word}"

Your task:
1. Write a natural {language} sentence that clearly shows the meaning of "{word}" in context.
   - The sentence difficulty must match the {level.upper()} level: {level_desc}
   - The sentence must make "{word}" the ONLY correct answer for the blank
   - Do NOT include "{word}" in the sentence — use ___ as the blank
   - The entire sentence must be written in {language}
   - The context must clearly distinguish "{word}" from similar words

2. Generate exactly 3 distractor words in {language} that:
   - Are the same part of speech as "{word}"
   - Fit grammatically in the blank
   - Are plausible but CLEARLY WRONG in this specific context
   - Match the {level.upper()} vocabulary level
   - Must be in {language}
   - Must NOT be synonyms of "{word}" — they should belong to the same semantic field but have a different meaning
   - A student who knows the word should be able to rule them out based on the context of the sentence

Respond ONLY with valid JSON, no explanation, no markdown, no code blocks:
{{"sentence": "The ___ barked loudly at the stranger.", "distractors": ["word1", "word2", "word3"]}}"""

    try:
        client = get_client()
        response = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=200,
            messages=[{"role": "user", "content": prompt}],
        )

        raw = response.content[0].text.strip()
        if "```" in raw:
            raw = raw.replace("```json", "").replace("```", "").strip()

        logger.info(f"LLM raw response: '{raw}'")
        result = json.loads(raw)

        sentence = result.get("sentence", "")
        distractors = result.get("distractors", [])

        if not sentence or "___" not in sentence:
            raise ValueError(f"Frase inválida: '{sentence}'")
        if len(distractors) != 3:
            raise ValueError(f"Se esperaban 3 distractores, llegaron {len(distractors)}")

        logger.info(f"LLM: frase='{sentence}' distractores={distractors}")
        return {"sentence": sentence, "distractors": distractors}

    except (json.JSONDecodeError, ValueError, KeyError) as e:
        logger.error(f"LLM: respuesta inválida para '{word}': {e}")
        return None
    except anthropic.APIError as e:
        logger.error(f"LLM: error de API para '{word}': {e}")
        return None