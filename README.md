# FIZZ5

Codename: `fizz5`

Marketing and commerce rebuild for FIZZ5, ported from the Webflow export in `fizz5.webflow/` into a Vite + TypeScript app served by a Cloudflare Worker.

## Site map (Vite app)

| Route | File | Description |
|-------|------|-------------|
| `/` | `index.html` | Home — hero carousel, intro, gated Lottie transition, bottle marquee shop panel |
| `/explore.html` | `explore.html` | Z-scroll 3D product facts experience |
| `/shop.html` | `shop.html` | Category carousel (Bottles, Flavors, CO₂) — viewport locked |
| `/bottles.html` | `bottles.html` | Six-color bottle collection grid |
| `/products/{slug}.html` | `products/*.html` | Product detail pages (PDP) — hero, specs, how it works, care |
| `/flavors.html`, `/co2.html` | placeholders | Collection shells for upcoming categories |

Product slugs: `arctic-white`, `charcoal-black`, `coral-orange`, `electric-blue`, `sage-green`, `steel-navy`.

Barba.js handles page transitions with a shared Lottie overlay (`src/lib/exploreTransition.ts`).

## Architecture

```
index.html / shop / explore / products
        ↓
   src/main.ts  →  typography, buttons, global, shop, z-scroll CSS
        ↓
   src/lib/       →  hero, lottie scroll, shop, productPage, zScroll
        ↓
   vite build     →  dist/  →  Cloudflare Worker (static + /api/*)
```

- **`fizz5.webflow/`** — read-only Webflow reference (do not edit at runtime).
- **`src/lib/shopData.ts`** — bottle catalog, copy, specs, Shopify ID placeholders.
- **`public/images/bottles/`** — bottle PNGs and lineup asset.

## UI system

Buttons use a single pattern: **`fizz-btn`** + one variant (`--primary`, `--outline`, `--ghost`). See [`docs/UI-CLASSES.md`](docs/UI-CLASSES.md).

Typography tokens: `fizz-heading`, `fizz-lead`, `fizz-label`, `fizz-eyebrow`.

## Development

```bash
npm install
npm run dev          # Vite dev server (http://localhost:5173)
npm run build        # Production build → dist/
npm run preview      # Preview production build
npm run lint:all     # ESLint + typecheck + Stylelint + deprecated-class guard
```

| Script | Purpose |
|--------|---------|
| `npm run lint` | ESLint on TypeScript |
| `npm run lint:css` | Stylelint on `src/styles/**/*.css` |
| `npm run lint:css:deprecated` | Fail if removed CTA classes (`card-cta`, etc.) are reintroduced |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run assets:bottles` | Copy bottle renders into `public/images/bottles/` |

## Shopify / CMS

Product copy and specs live in `src/lib/shopData.ts`. A Shopify import CSV template was generated separately for six bottle SKUs (Title, handle, $34 / $44 compare-at, specs in description). Wire `shopifyProductId` / `shopifyVariantId` in `shopData.ts` when the store is connected.

## Docs

- [`INSTRUCTIONS.md`](INSTRUCTIONS.md) — project queue and Webflow MCP notes
- [`docs/UI-CLASSES.md`](docs/UI-CLASSES.md) — CSS class conventions
- [`docs/WEBFLOW-MCP-INSPECTION.md`](docs/WEBFLOW-MCP-INSPECTION.md) — IX2 / Lottie reference
- [`docs/WEBFLOW-WARP-SLIDER.md`](docs/WEBFLOW-WARP-SLIDER.md) — shop slider notes

## CI

Pull requests run lint, Stylelint, typecheck, and build via [`.github/workflows/ci.yml`](.github/workflows/ci.yml).
