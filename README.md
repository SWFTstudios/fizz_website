# FIZZ5

Codename: **`fizz5`**

Marketing site rebuild for [fizz5.webflow.io](https://fizz5.webflow.io/). The live Webflow export in `fizz5.webflow/` is the **design reference only**; the runtime is a Vite + TypeScript app served by a single Cloudflare Worker.

This README is the living build log — update it as features land.

---

## Table of contents

- [What exists today](#what-exists-today)
- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [How the app is built](#how-the-app-is-built)
- [Runtime architecture](#runtime-architecture)
- [Home page](#home-page)
- [Explore page (3D z-scroll)](#explore-page-3d-z-scroll)
- [Page transitions (Barba + Lottie)](#page-transitions-barba--lottie)
- [Cloudflare Worker](#cloudflare-worker)
- [Development](#development)
- [Deployment](#deployment)
- [Migration status](#migration-status)
- [Further reading](#further-reading)

---

## What exists today

| Area | Status |
|------|--------|
| Vite + TypeScript frontend | ✅ |
| Multi-page build (`/` + `/explore.html`) | ✅ |
| Cloudflare Worker + static assets binding | ✅ Scaffolded |
| Homepage hero (slider, marquee, scroll scale) | ✅ Partial parity |
| Homepage scroll-scrub Lottie (`sticky-track`) | ✅ |
| In-page Shop CTA Lottie transition | ✅ |
| Site-wide Barba.js page transitions | ✅ |
| Explore 3D z-scroll experience | ✅ Ported to TS |
| Shopify Storefront API proxy | 🔲 Scaffold only |
| Full homepage content / CMS sections | 🔲 Placeholder |
| Nav search Lottie, image trail, promo strip | 🔲 Not started |

---

## Tech stack

| Layer | Choice | Why |
|-------|--------|-----|
| Build | [Vite 6](https://vite.dev/) | Fast dev server, multi-page HTML entries |
| Language | TypeScript (strict) | Typed ports from Webflow interactions |
| Animations | [GSAP](https://gsap.com/) + ScrollTrigger | Replaces Webflow IX2 scroll choreography |
| Lottie | [lottie-web](https://github.com/airbnb/lottie-web) | Full-page transitions + scroll-scrub on home |
| Routing | [@barba/core](https://barba.js.org/) + `@barba/prefetch` | SPA-like transitions without jQuery SmoothState |
| Hosting | Cloudflare Workers + Workers Static Assets | One deploy for UI + `/api/*` |
| Reference | Webflow export (`fizz5.webflow/`) | Read-only; never executed at runtime |

---

## Repository layout

```
fizz5/
├── fizz5.webflow/          # Webflow export — reference only, do not edit at runtime
├── public/
│   ├── css/                # Ported Webflow CSS (webflow.css, fizz5.webflow.css)
│   ├── images/             # Static images
│   ├── videos/             # Hero / intro video assets
│   └── lottie/             # fizz-lottie-transition.json (from Webflow documents/)
├── src/
│   ├── main.ts             # Single JS entry for all pages
│   ├── lib/
│   │   ├── exploreTransition.ts   # Barba init, views, page shell helpers
│   │   ├── heroHome.ts            # Hero slider, logo marquee, nav toggle
│   │   ├── heroScroll.ts          # Hero-track scroll scale (300vh)
│   │   ├── lottieScroll.ts        # Lottie overlay + sticky-track scrub
│   │   └── zScroll.ts             # Explore 3D card scroll (ported from fizzzscroll)
│   ├── styles/
│   │   ├── global.css             # Resets, Lottie overlay, shared tokens
│   │   ├── home-overrides.css     # Homepage-specific layout fixes
│   │   └── z-scroll.css           # Explore HUD, loader, modal, scene
│   ├── types/barba.d.ts           # Minimal Barba module stubs
│   └── worker/                    # Cloudflare Worker (/api/*)
├── index.html              # Home — data-barba-namespace="home"
├── explore.html            # Explore — data-barba-namespace="explore"
├── vite.config.ts          # Multi-page Rollup inputs
├── wrangler.jsonc          # Worker + dist/ assets binding
├── INSTRUCTIONS.md         # Active migration to-do queue (for Cursor sessions)
└── docs/                   # Architecture, migration, Webflow MCP inspection
```

**Rule:** Port from `fizz5.webflow/` into `src/` and `public/`. Do not depend on Webflow's runtime JS except where CSS class names require it.

---

## How the app is built

Vite treats each HTML file as an entry point:

```ts
// vite.config.ts
rollupOptions: {
  input: {
    main: "index.html",
    explore: "explore.html",
  },
}
```

Both pages load the **same module**:

```html
<script type="module" src="/src/main.ts"></script>
```

Barba keeps one JavaScript runtime alive across navigations — there is no separate `explore.ts` entry. On first load, `bootCurrentPage()` reads `[data-barba-namespace]` and initializes either home or explore.

Build output goes to `dist/`; the Worker serves it via the `ASSETS` binding.

---

## Runtime architecture

```
┌─────────────────────────────────────────────────────────────┐
│  <body data-barba="wrapper">                                │
│    ┌─────────────────────────────────────────────────────┐  │
│    │  #main  data-barba="container"                      │  │
│    │  data-barba-namespace="home" | "explore"            │  │
│    │  ← Barba swaps this HTML on internal navigation     │  │
│    └─────────────────────────────────────────────────────┘  │
│    #lottie-overlay  ← persistent outside container          │
│    main.ts → initExploreTransition(refreshHomePage)           │
└─────────────────────────────────────────────────────────────┘
```

**Initialization order (`main.ts`):**

1. Register GSAP ScrollTrigger
2. Wire in-page hash navigation (respecting post-intro gate)
3. `initExploreTransition(refreshHomePage)` — Barba + Lottie overlay
4. Shop CTA handler — same-page `#shop-stub` via `window.__fizzTransition`

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
| Post-intro content | `#post-intro` | Gated until Shop/Explore CTA | `unlockPostIntro()` reveals + lazy-inits scroll Lottie |

**Scroll-scrub Lottie math:** User scrolls through **500vh** of `.sticky-track` while the Lottie layer stays **100vh** sticky. Frame index = `progress × (totalFrames − 1)`. Same formula as Webflow IX2.

**CTAs:**

| Link | Target | Behavior |
|------|--------|------------|
| Explore | `/explore.html` | Barba transition + full-viewport Lottie |
| Shop | `#shop-stub` | In-page Lottie via `__fizzTransition`, then scroll |
| Nav anchors | `#bottles`, etc. | `data-barba-prevent="self"` — smooth scroll, no Barba |

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
- `destroyZScroll()` on Barba leave; `bootExplorePage({ skipLoader: true })` on Barba enter

**Direct visit:** Opening `/explore.html` runs the full loader (`skipLoader: false`).

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
  → enter(): await dismissLottieOverlay()  // 450ms fade out
  → explore view afterEnter: bootExplorePage()
```

**Barba views:**

| Namespace | beforeEnter | afterEnter | beforeLeave |
|-----------|-------------|------------|-------------|
| `home` | `restoreHomePageShell()` | `refreshHomePage()` — re-inits hero + ScrollTrigger | Kill hero/sticky triggers |
| `explore` | `applyExplorePageShell()` — body classes, title | `bootExplorePage({ skipLoader: true })` | `destroyZScroll()` |

**Overlay CSS (`global.css`):**

- Default: `opacity: 0`, `visibility: hidden`, `pointer-events: none`
- `.is-active`: visible during playback
- `.is-waiting`: animation done, waiting for page swap — no click blocking
- `.is-fading`: 450ms fade-out on enter

**Prevent Barba on:** hash links, external URLs, `mailto:`/`tel:`, `[data-barba-prevent]`, Shop CTA.

`history.scrollRestoration = 'manual'`; scroll reset in Barba `enter()`.

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
npm run worker:dev   # Build + Wrangler dev (full Worker stack)
```

**Quality checks (same as CI):**

```bash
npm run lint
npm run typecheck
npm run build
```

**Manual test checklist:**

- [ ] Home → Explore — Lottie plays, fades out, 3D cards work
- [ ] Explore → Home — back button or `/`; hero re-inits
- [ ] Home → Shop — in-page Lottie, no Barba intercept
- [ ] Direct `/explore.html` — loader + z-scroll
- [ ] Browser back/forward — no stuck overlay or duplicate listeners

---

## Deployment

```bash
npm run deploy   # vite build && wrangler deploy
```

Config: `wrangler.jsonc` — Worker name `fizz5`, assets from `./dist`.

---

## Migration status

Tracked in [`INSTRUCTIONS.md`](INSTRUCTIONS.md). Current queue:

| Task | Notes |
|------|-------|
| Lottie reveal timing | Match Webflow IX2 fade-in for `.sticky-track` |
| Hero scroll choreography | Full IX2 carousel + copy entrance on `300vh` track |
| Nav search Lottie | Element `c515ba7c-0a1b-2f65-a43e-3a0568d7f84d` |
| Lower page content | Bottles, flavor packs, about, contact sections |
| Image trail bubbles | `fizz5trailvendors` scripts — optional |

**Completed milestones:**

- **2026-05** — Project scaffold: Vite, Worker, CI, Webflow CSS in `public/`
- **2026-05** — Homepage hero port: slider, marquee, scroll scale, sticky Lottie scrub
- **2026-05** — Explore page: z-scroll 3D ported from `fizzzscroll` to TypeScript
- **2026-05** — Barba.js replaces SmoothState; promise-based Lottie + overlay fade dismiss

Webflow MCP inspection report: [`docs/WEBFLOW-MCP-INSPECTION.md`](docs/WEBFLOW-MCP-INSPECTION.md)

---

## Further reading

| Doc | Contents |
|-----|----------|
| [`INSTRUCTIONS.md`](INSTRUCTIONS.md) | Active to-do queue for Cursor sessions |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Deployment model, Shopify plan |
| [`docs/WEBFLOW-MIGRATION.md`](docs/WEBFLOW-MIGRATION.md) | How to port sections from the export |
| [`docs/WEBFLOW-MCP-INSPECTION.md`](docs/WEBFLOW-MCP-INSPECTION.md) | Designer IDs, script inventory, parity checklist |
| [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) | Branching, commits, PR checklist |
| [`docs/SHOPIFY-INTEGRATION.md`](docs/SHOPIFY-INTEGRATION.md) | Future commerce API surface |

---

## Contributing

Trunk-based flow: branch off `main`, open a PR, CI must pass (lint + typecheck + build). Conventional Commits. See [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md).
