# ADR-0008 — Document Sequence Strategy

**Status:** Accepted  
**Date:** 2026-05-07

## Context
ERP documents (Sales Orders, Invoices, POs, Tickets) require sequential human-readable reference numbers (SO-0001, INV-0001, PO-0001). Prior implementation used `COUNT(*) + 1` which creates a race condition under concurrent requests — two concurrent inserts can receive the same sequence number.

## Decision
Introduce an `IrSequence` model with one row per document type. The `nextval(key)` service function uses a Prisma `$transaction` with `SELECT ... FOR UPDATE` to atomically increment and return the next number. Each sequence is configurable: prefix, suffix, padding, step.

## Consequences
- **Good:** Gapless, unique, human-readable references. No duplicates under concurrency.
- **Good:** Configurable per document type and per company (future).
- **Bad:** Requires a DB row lock per document creation (negligible at B2B scale).
- **Requires:** The `ir_sequences` table must be seeded before any document is created. Migration `20260507210000_phase5b_sequences` handles this.

## Implementation
`api/src/core/sequence/index.ts` — `nextval(key: string): Promise<string>` and `peekval(key: string): Promise<string>`.
