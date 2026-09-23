# Covet — Design System

Single source of truth for the Covet multi-vendor marketplace UI. Every color, font,
radius, shadow, and spacing value below is a token. **Never hardcode a hex, px font
size, or one-off radius in a component** — reference a token (Tailwind theme key or CSS
variable). If something isn't in here, add it here first, then use it.

Stack assumption: **Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui + lucide-react**.
Charts: **Chart.js** (via `react-chartjs-2`).

---

## 1. Brand

- **Name:** Covet
- **Wordmark:** `Covet` in Sora 800 with a colored period — `Covet` + `<span class="text-primary">.</span>`
- **Primary color:** Iris violet `#6544E0` — used as an **accent**, never a flood. Buttons,
  active nav, links, focus rings, key figures. Large surfaces stay neutral/white.

---

## 2. Color tokens

Define once as CSS custom properties on `:root` (globals.css) and mirror into
`tailwind.config`. Values are the canonical hex.

### Brand — Iris scale
| Token | Hex | Use |
|---|---|---|
| `--iris-50`  | `#F5F2FF` | tinted backgrounds, hover wash |
| `--iris-100` | `#EBE6FE` | badges, chips, focus ring halo |
| `--iris-200` | `#D8CEFE` | borders on tinted surfaces |
| `--iris-300` | `#BCA9FB` | decorative, disabled primary |
| `--iris-400` | `#9B7DF5` | icon accents on dark |
| `--iris-500` | `#6544E0` | **primary** — buttons, links, active |
| `--iris-600` | `#5636C6` | primary hover |
| `--iris-700` | `#472BA3` | text on iris-100 badges |
| `--iris-800` | `#392585` | gradients |
| `--iris-900` | `#2E1F6B` | gradient end, hero |

Primary button gradient / hero: `linear-gradient(135deg, #6544E0, #472BA3)` or
`(120deg, #2E1F6B, #472BA3, #6544E0)`.

### Neutrals (warm-cool near-grey, low chroma)
| Token | Hex | Use |
|---|---|---|
| `--ink`        | `#17151F` | primary text, headings, dark UI (rail/footer) |
| `--ink-soft`   | `#3A3745` | body text |
| `--muted`      | `#75727F` | secondary text, labels |
| `--muted-soft` | `#A5A2AE` | placeholder, meta, disabled text |
| `--line`       | `#ECECF1` | default borders, dividers |
| `--line-soft`  | `#F1F0F4` | card borders, subtle dividers |
| `--surface`    | `#FFFFFF` | cards |
| `--bg`         | `#FAFAFA` | storefront page background |
| `--bg-dash`    | `#F4F3F7` | dashboard page background |
| `--bg-subtle`  | `#FBFAFC` | inset inputs, zebra, filled field |
| `--field`      | `#F5F4F7` | search/input fill |

### Status (each has a soft bg + a readable fg)
| Status | fg | soft bg | Applies to |
|---|---|---|---|
| success | `#2E7D53` | `#E6F5EE` | Paid, Delivered, Approved, Active, In-Stock |
| warning | `#B4741C` | `#FBEFDD` | Pending, Packaging, Out for delivery, Soon Stock Out |
| error   | `#C0403F` | `#FDECEC` | Canceled, Failed, Rejected, Unpaid, Out of Stock |
| info    | `#2C5E9E` | `#EAF1FC` | Confirmed, Shipped, Open, Returned |
| accent  | `#472BA3` | `#EBE6FE` | discount badges, "New", generic tags |

Base status hues (solid, for icons/dots/chart series): success `#2E9E6B`,
warning `#E0912F`, error `#E5484D`, info `#4C7DF0`, star/rating `#E8A13A`.

### Links
```css
a { color: var(--iris-500); }
a:hover { color: var(--iris-600); }
```

---

## 3. Typography

Two Google fonts. Load with `next/font/google` and expose as CSS variables.

- **Display / headings / prices / numbers:** **Sora** — weights 400/500/600/700/800
- **Body / UI / labels:** **Instrument Sans** — weights 400/500/600/700
- **Mono (spec labels, code, tiny meta only):** `ui-monospace, Menlo, monospace`

> Do **not** use Inter, Roboto, or Arial.

Base: `html { font-size: 17px }` (the app reads ~6% larger than default, like 110% zoom).

