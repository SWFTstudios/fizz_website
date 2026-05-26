# Webflow Migration Guide (fizz5)

Codename: `fizz5`

## Principle

Treat `fizz5.webflow/` as the “design reference” only:

- Pixel fidelity comes from porting HTML/CSS/asset usage into `src/` and `public/`.
- Runtime logic becomes first-class code as we re-implement features in Vite/TS.

## Porting steps (recommended)

1. Identify the target section/page in `fizz5.webflow/` (e.g. `index.html`, `home-v2.html`).
2. Copy the relevant DOM structure into a new `src/components/*` module.
3. Port styles incrementally:
   - Prefer extracting only what’s needed into `src/styles/*.css`.
   - Avoid wholesale re-import of Webflow CSS into the final build unless required for parity.
4. Replace Webflow-specific runtime constructs:
   - Replace Webflow `data-w-*` and Webflow-driven interactions with explicit JS/TS logic.
5. Keep Webflow exports referenced, not executed:
   - Do not execute Webflow’s `webflow.js` in the new build unless necessary.

## Asset strategy

- Copy required assets from `fizz5.webflow/images/` and `fizz5.webflow/videos/` into `public/`.
- Update `src` to reference assets by path in the new build.
