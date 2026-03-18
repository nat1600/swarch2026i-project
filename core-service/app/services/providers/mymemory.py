import httpx
from .base import TranslationProvider

class MyMemoryProvider(TranslationProvider):
    """
    MyMemory API
    https://mymemory.translated.net/doc/spec.php
    """
    
    def __init__(self):
        self.base_url = "https://api.mymemory.translated.net"
        

    def translate(self, text: str, source_lang: str, target_lang: str) -> dict:
        try:
            response = httpx.get(
                f"{self.base_url}/get",
                params={'q': text, 'langpair': f'{source_lang}|{target_lang}'},
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            if data.get('responseStatus') != 200:
                raise Exception("Error en MyMemory response")
            return {
                'translation': data['responseData']['translatedText'],
                'pronunciation': None
            }
        except httpx.HTTPError as e:
            raise Exception(f"Error translating with MyMemory: {str(e)}")

    def is_available(self) -> bool:
        try:
            return httpx.get(self.base_url, timeout=5).status_code in [200, 404]
        except:
            return False