### Type scale
| Role | Font / weight / size / line |
|---|---|
| Display | Sora 800 · 46px · 1.05 · `-0.02em` |
| H1 | Sora 700–800 · 24–34px · 1.1 · `-0.01em` |
| H2 (section) | Sora 700 · 22–27px · 1.1 |
| H3 (card title) | Sora 700 · 15–17px · 1 |
| Body | Instrument Sans 400 · 14px · 1.5 |
| Body-strong / control | Instrument Sans 500–600 · 13–14px |
| Small / meta | Instrument Sans 400 · 12–12.5px |
| Caption / uppercase label | Instrument Sans 600 · 11px · `.06em` · uppercase · `--muted-soft` |
| Price (card) | Sora 700 · 17px · `--ink` |
| Stat figure | Sora 800 · 20–28px · `--ink` |

Compare-at price: `--muted-soft`, `line-through`. Prices in Sora, always.

---

## 4. Spacing — 8px grid

Scale: `4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64, 72, 80, 96`.
Tailwind's default 4px step already covers this — use `gap-`, `p-`, `space-y-` etc.
**Lay groups out with flex/grid + `gap`, never per-item margins or source whitespace.**

Container tokens:
```css
--container-max: 1600px;
--container-pad-desktop: 40px;  /* ≥1025px */
--container-pad-tablet: 24px;   /* ≤1024px */
--container-pad-mobile: 16px;   /* ≤640px  */
```
Content wrapper: `max-width: var(--container-max); margin-inline: auto; padding-inline: var(--cpad)`.

---

## 5. Radius

| Token | px | Use |
|---|---|---|
| `--r-sm` | 8 | chips, small controls, table action buttons |
| `--r-md` | 10–11 | buttons, inputs, selects |
| `--r-lg` | 12–14 | inner cards, popovers |
| `--r-xl` | 16–18 | primary cards, panels |
| `--r-2xl` | 20–22 | modals, hero, feature panels |
| `--r-full` | 999px | pills, badges, avatars, toggles |

Radii are consistent per element class — all primary cards share `--r-xl`.

---

## 6. Elevation (shadows)

Soft, low-opacity, tinted with ink. **Prefer elevation + a hairline border over hard boxes.**
| Token | Value | Use |
|---|---|---|
| `--shadow-xs` | `0 1px 2px rgba(20,18,31,.05)` | resting cards |
| `--shadow-sm` | `0 4px 12px -2px rgba(20,18,31,.12)` | dropdown, low popover |
| `--shadow-md` | `0 16px 34px -14px rgba(20,18,31,.18)` | card hover lift |
| `--shadow-lg` | `0 26px 64px -16px rgba(20,18,31,.28)` | mega-menu, cart popup |
| `--shadow-xl` | `0 40px 90px -20px rgba(20,18,31,.5)` | modal |

Card hover: `translateY(-3px)` + `--shadow-md`, `transition: box-shadow .25s, transform .25s`.

---

## 7. Focus & interaction

- **Focus ring:** `border-color: var(--iris-500); box-shadow: 0 0 0 3px var(--iris-100)`
  (on the field wrapper via `:focus-within`, or the control via `:focus`).
- **Transitions:** `.15s–.25s ease` on background, color, box-shadow, transform. Everything
  interactive has a hover state.
- **Hit targets:** ≥ 44px on mobile.

---

## 8. Core components (map 1:1 to shadcn/ui)

Build these as reusable components. shadcn names in **bold**.

- **Button** — variants: `primary` (iris fill, white text, hover iris-600),
  `secondary`/`outline` (white, `--line` border, hover `--field`), `ghost`, `destructive`
  (error fg on error-soft). Height 44–48px, radius `--r-md`, Sora 700 label.
- **Input / Textarea / Select** — height 46–48px, `--r-md`, bg `--bg-subtle`, `--line`
  border, focus ring token. Selects use a custom chevron (lucide `chevron-down`).
- **Card** — `--surface`, `1px solid --line-soft`, `--r-xl`, `--shadow-xs`, padding 22–28px.
- **Badge** — pill, `--r-full`, status soft-bg + fg from §2. Size: 5px×11px pad, 11px 600.
- **Tabs** — pill group on `--bg-dash`/`#EDECF1` track; active = white pill + `--shadow-xs`,
  or underline tabs (2px `--iris-500` bottom border) for section tabs.
- **Table** — header row `--field` bg, 11px 600 uppercase `--muted` labels; rows divided by
  `--line-soft`; row hover `--bg-subtle`; wrap in `overflow-x:auto` + a `min-width` inner
  div so columns never collapse. Status cells use **Badge**.
- **Toggle/Switch** — 38×22 track, `--r-full`, on = iris fill knob-right, off = `#E4E2E9`.
- **Dropdown / Popover / Dialog(Modal)** — surface + `--shadow-lg`/`--shadow-xl`, `--r-2xl`
  for modals. Backdrop `rgba(20,18,31,.55)` + `backdrop-blur(3px)`.
