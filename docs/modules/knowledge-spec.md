# Knowledge — Gap Analysis
**Odoo 17 docs:** https://www.odoo.com/documentation/17.0/applications/productivity/knowledge.html
**FusionAI status:** Partial
**Effort to complete:** M
**Business priority:** P2

---
## Odoo 17 Feature Checklist

### Core Features
- [x] Article creation with title and body — ✅ Done (KnowledgeModule.tsx + API)
- [x] Workspace (namespace) grouping — ✅ Done (KnowledgeWorkspace model, sidebar)
- [x] Article publish/draft toggle — ✅ Done (`isPublished` flag, status buttons)
- [x] Revision history — ✅ Done (KnowledgeArticleRevision, last 5 fetched on open)
- [x] View count tracking — ✅ Done (incremented on GET /:id)
- [ ] Rich text / HTML body editor — 🟡 Partial (plain `<textarea>` only; no WYSIWYG, no headings/tables/images)
- [ ] Article nesting / hierarchy (parent–child articles) — ❌ Missing (flat list only)
- [ ] Article sharing with external users — ❌ Missing (no share link or portal access)
- [ ] Favourite / starred articles — ❌ Missing
- [ ] Article templates — ❌ Missing (AI draft is a hardcoded string, not a template system)
- [ ] Embedded links to other articles (internal wiki links) — ❌ Missing
- [ ] Cross-module record embedding (link CRM lead, project task, etc.) — ❌ Missing
- [ ] Article properties / custom fields panel — ❌ Missing
- [ ] Full-text search (body content) — 🟡 Partial (title search only in frontend filter)
- [ ] Article locking (prevent concurrent edits) — ❌ Missing

### Views / UI
- [x] Kanban card view — ✅ Done (renderDashboard, top-3 cards)
- [x] List view — ✅ Done (OdooListBase table below cards)
- [ ] Form view with real WYSIWYG editor — 🟡 Partial (textarea only)
- [ ] Tree/outline sidebar (nested articles) — ❌ Missing (workspace sidebar is flat)
- [ ] Search / filter bar on body content — ❌ Missing

### Role & Permission Settings
- [ ] Internal-only workspace restriction — ❌ Missing (no RBAC on articles)
- [ ] Per-article or per-workspace permissions — ❌ Missing
- [ ] Portal/external user access — ❌ Missing

### Module Configuration
- [x] Workspace creation — ✅ Done (POST /api/knowledge/workspaces)
- [ ] Workspace color picker (functional) — 🟡 Partial (color stored but not rendered as picker in UI)
- [ ] Default workspace setting — ❌ Missing
- [ ] Article categories beyond workspaces — 🟡 Partial (`category` text field exists but unused in filtering)

### Integrations
- [ ] Calendar — ❌ Missing
- [ ] Mail / Chatter on articles — ❌ Missing
- [ ] Automation triggers — ❌ Missing
- [x] Claude AI (Neural Draft — content generation) — ✅ Done (setTimeout mock; needs real API call)
- [ ] Cross-module record embed (CRM, Project, HR) — ❌ Missing
- [ ] Documents module link — ❌ Missing

### API Endpoints
- [x] GET /api/knowledge — ✅ (paginated list with workspace join)
- [x] GET /api/knowledge/workspaces — ✅
- [x] POST /api/knowledge/workspaces — ✅
- [x] GET /api/knowledge/:id — ✅ (with revisions)
- [x] POST /api/knowledge — ✅
- [x] PUT /api/knowledge/:id — ✅ (auto-creates revision on body change)
- [x] DELETE /api/knowledge/:id — ✅
- [ ] GET /api/knowledge/search?q= — ❌ (body full-text search endpoint missing)
- [ ] POST /api/knowledge/:id/share — ❌
- [ ] POST /api/knowledge/:id/favourite — ❌

---
## Missing Features Summary
1. **WYSIWYG editor** — textarea replaces the rich editor; no Markdown preview, image upload, table insertion, or code blocks
2. **Article hierarchy** — no parent/child nesting; workspace is the only grouping level
3. **Sharing & permissions** — no per-article access control, no share links, no portal view
4. **Cross-module embedding** — cannot embed live CRM, Project, or HR records into articles
5. **Full-text search** — API and frontend only search by title
6. **Templates** — AI draft is a hardcoded mock string, not a reusable template system
7. **Favourites** — no starred/bookmarked articles
8. **Chatter / Mail** — no messaging thread on articles
9. **Real AI integration** — `handleGenerateAI` uses `setTimeout` with a hardcoded string; needs a real Claude API call

## Recommended Build Order
1. Swap `<textarea>` for a WYSIWYG editor (e.g. TipTap or Quill) — unlocks rich content (M)
2. Add full-text search endpoint on `body` field + wire frontend (S)
3. Implement article nesting (parentId FK) + tree sidebar (M)
4. Per-article RBAC (read/write groups) (M)
5. Share link generation for articles (S)
6. Real Claude AI content generation via API (S)
7. Chatter / Mail thread on articles (M)
8. Cross-module record embed (XL)
