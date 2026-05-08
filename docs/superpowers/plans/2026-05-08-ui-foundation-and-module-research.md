# FusionAI UI Foundation + Module Research Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete Dark Glass design system foundation (tokens, 17 shared components, new AppShell), then run the 10-agent Odoo 17 research swarm to produce per-module gap specs for all 45 modules.

**Architecture:** Phase A lays the visual foundation — design tokens in CSS custom properties + TypeScript constants, 17 shared `components/ui/` components built on those tokens, and a new `AppShell` that replaces the current `Sidebar + Header + MainLayout` with the approved Top Nav + Sub-sidebar layout. Phase B spawns 11 agents (1 sitemap + 10 module-group + 1 rollup) to produce `docs/modules/<module>-spec.md` for all 45 modules. Phase C (module rebuilds) is a separate plan that depends on the master summary from Phase B.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS (utility classes only — no custom config changes needed), Google Fonts (Space Grotesk + Inter), lucide-react icons, react-router-dom v6, Playwright (for Odoo docs scraping in Phase B).

---

## File Map

### Phase A — Created
```
frontend/src/styles/tokens.css                     ← CSS custom properties (single source of truth)
frontend/src/styles/tokens.ts                      ← TypeScript constants mirroring tokens.css
frontend/src/components/ui/Button.tsx              ← primary/secondary/danger/ghost variants
frontend/src/components/ui/Badge.tsx               ← won/open/cold/error status pills
frontend/src/components/ui/Avatar.tsx              ← gradient circle + optional amber glow
frontend/src/components/ui/Input.tsx               ← glass input + amber focus ring
frontend/src/components/ui/Select.tsx              ← glass select
frontend/src/components/ui/Textarea.tsx            ← glass textarea
frontend/src/components/ui/GlassCard.tsx           ← default/highlight/ai surface variants
frontend/src/components/ui/StatCard.tsx            ← value + label + delta
frontend/src/components/ui/DataTable.tsx           ← sortable table with amber row highlight
frontend/src/components/ui/TopBar.tsx              ← sticky app nav with pill items + overflow
frontend/src/components/ui/SubNav.tsx              ← 180px sidebar with sections + badges
frontend/src/components/ui/PageHeader.tsx          ← title + meta + action buttons
frontend/src/components/ui/TabBar.tsx              ← underline tabs + pill tabs
frontend/src/components/ui/Modal.tsx               ← glass overlay dialog
frontend/src/components/ui/Toast.tsx               ← bottom-right notifications (wraps react-hot-toast)
frontend/src/components/ui/SearchBar.tsx           ← ⌘K global search trigger
frontend/src/components/ui/Tooltip.tsx             ← dark glass tooltip
frontend/src/components/ui/AIPanel.tsx             ← Claude insight panel with pulsing dot
frontend/src/components/ui/ActivityFeed.tsx        ← right-panel timeline events
frontend/src/components/ui/index.ts                ← barrel export for all ui components
frontend/src/components/layout/AppShell.tsx        ← new layout: TopBar + SubNav + content slot
```

### Phase A — Modified
```
frontend/src/styles/globals.css                    ← import tokens.css, add font loads, remove old vars
frontend/index.html                                ← update theme-color to #f59e0b, add font preconnects
frontend/src/components/layout/MainLayout.tsx      ← swap Sidebar+Header for AppShell
frontend/src/App.tsx                               ← remove AnimatedBackground, update Toaster colours
```

### Phase B — Created
```
docs/modules/.url-index.json                       ← Odoo 17 docs URL index (agent 0 output)
docs/modules/crm-spec.md                           ← (agents 1–10 outputs, 45 files total)
docs/modules/sales-spec.md
docs/modules/purchases-spec.md
... (all 45)
docs/modules/00-master-gap-summary.md              ← rollup agent output, prioritised backlog
```

---

## Phase A — Design Foundation

---

### Task 1: Design tokens

**Files:**
- Create: `frontend/src/styles/tokens.css`
- Create: `frontend/src/styles/tokens.ts`
- Modify: `frontend/src/styles/globals.css`
- Modify: `frontend/index.html`

- [ ] **Step 1: Create `frontend/src/styles/tokens.css`**

```css
/* FusionAI Design Tokens — single source of truth
   All components MUST reference these variables, never hardcode hex values. */

:root {
  /* ── Backgrounds ─────────────────────────── */
  --bg-base:          #0a0f1e;
  --bg-topbar:        rgba(0, 0, 0, 0.5);
  --bg-subnav:        rgba(255, 255, 255, 0.015);
  --bg-surface:       rgba(255, 255, 255, 0.04);
  --bg-surface-hover: rgba(255, 255, 255, 0.06);
  --bg-input:         rgba(255, 255, 255, 0.03);

  /* ── Borders ─────────────────────────────── */
  --border-default: rgba(255, 255, 255, 0.07);
  --border-subtle:  rgba(255, 255, 255, 0.05);
  --border-strong:  rgba(255, 255, 255, 0.12);

  /* ── Accent — Amber / Orange ─────────────── */
  --accent-primary:    #f59e0b;
  --accent-secondary:  #f97316;
  --accent-gradient:   linear-gradient(135deg, #f59e0b, #f97316);
  --accent-muted:      rgba(245, 158, 11, 0.12);
  --accent-border:     rgba(245, 158, 11, 0.25);
  --accent-glow:       0 0 20px rgba(245, 158, 11, 0.15);
  --accent-glow-sm:    0 0 8px rgba(245, 158, 11, 0.35);
  --accent-text:       #fbbf24;
  --accent-text-dim:   #fcd34d;

  /* ── Semantic ────────────────────────────── */
  --color-success:  #10b981;
  --color-warning:  #f59e0b;
  --color-error:    #ef4444;
  --color-info:     #6366f1;
  --color-muted:    rgba(255, 255, 255, 0.3);

  /* ── Text ────────────────────────────────── */
  --text-primary:   #f8fafc;
  --text-secondary: rgba(255, 255, 255, 0.6);
  --text-tertiary:  rgba(255, 255, 255, 0.35);
  --text-disabled:  rgba(255, 255, 255, 0.2);

  /* ── Typography ──────────────────────────── */
  --font-heading: 'Space Grotesk', system-ui, sans-serif;
  --font-body:    'Inter', system-ui, sans-serif;

  --text-xs:   9px;
  --text-sm:   11px;
  --text-base: 13px;
  --text-md:   15px;
  --text-lg:   20px;
  --text-xl:   28px;

  --weight-regular:  400;
  --weight-medium:   500;
  --weight-semibold: 600;
  --weight-bold:     700;

  /* ── Spacing & Radius ────────────────────── */
  --radius-sm:  6px;
  --radius-md:  8px;
  --radius-lg:  10px;
  --radius-xl:  12px;

  --spacing-page: 20px;
  --spacing-card: 14px;
  --spacing-gap:  10px;

  /* ── Z-index ─────────────────────────────── */
  --z-base:    0;
  --z-raised:  10;
  --z-dropdown: 100;
  --z-sticky:  200;
  --z-modal:   300;
  --z-toast:   400;
}
```

- [ ] **Step 2: Create `frontend/src/styles/tokens.ts`**

