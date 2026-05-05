from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.config import get_settings
from app.routes import payments


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    engine = create_async_engine(settings.database_url, pool_pre_ping=True)
    app.state.settings = settings
    app.state.session_factory = async_sessionmaker(bind=engine, expire_on_commit=False)

    yield

    await engine.dispose()


def get_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Payment service",
        lifespan=lifespan,
        docs_url="/docs" if settings.debug else None,
    )

    app.include_router(payments.router)

    @app.get("/health", tags=["Health"])
    async def health_check() -> dict[str, str]:
        return {"status": "ok", "service": "payment-service"}

    return app


app = get_app()
