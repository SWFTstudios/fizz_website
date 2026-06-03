# 3D Ocean — Screenshot QA Checklist

Use this gate before enabling Phase 2 (`VITE_B3D_PHASE=full`).

## Reference

- **Spline scene:** [prod.spline.design/0OVAGb4XgFKLidwH](https://prod.spline.design/0OVAGb4XgFKLidwH/scene.splinecode)
- **Local dev:** `npm run dev` → open `/` with `VITE_B3D_PHASE=ocean` in `.env`
- **Ocean GLTF (optional):** `VITE_OCEAN_GLTF_URL=/local-dev/ocean.gltf`

## Setup

1. Set `.env`:
   ```bash
   VITE_B3D_PHASE=ocean
   VITE_OCEAN_GLTF_URL=/local-dev/ocean.gltf   # if file exists in Downloads
   ```
2. Hard-refresh at desktop width (≥1280px).
3. Capture a full-viewport screenshot at default camera (no scroll).

## Visual checklist

| # | Check | Pass? |
|---|--------|-------|
| 1 | Horizon line sits ~**40% from bottom** of viewport (low camera, waterline feel) | ☐ |
| 2 | Water shows **animated shimmer** (Gerstner shader or GLTF wave hook) | ☐ |
| 3 | Sky/horizon gradient reads as **hazy band** above water, not flat gray | ☐ |
| 4 | Scene feels **endless** — no visible plane edge at normal FOV | ☐ |
| 5 | Side-by-side with Spline screenshot: similar **mood, horizon height, water tone** | ☐ |
| 6 | Default variant **charcoal-black** — deep fog `#06080c`, cool mid water tint | ☐ |
| 7 | Left **glass nav panel** visible; right product panel **hidden** in ocean phase | ☐ |
| 8 | Bottom **scroll chevron** visible; header nav intact | ☐ |

## Variant tint

Toggle is disabled in ocean phase UI — verify in devtools:

```js
window.__b3dScene.setVariant('electric-blue', true)
```

| # | Check | Pass? |
|---|--------|-------|
| 9 | Fog + background shift to variant `deep` | ☐ |
| 10 | Water tint shifts to variant `mid`; horizon to `highlight` | ☐ |
| 11 | Rim light color matches variant `glow` | ☐ |

## Performance

| # | Check | Pass? |
|---|--------|-------|
| 12 | **~60fps** on desktop (M-series Mac or equivalent) | ☐ |
| 13 | `devicePixelRatio` capped at **2** (see `compositeScene.ts`) | ☐ |
| 14 | No sustained GPU thermal throttle in 30s idle | ☐ |

## Accessibility / fallback

| # | Check | Pass? |
|---|--------|-------|
| 15 | `prefers-reduced-motion: reduce` disables camera bob | ☐ |
| 16 | WebGL disabled → fallback panel with product link | ☐ |

## Sign-off

- [ ] All visual checks pass vs Spline reference
- [ ] Ready to set `VITE_B3D_PHASE=full` and proceed to bottle + materials QA

See also: [3D-BOTTLE-MATERIALS.md](./3D-BOTTLE-MATERIALS.md), [Bible/06-VARIANT-THEMING.md](../Bible/06-VARIANT-THEMING.md).
