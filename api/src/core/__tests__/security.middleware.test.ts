/**
 * Integration tests for security middleware:
 *   - CSRF protection (csrf.ts)
 *   - Upload guard (uploadGuard.ts) — content-type allowlist, size limits, magic-byte check
 */

import request from 'supertest';
import express, { Express } from 'express';
import multer from 'multer';
import { csrfProtection } from '../../middleware/csrf';
import { uploadGuard, handleMulterError } from '../../middleware/uploadGuard';
import { errorHandler } from '../../core/errors';

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildCsrfApp(): Express {
    const app = express();
    app.use(express.json());
    app.use(csrfProtection);
    app.post('/test', (_req, res) => res.json({ ok: true }));
    app.use(errorHandler as any);
    return app;
}

function buildUploadApp(): Express {
    const app = express();
    const [multerMiddleware, postCheck] = uploadGuard.single('file') as any[];
    app.post(
        '/upload',
        multerMiddleware,
        postCheck,
        (req: any, res: any) => {
            res.json({ name: req.file?.originalname, type: req.file?.mimetype, size: req.file?.size });
        },
    );
    app.use(handleMulterError as any);
    app.use(errorHandler as any);
    return app;
}

// ── CSRF Tests ────────────────────────────────────────────────────────────────

describe('csrfProtection middleware', () => {
    let app: Express;

    beforeAll(() => { app = buildCsrfApp(); });

    it('allows GET requests unconditionally', async () => {
        const res = await request(app).get('/test');
        expect(res.status).not.toBe(403);
    });

    it('blocks POST without Bearer or X-Requested-With', async () => {
        const res = await request(app).post('/test').send({});
        expect(res.status).toBe(403);
    });

    it('allows POST with Authorization: Bearer <token>', async () => {
        const res = await request(app)
            .post('/test')
            .set('Authorization', 'Bearer fake-jwt-token')
            .send({});
        expect(res.status).toBe(200);
    });

    it('allows POST with X-Requested-With: XMLHttpRequest', async () => {
        const res = await request(app)
            .post('/test')
            .set('X-Requested-With', 'XMLHttpRequest')
            .send({});
        expect(res.status).toBe(200);
    });

    it('blocks POST with X-Requested-With set to wrong value', async () => {
        const res = await request(app)
            .post('/test')
            .set('X-Requested-With', 'FetchAPI')
            .send({});
        expect(res.status).toBe(403);
    });
});

// ── Upload Guard Tests ────────────────────────────────────────────────────────

describe('uploadGuard middleware', () => {
    let app: Express;

    beforeAll(() => { app = buildUploadApp(); });

    it('accepts a valid JPEG upload', async () => {
        // JPEG magic bytes: FF D8 FF
        const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
        const res = await request(app)
            .post('/upload')
            .attach('file', jpegBuffer, { filename: 'photo.jpg', contentType: 'image/jpeg' });
        expect(res.status).toBe(200);
        expect(res.body.type).toBe('image/jpeg');
    });

    it('accepts a valid PDF upload', async () => {
        const pdfBuffer = Buffer.from('%PDF-1.4 test content');
        const res = await request(app)
            .post('/upload')
            .attach('file', pdfBuffer, { filename: 'doc.pdf', contentType: 'application/pdf' });
        expect(res.status).toBe(200);
        expect(res.body.type).toBe('application/pdf');
    });

    it('rejects a disallowed MIME type (text/html)', async () => {
        const buf = Buffer.from('<html><body>xss</body></html>');
        const res = await request(app)
            .post('/upload')
            .attach('file', buf, { filename: 'page.html', contentType: 'text/html' });
        expect(res.status).toBe(415);
    });

    it('rejects a MIME-spoofed file (declared JPEG, actual PDF content)', async () => {
        // Declare image/jpeg but send PDF magic bytes
        const pdfBuffer = Buffer.from('%PDF-1.4 content that is actually a PDF');
        const res = await request(app)
            .post('/upload')
            .attach('file', pdfBuffer, { filename: 'not_a_photo.jpg', contentType: 'image/jpeg' });
        expect(res.status).toBe(415);
    });

    it('rejects a MIME-spoofed file (declared PDF, actual JPEG bytes)', async () => {
        const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
        const res = await request(app)
            .post('/upload')
            .attach('file', jpegBuffer, { filename: 'invoice.pdf', contentType: 'application/pdf' });
        expect(res.status).toBe(415);
    });

    it('rejects upload exceeding size limit', async () => {
        // Temporarily set a tiny limit is not easily mockable here, but we can
        // test that the multer error handler converts MulterError to a 413.
        // We use a minimal re-build with a 1-byte limit.
        const tinyApp = express();
        const tinyMulter = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1 } });
        tinyApp.post('/upload', tinyMulter.single('file'), (_req, res) => res.json({ ok: true }));
        tinyApp.use(handleMulterError as any);
        tinyApp.use(errorHandler as any);

        const buf = Buffer.from('hello world');
        const res = await request(tinyApp)
            .post('/upload')
            .attach('file', buf, { filename: 'big.txt', contentType: 'text/plain' });
        expect(res.status).toBe(413);
    });
});
