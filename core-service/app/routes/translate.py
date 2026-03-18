from fastapi import APIRouter, HTTPException, status

from app.services.translation_service import TranslationService
from app.schemas.phrases import TranslateRequest, TranslateResponse


router = APIRouter(prefix='/translate', tags=['translate'])


@router.post('/', response_model=TranslateResponse)
def translate(body: TranslateRequest):
    """
    Endpoint that translates a text from one language to another.

    Request body:
        text: text to translate
        source_lang: source language code
        target_lang: target language code

    Returns:
        translated text 
    """
    service = TranslationService()

    try:
        result = service.translate(body.text, body.source_lang, body.target_lang)
        return TranslateResponse(
            original=result['original'],
            translated_text=result['translation'],
            pronunciation=result.get('pronunciation'),
            source_lang=result['source_lang'],
            target_lang=result['target_lang'],
            provider=result['provider'],
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e)
        )
