# Fizz FINAL (fizz-final.webflow.io) — performance audit

Site ID `6a8dcf9ad40a6e07fa0c7204`. Findings come from the site's custom code and asset
library, read through the Webflow connector. **The live pages and the hosted
`fizz-*.js` files could not be fetched from the audit environment (network
policy), so nothing here was profiled in a browser.** Treat the ranking below as
evidence-based hypotheses; the "Verify" column says how to confirm each one.

## Findings, most impactful first

| # | Finding | Evidence | Effect | Verify |
|---|---------|----------|--------|--------|
| 1 | The scroll "Lottie" `fizz-lottie-transition.json` is **75 embedded 1920×1080 JPEGs** (≈117 KB each), not vector animation. 11.5 MB in the asset library; same file as `fizz5.webflow/documents/`. | Decoded the JSON: 75 image assets, 0 shape layers. | 11.5 MB download, then main-thread JSON parse + base64 decode + 75 full-HD image decodes in an SVG renderer. Classic cause of late first paint and dropped frames while scrolling. | DevTools → Network: size/time of the `.json`; Performance: long tasks after load. |
| 2 | Three `MutationObserver`s on `document.documentElement` with `subtree: true` run for the whole page life (webfont blocker, intro-script blocker, intro class watcher). | Home head code. | Fire on every node Lottie/IX2 insert, on top of the transform-stripping observers in the site footer. | Performance panel: `MutationObserver` callbacks in the bottom-up view. |
| 3 | Intro overlay is fixed, white, scroll-locked, and has **no failsafe**. The intro script is only injected at `DOMContentLoaded`. | Home head CSS/JS. | Until `fizz-intro-i-expand-v17d.js` loads and runs, the page is hidden. Any slow or failed fetch looks like "the site is stuck loading", and lazy images behind it start late. | Throttle to Slow 4G, hard refresh (Cmd/Ctrl+Shift+R clears the "seen" flag). |
| 4 | Footer loads `fizz-posthog-v1.js`, `fizz-perf-v2.js`, `fizz-media-v1.js` as plain blocking `<script>`s; only GSAP and the rest are `defer`red. | Site footer code. | Analytics delays DOMContentLoaded and therefore Webflow IX2 start. | Network waterfall. |
| 5 | Marquee code strips IX2's inline `transform` with a per-element `MutationObserver` while CSS animations run on the same elements. | Site footer code. | Possible style-recalc ping-pong each frame while marquees are visible. (They *are* paused off-screen, which is good.) | Performance panel: recalculate-style frequency while scrolling past a marquee. Try with the observers disabled. |
| 6 | Images under `[data-w-id]` can start at `opacity: 0` (IX2) and only show once `fizz-media-v1.js` adds `.is-fizz-media-ready`; combined with Webflow's default `loading="lazy"` this reads as "images pop in late". | Site head CSS. | Delayed images. | In Designer, set above-the-fold images to **Loading: Eager** and the hero/LCP image to high priority; keep lazy below. |
| 7 | Asset library holds ~15 MB of MP3s, ~5.8 MB of MP4 snippets and several unrelated personal/legal documents (court filing, return labels, spreadsheets). | Asset list. | Not loaded unless referenced, but the documents are publicly downloadable from the CDN. | **Delete the unrelated documents from Assets** — privacy issue independent of speed. |

Not a problem: the Shopify Storefront token in the footer is a public-by-design
token; just make sure its scopes are storefront-read only.

## Fixes in this folder

| File | What it does | Where it goes |
|------|--------------|---------------|
| `assets/fizz-transition.mp4` (2.4 MB) and `assets/fizz-transition-mobile.mp4` (0.9 MB, 960 px) | All-intra H.264 re-encode of the 75 frames (every frame a keyframe → instant seeking). **11.7 MB → 2.4 MB desktop / 0.9 MB mobile.** | Upload to Webflow Assets. |
| `fizz-scrub-video.js` | GSAP ScrollTrigger scrubber for a `<video data-fizz-scrub>`; picks the mobile file under 768 px. | Upload/host, add as a `defer` script after GSAP + ScrollTrigger. |
| `home-head-optimized.html` | Home → Custom code → Head, same behaviour minus findings 2–3 (observers disconnect on load/when intro ends, 8 s intro failsafe, immediate intro-script injection). All inline scripts pass `node --check`. | Replace the current Home head code. |

### Applying the Lottie → video swap (Designer, ~10 min)

1. Upload both MP4s to Assets.
2. Replace the Lottie element inside the transition section with a Video-less
   **Embed**:
   `<video data-fizz-scrub data-trigger=".<your-track-class>" data-src-desktop="<mp4 url>" data-src-mobile="<mobile mp4 url>" muted playsinline preload="auto" style="width:100%;height:100vh;object-fit:cover;position:sticky;top:0"></video>`
3. Remove the Lottie's IX2 scroll interaction, add `fizz-scrub-video.js` (defer).
4. If a script (e.g. `fizz-flavor-transition-v5.js`, `fizzflavorlottieurl`) plays this
   Lottie through lottie-web, point it at the video instead — I could not read
   those hosted files, so check them first.

### One-line footer change

Make analytics non-blocking:
`<script src=".../fizz-posthog-v1.js" async></script>` (was synchronous).

## How to measure before/after

Chrome DevTools → Lighthouse (Mobile) and Performance with 4× CPU throttle,
Slow 4G, hard refresh. Compare: LCP, Total Blocking Time, the `.json`/`.mp4`
transfer size, and long tasks during first scroll.

Nothing has been changed on the live site.
