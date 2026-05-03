# app/tatoeba_client.py
import httpx
import logging

logger = logging.getLogger(__name__)

TATOEBA_URL = "https://tatoeba.org/en/api_v0/search"


async def get_sentences(word: str, limit: int = 5) -> list[str]:
    params = {
        "query": word,
        "from": "eng",
        "limit": 20,  # pedir más para tener donde escoger
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(TATOEBA_URL, params=params)
            response.raise_for_status()
            data = response.json()

        sentences = []
        for result in data.get("results", []):
            text = result.get("text", "")
            if not word.lower() in text.lower():
                continue
            # Filtros de calidad
            if len(text.split()) < 6:          # muy corta, sin contexto
                continue
            if len(text.split()) > 20:         # muy larga, confusa
                continue
            if any(c in text for c in ["!", "?", "..."]) and len(text.split()) < 8:
                continue                        # exclamaciones cortas sin contexto
            sentences.append(text)
            if len(sentences) == limit:
                break

        logger.info(f"Tatoeba: {len(sentences)} frases para '{word}'")
        return sentences

    except httpx.HTTPError as e:
        logger.warning(f"Tatoeba falló para '{word}': {e}")
        return []