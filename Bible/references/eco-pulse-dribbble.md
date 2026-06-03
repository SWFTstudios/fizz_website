# Eco Pulse Dribbble reference

**URL:** https://dribbble.com/shots/27176050-Website-Animation-for-a-Smart-Water-Bottle-Product

## Patterns to implement for Fizz

| Pattern | Fizz file |
|---------|-----------|
| Monochromatic scene per variant | `src/lib/three/variantTheme.ts` |
| Pill glass header/footer | `src/styles/3d-product.css` (`.b3d-glass-pill`) |
| Smooth theme transition | `src/lib/three/themeTransition.ts` |
| Serif hero over product | `3d.html` + `.b3d-hero-serif` |
| Rim glow behind bottle | `compositeScene.ts` point light from `gradient.glow` |
| Bottom bar: swatches + CTA | `.b3d-variant-bar` |

## v1 default

Start with **charcoal-black** (packaging black bottle). Validate smoothness before leaning on electric-blue (teal monochromatic like Eco Pulse blue shots).

## Motion targets

See [14-MOTION-AND-SMOOTHNESS.md](../14-MOTION-AND-SMOOTHNESS.md).
