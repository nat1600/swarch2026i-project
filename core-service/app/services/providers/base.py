from abc import ABC, abstractmethod


class TranslationProvider(ABC):
    """
    Any translation provider (DeepL, LibreTranslate, MyMemory, etc.)
    must implement the methods defined in this interface.
    """

    @abstractmethod
    def translate(self, text: str, source_lang: str, target_lang: str) -> dict:
        """
        Translate a text from a source language to a target language
        {
            'translation': str,
            'pronunciation': str | None
        }
        """
        pass


    @abstractmethod 
    def is_available(self) -> bool:
        """
         Check whether the provider is available.
        """
        pass
