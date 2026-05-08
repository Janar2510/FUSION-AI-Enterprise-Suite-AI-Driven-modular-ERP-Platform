# Rollback Runbook

**Applies to:** FusionAI Enterprise Suite API + Frontend  
**Owner:** On-call engineer  
**Last updated:** 2026-05-07

---

## When to roll back

Roll back when a deployment causes any of:
- Error rate on `/api/*` rises above **2%** (Prometheus: `fusionai_http_requests_total{status_code=~"5.."}`)
- P95 latency exceeds **2 s** for more than 5 minutes
- `/api/ready` returns non-200
- Sentry alert: new issue spike > 10 events/min
- Business-critical flow (confirm order, post invoice, register payment) fails end-to-end

---

## Step 1 — Identify the bad version

```bash
# What's running?
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'

# What tag was deployed?
git log --oneline -10
```

---

## Step 2 — Roll back the API

```bash
# Option A: re-deploy the previous tagged image
export PREV_TAG=$(git describe --tags --abbrev=0 HEAD~1)
docker compose -f infra/docker-compose.prod.yml pull api
IMAGE_TAG=$PREV_TAG docker compose -f infra/docker-compose.prod.yml up -d api

# Option B: git revert + rebuild
git revert HEAD --no-edit
git push origin main       # triggers CI/CD redeploy on main
```

---

## Step 3 — Roll back the database migration (if needed)

> Only required if the bad deployment included a `prisma migrate deploy`.

```bash
# 1. Identify the last good migration name
docker exec fusionai-api npx prisma migrate status

# 2. Connect to postgres and mark migration as rolled back
docker exec -it fusionai-postgres psql -U $DB_USER -d $DB_NAME

# In psql:
UPDATE _prisma_migrations
SET rolled_back_at = NOW()
WHERE migration_name = '<bad_migration_name>';

# 3. Manually reverse the DDL (see migration SQL file)
# api/prisma/migrations/<bad_migration_name>/migration.sql

# 4. Exit and verify
\q
docker exec fusionai-api npx prisma migrate status
```

> **Warning:** Prisma does not auto-reverse migrations. Always review the migration SQL before manually reversing.

---

## Step 4 — Verify health after rollback

```bash
curl -s https://<domain>/api/health | jq .
curl -s https://<domain>/api/ready  | jq .

# Check error rate in Grafana or via promql
curl -s 'http://prometheus:9090/api/v1/query?query=rate(fusionai_http_requests_total{status_code=~"5.."}[5m])' | jq .
```

---

## Step 5 — Communicate

1. Post in #incidents Slack channel: `Rolled back to <prev_tag> at <time>. Root cause: TBD.`
2. Create a post-mortem issue in GitHub.
3. Update status page.

---

## Forward-compatible migration strategy

All new migrations must be **backward-compatible** for at least one release:
- Add columns as `NULL` or with defaults — never `NOT NULL` without a default
- Never rename or drop a column in the same release that removes its usage from code
- Use the expand–contract pattern: add new column → deploy → backfill → remove old column in next release
