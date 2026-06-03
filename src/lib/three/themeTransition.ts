import gsap from "gsap"
import { Color, type Material } from "three"
import type { FuturisticGradient } from "../../data/bottleGradients"

export const THEME_DURATION = 0.85
export const THEME_EASE = "power2.inOut"

export function hexToColor(hex: string): Color {
  return new Color(hex)
}

type ThemeAnimTargets = {
  fogColor: Color
  waterColor: Color
  skyColor: Color
  rimIntensity: number
  cssRoot: HTMLElement
  fromGradient: FuturisticGradient
  toGradient: FuturisticGradient
  onMaterialLerp?: (t: number, to: FuturisticGradient) => void
}

export function animateThemeTransition(
  targets: ThemeAnimTargets,
  onComplete?: () => void,
): gsap.core.Tween {
  const state = {
    t: 0,
    rim: targets.rimIntensity,
  }

  const from = targets.fromGradient
  const to = targets.toGradient

  return gsap.to(state, {
    t: 1,
    rim: 1.2,
    duration: THEME_DURATION,
    ease: THEME_EASE,
    onUpdate: () => {
      const t = state.t
      targets.fogColor.lerpColors(hexToColor(from.deep), hexToColor(to.deep), t)
      targets.waterColor.lerpColors(hexToColor(from.mid), hexToColor(to.mid), t)
      targets.skyColor.lerpColors(hexToColor(from.highlight), hexToColor(to.highlight), t)
      targets.cssRoot.style.setProperty(
        "--b3d-accent",
        lerpHex(from.accent, to.accent, t),
      )
      targets.cssRoot.style.setProperty(
        "--b3d-bg",
        lerpHex(from.deep, to.deep, t),
      )
      targets.cssRoot.style.setProperty(
        "--b3d-glow",
        lerpHex(from.glow, to.glow, t),
      )
      targets.onMaterialLerp?.(t, to)
    },
    onComplete: () => {
      onComplete?.()
    },
  })
}

function lerpHex(a: string, b: string, t: number): string {
  const ca = hexToColor(a)
  const cb = hexToColor(b)
  ca.lerp(cb, t)
  return `#${ca.getHexString()}`
}

export function lerpMaterialColors(
  materials: Material[],
  fromHex: Map<Material, string>,
  toGradient: FuturisticGradient,
  t: number,
): void {
  const target = hexToColor(toGradient.mid)
  for (const mat of materials) {
    const startHex = fromHex.get(mat)
    if (!startHex) continue
    const m = mat as Material & { color?: Color }
    if (!m.color) continue
    m.color.lerpColors(hexToColor(startHex), target, t)
  }
}
