import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.models.phrase import Phrase
from app.services.anki_export_service import AnkiExportService

router = APIRouter(prefix='/anki', tags=['anki'])


@router.get('/export/{user_id}')
def export_anki_deck(user_id: int, db: Session = Depends(get_db)):
    """
    Export all active phrases of a user as an Anki deck (.apkg)
    GET /anki/export/{user_id}
    Response Codes:
        - 200: File downloaded successfully
        - 404: No phrases found for this user
    """
    phrases_count = db.query(Phrase).filter(
        Phrase.user_id == user_id,
        Phrase.active == True
    ).count()

    if phrases_count == 0:
        raise HTTPException(status_code=404, detail='No phrases found for this user')

    service = AnkiExportService(db_session=db)
    file_path = service.export_deck(user_id)

    return FileResponse(
        path=file_path,
        filename=f'lexiflow_user_{user_id}.apkg',
        media_type='application/octet-stream'
    )