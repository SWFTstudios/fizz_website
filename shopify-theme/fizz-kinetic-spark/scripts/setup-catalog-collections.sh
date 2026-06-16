#!/usr/bin/env bash
# Create Fizz catalog collections on fizz-9820 via Shopify CLI.
#
# Prereqs:
#   shopify store auth --store fizz-9820.myshopify.com --scopes read_products,write_products
#
# Usage:
#   ./scripts/setup-catalog-collections.sh
#   STORE=other-store.myshopify.com ./scripts/setup-catalog-collections.sh

set -euo pipefail

STORE="${STORE:-fizz-9820.myshopify.com}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

run_query() {
  local query="$1"
  local variables="${2:-{}}"
  shopify store execute \
    --store "$STORE" \
    --query "$query" \
    --variables "$variables" \
    --json
}

run_mutation() {
  local query="$1"
  local variables="${2:-{}}"
  shopify store execute \
    --store "$STORE" \
    --query "$query" \
    --variables "$variables" \
    --allow-mutations \
    --json
}

echo "→ Store: $STORE"
echo "→ Resolving product IDs…"

PRODUCTS_JSON=$(run_query 'query ProductsByHandle {
  fizzBottle: productByHandle(handle: "fizz-bottle") { id title }
  fizzFlavors: productByHandle(handle: "fizz-flavor-packs") { id title }
  fizzCo2: productByHandle(handle: "fizz-co2-refills") { id title }
}')

get_product_id() {
  local key="$1"
  echo "$PRODUCTS_JSON" | node -e "
    const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
    const node = data?.data?.[process.argv[1]];
    if (!node?.id) process.exit(1);
    console.log(node.id);
  " "$key"
}

BOTTLE_ID=""
FLAVORS_ID=""
CO2_ID=""

if BOTTLE_ID=$(get_product_id fizzBottle 2>/dev/null); then
  echo "  ✓ fizz-bottle ($BOTTLE_ID)"
else
  echo "  ✗ fizz-bottle — import products_import_catalog.csv first"
fi

if FLAVORS_ID=$(get_product_id fizzFlavors 2>/dev/null); then
  echo "  ✓ fizz-flavor-packs ($FLAVORS_ID)"
else
  echo "  ✗ fizz-flavor-packs — import products_import_catalog.csv first"
fi

if CO2_ID=$(get_product_id fizzCo2 2>/dev/null); then
  echo "  ✓ fizz-co2-refills ($CO2_ID)"
else
  echo "  ✗ fizz-co2-refills — import products_import_catalog.csv first"
fi

ensure_collection() {
  local handle="$1"
  local title="$2"
  local template_suffix="$3"
  local product_id="$4"

  if [[ -z "$product_id" ]]; then
    echo "→ Skip collection $handle (product missing)"
    return 0
  fi

  echo "→ Collection: $title ($handle)"

  EXISTING=$(run_query 'query CollectionByHandle($handle: String!) {
    collectionByHandle(handle: $handle) { id title handle templateSuffix }
  }' "{\"handle\":\"$handle\"}")

  COLLECTION_ID=$(echo "$EXISTING" | node -e "
    const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
    const id = data?.data?.collectionByHandle?.id;
    if (id) console.log(id);
  " || true)

  if [[ -z "$COLLECTION_ID" ]]; then
    CREATE_RESULT=$(run_mutation 'mutation CollectionCreate($input: CollectionInput!) {
      collectionCreate(input: $input) {
        collection { id handle title templateSuffix }
        userErrors { field message }
      }
    }' "{\"input\":{\"title\":\"$title\",\"handle\":\"$handle\",\"templateSuffix\":\"$template_suffix\"}}")

    COLLECTION_ID=$(echo "$CREATE_RESULT" | node -e "
      const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
      const errs = data?.data?.collectionCreate?.userErrors ?? [];
      if (errs.length) {
        console.error(errs.map(e => e.message).join('; '));
        process.exit(1);
      }
      console.log(data.data.collectionCreate.collection.id);
    ")
    echo "  ✓ Created ($COLLECTION_ID)"
  else
    echo "  ✓ Already exists ($COLLECTION_ID)"
    if [[ -n "$template_suffix" ]]; then
      run_mutation 'mutation CollectionUpdate($input: CollectionInput!) {
        collectionUpdate(input: $input) {
          collection { id templateSuffix }
          userErrors { field message }
        }
      }' "{\"input\":{\"id\":\"$COLLECTION_ID\",\"templateSuffix\":\"$template_suffix\"}}" >/dev/null
      echo "  ✓ Template suffix: $template_suffix"
    fi
  fi

  ADD_RESULT=$(run_mutation 'mutation CollectionAddProducts($id: ID!, $productIds: [ID!]!) {
    collectionAddProducts(id: $id, productIds: $productIds) {
      collection { id title productsCount { count } }
      userErrors { field message }
    }
  }' "{\"id\":\"$COLLECTION_ID\",\"productIds\":[\"$product_id\"]}")

  echo "$ADD_RESULT" | node -e "
    const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
    const errs = data?.data?.collectionAddProducts?.userErrors ?? [];
    if (errs.length) {
      const msg = errs.map(e => e.message).join('; ');
      if (msg.includes('already') || msg.includes('exist')) {
        console.log('  ✓ Product already in collection');
        process.exit(0);
      }
      console.error('  ✗ ' + msg);
      process.exit(1);
    }
    const count = data?.data?.collectionAddProducts?.collection?.productsCount?.count;
    console.log('  ✓ Products in collection: ' + (count ?? '?'));
  "
}

# templateSuffix: empty string = default collection.json; "flavors" / "co2" match theme templates
ensure_collection "bottles" "Fizz Bottles" "" "$BOTTLE_ID"
ensure_collection "flavors" "Fizz Flavor Packs" "flavors" "$FLAVORS_ID"
ensure_collection "co2-refills" "Fizz Charge" "co2" "$CO2_ID"

echo ""
echo "Done. Verify in Admin → Products → Collections"
echo "  https://$STORE/admin/collections"
