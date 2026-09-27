import os
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional

from app.config import settings
from app.database import db_manager, get_db
from app.services.mock_registry import mock_registry
from app.models.user import UserBase
from app.auth import get_current_user

from app.routers import (
    auth_router,
    tenders_router,
    bidders_router,
    documents_router,
    compliance_router,
    government_router,
    audit_router,
    dashboard_router,
    reports_router
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to DB and Seed Data
    print(f"Starting {settings.PROJECT_NAME}...")
    await db_manager.connect()
    
    # Auto-seed initial demo dataset
    try:
        res = await mock_registry.seed_all(force=False)
        print(f"[Startup] Database status: {res.get('message', 'Ready')}")
    except Exception as e:
        print(f"[Startup] Error seeding database: {e}")

    yield

    # Shutdown
    await db_manager.disconnect()
    print(f"{settings.PROJECT_NAME} stopped.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_SUBTITLE,
    version="2.0.0-SIH2026",
    lifespan=lifespan
)

# CORS Middleware
cors_origins_env = os.getenv("CORS_ORIGINS", "")
allowed_origins = [
    "https://gem-missionx.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:4173",
]
if cors_origins_env:
    for o in cors_origins_env.split(","):
        o_clean = o.strip()
        if o_clean and o_clean not in allowed_origins:
            allowed_origins.append(o_clean)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file mounts for PDF previews
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/api/static/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
if os.path.exists(settings.SAMPLE_DOCS_DIR):
    app.mount("/api/static/sample_docs", StaticFiles(directory=settings.SAMPLE_DOCS_DIR), name="sample_docs")

# Include Routers
app.include_router(auth_router)
app.include_router(tenders_router)
app.include_router(bidders_router)
app.include_router(documents_router)
app.include_router(compliance_router)
app.include_router(government_router)
app.include_router(audit_router)
app.include_router(dashboard_router)
app.include_router(reports_router)

class SystemConfigUpdate(BaseModel):
    ai_mode: Optional[str] = None  # "mock" or "gemini"
    gemini_api_key: Optional[str] = None

@app.get("/api/system/status")
async def get_system_status():
    return {
        "product_name": settings.PROJECT_NAME,
        "subtitle": settings.PROJECT_SUBTITLE,
        "organization": "Ministry of Petroleum & Natural Gas",
        "department": "Chennai Petroleum Corporation Limited (CPCL)",
        "theme": "Smart Automation",
        "status": "ONLINE",
        "database": {
            "mode": db_manager.mode,
            "connected": db_manager.is_connected,
            "name": settings.DATABASE_NAME
        },
        "ai_engine": {
            "mode": settings.AI_MODE,
            "has_api_key": bool(settings.GEMINI_API_KEY)
        },
        "advisory_notice": "DECISION SUPPORT SYSTEM — The Procurement Officer remains the final qualification authority."
    }

@app.post("/api/system/config")
async def update_system_config(
    cfg: SystemConfigUpdate,
    current_user: UserBase = Depends(get_current_user)
):
    if cfg.ai_mode in ["mock", "gemini"]:
        settings.AI_MODE = cfg.ai_mode
    if cfg.gemini_api_key is not None:
        settings.GEMINI_API_KEY = cfg.gemini_api_key
        if cfg.gemini_api_key and settings.AI_MODE != "gemini":
            settings.AI_MODE = "gemini"

    return {
        "status": "SUCCESS",
        "ai_mode": settings.AI_MODE,
        "has_api_key": bool(settings.GEMINI_API_KEY)
    }

@app.get("/api/health")
@app.get(f"{settings.API_V1_STR}/health")
async def health_check():
    db = get_db()
    t_count = await db["tenders"].count_documents({})
    b_count = await db["bidders"].count_documents({})
    c_count = await db["compliance_results"].count_documents({})
    g_count = await db["government_verifications"].count_documents({})
    d_count = await db["documents"].count_documents({})
    a_count = await db["audit_logs"].count_documents({})

    return {
        "status": "HEALTHY",
        "backend": "ONLINE",
        "timestamp": datetime.utcnow().isoformat(),
        "database": {
            "mode": db_manager.mode,
            "connected": db_manager.is_connected,
            "name": settings.DATABASE_NAME
        },
        "ai_engine": {
            "mode": settings.AI_MODE,
            "has_api_key": bool(settings.GEMINI_API_KEY)
        },
        "data_availability": {
            "tenders": t_count,
            "bidders": b_count,
            "compliance_results": c_count,
            "government_verifications": g_count,
            "documents": d_count,
            "audit_logs": a_count
        }
    }

@app.get("/api/queue")
@app.get(f"{settings.API_V1_STR}/queue")
async def queue_endpoint(
    tender_id: Optional[str] = None,
    priority: Optional[str] = None,
    limit: int = 100,
    current_user: UserBase = Depends(get_current_user)
):
    from app.routers.bidders_router import get_verification_queue
    return await get_verification_queue(tender_id=tender_id, priority=priority, limit=limit, current_user=current_user)

@app.post("/api/dev/seed")
@app.post(f"{settings.API_V1_STR}/dev/seed")
async def dev_seed_endpoint(
    force: bool = True,
    current_user: UserBase = Depends(get_current_user)
):
    from app.services.mock_registry import mock_registry
    res = await mock_registry.seed_all(force=force)
    return res

@app.get("/")
async def root():
    return {
        "app": settings.PROJECT_NAME,
        "message": "GeM Sentinel AI Backend Operational",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
