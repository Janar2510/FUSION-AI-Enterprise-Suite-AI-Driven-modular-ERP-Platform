# ADR-0002 — FastAPI = AI Worker Layer Only

- **Date:** 2026-05-06
- **Status:** Accepted
- **Deciders:** Janar Kuusk

## Context

FastAPI is already present as `backend/` with AI/ML capabilities (OCR, embeddings, forecasting). However, it also duplicates ERP module logic that should live in the Node API.

## Decision

`backend/` (FastAPI) is reduced to AI/ML/OCR/embedding workers only. It is called by the Node API via internal HTTP or a job queue. It never serves ERP modules directly.

## Consequences

- No direct frontend → FastAPI calls in production for ERP data.
- No financial writes from FastAPI without going through the Node API approval workflow.
- FastAPI services are stateless, JWT-authed (service token), read-replica-only or via Node API.
- All AI actions are logged via the Node API's `AiAction` table.
