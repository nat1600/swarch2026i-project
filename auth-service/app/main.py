from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings


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
        title='Core service!',
        lifespan=lifespan,
        docs_url='/docs' if settings.debug else None
    )

    return app


app = get_app()
