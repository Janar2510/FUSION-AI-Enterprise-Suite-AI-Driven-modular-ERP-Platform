# ADR-0004 — Canonical Domain Spine

- **Date:** 2026-05-06
- **Status:** Accepted
- **Deciders:** Janar Kuusk

## Context

Multiple ERP modules have been built with their own customer/vendor tables, leading to data fragmentation, inconsistent 360° views, and impossible cross-module aggregation.

## Decision

The following are platform-level shared entities that every module references but no module duplicates:

| Entity | Purpose |
|---|---|
| `Organization` | Top-level tenant (multi-tenancy root) |
| `Company` | Legal/accounting entity within an org |
| `User` | Auth identity, linked optionally to a Partner |
| `Partner` | Universal person/company record (customer, vendor, employee, contact) |
| `Product` | Product/service catalog |
| `Attachment` | Binary file metadata (stored in object storage) |
| `Document` | Structured document (quote PDF, invoice PDF, contract) |
| `Activity` | Scheduled/logged activity (call, email, meeting, todo, note) |
| `Message` | Chatter message on any record |
| `TimelineEvent` | Immutable event stream anchored to Partner + owner record |
| `AuditLog` | Every mutation on every entity |
| `OutboxEvent` | Reliable cross-module event publishing |

## Consequences

- Schema changes required to add `organizationId` and `companyId` to all business records.
- Module-local "Customer" / "Contact" tables are migrated to `Partner` references.
- The `Partner` profile is the universal customer view, aggregating data from all modules.
