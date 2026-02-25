from fastapi import FastAPI
from src.modules.accounting.api import router as accounting_router

app = FastAPI()
app.include_router(accounting_router)

print("Accounting module loaded successfully")