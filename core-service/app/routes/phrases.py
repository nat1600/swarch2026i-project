from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends

from app.core.dependencies import get_db
from app.schemas.phrases import PhraseResponse
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
