# Naming Conventions

All contributors must follow these conventions. Violations should be caught in code review and by automated lint rules.

## URL / Route Slugs

Use **kebab-case** for all URL path segments and folder names under `frontend/src/modules/` and `api/src/modules/`.

| Wrong | Correct |
|---|---|
| `fieldService` | `field-service` |
| `email_marketing` | `email-marketing` |
| `socialMarketing` | `social-marketing` |
| `supplyChain` | `supply-chain` |

## Code Identifiers

| Context | Convention | Example |
|---|---|---|
| TypeScript variables, functions, methods | camelCase | `fetchPartners`, `openOpps` |
| TypeScript types, interfaces, classes | PascalCase | `PartnerProfile`, `SaleOrder` |
| React components | PascalCase | `PartnerList`, `InvoiceForm` |
| Zustand store hooks | camelCase, prefixed `use` | `usePartnerStore`, `useCrmStore` |
| Constants | UPPER_SNAKE_CASE | `MAX_PAGE_SIZE`, `DEFAULT_CURRENCY` |

## SQL / Prisma Table Names

Use **snake_case** for Prisma model field names when mapping to PostgreSQL columns (via `@map`). Model names themselves are PascalCase.

```prisma
model SaleOrder {
  id         String   @id
  orderDate  DateTime @map("order_date")
  partnerId  String   @map("partner_id")
}
```

## File Names

| Type | Convention | Example |
|---|---|---|
| React component files | PascalCase | `PartnerList.tsx`, `InvoiceForm.tsx` |
| Store files | camelCase | `partnerStore.ts`, `crmStore.ts` |
| Hook files | camelCase, prefixed `use` | `usePartner.ts`, `useWebSocket.ts` |
| Utility/lib files | camelCase | `api.ts`, `utils.ts` |
| Test files | mirror source + `.test.` | `partnerStore.test.ts` |
| Backend module routes | kebab-case or camelCase | `partners.ts`, `field-service.ts` |

## Module Folder Names

| Layer | Convention |
|---|---|
| `frontend/src/modules/<name>` | kebab-case |
| `api/src/modules/<name>` | kebab-case |
| `backend/src/modules/<name>` | snake_case (Python convention) |

## Conventional Commits

```
feat(<scope>): short description
fix(<scope>): short description
chore(<scope>): short description
refactor(<scope>): short description
test(<scope>): short description
docs(<scope>): short description
```

Scope should match the module name (kebab-case): `feat(crm): ...`, `fix(sales): ...`, `chore(db): ...`.
