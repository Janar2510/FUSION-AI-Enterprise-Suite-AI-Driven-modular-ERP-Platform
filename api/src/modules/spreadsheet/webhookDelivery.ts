import { createHmac } from 'node:crypto';

/** Header name for HMAC-SHA256 of the exact request body (UTF-8). Value: `sha256=<hex>`. */
export const WEBHOOK_SIGNATURE_HEADER = 'X-Fusion-Webhook-Signature';

const MAX_RETRIES_CAP = 5;
export const DEFAULT_WEBHOOK_MAX_RETRIES = 2;

export function signWebhookBody(secret: string, body: string): string {
    return createHmac('sha256', secret).update(body, 'utf8').digest('hex');
}

function clampRetries(n: unknown): number {
    if (typeof n !== 'number' || !Number.isFinite(n) || n < 0) {
        return DEFAULT_WEBHOOK_MAX_RETRIES;
    }
    return Math.min(Math.floor(n), MAX_RETRIES_CAP);
}

function backoffMs(attemptIndex: number): number {
    return Math.min(8000, 400 * 2 ** attemptIndex);
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export type DeliverWebhookResult = { ok: boolean; status?: number; attempts: number };

export type DeliverWebhookOptions = {
    url: string;
    method: string;
    headers: Record<string, string>;
    body: string | undefined;
    timeoutMs: number;
    /** Additional attempts after the first (clamped 0–5, default 2 if omitted). */
    maxRetries?: number;
    hmacSecret?: string;
    /** Inject for tests */
    fetchImpl?: typeof fetch;
};

/**
 * POST/PUT/PATCH JSON webhooks with optional HMAC-SHA256 signing and bounded retries.
 * Retries on network errors and HTTP 5xx only (not 4xx).
 */
export async function deliverWebhook(opts: DeliverWebhookOptions): Promise<DeliverWebhookResult> {
    const fetchFn = opts.fetchImpl ?? globalThis.fetch;
    const method = opts.method;
    const body = opts.method === 'GET' ? undefined : opts.body;

    const headers: Record<string, string> = { ...opts.headers };
    if (
        opts.hmacSecret &&
        opts.hmacSecret.length > 0 &&
        method !== 'GET' &&
        body !== undefined &&
        body.length > 0
    ) {
        const sig = signWebhookBody(opts.hmacSecret, body);
        headers[WEBHOOK_SIGNATURE_HEADER] = `sha256=${sig}`;
    }

    const maxAttempts = 1 + clampRetries(opts.maxRetries);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const ac = new AbortController();
        const timer = setTimeout(() => ac.abort(), opts.timeoutMs);
        try {
            const res = await fetchFn(opts.url, {
                method,
                headers,
                body: method === 'GET' ? undefined : body,
                signal: ac.signal,
            });
            if (res.ok) {
                return { ok: true, status: res.status, attempts: attempt + 1 };
            }
            if (res.status < 500) {
                return { ok: false, status: res.status, attempts: attempt + 1 };
            }
            if (attempt < maxAttempts - 1) {
                await sleep(backoffMs(attempt));
                continue;
            }
            return { ok: false, status: res.status, attempts: attempt + 1 };
        } catch {
            if (attempt < maxAttempts - 1) {
                await sleep(backoffMs(attempt));
                continue;
            }
            return { ok: false, attempts: attempt + 1 };
        } finally {
            clearTimeout(timer);
        }
    }
    return { ok: false, attempts: maxAttempts };
}

export function resolveWebhookHmacSecret(cfg: Record<string, unknown>): string | undefined {
    const direct = cfg.hmacSecret;
    if (typeof direct === 'string' && direct.trim().length > 0) {
        return direct.trim();
    }
    const envKey = cfg.hmacSecretEnv;
    if (typeof envKey === 'string' && envKey.trim().length > 0) {
        const v = process.env[envKey.trim()];
        if (typeof v === 'string' && v.length > 0) {
            return v.trim();
        }
    }
    return undefined;
}
