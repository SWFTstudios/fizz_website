import Splide from "@splidejs/splide"
import "@splidejs/splide/css/core"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { BOTTLE_PRODUCTS, SHOP_CATEGORY_SLIDES } from "./shopData"
import { destroyShopMarquee, initShopMarquee } from "./shopMarquee"

let categorySplide: Splide | null = null
let teardownScrollLock: (() => void) | null = null

function lockVerticalScroll(): () => void {
  const html = document.documentElement
  const body = document.body
  const prevHtmlOverflow = html.style.overflow
  const prevBodyOverflow = body.style.overflow

  html.style.overflow = "hidden"
  body.style.overflow = "hidden"
  window.scrollTo(0, 0)

  return () => {
    html.style.overflow = prevHtmlOverflow
    body.style.overflow = prevBodyOverflow
  }
}

function buildSlideMarkup(slide: (typeof SHOP_CATEGORY_SLIDES)[number]): string {
  const media = slide.backgroundImage
    ? `<img class="shop-slide-img" src="${slide.backgroundImage}" alt="" loading="lazy" />`
    : `<div class="shop-slide-fill" style="background:${slide.backgroundGradient}"></div>`

  const overlay = slide.backgroundImage
    ? `<div class="shop-slide-overlay" style="background:${slide.backgroundGradient}"></div>`
    : ""

  return `
    <li class="splide__slide">
      <a class="shop-slide-link" href="${slide.href}">
        <div class="shop-slide-media">
          ${media}
          ${overlay}
          <h2 class="shop-slide-title fizz-heading">${slide.title}</h2>
        </div>
      </a>
    </li>
  `
}

function bindSliderControls(root: HTMLElement): void {
  const controls = root.closest(".shop-main")?.querySelector<HTMLElement>(".shop-controls")
  if (!controls || controls.dataset.bound) return

  controls.dataset.bound = "true"
  controls.addEventListener("click", (e) => {
    const target = e.target as HTMLElement
    if (target.closest(".shop-control--prev")) categorySplide?.go("<")
    if (target.closest(".shop-control--next")) categorySplide?.go(">")
  })
}

function initCategorySlider(root?: HTMLElement | null): void {
  const splideRoot = root ?? document.querySelector<HTMLElement>("body.shop-page .shop-splide")
  if (!splideRoot) return

  if (categorySplide) {
    categorySplide.destroy(true)
    categorySplide = null
  }

  const track = splideRoot.querySelector<HTMLElement>(".splide__list")
  if (!track) return

  track.innerHTML = SHOP_CATEGORY_SLIDES.map(buildSlideMarkup).join("")

  categorySplide = new Splide(splideRoot, {
    type: "loop",
    perPage: 3,
    perMove: 1,
    focus: "center",
    gap: "1rem",
    pagination: false,
    arrows: false,
    drag: true,
    breakpoints: {
      767: {
        perPage: 1,
      },
    },
  })
  categorySplide.mount()
  bindSliderControls(splideRoot)
}

function resetShopPanel(): void {
  const panel = document.getElementById("shop")
  if (!panel) return

  const marqueeSplide = panel.querySelector<HTMLElement>("[data-shop-marquee-splide]")
  if (marqueeSplide) {
    destroyShopMarquee(panel)
  }

  panel.setAttribute("hidden", "")
  panel.classList.add("is-shop-hidden")
  panel.classList.remove("is-shop-open")

  const controls = panel.querySelector<HTMLElement>(".shop-controls")
  if (controls) {
    delete controls.dataset.bound
  }
}

export function openShopPanel(): Promise<void> {
  const panel = document.getElementById("shop")
  if (!panel) return Promise.resolve()

  panel.removeAttribute("hidden")
  panel.classList.remove("is-shop-hidden")
  panel.classList.add("is-shop-open")

  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const marqueeRoot = panel.querySelector<HTMLElement>("[data-shop-marquee-splide]")
        const splideRoot = panel.querySelector<HTMLElement>(".shop-splide")

        if (marqueeRoot) {
          initShopMarquee(panel)
        } else if (splideRoot) {
          initCategorySlider(splideRoot)
        }

        ScrollTrigger.refresh()
        resolve()
      })
    })
  })
}

function renderBottleGrid(): void {
  const grid = document.querySelector<HTMLElement>(".collection-grid")
  if (!grid) return

  grid.innerHTML = BOTTLE_PRODUCTS.map(
    (bottle) => `
    <a
      class="product-card product-card--link"
      href="${bottle.productHref}"
      data-product-slug="${bottle.slug}"
    >
      <div class="card-bg" style="background: ${bottle.gradient}">
        <img
          class="card-bottle-img"
          src="${bottle.image}"
          alt="Fizz5 Bottle – ${bottle.name}"
          loading="lazy"
          width="400"
          height="400"
        />
      </div>
      <div class="card-info">
        <h2 class="card-name fizz-heading">${bottle.name}</h2>
        <p class="card-desc fizz-lead">${bottle.description}</p>
        <span class="fizz-btn fizz-btn--outline">View product</span>
      </div>
    </a>
  `,
  ).join("")
}

export function destroyShopPage(): void {
  teardownScrollLock?.()
  teardownScrollLock = null
  if (categorySplide) {
    categorySplide.destroy(true)
    categorySplide = null
  }
  resetShopPanel()
}

export function initShopCategoryPage(): void {
  teardownScrollLock?.()
  if (document.querySelector(".shop-splide")) {
    teardownScrollLock = lockVerticalScroll()
  }
  initCategorySlider()
}

function unlockPageScroll(): void {
  document.documentElement.style.overflow = ""
  document.documentElement.style.height = ""
  document.body.style.overflow = ""
  document.body.style.height = ""
}

export function initBottlesCollectionPage(): void {
  document.body.classList.add("shop-page", "shop-collection-page")
  unlockPageScroll()
  renderBottleGrid()
}

export function bootShopPage(): void {
  if (document.body.classList.contains("shop-page") && document.querySelector(".shop-splide")) {
    initShopCategoryPage()
  }
  if (document.querySelector(".collection-grid")) {
    initBottlesCollectionPage()
  }
}
