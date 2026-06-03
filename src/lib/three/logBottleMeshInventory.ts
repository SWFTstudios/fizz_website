import type { Object3D } from "three"
import { getMeshRole } from "./bottleColors"

/** DEV: log GLTF mesh names and assigned material roles after load. */
export function logBottleMeshInventory(root: Object3D): void {
  if (!import.meta.env.DEV) return

  const rows: Array<{ mesh: string; role: string; visible: boolean }> = []

  root.traverse((obj) => {
    const mesh = obj as { isMesh?: boolean; name?: string; visible?: boolean }
    if (!mesh.isMesh) return
    rows.push({
      mesh: mesh.name || "(unnamed)",
      role: getMeshRole(mesh.name || ""),
      visible: mesh.visible ?? true,
    })
  })

  console.table(rows)
  console.info(`[b3d] ${rows.length} meshes inventoried — see docs/3D-BOTTLE-MATERIALS.md`)
}
