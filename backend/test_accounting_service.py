import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from src.modules.accounting.service import AccountingService
from src.core.database import AsyncSessionLocal

async def test_service():
    # Create a database session
    db = AsyncSessionLocal()
    try:
        # Create accounting service
        service = AccountingService(db)
        print("Accounting service created successfully")
        
        # Try to list chart of accounts
        accounts = await service.list_chart_of_accounts()
        print(f"Found {len(accounts)} chart of accounts")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await db.close()

if __name__ == "__main__":
    asyncio.run(test_service())