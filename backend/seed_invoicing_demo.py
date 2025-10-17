#!/usr/bin/env python3
import asyncio
from sqlalchemy import text

from src.core.database import async_engine, AsyncSessionLocal
from src.modules.invoicing.models import Customer, Tax


async def seed():
    async with async_engine.begin() as conn:
        await conn.execute(text("SELECT 1"))

    async with AsyncSessionLocal() as session:
        # Customer
        customer = (await session.execute(text(
            "SELECT id FROM inv_customers WHERE email = :email"
        ), {"email": "demo@example.com"})).fetchone()

        if not customer:
            c = Customer(
                name="Demo Customer",
                email="demo@example.com",
                billing_address_line1="123 Demo St",
                billing_city="Tallinn",
                billing_country="EE",
                currency="EUR",
            )
            session.add(c)
            await session.flush()
            customer_id = c.id
        else:
            customer_id = customer[0]

        # Tax
        tax = (await session.execute(text(
            "SELECT id FROM inv_taxes WHERE name = :name"
        ), {"name": "VAT 20%"})).fetchone()

        if not tax:
            t = Tax(
                name="VAT 20%",
                rate=0.20,
                tax_type="vat",
                is_inclusive=False,
                jurisdiction_country="EE",
            )
            session.add(t)
            await session.flush()
            tax_id = t.id
        else:
            tax_id = tax[0]

        await session.commit()
        print({"customer_id": customer_id, "tax_id": tax_id})


if __name__ == "__main__":
    asyncio.run(seed())


