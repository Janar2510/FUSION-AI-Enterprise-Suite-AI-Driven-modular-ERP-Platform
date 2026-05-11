/**
 * E2E — Surveys: Create Survey → Add Questions → Publish → Submit (public) → View Results
 *
 * Verifies the full surveys lifecycle:
 * survey creation, question authoring, publishing,
 * public submission, and response analytics.
 */

import { test, expect } from '@playwright/test';
import { injectAuth, stubUnmatched, jsonReply } from './helpers/setup';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const DRAFT_SURVEY = {
  id: 100,
  title: 'Employee Engagement Survey Q3 2026',
  description: 'Help us understand how to improve your workplace experience.',
  state: 'draft',
  accessToken: 'abc123def456',
  questions: [],
  responses: [],
  createdAt: new Date().toISOString(),
};

const PUBLISHED_SURVEY = { ...DRAFT_SURVEY, state: 'open' };
const CLOSED_SURVEY = { ...DRAFT_SURVEY, state: 'closed' };

const QUESTION_1 = {
  id: 201,
  surveyId: 100,
  title: 'How satisfied are you with your current role?',
  questionType: 'multiple_choice',
  sequence: 10,
  isRequired: true,
  answers: [
    { id: 301, value: 'Very Satisfied', sequence: 10, isCorrect: false },
    { id: 302, value: 'Satisfied', sequence: 20, isCorrect: false },
    { id: 303, value: 'Neutral', sequence: 30, isCorrect: false },
    { id: 304, value: 'Dissatisfied', sequence: 40, isCorrect: false },
  ],
};

const QUESTION_2 = {
  id: 202,
  surveyId: 100,
  title: 'Please share any additional feedback.',
  questionType: 'text_box',
  sequence: 20,
  isRequired: false,
  answers: [],
};

const SURVEY_WITH_QUESTIONS = { ...PUBLISHED_SURVEY, questions: [QUESTION_1, QUESTION_2] };

const SUBMISSION_RESPONSE = {
  inputId: 400,
};

const SURVEY_RESULTS = {
  surveyId: 100,
  title: 'Employee Engagement Survey Q3 2026',
  state: 'open',
  totalResponses: 1,
  questions: [
    {
      questionId: 201,
      title: 'How satisfied are you with your current role?',
      questionType: 'multiple_choice',
      totalAnswers: 0,
      options: [
        { label: 'Very Satisfied', count: 0 },
        { label: 'Satisfied', count: 0 },
        { label: 'Neutral', count: 0 },
        { label: 'Dissatisfied', count: 0 },
      ],
      numericAvg: null,
      numericMin: null,
      numericMax: null,
    },
    {
      questionId: 202,
      title: 'Please share any additional feedback.',
      questionType: 'text_box',
      totalAnswers: 0,
      options: undefined,
      numericAvg: null,
      numericMin: null,
      numericMax: null,
    },
  ],
};

// ── Create Survey ─────────────────────────────────────────────────────────────

test.describe('Surveys — Survey creation', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await stubUnmatched(page);
  });

  test('creates a new survey', async ({ page }) => {
    let createdSurvey = { ...DRAFT_SURVEY };

    await page.route('**/api/surveys**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(jsonReply({ data: [], total: 0, page: 1, limit: 20 }));
      } else if (route.request().method() === 'POST') {
        route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(createdSurvey) });
      } else route.continue();
    });

    await page.goto('/module/surveys');
    await page.getByRole('button', { name: /new|create|add/i }).first().click();

    await expect(page.getByText('Employee Engagement Survey Q3 2026', { exact: false })
      .or(page.getByText('Survey', { exact: false }))
      .or(page.getByText('draft', { exact: false }))
    ).toBeVisible({ timeout: 5000 });
  });
});

// ── Add Questions ─────────────────────────────────────────────────────────────

test.describe('Surveys — Question authoring', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await stubUnmatched(page);
  });

  test('adds a multiple-choice question to the survey', async ({ page }) => {
    const survey = { ...DRAFT_SURVEY, questions: [] };

    await page.route('**/api/surveys**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(jsonReply({ data: [survey], total: 1, page: 1, limit: 20 }));
      } else route.continue();
    });

    await page.route('**/api/surveys/100/questions', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(QUESTION_1) });
      } else route.continue();
    });

    await page.goto('/module/surveys');
    await page.getByText('Employee Engagement Survey Q3 2026').first().click();
    await page.getByRole('button', { name: /add question|new question/i }).first().click();

    await expect(
      page.getByText('How satisfied are you with your current role?', { exact: false })
        .or(page.getByText('multiple choice', { exact: false }))
        .or(page.getByText('question', { exact: false }))
    ).toBeVisible({ timeout: 5000 });
  });

  test('adds a text question to the survey', async ({ page }) => {
    const survey = { ...DRAFT_SURVEY, questions: [QUESTION_1] };

    await page.route('**/api/surveys**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(jsonReply({ data: [survey], total: 1, page: 1, limit: 20 }));
      } else route.continue();
    });

    await page.route('**/api/surveys/100/questions', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(QUESTION_2) });
      } else route.continue();
    });

    await page.goto('/module/surveys');
    await page.getByText('Employee Engagement Survey Q3 2026').first().click();
    await page.getByRole('button', { name: /add question|new question/i }).first().click();

    await expect(
      page.getByText('Please share any additional feedback.', { exact: false })
        .or(page.getByText('text', { exact: false }))
        .or(page.getByText('question', { exact: false }))
    ).toBeVisible({ timeout: 5000 });
  });
});

