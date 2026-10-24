import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.core.database import Base, engine, SessionLocal
from backend.app.api.routes import health, events, sources, risk, intelligence, scenarios, reports
from backend.app.services.ingestion.registry import source_registry

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("gricc.main")

# Create database tables
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing GRICC Intelligence Core...")
    # Trigger initial async ingestion in background
    async def initial_sync():
        await asyncio.sleep(1.0)
        try:
            db = SessionLocal()
            logger.info("Running initial multi-source intelligence ingestion...")
            await source_registry.refresh_all(db)
            db.close()
            logger.info("Initial multi-source ingestion completed.")
        except Exception as e:
            logger.error(f"Error during initial intelligence sync: {e}")

    asyncio.create_task(initial_sync())
    yield
    logger.info("Shutting down GRICC Intelligence Core...")

app = FastAPI(
    title="GRICC - Global Risk Intelligence Command Center API",
    description="Multi-domain risk intelligence engine with real-world sensor fusion, explainable scoring, and AI analyst synthesis.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(health.router, prefix="/api")
app.include_router(events.router, prefix="/api")
app.include_router(sources.router, prefix="/api")
app.include_router(risk.router, prefix="/api")
app.include_router(intelligence.router, prefix="/api")
app.include_router(scenarios.router, prefix="/api")
app.include_router(reports.router, prefix="/api")

@app.get("/")
def root():
    return {
        "system": "Global Risk Intelligence Command Center (GRICC)",
        "status": "ONLINE",
        "docs_url": "/docs",
        "api_prefix": "/api"
    }
