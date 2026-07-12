from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, chat, family


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    yield
    # Shutdown
    from app.db.session import engine

    await engine.dispose()


app = FastAPI(
    title="FamilyPlate API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(family.router, prefix="/api/family", tags=["family"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])


@app.get("/health")
async def health():
    return {"status": "ok"}
