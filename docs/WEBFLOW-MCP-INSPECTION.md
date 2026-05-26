# Webflow MCP Inspection — fizz5 (2026-05-26)

Live reference: [fizz5.webflow.io](https://fizz5.webflow.io/)

## Site identity


| Field        | Value                      |
| ------------ | -------------------------- |
| Site name    | fizz5                      |
| Site ID      | `6a03870d6aa42355105ab9ae` |
| Home page ID | `6a0387116aa42355105ab9fa` |
| Home slug    | `/` (homepage)             |


## Pages on site


| Title                  | Page ID                    | Slug                   |
| ---------------------- | -------------------------- | ---------------------- |
| Home                   | `6a0387116aa42355105ab9fa` | `/`                    |
| Home V2                | `6a06393a3417615f81d02928` | `home-v2`              |
| Explore                | `6a0643b6a2b977b07ea24694` | `explore`              |
| z-scroll-page          | `6a0b5b8a6d914ba646157a1b` | `z-scroll-page`        |
| Product Facts Template | `6a0b6096431b18cabf5f247f` | `detail_product-facts` |


Designer canvas confirmed on **Home** during inspection.

## Key homepage elements (Designer IDs)


| Section                    | Webflow class (Designer) | Element ID (`component` / `element`)                                |
| -------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hero section wrapper       | `hero-section`           | `6a0387116aa42355105ab9fa` / `afc3514c-fccb-0b62-9fb1-de99fdea14ad` |
| Hero scroll track          | `hero-track`             | `6a0387116aa42355105ab9fa` / `2bf77076-f567-3897-1d37-67a984df153b` |
| Intro section              | `intro-section`          | `6a0387116aa42355105ab9fa` / `39c6c4a8-f7d1-b7b9-836f-886ce6aff86d` |
| Sticky Lottie track        | `sticky-track`           | `6a0387116aa42355105ab9fa` / `f4f1a7c9-b74b-3121-1fde-217e018d4d2b` |
| Scroll Lottie (transition) | `Lottie Animation 3`     | `6a0387116aa42355105ab9fa` / `62113a69-bb76-3937-b876-e1c99559ad9c` |
| Nav search Lottie          | `Lottie animation`       | `6a0387116aa42355105ab9fa` / `c515ba7c-0a1b-2f65-a43e-3a0568d7f84d` |


The scroll Lottie element ID `62113a69-bb76-3937-b876-e1c99559ad9c` matches `data-w-id` in `[fizz5.webflow/index.html](../fizz5.webflow/index.html)`.

## Layout dimensions (from Designer styles)


| Class                | Critical CSS                                                          |
| -------------------- | --------------------------------------------------------------------- |
| `hero-track`         | `height: 300vh`, `position: relative`, bg `#a8d0e4`                   |
| `video-bg_wrapper`   | `position: sticky`, `top: 0`, `min-height: 100dvh`                    |
| `intro-section`      | `height: 100vh`, `z-index: 2`, elevated shadow stack                  |
| `sticky-track`       | `height: 500vh`, `position: sticky`, `top: 0`, `z-index: 2`, black bg |
| `Lottie Animation 3` | `position: sticky`, `height: 100vh`, `width: 100%`, flex column       |


**Scroll math for Lottie:** User scrolls through **500vh** of `.sticky-track` while the Lottie layer stays **100vh** sticky — frames scrub across that distance. Our Vite `[src/lib/lottieScroll.ts](../src/lib/lottieScroll.ts)` uses the same progress formula.

## Custom scripts (site-wide, footer)

Applied on site (`get_site_scripts`):


| Script ID           | Version | Purpose                               |
| ------------------- | ------- | ------------------------------------- |
| `fizz5trailvendors` | 2.0.2   | Image trail vendor bundle             |
| `fizzzscrollcss0`   | 1.0.0   | Injects explore 3D scroll CSS         |
| `fizzzscrollcss1`   | 1.0.0   | Injects explore card 3D CSS           |
| `fizzzscrolljs01`   | 1.0.0   | `window.__fizzZScroll` camera scroll  |
| `fizzzscrolljs02`   | 1.0.0   | Initializes explore `.viewport` roots |


**Important:** `fizzzscroll`* scripts power the **Explore / z-scroll 3D** experience, **not** the homepage Lottie scroll. Homepage Lottie is **Webflow IX2** (scroll → Lottie timeline), which the MCP cannot export.

Also registered but **not** applied site-wide:

- `heroslidertheme` (v1.3.0 latest) — hero slider color themes
- `fizz5trailboot`, `fizz5trailb640`–`643` — image trail bootstrapping

Home page has **no page-specific** custom scripts (API returned 404 for page scripts).

## IX2 / interactions (not in MCP)

Webflow Interactions (IX2) are **not exposed** via MCP or public REST API. Known IX2 behaviors from export + preview:

1. **Hero track (300vh):** Logo carousel + sticky video; scroll-driven transforms on carousel rows; hero copy entrance.
2. **Hero slider:** Slide theme colors (`#a8d0e4` / `#030303`) — partially replicated in `[src/lib/heroHome.ts](../src/lib/heroHome.ts)`.
3. **Intro:** Sticky content over water video; logo scale/fade (IX2 on `data-w-id` elements).
4. **Sticky track:** Starts `display: none; opacity: 0` in export; IX2 reveals and drives Lottie scrub on scroll.
5. **Explore flow:** Hidden until interaction; uses `fizzzscroll` when shown.
6. **Nav search:** Lottie plays on dropdown hover (`data-is-ix2-target`).

Lottie asset (from export): `documents/fizz-lottie-transition.json` → ported to `[public/lottie/fizz-lottie-transition.json](../public/lottie/fizz-lottie-transition.json)`.

## Vite build parity checklist


| Feature                  | Webflow                               | Current Vite build                | Gap                                       |
| ------------------------ | ------------------------------------- | --------------------------------- | ----------------------------------------- |
| Hero video slider        | IX2 + Webflow slider                  | Autoplay + arrows (`heroHome.ts`) | Scroll-linked hero choreography missing   |
| Hero theme colors        | `heroslidertheme` script (registered) | Inline theme map                  | OK functionally; script not loaded        |
| Logo carousel            | IX2 scroll + fixed wrapper            | CSS marquee                       | Different motion model                    |
| Intro sticky + video     | IX2 + 100vh section                   | Ported markup + video             | Logo/text entrance IX2 missing            |
| Lottie scroll transition | IX2 scrub in 500vh track              | `lottie-web` scrub                | Core behavior aligned; tune reveal timing |
| Sticky track reveal      | IX2 fade/slide in                     | `initStickyTrackReveal()`         | Verify against preview feel               |
| Image trail bubbles      | `content__img` + trail scripts        | Hidden / not implemented          | Not started                               |
| Nav search Lottie        | IX2                                   | Not implemented                   | Not started                               |
| Explore 3D z-scroll      | `fizzzscroll` + explore page          | Not on home                       | Separate page migration                   |
| Lower page content       | Full CMS sections                     | Single placeholder section        | Large content gap                         |
| Promo strip              | `shop-flow` rotating text             | Not implemented                   | Not started                               |


## Recommended next implementation order

1. **Tune Lottie reveal** — Match IX2 fade-in timing when intro exits viewport.
2. **Hero scroll choreography** — GSAP ScrollTrigger on `hero-track` (300vh) for carousel + copy.
3. **Nav search Lottie** — Port search JSON Lottie with hover scrub.
4. **Image trail layer** — Optional; load `fizz5trailvendors` only if bubble effect is required.
5. **Explore flow** — Port `/explore` using existing `fizzzscroll` scripts or reimplement in TS.

## MCP limitations observed

- `element_snapshot_tool` returned black/empty frames for nested sticky sections (likely canvas viewport / scroll position).
- Animation element `get_settings` does not return Lottie JSON URL or duration via Designer API (use export HTML or asset panel manually).
- `data-w-id` attributes are not returned in element tree (use element UUID ↔ export crosswalk above).

