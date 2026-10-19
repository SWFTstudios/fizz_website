# FIZZ5 Project Instructions

Codename: `fizz5`

When you open a new Cursor chat in this repo, the assistant should:

1. Read this file.
2. List active to-dos (status `pending` or `in_progress`).
3. Ask: "What would you like to work on?"

This file also acts as the single source of truth for the project work queue.

## Production runtime

**Edit and deploy `fizz-final/` only.** Cloudflare Worker `fizz-final` serves that folder ([https://fizz-final.elombe.workers.dev/](https://fizz-final.elombe.workers.dev/)). Do not treat the Vite app (`src/`, root HTML, `dist/`) as the live site.

## Active to-dos

- [fizz-final] **CI deploy secrets** — Ensure GitHub Actions secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are set so `main` auto-deploys (see `docs/CLOUDFLARE-BUILDS.md`).

- [fizz-final] **Homepage / marketing polish** — Iterate on copy, motion, and sections inside `fizz-final/` (including the “Keep the fizz coming” refill loop in `fizz-final/js/fizz-refill.js`).

## Archive / not production

These Vite migration items are **not** the live runtime. Leave them unless explicitly asked to resume the Vite port:

- [Archive] Lottie reveal timing / hero scroll / nav search Lottie / explore z-scroll ports under `src/`

## Webflow MCP reference (2026-05-26)

- Site ID: `6a03870d6aa42355105ab9ae` | Home page ID: `6a0387116aa42355105ab9fa`
- Full inspection report: [`docs/WEBFLOW-MCP-INSPECTION.md`](docs/WEBFLOW-MCP-INSPECTION.md)
- Live preview: https://fizz5.webflow.io/

## Notes

- Treat `fizz5.webflow/` as a read-only reference.
- Production source of truth: `fizz-final/` + `wrangler.jsonc`.
- All commits must use conventional messages and be submitted via PRs with CI checks enabled.
