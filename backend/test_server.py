#!/usr/bin/env python3
"""
Simple test server to verify uvicorn fix
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="Test Server")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Hello World", "status": "working"}

@app.get("/health")
async def health():
    return {"status": "healthy", "server": "test"}

@app.get("/api/v1/crm/contacts")
async def test_crm():
    return {"contacts": [], "message": "CRM endpoint working"}

if __name__ == "__main__":
    print("🚀 Starting test server on port 3001...")
    uvicorn.run(app, host="0.0.0.0", port=3001)




