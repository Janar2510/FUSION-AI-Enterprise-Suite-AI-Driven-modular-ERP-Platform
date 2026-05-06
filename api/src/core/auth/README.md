# core/auth

Session/JWT authentication, MFA (TOTP + WebAuthn passkeys), password hashing (argon2id), email verification, password reset, and RBAC (role + permission + record-rule middleware).

Key exports:
- `requireAuth` — middleware that validates session or JWT and populates `req.user`
- `requirePermission(key)` — middleware that checks `req.user` has `permission.key`
- `hashPassword(plain)` / `verifyPassword(plain, hash)` — argon2id helpers
- `generateJwt(payload)` / `verifyJwt(token)` — service-to-service JWT

See Phase 2 in `CLAUDE_CODE_BUILD_PLAN.md`.
