from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from motor.motor_asyncio import AsyncIOMotorClient

from app.routes import anki
from app.routes import phrases
from app.routes import translate
from app.routes import review_history
from app.core.config import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()

    # PostgreSQL
    engine = create_engine(settings.database_url)
    app.state.session_factory = sessionmaker(bind=engine, autoflush=False)

    # MongoDB
    client = AsyncIOMotorClient(settings.mongo_url)
    app.state.mongo_db = client[settings.mongo_db]

    yield

    engine.dispose()
    client.close()


def get_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title='Core service!:)',
        lifespan=lifespan,
        docs_url='/docs' if settings.debug else None
    )

    # ------------- Routers -------------
    app.include_router(phrases.router)
    app.include_router(translate.router)
    app.include_router(review_history.router)
    app.include_router(anki.router)
    return app

app = get_app()
