import httpx
import os
from .base import TranslationProvider

class LibreTranslateProvider(TranslationProvider):
    """
    LibreTranslate -> no API key required
    """
    def __init__(self):
        self.base_url = os.getenv('LIBRETRANSLATE_URL', 'https://libretranslate.com')
        self.api_key = os.getenv('LIBRETRANSLATE_API_KEY')

    def translate(self, text: str, source_lang: str, target_lang: str) -> dict:
        payload = {
            'q': text,
            'source': source_lang,
            'target': target_lang,
            'format': 'text'
        }
        if self.api_key:
            payload['api_key'] = self.api_key
        try:
            response = httpx.post(f"{self.base_url}/translate", json=payload, timeout=10)
            response.raise_for_status()
            return {
                'translation': response.json().get('translatedText', ''),
                'pronunciation': None
            }
        except httpx.HTTPError as e:
            raise Exception(f"Error translating with LibreTranslate: {str(e)}")

    def is_available(self) -> bool:
        try:
            return httpx.get(f"{self.base_url}/languages", timeout=5).status_code == 200
        except:
            return False