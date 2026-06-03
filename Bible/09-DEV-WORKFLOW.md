# 09 — Dev workflow

```bash
cp .env.example .env
npm install
npm run dev
```

Open: http://localhost:5173/3d.html (or whichever port Vite prints).

### Local bottle GLTF (~290 MB)

Place `fizz_bottle_3d_file_export.gltf` in `~/Downloads/` (default), or set `FIZZ_BOTTLE_GLTF_DEV_PATH` in the shell before `npm run dev`.

In `.env`:

```bash
VITE_BOTTLE_GLTF_URL=/local-dev/fizz_bottle_3d_file_export.gltf
```

Vite dev server streams that file — it is **not** copied into `public/`. First load can take 30–60s while the browser parses the model.

### Local ocean GLTF (~2 MB)

Place `ocean.gltf` in `~/Downloads/ocean_scene_self_hosted/` (default), or set `FIZZ_OCEAN_GLTF_DEV_PATH` before `npm run dev`.

In `.env`:

```bash
VITE_OCEAN_GLTF_URL=/local-dev/ocean.gltf
```

## Typecheck

```bash
npm run typecheck
```

## Lint

```bash
npm run lint
```

## Debug Three.js

- Chrome DevTools → Performance for frame drops
- `window.__b3dScene` exposed in dev for inspection (see `3d-main.ts`)

## If it breaks

- Module not found `three` → `npm install`
- 404 on GLTF → check `VITE_BOTTLE_GLTF_URL` / `VITE_OCEAN_GLTF_URL`
