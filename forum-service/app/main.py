from contextlib import asynccontextmanager
from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import get_settings
from app.routes import posts

@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongo_url)
    app.state.db = client[settings.mongo_db]
    yield
    client.close()

def get_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title='Forum service!',
        lifespan=lifespan,
        docs_url='/docs' if settings.debug else None
    )
    # ------------- Routers -------------
    app.include_router(posts.router)
    return app

app = get_app()