# Email Marketing — Gap Analysis
**Odoo 17 docs:** https://www.odoo.com/documentation/17.0/applications/marketing/email_marketing.html
**FusionAI status:** Partial
**Effort to complete:** XL
**Business priority:** P2

---
## Odoo 17 Feature Checklist

### Core Features
- [x] Create mass mailing (subject, HTML body) — ✅ Done
- [x] Draft / In Queue / Sending / Done state machine — ✅ Done (state transitions wired to buttons)
- [x] Schedule send date — ✅ Done (scheduledDate field + datetime-local input)
- [x] Send now action — 🟡 Partial (sets state to 'sending' client-side; no actual SMTP dispatch)
- [x] Cancel schedule (back to draft) — ✅ Done
- [x] Delivery metrics display (sent / opened / clicked / bounced) — ✅ Done (read-only counts in form sidebar)
- [x] Dashboard with aggregate KPIs (total sent, avg open rate, scheduled count, avg bounce rate) — ✅ Done
- [ ] Mailing lists (contact groups) — ❌ Missing (no MailingList model or UI)
- [ ] Contact segmentation / recipient filtering — ❌ Missing (no "Recipients" selector; who receives the email is undefined)
- [ ] Drag-and-drop email builder — ❌ Missing (raw HTML textarea only)
- [ ] Pre-built email templates library — ❌ Missing
- [ ] A/B testing (multiple versions, winner selection by open/click/revenue) — ❌ Missing
- [ ] Unsubscribe / blacklist management — ❌ Missing (no unsubscribe link generation or blacklist DB)
- [ ] "Blacklist option when unsubscribing" setting — ❌ Missing
- [ ] Preview text (email preheader) — ❌ Missing
- [ ] Sender name / from-address customization — ❌ Missing
- [ ] File attachments to mailings — ❌ Missing
- [ ] Responsible user designation — ❌ Missing
- [ ] Mailing campaigns grouping — ❌ Missing (MassMailing has no campaign relation)
- [ ] Test send before broadcast — ❌ Missing
- [ ] 24-hour stat report (mailing performance after 1 day) — ❌ Missing
- [ ] Dedicated SMTP server config — ❌ Missing (email delivery not wired to any SMTP provider)
- [ ] Actual email dispatch (SMTP / SES / SendGrid) — ❌ Missing (setting state to 'sending' does NOT send emails)

### Views / UI
- [x] Kanban / dashboard view — ✅ Done (renderDashboard with KPI cards + list)
- [x] List view — ✅ Done (same as dashboard, shows campaigns with metrics columns)
- [x] Form view — ✅ Done (OdooFormBase with subject, HTML body, scheduling, metrics)
- [ ] Calendar view of scheduled mailings — ❌ Missing
- [ ] Graph / pivot analytics view — ❌ Missing
- [ ] Per-mailing detailed analytics (open map, click heatmap, link clicks) — ❌ Missing

### Role & Permission Settings
- [ ] Mailing manager vs. user roles — ❌ Missing
- [ ] Restrict send to manager approval — ❌ Missing

### Module Configuration
- [ ] Enable "Mailing Campaigns" feature flag — ❌ Missing
- [ ] Dedicated outbound SMTP server setup — ❌ Missing
- [ ] Unsubscribe page configuration — ❌ Missing
- [ ] Default from-email / from-name settings — ❌ Missing

### Integrations
- [ ] Contacts / Partners — recipient list from Contact module — ❌ Missing
- [ ] CRM Leads — send to lead segment — ❌ Missing
- [ ] Events — send to event registrants — ❌ Missing
- [ ] Sales Orders — send to customers with active orders — ❌ Missing
- [ ] Claude AI — AI subject line generator, body copy assistant, send-time optimisation — ❌ Missing
- [ ] Automation — trigger mailing from automation rule — ❌ Missing
- [ ] Google Analytics UTM auto-tagging — ❌ Missing

### API Endpoints
- [x] GET  /marketing-web/mailings (paginated) — ✅
- [x] POST /marketing-web/mailings — ✅
- [x] PUT  /marketing-web/mailings/:id — ✅
- [x] DELETE /marketing-web/mailings/:id — ✅
- [ ] POST /marketing-web/mailings/:id/send — ❌ (actual dispatch, not just state change)
- [ ] POST /marketing-web/mailings/:id/send-test — ❌
- [ ] GET  /marketing-web/mailing-lists — ❌
- [ ] POST /marketing-web/mailing-lists — ❌
- [ ] POST /marketing-web/mailing-lists/:id/contacts — ❌
- [ ] GET  /marketing-web/blacklist — ❌
- [ ] POST /marketing-web/blacklist — ❌
- [ ] DELETE /marketing-web/blacklist/:email — ❌
- [ ] GET  /marketing-web/mailings/:id/stats (click-through, open map) — ❌
- [ ] POST /marketing-web/unsubscribe (public webhook) — ❌

---
## Missing Features Summary

| Gap | Severity |
|-----|----------|
| No actual email dispatch — SMTP not wired | Critical |
| No mailing lists / contact segmentation | Critical |
| No unsubscribe / blacklist management (legal requirement) | Critical |
| Drag-and-drop email builder absent (raw HTML only) | High |
| No A/B testing | High |
| No template library | High |
| No mailing campaigns grouping | Medium |
| No dedicated SMTP server config | High |
| No test-send before broadcast | High |
| No Claude AI copy assistance | Low |
| No calendar or graph analytics views | Medium |

---
## Recommended Build Order

1. **SMTP dispatch** — wire `POST /marketing-web/mailings/:id/send` to nodemailer/SendGrid with env-configured SMTP; update `sentCount` from delivery receipt (3 days)
2. **Mailing lists** — add MailingList + MailingContact Prisma models; CRUD endpoints; recipient selector on mailing form (2 days)
3. **Unsubscribe / blacklist** — generate unsubscribe token, add public POST /unsubscribe webhook, MailBlacklist model, filter blacklisted addresses before dispatch (2 days)
4. **Test send** — `POST /marketing-web/mailings/:id/send-test?to=email` — dispatch single copy to tester (0.5 days)
5. **Template library** — seed 5-10 HTML templates; template picker on form (2 days)
6. **Drag-and-drop builder** — integrate Unlayer / GrapesJS or React Email editor (4 days)
7. **A/B testing** — add `abVariants` JSON field; split-send logic; winner selection cron (3 days)
8. **Campaign grouping** — add MailingCampaign model + campaign selector on mailing form (1 day)
9. **Analytics view** — per-mailing stats endpoint + graph view (2 days)
10. **Claude AI** — subject line generator + body copy assistant in form sidebar (1 day)
