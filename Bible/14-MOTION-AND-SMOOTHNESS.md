# 14 — Motion and smoothness

## Reference

[Eco Pulse Dribbble](https://dribbble.com/shots/27176050-Website-Animation-for-a-Smart-Water-Bottle-Product)

## Targets

| Property | Value | Why |
|----------|-------|-----|
| Theme transition duration | 0.85s | Feels smooth, not sluggish |
| Easing | `power2.inOut` | Eco Pulse–style ease |
| Idle bottle rotation | 0.15 rad/min | Subtle life; off if `prefers-reduced-motion` |
| Material updates | GSAP lerp hex | Avoid per-frame `new Color()` churn |

## Implementation

- `src/lib/three/themeTransition.ts` — `animateThemeTransition()`
- `src/lib/three/variantTheme.ts` — calls transition when `animate: true`

## What feels cheap (avoid)

- Instant hex snap on variant click
- Re-loading GLTF on variant change
- Full scene graph rebuild per theme
- Pixel ratio 3 on retina without cap

## Scroll (v2)

`scrollCamera.ts` — subtle camera Z drift via ScrollTrigger; disabled when reduced motion.
