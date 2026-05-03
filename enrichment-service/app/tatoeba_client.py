# app/tatoeba_client.py
import httpx
import logging

logger = logging.getLogger(__name__)

TATOEBA_URL = "https://tatoeba.org/en/api_v0/search"


async def get_sentences(word: str, limit: int = 5) -> list[str]:
    params = {
        "query": word,
        "from": "eng",
        "limit": limit,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(TATOEBA_URL, params=params)
            response.raise_for_status()
            data = response.json()

        sentences = []
        for result in data.get("results", []):
            text = result.get("text", "")
            if word.lower() in text.lower():
                sentences.append(text)

        logger.info(f"Tatoeba: {len(sentences)} frases para '{word}'")
        return sentences

    except httpx.HTTPError as e:
        logger.warning(f"Tatoeba fallllooooooooo para '{word}': {e}")
        return []