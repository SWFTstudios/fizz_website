# Product CSV import — fizz-9820

## Catalog model

| Family | Products | Smart collection tag | Collection (auto) |
|--------|----------|----------------------|-------------------|
| Bottles | `fizz-bottle` (6 color variants) | `Bottle` | **Bottles** |
| Flavors | 3 separate products (below) | `Flavor Packs` | **Flavor Packs** |
| CO₂ | `fizz-co2-refills` | `CO2 Canisters` | **CO2 Canisters** |

### Flavor products (individual, not variants)

| Handle | Title |
|--------|-------|
| `fizz-flavor-orange-tangerine` | Orange Tangerine |
| `fizz-flavor-zesty-lime` | Zesty Lime |
| `fizz-flavor-mixed-berry` | Mixed Berry |

---

## Why the first import failed

The previous CSV used:

- A **short header** Shopify did not recognize
- **Custom metafield columns** (`color_slug`, `pack_slug`) not defined in Admin
- **Multi-line HTML** in some cells

This file matches your **exact export column order** from `products_export.csv` and uses only standard fields.

---

## Import steps

1. **Products → Import**
2. Upload [`products_import_catalog.csv`](./products_import_catalog.csv)
3. Check **Overwrite products with matching handles** (updates `fizz-bottle`)
4. Import

### After import

| Task | Where |
|------|-------|
| **Product images** | From repo root: `npm run shopify:upload-images` (after `shopify store auth`) |
| Flavor pack images (theme fallback) | `assets/flavor-pack-*.png`, `assets/fizz-co2-charge.png` |
| Theme template `bottle` | Fizz Bottle → Theme template → **bottle** |
| Theme template `flavor-pack` | Each flavor product → **flavor-pack** |
| Theme template `co2-refill` | Fizz Charge → **co2-refill** |
| Smart collections | Should auto-fill when tags match (0 → 1 or 3 products) |
| Collection templates | **Flavor Packs** → template **flavors**; **CO2 Canisters** → **co2** |

### Verify smart collections

| Collection | Condition | Expected count |
|------------|-----------|------------------|
| Bottles | Tag equals `Bottle` | 1 (`fizz-bottle`) |
| Flavor Packs | Tag equals `Flavor Packs` | 3 |
| CO2 Canisters | Tag equals `CO2 Canisters` | 1 |

### Storefront URLs

- `/collections/bottles`
- `/collections/flavor-packs`
- `/collections/co2-canisters`

---

## Tags must match exactly

Tags in the CSV are case-sensitive for smart collections:

- `Bottle` (not `bottle`)
- `Flavor Packs` (not `Flavor packs`)
- `CO2 Canisters` (not `CO2 canisters`)

---

## Pricing

Bottle variants: **$50.00** (matches your current store). Flavors: **$1.50**. CO₂: **$18.00**. Edit the CSV before import if you want different prices.
