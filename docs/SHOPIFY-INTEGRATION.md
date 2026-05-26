# Shopify Integration Plan (Future-Ready)

Codename: `fizz5`

## Intent

Prepare the repo so “shopping features” can be handled by Shopify over time, without refactoring the entire site architecture later.

## Recommended pattern: Worker API proxy

1. The frontend calls our Worker under `/api/shop/*`.
2. The Worker calls Shopify Storefront API server-side.
3. We keep:
   - Shopify access token private (server-side only)
   - API shapes consistent across the frontend
   - caching/rate limiting centralized

## Endpoint surface (examples)

- `GET /api/shop/products?query=...`
- `GET /api/shop/products/:handle`
- `POST /api/shop/cart/checkout` (depends on desired UX)

## Env vars (placeholders)

In `.dev.vars` / Workers vars:

- `SHOPIFY_STORE_DOMAIN`
- `SHOPIFY_STOREFRONT_TOKEN`

## Auth / token handling

- Never expose tokens to the browser.
- Consider rotating tokens and adding request validation.

## Next implementation step

Create stubs under `src/worker/routes/shop.ts`, then implement actual Shopify calls once desired UX is confirmed.
