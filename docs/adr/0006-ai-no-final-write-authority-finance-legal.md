# ADR-0006 — AI Has No Final-Write Authority on Finance/Legal Records

- **Date:** 2026-05-06
- **Status:** Accepted
- **Deciders:** Janar Kuusk

## Context

AI agents are being integrated across modules to draft, suggest, and automate. Without guardrails, an AI agent could post an invoice, reconcile a payment, or send a signed legal document — actions that are irreversible and have regulatory/financial consequences.

## Decision

AI may **draft**, **suggest**, **summarize**, and **propose**. The following actions require **explicit human approval**, logged with the approving user's ID and a timestamp:

- Posting invoices or credit notes
- Reconciling payments
- Sending legal documents for signature
- Deleting records
- Modifying audit logs (prohibited entirely — audit logs are append-only)

## Consequences

- An approval workflow primitive must exist before any AI agent ships against accounting, invoicing, or documents/sign modules.
- Every AI action is logged to the `AiAction` table with fields: `agentKey`, `userId`, `entityType`, `entityId`, `tool`, `input`, `output`, `confidence`, `approvedById?`, `approvedAt?`, `appliedAt?`, `rolledBackAt?`.
- UI components that surface AI suggestions must include an explicit "Apply" or "Confirm" action — no auto-apply on a timer.
- Confidence threshold < 0.85 requires a "review needed" flag; never auto-apply regardless of threshold for finance/legal.
