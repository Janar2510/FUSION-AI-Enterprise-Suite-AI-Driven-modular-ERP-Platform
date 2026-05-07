# ADR-0011 — Email Delivery Strategy

**Status:** Accepted  
**Date:** 2026-05-07

## Context
Transactional emails are required for: order confirmations, invoice delivery, payment reminders, password reset, and account activation. Currently no email capability exists.

## Decision
Use **Nodemailer** with an SMTP transport. In production, route through a dedicated transactional email provider (Resend, SendGrid, AWS SES, or Postmark) configured via `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` environment variables. In development, use Ethereal/Mailhog for preview.

Template system: HTML templates in `api/src/core/email/templates/`. Variables interpolated via simple `{{varName}}` replacement (no heavy template engine dependency).

Failed sends are written to the `OutboxEvent` table (eventKey: `email.send`) and retried by the `emailRetry` cron job (ADR-0009).

Initial templates:
- `invoice` — PDF attachment + payment link
- `order-confirm` — order summary
- `payment-reminder` — overdue invoice notice
- `password-reset` — secure reset link
- `user-invite` — new account activation

## Consequences
- **Good:** Provider-agnostic — swap SMTP credentials to change provider.
- **Good:** Retry via outbox pattern — no lost emails on transient failures.
- **Requires:** `SMTP_*` secrets in `.env` and infra secrets doc.

## Implementation
`api/src/core/email/index.ts` — `sendEmail(to, templateKey, vars, attachments?)`.
`api/src/core/email/templates/` — HTML templates.
