# Social Marketing — Gap Analysis
**Odoo 17 docs:** https://www.odoo.com/documentation/17.0/applications/marketing/social_marketing.html
**FusionAI status:** Stub
**Effort to complete:** XL
**Business priority:** P3

---
## Odoo 17 Feature Checklist

### Core Features
- [ ] Post creation with message content — ✅ Done
- [ ] Multi-platform targeting (Facebook / Twitter / LinkedIn) — ✅ Done (checkboxes in form)
- [ ] Post state lifecycle (draft → scheduled → posted) — ✅ Done
- [ ] Post scheduling (publish at future date/time) — 🟡 Partial (scheduledDate field in model; no datetime picker in UI; "Schedule Options" button sets state to `scheduled` without saving a date)
- [ ] Post Now action — ✅ Done (sets state to `posted` + records publishedDate)
- [ ] Cancel scheduled post (revert to draft) — ✅ Done
- [ ] Engagement metrics display (likes / comments / shares / clicks) — ✅ Done (UI shows metrics, read-only on posted records)
- [ ] Real social media account linking (OAuth / API keys) — ❌ Missing (no account management; posts are saved to DB but not sent to any platform)
- [ ] Actual posting to Facebook via Graph API — ❌ Missing
- [ ] Actual posting to Twitter/X via API — ❌ Missing
- [ ] Actual posting to LinkedIn via API — ❌ Missing
- [ ] Instagram support (via Facebook API) — ❌ Missing
- [ ] YouTube support — ❌ Missing
- [ ] Push notification support — ❌ Missing
- [ ] Real engagement metric sync from platform APIs — ❌ Missing (metrics fields exist but are static mock values)
- [ ] Social stream / feed view (live social media feed columns per account) — ❌ Missing
- [ ] Comment monitoring with CRM lead generation — ❌ Missing
- [ ] Social Accounts management page — ❌ Missing
- [ ] Social Streams configuration page — ❌ Missing
- [ ] Image / media attachment to posts — ❌ Missing (no image upload in post form)
- [ ] Campaign association and campaign management — ❌ Missing (no campaign model or UI)
- [ ] Visitor tracking (geographic + behavioral data) — ❌ Missing
- [ ] Content insights / analytics per post — ❌ Missing
- [ ] Bulk / batch posting — ❌ Missing
- [ ] Multi-company account management — ❌ Missing

### Views / UI
- [ ] Feed view (multi-column live stream dashboard) — ❌ Missing (this is Odoo's primary view for this module)
- [ ] Kanban / metrics dashboard view — ✅ Done (4 aggregate stat cards: likes, comments, shares, clicks)
- [ ] List view — ✅ Done (renders same as kanban dashboard; not a true separate list)
- [ ] Form view (post editor) — ✅ Done
- [ ] Graph / analytics view — ❌ Missing
- [ ] Visitors kanban/list view — ❌ Missing
- [ ] Social Accounts page — ❌ Missing
- [ ] Social Streams page — ❌ Missing

### Role & Permission Settings
- [ ] Social Marketing user role — ❌ Missing
- [ ] Social Marketing manager role — ❌ Missing
- [ ] Per-account admin restrictions (Facebook page admin requirement) — ❌ Missing

### Module Configuration
- [ ] Social account OAuth linking (per platform) — ❌ Missing
- [ ] Default campaign settings — ❌ Missing
- [ ] Push notification configuration — ❌ Missing

### Integrations
- [ ] Calendar — ❌ Missing (scheduled posts not on calendar)
- [ ] CRM (lead from comment) — ❌ Missing
- [ ] Contacts (email / SMS to social visitors) — ❌ Missing
- [ ] Facebook Graph API — ❌ Missing
- [ ] Twitter / X API v2 — ❌ Missing
- [ ] LinkedIn API — ❌ Missing
- [ ] Instagram API (via Facebook) — ❌ Missing
- [ ] YouTube API — ❌ Missing
- [ ] Email Marketing (cross-channel campaigns) — ❌ Missing
- [ ] Automation module — ❌ Missing
- [ ] Claude AI (3 actions: generate post copy, suggest best posting time, analyze engagement) — ❌ Missing

### API Endpoints
- [ ] GET /api/marketing-web/social — ✅ Done (paginated)
- [ ] POST /api/marketing-web/social — ✅ Done
- [ ] PUT /api/marketing-web/social/:id — ✅ Done
- [ ] DELETE /api/marketing-web/social/:id — ✅ Done
- [ ] GET /api/marketing-web/social/:id — ❌ Missing (no single-record fetch endpoint)
- [ ] POST /api/marketing-web/social/:id/publish (trigger real platform publish) — ❌ Missing
- [ ] GET /api/marketing-web/social/:id/insights (sync metrics from APIs) — ❌ Missing
- [ ] GET /api/marketing-web/social/accounts (list linked social accounts) — ❌ Missing
- [ ] POST /api/marketing-web/social/accounts (link new account via OAuth) — ❌ Missing
- [ ] GET /api/marketing-web/social/streams — ❌ Missing
- [ ] GET /api/marketing-web/campaigns — ❌ Missing
- [ ] POST /api/marketing-web/campaigns — ❌ Missing

---
## Missing Features Summary

**Critical gaps (block real use):**
1. Posts are never sent to any real platform — the module is entirely simulated; no OAuth, no API integration with any social network
2. No social account management — users cannot link a Facebook Page, Twitter account, or LinkedIn Company page
3. No image/media upload — posts are text-only with no media attachment
4. No real engagement metric sync — likes/comments/shares/clicks fields exist but are static and never populated from APIs
5. No campaign model — posts cannot be grouped into campaigns
6. No scheduling UI — scheduledDate field exists in DB but the form provides no datetime picker; "Schedule Options" only flips the state flag
7. No single-record GET endpoint for posts
8. Feed view (Odoo's signature feature for this module) is entirely absent

**Functional but shallow:**
- Dashboard stat cards aggregate data from the DB, but since metrics are never synced from real platforms, they reflect only manually set values
- List and kanban views render identical content (same `renderDashboard()` function called for both)
- Platform checkboxes (Facebook / Twitter / LinkedIn) are captured but have no effect

**Platform API work is the dominant gap:**
- Each of Facebook, Twitter, and LinkedIn requires its own OAuth 2.0 app setup, webhook configuration, and API client — this is significant infrastructure work independent of the FusionAI codebase

---
## Recommended Build Order

1. **Schedule datetime picker** in post form + save scheduledDate — 0.5 day
2. **GET /api/marketing-web/social/:id** single-record endpoint — 0.5 day
3. **Image/media upload** on post form (S3 presigned upload) — 2 days
4. **Campaign model** (name, date range, status) + campaign association on posts — 2 days
5. **Dedicated list view** (separate from kanban) — 0.5 day
6. **Social account linking infrastructure** — OAuth callback handler, account storage (platform, token, page_id) — 3 days
7. **Facebook Graph API integration** — post to page, sync engagement metrics — 4 days
8. **LinkedIn API integration** — post to company page, sync metrics — 3 days
9. **Twitter/X API v2 integration** — post tweet, sync metrics — 3 days
10. **Scheduled post worker** — background job to publish posts at scheduledDate — 2 days
11. **Engagement sync job** — periodic pull of likes/comments/shares/clicks from APIs — 2 days
12. **Feed / stream view** — multi-column live feed dashboard per linked account — 4 days
13. **Graph / analytics view** — engagement trends, per-platform breakdown — 2 days
14. **CRM lead generation** from comment monitoring — 2 days
15. **Claude AI actions** — generate post copy, suggest posting time, analyze engagement — 2 days
