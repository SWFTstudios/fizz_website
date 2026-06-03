export type BottleSpec = {
  label: string
  value: string
}

export type BottleFeature = {
  title: string
  description: string
}

export type BottleStep = {
  step: number
  title: string
  description: string
}

export type BottleCareItem = {
  title: string
  description: string
}

export type BottleProduct = {
  slug: string
  name: string
  description: string
  image: string
  gradient: string
  textColor: string
  productHref: string
  shopifyProductId: string
  shopifyVariantId: string
  priceDisplay: string
  compareAtDisplay: string
  colorOption: string
  specs: BottleSpec[]
  features: BottleFeature[]
  howItWorks: BottleStep[]
  care: BottleCareItem[]
}

export function productHrefForSlug(slug: string): string {
  return `/products/${slug}.html`
}

export function getBottleBySlug(slug: string): BottleProduct | undefined {
  return BOTTLE_PRODUCTS.find((b) => b.slug === slug)
}

const SHARED_SPECS: BottleSpec[] = [
  { label: "Capacity", value: "1 L (33.8 oz)" },
  { label: "Fill line", value: "840 ml" },
  { label: "Dimensions", value: '3.1" × 11" (slim)' },
  { label: "Weight (empty)", value: "~0.5 lbs" },
  { label: "Material", value: "BPA-free Tritan™ plastic" },
  { label: "Hardware", value: "Food-grade lid, base & infuser core" },
  { label: "Dishwasher", value: "Top rack safe" },
  { label: "Compatibility", value: "All FIZZ5 carbonation makers" },
  { label: "Bottle life", value: "3–4 years (date on base)" },
]

const SHARED_FEATURES: BottleFeature[] = [
  {
    title: "1L capacity",
    description:
      "Slim-profile bottle holds a full liter with a clear fill line for perfect carbonation every time.",
  },
  {
    title: "BPA-free Tritan",
    description:
      "Crystal-clear, shatter-resistant body with no BPA, phthalates, or harmful plasticizers.",
  },
  {
    title: "Integrated infuser",
    description:
      "Center core keeps fruit, herbs, or flavor packs in place while you carbonate and sip.",
  },
  {
    title: "Dishwasher safe",
    description:
      "Top-rack safe for easy cleaning—hand-wash the lid gasket for longest seal life.",
  },
]

const SHARED_HOW_IT_WORKS: BottleStep[] = [
  {
    step: 1,
    title: "Fill to the line",
    description:
      "Add cold water to the fill line (840 ml). Cold water holds more CO₂ for a crisper sparkle.",
  },
  {
    step: 2,
    title: "Carbonate",
    description:
      "Lock the bottle into your FIZZ5 maker and press until you hear the buzz—short bursts for lighter fizz, longer for bold.",
  },
  {
    step: 3,
    title: "Enjoy",
    description:
      "Unscrew gently, add flavor if you like, and enjoy sparkling water at home or on the go.",
  },
]

const SHARED_CARE: BottleCareItem[] = [
  {
    title: "Daily rinse",
    description:
      "Rinse after each use. For sticky residue, soak with warm water and a drop of dish soap before carbonating again.",
  },
  {
    title: "Dishwasher",
    description:
      "Bottle body is top-rack dishwasher safe. Hand-wash the lid and gasket weekly to maintain pressure seal.",
  },
  {
    title: "Replace on schedule",
    description:
      "Plastic carbonating bottles expire after 3–4 years. Check the date molded on the base and replace when due.",
  },
]

const bottleDefaults = {
  shopifyProductId: "",
  shopifyVariantId: "",
  priceDisplay: "$34",
  compareAtDisplay: "$44",
  specs: SHARED_SPECS,
  features: SHARED_FEATURES,
  howItWorks: SHARED_HOW_IT_WORKS,
  care: SHARED_CARE,
}

