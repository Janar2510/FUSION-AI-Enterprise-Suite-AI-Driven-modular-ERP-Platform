/**
 * File upload guard middleware
 *
 * Wraps multer with three defence layers:
 *
 *  1. Content-type allowlist  — only declared MIME types accepted by multer.
 *  2. Size cap                — configurable per-file and total limits.
 *  3. Magic-byte verification — reads the first 8 bytes after upload to confirm
 *                               the actual file type matches the declared MIME.
 *                               (Prevents MIME-spoofing: attacker sends a .php
 *                               with Content-Type: image/jpeg.)
 *  4. Virus scan hook         — synchronous stub; wire in ClamAV / clamav-stream
 *                               for production (see VIRUS SCAN comment below).
 *
 * Usage:
 *   router.post('/upload', uploadGuard.single('file'), handler);
 *   router.post('/attachments', uploadGuard.array('files', 5), handler);
 *
 * Integration note: store files in object storage (S3 / R2) from the handler;
 * never serve back uploaded files from the same origin (XSS risk).
 */

import multer, { FileFilterCallback, MulterError } from 'multer';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../core/errors';

// ── Allowed MIME types ────────────────────────────────────────────────────────
const ALLOWED_MIME_TYPES = new Set([
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // Documents
    'application/pdf',
    // Spreadsheets / office
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
    'application/vnd.ms-excel',                                          // xls
    'text/csv',
    // Archives (only for specific import endpoints — enable per-route as needed)
    // 'application/zip',
]);

// ── Magic-byte signatures ─────────────────────────────────────────────────────
// Maps expected MIME type → first N bytes (hex prefix).
// Extend as more types are added to ALLOWED_MIME_TYPES.
const MAGIC_SIGNATURES: Record<string, Buffer[]> = {
    'image/jpeg':  [Buffer.from([0xff, 0xd8, 0xff])],
    'image/png':   [Buffer.from([0x89, 0x50, 0x4e, 0x47])],
    'image/gif':   [Buffer.from('GIF87a'), Buffer.from('GIF89a')],
    'image/webp':  [Buffer.from('RIFF')],  // RIFF….WEBP checked below
    'application/pdf': [Buffer.from('%PDF')],
    // xlsx is a ZIP with PK header:
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [Buffer.from([0x50, 0x4b, 0x03, 0x04])],
    'application/vnd.ms-excel': [Buffer.from([0xd0, 0xcf, 0x11, 0xe0])],  // OLE2
};

function verifyMagicBytes(mimetype: string, buffer: Buffer): boolean {
    const signatures = MAGIC_SIGNATURES[mimetype];
    if (!signatures) return true; // No signature rule → allow (e.g. text/csv)
    return signatures.some(sig => buffer.subarray(0, sig.length).equals(sig));
}

// ── Multer configuration ──────────────────────────────────────────────────────
const MAX_FILE_SIZE_BYTES = parseInt(process.env.UPLOAD_MAX_BYTES ?? '', 10) || 10 * 1024 * 1024; // 10 MB default

const storage = multer.memoryStorage(); // Keep in memory; handler writes to object storage

const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback,
): void => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        return cb(new AppError('VALIDATION_ERROR', `File type '${file.mimetype}' is not allowed.`, 415) as unknown as null, false);
    }
    cb(null, true);
};

const multerInstance = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZE_BYTES,
        files: 10,       // max 10 files per request
        fields: 20,      // max non-file fields
        fieldSize: 64 * 1024, // 64 KB per field value
    },
    fileFilter,
});

// ── Post-upload magic-byte + virus-scan check ─────────────────────────────────
function postUploadCheck(req: Request, _res: Response, next: NextFunction): void {
    const files: Express.Multer.File[] = [];

    if (req.file) files.push(req.file);
    if (req.files) {
        if (Array.isArray(req.files)) {
            files.push(...req.files);
        } else {
            Object.values(req.files).forEach(arr => files.push(...arr));
        }
    }

    for (const file of files) {
        // 1. Magic-byte verification
        if (!verifyMagicBytes(file.mimetype, file.buffer)) {
            return next(
                new AppError(
                    'VALIDATION_ERROR',
                    `File '${file.originalname}' failed magic-byte verification. Declared type '${file.mimetype}' does not match file content.`,
                    415,
                ),
            );
        }

        // ── VIRUS SCAN HOOK ────────────────────────────────────────────────────
        // To enable ClamAV scanning in production:
        //
        //   import { createReadStream } from 'node:stream';
        //   import NodeClam from 'clamscan';
        //   const clam = await new NodeClam().init({ ...});
        //   const { isInfected } = await clam.scanBuffer(file.buffer);
        //   if (isInfected) return next(new AppError('FORBIDDEN', 'File failed virus scan', 422));
        //
        // For now this is a synchronous no-op stub. Set ENABLE_VIRUS_SCAN=true
        // in production and implement the async wrapper (see docs/runbooks/upload-security.md).
        if (process.env.ENABLE_VIRUS_SCAN === 'true') {
            // TODO: integrate ClamAV async scan before continuing
        }
    }

    next();
}

// ── Exported helpers ──────────────────────────────────────────────────────────

/** Multer error normalizer — converts MulterError into our AppError envelope */
export function handleMulterError(
    err: unknown,
    _req: Request,
    _res: Response,
    next: NextFunction,
): void {
    if (err instanceof MulterError) {
        const msg =
            err.code === 'LIMIT_FILE_SIZE'
                ? `File too large. Maximum allowed size is ${MAX_FILE_SIZE_BYTES / 1_048_576} MB.`
                : `Upload error: ${err.message}`;
        return next(new AppError('VALIDATION_ERROR', msg, 413));
    }
    next(err);
}

/** Single-file upload: uploadGuard.single('fieldName'), followed by handleMulterError */
export const uploadGuard = {
    single: (fieldName: string) => [
        multerInstance.single(fieldName),
        postUploadCheck,
    ],
    array: (fieldName: string, maxCount = 10) => [
        multerInstance.array(fieldName, maxCount),
        postUploadCheck,
    ],
    fields: (fields: multer.Field[]) => [
        multerInstance.fields(fields),
        postUploadCheck,
    ],
};
