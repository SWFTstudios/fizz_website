import {
  Box3,
  CylinderGeometry,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  Vector3,
} from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { prepareBottleSceneGraph } from "./bottleColors"
import { logBottleMeshInventory } from "./logBottleMeshInventory"

export type BottleLoadResult = {
  group: Group
  isPlaceholder: boolean
  loadError?: boolean
}

export type BottleLoadProgress = {
  loaded: number
  total: number
  ratio: number
}

function createPlaceholderBottle(): Group {
  const group = new Group()
  group.name = "placeholderBottle"

  const bodyMat = new MeshPhysicalMaterial({
    color: 0xf4f8fc,
    metalness: 0,
    roughness: 0.08,
    transparent: true,
    opacity: 1,
    transmission: 0.94,
    ior: 1.5,
    thickness: 0.4,
  })
  const hardwareMat = new MeshPhysicalMaterial({
    color: 0x2a3038,
    metalness: 0.08,
    roughness: 0.42,
    transparent: false,
    opacity: 1,
    transmission: 0,
  })

  const body = new Mesh(new CylinderGeometry(0.35, 0.38, 1.6, 32), bodyMat)
  body.name = "FIZZ_BODY"
  body.position.y = 0.2
  body.renderOrder = 1

  const cap = new Mesh(new CylinderGeometry(0.32, 0.34, 0.25, 32), hardwareMat)
  cap.name = "BOTTLEHARDCAP"
  cap.position.y = 1.05

  const base = new Mesh(new CylinderGeometry(0.38, 0.38, 0.08, 32), hardwareMat.clone())
  base.name = "BOOTPART"
  base.position.y = -0.65

  group.add(body, cap, base)
  return group
}

function normalizeBottleGroup(group: Group): void {
  const box = new Box3().setFromObject(group)
  const size = new Vector3()
  const center = new Vector3()
  box.getSize(size)
  box.getCenter(center)

  group.position.sub(center)
  const maxDim = Math.max(size.x, size.y, size.z)
  const targetHeight = 2.2
  const scale = targetHeight / maxDim
  group.scale.setScalar(scale)
  group.position.y += 0.15
}

export async function loadBottleGltf(
  url: string | undefined,
  onProgress?: (progress: BottleLoadProgress) => void,
): Promise<BottleLoadResult> {
  const usePlaceholder = (reason: string, loadError = false): BottleLoadResult => {
    console.warn(`[b3d] ${reason}`)
    const placeholder = createPlaceholderBottle()
    normalizeBottleGroup(placeholder)
    prepareBottleSceneGraph(placeholder, { hideInternal: true })
    return { group: placeholder, isPlaceholder: true, loadError }
  }

  if (!url?.trim()) {
    return usePlaceholder(
      "VITE_BOTTLE_GLTF_URL unset — using placeholder bottle. See Bible/04-ASSETS-AND-R2.md",
    )
  }

  const loader = new GLTFLoader()

  try {
    const gltf = await loader.loadAsync(url, (event) => {
      if (!onProgress || !event.total) return
      onProgress({
        loaded: event.loaded,
        total: event.total,
        ratio: event.loaded / event.total,
      })
    })
    const root = gltf.scene

    prepareBottleSceneGraph(root, { hideInternal: true })
    logBottleMeshInventory(root)

    root.traverse((obj) => {
      if ((obj as Mesh).isMesh) {
        const mesh = obj as Mesh
        mesh.castShadow = true
        mesh.receiveShadow = true
      }
    })

    const group = new Group()
    group.name = "bottleAssembly"
    group.add(root)
    normalizeBottleGroup(group)

    return { group, isPlaceholder: false }
  } catch (err) {
    console.error("[b3d] GLTF load failed", err)
    return usePlaceholder(
      "Could not load GLTF (file is ~304MB — try local dev URL or wait for full download). Showing simplified 3D.",
      true,
    )
  }
}
