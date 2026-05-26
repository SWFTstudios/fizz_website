# FIZZ5 — How This Site Is Built

**Codename:** `fizz5`  
**Live reference:** [fizz5.webflow.io](https://fizz5.webflow.io/)

This document is both a project guide and a plain-language tour of the technology behind it. You do not need a computer science background to follow along. By the end, you should understand not just *what* we built, but *why* each piece exists and how it fits together.

We update this README as the project grows. Think of it as the book we write while building the house.

---

## Table of contents

1. [The big picture](#1-the-big-picture)
2. [Where the design lives vs. where the code runs](#2-where-the-design-lives-vs-where-the-code-runs)
3. [How source code becomes a website](#3-how-source-code-becomes-a-website)
4. [Inside the repository](#4-inside-the-repository)
5. [The home page: scroll, video, and animation](#5-the-home-page-scroll-video-and-animation)
6. [The Explore page: a 3D scroll experience](#6-the-explore-page-a-3d-scroll-experience)
7. [Moving between pages without a full reload](#7-moving-between-pages-without-a-full-reload)
8. [The Lottie overlay: the “through the bottle” moment](#8-the-lottie-overlay-the-through-the-bottle-moment)
9. [Where the site is hosted](#9-where-the-site-is-hosted)
10. [Working on the project](#10-working-on-the-project)
11. [What is done, and what comes next](#11-what-is-done-and-what-comes-next)
12. [Go deeper](#12-go-deeper)

---

## 1. The big picture

Fizz5 is a marketing website for a sparkling beverage brand. It was originally designed and published in **Webflow** — a visual website builder that lets designers lay out pages, add animations, and publish without writing code.

We are **rebuilding** that site as real, maintainable code. The goal is the same look and feel, but with:

- Full control over behavior and performance
- A path to add shopping (Shopify) and custom APIs later
- Hosting on **Cloudflare**, a global edge network, instead of Webflow’s servers

In short: Webflow gave us the blueprint. This repo is the construction site.

```
  Webflow (design reference)          This repo (what actually runs)
  ─────────────────────────          ──────────────────────────────
  fizz5.webflow/          ──port──►  src/ + public/ + index.html
  Visual editor, IX2        rewrite    TypeScript, GSAP, Barba, Lottie
  Hosted on Webflow         migrate    Built with Vite, served by Cloudflare Worker
```

---

## 2. Where the design lives vs. where the code runs

### The reference folder: `fizz5.webflow/`

When you export a Webflow site, you get HTML, CSS, images, and JavaScript files. We keep that export in **`fizz5.webflow/`** and treat it as **read-only**.

We open it to answer questions like:

- “How tall is the hero section?” (`300vh` — three times the viewport height)
- “Which Lottie file does the transition use?” (`documents/fizz-lottie-transition.json`)
- “What classes does the nav use?”

We **do not** run the Webflow export in production. It is a museum copy of the original, not the engine.

### The real site: `src/`, `public/`, and the HTML files

Everything users actually load comes from:

| Location | Role |
|----------|------|
| `index.html` | Home page structure |
| `explore.html` | Explore / product-facts 3D page |
| `public/` | CSS, images, videos, Lottie JSON — files served as-is |
| `src/` | TypeScript that powers interactions, transitions, and scroll effects |

**Porting** means copying structure and styles from the Webflow export, then rewriting the *behavior* in TypeScript so we own it completely.

---

## 3. How source code becomes a website

Modern front-end projects rarely ship raw TypeScript to browsers. Browsers understand HTML, CSS, and JavaScript — not `.ts` files. So we use a **build tool** to prepare everything.

### Vite: the build tool

[**Vite**](https://vite.dev/) is our build tool. During development it gives you a local server with instant updates when you save a file. For production it **bundles** — combines and optimizes — our code into files the browser can load quickly.

We have **two HTML entry points** (two “doors” into the app):

```ts
// vite.config.ts — both pages are built in one pass
rollupOptions: {
  input: {
    main: "index.html",      // home
    explore: "explore.html",   // explore
  },
}
```

Both pages load the **same JavaScript entry**:

```html
<script type="module" src="/src/main.ts"></script>
```

That single entry is intentional. Page navigation is handled in JavaScript (see [Section 7](#7-moving-between-pages-without-a-full-reload)), so one runtime stays alive as you move between home and explore.

### TypeScript: JavaScript with guardrails

**TypeScript** is JavaScript plus **types** — labels that describe what shape data should have. It catches mistakes before the site runs in a browser. Our config is **strict**: the compiler is picky, which keeps the port from Webflow from turning into a pile of fragile copy-paste.

### The build output: `dist/`

When you run `npm run build`, Vite writes optimized files to **`dist/`**. That folder is what Cloudflare serves to visitors. You generally edit `src/` and HTML, not `dist/` directly.

---

## 4. Inside the repository

Here is a map of the important folders. You do not need to memorize it — use it as a index when you are looking for something specific.

```
fizz5/
├── fizz5.webflow/     Reference export (do not edit for runtime)
├── public/            Static assets (CSS, images, videos, Lottie JSON)
├── src/
│   ├── main.ts        Starts everything on every page
│   ├── lib/           Feature modules (hero, Lottie, explore, Barba)
│   ├── styles/        CSS we maintain (overrides + explore layout)
│   ├── types/         TypeScript declarations for third-party libraries
│   └── worker/        Server-side code for /api/* routes
├── index.html         Home
├── explore.html       Explore 3D page
├── vite.config.ts     Build configuration
└── wrangler.jsonc     Cloudflare Worker deployment config
```

### The modules in `src/lib/` (what each one does)

| File | Plain English |
|------|----------------|
| `main.ts` | Front door: wires up navigation, Barba, and home refresh logic |
| `heroHome.ts` | Hero slider (light/dark themes), logo marquee, mobile nav |
| `heroScroll.ts` | Shrinks the hero video as you scroll through the tall hero section |
| `lottieScroll.ts` | Full-screen Lottie transitions + scroll-scrubbed Lottie on the home page |
| `exploreTransition.ts` | Barba setup: when to swap pages, which scripts to start/stop |
| `zScroll.ts` | Explore page: 3D card stack, camera scroll, loader, modals |

---

## 5. The home page: scroll, video, and animation

The home page is a **long scrolling story**. Several sections are much taller than the screen on purpose — that extra height is what makes scroll-driven animation possible.

### Viewport height (`vh`)

**`100vh`** means “100% of the viewport height” — one screen tall. **`300vh`** is three screens of scroll distance. Webflow used these tall sections so scrolling *through* them drives animation, not just moving down the page.

### Hero track (`300vh`)

The **hero** is the first big section: video background, logo carousel, headline, slider arrows.

- **Markup** lives in `index.html` (classes like `.hero-track`, `.video-bg_wrapper`).
- **Scroll scale** — the video subtly shrinks as you scroll — is in `heroScroll.ts`, powered by **GSAP ScrollTrigger**.

**GSAP** (GreenSock Animation Platform) is an industry-standard animation library. **ScrollTrigger** is a GSAP plugin that ties animation progress to scroll position: “when the user has scrolled 40% through this section, the video should be at 88% scale.”

Webflow achieved similar effects with **IX2** (Interactions 2.0) — visual, no-code animation timelines. We recreate those timelines in code for control and clarity.

### Hero slider and logo marquee

The hero has two slides with different color themes (sky blue `#a8d0e4` and dark `#030303`). `heroHome.ts` switches background and text colors when you click arrows.

The logo row uses a **CSS marquee** (continuous horizontal motion). The Webflow original tied logo movement to scroll; we chose a simpler loop for now — one of several “parity gaps” we may close later.

### Intro section

A full-screen **intro** with product video sits below the hero. Lower on the page, content is **gated**: the big Lottie scroll section stays hidden until the user clicks **Shop** or completes a transition that unlocks it (`unlockPostIntro()` in `lottieScroll.ts`).

### Sticky Lottie track (`500vh`)

One of the signature moments: a **Lottie** animation (vector animation exported from After Effects as JSON) scrubs forward as you scroll through a **500vh** black section.

- **Lottie** = lightweight, scalable animation format (not a video file).
- The animation sits in a **sticky** layer (`position: sticky`) so it stays on screen while you scroll through the tall track.
- `lottieScroll.ts` loads `/public/lottie/fizz-lottie-transition.json` and maps scroll progress to frame numbers:

  **frame = scrollProgress × (totalFrames − 1)**

That is the same math Webflow’s IX2 used — we replaced the editor timeline with explicit code.

### Home page CTAs (calls to action)

| Button | Goes to | What happens |
|--------|---------|--------------|
| **Explore** | `/explore.html` | Full-page Lottie transition, then Barba loads the explore page |
| **Shop** | `#shop-stub` (same page) | Lottie plays, then page scrolls to the shop section — no page swap |
| Nav links | `#bottles`, etc. | Smooth scroll within the home page |

---

## 6. The Explore page: a 3D scroll experience

**Explore** is a separate page where product facts appear as **3D cards** you move through by scrolling — like a camera flying down a corridor of cards.

### From Webflow scripts to our TypeScript

On Webflow, this experience relied on custom site scripts named **`fizzzscroll`** (CSS injectors + JS initializers). Those scripts are **not** used in our build. We ported the behavior into:

- `src/lib/zScroll.ts` — logic (camera, cards, loader, modals)
- `src/styles/z-scroll.css` — layout and HUD styling

### What you see on Explore

- **Loader** — “Loading – 0%…” while assets prepare
- **Camera HUD** — REC, ISO, frame rate, clock (visual chrome)
- **Card stack** — facts with parallax, blur, and depth
- **Modal** — click a card for detail, specs, and CTA
- **Fallback content** — if CMS data is missing, built-in sample facts still demo the experience

### Direct visit vs. arriving from Home

- Open **`/explore.html` directly** → full loader runs.
- Click **Explore** from home → Barba swaps content after the Lottie transition → explore boots **without** the loader again (`skipLoader: true`) because the transition already bought time.

When you leave Explore, `destroyZScroll()` tears down listeners and animation state so nothing leaks when you return to Home.

---

## 7. Moving between pages without a full reload

Classic websites load a **new document** on every click — blank flash, scripts restart, scroll jumps. **Single-page app (SPA)** patterns swap content in place so it feels continuous.

We use [**Barba.js**](https://barba.js.org/) — a small library that:

1. Intercepts internal link clicks
2. Fetches the next page in the background (**prefetch**)
3. Replaces only part of the DOM (our `#main` container)
4. Runs **hooks** before and after the swap (start/stop page-specific code)

### The Barba markup contract

```html
<body data-barba="wrapper">
  <div id="main" data-barba="container" data-barba-namespace="home">
    <!-- page content Barba replaces -->
  </div>
  <div id="lottie-overlay">...</div>  <!-- stays outside — never swapped -->
</body>
```

- **`wrapper`** — outer shell that persists
- **`container`** — the slice Barba replaces
- **`namespace`** — `home` or `explore`; tells our code which page logic to run

### Why we replaced SmoothState

An earlier approach used **SmoothState** (jQuery + fixed timers). It swapped HTML on a clock, not when the Lottie actually finished, and did not reliably boot Explore’s 3D code afterward. Barba’s **promise-based** hooks let us say: “wait until the animation completes, *then* swap, *then* fade out, *then* boot explore.”

### Link rules (what Barba handles vs. ignores)

| Link type | Behavior |
|-----------|----------|
| `/explore.html`, `/` | Barba + Lottie transition |
| `#shop-stub`, `#bottles`, … | Stay on page (`data-barba-prevent="self"`) |
| External sites, `mailto:` | Normal navigation — Barba steps aside |

### Barba “views” — lifecycle per page

| Page | When you arrive | When you leave |
|------|-----------------|----------------|
| **home** | Restore body classes, re-init hero + scroll animations | Kill scroll triggers so they are not duplicated |
| **explore** | Apply explore styles, boot z-scroll | Destroy z-scroll cleanly |

`history.scrollRestoration = 'manual'` prevents the browser from restoring an old scroll position after a transition — we reset to the top on purpose.

---

## 8. The Lottie overlay: the “through the bottle” moment

The full-screen transition is a **Lottie animation** in a fixed overlay (`#lottie-overlay`) that sits above the page.

### Lifecycle in plain terms

1. **User clicks Explore** → overlay becomes visible, animation plays from frame 0
2. **Animation completes** → overlay enters a **waiting** state: still visible, but **`pointer-events: none`** so it does not block clicks
3. **Barba swaps page content** under the overlay
4. **`enter()` hook** → overlay **fades out** over 450ms, then hides completely

That fade matters. Without it, the last frame would sit like a black sheet and swallow clicks even though the new page loaded underneath.

### Shop CTA (same page)

**Shop** uses the same Lottie file but a separate path: `window.__fizzTransition()` plays the overlay, fades out, then unlocks gated content and scrolls to `#shop-stub`. No Barba involved — you never leave the home document.

### Reduced motion

If the user’s system prefers reduced motion (`prefers-reduced-motion: reduce`), we skip animations and jump straight to the end state. Accessibility is part of the design, not an afterthought.

---

## 9. Where the site is hosted

### Cloudflare Worker

A [**Cloudflare Worker**](https://developers.cloudflare.com/workers/) is a small program that runs on Cloudflare’s edge — close to users worldwide. Ours does two jobs:

1. **Serve the website** — HTML, CSS, JS, images from the `dist/` folder (Workers **Static Assets** binding)
2. **Handle APIs** — routes under `/api/*` for health checks and (future) Shopify proxying

One Worker, one deploy, one place to roll back if something breaks. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for why we chose this over splitting Pages + Workers.

### API routes today

| Route | Purpose |
|-------|---------|
| `GET /api/health` | Sanity check — returns `{ ok: true }` |
| `/api/shop/*` | Scaffold for future Storefront API proxy ([`docs/SHOPIFY-INTEGRATION.md`](docs/SHOPIFY-INTEGRATION.md)) |

Secrets (API tokens) live in **`.dev.vars`** locally and **Wrangler secrets** in production — never committed to git.

---

## 10. Working on the project

### Prerequisites

- **Node.js 22+** and **npm** (Node’s package manager)

### Commands

```bash
npm install          # install dependencies
npm run dev          # local site → http://localhost:5173
npm run worker:dev   # build + run with Cloudflare Worker locally
npm run lint         # code style / bug patterns
npm run typecheck    # TypeScript validation
npm run build        # production build → dist/
npm run deploy       # build + deploy to Cloudflare
```

### Manual test checklist

After changing behavior, walk through these flows:

- [ ] **Home → Explore** — Lottie plays, fades out, 3D cards and HUD work
- [ ] **Explore → Home** — browser back or link to `/`; hero animations work again
- [ ] **Home → Shop** — in-page Lottie, scroll to shop; Barba does not intercept
- [ ] **Direct `/explore.html`** — loader completes, scroll experience runs
- [ ] **Back / forward** — no stuck overlay, no double animations

CI runs lint, typecheck, and build on every pull request.

### Contributing

Branch from `main`, open a PR, use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`). Details: [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md).

---

## 11. What is done, and what comes next

### Built and working

| Feature | Status |
|---------|--------|
| Vite + TypeScript build | Done |
| Home + Explore multi-page setup | Done |
| Hero slider, marquee, scroll-scale video | Done (some IX2 nuance still to match) |
| Scroll-scrubbed Lottie on home | Done |
| Shop / Explore Lottie transitions | Done |
| Barba page transitions with prefetch | Done |
| Explore 3D z-scroll (TypeScript port) | Done |
| Cloudflare Worker + static assets | Scaffolded |
| Overlay fade-out (no click blocking) | Done |

### Still on the roadmap

Tracked in [`INSTRUCTIONS.md`](INSTRUCTIONS.md):

| Task | Why it matters |
|------|----------------|
| Lottie reveal timing | Match Webflow’s fade-in when the sticky track appears |
| Hero scroll choreography | Richer carousel + copy motion on the 300vh track |
| Nav search Lottie | Animated search icon on menu hover |
| Lower page sections | Bottles, flavor packs, about, contact content |
| Image trail bubbles | Optional decorative cursor effect from Webflow |
| Shopify integration | Shopping via `/api/shop/*` proxy |

### Milestones (project diary)

- **2026-05** — Scaffold: Vite, Worker, CI, Webflow CSS in `public/`
- **2026-05** — Home hero port: slider, marquee, scroll scale, sticky Lottie
- **2026-05** — Explore page: `fizzzscroll` reimplemented in TypeScript
- **2026-05** — Barba replaces SmoothState; Lottie tied to animation completion + fade dismiss
- **2026-05** — README expanded as living documentation

---

## 12. Go deeper

| Document | Best for |
|----------|----------|
| [`INSTRUCTIONS.md`](INSTRUCTIONS.md) | Active task queue (especially for AI-assisted sessions) |
| [`docs/WEBFLOW-MCP-INSPECTION.md`](docs/WEBFLOW-MCP-INSPECTION.md) | Designer element IDs, script inventory, parity checklist |
| [`docs/WEBFLOW-MIGRATION.md`](docs/WEBFLOW-MIGRATION.md) | Step-by-step porting from the export |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Deployment model and Shopify direction |
| [`docs/SHOPIFY-INTEGRATION.md`](docs/SHOPIFY-INTEGRATION.md) | Future commerce API design |
| [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) | Branches, commits, PR expectations |

---

*If you read this start to finish, you now understand the difference between a design reference and a runtime, how scroll drives animation, why Barba and Lottie are paired, and where this project is headed. Welcome to the build.*
