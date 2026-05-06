# ADR-0005 — Module = Bounded Context, Shared Spine

- **Date:** 2026-05-06
- **Status:** Accepted
- **Deciders:** Janar Kuusk

## Context

ERP modules need to be independently deployable and understandable (bounded contexts), but they must share customer/product/document data without duplication.

## Decision

Each module is a standalone UX and service layer (bounded context), but every business record links to the shared canonical spine (ADR-0004). The Partner profile is the universal customer view that aggregates across all modules.

## Consequences

- No `Customer` tables inside individual modules — all customer-shaped data hangs off `Partner`.
- No `Product` tables inside individual modules — all product-shaped data hangs off `Product`.
- Cross-module aggregation is done at the Partner profile endpoint (`GET /api/partners/:id/profile`).
- Module teams must coordinate on spine model changes via ADRs and migrations.
- Module services can read spine entities but must not write to them without going through their respective service layer.
