import { getBottlePaletteForSlug, type BottleVariantPalette } from "../../data/bottleVariantPalette"
import {
  Camera,
  Color,
  DoubleSide,
  Light,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  type Material,
  type Object3D,
} from "three"

export type BottleMeshRole = "clearBody" | "hardware" | "internal" | "ignore"

/** Outer Tritan shell — clear fluted chamber (see product PNGs). */
const CLEAR_BODY_PATTERNS = [/FIZZ_BODY/i, /TRITAN/i, /CLEAR/i, /GLASS/i]

/** Duplicate CAD liner; reads as opaque grey and blocks the view through the bottle. */
const HIDDEN_SHELL_PATTERNS = [/BOTTLEMAINBODY/i]

const HARDWARE_PATTERNS = [
  /BOTTLEHARDCAP/i,
  /BOOTPART/i,
  /CANISTERBODY/i,
  /LEVERBODY/i,
  /LEVER(?!BODY)/i,
  /SPOUTMAINBODY/i,
  /SPOUTASSEMBLY/i,
  /BOTTLEBODYASSEMBLY/i,
]

const VISIBLE_INTERNAL_PATTERNS = [/CANISTERBODY/i, /CANISTERHOLDERMAIN/i]

const INTERNAL_PATTERNS = [
  /CANISTERPUSHER/i,
  /INNERCANISTER/i,
  /CANISTERHOLDERMAIN/i,
  /CANISTERHOLDERFILTER/i,
  /CANISTER_VALVE/i,
  /BOTTOMCANISTER/i,
  /NORINGTOSEAL/i,
  /CARBACTIVATIONPIN/i,
  /BOTTOM_PINVE/i,
  /O_XING_MIFENG/i,
  /NEWBOTTOMSEAL/i,
  /CARNCANISTERINTERFACESEAL/i,
  /_CANISTERASSEMBLY/i,
  /SPRING/i,
  /MIFENG/i,
  /0915coresun_V23/i,
  /6_8X1_7/i,
  /11088/i,
  /9_5X1_5/i,
  /SEAL/i,
  /FILTER/i,
  /VALVE/i,
  /PINVE/i,
]

const STUDIO_HIDE_PATTERNS = [
  /Camera/i,
  /Scene_Setup/i,
  /Studio/i,
  /^Iso_/i,
  /^Rise_/i,
  /Still_To/i,
  /Step1_/i,
  /BACKVIEW/i,
  /^C02$/i,
  /EachPacket/i,
  /Slide_to_Adjust/i,
]

export function getMeshRole(name: string): BottleMeshRole {
  if (HIDDEN_SHELL_PATTERNS.some((p) => p.test(name))) return "ignore"
  if (CLEAR_BODY_PATTERNS.some((p) => p.test(name))) return "clearBody"
  if (INTERNAL_PATTERNS.some((p) => p.test(name))) return "internal"
  if (HARDWARE_PATTERNS.some((p) => p.test(name))) return "hardware"
  return "ignore"
}

function isHiddenShellMesh(name: string): boolean {
  return HIDDEN_SHELL_PATTERNS.some((p) => p.test(name))
}

function isStudioNode(obj: Object3D): boolean {
  const name = obj.name || ""
  if ((obj as Camera).isCamera) return true
  if ((obj as Light).isLight) return true
  return STUDIO_HIDE_PATTERNS.some((p) => p.test(name))
}

export function prepareBottleSceneGraph(
  root: Object3D,
  options: { hideInternal?: boolean } = {},
): void {
  const hideInternal = options.hideInternal !== false

  root.traverse((obj) => {
    if (isStudioNode(obj)) {
      obj.visible = false
      return
    }

    const mesh = obj as Mesh
    if (!mesh.isMesh) return

    if (isHiddenShellMesh(mesh.name)) {
      mesh.visible = false
      return
    }

    const role = getMeshRole(mesh.name)
    const keepVisible = VISIBLE_INTERNAL_PATTERNS.some((p) => p.test(mesh.name || ""))
    if (hideInternal && role === "internal" && !keepVisible) {
      mesh.visible = false
    }
  })
}

function ensurePhysicalMaterial(mat: Material): MeshPhysicalMaterial {
  if ((mat as MeshPhysicalMaterial).isMeshPhysicalMaterial) {
    return mat as MeshPhysicalMaterial
  }

  const std = mat as MeshStandardMaterial
  return new MeshPhysicalMaterial({
    color: std.color?.clone() ?? new Color(0xffffff),
    metalness: std.metalness ?? 0,
    roughness: std.roughness ?? 0.5,
    map: std.map ?? null,
    normalMap: std.normalMap ?? null,
    roughnessMap: std.roughnessMap ?? null,
    metalnessMap: std.metalnessMap ?? null,
    aoMap: std.aoMap ?? null,
    transparent: std.transparent,
    opacity: std.opacity,
  })
}

