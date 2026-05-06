# core/errors

Standard error envelope, HTTP error classes, and request ID generation.

Key exports:
- `AppError(code, message, statusCode, fields?)` — base application error class
- `notFound(entity, id?)` — 404 with standard message (never 403 — do not reveal existence to wrong tenant)
- `forbidden(message?)` — 403
- `validationError(fields)` — 422 with field-level errors
- `requestId()` — generates a unique request ID (`req_<ulid>`) to attach to every response
- Global error handler middleware that formats all errors into: `{ error: { code, message, fields?, requestId } }`

See Phase 2 (Section 6.3) in `CLAUDE_CODE_BUILD_PLAN.md`.
