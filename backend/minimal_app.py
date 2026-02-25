from fastapi import FastAPI
from src.modules.accounting.api import router as accounting_router

app = FastAPI()
app.include_router(accounting_router)

@app.get("/")
async def root():
    return {"message": "Minimal app running"}