import asyncio
from fastapi import FastAPI
from src.modules.accounting.api import router as accounting_router

app = FastAPI()
app.include_router(accounting_router)

@app.get("/")
async def root():
    return {"message": "Minimal app running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3001)