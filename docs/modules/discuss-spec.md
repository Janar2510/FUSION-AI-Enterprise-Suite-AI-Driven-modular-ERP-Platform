# Discuss — Gap Analysis
**Odoo 17 docs:** https://www.odoo.com/documentation/17.0/applications/productivity/discuss.html
**FusionAI status:** Partial
**Effort to complete:** L
**Business priority:** P1

---
## Odoo 17 Feature Checklist

### Core Features
- [x] Public channels — ✅ Done (channelType: public stored in DB, rendered in sidebar)
- [x] Private channels — ✅ Done (channelType: private, Lock icon in sidebar)
- [x] Direct messages (1:1) — ✅ Done (channelType: direct, Users icon)
- [ ] Group direct messages (multi-user DMs) — ❌ Missing (type exists in schema but no "create group DM" UI)
- [x] Send text messages — ✅ Done (sendMessage API + optimistic update)
- [x] Emoji reactions on messages — ✅ Done (addReaction / removeReaction in store)
- [x] Emoji picker in input — ✅ Done (emoji-picker-react)
- [x] Typing indicator — ✅ Done (WS "typing" event)
- [x] Real-time WebSocket delivery — 🟡 Partial (WS hook connected but inbound messages not re-injected into store)
- [ ] Message threading / reply-to — ❌ Missing (reply_to field in type but no UI)
- [ ] Edit message — ❌ Missing (updateMessage store action exists, no UI trigger)
- [ ] Delete message — ❌ Missing (deleteMessage marks is_deleted=true, no UI trigger)
- [ ] Pin messages — ❌ Missing
- [ ] Mark messages as unread / Todo — ❌ Missing
- [ ] Message starring — ❌ Missing
- [x] Polymorphic Chatter (record-level messaging) — ✅ Done (`/messaging/chatter` GET+POST)
- [x] Activity timeline on records — ✅ Done (timelineEvent model + chatter endpoint)
- [ ] @mentions with notification — ❌ Missing
- [ ] File / attachment upload — 🟡 Partial (Paperclip button rendered, no upload handler)
- [ ] User online / away / offline status — ❌ Missing (User type has status field but not surfaced)
- [ ] Out-of-office / airplane status — ❌ Missing
- [ ] Inbox (notification aggregation) — ❌ Missing
- [ ] Starred messages view — ❌ Missing
- [ ] Message history view — ❌ Missing

### Views / UI
- [x] Channel sidebar list — ✅ Done
- [x] Channel search / filter — ✅ Done (client-side filter)
- [x] Message bubble rendering — ✅ Done (MessageBubble component)
- [x] Date separators in message list — ✅ Done
- [ ] Calendar view of messages / activity — ❌ Missing
- [ ] Fullscreen / focus mode — ❌ Missing
- [x] AI Assistant panel (slide-out) — ✅ Done

### Role & Permission Settings
- [ ] Channel member management (add/remove) — ❌ Missing (no member management UI or API endpoint)
- [ ] Channel moderation (mute, kick) — ❌ Missing
- [ ] Private channel invite flow — ❌ Missing

### Module Configuration
- [x] AI-assisted channel flag (`ai_assistant_enabled`) — ✅ Done
- [ ] Notification preference per user (handle by email vs. in-app) — ❌ Missing
- [ ] Push notification integration — ❌ Missing

### Integrations
- [x] Claude AI — channel summary, AI insights panel (AiActionsPanel) — ✅ Done
- [ ] Calendar — "Start a meeting" from Discuss — ❌ Missing
- [ ] Video call (built-in or Jitsi/Meet link) — ❌ Missing
- [ ] Cross-app header messaging icon (persistent access) — ❌ Missing
- [ ] Email notification on chatter message — ❌ Missing (outbox relay in api/src/core but not wired to chatter)

### API Endpoints
- [x] GET  /messaging/channels — ✅
- [x] POST /messaging/channels — ✅
- [x] GET  /messaging/channels/:id/messages — ✅
- [x] POST /messaging/channels/:id/messages — ✅
- [x] GET  /messaging/chatter?ownerType=&ownerId= — ✅
- [x] POST /messaging/chatter — ✅
- [x] GET  /messaging/messages — ✅
- [x] POST /messaging/messages — ✅
- [ ] PATCH /messaging/messages/:id (edit) — ❌
- [ ] DELETE /messaging/messages/:id — ❌
- [ ] POST /messaging/channels/:id/react — ❌ (reactions are optimistic-only, not persisted)
- [ ] GET  /messaging/channels/:id/members — ❌
- [ ] POST /messaging/channels/:id/members — ❌
- [ ] GET  /messaging/inbox — ❌
- [ ] WebSocket auth + inbound message push — 🟡 (WS server exists, inbound not wired to store refresh)

---
## Missing Features Summary

| Gap | Severity |
|-----|----------|
| Reactions not persisted to DB | High |
| WS inbound messages not injected into store (real-time broken) | High |
| No edit/delete message UI | Medium |
| No @mentions or notifications | High |
| No member management UI | Medium |
| No Inbox / Starred / History views | Medium |
| File attachments non-functional | Medium |
| No video call integration | Low |
| User presence/status not surfaced | Medium |
| No cross-app messaging icon | Low |

---
## Recommended Build Order

1. **Fix WS inbound** — wire `wsData.type === 'message'` to push message into store (1 day)
2. **Persist reactions** — add `POST /messaging/channels/:id/react` endpoint + Prisma model field (1 day)
3. **Edit & delete UI** — add context menu on MessageBubble, call existing store actions (1 day)
4. **Inbox view** — aggregate @mention + chatter notifications for current user (2 days)
5. **@mentions** — parse `@name` in input, notify via server-sent notification (2 days)
6. **Member management** — add/remove members endpoint + UI in channel header (1 day)
7. **File upload** — wire Paperclip button to `/upload` endpoint, store attachment URL in message (2 days)
8. **User presence** — heartbeat endpoint + sidebar status dots (1 day)
9. **Video call link** — generate Jitsi link from "Start meeting" button (1 day)
