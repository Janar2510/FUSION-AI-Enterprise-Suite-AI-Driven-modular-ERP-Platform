# Website — Gap Analysis
**Odoo 17 docs:** https://www.odoo.com/documentation/17.0/applications/websites/website.html
**FusionAI status:** Partial
**Effort to complete:** L
**Business priority:** P2

---
## Odoo 17 Feature Checklist

### Core Features
- [ ] Page creation / management — 🟡 Partial (CRUD via `WebsiteModule`, no real content storage)
- [ ] Drag-and-drop visual page builder — ❌ Missing ("Launch Editor" button is a stub, no builder implemented)
- [ ] Building blocks (Structure / Features / Dynamic content / Inner content) — ❌ Missing
- [ ] Website themes / design templates — ❌ Missing
- [ ] Publish / Unpublish toggle — ✅ Done (toggle stored in DB via `/api/marketing-web/pages`)
- [ ] Multi-page site structure with navigation menus — ❌ Missing (menu management not implemented)
- [ ] Multi-website hosting — ❌ Missing
- [ ] Custom domain name management — ❌ Missing
- [ ] Cookie consent bar — ❌ Missing
- [ ] Form spam protection — ❌ Missing
- [ ] CDN setup — ❌ Missing
- [ ] Address autocomplete — ❌ Missing
- [ ] Multi-language / translation support — ❌ Missing
- [ ] Google Search Console integration — ❌ Missing
- [ ] Unsplash image library integration — ❌ Missing
- [ ] Mail groups (public discussion via email) — ❌ Missing

### SEO
- [ ] SEO Title per page — ✅ Done (field stored and editable in form)
- [ ] Meta description per page — ✅ Done (field stored and editable in form)
- [ ] URL slug control — 🟡 Partial (editable but no slug validation or redirect on change)
- [ ] Canonical URLs — ❌ Missing
- [ ] Structured data / schema.org — ❌ Missing
- [ ] XML sitemap auto-generation — ❌ Missing
- [ ] robots.txt management — ❌ Missing

### Views / UI
- [ ] Kanban / dashboard view — 🟡 Partial (dashboard stats: total views, published count, total pages)
- [ ] List view — ✅ Done (page list with name, URL, views, status)
- [ ] Form view — 🟡 Partial (name, URL, SEO fields, view count — no real content editor)
- [ ] Live website preview panel — ❌ Missing
- [ ] Analytics dashboard (traffic, bounce rate, top pages) — ❌ Missing (only per-page view count)
- [ ] Link tracker / UTM management — ❌ Missing

### Role & Permission Settings
- [ ] Website Administrator role — ❌ Missing
- [ ] Designer role (theme/blocks only) — ❌ Missing
- [ ] Publisher role (publish/unpublish pages) — ❌ Missing
- [ ] Restricted page visibility (login required, groups) — ❌ Missing

### Module Configuration
- [ ] Website name / company info — ❌ Missing
- [ ] Default language — ❌ Missing
- [ ] Social media links — ❌ Missing
- [ ] Live chat integration toggle — ❌ Missing
- [ ] Cookie policy / GDPR settings — ❌ Missing

### Integrations
- [ ] Calendar — ❌ Missing
- [ ] Mail / email subscriptions — ❌ Missing
- [ ] Automation (trigger on page visit) — ❌ Missing
- [ ] Claude AI (3 actions: generate page content, SEO suggestions, translate) — ❌ Missing
- [ ] eCommerce (product pages) — ❌ Missing
- [ ] CRM (contact forms → leads) — ❌ Missing
- [ ] Events (event registration pages) — ❌ Missing
- [ ] Google Analytics / Tag Manager — ❌ Missing

### API Endpoints
- [ ] `GET /api/marketing-web/pages` — ✅ Done
- [ ] `POST /api/marketing-web/pages` — ✅ Done
- [ ] `PUT /api/marketing-web/pages/:id` — ✅ Done
- [ ] `DELETE /api/marketing-web/pages/:id` — ✅ Done
- [ ] `GET /api/marketing-web/pages/:id/analytics` — ❌ Missing
- [ ] `POST /api/marketing-web/pages/:id/publish` — ❌ Missing (currently merged into PUT)
- [ ] `GET /api/marketing-web/menus` — ❌ Missing
- [ ] `GET /api/marketing-web/themes` — ❌ Missing
- [ ] `GET /api/marketing-web/sitemap.xml` — ❌ Missing

---
## Missing Features Summary

| Category | Missing |
|---|---|
| Core Builder | Drag-and-drop editor, building blocks, themes |
| Navigation | Menu management, multi-website |
| SEO | Sitemap, canonical, robots.txt, schema.org |
| Analytics | Traffic dashboard, link tracker |
| Integrations | Claude AI, Google Search Console, CRM forms, Events |
| Config | Domain, language, CDN, cookie consent, GDPR |
| RBAC | All roles missing |

**Current state:** The module manages page records (name, URL, SEO meta, publish status, view count) and exposes CRUD APIs. The visual page builder is a placeholder button. No real content is stored beyond the title and URL — `content` field exists in the type but is null. This is a skeleton, not a functional website builder.

---
## Recommended Build Order

1. **Page content storage** — store rich HTML/JSON blocks in `content` field; add migration
2. **Block-based editor** — integrate a headless editor (e.g. Editor.js or TipTap) for the "Launch Editor" stub
3. **Navigation menu management** — `WebsiteMenu` model + UI
4. **Analytics endpoint** — aggregate `viewCount` data over time, expose chart data
5. **SEO tooling** — auto-generate sitemap.xml, robots.txt route, canonical header injection
6. **Claude AI actions** — generate page copy, suggest meta description, auto-translate page
7. **RBAC** — Website Admin / Publisher / Designer roles scoped to organization
8. **Integrations** — wire contact forms to CRM leads, event pages to Events module
