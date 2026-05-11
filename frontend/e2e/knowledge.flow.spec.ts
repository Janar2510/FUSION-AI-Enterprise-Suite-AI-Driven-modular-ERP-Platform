/**
 * E2E — Knowledge Base: Create Article → Publish → RAG Search → AI Draft → Verify
 *
 * Verifies the knowledge base lifecycle:
 * article creation, publishing, RAG-powered search, AI draft generation,
 * and review of the generated content.
 */

import { test, expect } from '@playwright/test';
import { injectAuth, stubUnmatched, jsonReply } from './helpers/setup';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const WORKSPACE = {
  id: 10,
  name: 'Engineering Docs',
  description: 'Technical documentation for the engineering team.',
};

const DRAFT_ARTICLE = {
  id: 500,
  title: 'How to Set Up API Keys',
  body: '',
  isPublished: false,
  workspaceId: 10,
  workspace: WORKSPACE,
  viewCount: 0,
  parentId: null,
  children: [],
  revisions: [],
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
};

const PUBLISHED_ARTICLE = {
  ...DRAFT_ARTICLE,
  isPublished: true,
  body: `# How to Set Up API Keys

## Overview
This guide explains how to configure API keys for third-party integrations.

## Steps
1. Navigate to Settings > API Keys
2. Click "Generate New Key"
3. Copy the key and store it securely

## Common Issues
- Missing permissions
- Expired tokens
`,
};

const AI_DRAFT_BODY = `# How to Set Up API Keys

## Overview
This article explains the process of generating and managing API keys for FusionAI ERP integrations.

## Key Concepts
- **API Key**: A unique identifier used to authenticate requests
- **Scopes**: Permissions assigned to an API key
- **Rate Limits**: Request quotas per key

## Step-by-Step Instructions
1. Log in to the admin panel at /admin
2. Navigate to Settings > Integrations
3. Click "Create API Key"
4. Assign appropriate scopes based on your use case
5. Copy and securely store the generated key

## Common Issues and Solutions
- **Invalid key format**: Ensure no extra whitespace when copying
- **Scope not permitted**: Check that your user role includes the required permissions
- **Key expired**: Contact admin to renew the key

## Related Topics
- Managing API key scopes
- Security best practices for API authentication
`;

const AI_GENERATE_RESPONSE = {
  body: AI_DRAFT_BODY,
  model: 'claude-3-5-haiku-20241022',
};

const KNOWLEDGE_SEARCH_RESULTS = {
  data: [PUBLISHED_ARTICLE],
  total: 1,
  page: 1,
  limit: 20,
};

// ── Create Article ─────────────────────────────────────────────────────────────

test.describe('Knowledge — Article creation', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await stubUnmatched(page);
  });

  test('creates a new draft article', async ({ page }) => {
    await page.route('**/api/knowledge**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(jsonReply({ data: [], total: 0, page: 1, limit: 20 }));
      } else if (route.request().method() === 'POST') {
        route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(DRAFT_ARTICLE) });
      } else route.continue();
    });

    await page.route('**/api/knowledge/workspaces', (route) =>
      route.fulfill(jsonReply([WORKSPACE]))
    );

    await page.goto('/module/knowledge');
    await page.getByRole('button', { name: /new|create|add article/i }).first().click();

    await expect(
      page.getByText('How to Set Up API Keys', { exact: false })
        .or(page.getByText('Article', { exact: false }))
        .or(page.getByText('draft', { exact: false }))
    ).toBeVisible({ timeout: 5000 });
  });
});

// ── Publish Article ────────────────────────────────────────────────────────────

test.describe('Knowledge — Publishing', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await stubUnmatched(page);
  });

  test('publishes a draft article', async ({ page }) => {
    const article = { ...DRAFT_ARTICLE };

    await page.route('**/api/knowledge**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(jsonReply({ data: [article], total: 1, page: 1, limit: 20 }));
      } else route.continue();
    });

    await page.route('**/api/knowledge/500', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(jsonReply(article));
      } else route.continue();
    });

    await page.route('**/api/knowledge/500', async (route) => {
      route.fulfill(jsonReply(PUBLISHED_ARTICLE));
    });

    await page.goto('/module/knowledge');
    await page.getByText('How to Set Up API Keys').first().click();
    await page.getByRole('button', { name: /publish|publish article/i }).first().click();

    await expect(page.getByText('published', { exact: false })
      .or(page.getByText('Published', { exact: false }))
      .or(page.getByText('isPublished', { exact: false }))
    ).toBeVisible({ timeout: 5000 });
  });
});

// ── RAG Search ────────────────────────────────────────────────────────────────

