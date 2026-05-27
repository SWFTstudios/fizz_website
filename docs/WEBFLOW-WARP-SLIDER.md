# Warp Slider → Webflow deployment notes

**Site:** [warp-slider-6a5470.design.webflow.com](https://warp-slider-6a5470.design.webflow.com/)

## MCP status

Webflow MCP returned `Unauthorized` during implementation. Re-authenticate in Cursor (Webflow plugin settings), open the warp-slider project in **Webflow Designer**, then use the snippets below with `whtml_builder` / `asset_tool`.

## Local reference implementation

The same UX is implemented in this repo for preview and porting:

| Page | URL (dev) | File |
|------|-----------|------|
| Shop categories (warp Splide — single carousel) | `/shop.html` | [`shop.html`](../shop.html) |

Simple Splide category carousel (`perPage: 3`, `focus: center`, custom prev/next). Warp/mask effects were removed from the local build; use the [warp-slider Webflow site](https://warp-slider-6a5470.webflow.io/) as a visual reference when porting to Designer.
| Bottles grid | `/bottles.html` | [`bottles.html`](../bottles.html) |
| Flavors stub | `/flavors.html` | [`flavors.html`](../flavors.html) |
| CO₂ stub | `/co2.html` | [`co2.html`](../co2.html) |

Assets: [`public/images/bottles/`](../public/images/bottles/)

## Bottle render sources (local)

Marketing exports live in `~/Downloads/BottleRender_Marketing 2/`. Re-import into the repo with:

```bash
npm run assets:bottles
```

Optional custom source path: `node scripts/import-bottle-renders.mjs "/path/to/BottleRender_Marketing 2"`

| Repo file | Product | Source render |
|-----------|---------|---------------|
| `bottle-orange.png` | Coral Orange | `…Render_Camera 6_8.png` |
| `bottle-black.png` | Charcoal Black | `…Render_Camera 6_9.png` |
| `bottle-green.png` | Sage Green | `…Render_Camera 6_10.png` |
| `bottle-navy.png` | Steel Navy | `…Render_Camera 6_11.png` |
| `bottle-white.png` | Arctic White | `…Render_Camera 6_12.png` |
| `bottle-blue.png` | Electric Blue | `…Render_Camera 6_7.png` |
| `lineup.png` | Shop category slide | `…ColorLineUp_Camera 7_14.png` |

Imports resize to 1024px max edge and keep RGBA transparency. Keep these filenames when swapping assets so [`src/lib/shopData.ts`](../src/lib/shopData.ts) paths stay valid.

## Upload assets (Webflow)

Upload these files via `asset_tool → upload_image_by_url` (host from staging/CDN) or Designer:

- `bottle-orange.png` — Coral Orange
- `bottle-black.png` — Charcoal Black
- `bottle-green.png` — Sage Green
- `bottle-navy.png` — Steel Navy
- `bottle-white.png` — Arctic White
- `bottle-blue.png` — Electric Blue
- `lineup.png` — category slide background

## Shopify hooks (on each product card)

```html
<article
  class="product-card"
  data-shopify-product-id=""
  data-shopify-variant-id=""
>
  <button type="button" class="card-cta" data-shopify-add-to-cart>Add to Cart</button>
</article>
```

## Bottle gradients (card-bg)

| Color | CSS background |
|-------|----------------|
| Coral Orange | `radial-gradient(circle at 60% 40%, #f0a080, #e8724f 60%, #b84a28)` |
| Charcoal Black | `radial-gradient(circle at 60% 40%, #3a4455, #1e2530 60%, #0a0e14)` |
| Sage Green | `radial-gradient(circle at 60% 40%, #ddebd4, #c5d3bc 60%, #8fa888)` |
| Steel Navy | `radial-gradient(circle at 60% 40%, #4a6a80, #2c4557 60%, #101d26)` |
| Arctic White | `radial-gradient(circle at 60% 40%, #ffffff, #e8e8e8 60%, #c0c0c0)` |
| Electric Blue | `radial-gradient(circle at 60% 40%, #7080d0, #4a5ca6 60%, #202870)` |

## Publish

After Designer changes: `data_sites_tool → publish_site` with `publishToWebflowSubdomain: true`.
