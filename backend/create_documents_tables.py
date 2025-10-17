#!/usr/bin/env python3
"""
Create Documents Module Database Tables
Initializes all document-related tables in the database
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the src directory to the Python path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from src.core.config import get_settings
from src.modules.documents.models import Base

async def create_documents_tables():
    """Create all documents module tables"""
    
    # Get database settings
    settings = get_settings()
    database_url = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
    
    # Create async engine
    engine = create_async_engine(database_url, echo=True)
    
    try:
        # Create all tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        print("✅ Documents module tables created successfully!")
        print("Created tables:")
        print("- documents")
        print("- document_annotations")
        print("- document_shares")
        print("- document_versions")
        print("- document_collections")
        print("- users (if not exists)")
        
    except Exception as e:
        print(f"❌ Error creating documents tables: {e}")
        raise
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(create_documents_tables())



