# UI class conventions (FIZZ5)

Use these patterns in `src/`, product HTML, and collection pages. Do not add one-off `*-cta` button classes.

## Buttons

Always combine a base class with exactly one variant:

| Class | Use |
|-------|-----|
| `fizz-btn` | Required base (typography, padding, pill shape) |
| `fizz-btn--primary` | Filled actions (e.g. Add to Cart) |
| `fizz-btn--outline` | Bordered actions on colored backgrounds (View product, home intro) |
| `fizz-btn--ghost` | Glass-style on dark UI (explore modals, end screen) |

Optional modifiers:

- `fizz-btn--arrow` — adds arrow child animation; use `<span class="fizz-btn__arrow">→</span>`
- `fizz-btn--block` — full width

Layout-only hooks (no button skin): `product-pdp__buy`, `zs-card-detail-cta-wrap`

Legacy hook: `cta-link` on home may remain for Webflow; pair with `fizz-btn fizz-btn--outline`.

Styles live in [`src/styles/buttons.css`](../src/styles/buttons.css).

## Typography

| Class | Use |
|-------|-----|
| `fizz-heading` / `fizz-heading--lg` / `fizz-heading--md` | Display titles |
| `fizz-lead` / `fizz-body` | Body copy |
| `fizz-label` / `fizz-mono` | Mono UI labels (nav, metadata) |
| `fizz-eyebrow` | Overlines |
| `fizz-caption` | Secondary mono text |

## Shop layout (structure only)

- Product PDP: `product-pdp__*`, `product-pdp-detail`
- Collection: `collection-hero`, `collection-grid`, `product-card`

Do not put button colors or padding on these layout classes.

## Linting

- `npm run lint` — ESLint (TypeScript)
- `npm run lint:css` — Stylelint (`src/styles/**/*.css`)
- `npm run lint:css:deprecated` — blocks reintroduced `card-cta`, `product-pdp__cta`, `zs-end-cta`, `zs-card-detail-cta`
- `npm run lint:all` — all of the above + typecheck
