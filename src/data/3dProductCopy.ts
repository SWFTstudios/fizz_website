import { BRAND_HEADLINES, BRAND_HOW_IT_WORKS, BRAND_LEAD } from "./brandTokens"

export type Product3dCopy = {
  slug: string
  panelTitle: string
  panelLead: string
  steps: readonly string[]
}

const DEFAULT_STEPS = BRAND_HOW_IT_WORKS

export const PRODUCT_3D_COPY: Record<string, Product3dCopy> = {
  "charcoal-black": {
    slug: "charcoal-black",
    panelTitle: BRAND_HEADLINES.primary,
    panelLead: BRAND_LEAD,
    steps: DEFAULT_STEPS,
  },
  "coral-orange": {
    slug: "coral-orange",
    panelTitle: BRAND_HEADLINES.secondary,
    panelLead: "Bold coral hardware with a clear fluted body — built for sparkling water on the go.",
    steps: DEFAULT_STEPS,
  },
  "sage-green": {
    slug: "sage-green",
    panelTitle: BRAND_HEADLINES.primary,
    panelLead: "Soft sage accents for a calm, minimalist hydration ritual.",
    steps: DEFAULT_STEPS,
  },
  "steel-navy": {
    slug: "steel-navy",
    panelTitle: BRAND_HEADLINES.tertiary,
    panelLead: "Midnight navy hardware with a clear chamber for serious sparkle lovers.",
    steps: DEFAULT_STEPS,
  },
  "arctic-white": {
    slug: "arctic-white",
    panelTitle: BRAND_HEADLINES.primary,
    panelLead: "All-white hardware with a clear body — minimal, bright, and versatile.",
    steps: DEFAULT_STEPS,
  },
  "electric-blue": {
    slug: "electric-blue",
    panelTitle: BRAND_HEADLINES.secondary,
    panelLead: "Royal blue accents with a clear fluted body for bold hydration rituals.",
    steps: DEFAULT_STEPS,
  },
}

export function get3dCopyForSlug(slug: string): Product3dCopy {
  return PRODUCT_3D_COPY[slug] ?? PRODUCT_3D_COPY["charcoal-black"]
}
