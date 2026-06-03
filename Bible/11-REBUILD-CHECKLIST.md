# 11 — Rebuild checklist

Follow in order. Check each box before moving on.

## Prerequisites

- [ ] Node 22+
- [ ] Repo cloned
- [ ] On branch `3d-website-branch`

## Documentation

- [ ] Read [00-START-HERE.md](./00-START-HERE.md)
- [ ] Bible `references/` contains packaging PDF

## Dependencies

- [ ] `npm install`
- [ ] `three` in package.json

## Assets

- [ ] Bottle GLTF uploaded to R2
- [ ] `.env` has `VITE_BOTTLE_GLTF_URL`
- [ ] (Optional) `VITE_OCEAN_GLTF_URL`

## Verify

- [ ] `npm run dev` → `/3d.html` loads
- [ ] Canvas shows bottle (GLTF or placeholder)
- [ ] Water/horizon visible, dark theme for charcoal-black
- [ ] Bottom bar switches variants smoothly
- [ ] Glass panels show packaging copy
- [ ] `npm run build` succeeds
- [ ] `npm run typecheck` succeeds

## If stuck

See [09-DEV-WORKFLOW.md](./09-DEV-WORKFLOW.md) and [04-ASSETS-AND-R2.md](./04-ASSETS-AND-R2.md).
