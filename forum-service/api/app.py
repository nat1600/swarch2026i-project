from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db.mongo import connect_db, close_db
from db.indexes import create_indexes
from routes.categories import router as categories_router
from routes.threads import router as threads_router
from routes.replies import router as replies_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──
    await connect_db()
    await create_indexes()
    yield
    # ── Shutdown ──
    await close_db()


app = FastAPI(
    title="Forum Service",
    description="Forum microservice for the language-learning platform",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────
app.include_router(categories_router, prefix="/categories", tags=["Categories"])
app.include_router(threads_router, prefix="/threads", tags=["Threads"])
app.include_router(replies_router, tags=["Replies"])


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "forum-service"}
