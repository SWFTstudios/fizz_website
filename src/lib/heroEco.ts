import { getFuturisticBackgroundCss } from "../data/bottleGradients"
import {
  getHeroProductSlideById,
  HERO_PRODUCT_SLIDES,
  isHeroProductSlideId,
} from "../data/heroSlides"
import { productHrefForSlug } from "./shopData"

function atmosphereImagePaths(slug: string): { webp: string; jpg: string } {
  const base = `/images/hero/hero-atmosphere-${slug}`
  return { webp: `${base}.webp`, jpg: `${base}.jpg` }
}

function applySlideBackground(slideEl: HTMLElement, gradientKey: string): void {
  const bg = slideEl.querySelector<HTMLElement>(".hero-slide__bg")
  if (!bg) return
  bg.style.background = getFuturisticBackgroundCss(gradientKey)
  bg.style.opacity = "1"
}

function getHeroSlides(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(".hero-slider .w-slide"))
}

function getActiveSlideIndex(slides: HTMLElement[]): number {
  const activeSlide = document.querySelector<HTMLElement>(".hero-slider .w-slide.is-active")
  if (!activeSlide) return 0
  const idx = slides.indexOf(activeSlide)
  return idx >= 0 ? idx : 0
}

export function initHeroEcoChrome(): void {
  const track = document.querySelector<HTMLElement>(".hero-track")
  const chrome = document.querySelector<HTMLElement>(".hero-eco-chrome")
  const headline = chrome?.querySelector<HTMLElement>("[data-hero-eco-headline]")
  const sub = chrome?.querySelector<HTMLElement>("[data-hero-eco-sub]")
  const productNameEl = chrome?.querySelector<HTMLElement>("[data-hero-product-name]")
  const cta = chrome?.querySelector<HTMLAnchorElement>("[data-hero-cta]")
  const dotsHost = chrome?.querySelector<HTMLElement>("[data-hero-eco-dots]")

  if (!track || !chrome) return

  HERO_PRODUCT_SLIDES.forEach((slide) => {
    const slideEl = document.getElementById(slide.id)
    if (!slideEl) return

    const container = slideEl.querySelector<HTMLElement>(".hero-slide--eco")
    if (!container) return

    applySlideBackground(slideEl, slide.gradientKey)

    const bottle = container.querySelector<HTMLImageElement>(".hero-slide__bottle")
    if (bottle) {
      bottle.src = `/images/bottles/${slide.bottleFile}`
      bottle.alt = slide.alt
    }

    const atmos = container.querySelector<HTMLPictureElement>(".hero-slide__atmosphere")
    const bgLayer = slideEl.querySelector<HTMLElement>(".hero-slide__bg")
    if (atmos) {
      const paths = atmosphereImagePaths(slide.slug)
      const source = atmos.querySelector<HTMLSourceElement>("source")
      const img = atmos.querySelector<HTMLImageElement>("img")
      const revealAtmosphere = (): void => {
        atmos.hidden = false
        if (bgLayer) bgLayer.style.opacity = "0"
      }
      if (source) source.srcset = paths.webp
      if (img) {
        img.src = paths.jpg
        img.addEventListener("load", revealAtmosphere, { once: true })
        img.addEventListener(
          "error",
          () => {
            atmos.hidden = true
            if (bgLayer) bgLayer.style.opacity = "1"
          },
          { once: true },
        )
        if (img.complete && img.naturalWidth > 0) revealAtmosphere()
      }
    }
  })

  const slides = getHeroSlides()

  if (dotsHost && dotsHost.childElementCount === 0) {
    slides.forEach((slide, i) => {
      const dot = document.createElement("button")
      dot.type = "button"
      dot.className = "hero-eco-chrome__dot"
      dot.setAttribute("aria-label", `Go to slide ${i + 1}`)
      dot.dataset.slideIndex = String(i)
      dot.setAttribute("role", "tab")
      dotsHost.appendChild(dot)
    })
  }

  const syncDots = (activeIdx: number): void => {
    dotsHost?.querySelectorAll<HTMLElement>(".hero-eco-chrome__dot").forEach((dot) => {
      const idx = Number(dot.dataset.slideIndex)
      const isActive = idx === activeIdx
      dot.classList.toggle("is-active", isActive)
      dot.setAttribute("aria-selected", isActive ? "true" : "false")
      dot.setAttribute("aria-current", isActive ? "true" : "false")
    })
  }

  const syncChrome = (slideId: string | undefined): void => {
    const isProduct = slideId ? isHeroProductSlideId(slideId) : false
    track.dataset.heroMode = isProduct ? "product" : "video"

    chrome.hidden = false
    chrome.setAttribute("aria-hidden", "false")

    headline?.classList.toggle("is-hidden", !isProduct)
    sub?.classList.toggle("is-hidden", !isProduct)
    productNameEl?.classList.toggle("is-hidden", !isProduct)
    cta?.classList.toggle("is-hidden", !isProduct)

    if (isProduct && slideId) {
      const meta = getHeroProductSlideById(slideId)
      if (meta) {
        if (productNameEl) productNameEl.textContent = meta.productName
        if (cta) cta.href = productHrefForSlug(meta.shopSlug)
      }
    }

    syncDots(getActiveSlideIndex(slides))
  }

  track.addEventListener("hero-slide-change", ((e: CustomEvent<{ slideId: string }>) => {
    syncChrome(e.detail.slideId)
  }) as EventListener)

  const active = document.querySelector<HTMLElement>(".hero-slider .w-slide.is-active")
  syncChrome(active?.id)

  dotsHost?.querySelectorAll<HTMLButtonElement>(".hero-eco-chrome__dot").forEach((dot) => {
    dot.addEventListener("click", () => {
      const idx = Number(dot.dataset.slideIndex)
      if (Number.isNaN(idx)) return
      track.dispatchEvent(
        new CustomEvent("hero-goto-slide", { detail: { index: idx }, bubbles: true }),
      )
    })
  })
}
