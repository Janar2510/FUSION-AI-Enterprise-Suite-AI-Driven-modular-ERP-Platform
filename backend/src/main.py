"""
FusionAI Enterprise Suite - FastAPI AI Worker Layer

Per ADR-0002 and ADR-0007 this service is an AI/ML/OCR/embedding worker only.
All ERP module routes have been deprecated and return HTTP 410 Gone.
ERP data lives exclusively in the Node/Express/Prisma API (api/).
"""

import logging
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("FusionAI AI Worker starting...")
    yield
    logger.info("FusionAI AI Worker shutting down...")


app = FastAPI(
    title="FusionAI AI Worker",
    version="2.0.0",
    description="AI/OCR/embedding worker layer — ERP routes removed (see ADR-0007)",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],  # Node API only — no direct frontend access
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health ────────────────────────────────────────────────────
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "role": "ai-worker",
        "timestamp": datetime.utcnow().isoformat(),
    }


# ── AI Worker endpoints (active) ─────────────────────────────
# TODO: mount actual AI worker routers here as they are built:
#   from src.ai.document_intelligence import router as doc_intel_router
#   app.include_router(doc_intel_router, prefix="/ai/documents")
#   etc.


# ── Deprecated ERP catch-all — HTTP 410 Gone ─────────────────
DEPRECATED_PREFIXES = (
    "/api/v1/crm",
    "/api/v1/accounting",
    "/api/v1/invoicing",
    "/api/v1/contact-hub",
    "/api/v1/dashboard",
    "/api/v1/ecommerce",
    "/api/v1/inventory",
    "/api/v1/sales",
    "/api/v1/purchase",
    "/api/v1/hr",
    "/api/v1/project",
    "/api/v1/helpdesk",
    "/api/v1/manufacturing",
    "/api/v1/pos",
    "/api/v1/rental",
    "/api/v1/subscriptions",
    "/api/v1/documents",
    "/api/v1/timesheets",
    "/api/v1/planning",
    "/api/v1/field-service",
    "/api/v1/knowledge",
    "/api/v1/website",
    "/api/v1/marketing",
    "/api/v1/email-marketing",
    "/api/v1/social-marketing",
    "/api/v1/studio",
    "/api/v1/attendance",
    "/api/v1/leaves",
    "/api/v1/recruitment",
)


@app.api_route(
    "/{full_path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    include_in_schema=False,
)
async def deprecated_catch_all(request: Request, full_path: str):
    path = f"/{full_path}"
    if any(path.startswith(p) for p in DEPRECATED_PREFIXES):
        return JSONResponse(
            status_code=410,
            content={
                "error": "This endpoint has been deprecated per ADR-0007.",
                "message": "Use /api/<module>/... on the Node API (port 3001) instead.",
                "status": 410,
            },
        )
    return JSONResponse(status_code=404, content={"error": "Not found"})
