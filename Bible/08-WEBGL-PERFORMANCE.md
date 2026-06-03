# 08 — WebGL performance

## Rules

1. `setPixelRatio(Math.min(devicePixelRatio, 2))`
2. Pause `requestAnimationFrame` when `document.hidden`
3. `dispose()` geometries/materials on page leave
4. Theme transitions: lerp colors, do not recreate materials each frame
5. Do not commit 304 MB GLTF — use R2

## Loader

Show `#b3d-loader` until bottle attempt finishes (GLTF or placeholder).

## Fallback

No WebGL → `body.b3d-fallback` shows static bottle PNG from `shopData`.
