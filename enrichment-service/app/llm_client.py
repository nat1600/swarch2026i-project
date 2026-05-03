# app/lllm_client.py
import anthropic
import json
import logging
from app.config import get_settings


logger = logging.getLogger(__name__)

_client = None

def get_client():

    global _client
    if _client is None:
        settings = get_settings()
        logger.info("Inicializando cliente de Anthropic")
        _client = anthropic.AsyncAnthropic(settings.anthropic_api_key)

    return _client

async def get_distractors(word: str, sentence: str, pos: str) -> list[str]:
    """
    It asks the LLM for 3 words of the same part of speech that fit into the sentence, like synoniumous, in fact synonimous :v
    """
    prompt = f"""Word: "{word}" (part of speech: {pos})
Sentence: "{sentence}"

Give exactly 3 English {pos}s that:
1. Fit grammatically in the same sentence
2. Have a slightly different meaning from "{word}"
3. Are plausible enough to be confusing in a vocabulary quiz

Respond ONLY with valid JSON, no explanation, no markdown:
{{"distractors": ["word1", "word2", "word3"]}}"""
    

    try:
        client = get_client()
        response = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=100,
            messages=[{"role": "user", "content": prompt}],
        )

        raw = response.content[0].text.strip()
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