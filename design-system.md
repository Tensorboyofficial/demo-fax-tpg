# Cevi Design System — End-to-End Reference

> Version 1.0 · Source of truth for any Cevi-branded product (main platform + sister projects)
>
> This document is **portable**. Copy it verbatim into a new project's `docs/` folder and the
> Quick Start section gets you to pixel-parity with the Cevi dashboard in ~20 minutes.

---

## Contents

1. [Quick Start for a new project](#1-quick-start-for-a-new-project)
2. [Brand essence](#2-brand-essence)
3. [Color system](#3-color-system)
4. [Typography](#4-typography)
5. [Spacing, radius, shadows](#5-spacing-radius-shadows)
6. [Motion](#6-motion)
7. [Iconography](#7-iconography)
8. [Core components](#8-core-components)
9. [Layout patterns](#9-layout-patterns)
10. [Responsive rules](#10-responsive-rules)
11. [Accessibility](#11-accessibility)
12. [Drop-in setup: Next.js 16 + Tailwind v4](#12-drop-in-setup-nextjs-16--tailwind-v4)
13. [Drift log (cevi.ai main vs. this spec)](#13-drift-log-ceviai-main-vs-this-spec)
14. [Two decisions for the new project](#14-two-decisions-for-the-new-project)

---

## 1. Quick Start for a new project

1. **Dependencies** (Next.js 16 + React 19 + Tailwind v4):

   ```bash
   pnpm add next@^16 react@^19 react-dom@^19
   pnpm add tailwindcss@^4 @tailwindcss/postcss
   pnpm add @radix-ui/react-dropdown-menu @radix-ui/react-dialog
   pnpm add lucide-react clsx tailwind-merge
   # Fonts: DM Sans + EB Garamond are on Google Fonts (free). See §4.
   ```

2. **Copy three files** verbatim (all in §12 below):
   - `src/app/globals.css` — design tokens + base resets
   - `src/lib/utils.ts` — the `cn()` helper
   - `src/components/ui/*.tsx` — starter Button/Card/Badge

3. **Wire fonts in `src/app/layout.tsx`** — §4 has the exact import block.

4. **Verify**: create a page with `<Button variant="primary">Request demo</Button>` — terracotta button with DM Sans label at 14px.

---

## 2. Brand essence

Cevi is an AI operations layer for healthcare practices — voice / chat agents answering calls, verifying insurance, scheduling. The buyer is a clinic owner or operations lead, often non-technical, who has been burned by "feels like a prototype" vendors.

**The aesthetic has to land three beats:**

| Beat | What that means in the UI |
|---|---|
| **Trustworthy** | Warm neutral palette (not the cold blue-gray of every healthcare SaaS). Terracotta accent used sparingly. Typography that signals editorial care, not startup haste. |
| **Operationally serious** | Dense information architecture. 13px base body in the dashboard. Tables over cards when data is the point. No marketing fluff inside the product. |
| **Clinically safe** | WCAG AA contrast minimum everywhere. Never log or surface PHI in a way that leaks through screenshots. Error states are calm, not red-alert. |

**Anti-patterns** (reject on sight):
- Generic "AI product" purple gradients. Cevi is warm, not synthetic.
- Playful / illustrated healthcare (pill mascots, smiling doctors). Cevi is for operators, not patients.
- Dense "pro" gray dashboards with no typographic hierarchy. Cevi uses editorial serif + sans pairing to signal care.

---

## 3. Color system

### 3.1 Accent (Terracotta)

Terracotta is Cevi's single brand accent. Used for **primary CTAs, active states, brand moments, focus rings, link underlines on hover**. Never as a body-text color. Never more than one accent pop per screen region.

| Token | Value | Use |
|---|---|---|
| `--cevi-accent` | `#E35336` | Primary CTA, active tab, logo, focus ring base |
| `--cevi-accent-hover` | `#D04A2E` | Accent:hover, active:pressed |
| `--cevi-accent-light` | `#FEF7F5` | Subtle backgrounds (active row, selected checkbox, info card tint) |
| `--cevi-accent-bg` | `#FDF5EC` | Warm backdrop for icon boxes, onboarding cards, TOC |

### 3.2 Text scale

Four steps, each with explicit WCAG AA contrast pass on `#FFFFFF`.

| Token | Value | Contrast | Use |
|---|---|---|---|
| `--cevi-text` | `#1a1a1a` | 16.5:1 (AAA) | Headings, primary body copy |
| `--cevi-text-secondary` | `#333333` | 12.6:1 (AAA) | Supporting body copy |
| `--cevi-text-tertiary` | `#555555` | 7.4:1 (AAA) | Secondary labels, table headers |
| `--cevi-text-muted` | `#77736D` | 4.6:1 (AA) | Hints, placeholders, card subtitles |
| `--cevi-text-faint` | `#9A9A96` | 3.0:1 (sub-AA) | Disabled-only. **Never** for readable text. |

### 3.3 Surfaces & borders

| Token | Value | Use |
|---|---|---|
| `--cevi-bg` | `#FFFFFF` | App background, card background |
| `--cevi-surface` | `#F6F4F2` | Sidebar, subtle panels, skeleton bars |
| `--cevi-surface-warm` | `#FAFAF8` | Row hover, subtle elevation |
| `--cevi-border` | `#E3E2DE` | All card / table / input borders |
| `--cevi-border-light` | `#EDECEA` | Dividers inside cards, list separators |
| `--cevi-link-underline` | `#C0BFBA` | Inline link underlines (1px) |

### 3.4 Success / Error

Error deliberately reuses the accent — in healthcare ops, "error" often means "needs attention", not "danger". Keeps the palette tight.

| Token | Value | Use |
|---|---|---|
| `--cevi-success` | `#2D7A54` | Success text, confirm badge |
| `--cevi-success-light` | `#EDFAF3` | Success background, confirm badge bg |
| `--cevi-error` | `#E35336` (same as accent) | Error text |
| `--cevi-error-light` | `#FEF7F5` (same as accent-light) | Error background |

### 3.5 Desert Mirage — categorical palette

Five colors for categorizing non-status things: workflow types, integration categories, service types. **Not for status** (use Success/Error above).

| Token | Value | Light pair | Typical use |
|---|---|---|---|
| `--cevi-coral` | `#F4845F` | `#FEF0EC` | Scheduling, appointments |
| `--cevi-amber` | `#F7B267` | `#FEF4E6` | Warnings (non-critical), pending |
| `--cevi-jade` | `#7EC4A5` | `#EDFAF3` | Success, "active" integrations |
| `--cevi-sand` | `#D4A574` | `#FDF5EC` | Documents, neutral categories |
| `--cevi-teal` | `#6CB4C4` | `#EFF8FA` | Integrations, external systems |

**Rule**: a single screen should use at most **3 of these 5**. Pick whichever 3 best differentiate your categories. Never assign meaning arbitrarily — same color should mean the same thing across pages.

---

## 4. Typography

### 4.1 Font families

| Role | Family | Why | Where to get it |
|---|---|---|---|
| **Body** | **DM Sans** | Humanist sans with excellent dashboard legibility at 13-15px. Generous x-height. | Google Fonts (free) |
| **Headings (editorial)** | **EB Garamond** | Calm serif, editorial. Signals "considered product", not "startup MVP". Excellent at 20-36px. | Google Fonts (free) |
| **Logo** | **EB Garamond** (single-word "cevi") | Same as headings — keeps wordmark consistent with brand voice. | Google Fonts (free) |
| **Mono** | `'SF Mono', ui-monospace, monospace` | System mono for code blocks, CPT codes, IDs. | System |

> **Alternate for premium builds**: the cevi-design-system.html v1.0 spec calls for **Reckless Standard M Trial** for headings — a paid editorial serif from Displaay. If you have a license, swap `--font-heading` to Reckless. EB Garamond is the free, visually-adjacent substitute this doc standardizes on.

### 4.2 Next.js font loading

```tsx
// src/app/layout.tsx
import { DM_Sans, EB_Garamond } from "next/font/google";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-eb-garamond",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${ebGaramond.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

### 4.3 Type scale

| Step | Family | Size | Weight | Line-height | Letter-spacing | Use |
|---|---|---|---|---|---|---|
| **Display** | Heading | 36px | 400 | 1.2 | -0.02em | Marketing hero, investor pitch |
| **H1** | Heading | 28px | 400 | 1.2 | -0.02em | Page title (marketing) |
| **H2** | Body | 20px | 600 | 1.3 | 0 | Section title (app + marketing) |
| **H3** | Body | 16px | 600 | 1.4 | 0 | Sub-section, card title |
| **Body** | Body | 15px | 400 | 1.6 | 0 | Marketing body paragraphs |
| **Body-dense** | Body | 13px | 400 | 1.5 | -0.01em | **Dashboard default.** Product surfaces. |
| **Label** | Body | 15px | 500 | 1.4 | 0 | Form labels (marketing) |
| **Label-dense** | Body | 12px | 500 | 1.4 | 0 | Form labels (dashboard) |
| **Caption** | Body | 13px | 400 | 1.5 | 0 | Hints, captions, muted copy |
| **Overline** | Body | 11px | 600 | 1.2 | +0.08em (uppercase) | Section heads, badges, table headers |
| **Logo** | Logo (EB Garamond) | 28px | 400 | 1.0 | -0.02em | "cevi" wordmark |

### 4.4 Typography rules

- **Headings use the serif** (EB Garamond). Never bold-weight a sans to fake a heading.
- **Body copy uses DM Sans.** Never ALL-CAPS body text (reserve caps for overlines only).
- **-0.01em tracking on dense dashboard text** — compensates for 13px legibility.
- **Line-height 1.6 for marketing body**, 1.5 for dashboard body. Denser = tighter.
- **One display-size element per viewport.** The display (36px) or H1 (28px) is a hierarchy anchor, not decoration.

---

## 5. Spacing, radius, shadows

### 5.1 Spacing scale (rhythm)

7 steps. Use these exclusively; never arbitrary pixel values in gaps / padding.

```css
--space-xs:  4px;   /* icon → label inside a pill */
--space-sm:  8px;   /* between sibling tags / inline icons */
--space-md:  16px;  /* card internal padding unit */
--space-lg:  24px;  /* section gutter inside a card */
--space-xl:  32px;  /* page-edge padding on desktop */
--space-2xl: 48px;  /* between major sections */
--space-3xl: 64px;  /* between page chapters (marketing) */
```

### 5.2 Radius

5 steps. Never arbitrary radii.

```css
--radius-sm:   4px;    /* inline pills, tiny tags */
--radius-md:   8px;    /* default — buttons, cards, inputs */
--radius-lg:   12px;   /* modals, large cards */
--radius-xl:   16px;   /* hero cards, feature highlights */
--radius-full: 9999px; /* badges, status pills, avatars */
```

### 5.3 Shadows (sparingly)

3 steps. The product is mostly flat with `1px #E3E2DE` borders — shadows are reserved for floating surfaces.

```css
--shadow-sm:    0 1px 3px rgba(0,0,0,0.04);         /* hover lift (barely) */
--shadow-md:    0 4px 12px rgba(0,0,0,0.06);        /* dropdown, popover */
--shadow-lg:    0 8px 32px rgba(0,0,0,0.08);        /* modal, dialog */
--shadow-focus: 0 0 0 3px rgba(227,83,54,0.08);     /* focus ring (accent) */
```

---

## 6. Motion

**Principle: motion clarifies state changes, never decorates.**

| Interaction | Duration | Easing | Property |
|---|---|---|---|
| Hover state (color, border) | 100ms | `ease-out` | color, background-color, border-color |
| Focus ring appear | 150ms | `ease-out` | box-shadow |
| Dropdown / popover open | 150ms | `cubic-bezier(0.16, 1, 0.3, 1)` | opacity, transform (scale 0.95 → 1) |
| Modal open | 200ms | `cubic-bezier(0.16, 1, 0.3, 1)` | opacity, transform (translateY 4px → 0) |
| Progress bar fill | 500ms | `cubic-bezier(0.22, 1, 0.36, 1)` | width |
| Page transition | **none** (hard cut) | — | — |

**Rules:**
- Animate `transform`, `opacity`, `box-shadow`, `background-color`, `border-color`, `color` only. Never `width` / `height` / `top` / `left`.
- Respect `prefers-reduced-motion: reduce` — drop all transitions to ~0.01ms. The `globals.css` template in §12 handles this.
- No bounce / overshoot. No spring physics. Healthcare buyers read those as "unserious".

---

## 7. Iconography

- **Library**: **Lucide** (`lucide-react`). Nothing else. Never mix icon sets.
- **Stroke width**: Lucide default (`1.5` → `strokeWidth={1.5}`). Uniform across the product.
- **Sizes**: Use Tailwind size classes corresponding to the text size next to the icon.

| Context | Icon size | Class |
|---|---|---|
| Inline in 13px text | 12-14px | `h-3 w-3` or `h-3.5 w-3.5` |
| Inline in 15-16px text | 16px | `h-4 w-4` |
| Section headers | 18-20px | `h-4.5 w-4.5` or `h-5 w-5` |
| Empty-state illustration | 32-48px | `h-8 w-8` or `h-12 w-12` |

**Icon-box pattern** (decorative container for a category icon):

```tsx
<div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[var(--cevi-accent-bg)]">
  <ShieldCheck className="h-5 w-5 text-[var(--cevi-accent)]" />
</div>
```

Icon-box background choices:
- Warm: `bg-[var(--cevi-accent-bg)]` + accent-colored icon
- Cool: `bg-[#EFF8FA]` + `text-[var(--cevi-teal)]`
- Success: `bg-[var(--cevi-success-light)]` + `text-[var(--cevi-success)]`

---

## 8. Core components

All components follow four rules:

1. Ref-forwarding (`React.forwardRef`) for composability.
2. Props typed as named `interface`, no `any`.
3. Classes composed via `cn(...)` — variants first, overrides last.
4. States covered: default, hover, active, disabled, focus-visible, loading (where async), error (where input).

### 8.1 Button

**5 variants × 3 sizes**.

| Variant | Visual | Use |
|---|---|---|
| `primary` | Terracotta fill, white text | Main CTA per screen. Max **one primary per viewport** in most cases. |
| `secondary` | White fill, 1px border, dark text | Secondary action next to primary |
| `ghost` | No fill, muted text | Tertiary (e.g. "← Back"), toolbar buttons |
| `outline` | Transparent, 1px border, text goes accent on hover | Alt secondary used on light surface inside a card |
| `danger` | Soft red tint, red text | Destructive confirm (Delete, Clear All) |

| Size | Height | Padding X | Text |
|---|---|---|---|
| `sm` | 32px | 12px | 12px |
| `md` (default) | 36px | 16px | 14px |
| `lg` | 44px | 24px | 14px |

**States**:
- `disabled` / `loading`: `opacity: 0.5`, `pointer-events: none`, spinner replaces left icon
- `focus-visible`: `ring-2 ring-[var(--cevi-accent)]/30`, no outline

**Code**: see §12.

### 8.2 Card

Base surface primitive — flat, 1px border, 8px radius.

| Prop | Values | Default | Effect |
|---|---|---|---|
| `padding` | `none` / `sm` (12px) / `md` (20px) / `lg` (28px) | `md` | Internal padding |
| `hover` | `boolean` | `false` | On hover: border → accent, bg → accent-light, translateY -1px |

**Subcomponents**: `Card` + `CardHeader` + `CardContent` + `CardFooter`. Header and Footer have `py-4 px-5` and `border-{top|bottom}` using `--cevi-border-light` (lighter than main border — the internal division should feel softer than the card's outer edge).

**Rule**: Do **not** stack shadows on cards. Depth is signaled by border + hover state, not shadow.

### 8.3 Badge

Pill-shaped, uppercase, 4% letter-spacing.

**14 variants** covering status (critical, high, normal, low, success, pending, warning, info) and Desert Mirage (coral, teal, jade, sand, gold) + `default` (neutral).

**Sizes**: `sm` (10px text, 2px × 8px padding) and `md` (12px text, 2px × 10px padding).

**Optional `dot`**: adds a 6px filled circle on the left. Add `pulse` for live-alert contexts (crisis events).

### 8.4 Input / Textarea

```tsx
<input
  className="w-full h-9 rounded-lg border border-[var(--cevi-border)] bg-white px-3 text-[13px] text-[var(--cevi-text)] placeholder:text-[var(--cevi-text-faint)] focus:outline-none focus:border-[var(--cevi-text)] focus:ring-2 focus:ring-[var(--cevi-accent)]/20 transition-colors"
/>
```

- **Default border**: `--cevi-border`
- **Focus border**: `--cevi-text` (near-black — stronger than accent, keeps focus noticeable without being loud)
- **Focus ring**: accent at 20% alpha, 2px
- **Error state**: border → `red-500`, helper text → `red-600`, icon slot on right with `AlertCircle`
- **Placeholder**: `--cevi-text-faint`, always italicized off (upright)

### 8.5 Select / Dropdown

Use **Radix `DropdownMenu`** — not native `<select>`. The ~30 available components already include `components/ui/dropdown.tsx` wrapping Radix. Pattern:

```tsx
<DropdownMenu>
  <DropdownTrigger asChild>
    <button className="h-9 px-3 rounded-lg border border-[var(--cevi-border)] bg-white text-[13px] text-[var(--cevi-text-secondary)] hover:border-[var(--cevi-text-muted)] hover:text-[var(--cevi-text)] inline-flex items-center gap-1.5">
      {currentLabel}
      <ChevronDown className="h-3 w-3" />
    </button>
  </DropdownTrigger>
  <DropdownContent align="start" className="min-w-[160px]">
    {options.map((o) => (
      <DropdownItem key={o.value} onSelect={() => setValue(o.value)}>
        {o.label}
      </DropdownItem>
    ))}
  </DropdownContent>
</DropdownMenu>
```

Radix handles keyboard nav (arrows, Enter, Escape) natively.

### 8.6 Table

Dense data table (dashboard pattern):

```tsx
<table className="w-full">
  <thead>
    <tr className="bg-[var(--cevi-surface-warm)] text-left text-[11px] font-semibold text-[var(--cevi-text-tertiary)] uppercase tracking-[0.04em]">
      <th className="px-4 py-3">Column</th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b border-[var(--cevi-border-light)] hover:bg-[var(--cevi-surface-warm)]">
      <td className="px-4 py-3 text-[13px]">Cell</td>
    </tr>
  </tbody>
</table>
```

- Headers: 11px overline style (uppercase, 600, muted).
- Rows: 13px body, `border-b` with the LIGHT border token, hover → `surface-warm`.
- **Never zebra stripes.** Alternating row colors fight the card border + hover pattern.
- **Mobile**: at `< 640px`, either `overflow-x-auto` on the wrapper OR swap to stacked `Card` list — don't let the table squish and break.

### 8.7 Modal / Dialog

Radix `Dialog`. Overlay `rgba(0,0,0,0.4)` + content card (`bg-white`, `rounded-xl`, `shadow-lg`, `p-6`, `max-w-lg`, centered). Close button top-right (`X` from Lucide, ghost button).

- Escape closes
- Click outside closes (unless `modal` prop explicitly blocks it)
- Focus trapped inside while open
- Focus returns to trigger element on close

### 8.8 Empty state

Every list / table MUST have one. Pattern:

```tsx
<div className="py-12 text-center">
  <Calendar className="h-8 w-8 text-[var(--cevi-text-faint)] mx-auto mb-3" />
  <p className="text-[14px] text-[var(--cevi-text-muted)] mb-4">No appointments yet</p>
  <Button variant="primary" size="sm">Create an appointment</Button>
</div>
```

- **Icon, message, call-to-action.** In that order. All three required.
- Never ship a blank `<tbody>` or blank `<div>`.

### 8.9 Skeleton loader

For any data fetch > 200ms. Match the shape and rough dimensions of what's loading.

```tsx
<div className="h-4 w-48 bg-[var(--cevi-border-light)] rounded animate-pulse" />
```

Use `--cevi-border-light` (#EDECEA) as the skeleton fill. Not neutral gray, not white — it matches the card's internal division color.

### 8.10 Stat card

Dashboard KPI card (Patients, Calls today, etc.).

```tsx
<Card padding="md">
  <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-text-tertiary)]">
    Patients today
  </div>
  <div className="mt-2 font-[EB_Garamond,serif] text-[36px] leading-none text-[var(--cevi-text)]">
    {count}
  </div>
  <div className="mt-1 text-[12px] text-[var(--cevi-text-muted)]">
    +{delta} vs yesterday
  </div>
</Card>
```

The big number uses **the heading serif**. This is the single clearest place the editorial-dashboard blend shows up.

### 8.11 Toast (notification)

- Position: bottom-right, `24px` from edges.
- Width: `320px` min, `420px` max.
- Duration: 4s for success, 6s for error, sticky for destructive-with-undo.
- Icon + message + optional action button.
- Success: `success-light` bg + `success` text. Error: `accent-light` bg + `accent` text.

---

## 9. Layout patterns

### 9.1 Dashboard shell (primary app layout)

```
┌─────────────────────────────────────────────────────┐
│ Top bar (64px) — org switcher · search · user menu │
├────────┬────────────────────────────────────────────┤
│        │                                             │
│ Side   │   Page content                              │
│ nav    │   max-w-7xl (1280px)                        │
│        │   padding: 32px on desktop, 16px on mobile  │
│ 240px  │                                             │
│        │                                             │
└────────┴────────────────────────────────────────────┘
```

- **Sidebar** collapses to a hamburger + bottom sheet below `md:` (768px).
- **Top bar** stays, but org switcher collapses into the user menu on mobile.
- **Max content width** `max-w-7xl` (1280px). Full-bleed only for data tables.

### 9.2 Page header (standard pattern)

```tsx
<div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
  <div>
    <h1 className="font-[EB_Garamond,serif] text-[28px] leading-[1.2] tracking-[-0.02em] text-[var(--cevi-text)]">
      Appointments
    </h1>
    <p className="mt-1 text-[13px] text-[var(--cevi-text-muted)]">
      {count} scheduled this week
    </p>
  </div>
  <div className="flex items-center gap-2">
    <Button variant="secondary">Export</Button>
    <Button variant="primary">New appointment</Button>
  </div>
</div>
```

- Serif H1 + sans body subtitle is the signature. Don't swap to sans-sans.

---

## 10. Responsive rules

| Breakpoint | Min width | Tailwind prefix | Primary use |
|---|---|---|---|
| Mobile | 320px | (none) | Base styles — mobile-first |
| Small tablet | 640px | `sm:` | Tighter table layouts, 2-col cards |
| Tablet | 768px | `md:` | Sidebar appears, table full-width |
| Desktop | 1024px | `lg:` | 3-col dashboards, wider padding |
| Large desktop | 1280px | `xl:` | Max content width cap |
| XL desktop | 1536px | `2xl:` | Rarely used — let content center |

**Rules** (from CLAUDE.md, non-negotiable):
- Mobile-first. Base class is mobile. Add `md:` prefixes for tablet+.
- Touch targets ≥ **44×44px** on mobile. Buttons default to 36px tall — bump to `md` (44px) on mobile when a button is the primary action.
- Tables `overflow-x-auto` OR switch to a card list layout below `md:`.
- Sidebars collapse to bottom sheets or hamburger on mobile. No off-screen content.
- Test mentally at **iPhone SE width (375px)**. If it overflows, you're done wrong.

---

## 11. Accessibility

### 11.1 Contrast

- Body text: ≥ 4.5:1 (WCAG AA). Our tokens `--cevi-text` through `--cevi-text-muted` all pass.
- Large text (>18px or >14px bold): ≥ 3:1. Tokens up to `--cevi-text-faint` pass, but **faint is disabled-only**.
- Focus indicators: the 3px `--shadow-focus` ring passes WCAG 2.2's focus-appearance guideline.

### 11.2 Keyboard

- **Every interactive element reachable via Tab.** Order = visual reading order.
- **Focus-visible only.** `:focus-visible { ring-2 ring-accent/30 }`. No `:focus { outline: none }` without a replacement ring.
- **Dropdowns**: arrow keys navigate, Enter selects, Escape closes — Radix handles this.
- **Modals**: focus trapped inside, Escape closes, focus returns to trigger.

### 11.3 Screen readers

- Semantic HTML first (`<button>`, `<nav>`, `<main>`, `<h1-h6>`). ARIA is the second choice.
- Icon-only buttons: `aria-label`. E.g. `<button aria-label="Close">×</button>`.
- Loading states: `aria-busy="true"` on the container.
- Toasts: `role="status"` for info/success, `role="alert"` for errors.

### 11.4 Motion-reduce

The `globals.css` template includes the `prefers-reduced-motion: reduce` block. Motion drops to near-zero. Critical for vestibular disorders + clinical users who want a calm UI.

---

## 12. Drop-in setup: Next.js 16 + Tailwind v4

### 12.1 `src/app/globals.css`

```css
@import "tailwindcss";

:root {
  /* ── Brand ── */
  --cevi-accent: #E35336;
  --cevi-accent-hover: #D04A2E;
  --cevi-accent-light: #FEF7F5;
  --cevi-accent-bg: #FDF5EC;

  /* ── Text ── */
  --cevi-text: #1a1a1a;
  --cevi-text-secondary: #333333;
  --cevi-text-tertiary: #555555;
  --cevi-text-muted: #77736D;
  --cevi-text-faint: #9A9A96;

  /* ── Surfaces & borders ── */
  --cevi-bg: #FFFFFF;
  --cevi-surface: #F6F4F2;
  --cevi-surface-warm: #FAFAF8;
  --cevi-border: #E3E2DE;
  --cevi-border-light: #EDECEA;
  --cevi-link-underline: #C0BFBA;

  /* ── Success / Error ── */
  --cevi-success: #2D7A54;
  --cevi-success-light: #EDFAF3;
  --cevi-error: #E35336;
  --cevi-error-light: #FEF7F5;

  /* ── Desert Mirage (categorical) ── */
  --cevi-coral: #F4845F;
  --cevi-coral-light: #FEF0EC;
  --cevi-amber: #F7B267;
  --cevi-amber-light: #FEF4E6;
  --cevi-jade: #7EC4A5;
  --cevi-jade-light: #EDFAF3;
  --cevi-sand: #D4A574;
  --cevi-sand-light: #FDF5EC;
  --cevi-teal: #6CB4C4;
  --cevi-teal-light: #EFF8FA;

  /* ── Spacing ── */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;

  /* ── Radius ── */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* ── Shadows ── */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.06);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.08);
  --shadow-focus: 0 0 0 3px rgba(227,83,54,0.08);
}

@theme inline {
  --color-background: var(--cevi-bg);
  --color-foreground: var(--cevi-text);
  --font-sans: var(--font-dm-sans), -apple-system, system-ui, sans-serif;
  --font-serif: var(--font-eb-garamond), Georgia, serif;
  --font-mono: 'SF Mono', ui-monospace, monospace;
}

html { scroll-behavior: smooth; }

body {
  background: var(--cevi-bg);
  color: var(--cevi-text);
  font-family: var(--font-dm-sans), -apple-system, system-ui, sans-serif;
  font-size: 13px;
  line-height: 1.5;
  letter-spacing: -0.01em;
  -webkit-font-smoothing: antialiased;
}

*:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus);
  border-radius: var(--radius-md);
}

input:focus-visible,
textarea:focus-visible,
select:focus-visible {
  border-color: var(--cevi-text) !important;
  outline: none;
}

button, a, input, select, textarea {
  transition-property: color, background-color, border-color, box-shadow, opacity;
  transition-duration: 100ms;
  transition-timing-function: ease-out;
}

.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
.scrollbar-hide::-webkit-scrollbar { display: none; }

.scrollbar-thin { scrollbar-width: thin; scrollbar-color: #E5E5E5 transparent; }
.scrollbar-thin::-webkit-scrollbar { width: 4px; }
.scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
.scrollbar-thin::-webkit-scrollbar-thumb { background: #E5E5E5; border-radius: 9999px; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 12.2 `src/lib/utils.ts` — the `cn()` helper

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

### 12.3 `src/components/ui/button.tsx` — starter

```tsx
"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

const variants = {
  primary:
    "bg-[var(--cevi-accent)] text-white hover:bg-[var(--cevi-accent-hover)]",
  secondary:
    "bg-white border border-[var(--cevi-border)] text-[var(--cevi-text)] hover:border-[var(--cevi-text-muted)]",
  ghost:
    "bg-transparent text-[var(--cevi-text-muted)] hover:bg-[var(--cevi-surface)] hover:text-[var(--cevi-text)]",
  outline:
    "bg-transparent border border-[var(--cevi-border)] text-[var(--cevi-text-secondary)] hover:border-[var(--cevi-accent)] hover:text-[var(--cevi-accent)]",
  danger:
    "bg-[var(--cevi-error-light)] border border-[var(--cevi-error)]/20 text-[var(--cevi-error)] hover:bg-[var(--cevi-error)]/10",
} as const;

const sizes = {
  sm: "px-3 py-1.5 text-xs h-8",
  md: "px-4 py-2 text-sm h-9",
  lg: "px-6 py-3 text-sm h-11",
} as const;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, icon, iconRight, fullWidth, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cevi-accent)]/30 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon ? <span className="shrink-0">{icon}</span> : null}
      {children}
      {iconRight && <span className="shrink-0">{iconRight}</span>}
    </button>
  ),
);
Button.displayName = "Button";
```

### 12.4 `src/components/ui/card.tsx` — starter

```tsx
"use client";

import { cn } from "@/lib/utils";

const paddingStyles = { none: "", sm: "p-3", md: "p-5", lg: "p-7" } as const;

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: keyof typeof paddingStyles;
}

export function Card({ children, className, hover, padding = "md" }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg bg-white border border-[var(--cevi-border)]",
        paddingStyles[padding],
        hover && "transition-all duration-150 hover:border-[var(--cevi-accent)] hover:bg-[var(--cevi-accent-light)] hover:-translate-y-px",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("px-5 py-4 border-b border-[var(--cevi-border-light)]", className)}>{children}</div>;
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("px-5 py-4 border-t border-[var(--cevi-border-light)]", className)}>{children}</div>;
}
```

### 12.5 `src/components/ui/badge.tsx` — starter

```tsx
"use client";

import { cn } from "@/lib/utils";

const variants = {
  default:  "bg-[var(--cevi-surface)] text-[var(--cevi-text-secondary)]",
  coral:    "bg-[var(--cevi-coral-light)] text-[var(--cevi-coral)]",
  amber:    "bg-[var(--cevi-amber-light)] text-[var(--cevi-amber)]",
  jade:     "bg-[var(--cevi-jade-light)] text-[var(--cevi-jade)]",
  sand:     "bg-[var(--cevi-sand-light)] text-[var(--cevi-sand)]",
  teal:     "bg-[var(--cevi-teal-light)] text-[var(--cevi-teal)]",
  success:  "bg-[var(--cevi-success-light)] text-[var(--cevi-success)]",
  error:    "bg-[var(--cevi-error-light)] text-[var(--cevi-error)]",
} as const;

const dotColors = {
  default: "bg-[var(--cevi-text-muted)]",
  coral:   "bg-[var(--cevi-coral)]",
  amber:   "bg-[var(--cevi-amber)]",
  jade:    "bg-[var(--cevi-jade)]",
  sand:    "bg-[var(--cevi-sand)]",
  teal:    "bg-[var(--cevi-teal)]",
  success: "bg-[var(--cevi-success)]",
  error:   "bg-[var(--cevi-error)]",
} as const;

const sizes = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-0.5 text-xs",
} as const;

interface BadgeProps {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  dot?: boolean;
  pulse?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "default", size = "md", dot, pulse, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold uppercase tracking-[0.04em]",
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dotColors[variant], pulse && "animate-pulse")} />}
      {children}
    </span>
  );
}
```

---

## 13. Drift log (cevi.ai main vs. this spec)

Current `cevi.ai/dashboard/src/app/globals.css` has drifted from the v1.0 spec. For this new project you're building, **use the spec values above** — they're the intended system. For cevi.ai main, the drift is tracked:

| Token | Spec | cevi.ai main (before PR #8) | After PR #8 merges |
|---|---|---|---|
| `--cevi-text` (primary) | `#1a1a1a` | `#111111` | `#111111` (not touched) |
| `--cevi-text-secondary` | `#333333` | `#666666` | `#666666` (not touched) |
| `--cevi-text-tertiary` | `#555555` | `#999999` → `#6B7280` | `#6B7280` (still drifted) |
| `--cevi-text-muted` | `#77736D` | `#BBBBBB` → `#8E8E8E` | `#8E8E8E` (still drifted) |
| `--cevi-border` | `#E3E2DE` | `#EBEBEB` | `#EBEBEB` (not touched) |
| Desert Mirage palette | Defined as `:root` vars | Referenced via `var(--coral)` etc. but never declared → silent fallback | (still undefined) |
| `--shadow-*` | Defined | Not defined | (still not defined) |
| `--radius-*` | Defined | Not defined (inlined as `rounded-lg`) | (still not defined) |
| Heading font | Reckless Standard M Trial | DM Sans 600 | (unchanged) |

**Why the drift happened**: the HTML spec was written for marketing/brand pages, then the dashboard was built fast using simpler `#111` / `#666` / `#999` / `#EBEBEB` inline values. Nobody reconciled.

**Recommended fix for cevi.ai main** (separate future PR):
1. Adopt the spec tokens in `globals.css` verbatim.
2. Grep-replace the 647 hardcoded `text-[#999]` / `text-[#BBB]` / `#111` / `#666` / `#EBEBEB` usages with `text-[var(--cevi-text-*)]` / `border-[var(--cevi-border)]`.
3. Do this incrementally, one page at a time, each behind a PR.

**For the new project**: start clean with the spec. No drift to inherit.

---

## 14. Two decisions for the new project

Before you copy §12 verbatim, make two conscious calls:

### Decision 1 — Heading font

| Option | Cost | Vibe | When to pick |
|---|---|---|---|
| **EB Garamond** (this doc's default) | Free (Google Fonts) | Warm, editorial, literary | You want premium-feeling for free. Recommended for most cases. |
| **Reckless Standard M Trial** (v1.0 spec) | Paid license (Displaay) | Sharper editorial, more contemporary | You have marketing budget + want the intended spec match. |
| **DM Sans heading (no serif)** | Free | Modern, utilitarian, dashboard-forward | You explicitly want to drop the editorial feel. Not recommended for the Cevi aesthetic. |

### Decision 2 — Drift resolution

| Option | Cost | Benefit |
|---|---|---|
| **Start clean with spec tokens** (recommended) | 0 min | New project has a clean, documented design system. Matches the brand vision. |
| **Match cevi.ai live (`#111 / #666 / #999 / #BBB`)** | 0 min | Pixel-identical to cevi.ai today. But you inherit the drift + miss the intended aesthetic. |
| **Start clean AND fix cevi.ai main** | +4-8 hr on cevi.ai | Both products align. Best long-term. Do the cevi.ai cleanup as its own PR later. |

---

## Appendix — File manifest for the new project

Minimum viable file tree to reach pixel-parity:

```
src/
├── app/
│   ├── globals.css           ← copy §12.1 verbatim
│   └── layout.tsx            ← wire DM Sans + EB Garamond per §4.2
├── components/
│   └── ui/
│       ├── button.tsx        ← copy §12.3
│       ├── card.tsx          ← copy §12.4
│       ├── badge.tsx         ← copy §12.5
│       ├── input.tsx         ← adapt §8.4 pattern
│       └── dropdown.tsx      ← Radix wrapper, see cevi.ai/dashboard/src/components/ui/dropdown.tsx
└── lib/
    └── utils.ts              ← copy §12.2
```

Grow from there. Every additional component follows the four rules in §8: forwardRef, named interface, `cn()` composition, full state coverage.

---

*Questions? This doc is the source of truth. If the live product diverges, the doc wins until an ADR (architecture decision record) is raised to update it.*
