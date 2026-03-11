from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import app.models

from app.routes import phrases
from app.core.config import get_settings
from app.models import phrase
from app.models import language
from app.routes import translate

@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    engine = create_engine(settings.database_url)
    app.state.session_factory = sessionmaker(bind=engine, autoflush=False)

    yield

    engine.dispose()


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

    return app


app = get_app()
