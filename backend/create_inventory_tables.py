import asyncio
import os
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

# Set the correct database URL
os.environ['DATABASE_URL'] = 'postgresql://fusionai_user:fusionai_password@localhost:5432/fusionai_erp'

from src.core.database import async_engine, Base
from src.modules.crm.models import CRMContact  # Import CRM models first
from src.modules.sales.models import SalesQuote, SalesOrder  # Import Sales models
from src.modules.inventory.models import (
    Product, ProductCategory, WarehouseLocation, StockMovement, 
    DemandForecast, InventoryAlert, InventoryTransaction
)

async def create_inventory_tables():
    print('🗄️ Creating Inventory module tables...')
    try:
        async with async_engine.begin() as conn:
            # Create all tables
            await conn.run_sync(Base.metadata.create_all)
            print('✅ Inventory tables created successfully!')
            
    except Exception as e:
        print(f'❌ Error creating Inventory tables: {e}')
        raise

if __name__ == "__main__":
    asyncio.run(create_inventory_tables())



