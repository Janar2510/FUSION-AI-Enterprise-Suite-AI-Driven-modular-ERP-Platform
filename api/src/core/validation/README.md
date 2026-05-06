# core/validation

Zod schema registry and request validation middleware.

Key exports:
- `validate(schema)` — Express middleware that validates `req.body`, `req.params`, `req.query` against a Zod schema
- `errorEnvelope(issues)` — formats Zod issues into the standard error response: `{ error: { code, message, fields, requestId } }`
- Module schemas live in `api/src/modules/<module>/schemas.ts` — register them here if cross-module reuse is needed

Every mutation route MUST have a Zod schema. No exceptions.

See Phase 2 (Section 6.3) in `CLAUDE_CODE_BUILD_PLAN.md`.
