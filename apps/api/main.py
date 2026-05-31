"""EatOrNot API — FastAPI entry point."""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import get_settings
from api.profile_routes import router as profile_router
from api.recommend_routes import router as recommend_router
from api.chat_routes import router as chat_router
from api.meal_routes import router as meal_router
from api.plan_routes import router as plan_router
from api.dashboard_routes import router as dashboard_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME} API...")
    logger.info(f"Mock MCP: {settings.USE_MOCK_MCP}")
    yield
    logger.info("Shutting down...")


app = FastAPI(
    title="EatOrNot API",
    description="Multi-agent nutrition & spending companion",
    version="0.2.0",
    lifespan=lifespan,
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5178", "http://127.0.0.1:5178", "http://localhost:*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(profile_router, prefix="/api", tags=["profile"])
app.include_router(recommend_router, prefix="/api", tags=["recommend"])
app.include_router(chat_router, prefix="/api", tags=["chat"])
app.include_router(meal_router, prefix="/api", tags=["meal"])
app.include_router(plan_router, prefix="/api", tags=["plan"])
app.include_router(dashboard_router, prefix="/api", tags=["dashboard"])


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "mock_mcp": settings.USE_MOCK_MCP,
    }
