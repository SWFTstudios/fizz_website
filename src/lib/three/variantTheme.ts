import { getFuturisticGradient } from "../../data/bottleGradients"
import { getBottlePaletteForSlug } from "../../data/bottleVariantPalette"
import { get3dCopyForSlug } from "../../data/3dProductCopy"
import {
  Color,
  Fog,
  type Group,
  type PointLight,
  type Scene,
} from "three"
import {
  applyBottleVariantMaterials,
  lerpBottleMaterials,
  readBottleMaterialHexes,
} from "./bottleColors"
import type { OceanEnvironment } from "./loadOceanEnvironment"
import { animateThemeTransition } from "./themeTransition"

export type VariantThemeContext = {
  scene: Scene
  bottleGroup: Group
  ocean: OceanEnvironment
  rimLight: PointLight
  documentRoot: HTMLElement
  onCopyUpdate?: (slug: string) => void
}

let activeSlug = "charcoal-black"
let activeGradient = getFuturisticGradient("charcoal-black")
let themeTween: ReturnType<typeof animateThemeTransition> | null = null

export function getActiveVariantSlug(): string {
  return activeSlug
}

export function applyVariantTheme(
  ctx: VariantThemeContext,
  slug: string,
  options: { animate?: boolean } = {},
): void {
  const next = getFuturisticGradient(slug)
  const prev = activeGradient
  const animate = options.animate ?? false

  const applyInstant = (): void => {
    activeSlug = slug
    activeGradient = next
    ctx.documentRoot.dataset.activeVariant = slug

    ctx.scene.fog = new Fog(next.deep, 4, 28)
    ctx.scene.background = new Color(next.deep)
    ctx.ocean.setGradient(next)
    applyBottleVariantMaterials(ctx.bottleGroup, slug)
    ctx.rimLight.color.set(next.glow)
    ctx.rimLight.intensity = 1.2

    ctx.documentRoot.style.setProperty("--b3d-accent", next.accent)
    ctx.documentRoot.style.setProperty("--b3d-bg", next.deep)
    ctx.documentRoot.style.setProperty("--b3d-glow", next.glow)

    updateDomCopy(ctx, slug)
    updateVariantButtons(ctx.documentRoot, slug)
  }

  if (!animate || slug === activeSlug) {
    applyInstant()
    return
  }

  themeTween?.kill()
  const bottleMaps = readBottleMaterialHexes(ctx.bottleGroup)
  const fromPalette = getBottlePaletteForSlug(activeSlug)
  const toPalette = getBottlePaletteForSlug(slug)

  const fogColor = new Color(prev.deep)
  const waterMat = ctx.ocean.water.material
  const skyMat = ctx.ocean.sky.material
  const waterColor =
    waterMat && !Array.isArray(waterMat) && "color" in waterMat
      ? (waterMat.color as Color).clone()
      : new Color(prev.mid)
  const skyColor =
    skyMat && !Array.isArray(skyMat) && "color" in skyMat
      ? (skyMat.color as Color).clone()
      : new Color(prev.highlight)

  themeTween = animateThemeTransition(
    {
      fogColor,
      waterColor,
      skyColor,
      rimIntensity: ctx.rimLight.intensity,
      cssRoot: ctx.documentRoot,
      fromGradient: prev,
      toGradient: next,
      onMaterialLerp: (t) => {
        ctx.scene.fog = new Fog(fogColor.getStyle(), 4, 28)
        ctx.scene.background = fogColor.clone()
        if (waterMat && !Array.isArray(waterMat) && "color" in waterMat) {
          ;(waterMat.color as Color).copy(waterColor)
        }
        if (skyMat && !Array.isArray(skyMat) && "color" in skyMat) {
          ;(skyMat.color as Color).copy(skyColor)
        }
        ctx.rimLight.color.lerpColors(new Color(prev.glow), new Color(next.glow), t)
        lerpBottleMaterials(bottleMaps, fromPalette, toPalette, t)
      },
    },
    () => {
      applyInstant()
      themeTween = null
    },
  )
}

function updateDomCopy(ctx: VariantThemeContext, slug: string): void {
  const copy = get3dCopyForSlug(slug)
  const title = ctx.documentRoot.querySelector<HTMLElement>("#b3d-panel-title")
  const lead = ctx.documentRoot.querySelector<HTMLElement>("#b3d-panel-lead")
  const hero = ctx.documentRoot.querySelector<HTMLElement>(".b3d-hero-serif")
  const steps = ctx.documentRoot.querySelector<HTMLElement>("#b3d-steps")
  const buyNow = ctx.documentRoot.querySelector<HTMLAnchorElement>("#b3d-shop-cta")
  if (title) title.textContent = copy.panelTitle
  if (lead) lead.textContent = copy.panelLead
  if (hero) hero.textContent = copy.panelTitle
  if (steps) {
    steps.innerHTML = copy.steps
      .map((s, i) => `<li><span>${i + 1}</span>${s}</li>`)
      .join("")
  }
  if (buyNow) {
    buyNow.href = `/products/${slug}.html`
    buyNow.textContent = "Buy Now"
  }
  ctx.onCopyUpdate?.(slug)
}

function updateVariantButtons(root: HTMLElement, slug: string): void {
  root.querySelectorAll<HTMLButtonElement>("[data-variant]").forEach((btn) => {
    const isActive = btn.dataset.variant === slug
    btn.setAttribute("aria-selected", String(isActive))
    btn.classList.toggle("is-active", isActive)
  })
}
