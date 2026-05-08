# FusionAI UI Redesign — Design Spec
**Date:** 2026-05-08  
**Status:** Approved  
**Scope:** Full visual system rebuild — design tokens, shell, navigation, cards, components, typography

---

## Summary of Decisions

| Decision | Choice |
|---|---|
| Visual direction | Dark Glass — deep navy, glass surfaces, backdrop-blur |
| Accent colour | Amber / Orange — `#f59e0b` → `#f97316` gradient |
| Navigation | Top Nav + Sub-sidebar |
| Card / surface style | Glow Accent — key cards and inputs glow amber |
| Typography | Space Grotesk (headings/nav) + Inter (body/data) |

---

## 1. Design Tokens

### Colours

```ts
// Background layers
--bg-base:        #0a0f1e   // page background
--bg-topbar:      rgba(0,0,0,0.5) + backdrop-blur(8px)
--bg-subnav:      rgba(255,255,255,0.015)
--bg-surface:     rgba(255,255,255,0.04)   // default card
--bg-surface-hover: rgba(255,255,255,0.06)
--bg-input:       rgba(255,255,255,0.03)

// Borders
--border-default: rgba(255,255,255,0.07)
--border-subtle:  rgba(255,255,255,0.05)
--border-strong:  rgba(255,255,255,0.12)

// Accent — Amber/Orange
--accent-primary:   #f59e0b
--accent-secondary: #f97316
--accent-gradient:  linear-gradient(135deg, #f59e0b, #f97316)
--accent-muted:     rgba(245,158,11,0.12)
--accent-border:    rgba(245,158,11,0.25)
--accent-glow:      0 0 20px rgba(245,158,11,0.15)
--accent-glow-sm:   0 0 8px rgba(245,158,11,0.35)
--accent-text:      #fbbf24
--accent-text-dim:  #fcd34d

// Semantic colours (status badges, deltas)
--color-success:  #10b981  // emerald
--color-warning:  #f59e0b  // amber (same as accent)
--color-error:    #ef4444
--color-info:     #6366f1
--color-muted:    rgba(255,255,255,0.3)

// Text
--text-primary:   #f8fafc
--text-secondary: rgba(255,255,255,0.6)
--text-tertiary:  rgba(255,255,255,0.35)
--text-disabled:  rgba(255,255,255,0.2)
```

### Typography

```ts
--font-heading: 'Space Grotesk', system-ui, sans-serif
--font-body:    'Inter', system-ui, sans-serif

// Scale
--text-xs:   9px   // labels, badges, table headers
--text-sm:   11px  // secondary text, meta
--text-base: 13px  // body, nav items, table cells
--text-md:   15px  // sub-headings, card values
--text-lg:   20px  // page titles
--text-xl:   28px  // dashboard hero numbers

// Weights
--weight-regular: 400
--weight-medium:  500
--weight-semibold: 600
--weight-bold:    700
```

### Spacing & Radius

```ts
--radius-sm:  6px   // inputs, small cards
--radius-md:  8px   // standard cards
--radius-lg:  10px  // panels, table containers
--radius-xl:  12px  // modals, page cards

--spacing-page: 20px   // page padding
--spacing-card: 14px   // card padding
--spacing-gap:  10px   // grid gap between cards
```

---

## 2. Shell Structure

```
┌─────────────────────────────────────────────────────┐
│  TOPBAR (44px, sticky)                              │
│  Logo │ CRM │ Sales │ Accounting │ HR │ ··· │ 🔔 👤 │
├──────────────┬──────────────────────────────────────┤
│  SUB-NAV     │  MAIN CONTENT                        │
│  (180px)     │                                      │
│  Pipeline ●  │  Page title + actions                │
│  Leads       │  Stat cards                          │
│  Customers   │  Content (list/kanban/form/chart)    │
│  Activities  │                                      │
│  ──────────  │                                      │
│  Settings    │                                      │
│  Roles       │                                      │
│  Automations │                                      │
└──────────────┴──────────────────────────────────────┘
```

### Topbar rules
- Height: 44px, `position: sticky`, `top: 0`, `z-index: 50`
- Background: `rgba(0,0,0,0.5)` + `backdrop-filter: blur(8px)`
- Logo: amber gradient mark (26×26px, radius 7px) + "FusionAI" in Space Grotesk 700
- App pills: Space Grotesk 500 12px. Active = amber bg + amber border. Overflow → `···` dropdown
- Right: `⌘K` search bar (180px), notification bell with amber dot, user avatar with amber glow
- On mobile: collapses to hamburger → full-screen drawer

### Sub-sidebar rules
- Width: 180px, collapsible to 0 (toggle button on edge)
- Sections: "Menu" items + "Configuration" section (Settings, Roles, Automations) always present
- Active item: amber bg tint + amber border + glowing dot + optional badge count
- Section headers: Space Grotesk 9px uppercase, very dim white

---

## 3. Card / Surface System

### Default card
```css
background: rgba(255,255,255,0.04);
border: 1px solid rgba(255,255,255,0.07);
border-radius: 10px;
```

### Highlight (key metric / active)
```css
background: rgba(245,158,11,0.07);
border: 1px solid rgba(245,158,11,0.25);
box-shadow: 0 0 20px rgba(245,158,11,0.08),
            inset 0 1px 0 rgba(245,158,11,0.1);
```

### Focused input
```css
border: 1px solid rgba(245,158,11,0.4);
box-shadow: 0 0 0 3px rgba(245,158,11,0.08);
/* label turns amber on focus */
```

