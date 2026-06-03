# DevLink — Shop page (T.RICKS-style)

Hand-ported implementation lives in [`shop.html`](../shop.html), [`src/styles/shop-menu.css`](../src/styles/shop-menu.css), and [`src/lib/shop*.ts`](../src/lib/). Use this doc when authoring matching components in Webflow Designer for future `devlink sync`.

**References:**

- [DevLink Export](https://developers.webflow.com/devlink/docs/component-export)
- [Component architecture](https://developers.webflow.com/devlink/docs/component-export/design-guidelines/component-architecture)
- Live T.RICKS reference: https://t-ricks-menu-slider-f65f7f.webflow.io/
- Fizz site ID: `6a03870d6aa42355105ab9ae` ([`INSTRUCTIONS.md`](../INSTRUCTIONS.md))

## Macro components (export as full sections)

| Component | DOM / classes | Notes |
|-----------|---------------|--------|
| `ShopNav` | `.shop-nav`, `.shop-trigger`, `.shop-menu` | Menu overlay + top bar; open state via React/GSAP |
| `ShopHero` | `.shop-hero`, `.shop-hero__title`, `.shop-hero__lead` | Static copy props |
| `ShopCategorySlider` | `.shop-hero-slider`, `.shop-splide`, waves, `.shop-controls` | Slot `slideContent` for slides |
| `ShopCursor` | `.shop-cursor`, dots, `.shop-cursor__text` | Visual shell only; motion in app code |

## Micro components

| Component | Use |
|-----------|-----|
| `ShopControl` | Prev/next with `.shop-control__fill` |
| `ShopNavLink` | Numbered category link + line + image |
| `ShopSublink` | Home / Explore / Features row |
| `ShopSlideCard` | Category slide (image, overlay, title, desc, CTA) |

## Repeatable list pattern

- **Container:** `ShopCategorySlider` with Slot `slideContent`
- **Item:** `ShopSlideCard` — map `SHOP_CATEGORY_SLIDES` from [`src/lib/shopData.ts`](../src/lib/shopData.ts) in React

## Custom code in Webflow

DevLink does not export page-level custom code. Put component-scoped CSS/JS in **Code Embed** inside the component. Target namespaced classes:

```css
[class*="ShopSlideCard_shop-slide-media__"] {
  /* … */
}
```

## Behavior owned by app code (not IX2 export)

| Feature | Module |
|---------|--------|
| Splide carousel | [`categoryCarousel.ts`](../src/lib/categoryCarousel.ts) |
| Menu open + Lottie wave | [`shopMenu.ts`](../src/lib/shopMenu.ts) |
| Custom cursor | [`shopCursor.ts`](../src/lib/shopCursor.ts) |
| Control fill hover | [`shopControls.ts`](../src/lib/shopControls.ts) |

## Sync workflow

1. Install CLI: `npm install -g @webflow/webflow-cli` (or use `npx webflow`)
2. Authenticate: `webflow auth login`
3. Copy [`webflow.json.example`](../webflow.json.example) → `webflow.json` (gitignored if secrets)
4. `webflow devlink sync` — output goes to [`webflow/components/`](../webflow/components/)
5. Diff generated files; wire React only if/when shop route migrates off vanilla Barba

## Hand-port integration (current)

The live shop page uses vanilla TS modules bound to the class names above — no React export required for production:

| DevLink component | Implemented as |
|-------------------|----------------|
| `ShopNav` + menu | [`shop.html`](../shop.html) + [`shopMenu.ts`](../src/lib/shopMenu.ts) |
| `ShopHero` | [`shop.html`](../shop.html) hero section |
| `ShopCategorySlider` | [`categoryCarousel.ts`](../src/lib/categoryCarousel.ts) + Splide |
| `ShopCursor` | [`shopCursor.ts`](../src/lib/shopCursor.ts) |
| `ShopControl` | [`shopControls.ts`](../src/lib/shopControls.ts) + [`shop-menu.css`](../src/styles/shop-menu.css) |

## Current stack

FIZZ5 shop is **Vite + vanilla TS + Barba**. DevLink output is React — treat sync as design-source until a React shop route exists.
