# fizz5 Architecture

Codename: `fizz5`

## Goals

- Move away from Webflow export as the runtime source of truth.
- Keep `fizz5.webflow/` as a stable reference for pixel-accurate porting.
- Host everything on **Cloudflare** with best-practice operational boundaries.
- Prepare for Shopify-backed shopping features without baking Shopify assumptions into the UI.

## Deployment model (locked)

- **One Cloudflare Worker** handles:
  - Static assets (site UI) using Workers Static Assets binding.
  - Dynamic routes under `/api/*` for future endpoints (health, Shopify proxy, etc.).

### Why one Worker?

- One deploy and one rollback point.
- Avoids split configuration between Pages and Workers.
- Keeps all auth secrets server-side.

## Repo layout (target)

- `fizz5.webflow/`: design export reference only (no runtime dependency).
- `public/`: static assets copied into the build.
- `src/`: new code (frontend + Worker).
  - `src/worker/`: `/api/*` routes.
  - `src/components/`: section-level UI ported from the Webflow export.

## Future: Shopify integration

Shopping features will be implemented by calling our Worker endpoints:

- Browser calls: `GET/POST /api/shop/*`
- Worker calls: Shopify Storefront API (server-side)

This keeps tokens private and allows caching, rate limiting, and request shaping behind one API surface.
