import httpx
import os
from .base import TranslationProvider

class DeepLProvider(TranslationProvider):
    """
    DeepL API FREE – 500k chars/month
    """
    def __init__(self):
        self.api_key = os.getenv('DEEPL_API_KEY')
        self.base_url = "https://api-free.deepl.com/v2"

    def translate(self, text: str, source_lang: str, target_lang: str) -> dict:

        if not self.api_key:
            raise Exception('DeepL API key not configured')
        
        payload = {"text": text, "target_lang": target_lang.upper()}

        if source_lang:
            payload["source_lang"] = source_lang.upper()

        try:
            response = httpx.post(

                f"{self.base_url}/translate",
                headers={"Authorization": f"DeepL-Auth-Key {self.api_key}"},
                data=payload,
                timeout=10
            )

            response.raise_for_status()
            return {
                "translation": response.json()["translations"][0]["text"],
                "pronunciation": None
            }
        except httpx.HTTPStatusError as e:

            if e.response.status_code == 456:
                raise Exception("DeepL FREE quota exceeded (500k/month)")
            
            raise Exception(f"DeepL HTTP error: {e}")
        
        except Exception as e:
            raise Exception(f"DeepL error: {str(e)}")

    def is_available(self) -> bool:
        if not self.api_key:
            return False
        try:
            response = httpx.get(
                f"{self.base_url}/usage",
                headers={"Authorization": f"DeepL-Auth-Key {self.api_key}"},
                timeout=5
            )
            if response.status_code == 200:
                data = response.json()
                return data.get("character_count", 0) < data.get("character_limit", 500000)
            return False
        except:
            return False