- **Avatar** — circle, `linear-gradient(135deg,#EBE6FE,#F5F2FF)` bg + iris icon fallback.
- **Skeleton** — shimmer: `linear-gradient(90deg,#EDECF1 25%,#F7F6F9 50%,#EDECF1 75%)`,
  `background-size:400px 100%`, `animation: shimmer 1.4s infinite linear`.
- **Charts** — Chart.js. Line: iris stroke `#6544E0` 2.5px, area gradient
  `rgba(101,68,224,.22)→0`, tension .4, no point until hover, grid `#F1F0F4` dashed,
  ticks `--muted-soft` in Instrument Sans. Series palette: `#6544E0, #2E9E6B, #E0912F, #17151F`.
  Donut cutout 72%.

### Product card (the most important marketplace component)
Every product card **must** show: image · discount badge · title · **SELLER NAME** ·
price + compare-at · rating + review count · wishlist toggle · add-to-cart. The seller
line is non-negotiable — it's what makes this a marketplace.

---

## 9. Layout shells

- **Storefront** — top utility bar (`--ink`) → sticky header (logo, All-Categories
  mega-menu on hover, full-width search, wishlist/account/cart) → mega-nav → content on
  `--bg` → dark footer. Header mega-menu and cart popup open on hover with a **padding
  bridge** (no margin gap) so the pointer can travel into the panel without it closing.
- **Customer dashboard** — storefront header/footer + left account sidebar (icon rows,
  active = iris-50 bg + iris text) + white content card.
- **Seller / Admin dashboard** — dark 64px **icon rail** + 236px white **sidebar**
  (grouped nav, uppercase group labels) + 64px topbar (sidebar toggle, breadcrumb, search,
  notifications, profile dropdown-on-hover with padding bridge) + content on `--bg-dash`.

---

## 10. Required states

Every data view ships four states: **default**, **loading (skeleton)**, **empty**
(icon + message + primary action), **error** (error-tone icon + retry button). Design all
four; never leave a bare spinner or blank.

---

## 11. Marketplace rules (never break)

1. Every product visibly shows **which seller** it comes from.
2. Carts group items under a **seller header**.
3. Orders **split by seller**.
4. Sellers only ever see **their own data**.

---

## 12. Not in this product (do not build)

Auctions · Publication House / Authors / Creators filters · Chat-with-vendor (we use an
**AI support agent**) · Cash on Delivery (**Stripe-only**) · Google Maps address picker ·
currency / language switchers.

---

## 13. Content

Real content only — real product names, sellers, prices, categories. No lorem ipsum, no
"Product 1". No emoji in UI. No AI-slop tropes (aggressive gradients everywhere, left-border
accent cards, stat-padding). Less is more; every element earns its place.

---

## 14. `:root` starter (globals.css)

```css
:root{
  /* brand */
  --iris-50:#F5F2FF; --iris-100:#EBE6FE; --iris-200:#D8CEFE; --iris-300:#BCA9FB;
  --iris-400:#9B7DF5; --iris-500:#6544E0; --iris-600:#5636C6; --iris-700:#472BA3;
  --iris-800:#392585; --iris-900:#2E1F6B;
  --primary:var(--iris-500);
  /* neutrals */
  --ink:#17151F; --ink-soft:#3A3745; --muted:#75727F; --muted-soft:#A5A2AE;
  --line:#ECECF1; --line-soft:#F1F0F4; --surface:#FFFFFF;
  --bg:#FAFAFA; --bg-dash:#F4F3F7; --bg-subtle:#FBFAFC; --field:#F5F4F7;
  /* status */
  --success:#2E7D53; --success-bg:#E6F5EE; --warning:#B4741C; --warning-bg:#FBEFDD;
  --error:#C0403F; --error-bg:#FDECEC; --info:#2C5E9E; --info-bg:#EAF1FC;
  --accent-fg:#472BA3; --accent-bg:#EBE6FE; --star:#E8A13A;
  /* layout */
  --container-max:1600px; --cpad:40px;
  /* radius */
  --r-sm:8px; --r-md:11px; --r-lg:14px; --r-xl:18px; --r-2xl:22px; --r-full:999px;
  /* elevation */
  --shadow-xs:0 1px 2px rgba(20,18,31,.05);
  --shadow-sm:0 4px 12px -2px rgba(20,18,31,.12);
  --shadow-md:0 16px 34px -14px rgba(20,18,31,.18);
  --shadow-lg:0 26px 64px -16px rgba(20,18,31,.28);
  --shadow-xl:0 40px 90px -20px rgba(20,18,31,.5);
}
@media (max-width:1024px){ :root{ --cpad:24px } }
@media (max-width:640px){ :root{ --cpad:16px } }
@keyframes shimmer{0%{background-position:-450px 0}100%{background-position:450px 0}}
```
