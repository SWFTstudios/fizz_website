# Shopify store setup — fizz-9820

Complete these steps in [Shopify Admin](https://admin.shopify.com/store/fizz-9820) so the theme renders the Fizz catalog.

## Catalog overview

| Family | Shopify setup | Smart collection tag | Collection handle |
|--------|---------------|----------------------|-------------------|
| Fizz Bottle | `fizz-bottle` — 6 color **variants** | `Bottle` | `bottles` |
| Flavor Packs | 3 **separate products** (see below) | `Flavor Packs` | `flavor-packs` |
| Fizz Charge (CO₂) | `fizz-co2-refills` — 1 SKU + selling plans | `CO2 Canisters` | `co2-canisters` |

**Smart collections** auto-populate from product tags. Import [`products_import_catalog.csv`](./products_import_catalog.csv) — see [`PRODUCT-IMPORT.md`](./PRODUCT-IMPORT.md).

Theme sections expand **bottle variants** into cards when the `bottles` collection has one parent product (`fizz-variant-card.liquid`). Flavor collections loop **products** (3 cards).

---

## 1. Products

### Fizz Bottle (`fizz-bottle`)

- **Tag:** `Bottle`
- **Theme template:** `bottle`
- **Option:** Color — Charcoal Black, Arctic White, Coral Orange, Sage Green, Electric Blue, Steel Navy
- **Price:** $50.00 per variant (edit in CSV if needed)

### Flavor Packs (3 products)

| Handle | Title | Tag |
|--------|-------|-----|
| `fizz-flavor-orange-tangerine` | Orange Tangerine | `Flavor Packs` |
| `fizz-flavor-zesty-lime` | Zesty Lime | `Flavor Packs` |
| `fizz-flavor-mixed-berry` | Mixed Berry | `Flavor Packs` |

- **Theme template:** `flavor-pack` (each product)
- **Price:** $1.50
- Upload pack images from `assets/flavor-pack-*.png` after import

### Fizz Charge (`fizz-co2-refills`)

- **Tag:** `CO2 Canisters`
- **Theme template:** `co2-refill`
- **Selling plans:** Monthly / quarterly (Shopify Payments required)

---

## 2. Smart collections (already created)

| Title | Condition | Theme template |
|-------|-----------|----------------|
| Bottles | Product tag equals `Bottle` | default `collection.json` |
| Flavor Packs | Product tag equals `Flavor Packs` | **`flavors`** |
| CO2 Canisters | Product tag equals `CO2 Canisters` | **`co2`** |

Assign templates: **Products → Collections → [collection] → Theme template**.

---

## 3. Navigation & homepage

| Label | URL |
|-------|-----|
| Fizz Bottles | `/collections/bottles` |
| Flavor Packs | `/collections/flavor-packs` |
| Fizz Charge | `/collections/co2-canisters` |

Homepage category tiles use the same URLs (`index.json`).

---

## 4. Import workflow

1. **Products → Import** → `products_import_catalog.csv` (overwrite matching handles)
2. Confirm smart collection counts: Bottles **1**, Flavor Packs **3**, CO2 Canisters **1**
3. Assign theme templates per product and collection
4. Upload flavor pack images to products

---

## 5. Future: Bundles (not implemented)

Starter kit: Bottle + Flavor box + CO₂ subscription. Implement via Shopify Bundles when variant/product IDs are stable.

---

## 6. Publish theme

```bash
cd shopify-theme/fizz-kinetic-spark
shopify theme push --store fizz-9820.myshopify.com --live --allow-live
```
