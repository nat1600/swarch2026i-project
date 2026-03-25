from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from app.routes import users, gql_users
from app.core.config import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    engine = create_async_engine(settings.database_url, pool_pre_ping=True)
    app.state.session_factory = async_sessionmaker(bind=engine, expire_on_commit=False)

    yield

    await engine.dispose()


def get_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title='Core service!',
        lifespan=lifespan,
        docs_url='/docs' if settings.debug else None
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-User-Sub"],
    )

    # -------------------------- Routers --------------------------
    app.include_router(users.router)
    app.include_router(gql_users.graphql_app, prefix='/graphql')  # Montamos el router de GraphQL

    return app


app = get_app()
