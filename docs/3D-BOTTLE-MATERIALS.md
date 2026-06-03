# 3D Bottle — Materials Reference

Single source of truth for bottle PBR, scene tokens, and swatch colors. Code lives in `src/lib/three/bottleColors.ts`, `src/data/bottleVariantPalette.ts`, and `src/data/bottle-futuristic-gradients.json`.

Cross-link: [Bible/06-VARIANT-THEMING.md](../Bible/06-VARIANT-THEMING.md)

---

## A. Scene tokens (per variant slug)

From `bottle-futuristic-gradients.json` via `getFuturisticGradient()`:

| Token | Controls | Example (charcoal-black) |
|-------|----------|--------------------------|
| `deep` | Background, fog | `#06080c` |
| `mid` | Water tint | `#1e2530` |
| `highlight` | Horizon haze | `#3d4a5c` |
| `glow` | Rim light | `#5ec8e8` |
| `accent` | UI / active swatch | `#4ab8d4` |

Applied in `variantTheme.ts` → `applyVariantTheme()`.

---

## B. Bottle mesh roles

From `bottleColors.ts` → `getMeshRole()`:

| Role | GLTF name patterns | Material behavior |
|------|-------------------|-------------------|
| `clearBody` | `FIZZ_BODY`, `TRITAN`, `CLEAR`, `GLASS` | transmission ~0.94–0.96, `bodyColor` tint, IOR 1.5 |
| `hardware` | `BOTTLEHARDCAP`, `BOOTPART`, `CANISTERBODY`, … | opaque, `hardwareColor`, metalness/roughness from palette |
| `internal` | springs, seals, valves, … | hidden on hero; toggle via “Show internals” |
| `ignore` | `BOTTLEMAINBODY`, studio cameras | hidden |

---

## C. Swatchable colors per SKU

From `bottleVariantPalette.ts`:

| Slug | hardwareColor | bodyColor |
|------|---------------|-----------|
| coral-orange | `#e8724f` | `#fff8f4` |
| charcoal-black | `#30343c` | `#f5f8fb` |
| sage-green | `#c5d3bc` | `#f6faf4` |
| steel-navy | `#344f66` | `#f6f9fc` |
| arctic-white | `#f4f5f7` | `#fbfdff` |
| electric-blue | `#4a5ca6` | `#f4f6ff` |

Each swatch button (`data-variant="{slug}"`) calls `setVariant(slug)` → `applyBottleVariantMaterials()`.

---

## D. Fixed PBR constants (do not change per swatch)

| Property | clearBody | hardware |
|----------|-----------|----------|
| IOR | 1.5 | — |
| transmission | 0.94–0.96 | 0 |
| depthWrite | false | true |
| metalness | 0 | per-slug from palette |
| roughness | ~0.08 | per-slug from palette |

---

## E. Dev mesh inventory

On first real GLTF load in **DEV**, `logBottleMeshInventory()` prints a `console.table` of every mesh name, assigned role, and visibility.

```bash
npm run dev   # VITE_B3D_PHASE=full
# Open / → DevTools console
```

Verify export names match patterns in section B. If a mesh shows `role: unknown`, add a pattern to `getMeshRole()` in `bottleColors.ts`.

---

## Phase flags

| Env | Scene | UI |
|-----|-------|-----|
| `VITE_B3D_PHASE=ocean` | Ocean only, lower camera | Left nav; no right panel |
| `VITE_B3D_PHASE=full` | Ocean + bottle, idle Y rotation | Right panel: title, Buy Now → `/products/{slug}.html`, swatches |

Buy Now href updates in `variantTheme.ts` → `updateDomCopy()`.
