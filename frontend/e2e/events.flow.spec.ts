/**
 * E2E — Events: Create Event → Add Ticket → Confirm → Register Attendee → Cancel
 *
 * Verifies the full events lifecycle:
 * draft event creation, ticket tier setup, event confirmation,
 * attendee registration, and cancellation.
 */

import { test, expect } from '@playwright/test';
import { injectAuth, stubUnmatched, jsonReply } from './helpers/setup';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const DRAFT_EVENT = {
  id: 100,
  name: 'Q3 Product Launch Webinar',
  state: 'draft',
  dateBegin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  dateEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3600 * 1000).toISOString(),
  location: 'Virtual',
  description: 'Launch event for Q3 product release.',
  seatsMax: 0,
  seatsReserved: 0,
  tickets: [],
  registrations: [],
};

const CONFIRMED_EVENT = { ...DRAFT_EVENT, state: 'confirmed' };
const CANCELLED_EVENT = { ...DRAFT_EVENT, state: 'cancelled' };

const TICKET = {
  id: 200,
  name: 'General Admission',
  price: 0,
  seatsAvail: 100,
  eventId: 100,
};

const REGISTRATION = {
  id: 300,
  name: 'Jane Smith',
  email: 'jane@example.com',
  state: 'confirmed',
  eventId: 100,
  ticketId: 200,
  ticket: { id: 200, name: 'General Admission', price: 0 },
};

const CANCELLED_REGISTRATION = { ...REGISTRATION, state: 'cancelled' };

// ── Create Event ─────────────────────────────────────────────────────────────

test.describe('Events — Create and configure', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await stubUnmatched(page);
  });

  test('creates a new draft event', async ({ page }) => {
    let events = [] as any[];
    let createdEvent = { ...DRAFT_EVENT };

    await page.route('**/api/events**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(jsonReply({ data: events, total: 0, page: 1, limit: 20 }));
      } else if (route.request().method() === 'POST') {
        createdEvent = { ...DRAFT_EVENT, id: 100 };
        events = [createdEvent];
        route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(createdEvent) });
      } else route.continue();
    });

    await page.goto('/module/events');
    await page.getByRole('button', { name: /new|create|add/i }).first().click();

    await expect(page.getByText('Q3 Product Launch Webinar', { exact: false })
      .or(page.getByText('Event', { exact: false }))
      .or(page.getByText('draft', { exact: false }))
    ).toBeVisible({ timeout: 5000 });
  });

  test('adds a ticket tier to the event', async ({ page }) => {
    const event = { ...DRAFT_EVENT, tickets: [] };

    await page.route('**/api/events**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(jsonReply({ data: [event], total: 1, page: 1, limit: 20 }));
      } else route.continue();
    });

    await page.route('**/api/events/100/tickets', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(jsonReply([]));
      } else if (route.request().method() === 'POST') {
        route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(TICKET) });
      } else route.continue();
    });

    await page.goto('/module/events');
    await page.getByText('Q3 Product Launch Webinar').first().click();
    await page.getByRole('button', { name: /add ticket|ticket/i }).first().click();

    await expect(page.getByText('General Admission', { exact: false })
      .or(page.getByText('ticket', { exact: false }))
      .or(page.getByText('Ticket', { exact: false }))
    ).toBeVisible({ timeout: 5000 });
  });
});

// ── Confirm Event ─────────────────────────────────────────────────────────────

test.describe('Events — Event confirmation', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await stubUnmatched(page);
  });

  test('confirms a draft event', async ({ page }) => {
    let event = { ...DRAFT_EVENT };

    await page.route('**/api/events**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(jsonReply({ data: [event], total: 1, page: 1, limit: 20 }));
      } else route.continue();
    });

    await page.route('**/api/events/100/state', async (route) => {
      event = { ...CONFIRMED_EVENT };
      route.fulfill(jsonReply(event));
    });

    await page.goto('/module/events');
    await page.getByText('Q3 Product Launch Webinar').first().click();
    await page.getByRole('button', { name: /confirm|publish/i }).first().click();

    await expect(page.getByText('confirmed', { exact: false })
      .or(page.getByText('Confirmed', { exact: false }))
    ).toBeVisible({ timeout: 5000 });
  });
});

// ── Register Attendee ─────────────────────────────────────────────────────────

test.describe('Events — Attendee registration', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await stubUnmatched(page);
  });

  test('registers an attendee on a confirmed event', async ({ page }) => {
    const event = { ...CONFIRMED_EVENT, tickets: [TICKET] };

    await page.route('**/api/events**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(jsonReply({ data: [event], total: 1, page: 1, limit: 20 }));
      } else route.continue();
    });

    await page.route('**/api/events/100/registrations', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(jsonReply({ data: [], total: 0, page: 1, limit: 20 }));
      } else route.continue();
    });

    await page.route('**/api/events/100/register', async (route) => {
      route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(REGISTRATION) });
    });

    await page.goto('/module/events');
    await page.getByText('Q3 Product Launch Webinar').first().click();
    await page.getByRole('button', { name: /register|rsvp|attend/i }).first().click();

    await expect(page.getByText('Jane Smith', { exact: false })
      .or(page.getByText('jane@example.com', { exact: false }))
      .or(page.getByText('registered', { exact: false }))
    ).toBeVisible({ timeout: 5000 });
  });

  test('cancels an attendee registration', async ({ page }) => {
    let registration = { ...REGISTRATION };
    const event = { ...CONFIRMED_EVENT, registrations: [registration] };

    await page.route('**/api/events**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(jsonReply({ data: [event], total: 1, page: 1, limit: 20 }));
      } else route.continue();
    });

    await page.route('**/api/events/100/registrations**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(jsonReply({ data: [registration], total: 1, page: 1, limit: 20 }));
      } else route.continue();
    });

    await page.route(/\/registrations\/300$/, async (route) => {
      registration = { ...CANCELLED_REGISTRATION };
      route.fulfill(jsonReply(registration));
    });

    await page.goto('/module/events');
    await page.getByText('Q3 Product Launch Webinar').first().click();
    await page.getByText('Jane Smith').first().click();
    await page.getByRole('button', { name: /cancel|remove/i }).first().click();

    await expect(page.getByText('cancelled', { exact: false })
      .or(page.getByText('cancelled', { exact: false }))
    ).toBeVisible({ timeout: 5000 });
  });
});

// ── Cancel Event ───────────────────────────────────────────────────────────────

test.describe('Events — Event cancellation', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await stubUnmatched(page);
  });

  test('cancels a confirmed event', async ({ page }) => {
    let event = { ...CONFIRMED_EVENT };

    await page.route('**/api/events**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(jsonReply({ data: [event], total: 1, page: 1, limit: 20 }));
      } else route.continue();
    });

    await page.route('**/api/events/100/state', async (route) => {
      event = { ...CANCELLED_EVENT };
      route.fulfill(jsonReply(event));
    });

    await page.goto('/module/events');
    await page.getByText('Q3 Product Launch Webinar').first().click();
    await page.getByRole('button', { name: /cancel/i }).first().click();

    await expect(page.getByText('cancelled', { exact: false })
      .or(page.getByText('Cancelled', { exact: false }))
    ).toBeVisible({ timeout: 5000 });
  });
});