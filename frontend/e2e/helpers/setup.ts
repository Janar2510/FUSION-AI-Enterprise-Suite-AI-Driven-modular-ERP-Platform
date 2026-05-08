import { Page } from '@playwright/test';

/** Inject a fake JWT so AuthContext skips the login redirect. */
export async function injectAuth(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'e2e-test-token');
  });
}

/** Silence any unmatched API calls so the UI doesn't crash on missing endpoints. */
export async function stubUnmatched(page: Page) {
  await page.route('**/api/**', (route) => {
    // Only fulfill if no other route handler already handled it
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [], total: 0 }) });
  });
}

export function jsonReply(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}