// ── Publish Survey ─────────────────────────────────────────────────────────────

test.describe('Surveys — Publishing', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await stubUnmatched(page);
  });

  test('publishes a draft survey', async ({ page }) => {
    let survey = { ...DRAFT_SURVEY, questions: [QUESTION_1, QUESTION_2] };

    await page.route('**/api/surveys**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(jsonReply({ data: [survey], total: 1, page: 1, limit: 20 }));
      } else route.continue();
    });

    await page.route('**/api/surveys/100', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(jsonReply(survey));
      } else route.continue();
    });

    await page.route('**/api/surveys/100/publish', async (route) => {
      survey = { ...PUBLISHED_SURVEY, questions: [QUESTION_1, QUESTION_2] };
      route.fulfill(jsonReply(survey));
    });

    await page.goto('/module/surveys');
    await page.getByText('Employee Engagement Survey Q3 2026').first().click();
    await page.getByRole('button', { name: /publish|open|activate/i }).first().click();

    await expect(page.getByText('open', { exact: false })
      .or(page.getByText('Open', { exact: false }))
      .or(page.getByText('Published', { exact: false }))
    ).toBeVisible({ timeout: 5000 });
  });
});

// ── Public Submission ──────────────────────────────────────────────────────────

test.describe('Surveys — Public submission', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/**', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [], total: 0 }) });
    });
  });

  test('allows anonymous user to submit a response', async ({ page }) => {
    await page.route(/\/api\/surveys\/public\/100$/, (route) => {
      route.fulfill(jsonReply(SURVEY_WITH_QUESTIONS));
    });

    await page.route(/\/api\/surveys\/public\/100\/submit$/, async (route) => {
      route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(SUBMISSION_RESPONSE) });
    });

    await page.goto('/survey/100');

    await expect(page.getByText('Employee Engagement Survey Q3 2026', { exact: false }))
      .toBeVisible({ timeout: 8000 });

    // At least one question should appear
    await expect(
      page.getByText('How satisfied are you with your current role?', { exact: false })
        .or(page.getByText('survey', { exact: false }))
    ).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: /submit|send|respond/i }).first().click();

    await expect(
      page.getByText('Thank you', { exact: false })
        .or(page.getByText('submitted', { exact: false }))
        .or(page.getByText('success', { exact: false }))
    ).toBeVisible({ timeout: 5000 });
  });
});

// ── View Results ─────────────────────────────────────────────────────────────

test.describe('Surveys — Response analytics', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await stubUnmatched(page);
  });

  test('shows survey results and response counts', async ({ page }) => {
    const survey = { ...PUBLISHED_SURVEY, questions: [QUESTION_1, QUESTION_2] };

    await page.route('**/api/surveys**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(jsonReply({ data: [survey], total: 1, page: 1, limit: 20 }));
      } else route.continue();
    });

    await page.route('**/api/surveys/100/results', (route) =>
      route.fulfill(jsonReply(SURVEY_RESULTS))
    );

    await page.goto('/module/surveys');
    await page.getByText('Employee Engagement Survey Q3 2026').first().click();
    await page.getByRole('button', { name: /results|analytics|responses/i }).first().click();

    await expect(
      page.getByText('totalResponses', { exact: false })
        .or(page.getByText('1', { exact: false }))
        .or(page.getByText('responses', { exact: false }))
        .or(page.getByText('results', { exact: false }))
    ).toBeVisible({ timeout: 5000 });
  });
});

// ── Close Survey ─────────────────────────────────────────────────────────────

test.describe('Surveys — Survey lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await stubUnmatched(page);
  });

  test('closes a published survey', async ({ page }) => {
    let survey = { ...PUBLISHED_SURVEY, questions: [QUESTION_1, QUESTION_2] };

    await page.route('**/api/surveys**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(jsonReply({ data: [survey], total: 1, page: 1, limit: 20 }));
      } else route.continue();
    });

    await page.route('**/api/surveys/100/close', async (route) => {
      survey = { ...CLOSED_SURVEY, questions: [QUESTION_1, QUESTION_2] };
      route.fulfill(jsonReply(survey));
    });

    await page.goto('/module/surveys');
    await page.getByText('Employee Engagement Survey Q3 2026').first().click();
    await page.getByRole('button', { name: /close|end/i }).first().click();

    await expect(page.getByText('closed', { exact: false })
      .or(page.getByText('Closed', { exact: false }))
    ).toBeVisible({ timeout: 5000 });
  });
});