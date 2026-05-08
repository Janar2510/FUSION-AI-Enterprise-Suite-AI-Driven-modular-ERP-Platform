# PLM — Gap Analysis
**Odoo 17 docs:** https://www.odoo.com/documentation/17.0/applications/inventory_and_mrp/plm.html
**FusionAI status:** Partial
**Effort to complete:** M
**Business priority:** P2

---
## Odoo 17 Feature Checklist

### Core Features
- [x] Engineering Change Orders (ECOs) — create, list, update, delete — ✅ Done
- [x] ECO types — product update / BOM revision — ✅ Done
- [x] ECO stage workflow — draft → confirmed → progress → done — ✅ Done
- [x] Approval state — none / approved / rejected — ✅ Done
- [x] Approve / Reject ECO actions — ✅ Done
- [x] Apply Changes action (moves stage to done, sets effectivityDate) — ✅ Done
- [x] Effectivity — as soon as possible / at date — ✅ Done
- [x] Link ECO to product — ✅ Done
- [x] Link ECO to BoM — ✅ Done
- [x] BOM revision lines preview inside ECO form — 🟡 Partial (read-only; editing lines not implemented)
- [ ] Actual BoM line modification when ECO is applied — ❌ Missing (noted in code as "Coming in v2")
- [ ] Version control / revision history per product — ❌ Missing
- [ ] Previous BoM version archive on ECO application — ❌ Missing
- [ ] ECO type configuration (custom types with custom approval chains) — ❌ Missing
- [ ] Multi-step approval workflows (multiple approvers per ECO type) — ❌ Missing
- [ ] Follower / subscriber notifications on ECO stage change — ❌ Missing
- [ ] ECO tags and priority levels — ❌ Missing
- [ ] Bulk ECO operations — ❌ Missing
- [ ] Change impact analysis (which MOs are affected by BoM change) — ❌ Missing
- [ ] Effectivity date enforcement (only apply to new MOs after date) — ❌ Missing

### Views / UI
- [x] Kanban — ECOs by stage (draft / confirmed / progress / done) — ✅ Done
- [x] List — ECOs with type, product, BoM, approval state, stage — ✅ Done
- [x] Form — ECO with header actions (Start Revision, Approve, Reject, Apply Changes) — ✅ Done
- [x] Form — BOM revision lines grid (read-only) — 🟡 Partial
- [x] Form — Effectivity panel (right sidebar) — ✅ Done
- [ ] Graph / pivot — ECO throughput and lead time analysis — ❌ Missing
- [ ] Activity view — ECOs with upcoming deadlines — ❌ Missing
- [ ] Product revision timeline — ❌ Missing
- [ ] Diff view — old vs new BoM comparison — ❌ Missing

### Role & Permission Settings
- [ ] PLM User — can create and edit ECOs — ❌ No RBAC enforced
- [ ] PLM Manager — can approve/reject, configure ECO types — ❌ No RBAC enforced
- [ ] Approver role per ECO type — ❌ Missing

### Module Configuration
- [ ] ECO type definitions (name, approval required, approver group) — ❌ No UI config
- [ ] Default effectivity setting — ❌ Not configurable
- [ ] Email notifications on ECO approval/rejection — ❌ Missing

### Integrations
- [x] Manufacturing — ECO linked to BoM (read-only preview) — 🟡 Partial
- [x] Inventory — ECO linked to product — ✅ Done
- [ ] Manufacturing — actual BoM update when ECO applied — ❌ Missing
- [ ] Mail / Chatter on ECO form — ❌ Missing (ChatterPanel not added to PLM form)
- [ ] Calendar — ECO deadlines and review dates — ❌ Missing
- [ ] Automation — trigger actions on ECO stage changes — ❌ Missing
- [ ] Claude AI — 3 suggested actions: Suggest Change Reason, Impact Analysis, Auto-Draft BoM Revision — ❌ Missing (AiActionsPanel not wired to PLM)

### API Endpoints
- [x] GET /api/plm — ✅ (paginated)
- [x] GET /api/plm/:id — ✅ (includes product + BoM with lines)
- [x] POST /api/plm — ✅
- [x] PUT /api/plm/:id — ✅ (applies changes on stage=done if approved)
- [x] DELETE /api/plm/:id — ✅
- [ ] GET /api/plm/types — ❌ (ECO type config)
- [ ] POST /api/plm/types — ❌
- [ ] GET /api/plm/:id/versions — ❌ (version history)
- [ ] POST /api/plm/:id/apply-bom-changes — ❌ (actual BoM line mutation)
- [ ] GET /api/plm/impact/:bomId — ❌ (which MOs affected)

---
## Missing Features Summary
The core ECO lifecycle (create → approve → apply) is functional but the most critical PLM capability — actually modifying BoM lines when an ECO is applied — is explicitly deferred in code. No version history, no multi-approver chains, no diff view, no ChatterPanel, no Claude AI actions. ECO type configuration is absent.

## Recommended Build Order
1. Apply ECO → mutate BoM lines (add/remove/change component quantities) — P1
2. BoM version archive (snapshot old BoM before applying ECO) — P1
3. Add ChatterPanel + AiActionsPanel to ECO form — P1
4. ECO type configuration (approval chains, custom types) — P2
5. Multi-approver workflow per ECO type — P2
6. Product revision history / timeline view — P2
7. Diff view (old BoM vs proposed BoM) — P2
8. Impact analysis — affected active MOs — P3
9. Effectivity date enforcement on new MOs — P3
10. Graph/pivot analytics on ECO throughput — P3
