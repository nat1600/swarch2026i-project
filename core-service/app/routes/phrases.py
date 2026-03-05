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
    service = PhraseService(db_session=db)
    return service.get_all_phrases()



@router.post('/', response_model=PhraseResponse, status_code=status.HTTP_201_CREATED)

def create_phrase(body: PhraseCreate, db: Session = Depends(get_db)):

    service = PhraseService(db_session=db)
    return service.create_phrase(body)