# HiveClaw dashboard UI — design reference

Use this document when changing the **Next.js dashboard** (`apps/hiveclaw-dashboard`), especially the **marketing landing** (`components/landing/`) and future **in-app** surfaces so they stay visually aligned.

The landing page was ported from the Hivemind prototype (`HiveClaw.html`, `hiveclaw-components.jsx`). The **Tweaks** shell (`tweaks-panel.jsx`) was editor-only and is **not** shipped in production; defaults below reflect that prototype.

---

## Brand palette (`C`)

| Token | Hex | Role |
|--------|-----|------|
| **Green** | `#0acf83` | 0G Storage, success, agents row |
| **Orange** | `#f24e1e` | 0G Chain, accents, hero “on 0G” |
| **Purple** | `#a259ff` | Primary accent, hive / shared memory, features |
| **Red** | `#ff7262` | Demo / caution |
| **Blue** | `#1abcfe` | Private memory, API sections |
| **Background** | `#ffffff` | Page |
| **Background alt** | `#fafafa` | Scrollbar track |
| **Text** | `#0f0f14` | Body headings |
| **Muted** | `#6e6e78` | Secondary text |
| **Border** | `#e5e5ea` | Dividers, cards |

**Default hero / CTA accent:** `#a259ff` (purple). Sections **rotate** accent colors (orange problem, purple solution, blue memory examples, etc.) so the page stays multi-hue, not monochrome.

---

## Typography

Loaded via **Next.js `next/font/google`** in `app/layout.tsx`:

| Role | Font | CSS variable |
|------|------|----------------|
| Display / H1–H2 | Plus Jakarta Sans | `var(--font-plus-jakarta)` |
| Body / UI | Inter | `var(--font-inter)` |
| Code | JetBrains Mono | `var(--font-jetbrains)` |

**Implementation:** inline `style={{ fontFamily: "var(--font-plus-jakarta), 'Plus Jakarta Sans', sans-serif", ... }}` (with fallbacks) in landing components.

**Scale (marketing):** large headings use `clamp()` (e.g. hero `clamp(32px, 5vw, 64px)`). Body ~16–18px on hero; section subtitles ~17px.

---

## Layout

- **Max content width:** `1280px`, horizontal padding `32px`.
- **Section vertical padding:** `96px` top/bottom (see `Section` in `primitives.tsx`).
- **Tinted sections:** `accent + "0d"` (~5% opacity) when `tint` is true.

Responsive rules live in **`app/globals.css`** under **`.hc-landing`** (max-width `768px`): stack grids, hide hero illustration, hide nav text links, stack demo flow, etc. Match any new section to those class names (`three-col`, `two-col`, `hero-inner`, …) or extend the same pattern.

---

## Components (landing)

| Piece | File | Notes |
|--------|------|--------|
| Pill badges, section shell, cards, buttons, nav, code block, mem cards, feature cards, demo flow | `components/landing/primitives.tsx` | `Btn` uses `next/link` for internal `href`s starting with `/`. |
| Hero + architecture SVGs | `components/landing/diagrams.tsx` | SVG `filter` ids prefixed (`hc-softblur`) to avoid clashes. |
| All sections + `LandingPage` | `components/landing/landing-sections.tsx` | Composes the full page. |
| Color constants | `components/landing/colors.ts` | `DEFAULT_HERO_ACCENT`. |

**Cards:** white surface, `1px` `C.border`, radius **16px**, hover lift + soft shadow.

**Primary button:** fill `accent`, white text, radius **8px**, padding ~`12px 24px`. **Outline:** transparent / `accent` border.

**Code blocks:** dark bar `#13111a`, body `#1a1825`, monospace, copy control in header.

---

## Dashboard vs marketing

- **Landing** is wrapped with **`hc-landing`** for scoped responsive overrides.
- **Utility routes** (`/status`, `/hive`) use `<main className="app-shell">` and shared **`main.app-shell`** rules in `globals.css` (padding, `<pre>` styling).

Keep new **tooling / data** views consistent with landing **colors and radius** where possible (purple accent for primary actions, Inter, soft borders).

---

## External links

- **`NEXT_PUBLIC_GITHUB_URL`** (optional): if set in `.env`, **View GitHub** and the footer **GitHub** link use it; otherwise they fall back to `#`.

---

## Figma / product notes (uploads reference)

From the playful SaaS reference (`uploads/figma.md`):

- **Mood:** welcoming, expressive; multiple brand hues coexisting.
- **Depth:** soft shadows on cards; generous radius (12–24px); avoid neumorphism.
- **Don’t:** single hue across the whole page, razor-thin radius, dark-by-default.

---

## File map

```
apps/hiveclaw-dashboard/
├── app/
│   ├── globals.css          # base + .hc-landing breakpoints + .app-shell
│   ├── layout.tsx           # fonts + metadata
│   └── page.tsx             # landing entry
├── components/landing/
│   ├── colors.ts
│   ├── primitives.tsx
│   ├── diagrams.tsx
│   └── landing-sections.tsx
└── design.md                # this file
```

When making large UI changes, update **this file** if tokens, breakpoints, or layout rules change.