function applyHardwareMaterial(mat: MeshPhysicalMaterial, palette: BottleVariantPalette): void {
  mat.color.set(palette.hardwareColor)
  mat.metalness = palette.hardwareMetalness
  mat.roughness = palette.hardwareRoughness
  mat.transparent = false
  mat.opacity = 1
  mat.transmission = 0
  mat.ior = 1.5
  if (mat.emissive) {
    mat.emissive.set(0x000000)
    mat.emissiveIntensity = 0
  }
}

function applyBodyMaterial(mat: MeshPhysicalMaterial, palette: BottleVariantPalette): void {
  mat.color.set(palette.bodyColor)
  mat.metalness = 0
  mat.roughness = 0.02
  mat.transparent = true
  mat.opacity = 1
  mat.transmission = 1
  mat.ior = palette.bodyIor
  mat.thickness = 0.55
  mat.depthWrite = false
  mat.side = DoubleSide
  mat.map = null
  mat.normalMap = null
  mat.roughnessMap = null
  mat.metalnessMap = null
  mat.aoMap = null
  if (mat.emissive) {
    mat.emissive.set(0x000000)
    mat.emissiveIntensity = 0
  }
  mat.needsUpdate = true
}

export function applyBottleVariantMaterials(root: Object3D, slug: string): void {
  const palette = getBottlePaletteForSlug(slug)

  root.traverse((obj) => {
    const mesh = obj as Mesh
    if (!mesh.isMesh || !mesh.visible || isHiddenShellMesh(mesh.name)) return

    const role = getMeshRole(mesh.name)
    if (role === "ignore") return

    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    const nextMaterials: MeshPhysicalMaterial[] = []

    for (const raw of materials) {
      if (!raw) continue
      const phys = ensurePhysicalMaterial(raw)
      if (role === "hardware" || role === "internal") {
        applyHardwareMaterial(phys, palette)
      } else if (role === "clearBody") {
        applyBodyMaterial(phys, palette)
      }
      nextMaterials.push(phys)
    }

    if (nextMaterials.length === 1) {
      mesh.material = nextMaterials[0]
    } else if (nextMaterials.length > 1) {
      mesh.material = nextMaterials
    }
  })
}

export type BottleMaterialMaps = {
  hardware: Map<Material, string>
  body: Map<Material, string>
}

function collectMaterialHexes(
  root: Object3D,
  roleFilter: BottleMeshRole,
): Map<Material, string> {
  const map = new Map<Material, string>()
  root.traverse((obj) => {
    const mesh = obj as Mesh
    if (!mesh.isMesh || !mesh.visible) return
    if (getMeshRole(mesh.name) !== roleFilter) return

    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    for (const mat of materials) {
      if (!mat) continue
      const m = mat as Material & { color?: Color }
      if (m.color) map.set(mat, `#${m.color.getHexString()}`)
    }
  })
  return map
}

/** Show full CAD internals, or hero-only (center tube) when false. */
export function setBottleInternalsVisible(
  root: Object3D,
  visible: boolean,
  slug: string,
): void {
  root.traverse((obj) => {
    const mesh = obj as Mesh
    if (!mesh.isMesh) return

    const role = getMeshRole(mesh.name)
    if (role !== "internal") return

    const keepHero = VISIBLE_INTERNAL_PATTERNS.some((p) => p.test(mesh.name || ""))
    mesh.visible = visible || keepHero
  })

  applyBottleVariantMaterials(root, slug)
}

export function readBottleMaterialHexes(root: Object3D): BottleMaterialMaps {
  return {
    hardware: collectMaterialHexes(root, "hardware"),
    body: collectMaterialHexes(root, "clearBody"),
  }
}

/** @deprecated Use readBottleMaterialHexes */
export function readMaterialHexes(root: Object3D): Map<Material, string> {
  const { hardware, body } = readBottleMaterialHexes(root)
  return new Map([...hardware, ...body])
}

export function lerpBottleMaterials(
  maps: BottleMaterialMaps,
  fromPalette: BottleVariantPalette,
  toPalette: BottleVariantPalette,
  t: number,
): void {
  const hwFrom = new Color(fromPalette.hardwareColor)
  const hwTo = new Color(toPalette.hardwareColor)
  const bodyFrom = new Color(fromPalette.bodyColor)
  const bodyTo = new Color(toPalette.bodyColor)

  for (const mat of maps.hardware.keys()) {
    const m = mat as Material & { color?: Color }
    if (!m.color) continue
    m.color.copy(hwFrom).lerp(hwTo, t)
  }

  for (const mat of maps.body.keys()) {
    const m = mat as Material & {
      color?: Color
      transmission?: number
    }
    if (m.color) m.color.copy(bodyFrom).lerp(bodyTo, t)
    if (m.transmission !== undefined) {
      m.transmission =
        fromPalette.bodyTransmission +
        (toPalette.bodyTransmission - fromPalette.bodyTransmission) * t
    }
  }
}
