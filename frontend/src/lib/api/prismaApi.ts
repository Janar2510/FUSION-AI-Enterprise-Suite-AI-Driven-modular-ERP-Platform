/**
 * API configuration for FusionAI backend
 * 
 * The app uses both the legacy Python backend (old modules)
 * and the new Prisma API backend (new modules).
 */

// New Prisma API backend
export const API_URL = import.meta.env.VITE_PRISMA_API_URL || 'http://localhost:3001';

/**
 * Fetch helper with error handling
 */
export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${API_URL}${path}`;

    const response = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
        ...options,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
            errorData?.message || errorData?.error || `API Error: ${response.status} ${response.statusText}`
        );
    }

    return response.json();
}

/**
 * Convenience methods
 */
export const prismaApi = {
    get: <T>(path: string) => apiFetch<T>(path),

    post: <T>(path: string, data: any) =>
        apiFetch<T>(path, { method: 'POST', body: JSON.stringify(data) }),

    put: <T>(path: string, data: any) =>
        apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(data) }),

    patch: <T>(path: string, data: any) =>
        apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(data) }),

    delete: <T>(path: string) =>
        apiFetch<T>(path, { method: 'DELETE' }),
};
