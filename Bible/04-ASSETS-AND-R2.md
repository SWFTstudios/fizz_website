# 04 — Assets and R2

## Goal

Host large 3D files on Cloudflare R2 and load them at runtime.

## R2 bucket

- **Bucket name:** `fizz-assets` (created via `npx wrangler r2 bucket create fizz-assets`)
- **Binding in Worker:** `FIZZ_ASSETS` (see `wrangler.jsonc`)

### Enable public reads (dashboard)

1. Cloudflare → **R2** → bucket **fizz-assets**
2. **Settings** → **Public access** → allow **R2.dev subdomain**
3. Copy the public URL (e.g. `https://pub-xxxx.r2.dev`)

Objects are then available at: `https://<public-host>/models/fizz_bottle_3d_file_export.gltf`

## Bottle GLTF

- **Local source:** `~/Downloads/fizz_bottle_3d_file_export.gltf` (or `fizz_bottle_scene_self_hosted/`)
- **Size:** ~304 MB (do not commit)
- **R2 key:** `models/fizz_bottle_3d_file_export.gltf`

## Upload (Wrangler)

```bash
# After configuring bucket in wrangler.toml or passing --bucket
node scripts/upload-bottle-gltf.mjs /path/to/fizz_bottle_3d_file_export.gltf
```

Set cache: `Cache-Control: public, max-age=31536000, immutable`

## Env

```bash
VITE_BOTTLE_GLTF_URL=https://pub-xxx.r2.dev/models/fizz_bottle_3d_file_export.gltf
VITE_OCEAN_GLTF_URL=
```

If `VITE_BOTTLE_GLTF_URL` is unset, dev uses a **placeholder bottle** (simple geometry) so UI/theming still works.

## Ocean

- **Local source:** `~/Downloads/ocean_scene_self_hosted/ocean.gltf` (~2 MB)
- **GLTF nodes:** `water`, `horison` (sky dome)

```bash
VITE_OCEAN_GLTF_URL=/local-dev/ocean.gltf
```

Dev middleware serves the file (see `FIZZ_OCEAN_GLTF_DEV_PATH` in `vite.config.ts`). Production: host on R2/CDN and set `VITE_OCEAN_GLTF_URL` at build time.

If `VITE_OCEAN_GLTF_URL` is unset or load fails, procedural water plane + sky sphere is used (tinted by variant).

## CORS

R2 public bucket must allow GET from your dev origin (`localhost:5173`) and production domain.

## If it breaks

- `Failed to fetch` → CORS or wrong URL
- Hang on load → file too large; consider Draco re-export from Spline later
