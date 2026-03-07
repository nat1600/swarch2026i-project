from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.dependencies import get_db
from app.schemas.phrases import PhraseResponse, PhraseCreate
from app.services.phrase_service import PhraseService


router = APIRouter(prefix='/phrases', tags=['phrases'])


@router.get(
    '/',
    response_model=list[PhraseResponse]
)
def get_phrases(
        db: Session = Depends(get_db)
):
    """
    Retrieve all phrases

    GET /phrases/

    Description:
        Returns a list of all active phrases stored in the system.

    Response:
        List of phrases with their translation and metadata.

    Example Response:
        [
            {
                "id": 1,
                "original_text": "Hello",
                "translated_text": "Hola",
                "pronunciation": "heh-lo"
            }
        ]

    Response Codes:
        - 200: Successful retrieval
        - 500: Internal server error
    """
    service = PhraseService(db_session=db)
    return service.get_all_phrases()



@router.post('/', response_model=PhraseResponse, status_code=status.HTTP_201_CREATED)
def create_phrase(body: PhraseCreate, db: Session = Depends(get_db)):
    """
    Create a new phrase

    POST /phrases/

    Description:
        Creates a new phrase with its translation and pronunciation.
        Also initializes review data associated with the phrase.

    Example Request:
        {
            "user_id": 1,
            "source_language_id": 1,
            "target_language_id": 2,
            "original_text": "Hello",
            "translated_text": "Hola",
            "pronunciation": "heh-lo"
        }

    Example Response:
        {
            "id": 10,
            "original_text": "Hello",
            "translated_text": "Hola",
            "pronunciation": "heh-lo"
        }

    Response Codes:
        - 201: Phrase successfully created
        - 400: Invalid input data
        - 500: Internal server error
    """
    service = PhraseService(db_session=db)
    return service.create_phrase(body)


@router.get('/{phrase_id}', response_model=PhraseResponse)
def get_phrase(phrase_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a phrase by ID

    GET /phrases/{phrase_id}

    Description:
        Retrieves a specific phrase using its unique identifier.

    Path Parameters:
        phrase_id (int): Unique ID of the phrase.

    Example Response:
        {
            "id": 1,
            "original_text": "Hello",
            "translated_text": "Hola",
            "pronunciation": "heh-lo"
        }

    Response Codes:
        - 200: Phrase found
        - 404: Phrase not found
    """
    service = PhraseService(db_session=db)
    phrase = service.get_phrase(phrase_id)

    if not phrase:
        raise HTTPException(status_code=404, detail='Phrase not found')

    return phrase



@router.delete('/{phrase_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_phrase(phrase_id: int, db: Session = Depends(get_db)):
    """
    Delete a phrase

    DELETE /phrases/{phrase_id}

    Description:
        Deletes (or deactivates) a phrase from the system.

    Path Parameters:
        phrase_id (int): Unique ID of the phrase to delete.

    Response Codes:
        - 204: Phrase successfully deleted
        - 404: Phrase not found
    """
    service = PhraseService(db_session=db)
    phrase = service.get_phrase(phrase_id)

    if not phrase:
        raise HTTPException(status_code=404, detail='Phrase not found')

    service.delete_phrase(phrase_id)