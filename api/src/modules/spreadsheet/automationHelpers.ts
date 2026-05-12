/**
 * Shared helpers for workflow automation payloads (avoid leaking internals to integrations).
 */

export function omitPreviousRowSnapshot(data: unknown): Record<string, unknown> {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return {};
    }
    const { __previous: _omit, ...rest } = data as Record<string, unknown>;
    return rest;
}
