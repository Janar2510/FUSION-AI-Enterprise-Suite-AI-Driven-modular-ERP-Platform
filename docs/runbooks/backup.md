# Backup & Restore Runbook

**Applies to:** FusionAI Enterprise Suite — PostgreSQL  
**Owner:** On-call engineer  
**Last updated:** 2026-05-07

---

## Backup strategy

| Type | Frequency | Retention | Tool |
|---|---|---|---|
| Logical dump (pg_dump) | Daily at 02:00 UTC | 30 days | pg_dump + S3/GCS |
| WAL archiving (PITR) | Continuous | 7 days | `archive_command` + S3 |
| Manual pre-deploy snapshot | Before every production deploy | Until next deploy | pg_dump |

---

## Daily logical backup (automated via cron)

Add to the host crontab or as a k8s CronJob:

```bash
# /etc/cron.d/fusionai-backup
0 2 * * * root docker exec fusionai-postgres \
  pg_dump -U $DB_USER -Fc $DB_NAME \
  | aws s3 cp - s3://$BACKUP_BUCKET/fusionai/$(date +\%Y-\%m-\%d).dump
```

### Verify backup integrity (weekly drill)

```bash
# Download latest backup
aws s3 cp s3://$BACKUP_BUCKET/fusionai/$(date +%Y-%m-%d).dump /tmp/fusionai-latest.dump

# Restore to a test DB
docker exec -i fusionai-postgres \
  pg_restore -U $DB_USER -d fusionai_test --clean --if-exists /tmp/fusionai-latest.dump

# Smoke-test: check record counts
docker exec fusionai-postgres psql -U $DB_USER -d fusionai_test \
  -c "SELECT COUNT(*) FROM organizations; SELECT COUNT(*) FROM partners; SELECT COUNT(*) FROM sale_orders;"
```

---

## WAL archiving (Point-in-Time Recovery)

Add to `postgresql.conf`:

```ini
wal_level = replica
archive_mode = on
archive_command = 'aws s3 cp %p s3://$BACKUP_BUCKET/wal/%f'
restore_command = 'aws s3 cp s3://$BACKUP_BUCKET/wal/%f %p'
```

Then take a base backup:

```bash
docker exec fusionai-postgres pg_basebackup \
  -U $DB_USER -D /var/lib/postgresql/basebackup \
  -Ft -z -Xs -P
```

---

## Restore from logical dump

```bash
# 1. Stop API to prevent writes
docker compose -f infra/docker-compose.prod.yml stop api worker

# 2. Download the target backup
aws s3 cp s3://$BACKUP_BUCKET/fusionai/2026-05-07.dump /tmp/restore.dump

# 3. Drop + recreate DB (DESTRUCTIVE)
docker exec fusionai-postgres psql -U $DB_USER -c "DROP DATABASE fusionai;"
docker exec fusionai-postgres psql -U $DB_USER -c "CREATE DATABASE fusionai;"

# 4. Restore
docker exec -i fusionai-postgres \
  pg_restore -U $DB_USER -d fusionai /tmp/restore.dump

# 5. Re-run migrations to bring schema up to current
docker exec fusionai-api npx prisma migrate deploy

# 6. Restart services
docker compose -f infra/docker-compose.prod.yml start api worker

# 7. Verify
curl -s https://<domain>/api/ready | jq .
```

---

## Restore from WAL (PITR to a specific timestamp)

```bash
# In recovery.conf (or postgresql.conf >= PG12):
recovery_target_time = '2026-05-07 14:30:00 UTC'
recovery_target_action = 'promote'
```

Then restart Postgres. It will replay WAL up to the target time.

---

## Pre-deploy snapshot (manual)

Run before every production deployment:

```bash
docker exec fusionai-postgres \
  pg_dump -U $DB_USER -Fc $DB_NAME \
  > /var/backups/fusionai-pre-deploy-$(date +%Y%m%d-%H%M%S).dump
```

---

## Drill schedule

- **Weekly:** Restore latest daily dump to `fusionai_test` and verify record counts.
- **Monthly:** Full PITR drill to a staging environment.
- **Quarterly:** Disaster recovery drill (full restore to new infra from S3 only).

Document each drill result in `docs/drill-log.md`.

---

## RTO / RPO targets

| Target | Value |
|---|---|
| Recovery Time Objective (RTO) | < 2 hours |
| Recovery Point Objective (RPO) | < 24 hours (logical), < 5 min (WAL) |
