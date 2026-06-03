# 05 — Scene graph

## Hierarchy (conceptual)

```
Scene
├── rimLight (PointLight, variant glow)
├── keyLight (DirectionalLight)
├── bottleGroup (GLTF or placeholder)
├── oceanGroup
│   ├── waterMesh (horizontal plane, physical material)
│   └── skyMesh (large sphere or plane, back faces)
└── Fog (color from variant deep)
```

## Bottle GLTF notes

- Root scale often ~0.01 — normalized in `loadBottleGltf.ts`
- Tint targets: names matching `BOTTLEMAINBODY`, `FIZZ_BODY`, `BOTTLEHARDCAP`, etc.
- Studio cameras in export are hidden; app uses `PerspectiveCamera`

## Camera

- Desktop hero: bottle center, water in lower third
- FOV ~40°, position ~(0, 1.2, 4.5)

## Composition

Horizon line ~40% from bottom of viewport (tune in `compositeScene.ts`).
