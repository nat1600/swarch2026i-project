from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, status

from app.services.phrase_service import PhraseService
from app.core.dependencies import get_db, get_current_user_sub
from app.schemas.phrases import (
    PhraseResponse, PhraseCreate, ReviewRequest, ReviewResponse
)


router = APIRouter(prefix='/phrases', tags=['phrases'])


@router.get('/', response_model=list[PhraseResponse])
def get_phrases(
        db: Session = Depends(get_db),
        user_id: str = Depends(get_current_user_sub)
):
    """
    Retrieve all phrases
    GET /phrases/
    Response Codes:
        - 200: Successful retrieval
        - 500: Internal server error
    """
    service = PhraseService(db_session=db)
    return service.get_all_phrases(user_id)


@router.post('/', response_model=PhraseResponse, status_code=status.HTTP_201_CREATED)
def create_phrase(
        body: PhraseCreate,
        db: Session = Depends(get_db),
        user_id: str = Depends(get_current_user_sub)
):
    """
    Create a new phrase
    POST /phrases/
    Response Codes:
        - 201: Phrase successfully created
        - 400: Invalid input data
        - 500: Internal server error
    """
    service = PhraseService(db_session=db)
    return service.create_phrase(body, user_id)


@router.get('/due', response_model=list[PhraseResponse])
def get_due_phrases(
        user_id: str = Depends(get_current_user_sub),
        db: Session = Depends(get_db)
):
    """
    Get flashcards due for review today
    GET /phrases/due?user_id=1
    Response Codes:
        - 200: Successful retrieval
    """
    service = PhraseService(db_session=db)
    return service.get_due_phrases(user_id)


@router.get('/{phrase_id}', response_model=PhraseResponse)
def get_phrase(
        phrase_id: int,
        db: Session = Depends(get_db)
):
    """
    Retrieve a phrase by ID
    GET /phrases/{phrase_id}
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
def delete_phrase(
        phrase_id: int,
        db: Session = Depends(get_db)
):
    """
    Delete a phrase
    DELETE /phrases/{phrase_id}
    Response Codes:
        - 204: Phrase successfully deleted
        - 404: Phrase not found
    """
    service = PhraseService(db_session=db)
    phrase = service.get_phrase(phrase_id)
    if not phrase:
        raise HTTPException(status_code=404, detail='Phrase not found')
    service.delete_phrase(phrase_id)


@router.post('/{phrase_id}/review', response_model=ReviewResponse)
def review_phrase(
        phrase_id: int,
        body: ReviewRequest,
        db: Session = Depends(get_db)
):
    """
    Submit SM-2 review result
    POST /phrases/{phrase_id}/review
    Response Codes:
        - 200: Review processed
        - 404: Phrase not found
    """
    service = PhraseService(db_session=db)
    try:
        return service.review_phrase(phrase_id, body.quality)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
