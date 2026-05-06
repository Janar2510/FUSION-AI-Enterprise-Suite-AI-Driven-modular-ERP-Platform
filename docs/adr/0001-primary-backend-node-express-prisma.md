# ADR-0001 — Primary Backend = Node/Express/Prisma

- **Date:** 2026-05-06
- **Status:** Accepted
- **Deciders:** Janar Kuusk

## Context

The repository contains two backend runtimes: `api/` (Node/Express/Prisma) and `backend/` (FastAPI). Both contain overlapping ERP logic, causing duplication and confusion about which service is authoritative for business records.

## Decision

`api/` (Node + Express + Prisma) is the production ERP API. All ERP module routes, transaction logic, and write paths live here.

## Consequences

- No new ERP logic is added to `backend/` (FastAPI).
- Existing FastAPI ERP routes are deprecated and removed or migrated under `_deprecated/`.
- All frontend-to-ERP calls go through `api/`.
- The Node API is the single source of truth for all business records in the database.
