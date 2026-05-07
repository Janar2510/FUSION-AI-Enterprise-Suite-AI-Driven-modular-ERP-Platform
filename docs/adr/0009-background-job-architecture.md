# ADR-0009 — Background Job Architecture

**Status:** Accepted  
**Date:** 2026-05-07

## Context
Several system functions require asynchronous processing: outbox event relay (cross-module triggers), nightly AI batch jobs (lead scoring), email delivery retries, PDF pre-generation. Currently no background job infrastructure exists in `api/`.

## Decision
Use **node-cron** for periodic jobs and the **Transactional Outbox Pattern** for event relay. No external queue broker is required for Phase 1 of jobs.

Architecture:
1. `api/src/jobs/` directory — one file per job.
2. `api/src/jobs/index.ts` — registers all jobs on server startup.
3. Each job is a cron-scheduled function. Jobs that are not safe to run concurrently use a DB advisory lock or an `isRunning` flag.
4. When volume justifies it, migrate to **BullMQ** (Redis-backed) — plug-in replacement.

Jobs to implement:
- `outboxRelay.ts` — every 30s, picks up `publishedAt IS NULL` OutboxEvents, processes them, marks `publishedAt`.
- `leadScoringBatch.ts` — nightly at 02:00, runs `lead-scoring` agent on all open opportunities.
- `emailRetry.ts` — every 5min, retries failed email sends.

## Consequences
- **Good:** No external dependencies for Phase 1.
- **Good:** Easy to migrate to BullMQ when needed.
- **Bad:** In-process cron stops when the server restarts — acceptable for single-instance deployments; fix with BullMQ for multi-instance.

## Implementation
`api/src/jobs/index.ts` — initializes all cron jobs. Called from `api/src/index.ts` after server starts.