### Active table row
```css
background: rgba(245,158,11,0.04);
border-left: 2px solid rgba(245,158,11,0.3);
```

### Avatar / icon glow (amber avatars)
```css
box-shadow: 0 0 8px rgba(245,158,11,0.4);
```

### AI panel
```css
background: rgba(245,158,11,0.05);
border: 1px solid rgba(245,158,11,0.15);
/* pulsing amber dot indicator */
```

---

## 4. Component Patterns

### Buttons
```
Primary:   amber gradient bg, black text, Space Grotesk 600, amber glow shadow
Secondary: rgba(white,0.05) bg, dim border, dim white text
Danger:    red/rose tint, same pattern as primary
Ghost:     no bg, no border, dim text, hover = white/10 bg
```

### Badges / Status pills
```
Won / Success:  emerald bg+border, #34d399 text
Open / Warm:    amber bg+border,   #fcd34d text
New / Cold:     indigo bg+border,  #a5b4fc text
Lost / Error:   red bg+border,     #fca5a5 text
```

### Table headers
- Space Grotesk 10px, uppercase, letter-spacing 0.5px, `rgba(white, 0.25)`
- Sortable columns get amber arrow on hover

### Page title pattern
```
Space Grotesk 700, 20px, #f8fafc
Sub-line: Inter 12px, rgba(white, 0.3) — record count + last sync
Action row: right-aligned buttons
```

### Stat cards (dashboard / module header)
- 4-column grid by default, 2-col on small screens
- Value: Space Grotesk 700, 22px
- Label: Inter 11px, dim white
- Delta: Inter 10px, colour-coded (green ↑ / red ↑ / amber neutral)
- First card always gets amber highlight treatment

### Tabs (within a module view)
- Space Grotesk 12px 500, amber bottom-border + amber text on active
- Pill tabs (kanban toggles): amber bg on active

### Forms
- Label: Inter 11px dim above field
- Input: glass surface, Inter 13px body text
- Focus: amber glow ring
- Error: red border, red helper text below

---

## 5. Per-Module Standard Layout

Every module must implement:

```
/module/<name>/
  ├── [Module]Shell.tsx      ← top-bar + sub-nav wiring
  ├── [Module]Settings.tsx   ← Settings sub-nav page
  ├── [Module]Roles.tsx      ← Roles sub-nav page
  ├── [Module]Automations.tsx ← Automations sub-nav page
  ├── views/
  │   ├── ListView.tsx       ← sortable/filterable table
  │   ├── KanbanView.tsx     ← drag-drop pipeline (where applicable)
  │   ├── FormView.tsx       ← create/edit record
  │   ├── CalendarView.tsx   ← (where applicable)
  │   └── ReportView.tsx     ← charts + KPIs
  └── components/
      ├── StatBar.tsx        ← 4-card stat row
      ├── AIPanel.tsx        ← Claude insight sidebar panel
      └── ActivityFeed.tsx   ← right panel timeline
```

---

## 6. Shared Component Library (`frontend/src/components/ui/`)

New components to create (replacing ad-hoc inline styles):

| Component | Description |
|---|---|
| `GlassCard` | Default/highlight/ai variants |
| `TopBar` | App nav with pill items |
| `SubNav` | Left sidebar with sections |
| `StatCard` | Value + label + delta |
| `DataTable` | Sortable, filterable, amber row highlight |
| `Badge` | won/open/cold/error variants |
| `Button` | primary/secondary/danger/ghost |
| `PageHeader` | Title + meta + action buttons |
| `TabBar` | Underline tabs + pill tabs |
| `SearchBar` | ⌘K global search |
| `AIPanel` | Claude insight panel with pulsing dot |
| `ActivityFeed` | Timeline events right panel |
| `Modal` | Glass overlay, amber focus ring |
| `Toast` | Bottom-right notifications |
| `Input` / `Select` / `Textarea` | Glass form controls |
| `Tooltip` | Dark glass tooltip |
| `Avatar` | Gradient circle with optional glow |

---

## 7. Design Token File

Create `frontend/src/styles/tokens.css` (CSS custom properties) and `frontend/src/styles/tokens.ts` (TypeScript constants) — single source of truth. All components import from tokens, never hardcode colours.

---

## 8. What Gets Rebuilt

### Phase A — Foundation (must ship first, blocks everything)
1. `tokens.css` + `tokens.ts` — design token file
2. All 16 shared components in `components/ui/`
3. `AppShell.tsx` — TopBar + SubNav wired to router
4. Global CSS reset + font loading (Space Grotesk + Inter via Google Fonts)

### Phase B — Module-by-module
Each module gets the new shell + all views rebuilt using the shared component library.
Order follows the module gap analysis priority (P1 → P2 → P3) from `docs/modules/00-master-gap-summary.md`.

### Phase C — Dark mode only
No light mode. The design is dark-glass only. Remove any existing light theme code.

---

## 9. Success Criteria

- All 45 modules render using the new design tokens — zero hardcoded hex values in components
- Every module has Settings, Roles, and Automations sub-nav pages
- Topbar app pills work for all 45 modules with overflow `···` menu
- All shared components have TypeScript prop types and are documented
- Lighthouse accessibility score ≥ 90 (colour contrast on amber text meets WCAG AA)
- No regressions on existing business flows (E2E tests still pass)

---

## Non-Goals

- No light theme
- No custom icon set (continue using `lucide-react`)
- No animation library (CSS transitions only, no Framer Motion)
- No design tool export (tokens are the source of truth, not Figma)
