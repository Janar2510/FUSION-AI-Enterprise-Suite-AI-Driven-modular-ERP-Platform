import * as Sentry from '@sentry/react';

export function initSentry() {
    const dsn = import.meta.env.VITE_SENTRY_DSN;
    if (!dsn) return;

    Sentry.init({
        dsn,
        environment: import.meta.env.MODE,
        release: import.meta.env.VITE_APP_VERSION,
        enabled: import.meta.env.PROD,
        tracesSampleRate: 0.1,
        replaysSessionSampleRate: 0.05,
        replaysOnErrorSampleRate: 1.0,
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration(),
        ],
    });
}
