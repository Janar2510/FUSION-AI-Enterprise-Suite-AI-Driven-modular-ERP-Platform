#!/usr/bin/env python3
"""
Script to create Project module database tables
"""

import sys
import os
import asyncio
from sqlalchemy import text

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.core.database import async_engine, Base
from src.modules.project.models import *
from src.modules.crm.models import CRMContact  # Import CRMContact for foreign key dependencies
from src.modules.hr.models import Employee  # Import Employee for foreign key dependencies

async def create_project_tables():
    """Create all Project module tables"""
    try:
        print("Creating Project module tables...")
        
        # Create all tables defined in the models
        async with async_engine.begin() as conn:
            # Test connection
            await conn.execute(text("SELECT 1"))
            print("✅ Database connection successful")
            
            # Create all tables
            await conn.run_sync(Base.metadata.create_all)
            print("✅ Project module tables created successfully")
            
            # List created tables
            result = await conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name LIKE 'project%'
                ORDER BY table_name
            """))
            
            tables = result.fetchall()
            print(f"📋 Created {len(tables)} Project tables:")
            for table in tables:
                print(f"   - {table[0]}")
                
    except Exception as e:
        print(f"❌ Error creating Project tables: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(create_project_tables())
