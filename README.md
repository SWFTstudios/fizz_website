# FIZZ5

Codename: **`fizz5`**

Marketing site rebuild for [fizz5.webflow.io](https://fizz5.webflow.io/). The live Webflow export in `fizz5.webflow/` is the **design reference only**; the runtime is a Vite + TypeScript app served by a single Cloudflare Worker.

This README is the living build log — update it as features land.

---

## Table of contents

- [What exists today](#what-exists-today)
- [Site map (Vite app)](#site-map-vite-app)
- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [How the app is built](#how-the-app-is-built)
- [Runtime architecture](#runtime-architecture)
- [Home page](#home-page)
- [Shop and product pages](#shop-and-product-pages)
- [Explore page (3D z-scroll)](#explore-page-3d-z-scroll)
- [Page transitions (Barba + Lottie)](#page-transitions-barba--lottie)
- [UI system](#ui-system)
- [Cloudflare Worker](#cloudflare-worker)
- [Development](#development)
- [Shopify / CMS](#shopify--cms)
- [Deployment](#deployment)
- [Migration status](#migration-status)
- [Further reading](#further-reading)

---

## What exists today

| Area | Status |
|------|--------|
| Vite + TypeScript frontend | ✅ |
| Multi-page build (`/`, `/explore`, `/shop`, `/bottles`, `/products/*`, `/flavors`, `/co2`) | ✅ |
| Cloudflare Worker + static assets binding | ✅ Scaffolded |
| Homepage hero (slider, marquee, scroll scale) | ✅ Partial parity |
| Homepage scroll-scrub Lottie (`sticky-track`) | ✅ |
| In-page Shop CTA + gated post-intro bottle marquee | ✅ |
| Site-wide Barba.js page transitions | ✅ |
| Explore 3D z-scroll experience | ✅ Ported to TS |
| Shop category carousel (`/shop.html`) | ✅ |
| Bottles collection grid + six PDPs | ✅ |
| Unified `fizz-btn` design system | ✅ |
| Stylelint + `lint:all` + deprecated CTA guard | ✅ |
| Shopify Storefront API proxy | 🔲 Scaffold only |
| Full homepage content / CMS sections | 🔲 Placeholder |
| Nav search Lottie, image trail, promo strip | 🔲 Not started |

---

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

---

## Tech stack

| Layer | Choice | Why |
|-------|--------|-----|
| Build | [Vite 6](https://vite.dev/) | Fast dev server, multi-page HTML entries |
| Language | TypeScript (strict) | Typed ports from Webflow interactions |
| Animations | [GSAP](https://gsap.com/) + ScrollTrigger | Replaces Webflow IX2 scroll choreography |
| Lottie | [lottie-web](https://github.com/airbnb/lottie-web) | Full-page transitions + scroll-scrub on home |
| Routing | [@barba/core](https://barba.js.org/) + `@barba/prefetch` | SPA-like transitions without jQuery SmoothState |
| Carousels | [Splide](https://splidejs.com/) | Home shop marquee + shop category slider |
| Hosting | Cloudflare Workers + Workers Static Assets | One deploy for UI + `/api/*` |
| Reference | Webflow export (`fizz5.webflow/`) | Read-only; never executed at runtime |

---

## Repository layout

```
fizz5/
├── fizz5.webflow/          # Webflow export — reference only, do not edit at runtime
├── public/
│   ├── css/                # Ported Webflow CSS (webflow.css, fizz5.webflow.css)
│   ├── images/             # Static images (incl. bottles/)
│   ├── videos/             # Hero / intro video assets
│   └── lottie/             # fizz-lottie-transition.json (from Webflow documents/)
├── products/                 # Six bottle PDP HTML shells (slug per file)
├── src/
│   ├── main.ts             # Single JS entry for all pages
│   ├── lib/
│   │   ├── exploreTransition.ts   # Barba init, views, page shell helpers
│   │   ├── heroHome.ts            # Hero slider, logo marquee, nav toggle
│   │   ├── heroScroll.ts          # Hero-track scroll scale (300vh)
│   │   ├── lottieScroll.ts        # Lottie overlay + sticky-track scrub
│   │   ├── zScroll.ts             # Explore 3D card scroll (ported from fizzzscroll)
│   │   ├── shop.ts                # Shop carousel + bottles collection grid
│   │   ├── shopData.ts            # Bottle catalog, specs, Shopify ID placeholders
│   │   ├── shopMarquee.ts         # Home post-intro bottle marquee
│   │   └── productPage.ts         # PDP hydration from shopData
│   ├── styles/
│   │   ├── typography.css         # fizz-heading, fizz-lead, fizz-label tokens
│   │   ├── buttons.css            # fizz-btn primary / outline / ghost
│   │   ├── global.css             # Resets, Lottie overlay, shared tokens
│   │   ├── home-overrides.css     # Homepage-specific layout fixes
│   │   ├── shop.css               # Shop, collection, PDP layout
│   │   └── z-scroll.css           # Explore HUD, loader, modal, scene
│   ├── types/barba.d.ts           # Minimal Barba module stubs
│   └── worker/                    # Cloudflare Worker (/api/*)
├── index.html              # Home — data-barba-namespace="home"
├── explore.html            # Explore — data-barba-namespace="explore"
├── shop.html               # Shop — data-barba-namespace="shop"
├── bottles.html            # Bottles — data-barba-namespace="bottles"
├── flavors.html            # Flavors placeholder — shop-collection
├── co2.html                # CO₂ placeholder — shop-collection
├── vite.config.ts          # Multi-page Rollup inputs (shop + products)
├── stylelint.config.js     # CSS lint rules
├── wrangler.jsonc          # Worker + dist/ assets binding
├── INSTRUCTIONS.md         # Active migration to-do queue (for Cursor sessions)
└── docs/                   # Architecture, migration, UI classes, Webflow MCP
```

**Rule:** Port from `fizz5.webflow/` into `src/` and `public/`. Do not depend on Webflow's runtime JS except where CSS class names require it.

---

## How the app is built

Vite treats each HTML file as an entry point:

```ts
// vite.config.ts (simplified)
rollupOptions: {
  input: {
    main: "index.html",
    explore: "explore.html",
    shop: "shop.html",
    bottles: "bottles.html",
    flavors: "flavors.html",
    co2: "co2.html",
    "product-arctic-white": "products/arctic-white.html",
    // …five more product-* entries
  },
}
```

All pages load the **same module**:

```html
<script type="module" src="/src/main.ts"></script>
```

Barba keeps one JavaScript runtime alive across navigations — there is no separate per-page bundle. On first load, `bootCurrentPage()` reads `[data-barba-namespace]` and initializes the matching page shell.

Build output goes to `dist/`; the Worker serves it via the `ASSETS` binding.

---

## Runtime architecture

```
┌─────────────────────────────────────────────────────────────┐
│  <body data-barba="wrapper">                                │
│    ┌─────────────────────────────────────────────────────┐  │
│    │  #main  data-barba="container"                      │  │
│    │  namespace: home | explore | shop | bottles |       │  │
│    │            product | shop-collection                │  │
│    │  ← Barba swaps this HTML on internal navigation     │  │
│    └─────────────────────────────────────────────────────┘  │
│    #lottie-overlay  ← persistent outside container          │
│    main.ts → initExploreTransition(refreshHomePage)         │
└─────────────────────────────────────────────────────────────┘
```

**Initialization order (`main.ts`):**

1. Register GSAP ScrollTrigger
2. Wire in-page hash navigation (respecting post-intro gate for `#shop`)
3. `initExploreTransition(refreshHomePage)` — Barba + Lottie overlay
4. Shop CTA handler — same-page `#shop` via `unlockPostIntro()` + marquee panel

---

## Home page

**Markup:** Ported from `fizz5.webflow/index.html` into `index.html`, with Webflow CSS linked from `public/css/`.

**Key sections:**

| Section | Webflow class | Height / behavior | Implementation |
|---------|---------------|-------------------|----------------|
| Hero track | `.hero-track` | `300vh`, sticky video | `heroScroll.ts` — GSAP scale scrub on `.video-bg_wrapper` |
| Hero slider | `.hero-slider` | 2 slides, theme swap | `heroHome.ts` — light/dark themes (`#a8d0e4` / `#030303`) |
| Logo row | `.logo-carousel` | Marquee | `heroHome.ts` — CSS animation (Webflow used IX2 scroll) |
| Intro | `.intro-section` | `100vh` sticky | Markup + video; IX2 entrance not yet ported |
| Sticky Lottie | `.sticky-track` | `500vh` track, `100vh` sticky Lottie | `lottieScroll.ts` — ScrollTrigger scrubs frames |
| Post-intro content | `#post-intro` | Gated until Shop/Explore CTA | `unlockPostIntro()` reveals scroll Lottie + `#shop` marquee |

**Scroll-scrub Lottie math:** User scrolls through **500vh** of `.sticky-track` while the Lottie layer stays **100vh** sticky. Frame index = `progress × (totalFrames − 1)`. Same formula as Webflow IX2.

**CTAs:**

| Link | Target | Behavior |
|------|--------|------------|
| Explore | `/explore.html` | Barba transition + full-viewport Lottie |
| Shop | `#shop` | In-page unlock + bottle marquee (`data-barba-prevent="self"`) |
| Nav anchors | `#shop`, etc. | `data-barba-prevent="self"` — smooth scroll, no Barba |

---

## Shop and product pages

### Category carousel (`/shop.html`)

- Full-viewport Splide slider for Bottles, Flavors, CO₂ (`src/lib/shop.ts`)
- Document scroll is **locked** only when `.shop-splide` is present (carousel pages)

### Collection + PDPs

- **`/bottles.html`** — grid rendered from `BOTTLE_PRODUCTS` in `shopData.ts`
- **`/products/{slug}.html`** — static shells hydrated by `productPage.ts` (title, price, hero, specs, how-it-works, care)
- **`/flavors.html`**, **`/co2.html`** — placeholder collection pages

### Scroll behavior

- `body.product-detail-page` and `body.shop-collection-page` allow normal document scroll
- Barba `beforeEnter` / `beforeLeave` in `exploreTransition.ts` toggles shell classes and clears carousel `overflow` locks

---

## Explore page (3D z-scroll)

**Markup:** `explore.html` — ported from `fizz5.webflow/z-scroll-page.html`.

**Implementation:** `src/lib/zScroll.ts` + `src/styles/z-scroll.css` replace the Webflow site scripts:

| Webflow script | Purpose | Vite replacement |
|----------------|---------|------------------|
| `fizzzscrollcss0/1` | Inject 3D card CSS | `z-scroll.css` |
| `fizzzscrolljs01` | Camera scroll along Z axis | `zScroll.ts` |
| `fizzzscrolljs02` | Init `.viewport` roots | `runLoaderThenInit()` |

**Features:**

- Loader with progress (`#zs-loader-pct`)
- Camera HUD (REC, ISO, scroll hint, clock)
- 3D card stack with parallax, blur, and modal detail view
- Fallback product facts when CMS data is absent (`#cms-data`)
- `destroyZScroll()` on Barba leave; `bootExplorePage()` on Barba enter

**Direct visit:** Opening `/explore.html` runs the full loader.

---

## Page transitions (Barba + Lottie)

SmoothState was replaced because its fixed timer raced the Lottie duration and only swapped HTML without booting page scripts.

**Flow:**

```
User clicks /explore.html
  → Barba prefetches explore.html (parallel)
  → leave(): await playLottieTransition()  // resolves on Lottie "complete"
  → overlay gets .is-waiting (visible, pointer-events: none)
  → Barba swaps #main container
  → enter(): await playPageLoadTransition()  // fade out overlay
  → view afterEnter: bootExplorePage() / bootShopPage() / etc.
```

**Barba views:**

| Namespace | beforeEnter | afterEnter | beforeLeave |
|-----------|-------------|------------|-------------|
| `home` | `restoreHomePageShell()` | `refreshHomePage()` | Kill hero/sticky triggers; `destroyShopPage()` |
| `explore` | `applyExplorePageShell()` | `bootExplorePage()` | `destroyZScroll()` |
| `shop` | `applyShopPageShell()` | `bootShopPage()` | `destroyShopPage()` |
| `bottles` | `applyShopCollectionShell()` | `bootShopPage()` | `destroyShopPage()` |
| `product` | `applyProductDetailPageShell()` | `bootProductPage()` | `destroyShopPage()` |
| `shop-collection` | `applyShopCollectionShell()` | `bootShopPage()` | `destroyShopPage()` |

**Overlay CSS (`global.css`):**

- Default: `opacity: 0`, `visibility: hidden`, `pointer-events: none`
- `.is-active`: visible during playback
- `.is-waiting`: animation done, waiting for page swap — no click blocking
- `.is-fading`: fade-out on enter

**Prevent Barba on:** hash links, external URLs, `mailto:`/`tel:`, `[data-barba-prevent]`, Shop CTA to `#shop`.

`history.scrollRestoration = 'manual'`; scroll reset in Barba `enter()`.

---

## UI system

Buttons use a single pattern: **`fizz-btn`** + one variant:

| Variant | Use |
|---------|-----|
| `fizz-btn--primary` | Filled actions (e.g. Add to Cart on PDP) |
| `fizz-btn--outline` | Bordered actions (View product, home intro CTAs) |
| `fizz-btn--ghost` | Glass style on dark UI (explore modals, end screen) |

Typography tokens: `fizz-heading`, `fizz-lead`, `fizz-label`, `fizz-eyebrow`.

Full conventions: [`docs/UI-CLASSES.md`](docs/UI-CLASSES.md). Styles: [`src/styles/buttons.css`](src/styles/buttons.css).

---

## Cloudflare Worker

Single Worker (`src/worker/index.ts`) handles:

- **`/api/health`** — `{ ok: true, environment }`
- **`/api/shop/*`** — Shopify Storefront proxy (scaffolded; see `docs/SHOPIFY-INTEGRATION.md`)
- **Everything else** — static assets from `dist/` via `ASSETS` binding (SPA fallback enabled)

Local secrets: `.dev.vars` (not committed). Production: `wrangler secret put`.

---

## Development

**Requirements:** Node 22+, npm

```bash
npm install
npm run dev          # Vite dev server → http://localhost:5173
npm run preview      # Preview production build
npm run worker:dev   # Build + Wrangler dev (full Worker stack)
```

**Quality checks (same as CI):**

```bash
npm run lint:all     # ESLint + typecheck + Stylelint + deprecated-class guard
# or individually:
npm run lint
npm run lint:css
npm run lint:css:deprecated
npm run typecheck
npm run build
```

| Script | Purpose |
|--------|---------|
| `npm run lint` | ESLint on TypeScript |
| `npm run lint:css` | Stylelint on `src/styles/**/*.css` |
| `npm run lint:css:deprecated` | Fail if removed CTA classes are reintroduced |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run assets:bottles` | Copy bottle renders into `public/images/bottles/` |

**Manual test checklist:**

- [ ] Home → Explore — Lottie plays, fades out, 3D cards work
- [ ] Explore → Home — back button or `/`; hero re-inits
- [ ] Home → Shop (`#shop`) — post-intro marquee unlocks; no Barba intercept
- [ ] Shop → Bottles → Product — scroll works; uniform View product CTAs
- [ ] Direct `/explore.html` — loader + z-scroll
- [ ] Browser back/forward — no stuck overlay or duplicate listeners

---

## Shopify / CMS

Product copy, specs, and features live in [`src/lib/shopData.ts`](src/lib/shopData.ts). A Shopify import CSV for six bottle SKUs was prepared separately (Title, handle, $34 / $44 compare-at). Wire `shopifyProductId` / `shopifyVariantId` in `shopData.ts` when the store is connected.

---

## Deployment

```bash
npm run deploy   # vite build && wrangler deploy
```

Config: `wrangler.jsonc` — Worker name **`fizz-website`** (matches the Cloudflare Git-connected Worker), assets from `./dist`.

**Workers Builds (PR check):** set **Build command** to `npm run build` and **Deploy command** to `npm run deploy` in the dashboard. Details: [`docs/CLOUDFLARE-BUILDS.md`](docs/CLOUDFLARE-BUILDS.md).

---

## Migration status

Tracked in [`INSTRUCTIONS.md`](INSTRUCTIONS.md). Current queue:

| Task | Notes |
|------|-------|
| Lottie reveal timing | Match Webflow IX2 fade-in for `.sticky-track` |
| Hero scroll choreography | Full IX2 carousel + copy entrance on `300vh` track |
| Nav search Lottie | Element `c515ba7c-0a1b-2f65-a43e-3a0568d7f84d` |
| Lower page content | About, contact sections on home |
| Image trail bubbles | `fizz5trailvendors` scripts — optional |

**Completed milestones:**

- **2026-05** — Project scaffold: Vite, Worker, CI, Webflow CSS in `public/`
- **2026-05** — Homepage hero port: slider, marquee, scroll scale, sticky Lottie scrub
- **2026-05** — Explore page: z-scroll 3D ported from `fizzzscroll` to TypeScript
- **2026-05** — Barba.js replaces SmoothState; promise-based Lottie + overlay fade dismiss
- **2026-05** — Shop flow: category carousel, bottles grid, six PDPs, home marquee
- **2026-05** — Unified `fizz-btn` CTAs; Stylelint + deprecated-class CI guard

Webflow MCP inspection report: [`docs/WEBFLOW-MCP-INSPECTION.md`](docs/WEBFLOW-MCP-INSPECTION.md)

---

## Further reading

| Doc | Contents |
|-----|----------|
| [`INSTRUCTIONS.md`](INSTRUCTIONS.md) | Active to-do queue for Cursor sessions |
| [`docs/UI-CLASSES.md`](docs/UI-CLASSES.md) | Button and typography class conventions |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Deployment model, Shopify plan |
| [`docs/WEBFLOW-MIGRATION.md`](docs/WEBFLOW-MIGRATION.md) | How to port sections from the export |
| [`docs/WEBFLOW-MCP-INSPECTION.md`](docs/WEBFLOW-MCP-INSPECTION.md) | Designer IDs, script inventory, parity checklist |
| [`docs/WEBFLOW-WARP-SLIDER.md`](docs/WEBFLOW-WARP-SLIDER.md) | Shop category slider notes |
| [`docs/CLOUDFLARE-BUILDS.md`](docs/CLOUDFLARE-BUILDS.md) | Workers Builds dashboard settings for PR deploy checks |
| [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) | Branching, commits, PR checklist |
| [`docs/SHOPIFY-INTEGRATION.md`](docs/SHOPIFY-INTEGRATION.md) | Future commerce API surface |

---

## Contributing

Trunk-based flow: branch off `main`, open a PR, CI must pass (`npm run lint:all` + build). Conventional Commits. See [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md).
