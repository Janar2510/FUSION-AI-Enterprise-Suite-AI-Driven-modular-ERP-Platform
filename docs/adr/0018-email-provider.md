# ADR-0018: Email Provider Strategy

**Status:** Accepted  
**Date:** 2026-05-10  
**Deciders:** Engineering

---

## Context

Several modules need to send transactional emails:
- **Invoicing** — send invoices as PDF attachments to customers
- **Sign** — send signing invitations and completion confirmations to signers
- **Recruitment** — stage-change notifications to applicants
- **Planning** — shift publish notifications to employees
- **HR Leaves** — leave approval/rejection notifications

A shared `api/src/core/email/index.ts` file already exists but is not wired to any SMTP transport — it likely contains a stub or placeholder.

## Decision

Wire `api/src/core/email/index.ts` to **Nodemailer** with a configurable SMTP transport.

### Configuration

All configuration is via environment variables:

```
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false         # true for port 465 TLS
EMAIL_USER=noreply@example.com
EMAIL_PASS=...
EMAIL_FROM="FusionAI <noreply@example.com>"
```

For local development, **Mailpit** (Docker container, `mailpit/mailpit`) provides a local SMTP server with a web UI to inspect sent emails at `http://localhost:8025`.

### Interface

The shared `email` service exposes:

```typescript
export const email = {
  send(opts: {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    attachments?: Array<{ filename: string; content: Buffer; contentType: string }>;
  }): Promise<void>
}
```

Errors are caught and logged — email failures never propagate to the HTTP response (best-effort delivery). A failed email emit should be retried via a background job (see ADR-0009).

### Templates

Email HTML is rendered from simple template strings in `api/src/core/email/templates/`. No external templating engine is required initially — plain template literals with inline CSS are sufficient for a v1.

## Consequences

- **Positive:** All modules share one transport. Swapping from SMTP to a hosted provider (SendGrid, Postmark, AWS SES) requires only changing environment variables, as Nodemailer supports all via SMTP relay.
- **Negative:** Email delivery is not transactional with the DB write. A message may be sent even if a subsequent DB step fails, or vice versa. Mitigated by always sending emails after the DB write succeeds.
- **Risk:** SMTP credentials in environment variables. Must be excluded from source control and injected via secrets manager in production.
