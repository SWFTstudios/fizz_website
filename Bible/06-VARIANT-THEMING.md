# 06 — Variant theming

## Goal

Per SKU, the **scene** stays monochromatic (Eco Pulse rule) while the **bottle** matches PDP product photography: opaque colored hardware + clear Tritan body.

## Data flow

```
shop slug (charcoal-black)
  → bottle-futuristic-gradients.json     → scene fog, ocean, rim, CSS --b3d-*
  → bottleVariantPalette.ts              → bottle hardware + clear body PBR
  → variantTheme.apply()
       ├── applyBottleVariantMaterials()  (opaque hardware, clear body)
       ├── water / sky materials
       ├── scene.fog
       └── CSS --b3d-* on <body>
```

## Bottle materials

| Part | Source | 3D |
|------|--------|-----|
| Cap, base, infuser | `public/images/bottles/bottle-*.png` | `hardwareColor` in `src/data/bottleVariantPalette.ts` |
| Fluted chamber | Product copy (clear Tritan) | `bodyColor` + high `transmission` |
| Internal CAD | Hidden on hero | `prepareBottleSceneGraph({ hideInternal: true })` |

Mesh roles are assigned in `src/lib/three/bottleColors.ts` by GLTF node name (`FIZZ_BODY`, `BOTTLEMAINBODY`, `BOTTLEHARDCAP`, `CANISTERBODY`, etc.).

## Scene tokens (example: charcoal-black)

| Token | Hex | Use |
|-------|-----|-----|
| deep | `#06080c` | Background, fog |
| mid | `#1e2530` | Water |
| highlight | `#3d4a5c` | Horizon haze |
| glow | `#5ec8e8` | Rim light |
| accent | `#4ab8d4` | CTA, active swatch |

## API

```ts
setActiveVariant(slug: string, { animate?: boolean })
```

See `src/lib/three/variantTheme.ts`.
