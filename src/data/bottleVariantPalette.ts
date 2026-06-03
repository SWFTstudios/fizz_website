/** Per-SKU bottle materials aligned with PDP images (`public/images/bottles/`). */

export type BottleVariantPalette = {
  hardwareColor: string
  hardwareMetalness: number
  hardwareRoughness: number
  bodyColor: string
  bodyTransmission: number
  bodyOpacity: number
  bodyRoughness: number
  bodyIor: number
}

const DEFAULT_PALETTE: BottleVariantPalette = {
  hardwareColor: "#1e2530",
  hardwareMetalness: 0.08,
  hardwareRoughness: 0.42,
  bodyColor: "#f4f8fc",
  bodyTransmission: 0.94,
  bodyOpacity: 1,
  bodyRoughness: 0.08,
  bodyIor: 1.5,
}

/** Hardware hex from shop gradients / product photography. */
const PALETTES: Record<string, BottleVariantPalette> = {
  "coral-orange": {
    hardwareColor: "#e8724f",
    hardwareMetalness: 0.06,
    hardwareRoughness: 0.4,
    bodyColor: "#fff8f4",
    bodyTransmission: 0.94,
    bodyOpacity: 1,
    bodyRoughness: 0.08,
    bodyIor: 1.5,
  },
  "charcoal-black": {
    hardwareColor: "#30343c",
    hardwareMetalness: 0.1,
    hardwareRoughness: 0.38,
    bodyColor: "#f5f8fb",
    bodyTransmission: 0.95,
    bodyOpacity: 1,
    bodyRoughness: 0.07,
    bodyIor: 1.5,
  },
  "sage-green": {
    hardwareColor: "#c5d3bc",
    hardwareMetalness: 0.06,
    hardwareRoughness: 0.42,
    bodyColor: "#f6faf4",
    bodyTransmission: 0.94,
    bodyOpacity: 1,
    bodyRoughness: 0.08,
    bodyIor: 1.5,
  },
  "steel-navy": {
    hardwareColor: "#344f66",
    hardwareMetalness: 0.1,
    hardwareRoughness: 0.4,
    bodyColor: "#f6f9fc",
    bodyTransmission: 0.94,
    bodyOpacity: 1,
    bodyRoughness: 0.08,
    bodyIor: 1.5,
  },
  "arctic-white": {
    hardwareColor: "#f4f5f7",
    hardwareMetalness: 0.04,
    hardwareRoughness: 0.35,
    bodyColor: "#fbfdff",
    bodyTransmission: 0.96,
    bodyOpacity: 1,
    bodyRoughness: 0.06,
    bodyIor: 1.5,
  },
  "electric-blue": {
    hardwareColor: "#4a5ca6",
    hardwareMetalness: 0.08,
    hardwareRoughness: 0.4,
    bodyColor: "#f4f6ff",
    bodyTransmission: 0.94,
    bodyOpacity: 1,
    bodyRoughness: 0.08,
    bodyIor: 1.5,
  },
}

export function getBottlePaletteForSlug(slug: string): BottleVariantPalette {
  return PALETTES[slug] ?? DEFAULT_PALETTE
}
