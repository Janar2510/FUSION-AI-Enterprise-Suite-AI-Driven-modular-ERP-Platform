#!/usr/bin/env python3
"""
Initialize database tables for FusionAI Enterprise Suite
"""

import asyncio
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

from src.core.database import async_engine, Base
from src.modules.crm.models import CRMContact, CRMCompany, CRMDeal
import os

async def init_database():
    """Initialize database tables"""
    print("🗄️ Initializing database tables...")
    
    # Set the correct database URL
    os.environ["DATABASE_URL"] = "postgresql://fusionai_user:fusionai_password@localhost:5432/fusionai_erp"
    
    try:
        async with async_engine.begin() as conn:
            # Create all tables
            await conn.run_sync(Base.metadata.create_all)
            print("✅ Database tables created successfully!")
            
            # Test the connection
            from sqlalchemy import text
            result = await conn.execute(text("SELECT 1"))
            print("✅ Database connection test passed!")
            
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(init_database())
