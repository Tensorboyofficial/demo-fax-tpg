# Cevi Design System — End-to-End Reference

> **Version 2.0 · Source of truth for any Cevi-family product**
>
> This doc is **portable**. Copy it into a new project's `docs/` folder, install the three drop-in files in §18, and the new product ships at pixel-parity with the Cevi Outreach dashboard in ~20 minutes.
>
> Authored 2026-04-23. Reflects the system as it shipped through Cevi Outreach sessions 0–8 (Vercel-live at https://dashboard-omega-three-31.vercel.app).
>
> **If this doc disagrees with the live code, the code wins until someone raises an ADR (§19) to update this doc.**

---

## Contents

1. [Quick start for a new product](#1-quick-start-for-a-new-product)
2. [Brand identity](#2-brand-identity)
3. [Logo system](#3-logo-system)
4. [Color system](#4-color-system)
5. [Typography](#5-typography)
6. [Spacing, radius, shadows](#6-spacing-radius-shadows)
7. [Motion](#7-motion)
8. [Iconography](#8-iconography)
9. [Core components](#9-core-components)
10. [Layout patterns](#10-layout-patterns)
11. [Responsive rules](#11-responsive-rules)
12. [Accessibility](#12-accessibility)
13. [Data visualization](#13-data-visualization)
14. [UX writing / voice](#14-ux-writing--voice)
15. [Anti-patterns](#15-anti-patterns)
16. [Drop-in: Next.js 16 + Tailwind v4](#16-drop-in-nextjs-16--tailwind-v4)
17. [Tokens as JSON (for other platforms)](#17-tokens-as-json-for-other-platforms)
18. [File manifest for a new product](#18-file-manifest-for-a-new-product)
19. [Governance: ADR process](#19-governance-adr-process)

---

## 1. Quick start for a new product

```bash
# 1. Install runtime deps
pnpm add next@^16 react@^19 react-dom@^19
pnpm add tailwindcss@^4 @tailwindcss/postcss
pnpm add @radix-ui/react-dropdown-menu @radix-ui/react-dialog \
        @radix-ui/react-radio-group @radix-ui/react-switch \
        @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-label
pnpm add lucide-react clsx tailwind-merge zod recharts

# 2. Copy four files verbatim (all in §16 below)
#    src/app/globals.css         ← design tokens + motion kit + resets
#    src/lib/utils.ts            ← cn() helper
#    src/components/ui/*.tsx     ← Button / Card / Badge / states
#    src/components/brand/CeviLogo.tsx

# 3. Wire fonts in src/app/layout.tsx (see §5.2)

# 4. Verify: create a page with <Button variant="primary">Start</Button>
#    You should see terracotta fill + DM Sans label at 14px.
```

If the first button doesn't look terracotta, stop and fix font/token wiring before building anything else. Everything downstream depends on these being correct.

---

## 2. Brand identity

### 2.1 Essence

Cevi is an AI operations layer for healthcare practices. The buyer is a clinic owner or operations lead — often non-technical, often burned by vendors whose UI "felt like a prototype." The aesthetic has to land three beats simultaneously:

| Beat | What that means in the UI |
|---|---|
| **Trustworthy** | Warm neutral palette (not the cold blue-gray of every healthcare SaaS). Terracotta accent used sparingly. Typography that signals editorial care, not startup haste. |
| **Operationally serious** | Dense information architecture. 13px base body in the dashboard. Tables over cards when data is the point. No marketing fluff inside the product. |
| **Clinically safe** | WCAG AA contrast minimum everywhere. Never surface PHI in a way that leaks through screenshots. Error states are calm, not red-alert. |

### 2.2 Product voice

Warm, direct, specific. A Cevi UI string should read like a thoughtful clinician explaining something to a colleague — not a marketing blurb, not a sterile enterprise tooltip. See §14 for full writing guidance.

### 2.3 Anti-brand (reject on sight)

- Generic "AI product" purple gradients. Cevi is warm, not synthetic.
- Playful / illustrated healthcare (pill mascots, smiling doctors, balloons). Cevi is for operators, not patients.
- Dense "pro" gray dashboards with no typographic hierarchy. Cevi uses editorial serif + humanist sans pairing to signal care.
- Dark-mode-by-default with neon accents. Cevi is warm light surfaces. Dark mode exists only as a documented future state.

---

## 3. Logo system

### 3.1 Wordmark

Lowercase "cevi" in a serif display face, with a dot over the "i" in terracotta (`--cevi-accent`). The wordmark is the primary brand mark — there is no secondary icon-only mark.

**Aspect ratio:** 416 × 139 (original SVG viewBox). Never distort.

**Clear space:** Minimum 8px (one `--space-sm`) on all sides. In sidebars the clear space collapses inward to match the nav gutter — that's intentional.

### 3.2 Sizes

| Context | Height | Width (derived) |
|---|---|---|
| Sidebar wordmark (`size="sm"`) | 28px | ~83px |
| Patient-facing booking page, footer | 40px (`size="md"`) | ~120px |
| Future landing hero | 64px (`size="lg"`) | ~192px |

### 3.3 Component (single source of truth)

The React component lives at `src/components/brand/CeviLogo.tsx`. It renders inline SVG with two paths:
- **"i" dot**: `fill="var(--cevi-accent)"` by default, or `fill="currentColor"` when `monochrome={true}`.
- **"cev" wordmark**: always `fill="currentColor"` so the wordmark adapts to the surrounding text color.

```tsx
<CeviLogo size="sm" />                  // terracotta dot on dark surface
<CeviLogo size="md" monochrome />       // full black for PDF / print / fax cover
```

**Inline SVG paths** (do not re-import, keep them inline):

```svg
<!-- The "i" dot -->
<path d="M397.5 0.5H415.421V138.464H397.5V0.5Z" fill="var(--cevi-accent)" />
<!-- The "cev" wordmark -->
<path d="M304.462 129.854L251.499 0.3H271.823L314.774 110.932C315.875 113.735…" fill="currentColor" />
```

Full path strings live in `src/components/brand/CeviLogo.tsx`.

### 3.4 Logo misuse (never)

- Recolor the wordmark path to anything other than `currentColor`-derived tones.
- Replace the dot hue with any non-accent color — breaks brand recognition.
- Stretch, skew, rotate, or apply drop shadows.
- Use as a background watermark behind text (unless opacity ≤ 0.04 and the text passes contrast).
- Lock up with another brand's mark. Cevi stands alone.

---

## 4. Color system

The palette is split into three layers: primitive values → semantic tokens → component tokens. Only CSS variables (prefixed `--cevi-*`) appear in components. Never raw hex in a `.tsx` or `.css` that isn't `globals.css`.

### 4.1 Brand accent (terracotta)

Terracotta is Cevi's single brand accent. It is used for **primary CTAs, active states, the logo dot, focus rings, and link underlines on hover**. Never as body text. Never as more than one accent-fill region per visible card area.

| Token | Value | WCAG on white | Use |
|---|---|---|---|
| `--cevi-accent` | `#E35336` | 4.7:1 (AA) | Primary CTA, active tab, logo dot, focus ring base |
| `--cevi-accent-hover` | `#D04A2E` | 5.4:1 (AA) | `:hover` on accent elements, pressed state |
| `--cevi-accent-light` | `#FEF7F5` | n/a | Subtle bg (selected row, active nav, info tint) |
| `--cevi-accent-bg` | `#FDF5EC` | n/a | Warm backdrop for icon boxes, onboarding cards, TOC |

### 4.2 Text scale

Four readable steps + one disabled-only step. Every readable token passes WCAG AA on `#FFFFFF`.

| Token | Value | Contrast on white | Use |
|---|---|---|---|
| `--cevi-text` | `#1a1a1a` | 16.5:1 (AAA) | Headings, primary body copy |
| `--cevi-text-secondary` | `#333333` | 12.6:1 (AAA) | Supporting body copy |
| `--cevi-text-tertiary` | `#555555` | 7.4:1 (AAA) | Secondary labels, table headers |
| `--cevi-text-muted` | `#77736D` | 4.6:1 (AA) | Hints, placeholders, card subtitles |
| `--cevi-text-faint` | `#9A9A96` | 3.0:1 (sub-AA) | **Disabled only.** Never for readable text. |

### 4.3 Surfaces and borders

| Token | Value | Use |
|---|---|---|
| `--cevi-bg` | `#FFFFFF` | App background, card background |
| `--cevi-surface` | `#F6F4F2` | Sidebar, subtle panels, skeleton bars |
| `--cevi-surface-warm` | `#FAFAF8` | Row hover, subtle elevation |
| `--cevi-border` | `#E3E2DE` | All card / table / input borders |
| `--cevi-border-light` | `#EDECEA` | Dividers inside cards, row separators, cadence dashed connectors |
| `--cevi-link-underline` | `#C0BFBA` | Inline link underlines (1px, under-hover) |

### 4.4 Success + error

Error deliberately reuses the accent — in healthcare ops, "error" often means "needs attention" (overdue lab, flagged message), not "danger." This keeps the palette tight and avoids red-alert noise.

| Token | Value | Use |
|---|---|---|
| `--cevi-success` | `#2D7A54` | Success text, confirm badge |
| `--cevi-success-light` | `#EDFAF3` | Success chip bg, completed-state tint |
| `--cevi-error` | `#E35336` (= accent) | Error text |
| `--cevi-error-light` | `#FEF7F5` (= accent-light) | Error chip bg, needs-attention tint |

### 4.5 Desert Mirage — the categorical palette

Five warm categorical colors for non-status groupings: workflow types, integration categories, service categories, trigger classes. **Never use for status** (that's success/error above).

| Token | Value | Light pair | Canonical use |
|---|---|---|---|
| `--cevi-coral` | `#F4845F` | `#FEF0EC` | Scheduling, appointments, warnings |
| `--cevi-amber` | `#F7B267` | `#FEF4E6` | Marketing-class HIPAA, pending states, middle-band |
| `--cevi-jade` | `#7EC4A5` | `#EDFAF3` | Treatment-class HIPAA, active, success-alternate |
| `--cevi-sand` | `#D4A574` | `#FDF5EC` | Documents, neutral categories, low-priority |
| `--cevi-teal` | `#6CB4C4` | `#EFF8FA` | Care-coordination-class HIPAA, integrations, external systems |

**Rule:** a single screen uses at most **3 of these 5**. Pick whichever 3 best differentiate your categories. Same color should mean the same thing across pages.

Example assignment pattern used in Cevi Outreach:
- **HIPAA classification**: treatment → jade, care_coordination → teal, marketing → amber
- **Audit trail action pills**: detect → sand, compose → coral, approve → jade, gate_block → amber, opt_out → muted (default badge)

### 4.6 Using tokens with opacity

Tailwind v4 accepts `bg-[var(--cevi-accent)]/10` (10% alpha). Prefer that over hardcoding rgba(). For borders use the same: `border-[var(--cevi-error)]/20`.

---

## 5. Typography

### 5.1 Font families

| Role | Family | Why | Source |
|---|---|---|---|
| **Body** | **DM Sans** | Humanist sans with excellent dashboard legibility at 13–15px. Generous x-height. | Google Fonts (free) |
| **Headings (editorial)** | **EB Garamond** | Calm serif, editorial. Signals "considered product," not "startup MVP." Excellent at 20–36px. | Google Fonts (free) |
| **Logo** | **(SVG, not a font)** | See §3 | inline SVG |
| **Mono** | `'SF Mono', ui-monospace, monospace` | System mono for code blocks, CPT codes, IDs, patient medical record numbers | System stack |

> Only DM Sans + EB Garamond are loaded. **Never** add a third font family without an ADR. The serif is the brand's care signal — do not dilute it.

### 5.2 Next.js font loading

```tsx
// src/app/layout.tsx
import "./globals.css";
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

Only the listed weights are loaded — don't add more without a use case. Each weight adds ~20KB.

### 5.3 Type scale

Fixed `rem`-equivalent pixel scale — this is an app UI, not a fluid marketing page. All sizes in `px` in globals.css; Tailwind arbitrary values work (`text-[13px]`).

| Step | Family | Size | Weight | Line-height | Letter-spacing | Use |
|---|---|---|---|---|---|---|
| **Display** | Heading | 36px | 400 | 1.2 | -0.02em | Marketing hero, one per page max |
| **H1** | Heading | 28px | 400 | 1.2 | -0.02em | Page title |
| **H2** | Body | 20px | 600 | 1.3 | 0 | Section title |
| **H3** | Body | 16px | 600 | 1.4 | 0 | Sub-section, card title |
| **Body** | Body | 15px | 400 | 1.6 | 0 | Marketing body paragraphs |
| **Body-dense** | Body | **13px** | 400 | 1.5 | -0.01em | **Dashboard default. Product surfaces.** |
| **Label** | Body | 15px | 500 | 1.4 | 0 | Form labels (marketing) |
| **Label-dense** | Body | 12px | 500 | 1.4 | 0 | Form labels (dashboard) |
| **Caption** | Body | 13px | 400 | 1.5 | 0 | Hints, captions, muted copy |
| **Overline** | Body | 11px | 600 | 1.2 | +0.04em, uppercase | Section heads, badges, table headers, "LAST USED" metadata |
| **Logo** | Serif | 28px | 400 | 1.0 | -0.02em | Reserved if ever typographic (we use SVG) |

### 5.4 Typography rules

- **Headings use the serif (EB Garamond).** Never bold-weight a sans to fake a heading.
- **Body copy uses DM Sans.** Never ALL-CAPS body text. Reserve caps for overlines (11px) only.
- **-0.01em tracking on dense dashboard text** — compensates for 13px legibility.
- **Line-height 1.6 for marketing body, 1.5 for dashboard body.** Denser = tighter.
- **One display-size element per viewport.** The display (36px) or H1 (28px) is a hierarchy anchor, not decoration.
- **Tabular numerals for data tables:** add `font-variant-numeric: tabular-nums` (Tailwind: `tabular-nums`) to any `<td>` or column where digits should vertically align. LTV $$ columns, score percentages, audit timestamps.
- **`letter-spacing: -0.01em` on dense 13px body** is baked into body CSS. Don't override.
- **Overline label pattern:**
  ```
  <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--cevi-text-tertiary)]">
    OPEN OPPORTUNITIES
  </span>
  ```

### 5.5 Anti-patterns (typography)

- Fluid `clamp()` typography inside the dashboard. Spatial predictability requires fixed sizes.
- Mixing the serif with the mono in a header — mixed letter-structures clash.
- Using EB Garamond below 16px — it blurs at small sizes due to its narrow stroke.
- Displaying dates as "Apr 21, 6:49 PM" without `tabular-nums` — timestamps jitter.
- Placeholder-only field labels — always visible label above the input.

---

## 6. Spacing, radius, shadows

### 6.1 Spacing scale (rhythm)

7 steps. Use these exclusively; never arbitrary pixel values in gaps or padding.

```css
--space-xs:  4px;   /* icon → label inside a pill */
--space-sm:  8px;   /* between sibling tags / inline icons */
--space-md:  16px;  /* card internal padding unit */
--space-lg:  24px;  /* section gutter inside a card */
--space-xl:  32px;  /* page-edge padding on desktop */
--space-2xl: 48px;  /* between major sections */
--space-3xl: 64px;  /* between page chapters (marketing) */
```

### 6.2 Radius

5 steps. Never arbitrary radii.

```css
--radius-sm:   4px;    /* inline pills, tiny tags */
--radius-md:   8px;    /* default — buttons, cards, inputs */
--radius-lg:   12px;   /* modals, large cards */
--radius-xl:   16px;   /* hero cards, feature highlights */
--radius-full: 9999px; /* badges, status pills, avatars */
```

### 6.3 Shadows (sparingly)

3 elevation steps + one focus-ring spec. The product is mostly **flat with 1px borders** — shadows are reserved for floating surfaces (dropdowns, modals) and the focus ring.

```css
--shadow-sm:    0 1px 3px rgba(0,0,0,0.04);         /* hover lift (barely) */
--shadow-md:    0 4px 12px rgba(0,0,0,0.06);        /* dropdown, popover */
--shadow-lg:    0 8px 32px rgba(0,0,0,0.08);        /* modal, dialog */
--shadow-focus: 0 0 0 3px rgba(227,83,54,0.08);     /* focus ring (accent) */
```

### 6.4 Rules

- **Never stack shadows on resting cards.** Depth = 1px border + hover bg-warm, not shadow.
- **Modal scrim = 40% black** (`rgba(0,0,0,0.4)`). Always.
- **Focus ring is the SAME across Button/Input/Link** — 3px accent/8% via `box-shadow`. Don't override per-component.
- **Border radius rhythm**: buttons/inputs = md (8px), cards = md (8px), modals = lg (12px), avatars/badges = full. Don't mix lg and xl on the same page.

---

## 7. Motion

**Principle: motion clarifies state changes, never decorates.**

### 7.1 Motion tokens

```css
--duration-fast:   150ms;                         /* hover, focus ring, fade-in */
--duration-normal: 200ms;                         /* modal open, card enter, scale-in */
--ease-out-quart:  cubic-bezier(0.25, 1, 0.5, 1); /* default ease for enters */
```

### 7.2 Named animations

Three base keyframes live in `globals.css`:

```css
@keyframes cevi-card-enter { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
@keyframes cevi-fade-in    { from { opacity: 0; } to { opacity: 1; } }
@keyframes cevi-scale-in   { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }

.cevi-card-enter  { animation: cevi-card-enter  var(--duration-normal) var(--ease-out-quart) both; }
.cevi-fade-in     { animation: cevi-fade-in     var(--duration-fast)   var(--ease-out-quart) both; }
.cevi-scale-in    { animation: cevi-scale-in    var(--duration-normal) var(--ease-out-quart) both; }
```

### 7.3 Staggered list entry

Initial queue/list render gets staggered card-enter, clamped at 5 to prevent a long tail:

```css
.cevi-card-enter-1 { animation-delay: 0ms; }
.cevi-card-enter-2 { animation-delay: 40ms; }
.cevi-card-enter-3 { animation-delay: 80ms; }
.cevi-card-enter-4 { animation-delay: 120ms; }
.cevi-card-enter-5 { animation-delay: 160ms; }
```

In React:
```tsx
{items.slice(0, 5).map((item, i) => (
  <Card key={item.id} className={`cevi-card-enter cevi-card-enter-${i + 1}`}>…</Card>
))}
{items.slice(5).map(item => <Card key={item.id}>…</Card>)}
```

### 7.4 Button press feedback

Universal `:active` scale-down, no spring, no bounce:

```css
button:active:not(:disabled),
a:active {
  transform: scale(0.98);
  transition: transform 100ms ease-out;
}
```

### 7.5 Transition timings

| Interaction | Duration | Easing | Properties |
|---|---|---|---|
| Hover state (color, border) | 100ms | `ease-out` | color, background-color, border-color |
| Focus ring appear | 150ms | `ease-out` | box-shadow |
| Dropdown / popover open | 150ms | `ease-out-quart` | opacity, transform (scale 0.95 → 1) |
| Modal open | 200ms | `ease-out-quart` | opacity, transform (translateY 4px → 0) |
| Progress bar fill | 500ms | `cubic-bezier(0.22, 1, 0.36, 1)` | width |
| Page transition | **none** (hard cut) | — | — |

### 7.6 Rules

- **Animate only `transform`, `opacity`, `box-shadow`, `background-color`, `border-color`, `color`.** Never `width` / `height` / `top` / `left`.
- **Respect `prefers-reduced-motion: reduce`** — the `globals.css` block disables all animation at 0.01ms. Don't bypass.
- **No bounce, no overshoot, no spring physics.** Healthcare buyers read those as "unserious."
- **One memorable moment per page max.** A queue card staggered enter is a moment; micro-animations on every hover is noise.
- **Exit animations ≤ 70% of enter duration.** Snap-close feels responsive; slow-close feels broken.

---

## 8. Iconography

- **Library:** Lucide (`lucide-react`). Nothing else. Never mix icon sets.
- **Stroke width:** Lucide default (1.5). Uniform across the product.
- **No emoji as structural icons.** Use SVG vectors.

### 8.1 Icon sizes (match text)

| Context | Icon size | Tailwind class |
|---|---|---|
| Inline in 13px text | 12–14px | `h-3 w-3` or `h-3.5 w-3.5` |
| Inline in 15–16px text | 16px | `h-4 w-4` |
| Section headers / nav items | 18–20px | `h-4.5 w-4.5` or `h-5 w-5` |
| Empty-state illustration | 32–48px | `h-8 w-8` or `h-12 w-12` |

### 8.2 Icon-box pattern

Decorative container for a category icon (empty states, settings cards, brand moments):

```tsx
<div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[var(--cevi-accent-bg)]">
  <ShieldCheck className="h-5 w-5 text-[var(--cevi-accent)]" />
</div>
```

Icon-box color options:
- **Warm:** `bg-[var(--cevi-accent-bg)]` + accent-colored icon
- **Cool:** `bg-[#EFF8FA]` (teal-light) + `text-[var(--cevi-teal)]`
- **Success:** `bg-[var(--cevi-success-light)]` + `text-[var(--cevi-success)]`

### 8.3 Canonical icon assignments

Consistent icons for the same concept across pages:

| Concept | Icon |
|---|---|
| Panel / patients list | `Users` |
| Queue / inbox of drafts | `Inbox` |
| Inbox / messages thread | `Mail` |
| Analytics | `BarChart3` |
| Audit trail | `ShieldCheck` |
| Settings | `Settings` |
| Physician voice | `Mic` |
| Encounter (clinical visit) | `Stethoscope` |
| Lab result | `FlaskConical` |
| Prescription | `Pill` |
| Outbound message | `Send` |
| Inbound message | `MessageSquare` |
| Booking / appointment | `Calendar` |
| FHIR appointment confirmed | `CheckCircle2` |
| Cadence scheduled touch | `Clock` |
| Classification: marketing / warning | `ShieldAlert` |
| Empty queue / no data | `Sparkles` or `FileText` |
| Error / retry | `AlertTriangle` |

---

## 9. Core components

All components follow four rules:

1. **Ref-forwarding** (`React.forwardRef`) for composability.
2. **Props typed as named `interface`**, never `any`.
3. **Classes composed via `cn(...)`** — variants first, overrides last.
4. **States covered:** default · hover · active · disabled · focus-visible · loading (async) · error (input).

### 9.1 Button

**5 variants × 3 sizes**, all compliant with WCAG AA.

| Variant | Visual | Use |
|---|---|---|
| `primary` | Terracotta fill, white text | Main CTA per screen. Max **one primary per viewport** in most cases. |
| `secondary` | White fill, 1px border, dark text | Secondary action next to primary |
| `ghost` | No fill, muted text | Tertiary (toolbar, "← Back", inline action) |
| `outline` | Transparent, 1px border, text turns accent on hover | Alt secondary used on light surface inside a card |
| `danger` | Soft red-pink tint (accent-light bg + accent-border/20), accent text | Destructive confirm (Delete, Clear All) |

| Size | Height | Padding X | Text |
|---|---|---|---|
| `sm` | 32px | 12px | 12px |
| `md` (default) | 36px | 16px | 14px |
| `lg` | 44px | 24px | 14px |

**States:**
- `disabled` / `loading`: `opacity: 0.5`, `pointer-events: none`, spinner replaces left icon
- `focus-visible`: `ring-2 ring-[var(--cevi-accent)]/30`, no outline

**Reference implementation:** `src/components/ui/button.tsx`. Copy verbatim.

### 9.2 Card

Base surface primitive — **flat, 1px border, 8px radius.** No resting shadow.

| Prop | Values | Default | Effect |
|---|---|---|---|
| `padding` | `none` / `sm` (12px) / `md` (20px) / `lg` (28px) | `md` | Internal padding |
| `hover` | `boolean` | `false` | On hover: border → accent, bg → accent-light, translateY(-1px) |

**Subcomponents:** `Card` + `CardHeader` + `CardContent` + `CardFooter`. Header/Footer have `py-4 px-5` and `border-{top|bottom}` using `--cevi-border-light` (internal division is softer than the card's outer edge).

**Rule:** do NOT stack shadows on resting cards. Depth = border + hover state.

### 9.3 Badge

Pill-shaped, uppercase, 4% letter-spacing, 10–12px text.

**8 variants:** `default` · `coral` · `amber` · `jade` · `sand` · `teal` · `success` · `error`
**2 sizes:** `sm` (10px, px-2) · `md` (12px, px-2.5)
**Options:** `dot` (6px filled circle left) · `pulse` (live-alert contexts only)

**Classification-to-variant canonical map:**
```
treatment          → jade
care_coordination  → teal
marketing          → amber
HIGH PRIORITY      → coral
Low confidence     → amber
```

### 9.4 Input / Textarea

```tsx
<input
  className="w-full h-9 rounded-lg border border-[var(--cevi-border)] bg-white px-3 text-[13px] text-[var(--cevi-text)] placeholder:text-[var(--cevi-text-faint)] focus:outline-none focus:border-[var(--cevi-text)] focus:ring-2 focus:ring-[var(--cevi-accent)]/20 transition-colors"
/>
```

- **Default border:** `--cevi-border`
- **Focus border:** `--cevi-text` (near-black — stronger than accent, keeps focus noticeable without being loud)
- **Focus ring:** accent at 20% alpha, 2px
- **Error state:** border → `--cevi-error`, helper text → `--cevi-error`, icon slot on right with `AlertCircle`
- **Placeholder:** `--cevi-text-faint`, upright (never italic)
- **Touch target:** minimum 44px tall on mobile — bump input height from 36 to 44 below md.

### 9.5 Select / Dropdown

Use **Radix `DropdownMenu`** and `Select` — not native `<select>`. Pattern:

```tsx
<DropdownMenu>
  <DropdownTrigger asChild>
    <button className="h-9 px-3 rounded-lg border border-[var(--cevi-border)] bg-white text-[13px] text-[var(--cevi-text-secondary)] hover:border-[var(--cevi-text-muted)] hover:text-[var(--cevi-text)] inline-flex items-center gap-1.5">
      {currentLabel}
      <ChevronDown className="h-3 w-3" />
    </button>
  </DropdownTrigger>
  <DropdownContent align="start" className="min-w-[160px]">
    {options.map(o => (
      <DropdownItem key={o.value} onSelect={() => setValue(o.value)}>{o.label}</DropdownItem>
    ))}
  </DropdownContent>
</DropdownMenu>
```

Radix handles keyboard navigation (arrows/Enter/Escape), focus trap, and ARIA by default.

### 9.6 Table (dense data)

```tsx
<table className="w-full">
  <colgroup>
    <col className="w-[150px]" />
    <col className="w-[110px]" />
    {/* explicit widths on fixed columns; last col flexes */}
  </colgroup>
  <thead>
    <tr className="bg-[var(--cevi-surface-warm)] text-left text-[11px] font-semibold text-[var(--cevi-text-tertiary)] uppercase tracking-[0.04em]">
      <th className="px-4 py-3">Time</th>
      <th className="px-4 py-3">Action</th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b border-[var(--cevi-border-light)] hover:bg-[var(--cevi-surface-warm)]">
      <td className="px-4 py-3 text-[13px] whitespace-nowrap">Apr 21, 6:49 PM</td>
      <td className="px-4 py-3 text-[13px]">…</td>
    </tr>
  </tbody>
</table>
```

- **Headers:** 11px overline (uppercase, 600, `--cevi-text-tertiary`)
- **Rows:** 13px body, `border-b border-[var(--cevi-border-light)]`, hover → `--cevi-surface-warm`
- **Fixed-width columns** via `<colgroup>` when any column holds unpredictable-length content (timestamps, long IDs, JSON details) — otherwise the long column pushes neighbors. **This is the fix that resolved the audit row overlap bug in S8.**
- **Never zebra stripes.** Alternating row colors fight the border + hover pattern.
- **Long content in a cell:** `<span className="line-clamp-2">` or `truncate` with `title={fullText}` for native tooltip.
- **Tabular figures:** add `tabular-nums` to numeric columns.
- **Mobile (<md):** swap to stacked `Card` list OR wrap in `overflow-x-auto` with a muted hint "Swipe horizontally to see more."

### 9.7 Modal / Dialog

Radix `Dialog`. Pattern:
- Overlay: `rgba(0,0,0,0.4)` (40% black)
- Content card: `bg-white`, `rounded-xl` (12px), `shadow-lg`, `p-6`, `max-w-lg` (or up to `max-w-[960px]` for data inspectors like the FHIR bundle viewer)
- Close button: top-right, lucide `X`, ghost variant
- Escape closes; click outside closes (unless `modal` prop explicitly blocks it)
- Focus trapped inside while open; focus returns to trigger element on close
- Max height: `max-h-[85vh]`, with scrollable body

### 9.8 Empty state

Every list / table / chart **must** have a designed empty state. Never ship a blank container.

```tsx
<EmptyState
  icon={<Calendar className="h-6 w-6" />}
  title="No appointments yet"
  body="Once patients book, they appear here with the full attribution chain."
  action={{ label: "Run detection", onClick: handleRefresh }}
/>
```

Pattern (from `src/components/ui/states.tsx`):
- `py-16 px-6`, centered flex column, `gap-3`
- 48×48 rounded-full icon box in `--cevi-accent-bg` with `--cevi-accent` icon
- Serif H3 (18px, weight 400) title in `--cevi-text`
- 13px body in `--cevi-text-muted`, max-w-md
- Optional primary CTA button

### 9.9 Skeleton loader

For any data fetch > 200ms. Match the shape and rough dimensions of what's loading.

```tsx
<div className="h-4 w-48 bg-[var(--cevi-border-light)] rounded animate-pulse" />
```

Use `--cevi-border-light` (`#EDECEA`) as the skeleton fill — not neutral gray, not white. This matches the internal card division color.

### 9.10 Error state

Calm, not red-alert. Pattern:
- Icon: `AlertTriangle` in `--cevi-error` inside an error-light bg circle
- Title: "Something didn't load"
- Body: error message if helpful, else generic "Please try again"
- Primary "Retry" button

Never auto-dismiss clinical errors. The clinician must actively acknowledge.

### 9.11 Stat card

Dashboard KPI card. **The big number uses the serif heading font** — this is where the editorial-dashboard blend is most visible.

```tsx
<Card padding="md">
  <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--cevi-text-tertiary)]">
    Patients today
  </div>
  <div className="mt-2 font-[var(--font-eb-garamond)] text-[36px] leading-none text-[var(--cevi-text)]">
    {count}
  </div>
  <div className="mt-1 text-[12px] text-[var(--cevi-text-muted)]">
    +{delta} vs yesterday
  </div>
</Card>
```

### 9.12 Toast (notification)

- **Position:** bottom-right, `24px` from edges
- **Width:** 320px min, 420px max
- **Duration:** 4s success, 6s error, **sticky** for destructive-with-undo
- **Structure:** icon + message + optional action link
- **Success:** `success-light` bg + `success` text
- **Error:** `accent-light` bg + `accent` text
- **ARIA:** `role="status"` for info/success, `role="alert"` for errors, `aria-live="polite"`

---

## 10. Layout patterns

### 10.1 Dashboard shell (primary app layout)

```
┌─────────────────────────────────────────────────────┐
│ Top bar (64px)  — search · practice switcher · user │
├────────┬────────────────────────────────────────────┤
│        │                                             │
│ Side   │   Page content                              │
│ nav    │   max-w-7xl (1280px) mx-auto                │
│        │   padding: 32px desktop, 16px mobile        │
│ 240px  │                                             │
│        │                                             │
└────────┴────────────────────────────────────────────┘
```

- **Sidebar:** 240px fixed, `--cevi-surface` bg (subtle warm gray). Collapses to a hamburger button + Radix Dialog drawer below `md:` (768px).
- **Topbar:** 64px height, 1px bottom border (`--cevi-border`). Contains search input (collapses to icon below `sm`), practice switcher pill (shortens label below `sm`), user avatar. The practice pill color adapts to the selected practice's accent.
- **Content area:** `max-w-7xl` (1280px), centered, `px-8 py-8` on desktop, `px-4 py-6` on mobile. Full-bleed only for data tables and the Inbox.

### 10.2 Sidebar nav

```tsx
<aside className="w-60 bg-[var(--cevi-surface)] min-h-dvh flex flex-col p-4 gap-1">
  <Link href="/" aria-label="Cevi — go to Panel" className="block px-6 py-6">
    <CeviLogo size="sm" />
  </Link>
  <nav aria-label="Primary navigation" className="flex flex-col gap-1">
    {NAV_ITEMS.map(({ href, label, Icon }) => {
      const isActive = pathname.startsWith(href);
      return (
        <Link
          key={href}
          href={href}
          aria-current={isActive ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 px-4 py-2 rounded-md text-[13px] transition-colors",
            isActive
              ? "bg-[var(--cevi-accent-light)] text-[var(--cevi-accent)] font-semibold"
              : "text-[var(--cevi-text-muted)] hover:bg-white hover:text-[var(--cevi-text)]",
          )}
        >
          <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{label}</span>
        </Link>
      );
    })}
  </nav>
</aside>
```

- **Active state:** accent-light bg + accent text + semibold weight. The contrast carries hierarchy without a left-stripe rule.
- **Hover:** white bg (brighter than the surface, which is warm-gray) + full `--cevi-text`.
- **Icon + label:** both are mandatory. Icon-only nav harms discoverability.
- **`aria-current="page"`** on active link. Preserves screen-reader orientation.

### 10.3 Page header (standard)

```tsx
<div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
  <div>
    <h1 className="font-[var(--font-eb-garamond)] text-[28px] leading-[1.2] tracking-[-0.02em] text-[var(--cevi-text)]">
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

The **serif H1 + sans body subtitle** is the signature. Don't swap to sans-sans — it reads like a vendor dashboard, not a Cevi dashboard.

### 10.4 Filter bar (pattern above a list)

```tsx
<div className="flex items-center gap-2 flex-wrap mb-6" role="toolbar" aria-label="Queue filters">
  <StatusDropdown value={status} onChange={setStatus} />
  <TriggerDropdown value={trigger} onChange={setTrigger} />
  {hasFilters && (
    <Button variant="ghost" size="sm" onClick={clearFilters}>
      <X className="h-3 w-3" />
      Clear filters
    </Button>
  )}
  <div className="flex-1" />
  <Button variant="secondary" icon={<RefreshCw className="h-3.5 w-3.5" />}>Refresh</Button>
  <Button variant="primary" icon={<Sparkles className="h-3.5 w-3.5" />}>Compose</Button>
</div>
```

- `role="toolbar"` + `aria-label` on the container
- `flex-wrap` so it reflows below md without breaking
- Right-side primary action gets accent color; left-side filters get secondary styling

### 10.5 Two-pane master-detail (Inbox / conversation)

```
┌── 320px (left rail) ──┬── flex-1 (right pane) ──┐
│                       │                          │
│ Filter tabs (sticky)  │ Sticky patient header    │
│ Thread list           │ Scrollable message list  │
│ (scroll)              │ Composer footer          │
└───────────────────────┴──────────────────────────┘
```

Negative-margin the parent layout padding so the pane fills the viewport height minus topbar:

```tsx
<div className="-mx-8 -my-8 h-[calc(100dvh-64px)] grid grid-cols-[320px_1fr]">
  <div className="border-r border-[var(--cevi-border-light)] overflow-y-auto">
    <ThreadList … />
  </div>
  <div className="overflow-y-auto">
    <ConversationPane … />
  </div>
</div>
```

Below `md:` collapse to a single column — thread list full-width with a "back to threads" button on the conversation pane.

### 10.6 Selected-row affordance

Selected rows in lists (threads, audit rows in a drill-down) get:
- `bg-[var(--cevi-accent-light)]`
- 2px left stripe: `border-l-2 border-[var(--cevi-accent)]` on the `<li>` / `<tr>`

*(Note: left-stripe is **only** used for a genuine "selected" state in a list. It is not decorative and not used on cards. This is the one exception to the anti-pattern in §15.2.)*

---

## 11. Responsive rules

### 11.1 Breakpoints

| Breakpoint | Min width | Tailwind prefix | Primary use |
|---|---|---|---|
| Mobile | 320px | (none) | Base styles — mobile-first |
| Small tablet | 640px | `sm:` | Tighter table layouts, 2-col cards |
| Tablet | 768px | `md:` | Sidebar appears, table full-width |
| Desktop | 1024px | `lg:` | 3-col dashboards, wider padding |
| Large desktop | 1280px | `xl:` | Max content width cap |
| XL desktop | 1536px | `2xl:` | Rarely used — let content center |

### 11.2 Rules

- **Mobile-first.** Base class is mobile. Add `md:` prefixes for tablet+.
- **Touch targets ≥ 44 × 44px** on mobile. Buttons default to 36px — bump to `size="lg"` (44px) below md when the button is primary.
- **Tables:** `overflow-x-auto` OR swap to card-list layout below md.
- **Sidebar:** hamburger + Radix Dialog drawer below md. Trigger is in the topbar left.
- **Modal width:** `max-w-[520px]` mobile, `max-w-lg` (512px) tablet, `max-w-[960px]` desktop.
- **Content padding:** `px-4 py-6` mobile → `px-8 py-8` desktop.
- **Test mentally at iPhone SE (375px).** If it overflows, it's wrong.
- **Use `min-h-dvh`** over `100vh` on mobile (dynamic viewport handles mobile browser chrome).

---

## 12. Accessibility

### 12.1 Contrast

- Body text ≥ 4.5:1 (WCAG AA). All `--cevi-text-*` tokens through `-muted` pass.
- Large text (>18px or >14px bold) ≥ 3:1. `--cevi-text-faint` passes for large text but is **disabled-only**.
- Focus indicators: the 3px `--shadow-focus` ring passes WCAG 2.2 focus-appearance.
- **Test dark/colored backgrounds separately** when you introduce them — don't assume light-on-white contrast generalizes.

### 12.2 Keyboard navigation

- **Every interactive element reachable via Tab.** Tab order = visual reading order.
- **Focus-visible only.** `:focus-visible { box-shadow: var(--shadow-focus); }`. Never `:focus { outline: none }` without a replacement.
- **Radix components handle keyboard nav by default** — don't override unless you're certain.
- **Skip-to-main-content link** at the top of the app shell:
  ```tsx
  <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-[var(--cevi-accent)] focus:text-white focus:px-3 focus:py-2 focus:rounded-md">
    Skip to main content
  </a>
  ```
  And `id="main-content" tabIndex={-1}` on the `<main>` element.

### 12.3 Screen readers

- **Semantic HTML first.** `<button>`, `<nav>`, `<main>`, `<h1-h6>`, `<table>`. ARIA is the fallback, not the first choice.
- **Icon-only buttons need `aria-label`.** E.g. `<button aria-label="Close">×</button>`.
- **`aria-current="page"`** on active nav links.
- **`aria-busy="true"`** on loading containers.
- **Toasts:** `role="status"` for info/success, `role="alert"` for errors.

### 12.4 Motion preferences

The `globals.css` block respects `prefers-reduced-motion: reduce`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Critical for vestibular disorders and for clinical users who want a calm interface. Don't bypass.

### 12.5 Color is never the only indicator

Every status color pairs with an icon or label. Examples:
- Classification badge: colored dot + TEXT label ("TREATMENT · 95%")
- Status chips: colored dot + text ("ACTIVE", "AT RISK")
- Chart segments: colored segment + legend + direct labels when space allows

---

## 13. Data visualization

Charts use **Recharts** (already React-native SVG, simpler than Chart.js for our layouts). Cevi palette mapped via the `chart-tokens.ts` helper so Recharts SVG reads the actual CSS variable values at runtime — SSR still works because we have hex fallbacks.

### 13.1 Chart token helper

Lives at `src/components/analytics/chart-tokens.ts`:

```ts
const FALLBACKS: Record<string, string> = {
  "--cevi-accent": "#E35336",
  "--cevi-coral":  "#F4845F",
  "--cevi-amber":  "#F7B267",
  "--cevi-jade":   "#7EC4A5",
  "--cevi-sand":   "#D4A574",
  "--cevi-teal":   "#6CB4C4",
  "--cevi-text-muted":     "#77736D",
  "--cevi-border":         "#E3E2DE",
  "--cevi-border-light":   "#EDECEA",
  "--cevi-surface-warm":   "#FAFAF8",
  "--cevi-text":           "#1a1a1a",
};

export function ceviColor(name: keyof typeof FALLBACKS): string {
  if (typeof window === "undefined") return FALLBACKS[name];
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || FALLBACKS[name];
}

export const CATEGORICAL_PALETTE = [
  "--cevi-accent", "--cevi-teal", "--cevi-jade",
  "--cevi-amber", "--cevi-coral", "--cevi-sand",
] as const;
```

### 13.2 Chart type → color + shape

| Chart type | Primary color | When to use |
|---|---|---|
| Funnel (horizontal bars) | Gradient from `--cevi-accent` (top) to neutral (bottom) — OR per-stage from the CATEGORICAL_PALETTE | Attribution funnels, conversion stages |
| Trigger-mix bar chart | `--cevi-sand` (low conv.) → `--cevi-amber` (mid) → `--cevi-jade` (high) — color encodes a scalar | Categorical comparison where a secondary metric (conversion, score) colors the bar |
| Classification donut | Exactly the categorical assignment: jade (treatment) / teal (care_coord) / amber (marketing) | Proportional breakdowns of labeled categories |
| Revenue waterfall | `--cevi-accent` for the "attributed" portion, Desert Mirage pale tints for per-service stacks | Stacked categorical totals |
| Trend line | `--cevi-accent` primary; secondary line in `--cevi-teal` | Time series; keep to 1–2 lines, else readability dies |
| Sparkline | `--cevi-accent` thin (1.5px), no fill | Inline in stat cards |

### 13.3 Chart rules

- **Gridlines** are `--cevi-border-light` (subtle, don't compete with data).
- **Tooltips** use `bg-white`, 1px border, 8px radius, 12px font.
- **Always show a legend** unless chart has ≤3 clearly labeled bars.
- **Empty state per chart** — when no data, replace the axis frame with a designed empty block (icon + "No data yet" + CTA).
- **Responsive:** wrap charts in `ResponsiveContainer` so they reflow with the grid.
- **Never 3D effects, pie-chart overuse (>5 categories), or decorative gradients that obscure values.**
- **Accessibility:** every chart has an `aria-label` summarizing the chart's headline ("Conversion funnel showing 263 detected dropping to 4 booked"), and a `<table>` fallback below the chart (screen-reader-only: `<div className="sr-only">`).

### 13.4 Recharts example (funnel)

```tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ceviColor } from "./chart-tokens";

const data = [
  { stage: "Detected",  count: 263 },
  { stage: "Drafted",   count: 62  },
  { stage: "Approved",  count: 18  },
  { stage: "Sent",      count: 12  },
  { stage: "Responded", count: 7   },
  { stage: "Booked",    count: 4   },
];

<ResponsiveContainer width="100%" height={280}>
  <BarChart layout="vertical" data={data}>
    <XAxis type="number" stroke={ceviColor("--cevi-text-muted")} />
    <YAxis type="category" dataKey="stage" stroke={ceviColor("--cevi-text-muted")} />
    <Tooltip contentStyle={{ background: "#fff", border: `1px solid ${ceviColor("--cevi-border")}`, borderRadius: 8 }} />
    <Bar dataKey="count" fill={ceviColor("--cevi-accent")} radius={[0, 4, 4, 0]} />
  </BarChart>
</ResponsiveContainer>
```

---

## 14. UX writing / voice

### 14.1 Voice principles

- **Warm, direct, specific.** Name the thing. "Your last A1C from April was 6.2 — Dr. Patel wanted to recheck around the 6-month mark" — never "We noticed your chart may require attention."
- **Assume the reader is a smart professional.** No hand-holding. No hype.
- **Second person, active voice.** "Click Approve & Send" not "Approval is initiated when the user clicks."
- **No urgency copy.** Never "Limited time," "Act now," "Don't miss out." Even paragraphs that genuinely are time-sensitive should state the time window matter-of-factly ("Lab result expires in 14 days").
- **No exclamation marks.** Save them for on-call scenarios that truly justify them.
- **No emoji in product UI.** Use Lucide icons.
- **"Indicated services" / "recommended next step."** Never "cross-sell" or "upsell" in any patient-facing or clinician-facing string.

### 14.2 Error messages

Pattern: **what happened → why → how to recover.**

Bad: "Error: Invalid input"
Good: "We couldn't load your patient panel. The backend isn't responding. Click Retry — we keep trying for 30 seconds before giving up."

### 14.3 Empty states

Pattern: **what will appear here → why it matters → one CTA.**

Examples:
- Empty queue: **"Nothing to review. Click Refresh opportunities to scan your panel for patients who need follow-up. Each opportunity cites a clinical guideline."** → CTA `Refresh opportunities`.
- Empty audit: **"No audit entries yet. Every action — detect, compose, approve, dispatch, book — lands here automatically. Insert-only; nothing can be edited or deleted."** → no CTA (this is a receive-only surface).

### 14.4 Button labels

- **Verb + object.** "Approve & Send" not "Submit." "Book appointment" not "OK."
- **Title Case for actions, Sentence case for links/descriptions.** "Create opportunity" vs "Learn more about this patient."
- **Max 3 words.** Long CTAs are usually hiding an unclear purpose.

### 14.5 Numbers and dates

- **Humanized dates in the UI** ("Apr 21, 6:49 PM" or "3h ago"), ISO in API responses.
- **Tabular numerals for all data columns.** (§5.4)
- **Comma thousands** for counts ("1,746 encounters") and **dollar signs + comma** for revenue ("$12,400").
- **Percentages as whole numbers when possible.** `45%` not `45.2%` unless precision matters.

### 14.6 Timestamps in lists

Relative by default: "2m ago," "3h ago," "2d ago." Beyond 7 days, switch to absolute short: "Apr 15." Full absolute on hover/click.

---

## 15. Anti-patterns (reject on sight)

Every one of these has failed a design review in Cevi's history. They are the fingerprints of generic AI-generated SaaS.

### 15.1 Visual

- **Purple-to-blue gradients.** We are warm, not synthetic.
- **Cyan accents on dark bg.** Reads as generic "AI product."
- **Gradient text** (`background-clip: text` + gradient). Cheesy. One solid color for text.
- **Border-left stripes on cards/alerts** (not applied to genuine selected-row state — see §10.6 exception). Every admin dashboard does this and it always looks unintentional.
- **Glassmorphism everywhere.** Blur effects read as decoration, not function.
- **Drop shadows on resting cards.** Depth is 1px border + hover state.
- **Identical card grids with icon + heading + text repeated.** Vary hierarchy, density, composition.
- **Stock hero section with centered headline + gradient blob + "Get started free" CTA.**
- **Rounded rectangles with generic shadows.** Could be any generated output.

### 15.2 Layout

- **Symmetrical card grid** as default. Use asymmetry when it clarifies hierarchy.
- **Center-everything.** Left-aligned text with asymmetric layouts feels more designed.
- **Flat empty backgrounds with no atmosphere.** At least use `--cevi-surface-warm` for secondary panels.

### 15.3 Typography

- **Inter, Roboto, Open Sans, Arial, system defaults** for headings. We use EB Garamond.
- **Monospace as shorthand for "technical."** Only use mono for code, IDs, and aligned numeric columns.
- **Fake bold / stretched type.** Use real weights from the font family.

### 15.4 Motion

- **Bounce / elastic easing.** Unserious.
- **Motion on every hover.** Purposeful motion only.
- **`width` / `height` animations.** Use `transform` / `opacity`.

### 15.5 Copy

- **"cross-sell" / "upsell" anywhere.** Always "indicated services" or "recommended next step."
- **Marketing superlatives** ("revolutionary," "game-changing," "best-in-class"). We describe what it does.
- **Exclamation marks** for casual excitement.
- **Emoji** in any UI string. Lucide icons only.

### 15.6 Accessibility

- **Removing focus rings without replacement.**
- **Icon-only buttons without `aria-label`.**
- **Color as the only indicator of status.**
- **`user-scalable=no`** in viewport meta. Never disable zoom.

---

## 16. Drop-in: Next.js 16 + Tailwind v4

### 16.1 `src/app/globals.css`

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

  /* ── Motion ── */
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
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

input:focus-visible, textarea:focus-visible, select:focus-visible {
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

/* ── Motion kit ── */
@keyframes cevi-card-enter {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes cevi-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes cevi-scale-in {
  from { opacity: 0; transform: scale(0.98); }
  to   { opacity: 1; transform: scale(1); }
}

.cevi-card-enter     { animation: cevi-card-enter var(--duration-normal) var(--ease-out-quart) both; }
.cevi-card-enter-1   { animation-delay: 0ms; }
.cevi-card-enter-2   { animation-delay: 40ms; }
.cevi-card-enter-3   { animation-delay: 80ms; }
.cevi-card-enter-4   { animation-delay: 120ms; }
.cevi-card-enter-5   { animation-delay: 160ms; }
.cevi-fade-in        { animation: cevi-fade-in var(--duration-fast) var(--ease-out-quart) both; }
.cevi-scale-in       { animation: cevi-scale-in var(--duration-normal) var(--ease-out-quart) both; }

button:active:not(:disabled),
a:active {
  transform: scale(0.98);
  transition: transform 100ms ease-out;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  button:active:not(:disabled),
  a:active { transform: none; }
}
```

### 16.2 `src/lib/utils.ts`

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

### 16.3 `src/components/ui/button.tsx`

Copy the full Button component from §9.1. Reference implementation is in the Cevi Outreach repo at `dashboard/src/components/ui/button.tsx`.

### 16.4 `src/components/ui/card.tsx`

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

### 16.5 `src/components/ui/badge.tsx`

```tsx
"use client";

import { cn } from "@/lib/utils";

const variants = {
  default: "bg-[var(--cevi-surface)] text-[var(--cevi-text-secondary)]",
  coral:   "bg-[var(--cevi-coral-light)] text-[var(--cevi-coral)]",
  amber:   "bg-[var(--cevi-amber-light)] text-[var(--cevi-amber)]",
  jade:    "bg-[var(--cevi-jade-light)] text-[var(--cevi-jade)]",
  sand:    "bg-[var(--cevi-sand-light)] text-[var(--cevi-sand)]",
  teal:    "bg-[var(--cevi-teal-light)] text-[var(--cevi-teal)]",
  success: "bg-[var(--cevi-success-light)] text-[var(--cevi-success)]",
  error:   "bg-[var(--cevi-error-light)] text-[var(--cevi-error)]",
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

const sizes = { sm: "px-2 py-0.5 text-[10px]", md: "px-2.5 py-0.5 text-xs" } as const;

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
    <span className={cn("inline-flex items-center gap-1.5 rounded-full font-semibold uppercase tracking-[0.04em]", variants[variant], sizes[size], className)}>
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dotColors[variant], pulse && "animate-pulse")} />}
      {children}
    </span>
  );
}
```

### 16.6 `src/components/brand/CeviLogo.tsx`

Copy the full component from the Cevi Outreach repo at `dashboard/src/components/brand/CeviLogo.tsx`. Three sizes (sm/md/lg), inline SVG, terracotta dot on the "i," `currentColor` on the "cev" wordmark. Full SVG path strings are included there.

---

## 17. Tokens as JSON (for other platforms)

For iOS / Android / Figma tooling / design token transformers (Style Dictionary, Tokens Studio):

```json
{
  "cevi": {
    "brand": {
      "accent":       { "value": "#E35336" },
      "accent_hover": { "value": "#D04A2E" },
      "accent_light": { "value": "#FEF7F5" },
      "accent_bg":    { "value": "#FDF5EC" }
    },
    "text": {
      "primary":   { "value": "#1a1a1a" },
      "secondary": { "value": "#333333" },
      "tertiary":  { "value": "#555555" },
      "muted":     { "value": "#77736D" },
      "faint":     { "value": "#9A9A96" }
    },
    "surface": {
      "bg":           { "value": "#FFFFFF" },
      "surface":      { "value": "#F6F4F2" },
      "surface_warm": { "value": "#FAFAF8" },
      "border":       { "value": "#E3E2DE" },
      "border_light": { "value": "#EDECEA" }
    },
    "status": {
      "success":       { "value": "#2D7A54" },
      "success_light": { "value": "#EDFAF3" },
      "error":         { "value": "#E35336" },
      "error_light":   { "value": "#FEF7F5" }
    },
    "categorical": {
      "coral": { "value": "#F4845F" },
      "amber": { "value": "#F7B267" },
      "jade":  { "value": "#7EC4A5" },
      "sand":  { "value": "#D4A574" },
      "teal":  { "value": "#6CB4C4" }
    },
    "spacing": {
      "xs":  { "value": "4px" },
      "sm":  { "value": "8px" },
      "md":  { "value": "16px" },
      "lg":  { "value": "24px" },
      "xl":  { "value": "32px" },
      "2xl": { "value": "48px" },
      "3xl": { "value": "64px" }
    },
    "radius": {
      "sm":   { "value": "4px" },
      "md":   { "value": "8px" },
      "lg":   { "value": "12px" },
      "xl":   { "value": "16px" },
      "full": { "value": "9999px" }
    },
    "motion": {
      "duration_fast":   { "value": "150ms" },
      "duration_normal": { "value": "200ms" },
      "ease_out_quart":  { "value": "cubic-bezier(0.25, 1, 0.5, 1)" }
    },
    "typography": {
      "body_family":    { "value": "DM Sans" },
      "heading_family": { "value": "EB Garamond" },
      "mono_family":    { "value": "SF Mono, ui-monospace, monospace" },
      "dashboard_body_size": { "value": "13px" },
      "marketing_body_size": { "value": "15px" }
    }
  }
}
```

---

## 18. File manifest for a new product

Minimum viable file tree to reach pixel-parity with Cevi Outreach:

```
src/
├── app/
│   ├── globals.css            ← §16.1 verbatim
│   └── layout.tsx             ← §5.2 DM Sans + EB Garamond wiring
├── components/
│   ├── brand/
│   │   └── CeviLogo.tsx       ← §16.6
│   ├── ui/
│   │   ├── button.tsx         ← §9.1 + §16.3
│   │   ├── card.tsx           ← §16.4
│   │   ├── badge.tsx          ← §16.5
│   │   ├── input.tsx          ← §9.4 pattern
│   │   ├── dropdown.tsx       ← §9.5 Radix wrapper
│   │   ├── states.tsx         ← EmptyState / ErrorState / Skeleton
│   │   └── index.ts           ← re-exports
│   ├── shell/
│   │   ├── Sidebar.tsx        ← §10.2
│   │   ├── Topbar.tsx         ← §10.1 topbar
│   │   └── MobileNav.tsx      ← mobile drawer (§11)
│   └── analytics/
│       └── chart-tokens.ts    ← §13.1
└── lib/
    └── utils.ts               ← §16.2
```

Any additional component a new product creates should live under `src/components/<feature>/`. Follow the four rules in §9 for every new primitive.

---

## 19. Governance: ADR process

When you need to deviate from this doc — a different accent color for a sub-brand, a third font, a new categorical palette — **raise an Architecture Decision Record** under `docs/adr/NNN-<slug>.md` with:

1. **Context** — what product requirement created the need
2. **Decision** — what you're changing
3. **Alternatives considered** — what you rejected and why
4. **Consequences** — what this breaks, what it enables
5. **Status** — Proposed / Accepted / Superseded

When the ADR is accepted, **this doc is updated in the same PR** so it never drifts from reality.

> Repeat: **if the live product disagrees with this doc, the code wins until an ADR raises and lands the correction.**

---

## Appendix — Changelog

| Version | Date | Scope |
|---|---|---|
| 1.0 | 2026-04-20 | Initial extraction from Cevi Outreach dashboard (S1) |
| 2.0 | 2026-04-23 | S0–S8 final: adds motion kit, logo system, chart tokens, inbox patterns, audit table spec, Desert Mirage categorical guidance, writing voice, full ADR framework |

---

*End of design system. For any question not answered here, the canonical code is in the Cevi Outreach repo's `dashboard/` directory. Copy patterns; never invent.*
