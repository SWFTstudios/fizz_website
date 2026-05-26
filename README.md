# FIZZ5

Codename: `fizz5`

This repository contains the ongoing rebuild of the marketing + commerce experience currently exported from Webflow in `fizz5.webflow/`.

## What is in this repo now

- `fizz5.webflow/`: Webflow export and design reference (read-only).
- New source code will be built into `src/` and served by a single Cloudflare Worker that also hosts static assets.

## High-level architecture (target)

- **Cloudflare Workers** (single deploy) for:
  - Static assets (site UI)
  - `/api/*` dynamic endpoints (health checks, future Shopify proxy, etc.)

## Next steps

- Start with documentation + Cursor rules.
- Scaffold Vite + TypeScript frontend and the Worker that serves `index.html` at the repo root.
