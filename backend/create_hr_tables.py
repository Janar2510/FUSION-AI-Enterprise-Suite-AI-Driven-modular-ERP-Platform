import asyncio
import os
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

# Set the correct database URL
os.environ['DATABASE_URL'] = 'postgresql://fusionai_user:fusionai_password@localhost:5432/fusionai_erp'

from src.core.database import async_engine, Base
from src.modules.hr.models import (
    Employee, Department, Position, PayrollRecord, PerformanceReview,
    LeaveRequest, TimeEntry, RecruitmentJob, JobApplication,
    TrainingProgram, TrainingEnrollment
)
from sqlalchemy import text

async def create_hr_tables():
    """Create HR module tables"""
    print('🗄️ Creating HR module tables...')
    try:
        async with async_engine.begin() as conn:
            # Create all tables
            await conn.run_sync(Base.metadata.create_all)
            print("✅ HR tables created successfully!")
            
            # Test the connection
            result = await conn.execute(text("SELECT 1"))
            print("✅ Database connection test passed!")
            
    except Exception as e:
        print(f"❌ Error creating HR tables: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(create_hr_tables())



