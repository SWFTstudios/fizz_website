# 00 — Start here

## Goal

Understand how the Fizz **3D homepage** fits into the repo and what you need running locally.

## Why this matters

Without this map, the 304 MB bottle GLTF and separate `3d-main.ts` entry look arbitrary. They exist to keep the main site fast and assets off git.

## What you are building

1. **WebGL canvas** — Full-bleed Three.js ocean (Spline GLTF or shader fallback); optional bottle in `full` phase.
2. **HTML glass UI** — Top nav, left link panel, right product card (full phase), bottom scroll chevron.
3. **Monochromatic themes** — One variant (`charcoal-black` first) tints water, fog, bottle hardware, and CSS together.
4. **Bible** — This folder documents every decision.

## Stack (one line each)

| Piece | Role |
|-------|------|
| Vite | On `3d-website-branch`, **`/` serves `3d.html`**; `index.html` builds as `legacy-home` |
| TypeScript | Scene logic in `src/lib/three/` |
| Three.js | WebGL on the branch homepage |
| GSAP | Smooth theme transitions |
| Cloudflare R2 | Hosts `fizz_bottle_3d_file_export.gltf` (~304 MB) |

## Env vars

```bash
VITE_B3D_PHASE=ocean          # ocean | full — ocean hides bottle + right panel
VITE_BOTTLE_GLTF_URL=https://your-cdn/models/fizz_bottle_3d_file_export.gltf
VITE_OCEAN_GLTF_URL=          # optional; shader ocean used if empty
```

Local dev URLs: `/local-dev/fizz_bottle_3d_file_export.gltf` and `/local-dev/ocean.gltf` (see [04-ASSETS-AND-R2.md](./04-ASSETS-AND-R2.md)).

## Branch

Work on `3d-website-branch`. Do not modify `fizz5.webflow/`.

On this branch, `npm run dev` → **`http://localhost:5173/`** is the 3D homepage. Compare with the legacy marketing home at `/legacy-home.html`.

## Next

Read [01-VISION-AND-SCOPE.md](./01-VISION-AND-SCOPE.md), then [11-REBUILD-CHECKLIST.md](./11-REBUILD-CHECKLIST.md) when ready to build.

## If it breaks

- Blank canvas → check browser console; set `VITE_BOTTLE_GLTF_URL` or use placeholder mode (no URL).
- CORS on GLTF → R2 bucket needs public read or Worker proxy (see [04-ASSETS-AND-R2.md](./04-ASSETS-AND-R2.md)).
- Ocean-only screenshots → set `VITE_B3D_PHASE=ocean`; see [../docs/3D-OCEAN-QA.md](../docs/3D-OCEAN-QA.md).
