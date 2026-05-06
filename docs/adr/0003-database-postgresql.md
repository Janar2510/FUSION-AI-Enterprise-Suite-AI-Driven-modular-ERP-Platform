# ADR-0003 — Database = PostgreSQL (single source)

- **Date:** 2026-05-06
- **Status:** Accepted
- **Deciders:** Janar Kuusk

## Context

The current `api/prisma/schema.prisma` uses `provider = "sqlite"`, which is unsuitable for production multi-tenant use (no row-level locking, no concurrent writers, no advisory locks, limited JSON support).

## Decision

Production database is PostgreSQL. The Prisma datasource `provider` is changed to `"postgresql"`. `docker-compose.yml` already provides a Postgres service.

## Consequences

- `api/prisma/schema.prisma` datasource is updated to `postgresql`.
- Legacy SQLite migrations targeting `sqlite` are removed; a fresh `init_postgres` migration is generated.
- SQLite is permitted **only** for unit-test sandboxes that don't require multi-tenant isolation.
- `DATABASE_URL` in all environments must point to a PostgreSQL instance.
- `DATABASE_URL_TEST` is added for CI Postgres service containers.
