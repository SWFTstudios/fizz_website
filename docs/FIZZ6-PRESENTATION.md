# FIZZ6 presentation — deploy links

**Branch:** `fizz6`  
**GitHub:** https://github.com/SWFTstudios/fizz_website/tree/fizz6  
**PR:** https://github.com/SWFTstudios/fizz_website/pull/6

## Cloudflare preview (use for demo)

| Link | When to use |
|------|-------------|
| **Version preview (live now)** | https://4e538d4a-fizz-website.elombe.workers.dev |
| **Workers Builds (branch)** | Open the **Workers Builds: fizz-website** check on the `fizz6` PR — preview URL is in the build summary |

Production worker: `fizz-website` (account subdomain `elombe.workers.dev`). Branch previews do **not** replace `main` until promoted.

## Suggested demo paths

| Page | Path |
|------|------|
| 3D homepage (branch default in dev) | `/` → built as `3d.html` at root on preview |
| Legacy marketing home | `/legacy-home.html` |
| Shop | `/shop.html` |
| Explore | `/explore.html` |
| Features | `/features.html` |
| About | `/about.html` |

## Webflow (design)

| Resource | URL |
|----------|-----|
| FIZZ6 Designer | https://fizz6.design.webflow.com |
| Site ID | `6a20489a38de438c1b0f83e5` |

See [`WEBFLOW-MCP-FIZZ6.md`](WEBFLOW-MCP-FIZZ6.md).

## Redeploy preview (CLI)

```bash
git checkout fizz6
npm run build
npx wrangler versions upload --tag fizz6-presentation
```

Copy the **Version Preview URL** from the command output.
