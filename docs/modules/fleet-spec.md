# Fleet — Gap Analysis
**Odoo 17 docs:** https://www.odoo.com/documentation/17.0/applications/hr/fleet.html
**FusionAI status:** Partial
**Effort to complete:** M
**Business priority:** P2

---
## Odoo 17 Feature Checklist

### Core Features
- [x] Vehicle registry (name, license plate, brand, model, color) — ✅ Done
- [x] Fuel type / engine type (gasoline, diesel, electric, hybrid) — ✅ Done
- [x] Odometer tracking — ✅ Done
- [x] Vehicle state management (active / inactive / retired) — ✅ Done
- [x] Service / fuel / other activity logs per vehicle — ✅ Done
- [ ] Contract management with expiry dates — ❌ Missing
- [ ] Automated contract expiry email alert (configurable days before) — ❌ Missing
- [ ] Accident / incident documentation — ❌ Missing
- [ ] New vehicle request workflow with fleet availability threshold — ❌ Missing
- [ ] Pre-loaded manufacturer catalog (66 manufacturers, 46 models) — ❌ Missing
- [ ] Responsible person designation per vehicle/contract — ❌ Missing
- [ ] Cost tracking per vehicle (fuel, service, insurance totals) — 🟡 Partial (amount on log entries, no rollup)
- [ ] Insurance and tax deadline tracking — ❌ Missing
- [ ] Driver assignment per vehicle — ❌ Missing
- [ ] Vehicle image / photo attachment — ❌ Missing

### Views / UI
- [x] List view — ✅ Done
- [x] Kanban / dashboard view — ✅ Done (shows counts: active, EV, total services)
- [x] Form view — ✅ Done
- [ ] Calendar view — ❌ Missing (service schedules, contract dates)
- [ ] Graph / reporting view — ❌ Missing (cost analytics, fleet utilization)
- [ ] Gantt view — ❌ Missing (not required by Odoo Fleet, N/A)
- [ ] Smart buttons on form (linked contracts, logs, accidents) — ❌ Missing

### Role & Permission Settings
- [ ] Fleet Manager role — ❌ Missing
- [ ] Fleet User role — ❌ Missing
- [ ] Responsible person field on contracts (email alert recipient) — ❌ Missing

### Module Configuration
- [ ] End date contract alert (days-before threshold) — ❌ Missing
- [ ] New vehicle request threshold (fleet availability gate) — ❌ Missing
- [ ] Salary configurator integration (vehicle request from HR) — ❌ Missing

### Integrations
- [ ] Mail / chatter on vehicle form — ❌ Missing
- [ ] Calendar integration for service / contract dates — ❌ Missing
- [ ] Automation (contract expiry email trigger) — ❌ Missing
- [ ] Claude AI — AI-assisted maintenance prediction, cost anomaly detection, route optimization suggestions — ❌ Missing
- [ ] HR / Employees (driver assignment) — ❌ Missing
- [ ] Accounting (vehicle cost posting, fuel invoices) — ❌ Missing

### API Endpoints
- [x] `GET /api/fleet/vehicles` — ✅
- [x] `GET /api/fleet/vehicles/:id` — ✅
- [x] `POST /api/fleet/vehicles` — ✅
- [x] `PUT /api/fleet/vehicles/:id` — ✅
- [x] `POST /api/fleet/vehicles/:id/logs` — ✅
- [ ] `DELETE /api/fleet/vehicles/:id` — ❌
- [ ] `GET /api/fleet/contracts` — ❌
- [ ] `POST /api/fleet/contracts` — ❌
- [ ] `PUT /api/fleet/contracts/:id` — ❌
- [ ] `GET /api/fleet/vehicles/:id/logs` — ❌ (logs only included on single vehicle GET)
- [ ] `POST /api/fleet/vehicles/:id/accident` — ❌
- [ ] `GET /api/fleet/manufacturers` — ❌
- [ ] `GET /api/fleet/stats` — ❌ (cost rollups, utilization)

---
## Missing Features Summary

| Gap | Severity | Notes |
|---|---|---|
| Contract management + expiry alerts | High | Core Odoo Fleet feature; drives renewal workflows |
| Accident / incident logging | Medium | Currently only generic logs (fuel/service/other) |
| New vehicle request workflow | Medium | Employee self-service + fleet threshold gate |
| Cost rollup / analytics view | Medium | Per-vehicle total costs, fuel efficiency |
| Graph / reporting view | Medium | Fleet utilization, cost trends over time |
| Driver assignment | Low | Links Fleet to HR employees |
| Manufacturer catalog | Low | Pre-seeded data quality; free win with seed.ts |
| Calendar view | Low | Contract and service date visibility |
| Mail/chatter | Low | Consistent with rest of ERP modules |
| Claude AI actions | Low | Predictive maintenance, anomaly detection |
| RBAC (Fleet Manager / User) | Low | Parity with Odoo permission model |

---
## Recommended Build Order

1. **Contract model + expiry alert** — add `FleetContract` schema (vehicleId, startDate, endDate, type, responsible), cron job or scheduler for alert emails
2. **Cost rollup API + graph view** — `GET /api/fleet/stats` returning totals by vehicle; add Graph view tab in frontend
3. **Accident log type** — extend `FleetVehicleLog.type` enum to include `accident`; add dedicated accident fields (damage description, images)
4. **New vehicle request workflow** — `FleetRequest` model, threshold config in settings, email notification to Fleet Manager
5. **Driver / employee assignment** — add `driverId` FK to `FleetVehicle`; employee picker in form
6. **Calendar view** — render service logs and contract dates on shared calendar
7. **Manufacturer seed data** — add 66 manufacturers + 46 models to `seed.ts`
8. **Mail / chatter** — attach Chatter component to vehicle form (same pattern as CRM/Sales)
9. **Claude AI actions** — (a) predict next service date from odometer trend, (b) flag abnormal fuel costs, (c) suggest optimal replacement timing
10. **RBAC** — Fleet Manager / Fleet User middleware guards on write routes
