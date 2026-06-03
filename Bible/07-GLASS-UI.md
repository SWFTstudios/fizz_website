# 07 — Glass UI

## Tokens

```css
.b3d-glass {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 16px;
}
.b3d-glass-pill { border-radius: 999px; }
```

## Dark page (charcoal-black)

Use `.b3d-page--dark`: light text, glass on dark canvas.

## Accessibility

- `@media (prefers-reduced-transparency: reduce)` → opaque panels
- Contrast: hero serif white on dark; body text `#c8d0dc` minimum

## Layout

- Header: fixed top, pill nav
- Hero: layered over canvas, pointer-events none on type (except links)
- Panels: left column, glass cards
- Footer: variant bar + Shop CTA

## File

`src/styles/3d-product.css`
