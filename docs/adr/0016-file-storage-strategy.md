# ADR-0016: File Storage Strategy

**Status:** Accepted  
**Date:** 2026-05-10  
**Deciders:** Engineering

---

## Context

Multiple modules need to persist binary files:
- **Sign** — signed PDF documents
- **Expenses** — receipt images/PDFs
- **Recruitment** — résumé files (PDF, DOCX)
- **Documents** — arbitrary attachments
- **Knowledge** — article images
- **HR** — employee profile photos, contract documents

Currently none of these write to persistent storage. Files are either ignored (fields are `null`) or stored as base64 strings in the database (Sign's `signatureData`), which is unsuitable for large binary payloads.

## Decision

Use **MinIO** (self-hosted, S3-compatible object storage) as the single file storage backend.

### Rationale

- S3-compatible API means zero lock-in and easy migration to AWS S3, Cloudflare R2, or any other provider in production.
- MinIO can be run as a single Docker container in development/staging without external dependencies.
- Presigned URLs allow the frontend to upload directly to MinIO without streaming through the API server.

### Architecture

```
frontend → presigned PUT URL → MinIO bucket
frontend → API (store objectKey in DB)
API → presigned GET URL → returned to frontend for download
```

### Shared service

`api/src/core/storage/index.ts` exposes:

```typescript
export const storage = {
  presignedPut(bucket: string, key: string, ttl?: number): Promise<string>
  presignedGet(bucket: string, key: string, ttl?: number): Promise<string>
  delete(bucket: string, key: string): Promise<void>
}
```

Buckets are created at startup if they do not exist.

### Buckets

| Bucket | Contents |
|---|---|
| `sign-documents` | Signed PDFs |
| `expense-receipts` | Receipt images |
| `recruitment-cvs` | Résumé files |
| `attachments` | Generic document module files |
| `hr-files` | Employee profile and contract docs |

### Environment variables required

```
MINIO_ENDPOINT=http://minio:9000
MINIO_ACCESS_KEY=...
MINIO_SECRET_KEY=...
MINIO_USE_SSL=false
```

## Consequences

- **Positive:** Database stays lean (stores keys, not blobs). Files survive container restarts. Presigned URLs offload bandwidth from the API.
- **Negative:** MinIO must be added to the Docker Compose stack. Local dev requires running MinIO. Adds `minio` npm package dependency.
- **Risk:** If the MinIO service is unavailable, file upload/download fails. Mitigated by health-check and graceful error messages to the user.
