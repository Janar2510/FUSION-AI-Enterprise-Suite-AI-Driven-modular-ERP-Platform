#!/usr/bin/env python3
"""
Create Invoicing module tables: customers, taxes, invoices, invoice_lines, payments, audit
"""

import asyncio
from sqlalchemy import text

from src.core.database import async_engine, Base
from src.modules.invoicing.models import *  # noqa: F401,F403


async def create_tables():
    print("Creating Invoicing module tables...")
    async with async_engine.begin() as conn:
        await conn.execute(text("SELECT 1"))
        print("✅ DB connection OK")
        await conn.run_sync(Base.metadata.create_all)

        result = await conn.execute(text(
            """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema='public' AND table_name LIKE 'inv_%'
            ORDER BY table_name
            """
        ))
        tables = [r[0] for r in result.fetchall()]
        print(f"📋 Created {len(tables)} Invoicing tables:")
        for t in tables:
            print(f"  - {t}")


if __name__ == "__main__":
    asyncio.run(create_tables())


