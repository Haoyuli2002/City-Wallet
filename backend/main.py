"""
City Wallet — FastAPI Backend Entry Point
Registers all API routes, sets up CORS, and initializes database on startup.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config.settings import settings
from models.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    await init_db()
    print("🚀 City Wallet API is ready!")
    print(f"   City: {settings.DEFAULT_CITY}")
    print(f"   Docs: http://{settings.HOST}:{settings.PORT}/docs")
    yield


app = FastAPI(
    title="City Wallet API",
    description="AI-powered hyper-local offer generation for city merchants",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check
@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "city": settings.DEFAULT_CITY,
        "version": "1.0.0",
    }


# Register API routers
from api.context import router as context_router
from api.offers import router as offers_router
from api.redeem import router as redeem_router
from api.merchants import router as merchants_router

app.include_router(context_router, prefix="/api")
app.include_router(offers_router, prefix="/api")
app.include_router(redeem_router, prefix="/api")
app.include_router(merchants_router, prefix="/api")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)