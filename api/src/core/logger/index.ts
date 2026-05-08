import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino({
    level: process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info'),
    ...(isDev
        ? { transport: { target: 'pino-pretty', options: { colorize: true, ignore: 'pid,hostname' } } }
        : {
            formatters: {
                level: (label) => ({ level: label }),
            },
            timestamp: pino.stdTimeFunctions.isoTime,
            base: {
                service: 'fusionai-api',
                version: process.env.npm_package_version ?? '1.0.0',
                env: process.env.NODE_ENV,
            },
        }),
});

export default logger;
