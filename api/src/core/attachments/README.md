# core/attachments

File upload and attachment service. Files are stored in object storage (S3-compatible); only metadata is in PostgreSQL.

Key exports:
- `uploadAttachment(file, ownerType, ownerId, userId)` — validates, scans, stores in object storage, writes `Attachment` record
- `getAttachmentUrl(attachmentId)` — returns a signed time-limited URL
- `deleteAttachment(attachmentId, userId)` — soft-deletes metadata, schedules object deletion

Rules:
- Never store raw file bytes in the database
- Always validate content-type against allowlist + magic-byte check
- File size capped per route (configured via middleware)
- Virus scan hook required before returning success

See Phase 2 (Section 6.4) in `CLAUDE_CODE_BUILD_PLAN.md`.
