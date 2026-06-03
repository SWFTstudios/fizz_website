# 02 — Stack choices

## Vite multi-page app (not Next.js)

**Why:** Fizz5 is already Vite + HTML pages. Adding `3d.html` keeps one build, one deploy. Spline’s Next exports (`fizz_bottle_scene_self_hosted`, `ocean_scene_self_hosted`) are reference only.

## Three.js (not @splinetool/runtime in prod)

**Why:** We need one scene, shared materials, and variant tinting on bottle + water + fog. GLTF from Spline export is standard Three.js input. Runtime `.splinecode` is harder to sync with custom theming.

## R2 (not git LFS)

**Why:** Bottle GLTF is ~304 MB embedded base64. Git would bloat forever. R2 + `VITE_BOTTLE_GLTF_URL` keeps clones fast.

## HTML glass UI (not 3D UI meshes)

**Why:** `backdrop-filter` glass is cheaper than rendering UI in WebGL. Eco Pulse look is achievable in CSS.

## Separate `src/3d-main.ts`

**Why:** Homepage loads Lottie, Barba, Splide. Three.js is heavy; only `/3d.html` should pay that cost.
