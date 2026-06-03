import heroConfig from "./hero-slides.json"

export type HeroSlideTheme = {
  bg: string
  color: string
  contentColor: string
}

export type HeroProductSlide = {
  id: string
  slug: string
  shopSlug: string
  productName: string
  bottleFile: string
  alt: string
  gradientKey: string
  theme: HeroSlideTheme
}

export const HERO_VIDEO_SLIDE_THEMES = heroConfig.videoSlides as Record<string, HeroSlideTheme>

export const HERO_PRODUCT_SLIDES = heroConfig.productSlides as HeroProductSlide[]

export const HERO_PRODUCT_SLIDE_IDS = new Set(HERO_PRODUCT_SLIDES.map((s) => s.id))

export function isHeroProductSlideId(slideId: string): boolean {
  return HERO_PRODUCT_SLIDE_IDS.has(slideId)
}

export function getHeroProductSlideById(slideId: string): HeroProductSlide | undefined {
  return HERO_PRODUCT_SLIDES.find((s) => s.id === slideId)
}

export function heroImagePaths(slug: string): { webp: string; jpg: string } {
  const base = `/images/hero/hero-slide-${slug}`
  return { webp: `${base}.webp`, jpg: `${base}.jpg` }
}

export const HERO_SLIDE_THEMES: Record<string, HeroSlideTheme> = {
  ...HERO_VIDEO_SLIDE_THEMES,
  ...Object.fromEntries(HERO_PRODUCT_SLIDES.map((s) => [s.id, s.theme])),
}
