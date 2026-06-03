import gradients from "./bottle-futuristic-gradients.json"

export type FuturisticGradient = {
  highlight: string
  mid: string
  deep: string
  glow: string
  accent: string
  angle: number
  themeBg: string
}

const GRADIENTS = gradients as Record<string, FuturisticGradient>

/** Product slug (shopData) → gradient preset key (hero-slides slug). */
export const SHOP_SLUG_TO_GRADIENT_KEY: Record<string, keyof typeof GRADIENTS> = {
  "coral-orange": "orange",
  "charcoal-black": "black",
  "sage-green": "green",
  "steel-navy": "navy",
  "arctic-white": "white",
  "electric-blue": "blue",
}

export function getGradientKeyForShopSlug(shopSlug: string): string {
  return SHOP_SLUG_TO_GRADIENT_KEY[shopSlug] ?? shopSlug
}

export function getFuturisticGradient(keyOrShopSlug: string): FuturisticGradient {
  const key = GRADIENTS[keyOrShopSlug]
    ? keyOrShopSlug
    : getGradientKeyForShopSlug(keyOrShopSlug)
  const gradient = GRADIENTS[key]
  if (!gradient) {
    return GRADIENTS.navy
  }
  return gradient
}

const ACCENT_RIM_KEYS = new Set(["black", "navy", "blue"])

/** Stacked CSS backgrounds for PDP / live heroes. */
export function getFuturisticBackgroundCss(keyOrShopSlug: string): string {
  const key = GRADIENTS[keyOrShopSlug]
    ? keyOrShopSlug
    : getGradientKeyForShopSlug(keyOrShopSlug)
  const g = getFuturisticGradient(key)
  const accentLayer = ACCENT_RIM_KEYS.has(key)
    ? `radial-gradient(ellipse 55% 45% at 72% 38%, ${g.accent}33 0%, transparent 70%), `
    : ""

  return `${accentLayer}radial-gradient(ellipse 90% 75% at 50% 52%, ${g.glow}59 0%, transparent 68%), linear-gradient(${g.angle}deg, ${g.highlight} 0%, ${g.mid} 42%, ${g.deep} 100%)`
}

export function getFuturisticThemeBg(keyOrShopSlug: string): string {
  return getFuturisticGradient(keyOrShopSlug).themeBg
}
