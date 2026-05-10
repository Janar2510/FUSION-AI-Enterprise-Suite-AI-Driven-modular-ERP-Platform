# FusionAI Enterprise Suite — Required Secrets & Environment Variables

> **Never commit secret values to git.**  
> This file documents *which* variables are needed and *where* to set them.  
> Use a secrets manager (Doppler, AWS Secrets Manager, HashiCorp Vault, or GitHub Encrypted Secrets) in production.

---

## How to configure

| Environment | Method |
|---|---|
| Local development | `api/.env` file (gitignored) |
| CI (GitHub Actions) | Repository / Environment Secrets in Settings → Secrets |
| Staging / Production | Docker secrets or cloud secrets manager injected via env |

---

## API (`api/.env`)

### Required — will cause startup failure if missing in production

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string (PgBouncer in prod) | `postgresql://user:pass@host:5432/fusionai?schema=public` |
| `JWT_SECRET` | HS256 signing secret for access tokens — min 64 random bytes | `openssl rand -hex 64` |
| `SESSION_SECRET` | Express-session signing secret — min 32 random bytes | `openssl rand -hex 32` |
| `CORS_ORIGIN` | Allowed frontend origin | `https://app.fusionai.io` |

### Required — for email delivery (nodemailer)

| Variable | Description | Example |
|---|---|---|
| `SMTP_HOST` | SMTP server hostname | `smtp.eu.mailgun.org` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username / API key user | `postmaster@mg.fusionai.io` |
| `SMTP_PASS` | SMTP password / API key | `key-…` |
| `SMTP_FROM` | Default From address | `"FusionAI" <noreply@fusionai.io>` |

### Required — for AI features

| Variable | Description | Example |
|---|---|---|
| `OPENAI_API_KEY` | OpenAI API key (used by AI Actions endpoints) | `sk-…` |

### Optional — observability

| Variable | Default | Description |
|---|---|---|
| `SENTRY_DSN` | *(unset)* | Sentry DSN for error tracking |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | *(unset)* | OTLP collector URL for distributed tracing |
| `LOG_LEVEL` | `info` | Pino log level: `trace` `debug` `info` `warn` `error` |

### Optional — file uploads

| Variable | Default | Description |
|---|---|---|
| `UPLOAD_MAX_BYTES` | `10485760` (10 MB) | Maximum allowed file size in bytes |
| `ENABLE_VIRUS_SCAN` | `false` | Set `true` to activate ClamAV integration in `uploadGuard.ts` |
| `AWS_REGION` | *(unset)* | AWS region for S3 attachment storage |
| `AWS_ACCESS_KEY_ID` | *(unset)* | S3 access key |
| `AWS_SECRET_ACCESS_KEY` | *(unset)* | S3 secret key |
| `S3_BUCKET_ATTACHMENTS` | *(unset)* | S3 bucket name for uploaded files |

### Optional — runtime behaviour

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | `production` enables TLS-only cookies, secret guard |
| `PORT` | `3001` | HTTP listen port |
| `REDIS_URL` | *(unset)* | Redis URL for session store / Bull queues in prod |

---

## Frontend (`frontend/.env`)

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Base URL of the API server | `https://api.fusionai.io` |
| `VITE_SENTRY_DSN` | Sentry DSN for frontend error tracking | `https://…@sentry.io/…` |
| `VITE_WS_URL` | WebSocket URL for Discuss real-time | `wss://api.fusionai.io` |

---

## Generating strong secrets

```bash
# JWT_SECRET (64 bytes hex)
openssl rand -hex 64

# SESSION_SECRET (32 bytes hex)
openssl rand -hex 32
```

---

## Rotation policy

| Secret | Rotation frequency | Notes |
|---|---|---|
| `JWT_SECRET` | On compromise / every 90 days | Short token TTL (15 min) reduces blast radius |
| `SESSION_SECRET` | On compromise | Invalidates all active sessions |
| `SMTP_PASS` | Per provider policy | Use app-specific passwords |
| `OPENAI_API_KEY` | On compromise / quarterly | Scope to minimum permissions |
| DB credentials | On personnel change | Use Postgres ROLE rotation |

---

## Required GitHub Actions Secrets (CI/CD)

Set these in **Settings → Secrets and variables → Actions**:

```
DATABASE_URL          (staging + prod)
JWT_SECRET            (staging + prod)
SESSION_SECRET        (staging + prod)
SENTRY_DSN            (optional)
DOCKER_REGISTRY_TOKEN (for pushing images)
PRODUCTION_DEPLOY_KEY (SSH key for deploy target)
```

---

## Checklist before first production deploy

- [ ] `DATABASE_URL` points to production Postgres (not localhost)
- [ ] `JWT_SECRET` is a freshly generated 64-byte hex value
- [ ] `SESSION_SECRET` is a freshly generated 32-byte hex value
- [ ] `SMTP_*` variables tested: send a test email
- [ ] `CORS_ORIGIN` is the exact production frontend URL (no trailing slash)
- [ ] `NODE_ENV=production` is set
- [ ] `SENTRY_DSN` is set and a test event is visible in Sentry
- [ ] No `.env` file is committed to git (`git ls-files .env` returns nothing)
