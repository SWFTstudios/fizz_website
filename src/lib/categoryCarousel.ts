import Splide from "@splidejs/splide"
import "@splidejs/splide/css/core"
import { SHOP_CATEGORY_SLIDES, type ShopCategorySlide } from "./shopData"

let categorySplide: Splide | null = null

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export function buildCategorySlideMarkup(slide: ShopCategorySlide): string {
  const media = slide.backgroundImage
    ? `<img class="shop-slide-img" src="${slide.backgroundImage}" alt="" loading="lazy" />`
    : `<div class="shop-slide-fill" style="background:${slide.backgroundGradient}"></div>`

  const overlay = `<div class="shop-slide-overlay" style="background:${slide.backgroundGradient}"></div>`

  return `
    <li class="splide__slide">
      <a class="shop-slide-link" href="${slide.href}">
        <div class="shop-slide-media">
          ${media}
          ${overlay}
          <div class="shop-slide-copy">
            <h2 class="shop-slide-title fizz-heading">${escapeHtml(slide.title)}</h2>
            <p class="shop-slide-desc fizz-lead">${escapeHtml(slide.description)}</p>
            <span class="shop-slide-cta fizz-label">${escapeHtml(slide.ctaLabel)} →</span>
          </div>
        </div>
      </a>
    </li>
  `
}

function bindSliderControls(splideRoot: HTMLElement): void {
  const section = splideRoot.closest<HTMLElement>(".shop-hero-slider, .home-categories__slider")
  const controls = section?.querySelector<HTMLElement>(".shop-controls")
  if (!controls) return

  const boundKey = splideRoot.dataset.categorySplide ?? "default"
  if (controls.dataset.boundFor === boundKey) return

  controls.dataset.boundFor = boundKey
  controls.addEventListener("click", (e) => {
    const target = e.target as HTMLElement
    if (target.closest(".shop-control--prev")) categorySplide?.go("<")
    if (target.closest(".shop-control--next")) categorySplide?.go(">")
  })
}

export function initCategorySlider(root?: HTMLElement | null): void {
  const splideRoot =
    root ?? document.querySelector<HTMLElement>("body.shop-page .shop-splide[data-category-splide]")
  if (!splideRoot) return

  destroyCategorySlider()

  const track = splideRoot.querySelector<HTMLElement>(".splide__list")
  if (!track) return

  track.innerHTML = SHOP_CATEGORY_SLIDES.map(buildCategorySlideMarkup).join("")

  const useShopSliderChrome = Boolean(
    document.body.classList.contains("shop-layout-full") ||
      splideRoot.closest(".shop-slider-chrome"),
  )

  categorySplide = new Splide(splideRoot, {
    type: "loop",
    perPage: 3,
    perMove: 1,
    focus: "center",
    gap: useShopSliderChrome ? "0.65rem" : "1.25rem",
    pagination: false,
    arrows: false,
    drag: true,
    trimSpace: false,
    breakpoints: {
      767: {
        perPage: 1,
      },
    },
  })
  categorySplide.mount()
  bindSliderControls(splideRoot)
}

export function destroyCategorySlider(): void {
  if (categorySplide) {
    categorySplide.destroy(true)
    categorySplide = null
  }

  document.querySelectorAll<HTMLElement>(".shop-controls[data-bound-for]").forEach((controls) => {
    delete controls.dataset.boundFor
  })
}

export function initHomeCategoryCarousel(): void {
  const root = document.querySelector<HTMLElement>(
    ".home-categories .shop-splide[data-category-splide]",
  )
  if (!root) return
  initCategorySlider(root)
}