```ts
export const tokens = {
  colors: {
    bgBase:          '#0a0f1e',
    bgSurface:       'rgba(255,255,255,0.04)',
    bgSurfaceHover:  'rgba(255,255,255,0.06)',
    bgInput:         'rgba(255,255,255,0.03)',
    borderDefault:   'rgba(255,255,255,0.07)',
    borderSubtle:    'rgba(255,255,255,0.05)',
    accentPrimary:   '#f59e0b',
    accentSecondary: '#f97316',
    accentMuted:     'rgba(245,158,11,0.12)',
    accentBorder:    'rgba(245,158,11,0.25)',
    accentText:      '#fbbf24',
    accentTextDim:   '#fcd34d',
    success:         '#10b981',
    error:           '#ef4444',
    info:            '#6366f1',
    textPrimary:     '#f8fafc',
    textSecondary:   'rgba(255,255,255,0.6)',
    textTertiary:    'rgba(255,255,255,0.35)',
    textDisabled:    'rgba(255,255,255,0.2)',
  },
  fonts: {
    heading: "'Space Grotesk', system-ui, sans-serif",
    body:    "'Inter', system-ui, sans-serif",
  },
  shadows: {
    accentGlow:   '0 0 20px rgba(245,158,11,0.15)',
    accentGlowSm: '0 0 8px rgba(245,158,11,0.35)',
    cardHighlight: '0 0 20px rgba(245,158,11,0.08), inset 0 1px 0 rgba(245,158,11,0.1)',
  },
} as const
```

- [ ] **Step 3: Update `frontend/src/styles/globals.css`**

Replace the entire `:root` block and font imports. Keep all Tailwind imports and any utility classes below them. The new file head should be:

```css
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';
@import './tokens.css';

@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');

html, body, #root {
  background-color: var(--bg-base);
  color: var(--text-primary);
  font-family: var(--font-body);
  min-height: 100vh;
}

* {
  box-sizing: border-box;
}

/* Remove all old --primary-purple, --dark-bg, etc. custom property declarations */
```

Keep any existing utility class definitions (`.btn-primary`, `.glass-card`, etc.) below — they will be replaced module by module as components are rebuilt, not all at once.

- [ ] **Step 4: Update `frontend/index.html`**

Change `<meta name="theme-color" content="#6B46C1">` to `<meta name="theme-color" content="#f59e0b">`.

Add after the existing `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```
(They may already exist — just verify, don't duplicate.)

- [ ] **Step 5: Verify build is clean**

```bash
cd frontend && npm run build 2>&1 | tail -5
```
Expected: exit 0, no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/styles/tokens.css frontend/src/styles/tokens.ts frontend/src/styles/globals.css frontend/index.html
git commit -m "feat: design tokens — Dark Glass + Amber accent system (tokens.css + tokens.ts)"
```

---

### Task 2: Button component

**Files:**
- Create: `frontend/src/components/ui/Button.tsx`

- [ ] **Step 1: Create `frontend/src/components/ui/Button.tsx`**

```tsx
import React from 'react'
import { Loader2 } from 'lucide-react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: React.ReactNode
}

const base = `
  inline-flex items-center justify-center gap-2
  font-semibold cursor-pointer select-none
  transition-all duration-150 border
  disabled:opacity-50 disabled:cursor-not-allowed
`

const variants: Record<ButtonVariant, string> = {
  primary: `
    bg-gradient-to-br from-[#f59e0b] to-[#f97316]
    text-black border-transparent
    shadow-[0_0_16px_rgba(245,158,11,0.3)]
    hover:shadow-[0_0_24px_rgba(245,158,11,0.5)]
    hover:brightness-110
  `,
  secondary: `
    bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.6)]
    border-[rgba(255,255,255,0.1)]
    hover:bg-[rgba(255,255,255,0.08)] hover:text-white
  `,
  danger: `
    bg-gradient-to-br from-[#ef4444] to-[#dc2626]
    text-white border-transparent
    shadow-[0_0_16px_rgba(239,68,68,0.2)]
    hover:shadow-[0_0_24px_rgba(239,68,68,0.35)]
  `,
  ghost: `
    bg-transparent border-transparent text-[rgba(255,255,255,0.4)]
    hover:bg-[rgba(255,255,255,0.06)] hover:text-white
  `,
}

const sizes: Record<ButtonSize, string> = {
  sm: 'text-[11px] px-3 py-1.5 rounded-[5px]',
  md: 'text-[12px] px-4 py-2 rounded-[7px]',
  lg: 'text-[13px] px-5 py-2.5 rounded-[8px]',
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  className = '',
  style,
  ...rest
}) => {
  return (
    <button
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      style={{ fontFamily: 'var(--font-heading)', ...style }}
      {...rest}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {children}
    </button>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep "Button" | head -5
```
Expected: no output (no errors).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ui/Button.tsx
git commit -m "feat(ui): Button component — primary/secondary/danger/ghost variants"
```

---

### Task 3: Badge and Avatar

**Files:**
- Create: `frontend/src/components/ui/Badge.tsx`
- Create: `frontend/src/components/ui/Avatar.tsx`

- [ ] **Step 1: Create `frontend/src/components/ui/Badge.tsx`**

```tsx
import React from 'react'

type BadgeVariant = 'success' | 'warning' | 'info' | 'error' | 'neutral'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const styles: Record<BadgeVariant, string> = {
  success: 'bg-[rgba(16,185,129,0.12)] border border-[rgba(16,185,129,0.3)] text-[#34d399]',
  warning: 'bg-[rgba(245,158,11,0.12)] border border-[rgba(245,158,11,0.3)] text-[#fcd34d]',
  info:    'bg-[rgba(99,102,241,0.12)] border border-[rgba(99,102,241,0.3)] text-[#a5b4fc]',
  error:   'bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.3)] text-[#fca5a5]',
  neutral: 'bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.5)]',
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', children, className = '' }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${styles[variant]} ${className}`}
    style={{ fontFamily: 'var(--font-body)' }}
  >
    {children}
  </span>
)

/** Map common ERP status strings to a badge variant */
export function statusVariant(status: string): BadgeVariant {
  const s = status.toLowerCase()
  if (['won', 'paid', 'done', 'posted', 'confirmed', 'active', 'delivered'].some(v => s.includes(v))) return 'success'
  if (['open', 'warm', 'qualified', 'in_progress', 'draft', 'partial'].some(v => s.includes(v))) return 'warning'
  if (['new', 'cold', 'pending', 'todo'].some(v => s.includes(v))) return 'info'
  if (['lost', 'cancelled', 'error', 'failed', 'overdue'].some(v => s.includes(v))) return 'error'
  return 'neutral'
}
```

- [ ] **Step 2: Create `frontend/src/components/ui/Avatar.tsx`**

```tsx
import React from 'react'

interface AvatarProps {
  name: string
  size?: number
  gradient?: [string, string]
  glow?: boolean
  src?: string
  className?: string
}

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
}

