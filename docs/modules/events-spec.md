# Events — Gap Analysis
**Odoo 17 docs:** https://www.odoo.com/documentation/17.0/applications/marketing/events.html
**FusionAI status:** Partial
**Effort to complete:** L
**Business priority:** P2

---
## Odoo 17 Feature Checklist

### Core Features
- [ ] Event creation (name, dates, location, description, seat limit) — ✅ Done
- [ ] Event archive / cancel / restore — ✅ Done (`active` flag)
- [ ] Attendee registration with name / email / phone / status — ✅ Done (model exists, POST /:id/register)
- [ ] Seat limit enforcement (seatsMax) — 🟡 Partial (field stored, not enforced server-side)
- [ ] Seats available counter — 🟡 Partial (computed client-side only)
- [ ] Event stages / pipeline (New → Booked → Announced → Ended → Cancelled) — ❌ Missing (FusionAI has no stage model; uses active flag only)
- [ ] Event templates (reusable configurations) — ❌ Missing
- [ ] Ticket tiers with variable pricing — ❌ Missing
- [ ] Ticket sale via Sales orders — ❌ Missing
- [ ] Online ticketing via website — ❌ Missing
- [ ] Booth categories with pricing and reservation — ❌ Missing
- [ ] Online exhibitor / sponsor display — ❌ Missing
- [ ] Event tracks (talks, presentations, schedules) — ❌ Missing
- [ ] Track speaker management (bio, contact) — ❌ Missing
- [ ] Track quizzes / gamification — ❌ Missing
- [ ] Live broadcast / YouTube streaming integration — ❌ Missing
- [ ] Community chat rooms (Jitsi integration) — ❌ Missing
- [ ] Registration desk with barcode / QR scanning — ❌ Missing
- [ ] Custom registration questions / attendee data collection — ❌ Missing
- [ ] Automated communication (pre-event email, reminders) — ❌ Missing
- [ ] CRM lead generation from event attendees — ❌ Missing
- [ ] Revenue / ticket analytics reporting — ❌ Missing
- [ ] Attendance check-in tracking — ❌ Missing

### Views / UI
- [ ] Kanban view (pipeline stages) — 🟡 Partial (renders as dashboard cards, not true stage kanban)
- [ ] List view — ✅ Done
- [ ] Form view — ✅ Done
- [ ] Calendar view — ❌ Missing
- [ ] Graph / revenue analytics view — ❌ Missing
- [ ] Registration desk portal view — ❌ Missing
- [ ] Website event page (frontend) — ❌ Missing

### Role & Permission Settings
- [ ] Event administrator role — ❌ Missing
- [ ] Event user role (create / edit own events) — ❌ Missing
- [ ] Public attendee registration (unauthenticated) — ❌ Missing

### Module Configuration
- [ ] Settings → Enable Schedule & Tracks — ❌ Missing
- [ ] Settings → Enable Live Broadcast (YouTube) — ❌ Missing
- [ ] Settings → Enable Event Gamification — ❌ Missing
- [ ] Settings → Enable Online Exhibitors — ❌ Missing
- [ ] Settings → Jitsi Server Domain — ❌ Missing
- [ ] Settings → Enable Community Chat Rooms — ❌ Missing
- [ ] Settings → Enable Booth Management — ❌ Missing
- [ ] Settings → Enable Ticketing — ❌ Missing
- [ ] Settings → Enable Online Ticketing — ❌ Missing
- [ ] Settings → Enable Barcode Attendance — ❌ Missing

### Integrations
- [ ] Calendar — ❌ Missing (event dates not synced to Calendar module)
- [ ] Mail / Chatter — ❌ Missing
- [ ] Sales (ticket orders) — ❌ Missing
- [ ] Website (public event pages) — ❌ Missing
- [ ] CRM (lead generation from registrants) — ❌ Missing
- [ ] YouTube (live streaming) — ❌ Missing
- [ ] Jitsi (community rooms) — ❌ Missing
- [ ] Automation module — ❌ Missing
- [ ] Claude AI (3 actions: generate event description, draft follow-up email, suggest agenda) — ❌ Missing

### API Endpoints
- [ ] GET /api/events — ✅ Done (paginated, includes registration count)
- [ ] GET /api/events/:id — ✅ Done (includes registrations array)
- [ ] POST /api/events — ✅ Done
- [ ] PUT /api/events/:id — ✅ Done
- [ ] DELETE /api/events/:id — ✅ Done (store has deleteEvent, but no route exposed in router)
- [ ] POST /api/events/:id/register — ✅ Done
- [ ] GET /api/events/:id/registrations — ❌ Missing (must fetch via GET /:id)
- [ ] PUT /api/events/:id/registrations/:regId — ❌ Missing (confirm / cancel attendee)
- [ ] GET /api/events/:id/tickets — ❌ Missing
- [ ] POST /api/events/:id/tickets — ❌ Missing
- [ ] GET /api/events/analysis (revenue / attendee report) — ❌ Missing

---
## Missing Features Summary

**Critical gaps (block real use):**
1. No event stages — events only use an `active` boolean; there is no New/Booked/Announced/Ended pipeline
2. No ticket system — cannot sell or manage tiered tickets
3. No registration management UI — attendee list only visible in raw API response
4. Seat enforcement is client-side only — overbooking possible
5. No automated email communication (confirmation, reminders)
6. DELETE route missing on the express router (store calls it but no route registered)

**Functional but shallow:**
- Kanban view renders a dashboard card grid, not a draggable stage pipeline
- `seatsAvailable` is stored but not recomputed after each registration
- No Calendar sync for event start/end dates

**Analytics missing entirely:**
- Revenue reporting, ticket-type breakdown, attendee demographics — all absent

---
## Recommended Build Order

1. **Fix DELETE route** — register DELETE /api/events/:id — 0.5 day
2. **Server-side seat enforcement** — reject registration when seatsMax reached — 0.5 day
3. **Registration management UI** — attendee list tab on event form with confirm/cancel actions — 2 days
4. **Event stage pipeline** — replace `active` boolean with stage model (New/Booked/Announced/Ended/Cancelled), stage kanban — 3 days
5. **Chatter / Mail panel** on event form — 1 day
6. **Automated emails** — registration confirmation, pre-event reminder — 2 days
7. **Ticket tiers** (model + UI + pricing) — 3 days
8. **Calendar view** — render events on a monthly/weekly calendar — 3 days
9. **CRM lead generation** from attendees — 2 days
10. **Event templates** — reusable event configs — 1 day
11. **Graph / revenue analytics** — 2 days
12. **Claude AI actions** — generate description, draft follow-up, suggest agenda — 2 days