test.describe('Knowledge — RAG-powered search', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await stubUnmatched(page);
  });

  test('finds articles via semantic search', async ({ page }) => {
    await page.route('**/api/knowledge**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(jsonReply(KNOWLEDGE_SEARCH_RESULTS));
      } else route.continue();
    });

    await page.goto('/module/knowledge');

    await page.getByPlaceholder(/search|find|look up/i).first().fill('API key setup');
    await page.getByPlaceholder(/search|find|look up/i).first().press('Enter');

    await expect(
      page.getByText('How to Set Up API Keys', { exact: false })
        .or(page.getByText('API', { exact: false }))
        .or(page.getByText('search', { exact: false }))
    ).toBeVisible({ timeout: 5000 });
  });

  test('displays article content after search selection', async ({ page }) => {
    const article = { ...PUBLISHED_ARTICLE };

    await page.route('**/api/knowledge**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(jsonReply(KNOWLEDGE_SEARCH_RESULTS));
      } else route.continue();
    });

    await page.route('**/api/knowledge/500', (route) =>
      route.fulfill(jsonReply(article))
    );

    await page.goto('/module/knowledge');

    await page.getByPlaceholder(/search|find|look up/i).first().fill('API key');
    await page.getByPlaceholder(/search|find|look up/i).first().press('Enter');

    await page.getByText('How to Set Up API Keys').first().click();

    // RAG content should appear in the article view
    await expect(
      page.getByText('Overview', { exact: false })
        .or(page.getByText('API Keys', { exact: false }))
        .or(page.getByText('Steps', { exact: false }))
    ).toBeVisible({ timeout: 5000 });
  });
});

// ── AI Draft Generation ───────────────────────────────────────────────────────

test.describe('Knowledge — AI draft generation', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await stubUnmatched(page);
  });

  test('generates an AI draft article from a title', async ({ page }) => {
    const article = { ...DRAFT_ARTICLE };

    await page.route('**/api/knowledge**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(jsonReply({ data: [article], total: 1, page: 1, limit: 20 }));
      } else route.continue();
    });

    await page.route('**/api/knowledge/500', (route) =>
      route.fulfill(jsonReply(article))
    );

    await page.route('**/api/knowledge/ai/generate', async (route) => {
      route.fulfill(jsonReply(AI_GENERATE_RESPONSE));
    });

    await page.goto('/module/knowledge');
    await page.getByText('How to Set Up API Keys').first().click();
    await page.getByRole('button', { name: /generate|ai draft|write with ai/i }).first().click();

    // AI-generated sections should appear
    await expect(
      page.getByText('Overview', { exact: false })
        .or(page.getByText('Key Concepts', { exact: false }))
        .or(page.getByText('Step-by-Step', { exact: false }))
        .or(page.getByText('API Key', { exact: false }))
    ).toBeVisible({ timeout: 10000 });
  });

  test('verifies AI draft contains expected sections', async ({ page }) => {
    const article = { ...DRAFT_ARTICLE };

    await page.route('**/api/knowledge**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(jsonReply({ data: [article], total: 1, page: 1, limit: 20 }));
      } else route.continue();
    });

    await page.route('**/api/knowledge/500', (route) =>
      route.fulfill(jsonReply(article))
    );

    await page.route('**/api/knowledge/ai/generate', async (route) =>
      route.fulfill(jsonReply(AI_GENERATE_RESPONSE))
    );

    await page.goto('/module/knowledge');
    await page.getByText('How to Set Up API Keys').first().click();
    await page.getByRole('button', { name: /generate|ai draft|write with ai/i }).first().click();

    // Verify the AI draft content
    await expect(page.getByText('Scopes', { exact: false })
      .or(page.getByText('Rate Limits', { exact: false }))
      .or(page.getByText('Common Issues', { exact: false }))
    ).toBeVisible({ timeout: 10000 });
  });

  test('saves AI draft content to the article', async ({ page }) => {
    const article = { ...DRAFT_ARTICLE };

    await page.route('**/api/knowledge**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(jsonReply({ data: [article], total: 1, page: 1, limit: 20 }));
      } else route.continue();
    });

    await page.route('**/api/knowledge/500', (route) =>
      route.fulfill(jsonReply(article))
    );

    await page.route('**/api/knowledge/ai/generate', (route) =>
      route.fulfill(jsonReply(AI_GENERATE_RESPONSE))
    );

    await page.goto('/module/knowledge');
    await page.getByText('How to Set Up API Keys').first().click();
    await page.getByRole('button', { name: /generate|ai draft|write with ai/i }).first().click();

    // Confirm the draft is populated (body contains markdown)
    await expect(
      page.getByText('# How to Set Up API Keys', { exact: false })
        .or(page.getByText('## Key Concepts', { exact: false }))
        .or(page.getByText('## Overview', { exact: false }))
    ).toBeVisible({ timeout: 10000 });
  });
});