/** Deterministic gradient from name string */
function nameGradient(name: string): [string, string] {
  const palettes: Array<[string, string]> = [
    ['#f59e0b', '#f97316'],
    ['#6366f1', '#8b5cf6'],
    ['#10b981', '#14b8a6'],
    ['#ef4444', '#f97316'],
    ['#ec4899', '#8b5cf6'],
    ['#06b6d4', '#6366f1'],
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % palettes.length
  return palettes[Math.abs(hash)]
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 28, gradient, glow = false, src, className = '' }) => {
  const [from, to] = gradient ?? nameGradient(name)
  const isAmber = from === '#f59e0b'
  const shadow = glow || isAmber ? `0 0 8px ${from}66` : undefined

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size, boxShadow: shadow }}
      />
    )
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center flex-shrink-0 font-bold ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${from}, ${to})`,
        boxShadow: shadow,
        fontSize: Math.max(8, size * 0.35),
        fontFamily: 'var(--font-heading)',
        color: isAmber ? '#000' : '#fff',
      }}
    >
      {initials(name)}
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep -E "Badge|Avatar" | head -5
```
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/ui/Badge.tsx frontend/src/components/ui/Avatar.tsx
git commit -m "feat(ui): Badge (status variants + statusVariant helper) + Avatar (gradient, glow)"
```

---

### Task 4: Form controls — Input, Select, Textarea

**Files:**
- Create: `frontend/src/components/ui/Input.tsx`
- Create: `frontend/src/components/ui/Select.tsx`
- Create: `frontend/src/components/ui/Textarea.tsx`

- [ ] **Step 1: Create `frontend/src/components/ui/Input.tsx`**

```tsx
import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const Input: React.FC<InputProps> = ({ label, error, icon, className = '', id, ...rest }) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={inputId}
          className="text-[11px] text-[rgba(255,255,255,0.35)]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.3)]">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={`
            w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)]
            rounded-[6px] px-3 py-2 text-[13px] text-[#f8fafc]
            placeholder:text-[rgba(255,255,255,0.2)]
            focus:outline-none focus:border-[rgba(245,158,11,0.4)]
            focus:shadow-[0_0_0_3px_rgba(245,158,11,0.08)]
            transition-all duration-150
            ${icon ? 'pl-9' : ''}
            ${error ? 'border-[rgba(239,68,68,0.5)]' : ''}
            ${className}
          `}
          style={{ fontFamily: 'var(--font-body)' }}
          {...rest}
        />
      </div>
      {error && (
        <span className="text-[10px] text-[#fca5a5]" style={{ fontFamily: 'var(--font-body)' }}>
          {error}
        </span>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create `frontend/src/components/ui/Select.tsx`**

```tsx
import React from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: Array<{ value: string; label: string }>
  placeholder?: string
}

export const Select: React.FC<SelectProps> = ({ label, error, options, placeholder, className = '', id, ...rest }) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-[11px] text-[rgba(255,255,255,0.35)]" style={{ fontFamily: 'var(--font-body)' }}>
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={inputId}
          className={`
            w-full appearance-none bg-[rgba(255,255,255,0.03)]
            border border-[rgba(255,255,255,0.07)] rounded-[6px]
            px-3 py-2 pr-8 text-[13px] text-[#f8fafc]
            focus:outline-none focus:border-[rgba(245,158,11,0.4)]
            focus:shadow-[0_0_0_3px_rgba(245,158,11,0.08)]
            transition-all duration-150 cursor-pointer
            ${error ? 'border-[rgba(239,68,68,0.5)]' : ''}
            ${className}
          `}
          style={{ fontFamily: 'var(--font-body)' }}
          {...rest}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.3)] pointer-events-none" />
      </div>
      {error && <span className="text-[10px] text-[#fca5a5]">{error}</span>}
    </div>
  )
}
```

- [ ] **Step 3: Create `frontend/src/components/ui/Textarea.tsx`**

```tsx
import React from 'react'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea: React.FC<TextareaProps> = ({ label, error, className = '', id, ...rest }) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-[11px] text-[rgba(255,255,255,0.35)]" style={{ fontFamily: 'var(--font-body)' }}>
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={`
          w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)]
          rounded-[6px] px-3 py-2 text-[13px] text-[#f8fafc] resize-y min-h-[80px]
          placeholder:text-[rgba(255,255,255,0.2)]
          focus:outline-none focus:border-[rgba(245,158,11,0.4)]
          focus:shadow-[0_0_0_3px_rgba(245,158,11,0.08)]
          transition-all duration-150
          ${error ? 'border-[rgba(239,68,68,0.5)]' : ''}
          ${className}
        `}
        style={{ fontFamily: 'var(--font-body)' }}
        {...rest}
      />
      {error && <span className="text-[10px] text-[#fca5a5]">{error}</span>}
    </div>
  )
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep -E "Input|Select|Textarea" | head -5
```
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ui/Input.tsx frontend/src/components/ui/Select.tsx frontend/src/components/ui/Textarea.tsx
git commit -m "feat(ui): Input, Select, Textarea — glass surface + amber focus ring"
```

---

### Task 5: GlassCard and StatCard

**Files:**
- Create: `frontend/src/components/ui/GlassCard.tsx`
- Create: `frontend/src/components/ui/StatCard.tsx`

- [ ] **Step 1: Create `frontend/src/components/ui/GlassCard.tsx`**

```tsx
import React from 'react'

type CardVariant = 'default' | 'highlight' | 'ai'

interface GlassCardProps {
  variant?: CardVariant
  children: React.ReactNode
  className?: string
  onClick?: () => void
  padding?: boolean
}

const variants: Record<CardVariant, string> = {
  default: `
    bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)]
    hover:bg-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)]
  `,
  highlight: `
    bg-[rgba(245,158,11,0.07)] border border-[rgba(245,158,11,0.25)]
    shadow-[0_0_20px_rgba(245,158,11,0.08),inset_0_1px_0_rgba(245,158,11,0.1)]
  `,
  ai: `
    bg-[rgba(245,158,11,0.05)] border border-[rgba(245,158,11,0.15)]
  `,
}

export const GlassCard: React.FC<GlassCardProps> = ({
  variant = 'default',
  children,
  className = '',
  onClick,
  padding = true,
}) => (
  <div
    className={`
      rounded-[10px] transition-all duration-150
      ${variants[variant]}
      ${padding ? 'p-[14px]' : ''}
      ${onClick ? 'cursor-pointer' : ''}
      ${className}
    `}
    onClick={onClick}
  >
    {children}
  </div>
)
```

- [ ] **Step 2: Create `frontend/src/components/ui/StatCard.tsx`**

```tsx
import React from 'react'
import { GlassCard } from './GlassCard'

interface StatCardProps {
  value: string | number
  label: string
  delta?: string
  deltaPositive?: boolean
  highlight?: boolean
  className?: string
}

export const StatCard: React.FC<StatCardProps> = ({
  value, label, delta, deltaPositive, highlight = false, className = '',
}) => (
  <GlassCard variant={highlight ? 'highlight' : 'default'} className={className}>
    <div
      className={`text-[22px] font-bold ${highlight ? 'text-[#fbbf24]' : 'text-[#f8fafc]'}`}
      style={{ fontFamily: 'var(--font-heading)' }}
    >
      {value}
    </div>
    <div className="text-[11px] text-[rgba(255,255,255,0.3)] mt-0.5" style={{ fontFamily: 'var(--font-body)' }}>
      {label}
    </div>
    {delta && (
      <div
        className={`text-[10px] mt-1 ${deltaPositive ? 'text-[#34d399]' : deltaPositive === false ? 'text-[#fca5a5]' : 'text-[#fcd34d]'}`}
        style={{ fontFamily: 'var(--font-body)' }}
      >
        {delta}
      </div>
    )}
  </GlassCard>
)
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep -E "GlassCard|StatCard" | head -5
```
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/ui/GlassCard.tsx frontend/src/components/ui/StatCard.tsx
git commit -m "feat(ui): GlassCard (default/highlight/ai variants) + StatCard"
```

---

### Task 6: DataTable

**Files:**
- Create: `frontend/src/components/ui/DataTable.tsx`

- [ ] **Step 1: Create `frontend/src/components/ui/DataTable.tsx`**

```tsx
import React, { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

export interface Column<T> {
  key: keyof T | string
  header: string
  width?: string
  render?: (row: T) => React.ReactNode
  sortable?: boolean
}

interface DataTableProps<T extends Record<string, unknown>> {
  columns: Column<T>[]
  rows: T[]
  activeRowId?: string | number
  onRowClick?: (row: T) => void
  className?: string
  emptyMessage?: string
}

export function DataTable<T extends Record<string, unknown>>({
  columns, rows, activeRowId, onRowClick, className = '', emptyMessage = 'No records found',
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = sortKey
    ? [...rows].sort((a, b) => {
        const av = String(a[sortKey] ?? '')
        const bv = String(b[sortKey] ?? '')
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      })
    : rows

  return (
    <div className={`bg-[rgba(255,255,255,0.025)] border border-[rgba(255,255,255,0.06)] rounded-[10px] overflow-hidden ${className}`}>
      {/* Header */}
      <div
        className="grid border-b border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.025)]"
        style={{ gridTemplateColumns: columns.map(c => c.width ?? '1fr').join(' ') }}
      >
        {columns.map(col => (
          <div
            key={String(col.key)}
            className={`px-3.5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.5px] text-[rgba(255,255,255,0.25)] flex items-center gap-1 ${col.sortable ? 'cursor-pointer hover:text-[#fbbf24] select-none' : ''}`}
            style={{ fontFamily: 'var(--font-heading)' }}
            onClick={() => col.sortable && handleSort(String(col.key))}
          >
            {col.header}
            {col.sortable && sortKey === String(col.key) && (
              sortDir === 'asc' ? <ChevronUp size={10} className="text-[#fbbf24]" /> : <ChevronDown size={10} className="text-[#fbbf24]" />
            )}
          </div>
        ))}
      </div>

      {/* Rows */}
      {sorted.length === 0 ? (
        <div className="px-3.5 py-6 text-[12px] text-[rgba(255,255,255,0.3)] text-center" style={{ fontFamily: 'var(--font-body)' }}>
          {emptyMessage}
        </div>
      ) : (
        sorted.map((row, i) => {
          const rowId = (row.id as string | number) ?? i
          const isActive = activeRowId !== undefined && rowId === activeRowId
          return (
            <div
              key={rowId}
              className={`
                grid border-b border-[rgba(255,255,255,0.04)] last:border-0 items-center
                transition-colors duration-100
                ${isActive ? 'bg-[rgba(245,158,11,0.04)] border-l-2 border-l-[rgba(245,158,11,0.3)]' : ''}
                ${onRowClick ? 'cursor-pointer hover:bg-[rgba(255,255,255,0.025)]' : ''}
              `}
              style={{ gridTemplateColumns: columns.map(c => c.width ?? '1fr').join(' ') }}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map(col => (
                <div key={String(col.key)} className="px-3.5 py-2.5 text-[12px] text-[rgba(255,255,255,0.6)]" style={{ fontFamily: 'var(--font-body)' }}>
                  {col.render ? col.render(row) : String(row[col.key as keyof T] ?? '')}
                </div>
              ))}
            </div>
          )
        })
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep "DataTable" | head -5
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ui/DataTable.tsx
git commit -m "feat(ui): DataTable — sortable columns, amber active row, generic typed rows"
```

---

### Task 7: PageHeader and TabBar

**Files:**
- Create: `frontend/src/components/ui/PageHeader.tsx`
- Create: `frontend/src/components/ui/TabBar.tsx`

- [ ] **Step 1: Create `frontend/src/components/ui/PageHeader.tsx`**

```tsx
import React from 'react'

interface PageHeaderProps {
  title: string
  meta?: string
  actions?: React.ReactNode
  className?: string
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, meta, actions, className = '' }) => (
  <div className={`flex items-start justify-between ${className}`}>
    <div>
      <h1
        className="text-[20px] font-bold text-[#f8fafc] tracking-[-0.3px]"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        {title}
      </h1>
      {meta && (
        <p className="text-[12px] text-[rgba(255,255,255,0.3)] mt-0.5" style={{ fontFamily: 'var(--font-body)' }}>
          {meta}
        </p>
      )}
    </div>
    {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
  </div>
)
```

- [ ] **Step 2: Create `frontend/src/components/ui/TabBar.tsx`**

```tsx
import React from 'react'

export interface Tab {
  key: string
  label: string
  count?: number
}

type TabBarVariant = 'underline' | 'pill'

interface TabBarProps {
  tabs: Tab[]
  activeKey: string
  onChange: (key: string) => void
  variant?: TabBarVariant
  className?: string
}

export const TabBar: React.FC<TabBarProps> = ({ tabs, activeKey, onChange, variant = 'underline', className = '' }) => {
  if (variant === 'pill') {
    return (
      <div className={`flex gap-1 ${className}`}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`
              px-3 py-1.5 rounded-[6px] text-[11px] font-medium transition-all duration-150
              ${activeKey === tab.key
                ? 'bg-[rgba(245,158,11,0.15)] border border-[rgba(245,158,11,0.3)] text-[#fcd34d]'
                : 'text-[rgba(255,255,255,0.4)] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'}
            `}
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 text-[9px] opacity-60">{tab.count}</span>
            )}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className={`flex gap-0 border-b border-[rgba(255,255,255,0.06)] ${className}`}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`
            px-3.5 py-1.5 text-[12px] font-medium transition-all duration-150
            border-b-2 mb-[-1px]
            ${activeKey === tab.key
              ? 'text-[#fbbf24] border-b-[#f59e0b]'
              : 'text-[rgba(255,255,255,0.35)] border-b-transparent hover:text-[rgba(255,255,255,0.6)]'}
          `}
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1.5 text-[9px] opacity-60">{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep -E "PageHeader|TabBar" | head -5
```
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/ui/PageHeader.tsx frontend/src/components/ui/TabBar.tsx
git commit -m "feat(ui): PageHeader + TabBar (underline and pill variants)"
```

---

### Task 8: Modal and Toast

**Files:**
- Create: `frontend/src/components/ui/Modal.tsx`
- Create: `frontend/src/components/ui/Toast.tsx`

- [ ] **Step 1: Create `frontend/src/components/ui/Modal.tsx`**

```tsx
import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, footer, size = 'md' }) => {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Dialog */}
      <div
        className={`relative w-full ${sizes[size]} bg-[#0d1526] border border-[rgba(255,255,255,0.1)] rounded-[12px] shadow-2xl flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">
          <h2 className="text-[16px] font-semibold text-[#f8fafc]" style={{ fontFamily: 'var(--font-heading)' }}>
            {title}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="p-1.5 !px-1.5">
            <X size={16} />
          </Button>
        </div>
        {/* Body */}
        <div className="px-5 py-4 flex-1 overflow-y-auto">{children}</div>
        {/* Footer */}
        {footer && (
          <div className="px-5 py-3.5 border-t border-[rgba(255,255,255,0.06)] flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `frontend/src/components/ui/Toast.tsx`**

This wraps `react-hot-toast` (already installed) with the correct dark glass styling:

```tsx
import { Toaster } from 'react-hot-toast'

/** Drop-in replacement for the Toaster in App.tsx.
 *  Import this instead of react-hot-toast's Toaster directly. */
export const FusionToaster = () => (
  <Toaster
    position="bottom-right"
    toastOptions={{
      duration: 4000,
      style: {
        background: 'rgba(13, 21, 38, 0.95)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)',
        color: '#f8fafc',
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: '13px',
        borderRadius: '8px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      },
      success: {
        iconTheme: { primary: '#10b981', secondary: '#ffffff' },
        style: { borderColor: 'rgba(16,185,129,0.2)' },
      },
      error: {
        iconTheme: { primary: '#ef4444', secondary: '#ffffff' },
        style: { borderColor: 'rgba(239,68,68,0.2)' },
      },
    }}
  />
)
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep -E "Modal|Toast" | head -5
```
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/ui/Modal.tsx frontend/src/components/ui/Toast.tsx
git commit -m "feat(ui): Modal (glass overlay, ESC dismiss) + FusionToaster (dark glass styling)"
```

---

### Task 9: SearchBar, Tooltip, AIPanel, ActivityFeed

**Files:**
- Create: `frontend/src/components/ui/SearchBar.tsx`
- Create: `frontend/src/components/ui/Tooltip.tsx`
- Create: `frontend/src/components/ui/AIPanel.tsx`
- Create: `frontend/src/components/ui/ActivityFeed.tsx`

- [ ] **Step 1: Create `frontend/src/components/ui/SearchBar.tsx`**

```tsx
import React from 'react'
import { Search } from 'lucide-react'

interface SearchBarProps {
  onOpen?: () => void
  className?: string
}

export const SearchBar: React.FC<SearchBarProps> = ({ onOpen, className = '' }) => (
  <button
    onClick={onOpen}
    className={`
      flex items-center gap-2 px-3 py-1.5 rounded-[6px] w-[180px]
      bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)]
      text-[rgba(255,255,255,0.25)] text-[11px] cursor-pointer
      hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.12)]
      transition-all duration-150
      ${className}
    `}
    style={{ fontFamily: 'var(--font-body)' }}
  >
    <Search size={13} />
    <span>Search...</span>
    <span className="ml-auto text-[10px] opacity-50">⌘K</span>
  </button>
)
```

