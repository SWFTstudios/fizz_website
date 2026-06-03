# 03 — Repo map

## 3D experiment

| Path | Role |
|------|------|
| `3d.html` | Page shell |
| `src/3d-main.ts` | Boot script |
| `src/styles/3d-product.css` | Layout + glass |
| `src/lib/three/compositeScene.ts` | Renderer, loop, dispose |
| `src/lib/three/loadBottleGltf.ts` | GLTF or placeholder |
| `src/lib/three/loadOceanEnvironment.ts` | Water + sky meshes |
| `src/lib/three/bottleColors.ts` | Mesh tint rules |
| `src/lib/three/variantTheme.ts` | Apply variant to scene + DOM |
| `src/lib/three/themeTransition.ts` | GSAP color lerp |
| `src/lib/three/scrollCamera.ts` | Optional scroll motion |
| `src/data/brandTokens.ts` | Packaging copy |
| `src/data/3dProductCopy.ts` | Per-variant panel text |
| `scripts/upload-bottle-gltf.mjs` | R2 upload helper |
| `.env.example` | Env template |
| `Bible/` | This documentation |

## Shared Fizz5 data

| Path | Role |
|------|------|
| `src/lib/shopData.ts` | Six bottle SKUs + PNG paths |
| `src/data/bottleGradients.ts` | Gradient tokens per variant |
| `public/images/bottles/*.png` | Swatch images |

## Do not edit

- `fizz5.webflow/` — reference export only
