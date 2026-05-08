# FusionAI Module Research — Design Spec
**Date:** 2026-05-08
**Status:** Approved
**Goal:** Produce a per-module gap analysis (45 modules) by scraping Odoo 17 docs, comparing against the current FusionAI codebase, and outputting a prioritised build backlog.

---

## Problem Statement

FusionAI has 45 frontend modules. ~8 are reasonably complete, ~20 are partial stubs, ~8 are bare stubs (< 100 lines). No module has:
- A formal settings / configuration page
- Role-per-module RBAC
- Calendar, Mail, Automation, or Claude AI integrations
- Documented feature completeness vs Odoo 17

Before building anything, we need a clear picture of **what each module should do** (Odoo 17 parity) and **what currently exists**, so we can build in the right order without rework.

---

## Approach: Parallel Agent Swarm

### Phase 1 — Sitemap scan (~2 min, 1 agent)
- Map `https://www.odoo.com/documentation/17.0/` to discover all module documentation URLs
- Output: `docs/modules/.url-index.json` — module name → docs URL mapping

### Phase 2 — 10 parallel research agents (~20 min)

Each agent is responsible for 4–5 modules. For each module the agent:
1. Scrapes the Odoo 17 docs page for that module (feature list, configuration, roles, integrations)
2. Reads the current FusionAI code (`frontend/src/modules/<module>/`, `api/src/routes/<module>.ts`)
3. Compares feature-by-feature
4. Writes `docs/modules/<module>-spec.md` using the standard template below

**Agent groups:**

| Agent | Modules |
|---|---|
| Agent 1 | crm, sales, purchases, inventory |
| Agent 2 | accounting, invoicing, subscriptions, expenses |
| Agent 3 | hr, payroll, attendance, leaves, appraisals |
| Agent 4 | manufacturing, plm, quality, supply-chain |
| Agent 5 | helpdesk, field-service, project, timesheets |
| Agent 6 | discuss, calendar, notes, email-marketing |
| Agent 7 | website, ecommerce, sign, marketing |
| Agent 8 | knowledge, documents, spreadsheet, studio |
| Agent 9 | fleet, maintenance, rental, planning |
| Agent 10 | recruitment, events, surveys, social-marketing |

### Phase 3 — Master rollup (~3 min, 1 agent)
- Reads all 45 spec files
- Generates `docs/modules/00-master-gap-summary.md`
- Sorts by: business value tier (revenue-critical → operational → nice-to-have) × effort (S/M/L/XL)
- Produces the prioritised build backlog

---

## Spec File Template

Each `docs/modules/<module>-spec.md` follows this exact structure:

```markdown
# <Module Name> — Gap Analysis
**Odoo 17 docs:** <url>
**FusionAI status:** Stub | Partial | Functional | Complete
**Effort to complete:** S (< 1 day) | M (2–3 days) | L (1 week) | XL (2+ weeks)
**Business priority:** P1 (revenue-critical) | P2 (operational) | P3 (nice-to-have)

---

## Odoo 17 Feature Checklist

### Core Features
- [ ] Feature name — ✅ Done | 🟡 Partial (what's missing) | ❌ Missing

### Views / UI
- [ ] List view
- [ ] Kanban view
- [ ] Form view
- [ ] Calendar view (if applicable)
- [ ] Gantt / timeline (if applicable)
- [ ] Graph / pivot reports

### Role & Permission Settings
- [ ] Role: <role name> — permissions: <read/write/delete/admin>
- [ ] (one row per Odoo role for this module)

### Module Configuration (Settings page)
- [ ] Setting name — description

### Integrations
- [ ] Calendar — what events/records sync
- [ ] Mail / Discuss — what triggers email, what shows in chatter
- [ ] Automation rules — what triggers are available
- [ ] Claude AI — suggested AI actions for this module
- [ ] Other modules this module integrates with

### API Endpoints
- [ ] GET /api/<module>/... — ✅ exists | ❌ missing
- [ ] POST ... — status
- [ ] (list all endpoints Odoo exposes for this module)

### Missing Features Summary
Brief paragraph: what are the 3–5 most impactful missing features?

### Recommended Build Order
1. First: ...
2. Then: ...
3. Finally: ...
```

---

## Output Files

| File | Description |
|---|---|
| `docs/modules/.url-index.json` | Odoo 17 docs URL per module |
| `docs/modules/<module>-spec.md` | Per-module gap analysis (45 files) |
| `docs/modules/00-master-gap-summary.md` | Master prioritised backlog |

---

## Success Criteria

- All 45 modules have a spec file committed to git
- Every spec file has: feature checklist, role list, settings list, integration notes, effort + priority tier
- Master summary has a clear P1/P2/P3 build order
- Zero code changed — pure research output only

---

## What Comes Next (out of scope for this phase)

After the research phase is approved:
1. `writing-plans` skill generates the implementation plan from the master summary
2. Shared infrastructure sprint: module settings system, role-per-module RBAC, Calendar/Mail/Automation layer, Claude AI integration framework
3. Module rebuild sprints in P1 → P2 → P3 order, each module following its spec file

---

## Non-Goals

- No code changes in this phase
- No UI mockups
- No database schema changes
- No prioritisation of individual features within a module (that happens during implementation planning)