- [ ] **Step 2: Create `frontend/src/components/ui/Tooltip.tsx`**

```tsx
import React, { useState } from 'react'

interface TooltipProps {
  content: string
  children: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, side = 'top' }) => {
  const [visible, setVisible] = useState(false)

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          className={`absolute z-[400] px-2.5 py-1.5 rounded-[5px] text-[11px] text-[#f8fafc] whitespace-nowrap pointer-events-none
            bg-[rgba(13,21,38,0.95)] border border-[rgba(255,255,255,0.1)] backdrop-blur-sm shadow-xl
            ${positions[side]}`}
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {content}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create `frontend/src/components/ui/AIPanel.tsx`**

```tsx
import React from 'react'
import { Button } from './Button'

interface AIAction {
  label: string
  onClick: () => void
}

interface AIPanelProps {
  insight: string
  actions?: AIAction[]
  loading?: boolean
  className?: string
}

export const AIPanel: React.FC<AIPanelProps> = ({ insight, actions = [], loading = false, className = '' }) => (
  <div
    className={`
      bg-[rgba(245,158,11,0.05)] border border-[rgba(245,158,11,0.15)]
      rounded-[8px] p-3 ${className}
    `}
  >
    <div className="flex items-center gap-2 mb-2">
      <span
        className="w-2 h-2 rounded-full bg-[#f59e0b] flex-shrink-0"
        style={{ boxShadow: '0 0 8px rgba(245,158,11,0.8)', animation: 'pulse 2s infinite' }}
      />
      <span className="text-[10px] font-semibold text-[#fcd34d]" style={{ fontFamily: 'var(--font-heading)' }}>
        Claude AI
      </span>
    </div>
    {loading ? (
      <div className="h-4 bg-[rgba(245,158,11,0.1)] rounded animate-pulse" />
    ) : (
      <p className="text-[10px] text-[rgba(255,255,255,0.55)] leading-relaxed mb-2.5" style={{ fontFamily: 'var(--font-body)' }}>
        {insight}
      </p>
    )}
    {actions.map((a, i) => (
      <Button key={i} variant="primary" size="sm" className="w-full mb-1.5 text-[10px]" onClick={a.onClick}>
        {a.label}
      </Button>
    ))}
  </div>
)
```

- [ ] **Step 4: Create `frontend/src/components/ui/ActivityFeed.tsx`**

```tsx
import React from 'react'

export interface ActivityEvent {
  id: string | number
  message: React.ReactNode
  time: string
  highlight?: boolean
}

interface ActivityFeedProps {
  events: ActivityEvent[]
  className?: string
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ events, className = '' }) => (
  <div className={`flex flex-col gap-0 ${className}`}>
    {events.map(event => (
      <div key={event.id} className="flex gap-2.5 items-start mb-2.5">
        <span
          className="w-[7px] h-[7px] rounded-full mt-1 flex-shrink-0"
          style={{
            background: event.highlight ? '#f59e0b' : 'rgba(255,255,255,0.15)',
            boxShadow: event.highlight ? '0 0 5px rgba(245,158,11,0.6)' : undefined,
          }}
        />
        <div>
          <div className="text-[10px] text-[rgba(255,255,255,0.5)] leading-snug" style={{ fontFamily: 'var(--font-body)' }}>
            {event.message}
          </div>
          <div className="text-[9px] text-[rgba(255,255,255,0.2)] mt-0.5" style={{ fontFamily: 'var(--font-body)' }}>
            {event.time}
          </div>
        </div>
      </div>
    ))}
  </div>
)
```

- [ ] **Step 5: Verify TypeScript**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep -E "SearchBar|Tooltip|AIPanel|ActivityFeed" | head -5
```
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/ui/SearchBar.tsx frontend/src/components/ui/Tooltip.tsx frontend/src/components/ui/AIPanel.tsx frontend/src/components/ui/ActivityFeed.tsx
git commit -m "feat(ui): SearchBar, Tooltip, AIPanel (pulsing dot + actions), ActivityFeed"
```

---

### Task 10: Barrel export

**Files:**
- Create: `frontend/src/components/ui/index.ts`

- [ ] **Step 1: Create `frontend/src/components/ui/index.ts`**

```ts
export { Button } from './Button'
export { Badge, statusVariant } from './Badge'
export { Avatar } from './Avatar'
export { Input } from './Input'
export { Select } from './Select'
export { Textarea } from './Textarea'
export { GlassCard } from './GlassCard'
export { StatCard } from './StatCard'
export { DataTable } from './DataTable'
export type { Column } from './DataTable'
export { PageHeader } from './PageHeader'
export { TabBar } from './TabBar'
export type { Tab } from './TabBar'
export { Modal } from './Modal'
export { FusionToaster } from './Toast'
export { SearchBar } from './SearchBar'
export { Tooltip } from './Tooltip'
export { AIPanel } from './AIPanel'
export { ActivityFeed } from './ActivityFeed'
```

- [ ] **Step 2: Verify barrel resolves cleanly**

```bash
cd frontend && node -e "import('./src/components/ui/index.ts').then(() => console.log('OK')).catch(e => console.error(e))" 2>&1 | head -3
```
Expected: `OK` or no error (this is a TypeScript file — the tsc check below is the real gate).

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -10
```
Expected: exit 0, no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ui/index.ts
git commit -m "feat(ui): barrel export for all 17 shared components"
```

---

### Task 11: TopBar component

**Files:**
- Create: `frontend/src/components/ui/TopBar.tsx`

- [ ] **Step 1: Create `frontend/src/components/ui/TopBar.tsx`**

```tsx
import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Bell, ChevronDown } from 'lucide-react'
import { Avatar } from './Avatar'
import { SearchBar } from './SearchBar'

