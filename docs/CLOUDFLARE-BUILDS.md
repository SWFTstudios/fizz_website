# Cloudflare deploy (`fizz-final`)

Production site uses Worker **`fizz-final`** (static assets from `./fizz-final`). Live URL: [https://fizz-final.elombe.workers.dev/](https://fizz-final.elombe.workers.dev/).

## Auto-deploy on `main` (GitHub Actions)

Every push to **`main`** runs [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) and deploys with Wrangler.

**Required GitHub repo secrets** (Settings → Secrets and variables → Actions):

| Secret | Value |
|--------|--------|
| `CLOUDFLARE_API_TOKEN` | API token with **Edit Cloudflare Workers** (account scoped) |
| `CLOUDFLARE_ACCOUNT_ID` | `e246ec2918a6cd045fd4bfd00f024f0c` |

Create the token at [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens) → Create Token → Edit Cloudflare Workers.

You can also trigger a deploy manually: **Actions → Deploy fizz-final → Run workflow**.

## Optional: Workers Builds (dashboard)

GitHub PR checks may still include **Workers Builds** from the Cloudflare dashboard, separate from [`.github/workflows/ci.yml`](../.github/workflows/ci.yml). Prefer the GitHub Actions deploy above as the source of truth for production.

## Required dashboard settings

In Cloudflare: **Workers & Pages → fizz-final → Settings → Builds → Build configuration**

| Setting | Recommended value |
|--------|---------------------|
| **Production branch** | `main` |
| **Root directory** | *(empty — repo root)* |
| **Build command** | `npm run build` *(no-op; fizz-final is static)* **or** leave empty |
| **Deploy command** | `npm run deploy` |
| **Non-production deploy** | `npm run deploy:preview` *(or `npx wrangler versions upload`)* |

Workers Builds **does not** run any build block inside `wrangler.jsonc`; only dashboard/API trigger settings apply. There is no compile step: deploy uploads `./fizz-final` as configured in [`wrangler.jsonc`](../wrangler.jsonc).

`package.json` defines a no-op `build` script so dashboard configs that still call `npm run build` (the old Vite default) succeed instead of failing with `Missing script: "build"`.

Prefer the GitHub Actions **Preview fizz-final** workflow for PR preview URLs: it runs `wrangler versions upload` and comments the `*.workers.dev` link on the PR. The Cloudflare bot comment often tracks the legacy **`fizz-website`** Worker and will stay red until that Builds integration is disconnected.

### Branch / PR preview URLs

Non-`main` branches and pull requests use **versions upload**. Cloudflare posts a **preview URL** (Workers version URL under `*.workers.dev`) on the PR check. Production deploys from `main` update [https://fizz-final.elombe.workers.dev/](https://fizz-final.elombe.workers.dev/).

## Cutover from `fizz-website` (Vite)

The previous Workers Builds integration targeted Worker **`fizz-website`** (Vite → `dist/`). That path is deprecated for production.

**Dashboard steps (one-time):**

1. Open **Workers & Pages → fizz-final** and enable **Builds** with the GitHub repo `SWFTstudios/fizz_website` (or move the existing Git connection from `fizz-website` onto `fizz-final`).
2. Apply the build settings table above.
3. Open a test PR → confirm the Workers Builds check posts a **preview URL**.
4. Disconnect or disable Builds on Worker **`fizz-website`** so it no longer blocks PRs or deploys an unused Vite app.

## Worker name

`wrangler.jsonc` uses `"name": "fizz-final"` so Git-triggered deploys and local `npm run deploy` target the same script as the live marketing site.

## When a build shows 0s / no logs

1. Open the build in [Cloudflare build history](https://dash.cloudflare.com/) and read the log (GitHub only links to the dashboard).
2. **Stale API token** — Settings → Builds → create/select a new API token, then **Retry build**.
3. **Wrong Worker** — Builds still attached to `fizz-website` instead of `fizz-final`.
4. **Root directory** — must point at this repo root (where `package.json` and `wrangler.jsonc` live).
5. **Git integration** — disconnect/reconnect the repo if webhooks stopped firing.

## Local parity

```bash
npm ci
npm run check:fizz-final
npm run deploy            # wrangler deploy → production Worker
npm run deploy:preview    # wrangler versions upload → preview version
npx wrangler deploy --dry-run
```
