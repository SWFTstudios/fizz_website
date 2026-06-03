# 10 — Deploy

## Build

```bash
npm run build
```

Output includes `dist/3d.html` and chunked `three-*.js`.

## Cloudflare Worker

Same pipeline as main Fizz5 site (`npm run deploy`). Ensure:

1. `3d.html` is in Vite `rollupOptions.input` (see `vite.config.ts`)
2. R2 GLTF URL is absolute HTTPS
3. CORS allows production origin

## Env in CI

Set `VITE_BOTTLE_GLTF_URL` in build environment secrets — Vite inlines at build time.
