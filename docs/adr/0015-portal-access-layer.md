# ADR-0015: Portal / Public Access Layer

**Status:** Accepted  
**Date:** 2026-05-10  
**Deciders:** Engineering

---

## Context

Several features require unauthenticated or externally-authenticated access to specific resources:
- **Sign module** — signers who are external parties must be able to view and sign a document without having a platform account.
- **Surveys** — public survey forms sent to non-users.
- **Invoices** — customers need a read-only payment/download link for an invoice.
- **Events** — public event registration pages.

The current `requireAuth` middleware blocks all these flows. A separate, carefully scoped access surface is needed.

## Decision

Introduce a **`/api/portal/*`** route tree mounted in `api/src/index.ts` **before** the `requireAuth` middleware block.

### Token mechanism

Each portal resource is accessed via a **short-lived signed token** embedded in a URL:

```
/api/portal/invoices/:token
/api/portal/surveys/:token
/api/portal/sign/:token
/api/portal/events/:eventId/register
```

Tokens are **HMAC-SHA256** signed strings (using `PORTAL_SECRET` env var) encoding `{ resource, id, expiry }`. Generation happens from the authenticated backend when the resource is shared (e.g. sending an invoice email, publishing a survey).

### Expiry

| Resource | Default TTL |
|---|---|
| Invoice payment/view link | 30 days |
| Sign invitation | 14 days |
| Survey link | 30 days |

### Implementation

- `api/src/core/portal/token.ts` — `signToken(payload)` / `verifyToken(token)` utilities.
- Portal routes validate the token, then return a **read-only projection** of the resource — no writes allowed except Survey submissions and Sign signatures.
- Rate-limited at `10 req/min per IP` (separate from the authenticated API limiter).

## Consequences

- **Positive:** Clean separation between authenticated operations and public-access resources. Tokens are revocable by changing `PORTAL_SECRET` or setting an expiry in the future.
- **Negative:** Adds `PORTAL_SECRET` to the required environment variables. Token generation must be wired at every "share" action.
- **Risk:** If tokens are forwarded/leaked, resources are accessible until expiry. Mitigated by short TTLs and resource-scoped tokens.
