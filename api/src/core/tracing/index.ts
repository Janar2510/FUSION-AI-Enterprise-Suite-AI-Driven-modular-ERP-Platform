/**
 * OpenTelemetry auto-instrumentation.
 * Import this file at the very top of index.ts (before all other imports)
 * so the SDK can monkey-patch http, express, prisma, etc.
 *
 * Traces are exported to the OTEL_ENDPOINT (default: localhost:4318 OTLP/HTTP).
 * In development, set OTEL_ENABLED=false to disable.
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

let sdk: NodeSDK | null = null;

export function startTracing() {
    if (process.env.OTEL_ENABLED === 'false') return;

    const endpoint = process.env.OTEL_ENDPOINT ?? 'http://localhost:4318/v1/traces';

    sdk = new NodeSDK({
        resource: resourceFromAttributes({
            [ATTR_SERVICE_NAME]: 'fusionai-api',
            [ATTR_SERVICE_VERSION]: process.env.npm_package_version ?? '1.0.0',
            'deployment.environment': process.env.NODE_ENV ?? 'development',
        }),
        traceExporter: new OTLPTraceExporter({ url: endpoint }),
        instrumentations: [
            getNodeAutoInstrumentations({
                '@opentelemetry/instrumentation-fs': { enabled: false },
            }),
        ],
    });

    sdk.start();

    process.on('SIGTERM', async () => {
        await sdk?.shutdown();
    });
}