export interface AppNavItem {
  key: string
  label: string
  path: string
}

interface TopBarProps {
  apps: AppNavItem[]
  userName?: string
  notificationCount?: number
  onSearchOpen?: () => void
  maxVisible?: number
}

export const TopBar: React.FC<TopBarProps> = ({
  apps,
  userName = 'Admin',
  notificationCount = 0,
  onSearchOpen,
  maxVisible = 7,
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [overflowOpen, setOverflowOpen] = useState(false)

  const visible = apps.slice(0, maxVisible)
  const overflow = apps.slice(maxVisible)
  const activeApp = apps.find(a => location.pathname.startsWith(a.path))

  return (
    <header
      className="h-[44px] flex items-center px-4 gap-1 sticky top-0 z-[200] border-b border-[rgba(255,255,255,0.06)]"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2 mr-3 cursor-pointer flex-shrink-0"
        onClick={() => navigate('/')}
      >
        <div
          className="w-[26px] h-[26px] rounded-[7px] flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #f59e0b, #f97316)',
            boxShadow: '0 0 14px rgba(245,158,11,0.4)',
          }}
        />
        <span className="text-[15px] font-bold text-[#fafafa]" style={{ fontFamily: 'var(--font-heading)' }}>
          FusionAI
        </span>
      </div>

      {/* App pills */}
      {visible.map(app => (
        <button
          key={app.key}
          onClick={() => navigate(app.path)}
          className={`
            px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-all duration-150 flex-shrink-0
            ${activeApp?.key === app.key
              ? 'bg-[rgba(245,158,11,0.12)] border border-[rgba(245,158,11,0.25)] text-[#fcd34d]'
              : 'text-[rgba(255,255,255,0.4)] hover:text-[rgba(255,255,255,0.7)] border border-transparent'}
          `}
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {app.label}
        </button>
      ))}

      {/* Overflow */}
      {overflow.length > 0 && (
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setOverflowOpen(o => !o)}
            className="px-3 py-1.5 rounded-[6px] text-[12px] font-medium text-[rgba(255,255,255,0.4)] hover:text-white flex items-center gap-1 border border-transparent"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            ··· <ChevronDown size={12} />
          </button>
          {overflowOpen && (
            <div className="absolute top-full left-0 mt-1 w-44 bg-[#0d1526] border border-[rgba(255,255,255,0.1)] rounded-[8px] shadow-2xl z-[300] py-1">
              {overflow.map(app => (
                <button
                  key={app.key}
                  onClick={() => { navigate(app.path); setOverflowOpen(false) }}
                  className="w-full text-left px-3.5 py-2 text-[12px] text-[rgba(255,255,255,0.6)] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {app.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Right */}
      <div className="ml-auto flex items-center gap-2.5">
        <SearchBar onOpen={onSearchOpen} />
        <div className="relative">
          <button className="w-[28px] h-[28px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-[6px] flex items-center justify-center text-[rgba(255,255,255,0.5)] hover:text-white transition-colors">
            <Bell size={14} />
          </button>
          {notificationCount > 0 && (
            <span
              className="absolute top-[5px] right-[5px] w-[6px] h-[6px] rounded-full bg-[#f59e0b]"
              style={{ boxShadow: '0 0 4px rgba(245,158,11,0.8)' }}
            />
          )}
        </div>
        <Avatar name={userName} size={28} glow />
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Add TopBar to barrel export** — append to `frontend/src/components/ui/index.ts`:

```ts
export { TopBar } from './TopBar'
export type { AppNavItem } from './TopBar'
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep "TopBar" | head -5
```
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/ui/TopBar.tsx frontend/src/components/ui/index.ts
git commit -m "feat(ui): TopBar — sticky app nav, amber active pill, overflow menu"
```

---

### Task 12: SubNav component

**Files:**
- Create: `frontend/src/components/ui/SubNav.tsx`

- [ ] **Step 1: Create `frontend/src/components/ui/SubNav.tsx`**

```tsx
import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

export interface SubNavSection {
  title: string
  items: SubNavItem[]
}

export interface SubNavItem {
  key: string
  label: string
  path: string
  badge?: number | string
  icon?: React.ReactNode
}

interface SubNavProps {
  sections: SubNavSection[]
  collapsed?: boolean
  onToggle?: () => void
  className?: string
}

export const SubNav: React.FC<SubNavProps> = ({ sections, collapsed = false, onToggle, className = '' }) => {
  const navigate = useNavigate()
  const location = useLocation()

  if (collapsed) {
    return (
      <div className="w-[28px] border-r border-[rgba(255,255,255,0.05)] flex flex-col items-center pt-3 flex-shrink-0">
        <button
          onClick={onToggle}
          className="text-[rgba(255,255,255,0.3)] hover:text-white transition-colors rotate-180"
        >
          <ChevronLeft size={14} />
        </button>
      </div>
    )
  }

  return (
    <nav
      className={`w-[180px] flex-shrink-0 border-r border-[rgba(255,255,255,0.05)] flex flex-col gap-0.5 py-3 px-2 overflow-y-auto ${className}`}
      style={{ background: 'rgba(255,255,255,0.015)' }}
    >
      {sections.map(section => (
        <div key={section.title} className="mb-2">
          <div
            className="px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.8px] text-[rgba(255,255,255,0.2)] mb-0.5"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {section.title}
          </div>
          {section.items.map(item => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.path)}
                className={`
                  w-full flex items-center gap-2 px-2.5 py-[7px] rounded-[6px]
                  text-[12px] transition-all duration-150 text-left
                  ${isActive
                    ? 'bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.2)] text-[#fcd34d] font-medium'
                    : 'text-[rgba(255,255,255,0.4)] hover:text-[rgba(255,255,255,0.7)] hover:bg-[rgba(255,255,255,0.04)] border border-transparent'}
                `}
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {/* Dot indicator */}
                <span
                  className="w-[6px] h-[6px] rounded-full flex-shrink-0"
                  style={{
                    background: isActive ? '#f59e0b' : 'rgba(255,255,255,0.2)',
                    boxShadow: isActive ? '0 0 5px rgba(245,158,11,0.5)' : undefined,
                  }}
                />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className="text-[8px] font-semibold px-1.5 py-0.5 rounded-[8px]"
                    style={{
                      background: 'rgba(245,158,11,0.2)',
                      border: '1px solid rgba(245,158,11,0.3)',
                      color: '#fbbf24',
                      fontFamily: 'var(--font-heading)',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      ))}

      {/* Collapse toggle */}
      {onToggle && (
        <button
          onClick={onToggle}
          className="mt-auto mx-2 py-2 text-[rgba(255,255,255,0.2)] hover:text-[rgba(255,255,255,0.5)] flex items-center gap-1.5 text-[10px] transition-colors"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          <ChevronLeft size={12} />
          Collapse
        </button>
      )}
    </nav>
  )
}
```

- [ ] **Step 2: Add SubNav to barrel export** — append to `frontend/src/components/ui/index.ts`:

```ts
export { SubNav } from './SubNav'
export type { SubNavSection, SubNavItem } from './SubNav'
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep "SubNav" | head -5
```
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/ui/SubNav.tsx frontend/src/components/ui/index.ts
git commit -m "feat(ui): SubNav — amber active dot, badge counts, collapsible"
```

---

### Task 13: AppShell — wire TopBar + SubNav into new layout

**Files:**
- Create: `frontend/src/components/layout/AppShell.tsx`
- Modify: `frontend/src/components/layout/MainLayout.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Create `frontend/src/components/layout/AppShell.tsx`**

```tsx
import React, { useState } from 'react'
import { TopBar, AppNavItem } from '@/components/ui/TopBar'
import { SubNav, SubNavSection } from '@/components/ui/SubNav'
import { FusionToaster } from '@/components/ui'

const APP_NAV: AppNavItem[] = [
  { key: 'dashboard',    label: 'Dashboard',    path: '/' },
  { key: 'crm',          label: 'CRM',          path: '/module/crm' },
  { key: 'sales',        label: 'Sales',        path: '/module/sales' },
  { key: 'accounting',   label: 'Accounting',   path: '/module/accounting' },
  { key: 'inventory',    label: 'Inventory',    path: '/module/inventory' },
  { key: 'purchases',    label: 'Purchases',    path: '/module/purchases' },
  { key: 'helpdesk',     label: 'Helpdesk',     path: '/module/helpdesk' },
  { key: 'hr',           label: 'HR',           path: '/module/hr' },
  { key: 'manufacturing',label: 'Manufacturing',path: '/module/manufacturing' },
  { key: 'project',      label: 'Project',      path: '/module/project' },
  { key: 'timesheets',   label: 'Timesheets',   path: '/module/timesheets' },
  { key: 'discuss',      label: 'Discuss',      path: '/module/discuss' },
  { key: 'knowledge',    label: 'Knowledge',    path: '/module/knowledge' },
  { key: 'documents',    label: 'Documents',    path: '/module/documents' },
  { key: 'calendar',     label: 'Calendar',     path: '/module/calendar' },
  { key: 'events',       label: 'Events',       path: '/module/events' },
  { key: 'website',      label: 'Website',      path: '/module/website' },
  { key: 'ecommerce',    label: 'eCommerce',    path: '/module/ecommerce' },
  { key: 'pos',          label: 'POS',          path: '/module/pos' },
]

/** Default sub-nav sections for any module not yet customised.
 *  Modules override this by passing their own sections via context. */
const DEFAULT_SUBNAV: SubNavSection[] = [
  {
    title: 'Menu',
    items: [
      { key: 'overview',  label: 'Overview',  path: '#' },
      { key: 'list',      label: 'List',      path: '#' },
      { key: 'kanban',    label: 'Kanban',    path: '#' },
      { key: 'reports',   label: 'Reports',   path: '#' },
    ],
  },
  {
    title: 'Configuration',
    items: [
      { key: 'settings',    label: 'Settings',    path: '#' },
      { key: 'roles',       label: 'Roles',       path: '#' },
      { key: 'automations', label: 'Automations', path: '#' },
    ],
  },
]

interface AppShellContextValue {
  setSubNavSections: (sections: SubNavSection[]) => void
}

export const AppShellContext = React.createContext<AppShellContextValue>({
  setSubNavSections: () => undefined,
})

interface AppShellProps {
  children: React.ReactNode
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [subNavSections, setSubNavSections] = useState<SubNavSection[]>(DEFAULT_SUBNAV)
  const [subNavCollapsed, setSubNavCollapsed] = useState(false)

  return (
    <AppShellContext.Provider value={{ setSubNavSections }}>
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>
        <TopBar apps={APP_NAV} maxVisible={7} />
        <div className="flex flex-1 overflow-hidden">
          <SubNav
            sections={subNavSections}
            collapsed={subNavCollapsed}
            onToggle={() => setSubNavCollapsed(c => !c)}
          />
          <main className="flex-1 overflow-auto p-[20px]">
            {children}
          </main>
        </div>
      </div>
      <FusionToaster />
    </AppShellContext.Provider>
  )
}

/** Hook for modules to register their own sub-nav sections */
export function useSubNav(sections: SubNavSection[]) {
  const { setSubNavSections } = React.useContext(AppShellContext)
  React.useEffect(() => {
    setSubNavSections(sections)
    return () => setSubNavSections(DEFAULT_SUBNAV)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
```

- [ ] **Step 2: Update `frontend/src/components/layout/MainLayout.tsx`**

Replace the entire file:

```tsx
import React from 'react'
import { AppShell } from './AppShell'

interface MainLayoutProps {
  children: React.ReactNode
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => (
  <AppShell>{children}</AppShell>
)
```

- [ ] **Step 3: Remove AnimatedBackground from `frontend/src/App.tsx`**

In `App.tsx`, find and remove the `<AnimatedBackground />` component import and usage. It was a purple-era decoration that clashes with the new dark glass shell.

Also replace `<Toaster ... />` (react-hot-toast import) with `{/* Toaster is now inside AppShell/FusionToaster */}` comment — or simply delete the `<Toaster>` block from App.tsx entirely since AppShell now handles it.

- [ ] **Step 4: Verify build**

```bash
cd frontend && npm run build 2>&1 | tail -8
```
Expected: exit 0.

- [ ] **Step 5: Verify dev server renders the new shell**

```bash
cd frontend && npm run dev &
sleep 4 && curl -s http://localhost:5173/ | grep -c "FusionAI"
```
Expected: `1` (page loads without crash).

Kill dev server: `pkill -f "vite"`.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/layout/AppShell.tsx frontend/src/components/layout/MainLayout.tsx frontend/src/App.tsx
git commit -m "feat: AppShell — new TopBar + SubNav layout replaces Sidebar+Header; all 19 app pills wired"
```

---

### Task 14: Remove legacy purple theme

**Files:**
- Modify: `frontend/src/styles/globals.css`
- Modify: `frontend/index.html`

- [ ] **Step 1: Remove old `:root` CSS variables from `globals.css`**

Delete these variable declarations (they are now in tokens.css and no longer referenced):
```
--primary-purple, --secondary-purple, --accent-pink
--dark-bg, --dark-surface, --dark-elevated
--glass-bg, --glass-border, --glass-hover, --glass-active
--text-primary (old), --text-secondary (old), --text-muted, --text-accent
```

Keep: Tailwind imports, the `@import './tokens.css'` line, font import, and any utility CSS classes like `.btn-primary`.

- [ ] **Step 2: Update `frontend/index.html`**

Change `class="dark"` on `<html>` to just `<html lang="en">` — no dark class needed since background is always dark-glass.

- [ ] **Step 3: Verify build still passes**

```bash
cd frontend && npm run build 2>&1 | tail -5
```
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/styles/globals.css frontend/index.html
git commit -m "chore: remove legacy purple theme vars — tokens.css is now the sole source of truth"
```

---

## Phase B — Module Research (Odoo 17 Gap Analysis)

---

### Task 15: Sitemap scan — discover Odoo 17 docs URLs

**Files:**
- Create: `docs/modules/.url-index.json` (agent output)

- [ ] **Step 1: Spawn sitemap agent**

Launch one general-purpose agent with this prompt:

```
Scrape https://www.odoo.com/documentation/17.0/ to build a module → docs URL map.

Steps:
1. Fetch the Odoo 17 docs index page
2. Find all links to module documentation pages (Applications section)
3. For each of these 45 FusionAI modules, find the best-matching Odoo 17 docs URL:
   crm, sales, purchases, inventory, accounting, invoicing, subscriptions, expenses,
   hr, payroll, attendance, leaves, appraisals, manufacturing, plm, quality, supply-chain,
   helpdesk, field-service, project, timesheets, discuss, calendar, notes, email-marketing,
   website, ecommerce, sign, marketing, knowledge, documents, spreadsheet, studio,
   fleet, maintenance, rental, planning, recruitment, events, surveys, social-marketing

4. Write the result to docs/modules/.url-index.json as:
   { "crm": "https://...", "sales": "https://...", ... }

Use firecrawl or WebFetch to scrape. If a module has no exact Odoo equivalent, use the
closest match or the apps index URL as fallback.
```

- [ ] **Step 2: Verify output exists**

```bash
cat docs/modules/.url-index.json | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'{len(d)} modules indexed')"
```
Expected: `45 modules indexed` (or close — some modules may be combined in Odoo docs).

- [ ] **Step 3: Commit**

```bash
git add docs/modules/.url-index.json
git commit -m "docs: Odoo 17 docs URL index — 45 modules mapped"
```

---

### Task 16–25: 10 parallel module research agents

Run all 10 agents **simultaneously**. Each writes 4–5 spec files to `docs/modules/`.

**Template reminder** — every spec must contain:
```markdown
# <Module> — Gap Analysis
**Odoo 17 docs:** <url>
**FusionAI status:** Stub | Partial | Functional | Complete
**Effort to complete:** S | M | L | XL
**Business priority:** P1 | P2 | P3

## Odoo 17 Feature Checklist
### Core Features
- [ ] Feature — ✅ Done | 🟡 Partial | ❌ Missing
### Views / UI
### Role & Permission Settings
### Module Configuration
### Integrations (Calendar, Mail, Automation, Claude AI)
### API Endpoints
### Missing Features Summary
### Recommended Build Order
```

**Agent 1 prompt (crm, sales, purchases, inventory):**
```
Research the Odoo 17 feature set for: CRM, Sales, Purchases, Inventory.

For each module:
1. Fetch the Odoo 17 docs page from docs/modules/.url-index.json
2. Read the current FusionAI code:
   - frontend/src/modules/<module>/  (all .tsx files)
   - api/src/routes/<module>.ts
3. Produce docs/modules/<module>-spec.md following the exact template in
   docs/superpowers/specs/2026-05-08-module-research-design.md

Be thorough on:
- Every Odoo 17 feature (pipeline stages, activities, smart buttons, filters, group-by)
- All roles Odoo defines for this module (e.g. CRM: Salesperson, Sales Manager)
- All settings that appear in Odoo Settings > CRM
- Integrations: what syncs to Calendar, what shows in Discuss chatter, what automations exist
- Claude AI suggestions: what AI actions would be most useful in this module
- Complete API endpoint list vs what exists in api/src/routes/

Write all 4 spec files then commit:
git add docs/modules/crm-spec.md docs/modules/sales-spec.md docs/modules/purchases-spec.md docs/modules/inventory-spec.md
git commit -m "docs: gap analysis — CRM, Sales, Purchases, Inventory"
```

**Agent 2 prompt (accounting, invoicing, subscriptions, expenses):**
```
Research Odoo 17 features for: Accounting, Invoicing, Subscriptions, Expenses.
Follow identical instructions to Agent 1 but for these 4 modules.
Note: Invoicing in Odoo 17 is a simplified version of Accounting — document both.
Commit: git commit -m "docs: gap analysis — Accounting, Invoicing, Subscriptions, Expenses"
```

**Agent 3 prompt (hr, payroll, attendance, leaves, appraisals):**
```
Research Odoo 17 features for: HR (Employees), Payroll, Attendance, Time Off (Leaves), Appraisals.
Follow identical instructions. Note Odoo calls HR module "Employees" — map accordingly.
Commit: git commit -m "docs: gap analysis — HR, Payroll, Attendance, Leaves, Appraisals"
```

**Agent 4 prompt (manufacturing, plm, quality, supply-chain):**
```
Research Odoo 17 features for: Manufacturing, PLM (Product Lifecycle Management), Quality, Supply Chain (Replenishment).
Follow identical instructions.
Commit: git commit -m "docs: gap analysis — Manufacturing, PLM, Quality, Supply Chain"
```

**Agent 5 prompt (helpdesk, field-service, project, timesheets):**
```
Research Odoo 17 features for: Helpdesk, Field Service, Project, Timesheets.
Follow identical instructions.
Commit: git commit -m "docs: gap analysis — Helpdesk, Field Service, Project, Timesheets"
```

**Agent 6 prompt (discuss, calendar, notes, email-marketing):**
```
Research Odoo 17 features for: Discuss (messaging/chatter), Calendar, Notes, Email Marketing.
Follow identical instructions.
Commit: git commit -m "docs: gap analysis — Discuss, Calendar, Notes, Email Marketing"
```

**Agent 7 prompt (website, ecommerce, sign, marketing):**
```
Research Odoo 17 features for: Website Builder, eCommerce, Sign (e-signatures), SMS Marketing / Marketing Automation.
Follow identical instructions.
Commit: git commit -m "docs: gap analysis — Website, eCommerce, Sign, Marketing"
```

**Agent 8 prompt (knowledge, documents, spreadsheet, studio):**
```
Research Odoo 17 features for: Knowledge (wiki), Documents (DMS), Spreadsheet, Studio (no-code customisation).
Follow identical instructions.
Commit: git commit -m "docs: gap analysis — Knowledge, Documents, Spreadsheet, Studio"
```

**Agent 9 prompt (fleet, maintenance, rental, planning):**
```
Research Odoo 17 features for: Fleet, Maintenance, Rental, Planning (resource scheduling).
Follow identical instructions.
Commit: git commit -m "docs: gap analysis — Fleet, Maintenance, Rental, Planning"
```

**Agent 10 prompt (recruitment, events, surveys, social-marketing):**
```
Research Odoo 17 features for: Recruitment, Events, Surveys, Social Marketing.
Follow identical instructions.
Commit: git commit -m "docs: gap analysis — Recruitment, Events, Surveys, Social Marketing"
```

- [ ] **Step 1: Verify all 45 spec files exist after agents complete**

```bash
ls docs/modules/*-spec.md | wc -l
```
Expected: `45`.

- [ ] **Step 2: Spot-check one spec has all required sections**

```bash
grep -c "Odoo 17 Feature Checklist\|Role & Permission\|Module Configuration\|Integrations\|API Endpoints\|Missing Features\|Recommended Build" docs/modules/crm-spec.md
```
Expected: `7`.

---

### Task 26: Master rollup — prioritised build backlog

**Files:**
- Create: `docs/modules/00-master-gap-summary.md`

- [ ] **Step 1: Spawn rollup agent**

```
Read all 45 files in docs/modules/*-spec.md.

Produce docs/modules/00-master-gap-summary.md with:

## Overview
- Total modules: 45
- Status breakdown: X Complete, X Functional, X Partial, X Stub
- Total estimated effort: sum of all effort tiers

## P1 — Revenue Critical (must ship for production)
For each P1 module: | Module | Status | Effort | Top 3 missing features |

## P2 — Operational (needed for full ERP)
Same table format.

## P3 — Nice to Have
Same table format.

## Shared Infrastructure Gaps
List cross-cutting missing pieces found across many modules:
- Module settings system
- Role-per-module RBAC
- Calendar sync
- Mail/chatter integration
- Automation rules engine
- Claude AI integration framework

## Recommended Sprint Order
Sprint 1: [list modules]
Sprint 2: [list modules]
... (group by effort + priority)

Sort P1 modules by effort ascending (quick wins first).
```

- [ ] **Step 2: Verify output**

```bash
grep -c "^##" docs/modules/00-master-gap-summary.md
```
Expected: ≥ 5 (sections present).

- [ ] **Step 3: Commit**

```bash
git add docs/modules/
git commit -m "docs: 00-master-gap-summary — prioritised build backlog for all 45 modules"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered by task |
|---|---|
| tokens.css + tokens.ts | Task 1 |
| All 17 shared components | Tasks 2–12 |
| AppShell (TopBar + SubNav) | Tasks 11, 12, 13 |
| Font loading (Space Grotesk + Inter) | Task 1 step 3 |
| Remove old purple theme | Task 14 |
| Sitemap scan agent | Task 15 |
| 10 parallel research agents | Tasks 16–25 |
| Master rollup | Task 26 |
| No light mode | Task 14 |
| `docs/modules/` output files | Tasks 15–26 |
| Per-module Settings/Roles/Automations sub-nav | AppShell DEFAULT_SUBNAV in Task 13 |

All spec requirements are covered. ✓

**Type consistency check:**
- `SubNavSection` and `SubNavItem` defined in `SubNav.tsx`, exported from barrel, imported in `AppShell.tsx` ✓
- `AppNavItem` defined in `TopBar.tsx`, exported from barrel, used in `AppShell.tsx` ✓
- `Column<T>` generic in `DataTable.tsx` exported from barrel ✓
- `Tab` interface in `TabBar.tsx` exported ✓
- `ActivityEvent` in `ActivityFeed.tsx` exported ✓

**Placeholder scan:** No TBD, TODO, or "similar to" references found. ✓
