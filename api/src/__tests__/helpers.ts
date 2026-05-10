/**
 * Shared test helpers for integration tests.
 *
 * Generates a valid Bearer JWT signed with the same default secret used by
 * `core/auth` when JWT_SECRET is not set in the environment.
 */

import jwt from 'jsonwebtoken';

const TEST_JWT_SECRET = process.env.JWT_SECRET ?? 'change-me-in-production-32-chars-minimum';

interface TestUser {
    userId?: string;
    email?: string;
    role?: string;
}

/**
 * Returns a signed access token for use in test requests.
 * Sets Authorization header: `Authorization: Bearer <token>`
 */
export function testToken(user: TestUser = {}): string {
    const payload = {
        sub: user.userId ?? 'test-user-1',
        email: user.email ?? 'test@fusionai.io',
        role: user.role ?? 'admin',
    };
    return jwt.sign(payload, TEST_JWT_SECRET, { expiresIn: '1h' });
}

/**
 * Returns { Authorization: 'Bearer <token>' } header object for supertest.
 */
export function authHeader(user: TestUser = {}): { Authorization: string } {
    return { Authorization: `Bearer ${testToken(user)}` };
}
