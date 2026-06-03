import { getFuturisticBackgroundCss } from "../data/bottleGradients"
import { BOTTLE_PRODUCTS, getBottleBySlug, productHrefForSlug } from "./shopData"

const SIZE_OPTIONS = ["1 L", "750 ML", "500 ML", "350 ML"] as const
const DEFAULT_SIZE = "750 ML"

const SWATCH_COLORS: Record<string, string> = {
  "coral-orange": "#e8724f",
  "charcoal-black": "#1e2530",
  "sage-green": "#8fa888",
  "steel-navy": "#2c4557",
  "arctic-white": "#e8e8e8",
  "electric-blue": "#4a5ca6",
}

const GALLERY_CROPS = [
  { label: "Full bottle", objectPosition: "50% 50%" },
  { label: "Cap detail", objectPosition: "50% 12%" },
  { label: "Base detail", objectPosition: "50% 88%" },
] as const

function resolveProductSlug(): string | null {
  const match = window.location.pathname.match(/\/products\/([^/]+)\.html$/)
  if (match?.[1]) return match[1]
  return document.body.dataset.productSlug ?? null
}

function unlockPageScroll(): void {
  document.documentElement.style.overflow = ""
  document.documentElement.style.height = ""
  document.body.style.overflow = ""
  document.body.style.height = ""
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function initProductGallery(bottle: NonNullable<ReturnType<typeof getBottleBySlug>>): void {
  const hero = document.querySelector<HTMLElement>("[data-product-hero]")
  const thumbsRoot = document.querySelector<HTMLElement>("[data-product-thumbs]")
  if (!hero || !thumbsRoot) return

  hero.style.background = getFuturisticBackgroundCss(bottle.slug)

  const setMainImage = (cropIndex: number): void => {
    const crop = GALLERY_CROPS[cropIndex] ?? GALLERY_CROPS[0]
    hero.innerHTML = `
      <img
        class="product-pdp__img"
        src="${escapeHtml(bottle.image)}"
        alt="Fizz5 Bottle – ${escapeHtml(bottle.name)}"
        width="680"
        height="680"
        style="object-position: ${crop.objectPosition}"
      />
    `
    thumbsRoot.querySelectorAll<HTMLButtonElement>("[data-thumb-index]").forEach((btn, i) => {
      btn.classList.toggle("is-active", i === cropIndex)
      btn.setAttribute("aria-selected", i === cropIndex ? "true" : "false")
    })
  }

  thumbsRoot.innerHTML = ""
  GALLERY_CROPS.forEach((crop, i) => {
    const btn = document.createElement("button")
    btn.type = "button"
    btn.className = "product-pdp__thumb"
    btn.dataset.thumbIndex = String(i)
    btn.setAttribute("role", "tab")
    btn.setAttribute("aria-label", crop.label)
    btn.innerHTML = `
      <img src="${escapeHtml(bottle.image)}" alt="" style="object-position: ${crop.objectPosition}" />
    `
    btn.addEventListener("click", () => setMainImage(i))
    thumbsRoot.appendChild(btn)
  })

  setMainImage(0)
}

function initProductSizes(): void {
  const root = document.querySelector<HTMLElement>("[data-product-sizes]")
  if (!root) return

  root.innerHTML = ""
  SIZE_OPTIONS.forEach((size) => {
    const btn = document.createElement("button")
    btn.type = "button"
    btn.className = "product-pdp__size"
    btn.textContent = size
    if (size === DEFAULT_SIZE) btn.classList.add("is-active")
    btn.addEventListener("click", () => {
      root.querySelectorAll<HTMLElement>(".product-pdp__size").forEach((el) => {
        el.classList.toggle("is-active", el === btn)
      })
    })
    root.appendChild(btn)
  })
}

function initProductSwatches(activeSlug: string): void {
  const root = document.querySelector<HTMLElement>("[data-product-swatches]")
  if (!root) return

  root.innerHTML = ""
  BOTTLE_PRODUCTS.forEach((b) => {
    const link = document.createElement("a")
    link.href = productHrefForSlug(b.slug)
    link.className = "product-pdp__swatch"
    link.dataset.transition = ""
    link.setAttribute("aria-label", b.colorOption)
    link.style.setProperty("--swatch-color", SWATCH_COLORS[b.slug] ?? "#888")
    if (b.slug === activeSlug) link.classList.add("is-active")
    link.innerHTML = `<span class="product-pdp__swatch-dot"></span>`
    root.appendChild(link)
  })
}

export function bootProductPage(): void {
  document.body.classList.add("shop-page", "product-detail-page", "shop-surface")
  unlockPageScroll()

  const slug = resolveProductSlug()
  if (!slug) return

  document.body.dataset.productSlug = slug

  const bottle = getBottleBySlug(slug)
  if (!bottle) return

  const pdp = document.querySelector<HTMLElement>(".product-pdp")
  if (!pdp) return

  pdp.dataset.shopifyProductId = bottle.shopifyProductId
  pdp.dataset.shopifyVariantId = bottle.shopifyVariantId
  pdp.dataset.productSlug = bottle.slug

  initProductGallery(bottle)
  initProductSizes()
  initProductSwatches(slug)

  const title = document.querySelector<HTMLElement>("[data-product-title]")
  if (title) title.textContent = bottle.name

  const price = document.querySelector<HTMLElement>("[data-product-price]")
  if (price) price.textContent = bottle.priceDisplay

  const compareAt = document.querySelector<HTMLElement>("[data-product-compare-at]")
  if (compareAt) compareAt.textContent = bottle.compareAtDisplay

  const desc = document.querySelector<HTMLElement>("[data-product-desc]")
  if (desc) desc.textContent = bottle.description

  const featuresRoot = document.querySelector<HTMLElement>("[data-product-features]")
  if (featuresRoot) {
    featuresRoot.innerHTML = bottle.features
      .map(
        (f) => `
        <div class="product-pdp__feature">
          <h3 class="product-pdp__feature-title fizz-label">${escapeHtml(f.title)}</h3>
          <p class="product-pdp__feature-desc fizz-body--sm">${escapeHtml(f.description)}</p>
        </div>
      `,
      )
      .join("")
  }

  const specsRoot = document.querySelector<HTMLElement>("[data-product-specs]")
  if (specsRoot) {
    specsRoot.innerHTML = bottle.specs
      .map(
        (s) => `
        <div class="product-pdp__spec-row">
          <dt class="product-pdp__spec-label fizz-label">${escapeHtml(s.label)}</dt>
          <dd class="product-pdp__spec-value">${escapeHtml(s.value)}</dd>
        </div>
      `,
      )
      .join("")
  }

  const stepsRoot = document.querySelector<HTMLElement>("[data-product-steps]")
  if (stepsRoot) {
    stepsRoot.innerHTML = bottle.howItWorks
      .map(
        (step) => `
        <li class="product-pdp__step">
          <span class="product-pdp__step-num fizz-label" aria-hidden="true">${step.step}</span>
          <div class="product-pdp__step-body">
            <h3 class="product-pdp__step-title">${escapeHtml(step.title)}</h3>
            <p class="product-pdp__step-desc fizz-body--sm">${escapeHtml(step.description)}</p>
          </div>
        </li>
      `,
      )
      .join("")
  }

  document.title = `${bottle.name} | Shop Fizz`
}
