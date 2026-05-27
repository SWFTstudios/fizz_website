# Cloudflare Workers Builds (`fizz-website`)

GitHub PR checks include **Workers Builds: fizz-website** (Cloudflare dashboard), separate from [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

## Required dashboard settings

In Cloudflare: **Workers & Pages → fizz-website → Settings → Builds → Build configuration**

| Setting | Recommended value |
|--------|---------------------|
| **Production branch** | `main` |
| **Root directory** | *(empty — repo root)* |
| **Build command** | `npm run build` |
| **Deploy command** | `npm run deploy` |
| **Non-production deploy** | `npx wrangler versions upload` *(default is fine)* |

Use `npm run deploy` (not bare `npx wrangler deploy`) so Vite runs before upload. Workers Builds **does not** run the `build` block inside `wrangler.jsonc`; only dashboard/API trigger settings apply.

## Worker name

The connected Worker in the dashboard is **`fizz-website`**. `wrangler.jsonc` uses the same `name` so Git-triggered deploys target the correct script. The repo codename remains `fizz5` (package name, Webflow export folder).

If you previously deployed manually as `fizz5`, either:

- Rename the dashboard Worker to match `fizz5` and revert `name` in `wrangler.jsonc`, or  
- Keep `fizz-website` and retire the old `fizz5` Worker after cutover.

## When a build shows 0s / no logs

1. Open the build in [Cloudflare build history](https://dash.cloudflare.com/) and read the log (GitHub only links to the dashboard).
2. **Stale API token** — Settings → Builds → create/select a new API token, then **Retry build**.
3. **Missing build step** — `dist/` empty if deploy runs without `npm run build`.
4. **Root directory** — must point at this repo root (where `package.json` and `wrangler.jsonc` live).
5. **Git integration** — disconnect/reconnect the repo if webhooks stopped firing.

## Local parity

```bash
npm ci
npm run lint:all
npm run deploy          # build + wrangler deploy
npx wrangler deploy --dry-run   # after build, validate upload
```
