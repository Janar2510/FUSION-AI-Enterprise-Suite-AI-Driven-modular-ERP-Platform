# ADR-0007 — Deprecate FastAPI ERP Routes

- **Date:** 2026-05-06
- **Status:** Accepted
- **Deciders:** Janar Kuusk

## Context

`backend/` (FastAPI) contains many ERP module routes (CRM, sales, inventory, HR, accounting, etc.) that duplicate the Node API. Per ADR-0001 and ADR-0002, FastAPI must become an AI-worker-only layer. These routes need to be retired cleanly.

## Decision

All FastAPI ERP module routes are moved to `backend/src/_deprecated/`. Active ERP endpoints that might still be called return HTTP 410 Gone with a body pointing to the equivalent Node API route:

```json
{ "error": "This endpoint has been deprecated. Use /api/<module>/... on the Node API instead.", "status": 410 }
```

FastAPI routes that remain active (AI workers) are documented in `backend/README.md`.

## Migration Path

1. Move ERP router files to `backend/src/_deprecated/<module>/`.
2. Replace each router registration in `main.py` with a 410 catch-all.
3. Verify no frontend code calls deprecated FastAPI ERP routes directly.
4. Remove `_deprecated/` entirely once Node API parity is confirmed (tracked by module checklist in `docs/module-checklists/`).

## Consequences

- FastAPI ERP surface is immediately removed from production routing.
- Any integrations calling deprecated routes receive a 410 with a migration hint.
- No new ERP routes are added to FastAPI.
