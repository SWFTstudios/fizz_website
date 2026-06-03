import { ScrollTrigger } from "gsap/ScrollTrigger"
import {
  destroyBottlesCollectionPage,
  initBottlesCollectionPage as setupBottlesCollection,
} from "./bottlesCollection"
import { destroyCategorySlider, initCategorySlider } from "./categoryCarousel"
import { destroyShopControls, initShopControls } from "./shopControls"
import { destroyShopCursor, initShopCursor } from "./shopCursor"
import { destroyShopMarquee, initShopMarquee } from "./shopMarquee"
import { destroyShopMenu, initShopMenu } from "./shopMenu"

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
        if (marqueeRoot) {
          initShopMarquee(panel)
        }

        ScrollTrigger.refresh()
        resolve()
      })
    })
  })
}

export function destroyShopPage(): void {
  teardownScrollLock?.()
  teardownScrollLock = null
  destroyShopMenu()
  destroyShopCursor()
  destroyShopControls()
  destroyCategorySlider()
  destroyBottlesCollectionPage()
  resetShopPanel()
  document.body.classList.remove("shop-menu-open", "shop-cursor-active", "shop-layout-full")
}

export function initShopCategoryPage(): void {
  teardownScrollLock?.()
  const isFullLayout = document.body.classList.contains("shop-layout-full")
  if (document.querySelector(".shop-splide[data-category-splide]") && !isFullLayout) {
    teardownScrollLock = lockVerticalScroll()
  }
  initCategorySlider()
  if (isFullLayout) {
    const main = document.querySelector<HTMLElement>("#main")
    if (main) initShopMenu(main)
    initShopCursor()
    initShopControls()
  }
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
  setupBottlesCollection()
}

export function bootShopPage(): void {
  if (document.body.classList.contains("shop-page") && document.querySelector(".shop-splide")) {
    initShopCategoryPage()
  }
  if (document.querySelector("[data-bottles-collection]")) {
    initBottlesCollectionPage()
  }
}
