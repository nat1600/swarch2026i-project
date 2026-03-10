from typing import Generator
from fastapi import Request
from sqlalchemy.orm import Session
from motor.motor_asyncio import AsyncIOMotorDatabase


def get_db(request: Request) -> Generator[Session, None, None]:
    db = request.app.state.session_factory()
    try:
        yield db
    finally:
        db.close()


def get_mongo_db(request: Request) -> AsyncIOMotorDatabase:
    return request.app.state.mongo_db