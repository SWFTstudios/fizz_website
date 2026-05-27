import { getBottleBySlug } from "./shopData"

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

export function bootProductPage(): void {
  document.body.classList.add("shop-page", "product-detail-page")
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

  const hero = document.querySelector<HTMLElement>("[data-product-hero]")
  if (hero) {
    hero.style.background = bottle.gradient
    hero.innerHTML = `
      <img
        class="product-pdp__img"
        src="${escapeHtml(bottle.image)}"
        alt="Fizz5 Bottle – ${escapeHtml(bottle.name)}"
        width="680"
        height="680"
      />
    `
  }

  const title = document.querySelector<HTMLElement>("[data-product-title]")
  if (title) title.textContent = bottle.name

  const price = document.querySelector<HTMLElement>("[data-product-price]")
  if (price) price.textContent = bottle.priceDisplay

  const compareAt = document.querySelector<HTMLElement>("[data-product-compare-at]")
  if (compareAt) compareAt.textContent = bottle.compareAtDisplay

  const desc = document.querySelector<HTMLElement>("[data-product-desc]")
  if (desc) desc.textContent = bottle.description

  const info = document.querySelector<HTMLElement>(".product-pdp__info")
  if (info) {
    info.style.setProperty("--card-text", bottle.textColor)
    const isLightText = bottle.textColor.toLowerCase() !== "#1a1a1a"
    info.classList.toggle("product-pdp__info--light-bg", !isLightText)
  }

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

  const careRoot = document.querySelector<HTMLElement>("[data-product-care]")
  if (careRoot) {
    careRoot.innerHTML = bottle.care
      .map(
        (item) => `
        <li class="product-pdp__care-item">
          <h3 class="product-pdp__care-title fizz-label">${escapeHtml(item.title)}</h3>
          <p class="product-pdp__care-desc fizz-body--sm">${escapeHtml(item.description)}</p>
        </li>
      `,
      )
      .join("")
  }

  document.title = `${bottle.name} | Shop Fizz`
}
