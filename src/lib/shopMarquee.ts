import Splide from "@splidejs/splide"
import { AutoScroll } from "@splidejs/splide-extension-auto-scroll"
import "@splidejs/splide/css/core"
import { BOTTLE_PRODUCTS, type BottleProduct } from "./shopData"

let marqueeSplide: Splide | null = null

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function buildMarqueeSlide(bottle: BottleProduct): string {
  return `
    <li class="splide__slide shop-marquee-slide">
      <a
        class="shop-marquee-card"
        href="${bottle.productHref}"
        data-product-slug="${bottle.slug}"
        style="color: ${bottle.textColor}"
      >
        <span
          class="shop-marquee-card__bg"
          style="background: ${bottle.gradient}"
          aria-hidden="true"
        ></span>
        <img
          class="shop-marquee-card__img"
          src="${bottle.image}"
          alt="Fizz5 Bottle – ${bottle.name}"
          loading="lazy"
          width="400"
          height="400"
        />
        <span class="shop-marquee-card__name fizz-label">${bottle.name}</span>
      </a>
    </li>
  `
}

function findMarqueeRoot(container?: HTMLElement | null): HTMLElement | null {
  if (container) {
    return (
      container.querySelector<HTMLElement>("[data-shop-marquee-splide]") ??
      container.closest<HTMLElement>("[data-shop-marquee-splide]")
    )
  }
  return document.querySelector<HTMLElement>("[data-shop-marquee-splide]")
}

export function initShopMarquee(container?: HTMLElement | null): void {
  const splideRoot = findMarqueeRoot(container)
  if (!splideRoot) return

  if (marqueeSplide) {
    marqueeSplide.destroy(true)
    marqueeSplide = null
  }

  const list = splideRoot.querySelector<HTMLElement>(".splide__list")
  if (!list) return

  list.innerHTML = BOTTLE_PRODUCTS.map(buildMarqueeSlide).join("")

  const useAutoScroll = !prefersReducedMotion()

  marqueeSplide = new Splide(splideRoot, {
    type: "loop",
    gap: "1.25rem",
    drag: "free",
    autoWidth: true,
    pagination: false,
    arrows: false,
    ...(useAutoScroll
      ? {
          autoScroll: {
            speed: 0.9,
            pauseOnHover: true,
            pauseOnFocus: false,
            rewind: true,
          },
        }
      : {}),
  })

  if (useAutoScroll) {
    marqueeSplide.mount({ AutoScroll })
  } else {
    marqueeSplide.mount()
  }

  splideRoot.dataset.marqueeInited = "1"
}

export function destroyShopMarquee(container?: HTMLElement | null): void {
  if (marqueeSplide) {
    marqueeSplide.destroy(true)
    marqueeSplide = null
  }

  const splideRoot = findMarqueeRoot(container)
  if (!splideRoot) return

  const list = splideRoot.querySelector<HTMLElement>(".splide__list")
  if (list) list.innerHTML = ""
  delete splideRoot.dataset.marqueeInited
}
