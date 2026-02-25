#!/usr/bin/env python3
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="FusionAI Invoicing Only", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from src.modules.invoicing.api import router as invoicing_router  # noqa: E402

app.include_router(invoicing_router, prefix="/api/v1", tags=["Invoicing"])


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run("invoicing_main:app", host="0.0.0.0", port=3002, reload=False)


