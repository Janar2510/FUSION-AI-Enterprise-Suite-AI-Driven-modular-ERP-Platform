# Baseline Verification — 2026-05-06

Run before Phase 0 work begins. Captures known failures to track against.

## API Build (`cd api && npm run build`)

**Status: FAIL**

```
src/routes/manufacturing.ts(314,63): error TS2345:
  Type 'Promise<Response<any, Record<string, any>> | undefined>' is not assignable to type 'Promise<void>'.
```

Root cause: `return res.json(...)` inside `asyncHandler` typed as `Promise<void>`.

## Frontend Build (`cd frontend && npm run build`)

**Status: FAIL — multiple errors**

| File | Error |
|---|---|
| `src/modules/social-marketing/components/SocialMarketingModule.tsx` | `useSocialStore`, `SocialPost` not imported (used but not defined) |
| `src/modules/sign/stores/signStore.ts` | Unused `Signer`, unused `get` parameter |
| `src/modules/subscriptions/components/SubscriptionsDashboard.tsx` | Unused `DollarSign` import |
| `src/modules/supply-chain/components/OrderpointModal.tsx` | Unused `clsx` |
| `src/modules/supply-chain/components/SupplyChainModule.tsx` | Unused imports, `isLoading` should be `loading`, unused `index` |
| `src/pages/ContactHub.tsx` | `ContactHubDashboard` missing `export default` |
| `src/pages/Dashboard.tsx` | `trend` typed as `string`, needs `"up" \| "down" \| "neutral"` |
| `src/pages/Dashboard.tsx` | `status` typed as `string`, needs `"active" \| "inactive" \| "loading"` |
| `src/stores/crmStore.ts` | Unused `updatedDeal` |
| `src/stores/discussStore.ts` | `loadMessages` does not exist on `DiscussState`, implicit `any` on `channelId` |
| `src/stores/globalMetricsStore.ts` | Unused `get`, unused `moduleName` |
| `src/stores/partnerStore.ts` | Unused `get` |

## Architecture Module Scan

### Frontend modules (`frontend/src/modules`)
contact_hub, crm, discuss, email-marketing, ecommerce, events, fleet, helpdesk, hr, inventory, knowledge, maintenance, manufacturing, marketing, notes, partners, plm, pos, products, project, purchase, quality, recruitment, rental, sales, sign, social-marketing, spreadsheet, subscriptions, supply-chain, surveys, timesheets, website

### API routes (`api/src/routes`)
accounting, appraisal, attendance, auth, automation, calendar, campaigns, crm, dashboard, ecommerce, events, fleet, fs_rental, helpdesk, hr, inventory, knowledge, maintenance, manufacturing, marketing_web, messaging, notes, partners, payroll, planning, plm, pos, products, projects, purchases, quality, quality, recruitment, sales, settings, skills, spreadsheet, subscriptions, surveys

### FastAPI modules (`backend/src/modules`)
Contains ERP modules — to be quarantined per ADR-0007.

## Docker Compose Build
Not yet run (pending Postgres migration).

## Expected State After Phase 0
- API build: EXIT 0
- Frontend build: EXIT 0
- All FastAPI ERP routes: 410 Gone or removed
- Prisma datasource: postgresql
