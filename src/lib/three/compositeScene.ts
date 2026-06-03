import {
  AmbientLight,
  Color,
  DirectionalLight,
  Fog,
  Group,
  PerspectiveCamera,
  PointLight,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from "three"
import { getFuturisticGradient } from "../../data/bottleGradients"
import { setBottleInternalsVisible } from "./bottleColors"
import { loadBottleGltf } from "./loadBottleGltf"
import { createOceanEnvironment } from "./loadOceanEnvironment"
import {
  applyVariantTheme,
  getActiveVariantSlug,
  type VariantThemeContext,
} from "./variantTheme"

export type B3dPhase = "ocean" | "full"

export type CompositeSceneOptions = {
  phase?: B3dPhase
  onLoadProgress?: (ratio: number) => void
}

export type CompositeSceneApi = {
  dispose: () => void
  setVariant: (slug: string, animate?: boolean) => void
  setInternalsVisible: (visible: boolean) => void
  getActiveSlug: () => string
  context: VariantThemeContext
  camera: PerspectiveCamera
  usedPlaceholder: boolean
  loadError: boolean
  phase: B3dPhase
}

function readPhase(): B3dPhase {
  const env = (import.meta.env.VITE_B3D_PHASE as string | undefined)?.trim()
  return env === "ocean" ? "ocean" : "full"
}

export async function createCompositeScene(
  canvas: HTMLCanvasElement,
  documentRoot: HTMLElement,
  options: CompositeSceneOptions = {},
): Promise<CompositeSceneApi> {
  const phase = options.phase ?? readPhase()
  const onLoadProgress = options.onLoadProgress
  const isOceanOnly = phase === "ocean"

  const initialSlug = documentRoot.dataset.activeVariant ?? "charcoal-black"
  const initialGradient = getFuturisticGradient(initialSlug)

  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  })
  renderer.outputColorSpace = SRGBColorSpace
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true

  const scene = new Scene()
  scene.background = new Color(initialGradient.deep)
  scene.fog = new Fog(initialGradient.deep, 4, 28)

  const camera = new PerspectiveCamera(40, 1, 0.1, 120)

  const ambient = new AmbientLight(0xffffff, 0.35)
  const key = new DirectionalLight(0xffffff, 1.1)
  key.position.set(3, 6, 4)
  key.castShadow = true

  const rim = new PointLight(initialGradient.glow, 1.2, 20)
  rim.position.set(-1.5, 2.5, -2)

  scene.add(ambient, key, rim)

  const ocean = await createOceanEnvironment(initialGradient)
  scene.add(ocean.group)
  ocean.group.position.set(0, -0.42, 0)
  ocean.group.scale.setScalar(isOceanOnly ? 1.22 : 1.15)

  let bottleGroup = new Group()
  bottleGroup.name = "emptyBottlePlaceholder"
  let isPlaceholder = false
  let loadError = false

  if (!isOceanOnly) {
    const bottleUrl = import.meta.env.VITE_BOTTLE_GLTF_URL as string | undefined
    const bottleResult = await loadBottleGltf(bottleUrl, (p) => onLoadProgress?.(p.ratio))
    bottleGroup = bottleResult.group
    isPlaceholder = bottleResult.isPlaceholder
    loadError = bottleResult.loadError ?? false
    scene.add(bottleGroup)
  }

  const ctx: VariantThemeContext = {
    scene,
    bottleGroup,
    ocean,
    rimLight: rim,
    documentRoot,
  }

  applyVariantTheme(ctx, initialSlug, { animate: false })

  let internalsVisible = false
  if (!isOceanOnly) {
    setBottleInternalsVisible(bottleGroup, internalsVisible, initialSlug)
  }

  let raf = 0
  const bottlePivot = new Group()
  if (!isOceanOnly) {
    bottlePivot.add(bottleGroup)
    scene.remove(bottleGroup)
    scene.add(bottlePivot)
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

  const positionCamera = (aspect: number): void => {
    if (isOceanOnly) {
      camera.position.set(0, 0.72, aspect < 0.85 ? 6.8 : 5.95)
      camera.lookAt(0, 0.28, 0)
    } else {
      camera.position.set(0.15, 1.15, aspect < 0.85 ? 6.4 : 5.5)
      camera.lookAt(0, 0.45, 0)
    }
  }

  const resize = (): void => {
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (w === 0 || h === 0) return
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    positionCamera(w / h)
    camera.updateProjectionMatrix()
  }

  resize()
  window.addEventListener("resize", resize)

  const startTime = performance.now()
  let bobPhase = 0

  const tick = (): void => {
    raf = requestAnimationFrame(tick)
    const elapsed = (performance.now() - startTime) / 1000
    ocean.update(elapsed)

    if (!isOceanOnly) {
      bottlePivot.rotation.y = reducedMotion ? 0 : elapsed * 0.22
      if (!reducedMotion) {
        bobPhase += 0.012
        bottlePivot.position.y = Math.sin(bobPhase) * 0.015
      }
    } else if (!reducedMotion) {
      bobPhase += 0.008
      camera.position.y = 0.72 + Math.sin(bobPhase) * 0.018
      camera.lookAt(0, 0.28, 0)
    }

    renderer.render(scene, camera)
  }

  const onVisibility = (): void => {
    if (document.hidden) {
      cancelAnimationFrame(raf)
    } else {
      tick()
    }
  }

  document.addEventListener("visibilitychange", onVisibility)
  tick()

  const dispose = (): void => {
    cancelAnimationFrame(raf)
    window.removeEventListener("resize", resize)
    document.removeEventListener("visibilitychange", onVisibility)
    renderer.dispose()
    scene.traverse((obj) => {
      const mesh = obj as { geometry?: { dispose: () => void }; material?: unknown }
      mesh.geometry?.dispose()
      const mat = mesh.material
      if (Array.isArray(mat)) mat.forEach((m) => (m as { dispose?: () => void }).dispose?.())
      else (mat as { dispose?: () => void })?.dispose?.()
    })
  }

  const setVariant = (slug: string, animate = true): void => {
    applyVariantTheme(ctx, slug, { animate })
    if (!isOceanOnly) {
      setBottleInternalsVisible(bottleGroup, internalsVisible, getActiveVariantSlug())
    }
  }

  return {
    dispose,
    setVariant,
    setInternalsVisible: (visible: boolean) => {
      if (isOceanOnly) return
      internalsVisible = visible
      setBottleInternalsVisible(bottleGroup, visible, getActiveVariantSlug())
    },
    getActiveSlug: getActiveVariantSlug,
    context: ctx,
    camera,
    usedPlaceholder: isPlaceholder,
    loadError,
    phase,
  }
}
