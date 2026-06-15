# Fizz Kinetic Spark — Shopify Theme

Standalone Online Store 2.0 theme ported from Google Stitch (Kinetic Spark design system). Lives at [`shopify-theme/fizz-kinetic-spark/`](../shopify-theme/fizz-kinetic-spark/) and is **independent** of the Vite `fizz5` app.

## Stitch → template mapping

| Stitch screen | Theme template | Sections |
|---------------|----------------|----------|
| Color-Changing Sparkle Storefront | `templates/index.json` | `ks-hero-sparkle`, `ks-featured-bottles`, `ks-brand-mission`, `ks-flavor-cta`, `ks-flavor-grid`, `ks-benefits`, `ks-lifestyle-masonry`, `ks-newsletter` |
| Fizz Shop — Dark Lifestyle Collection | `templates/collection.json` | `ks-collection-hero`, `ks-product-grid`, `ks-flavor-collection-grid`, `ks-science-block` |
| Aspirational Lifestyle + Shop the Look | `templates/page.lifestyle.json` | `ks-hero-slideshow`, `ks-moments-shop-the-look`, `ks-kinetic-spark-window` |

Shared: `ks-header`, `ks-footer`, snippets `ks-nav`, `ks-product-card`, `ks-button`, `ks-stitch-img`.

## Development

```bash
cd shopify-theme/fizz-kinetic-spark

# Install theme tooling (Tailwind)
npm install

# Download Stitch images from ~/Downloads export
npm run import:assets

# Compile CSS (required after Liquid/class changes)
npm run build:css
# or watch:
npm run watch:css

# Preview on store (keep running in a terminal)
shopify theme dev --store fizz-9820.myshopify.com
```

Preview URLs:

- Local: `http://127.0.0.1:9292`
- Store preview: append `?preview_theme_id=…` from CLI output

## Deploy

```bash
cd shopify-theme/fizz-kinetic-spark

shopify theme check
shopify theme push --unpublished --store fizz-9820.myshopify.com
shopify theme publish --store fizz-9820.myshopify.com   # when ready
```

## Assets

- Stitch images: `assets/stitch-*.jpg` (flat folder — Shopify does not allow asset subfolders)
- URL map: `assets/stitch-asset-map.json`
- Some non-public `aida/` URLs return 403 — upload those in the theme editor or replace fallback asset names in section settings.

## Store setup

See [`shopify-theme/fizz-kinetic-spark/scripts/SHOPIFY-STORE-SETUP.md`](../shopify-theme/fizz-kinetic-spark/scripts/SHOPIFY-STORE-SETUP.md) for products, collections, navigation, and the Lifestyle page.

## Design tokens

- Source: Stitch `kinetic_spark/DESIGN.md`
- Build: `src/styles/kinetic-spark.css` → `assets/kinetic-spark.css`
- Fonts: Hanken Grotesk, JetBrains Mono, Material Symbols (loaded in `layout/theme.liquid`)
