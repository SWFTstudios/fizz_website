# Fizz Kinetic Spark — Shopify Theme

Standalone Online Store 2.0 theme ported from Google Stitch (Kinetic Spark design system). Lives at [`shopify-theme/fizz-kinetic-spark/`](../shopify-theme/fizz-kinetic-spark/) and is **independent** of the Vite `fizz5` app.

## Stitch → template mapping

| Stitch screen | Theme template | Sections |
|---------------|----------------|----------|
| Color-Changing Sparkle Storefront | `templates/index.json` | **fizz5 homepage:** `fizz-hero-slider`, `fizz-intro`, `fizz-promo`, `fizz-category-tiles`, `fizz-collections-rail`, `fizz-usp-grid`, `fizz-newsletter` (no Lottie) |
| Fizz Shop — Dark Lifestyle Collection | `templates/collection.json` | `ks-collection-hero`, `ks-product-grid`, `ks-flavor-collection-grid`, `ks-science-block` |
| Aspirational Lifestyle + Shop the Look | `templates/page.lifestyle.json` | `ks-hero-slideshow`, `ks-moments-shop-the-look`, `ks-kinetic-spark-window` |

Shared: `ks-header`, `ks-footer`, snippets `ks-nav`, `ks-product-card`, `ks-button`, `ks-stitch-img`.

## Liquid & AI toolkit (Cursor)

Two layers: **editor** support while you write Liquid, and **agent** support so Cursor validates theme code against Shopify schemas.

### Editor (Liquid language server)

1. Install the [Shopify Liquid](https://marketplace.visualstudio.com/items?itemName=Shopify.theme-check-vscode) extension when Cursor prompts (see `.vscode/extensions.json`), or run **Extensions: Install Extensions** and search `Shopify Liquid`.
2. Reload Cursor. Open any file under `shopify-theme/fizz-kinetic-spark/` — you should get syntax highlighting, hover docs, completions, and Theme Check diagnostics.
3. Format-on-save for `.liquid` is enabled in `.vscode/settings.json`.

The extension uses Shopify CLI’s language server (`shopify theme language-server`). Requires Shopify CLI installed (you already have this for `shopify theme dev`).

### Agent (Shopify AI Toolkit)

For AI-assisted theme work, use one or both:

| Method | Status in this repo |
|--------|---------------------|
| **Cursor plugin** | Run `/add-plugin shopify` in chat, or install from [Cursor Marketplace](https://cursor.com/marketplace/shopify) |
| **Dev MCP** | `user-shopify-dev-mcp` — docs search, `validate_theme`, GraphQL validation |

Liquid validation in MCP is automatic on the latest `@shopify/dev-mcp` ([changelog](https://shopify.dev/changelog/dev-mcp-now-supports-liquid)). When editing theme files, the agent should call `validate_theme` with `absoluteThemePath` pointing at `shopify-theme/fizz-kinetic-spark/`.

Docs: [Shopify AI Toolkit](https://shopify.dev/docs/apps/build/ai-toolkit) · [Liquid language server](https://shopify.dev/docs/storefronts/themes/tools/cli/language-server)

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
