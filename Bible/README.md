# Fizz 3D Product Page — Bible

Read documents **in numeric order**. This folder is the single source of truth for rebuilding the experimental 3D landing page from scratch.

## Read order

| # | Document | Purpose |
|---|----------|---------|
| 00 | [00-START-HERE.md](./00-START-HERE.md) | Mental model in 10 minutes |
| 01 | [01-VISION-AND-SCOPE.md](./01-VISION-AND-SCOPE.md) | What we build and defer |
| 02 | [02-STACK-WHY.md](./02-STACK-WHY.md) | Vite, Three.js, R2 — why not Spline React |
| 03 | [03-REPO-MAP.md](./03-REPO-MAP.md) | Important paths |
| 04 | [04-ASSETS-AND-R2.md](./04-ASSETS-AND-R2.md) | GLTF hosting and upload |
| 05 | [05-SCENE-GRAPH.md](./05-SCENE-GRAPH.md) | Bottle + ocean composition |
| 06 | [06-VARIANT-THEMING.md](./06-VARIANT-THEMING.md) | Monochromatic color system |
| 07 | [07-GLASS-UI.md](./07-GLASS-UI.md) | Glassmorphism CSS |
| 08 | [08-WEBGL-PERFORMANCE.md](./08-WEBGL-PERFORMANCE.md) | Performance rules |
| 09 | [09-DEV-WORKFLOW.md](./09-DEV-WORKFLOW.md) | Local dev |
| 10 | [10-DEPLOY.md](./10-DEPLOY.md) | Build and deploy |
| 11 | [11-REBUILD-CHECKLIST.md](./11-REBUILD-CHECKLIST.md) | Step-by-step rebuild |
| 12 | [12-GLOSSARY.md](./12-GLOSSARY.md) | Terms |
| 13 | [13-BRAND-PACKAGING.md](./13-BRAND-PACKAGING.md) | Packaging PDF alignment |
| 14 | [14-MOTION-AND-SMOOTHNESS.md](./14-MOTION-AND-SMOOTHNESS.md) | Eco Pulse motion targets |

## References

- [references/packaging-direction.md](./references/packaging-direction.md)
- [references/eco-pulse-dribbble.md](./references/eco-pulse-dribbble.md)
- [references/mock-notes.md](./references/mock-notes.md)
- [references/links.md](./references/links.md)

## Quick start

```bash
cp .env.example .env   # set VITE_BOTTLE_GLTF_URL after R2 upload
npm install
npm run dev
# open http://localhost:5173/3d.html
```
