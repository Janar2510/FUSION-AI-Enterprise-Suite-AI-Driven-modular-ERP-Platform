# Subscriptions — Gap Analysis
**Odoo 17 docs:** https://www.odoo.com/documentation/17.0/applications/sales/subscriptions.html
**FusionAI status:** Partial
**Effort to complete:** L
**Business priority:** P2

---
## Odoo 17 Feature Checklist

### Core Features
- [x] Subscription CRUD (create, read, update, delete) — ✅ Done
- [x] Subscription states: draft, in_progress, churned, closed — ✅ Done
- [x] MRR and ARR calculation (display-level) — ✅ Done
- [x] Billing cycle (monthly / yearly) — 🟡 Partial (recurringRule field: monthly/yearly; recurringInterval stored but not enforced)
- [x] Plan tiers (starter / pro / enterprise) — 🟡 Partial (hardcoded string options; no configurable plan objects)
- [x] Activate (draft → in_progress) action — ✅ Done
- [x] Churn action (in_progress → churned) — ✅ Done
- [x] Partner / customer link — ✅ Done
- [x] Start date, next billing date, end date fields — ✅ Done (model fields)
- [ ] Subscription products with recurring price rules — ❌ Missing (no product line items on subscriptions)
- [ ] Subscription line items / quantities — ❌ Missing
- [ ] Recurring plan objects (configurable billing periods, invoice templates) — ❌ Missing (plan is a plain string, not a relational model)
- [ ] Automated renewal invoicing (scheduled action) — ❌ Missing
- [ ] Renewal quotation generation before expiry — ❌ Missing
- [ ] Upsell / cross-sell quotation flow — ❌ Missing
- [ ] Customer self-service portal (close, add products, plan switch, manual renewal) — ❌ Missing
- [ ] Payment provider integration (auto-charge on renewal) — ❌ Missing
- [ ] Non-payment automatic closing rule — ❌ Missing
- [ ] Churn reason tracking — ❌ Missing
- [ ] Subscription alerts (payment failure, churn risk) — ❌ Missing
- [ ] Revenue recognition accounting entries — ❌ Missing
- [ ] eCommerce product publication for subscriptions — ❌ Missing
- [ ] Cancellation workflow with confirmation email — ❌ Missing
- [ ] Trial period support — ❌ Missing
- [ ] Discount / promo code on subscription plans — ❌ Missing

### Views / UI
- [x] Dashboard (MRR, Active, ARR, Churned metric cards) — ✅ Done
- [x] List view (OdooListBase with search) — ✅ Done
- [x] Form view (OdooFormBase with status ribbon) — ✅ Done
- [ ] Kanban view (by state / plan) — ❌ Missing
- [ ] Graph / pivot view (MRR trend, churn rate over time) — ❌ Missing
- [ ] Subscription analytics report — ❌ Missing
- [ ] Recurring plans configuration view — ❌ Missing
- [ ] Subscription product configuration view — ❌ Missing

### Role & Permission Settings
- [ ] Subscription Manager role — ❌ Missing (no auth on /api/subscriptions/* routes)
- [ ] Sales rep role (own subscriptions only) — ❌ Missing
- [ ] Customer portal access — ❌ Missing

### Module Configuration
- [ ] Recurring plan objects (name, billing period, invoice email template) — ❌ Missing
- [ ] Automatic closing after N unpaid invoices — ❌ Missing
- [ ] Customer self-service toggles — ❌ Missing
- [ ] Health score / churn risk thresholds — ❌ Missing
- [ ] Default payment provider for auto-charge — ❌ Missing

### Integrations
- [x] Contact Hub / partners — ✅ Done
- [ ] Invoicing / Accounting (generate invoice on renewal) — ❌ Missing
- [ ] Sales (quotation template → subscription) — ❌ Missing
- [ ] CRM (customer tracking, renewal opportunities) — ❌ Missing
- [ ] eCommerce (subscription product purchase flow) — ❌ Missing
- [ ] Helpdesk (support access tied to subscription tier) — ❌ Missing
- [ ] Calendar (renewal and billing date events) — ❌ Missing
- [ ] Email (renewal reminders, churn confirmations) — ❌ Missing
- [ ] Claude AI: churn prediction — ❌ Missing
- [ ] Claude AI: upsell opportunity detection — ❌ Missing
- [ ] Claude AI: optimal plan recommendation — ❌ Missing
- [ ] Automation rules (scheduled renewal, payment failure alerts) — ❌ Missing

### API Endpoints
- [x] GET /api/subscriptions — ✅
- [x] GET /api/subscriptions/:id — ✅
- [x] POST /api/subscriptions — ✅
- [x] PUT /api/subscriptions/:id — ✅
- [x] DELETE /api/subscriptions/:id — ✅
- [ ] POST /api/subscriptions/:id/activate — ❌ (handled via PUT state change; no dedicated endpoint)
- [ ] POST /api/subscriptions/:id/churn — ❌ (same, via PUT)
- [ ] POST /api/subscriptions/:id/close — ❌
- [ ] POST /api/subscriptions/:id/renew — ❌ (no renewal invoice trigger)
- [ ] GET /api/subscriptions/analytics/mrr-trend — ❌
- [ ] GET /api/subscriptions/analytics/churn-rate — ❌
- [ ] GET /api/subscription-plans — ❌ (plans are hardcoded strings, no CRUD)
- [ ] POST /api/subscription-plans — ❌

---
## Missing Features Summary

**Critical gaps (module is operational but not production-ready):**
1. No automated renewal billing — subscriptions never generate invoices; MRR is display-only with no accounting impact
2. No subscription line items — cannot attach products or price rules to a subscription; plan is a free-text label
3. No scheduled actions — next_billing date is stored but never acted upon
4. No authentication / RBAC on API routes

**High-value gaps:**
- Configurable recurring plan objects (replaces hardcoded starter/pro/enterprise)
- Upsell / cross-sell quotation flow
- Customer self-service portal
- Payment provider integration for auto-charge
- Churn reason tracking and analytics
- Claude AI churn prediction agent

**Nice-to-have:**
- eCommerce integration, trial periods, promo codes, helpdesk tier gating

---
## Recommended Build Order

1. **requireAuth on subscription routes** — security baseline (S)
2. **Subscription line items** — products + qty + recurring price per line (M)
3. **Recurring plan model** — replace string enum with configurable plan objects (M)
4. **Renewal billing trigger** — POST /subscriptions/:id/renew creates an accounting move (M)
5. **Scheduled renewal action** — cron job checks next_billing, triggers renewal (M)
6. **Dedicated state-transition endpoints** — /activate, /churn, /close with validation (S)
7. **MRR trend analytics API + graph view** — (M)
8. **Churn rate report + graph view** — (M)
9. **Claude AI churn prediction** — (L)
10. **Payment provider auto-charge** — (L)
11. **Customer self-service portal** — (L)
12. **Kanban view by plan / state** — (S)
