import {
  BackSide,
  Camera,
  Color,
  Group,
  Light,
  Material,
  Mesh,
  type Object3D,
  ShaderMaterial,
} from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import type { FuturisticGradient } from "../../data/bottleGradients"
import {
  createShaderOceanMeshes,
  tickShaderOcean,
  updateShaderOceanColors,
  type ShaderOceanMeshes,
} from "./shaders/oceanWater"

export type OceanEnvironment = {
  group: Group
  water: Mesh
  sky: Mesh
  setGradient: (g: FuturisticGradient) => void
  update: (elapsed: number) => void
}

const OCEAN_WATER_NODE = "water"
const OCEAN_SKY_NODE = "horison"

function setMeshMaterialColor(mesh: Mesh, hex: string): void {
  const mat = mesh.material
  if (Array.isArray(mat)) return
  if (mat && "color" in mat) {
    ;(mat as Material & { color: Color }).color.set(hex)
  }
}

function createShaderOceanEnvironment(initial: FuturisticGradient): OceanEnvironment {
  const group = new Group()
  group.name = "oceanEnvironmentShader"

  const shaderMeshes = createShaderOceanMeshes(initial)
  group.add(shaderMeshes.water, shaderMeshes.sky)

  const setGradient = (g: FuturisticGradient): void => {
    updateShaderOceanColors(shaderMeshes, g)
  }

  const update = (elapsed: number): void => {
    tickShaderOcean(shaderMeshes, elapsed)
  }

  return {
    group,
    water: shaderMeshes.water,
    sky: shaderMeshes.sky,
    setGradient,
    update,
  }
}

function stripNonEnvironmentNodes(root: Group): void {
  const toRemove: Object3D[] = []
  root.traverse((obj) => {
    if ((obj as Light).isLight || (obj as Camera).isCamera) {
      toRemove.push(obj)
    }
  })
  for (const obj of toRemove) {
    obj.parent?.remove(obj)
  }
}

function attachGltfWaterAnimation(water: Mesh): (elapsed: number) => void {
  const mat = water.material
  if (Array.isArray(mat) || !mat) return () => {}

  if ((mat as ShaderMaterial).isShaderMaterial) {
    const shader = mat as ShaderMaterial
    if (shader.uniforms?.uTime) {
      return (elapsed: number) => {
        shader.uniforms.uTime.value = elapsed
      }
    }
  }

  const physical = mat as Material & {
    onBeforeCompile?: (shader: { uniforms: Record<string, { value: unknown }> }) => void
    userData?: Record<string, unknown>
  }

  if (physical.userData?.b3dOceanAnimated) {
    return (physical.userData.b3dOceanTick as (elapsed: number) => void) ?? (() => {})
  }

  physical.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 }
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      /* glsl */ `
        #include <begin_vertex>
        float wave1 = sin(transformed.x * 0.35 + uTime * 0.9) * cos(transformed.z * 0.28 + uTime * 0.7);
        float wave2 = sin(transformed.x * 0.12 - uTime * 0.45 + transformed.z * 0.18) * 0.6;
        transformed.y += (wave1 + wave2) * 0.08;
      `,
    )
    physical.userData = { ...physical.userData, b3dOceanShader: shader }
  }
  physical.userData = { ...physical.userData, b3dOceanAnimated: true }

  return (elapsed: number) => {
    const compiled = physical.userData?.b3dOceanShader as
      | { uniforms: { uTime: { value: number } } }
      | undefined
    if (compiled?.uniforms?.uTime) compiled.uniforms.uTime.value = elapsed
  }
}

async function loadOceanGltfEnvironment(
  url: string,
  initial: FuturisticGradient,
): Promise<OceanEnvironment | null> {
  const loader = new GLTFLoader()
  const gltf = await loader.loadAsync(url)
  const root = gltf.scene

  const waterNode = root.getObjectByName(OCEAN_WATER_NODE)
  const skyNode = root.getObjectByName(OCEAN_SKY_NODE)

  if (!waterNode || !(waterNode as Mesh).isMesh) {
    console.warn(
      `[b3d] Ocean GLTF missing "${OCEAN_WATER_NODE}" mesh — falling back to shader ocean.`,
    )
    return null
  }
  if (!skyNode || !(skyNode as Mesh).isMesh) {
    console.warn(
      `[b3d] Ocean GLTF missing "${OCEAN_SKY_NODE}" mesh — falling back to shader ocean.`,
    )
    return null
  }

  const water = waterNode as Mesh
  const sky = skyNode as Mesh

  stripNonEnvironmentNodes(root)

  water.receiveShadow = true
  sky.receiveShadow = true
  root.position.y = -0.55
  root.scale.setScalar(2.4)

  const group = new Group()
  group.name = "oceanEnvironmentGltf"
  group.add(root)

  setMeshMaterialColor(water, initial.mid)
  setMeshMaterialColor(sky, initial.highlight)
  if (!Array.isArray(water.material) && "transparent" in water.material) {
    const wm = water.material as Material & {
      transparent?: boolean
      opacity?: number
      metalness?: number
      roughness?: number
    }
    wm.transparent = true
    wm.opacity = 0.92
    if (wm.metalness !== undefined) wm.metalness = 0.08
    if (wm.roughness !== undefined) wm.roughness = 0.34
  }
  if (!Array.isArray(sky.material) && "transparent" in sky.material) {
    const sm = sky.material as Material & { transparent?: boolean; opacity?: number }
    sm.transparent = true
    sm.opacity = 0.22
  }

  const animateWater = attachGltfWaterAnimation(water)

  const setGradient = (g: FuturisticGradient): void => {
    setMeshMaterialColor(water, g.mid)
    setMeshMaterialColor(sky, g.highlight)
  }

  return { group, water, sky, setGradient, update: animateWater }
}

export async function createOceanEnvironment(
  initial: FuturisticGradient,
): Promise<OceanEnvironment> {
  const url = (import.meta.env.VITE_OCEAN_GLTF_URL as string | undefined)?.trim()

  if (url) {
    try {
      const fromGltf = await loadOceanGltfEnvironment(url, initial)
      if (fromGltf) return fromGltf
    } catch (err) {
      console.warn("[b3d] Failed to load ocean GLTF — falling back to shader ocean.", err)
    }
  }

  return createShaderOceanEnvironment(initial)
}

export type { ShaderOceanMeshes }
