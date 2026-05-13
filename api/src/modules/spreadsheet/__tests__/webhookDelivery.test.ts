import { createHmac } from 'node:crypto';

import { AutomationService } from '../automationService';
import {
    deliverWebhook,
    resolveWebhookHmacSecret,
    signWebhookBody,
    WEBHOOK_SIGNATURE_HEADER,
} from '../webhookDelivery';

describe('signWebhookBody', () => {
    test('matches node crypto HMAC-SHA256 hex', () => {
        const body = '{"a":1}';
        const hex = createHmac('sha256', 'secret').update(body, 'utf8').digest('hex');
        expect(signWebhookBody('secret', body)).toBe(hex);
    });
});

describe('resolveWebhookHmacSecret', () => {
    const prev = { ...process.env };

    afterEach(() => {
        process.env = { ...prev };
    });

    test('prefers hmacSecret over env', () => {
        process.env.MY_HOOK_SECRET = 'from-env';
        expect(
            resolveWebhookHmacSecret({
                hmacSecret: ' direct ',
                hmacSecretEnv: 'MY_HOOK_SECRET',
            }),
        ).toBe('direct');
    });

    test('reads hmacSecretEnv when hmacSecret empty', () => {
        process.env.WH_TEST = 'abc';
        expect(resolveWebhookHmacSecret({ hmacSecretEnv: 'WH_TEST' })).toBe('abc');
    });

    test('returns undefined when missing', () => {
        expect(resolveWebhookHmacSecret({})).toBeUndefined();
    });
});

describe('deliverWebhook', () => {
    test('succeeds on first 2xx', async () => {
        const fetchImpl = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
        });
        const r = await deliverWebhook({
            url: 'https://example.test/hook',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{}',
            timeoutMs: 5000,
            maxRetries: 0,
            fetchImpl,
        });
        expect(r.ok).toBe(true);
        expect(r.attempts).toBe(1);
        expect(fetchImpl).toHaveBeenCalledTimes(1);
    });

    test('does not retry on 4xx', async () => {
        const fetchImpl = jest.fn().mockResolvedValue({
            ok: false,
            status: 404,
        });
        const r = await deliverWebhook({
            url: 'https://example.test/miss',
            method: 'POST',
            headers: {},
            body: '{}',
            timeoutMs: 5000,
            maxRetries: 2,
            fetchImpl,
        });
        expect(r.ok).toBe(false);
        expect(r.status).toBe(404);
        expect(fetchImpl).toHaveBeenCalledTimes(1);
    });

    test('retries on 5xx then succeeds', async () => {
        jest.useFakeTimers();
        const fetchImpl = jest
            .fn()
            .mockResolvedValueOnce({ ok: false, status: 503 })
            .mockResolvedValueOnce({ ok: true, status: 200 });

        const p = deliverWebhook({
            url: 'https://example.test/up',
            method: 'POST',
            headers: {},
            body: '{}',
            timeoutMs: 5000,
            maxRetries: 1,
            fetchImpl,
        });
        await jest.runAllTimersAsync();
        const r = await p;

        expect(r.ok).toBe(true);
        expect(r.attempts).toBe(2);
        expect(fetchImpl).toHaveBeenCalledTimes(2);
        jest.useRealTimers();
    });

    test('sets signature header when hmacSecret and body present', async () => {
        const fetchImpl = jest.fn().mockResolvedValue({ ok: true, status: 200 });
        const body = '{"x":1}';
        await deliverWebhook({
            url: 'https://example.test/signed',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
            timeoutMs: 5000,
            maxRetries: 0,
            hmacSecret: 'k',
            fetchImpl,
        });
        const call = fetchImpl.mock.calls[0];
        const headers = call[1]?.headers as Record<string, string>;
        expect(headers[WEBHOOK_SIGNATURE_HEADER]).toBe(`sha256=${signWebhookBody('k', body)}`);
    });
});

describe('AutomationService SEQUENCE → WEBHOOK', () => {
    const exec = (
        AutomationService as unknown as {
            executeAction: (a: unknown, d: unknown, w: unknown, depth?: number) => Promise<void>;
        }
    ).executeAction.bind(AutomationService);

    const workflow = {
        id: 42,
        name: 'Test WF',
        model: 'Partner',
        trigger: 'ON_CREATE',
    };

    test('runs two WEBHOOK steps in order', async () => {
        const fetchImpl = jest.fn().mockResolvedValue({ ok: true, status: 200 });
        const g = globalThis as typeof globalThis & { fetch: typeof fetch };
        const realFetch = g.fetch;
        g.fetch = fetchImpl as typeof fetch;
        try {
            await exec(
                {
                    type: 'SEQUENCE',
                    actions: [
                        {
                            type: 'WEBHOOK',
                            config: { url: 'https://example.test/one', maxRetries: 0 },
                        },
                        {
                            type: 'WEBHOOK',
                            config: { url: 'https://example.test/two', maxRetries: 0 },
                        },
                    ],
                },
                { id: 'p1', organizationId: 'default' },
                workflow,
            );
        } finally {
            g.fetch = realFetch;
        }
        expect(fetchImpl).toHaveBeenCalledTimes(2);
        expect(String(fetchImpl.mock.calls[0][0])).toContain('example.test/one');
        expect(String(fetchImpl.mock.calls[1][0])).toContain('example.test/two');
    });
});
