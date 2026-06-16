# Smart collections (tag-based)

Your store uses **automated collections** — products appear when tags match. No manual product assignment needed.

## Collection rules (must match CSV tags exactly)

| Collection | Condition | Products after import |
|------------|-----------|------------------------|
| **Bottles** | Tag equals `Bottle` | `fizz-bottle` |
| **Flavor Packs** | Tag equals `Flavor Packs` | 3 flavor products |
| **CO2 Canisters** | Tag equals `CO2 Canisters` | `fizz-co2-refills` |

## After import

1. Refresh **Products → Collections** — counts should be 1 / 3 / 1 (not 0)
2. Set **Theme template** on each collection:
   - Flavor Packs → **flavors**
   - CO2 Canisters → **co2**
3. Verify URLs:
   - `/collections/bottles`
   - `/collections/flavor-packs`
   - `/collections/co2-canisters`

## If a collection stays at 0 products

- Open the product in Admin → check **Tags** match exactly (case-sensitive)
- Re-import CSV with **Overwrite** enabled

The CLI script [`setup-catalog-collections.sh`](./setup-catalog-collections.sh) is for **manual** collections only. Skip it when using smart collections.
