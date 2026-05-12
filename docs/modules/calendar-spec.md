# Calendar — Gap Analysis
**Odoo 17 docs:** https://www.odoo.com/documentation/17.0/applications/productivity/calendar.html
**FusionAI status:** Partial
**Effort to complete:** M
**Business priority:** P2

---
## Odoo 17 Feature Checklist

### Core Features
- [x] Create event (subject, start, stop) — ✅ Done
- [x] All-day events — ✅ Done (allday checkbox)
- [x] Event description / notes — ✅ Done
- [x] Event location — ✅ Done
- [x] Attendees with RSVP status (accepted / declined / tentative / needsAction) — 🟡 Partial (data model + display done; no "accept/decline" action from UI)
- [x] Edit event — ✅ Done (PUT /calendar/:id)
- [x] Delete event — ✅ Done (DELETE /calendar/:id)
- [ ] Recurrence rules (daily / weekly / monthly / yearly + end condition) — ❌ Missing (no recurrence field in schema or UI)
- [ ] Timezone selection per event — ❌ Missing
- [ ] Event reminders / notifications — ❌ Missing
- [ ] Event tags / categories — ❌ Missing
- [ ] Privacy control (public / private / only me) — ❌ Missing
- [ ] Video conference link field (Zoom / Meet / Teams) — ❌ Missing
- [ ] Multiple calendars / color coding — ❌ Missing

### Views / UI
- [x] List view — ✅ Done (OdooListBase with subject, start, stop, attendees, location)
- [x] Form view — ✅ Done (OdooFormBase)
- [ ] Month view (real calendar grid) — ❌ Missing ("kanban" slot shows a placeholder stub, not a calendar grid)
- [ ] Week view — ❌ Missing
- [ ] Day view — ❌ Missing
- [ ] Year view — ❌ Missing
- [ ] "Show weekends" toggle — ❌ Missing
- [ ] Multi-user calendar overlay (team availability) — ❌ Missing

### Role & Permission Settings
- [ ] Organizer assignment — ❌ Missing (no organizer field)
- [ ] Calendar sharing / visibility settings — ❌ Missing

### Module Configuration
- [ ] Google Calendar OAuth sync — ❌ Missing
- [ ] Microsoft Outlook Calendar sync — ❌ Missing
- [ ] Working hours definition — ❌ Missing

### Integrations
- [ ] Discuss — "Add to calendar" from channel / start meeting — ❌ Missing
- [ ] CRM — create event from opportunity chatter activity — ❌ Missing
- [ ] HR / Leaves — block leave dates on calendar — ❌ Missing
- [ ] Claude AI — AI scheduling assistant / conflict detection — ❌ Missing
- [ ] Share availability / appointment booking link — ❌ Missing
- [ ] Appointment questions / custom questionnaire — ❌ Missing
- [ ] Email confirmation templates — ❌ Missing

### API Endpoints
- [x] GET  /calendar?start=&stop= (date-range filter) — ✅
- [x] GET  /calendar/:id — ✅
- [x] POST /calendar (with attendeeIds) — ✅
- [x] POST /calendar/events — ✅ (Track B module adapter; same body as POST /calendar; `calendarApi.createEvent` in frontend)
- [x] PUT  /calendar/:id — ✅
- [x] DELETE /calendar/:id — ✅
- [ ] POST /calendar/:id/accept — ❌ (attendee RSVP action)
- [ ] POST /calendar/:id/decline — ❌
- [ ] GET  /calendar/availabilities — ❌ (free/busy slots)
- [ ] POST /calendar/sync/google — ❌
- [ ] POST /calendar/sync/outlook — ❌

---
## Missing Features Summary

| Gap | Severity |
|-----|----------|
| No real calendar grid (month/week/day views) — stub only | High |
| No event recurrence | High |
| No Google / Outlook sync | Medium |
| RSVP accept/decline not actionable | Medium |
| No reminders / notifications | Medium |
| No timezone support | Medium |
| No appointment booking / share availability | Medium |
| No Claude AI scheduling integration | Low |

---
## Recommended Build Order

1. **Month calendar grid** — replace the stub `renderDashboard` with a real grid component (react-big-calendar or custom) (3 days)
2. **Week + Day views** — add to view switcher in OdooViewManager (2 days)
3. **Recurrence rules** — add `rrule` field to Prisma schema + UI; expand GET endpoint to expand recurring events (3 days)
4. **RSVP actions** — POST /calendar/:id/accept|decline endpoint + button in attendees panel (1 day)
5. **Reminders** — reminder model, cron/queue to fire email/notification at reminder time (2 days)
6. **Video conference link** — free-text URL field on event form (0.5 days)
7. **Google Calendar sync** — OAuth2 flow + googleapis client for two-way sync (3 days)
8. **Outlook sync** — MS Graph OAuth + calendar sync (3 days)
9. **Claude AI** — conflict detection + smart scheduling suggestion in form sidebar (2 days)