export const BOTTLE_PRODUCTS: BottleProduct[] = [
  {
    slug: "coral-orange",
    name: "Coral Orange",
    colorOption: "Coral Orange",
    description:
      "Bold and energetic. A vibrant coral finish with a clear fluted body and integrated infuser core—built for sparkling water at home or on the go.",
    image: "/images/bottles/bottle-orange.png",
    gradient: "radial-gradient(circle at 60% 40%, #f0a080, #e8724f 60%, #b84a28)",
    textColor: "#ffffff",
    productHref: productHrefForSlug("coral-orange"),
    ...bottleDefaults,
  },
  {
    slug: "charcoal-black",
    name: "Charcoal Black",
    colorOption: "Charcoal Black",
    description:
      "Sleek and understated. Deep charcoal accents on a transparent body for a refined everyday carry and café-worthy countertop style.",
    image: "/images/bottles/bottle-black.png",
    gradient: "radial-gradient(circle at 60% 40%, #3a4455, #1e2530 60%, #0a0e14)",
    textColor: "#ffffff",
    productHref: productHrefForSlug("charcoal-black"),
    ...bottleDefaults,
  },
  {
    slug: "sage-green",
    name: "Sage Green",
    colorOption: "Sage Green",
    description:
      "Soft and natural. Muted sage hardware pairs with a clear body for a calm, minimalist look that fits any kitchen.",
    image: "/images/bottles/bottle-green.png",
    gradient: "radial-gradient(circle at 60% 40%, #ddebd4, #c5d3bc 60%, #8fa888)",
    textColor: "#1a2418",
    productHref: productHrefForSlug("sage-green"),
    ...bottleDefaults,
  },
  {
    slug: "steel-navy",
    name: "Steel Navy",
    colorOption: "Steel Navy",
    description:
      "Sophisticated and deep. Midnight navy lid, base, and core with a fluted transparent chamber for serious sparkle lovers.",
    image: "/images/bottles/bottle-navy.png",
    gradient: "radial-gradient(circle at 60% 40%, #4a6a80, #2c4557 60%, #101d26)",
    textColor: "#ffffff",
    productHref: productHrefForSlug("steel-navy"),
    ...bottleDefaults,
  },
  {
    slug: "arctic-white",
    name: "Arctic White",
    colorOption: "Arctic White",
    description:
      "Clean and crisp. All-white hardware with a clear body—minimal, bright, and versatile enough for every refill.",
    image: "/images/bottles/bottle-white.png",
    gradient: "radial-gradient(circle at 60% 40%, #ffffff, #e8e8e8 60%, #c0c0c0)",
    textColor: "#1a1a1a",
    productHref: productHrefForSlug("arctic-white"),
    ...bottleDefaults,
  },
  {
    slug: "electric-blue",
    name: "Electric Blue",
    colorOption: "Electric Blue",
    description:
      "Vivid and confident. Royal blue accents with a clear fluted body and centered infuser for bold hydration rituals.",
    image: "/images/bottles/bottle-blue.png",
    gradient: "radial-gradient(circle at 60% 40%, #7080d0, #4a5ca6 60%, #202870)",
    textColor: "#ffffff",
    productHref: productHrefForSlug("electric-blue"),
    ...bottleDefaults,
  },
]

export type ShopCategorySlide = {
  title: string
  href: string
  description: string
  ctaLabel: string
  backgroundImage?: string
  backgroundGradient: string
}

export const SHOP_CATEGORY_SLIDES: ShopCategorySlide[] = [
  {
    title: "CO₂ Refills",
    href: "/co2.html",
    description:
      "Keep the bubbles going. Swap in a fresh cartridge and stay ready for your next pour.",
    ctaLabel: "View refills",
    backgroundImage: "/images/categories/co2-refills.jpg",
    backgroundGradient:
      "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.75) 70%)",
  },
  {
    title: "Bottles",
    href: "/bottles.html",
    description:
      "Six finishes, one system. Pick the bottle that fits your routine and your style.",
    ctaLabel: "View bottles",
    backgroundImage: "/images/categories/bottles.jpg",
    backgroundGradient:
      "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.7) 70%)",
  },
  {
    title: "Flavors",
    href: "/flavors.html",
    description:
      "Bright, clean flavor packs made to mix fast—no syrups, no fuss, just Fizz.",
    ctaLabel: "View flavors",
    backgroundImage: "/images/categories/flavors.jpg",
    backgroundGradient:
      "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.75) 70%)",
  },
]
