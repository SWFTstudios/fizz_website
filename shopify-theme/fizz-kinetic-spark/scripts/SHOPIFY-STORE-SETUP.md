# Shopify store setup — fizz-9820

Complete these steps in [Shopify Admin](https://admin.shopify.com/store/fizz-9820) so the Kinetic Spark theme renders with real catalog data.

## 1. Products (bottles)

Create six products with these **handles** (must match for collection automation):

| Handle | Title | Suggested price |
|--------|-------|-----------------|
| `coral-orange` | Fizz Origin — Coral Orange | $34.00 |
| `charcoal-black` | Fizz Origin — Charcoal Black | $34.00 |
| `sage-green` | Fizz Origin — Sage Green | $34.00 |
| `steel-navy` | Fizz Origin — Steel Navy | $34.00 |
| `arctic-white` | Fizz Origin — Arctic White | $34.00 |
| `electric-blue` | Fizz Origin — Electric Blue | $34.00 |

Copy descriptions from [`src/lib/shopData.ts`](../../../src/lib/shopData.ts). Upload bottle images from [`public/images/bottles/`](../../../public/images/bottles/) or use Stitch assets (`assets/stitch-*.jpg`).

## 1b. Flavor products

Create three flavor sachet products with these **handles** (must match pack image slugs):

| Handle | Title | Suggested price | Pack image asset |
|--------|-------|-----------------|------------------|
| `orange-tangerine` | Orange Tangerine | $1.50 | `flavor-pack-orange-tangerine.png` |
| `zesty-lime` | Zesty Lime | $1.50 | `flavor-pack-zesty-lime.png` |
| `mixed-berry` | Mixed Berry | $1.50 | `flavor-pack-mixed-berry.png` |

Upload each product’s featured image from `assets/flavor-pack-*.png` in the theme (or use theme fallback blocks until products exist).

## 2. Collections

| Handle | Title | Rule |
|--------|-------|------|
| `bottles` | Bold Bottles | Manual or automated — include all six bottle products |
| `flavors` | Instant Flavors | Include all three flavor sachet products |

**Flavors collection template:** In Admin → Collections → Instant Flavors → Theme template, choose **`flavors`** (`collection.flavors.json`) for the dedicated 3-pack grid page at `/collections/flavors`.

Assign `templates/collection.json` sections by visiting any collection — the theme uses the default collection template.

## 3. Lifestyle page

1. **Online Store → Pages → Add page**
2. Title: `Lifestyle`
3. Template: `page.lifestyle` (appears after theme is uploaded)
4. Save

## 4. Navigation

**Online Store → Navigation → Main menu** (`main-menu`):

| Label | Link |
|-------|------|
| Shop All | `/collections/bottles` |
| Flavors | `/collections/flavors` |
| Science | `/pages/science` (optional page) |
| Lifestyle | `/pages/lifestyle` |

Footer menus: configure in theme editor → Footer → Explore / Support link lists.

## 5. Theme editor

1. **Online Store → Themes → Customize** (Kinetic Spark dev theme)
2. Homepage → Featured Bottles → select **bottles** collection
3. Collection template → Flavor grid → select **flavors** collection
4. Lifestyle page → Moments section → assign hotspot products per tile
5. Upload images for any Stitch assets that failed import (403 URLs)

## 6. Publish

When satisfied:

```bash
shopify theme push --unpublished --store fizz-9820.myshopify.com
# Review preview URL, then:
shopify theme publish --store fizz-9820.myshopify.com
```

## Quick-add / cart

Quick Add buttons use the [Cart AJAX API](https://shopify.dev/docs/api/ajax/reference/cart) (`/cart/add.js`). Products must be **active** with available inventory.
