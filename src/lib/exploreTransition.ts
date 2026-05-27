import barba from "@barba/core"
import barbaPrefetch from "@barba/prefetch"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import "../styles/z-scroll.css"
import { clickDebugLog } from "./clickDebug"
import {
  dismissLottieOverlay,
  initLottieTransition,
  playLottieTransition,
  playPageLoadTransition,
} from "./lottieScroll"

let barbaInitialized = false

const HOME_TITLE = "fizz5"
const EXPLORE_TITLE = "Explore Fizz | fizz5"
const SHOP_TITLE = "Shop Fizz | fizz5"

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function getCurrentNamespace(): string | null {
  return (
    document.querySelector<HTMLElement>('[data-barba="container"]')?.dataset.barbaNamespace ??
    null
  )
}

function shouldPreventBarba(el: HTMLElement | undefined, href: string | undefined): boolean {
  if (!href) return true
  if (href.startsWith("#")) return true
  if (href.startsWith("mailto:") || href.startsWith("tel:")) return true

  try {
    const url = new URL(href, window.location.href)
    if (url.origin !== window.location.origin) return true
  } catch {
    return true
  }

  if (el?.closest("[data-barba-prevent]")) return true
  if (el?.closest('a.cta-link[data-transition][href^="#"]')) return true

  return false
}

export function applyExplorePageShell(): void {
  document.body.classList.remove("home-page", "shop-page")
  document.body.classList.add("z-scroll-page")
  document.documentElement.classList.add("z-scroll-page")
  document.title = EXPLORE_TITLE
}

export function restoreHomePageShell(): void {
  document.body.classList.remove("z-scroll-page", "shop-page", "modal-open", "cursor-hover")
  document.body.classList.add("home-page")
  document.documentElement.classList.remove("z-scroll-page")
  document.title = HOME_TITLE
}

export function applyShopPageShell(): void {
  document.body.classList.remove("home-page", "z-scroll-page", "modal-open", "cursor-hover")
  document.body.classList.add("shop-page")
  document.documentElement.classList.remove("z-scroll-page")
  document.title = SHOP_TITLE
}

export async function bootExplorePage(): Promise<void> {
  if (!document.getElementById("zs-scene")) return

  const lottieOverlay = document.getElementById("lottie-overlay")
  clickDebugLog("bootExplorePage", {
    lottieOverlayClasses: lottieOverlay?.className ?? null,
  })
  void dismissLottieOverlay()
  applyExplorePageShell()

  const { destroyZScroll, runLoaderThenInit } = await import("./zScroll")
  destroyZScroll()
  runLoaderThenInit()
}

async function teardownExplorePage(): Promise<void> {
  const { destroyZScroll } = await import("./zScroll")
  destroyZScroll()
}

function bootCurrentPage(onHomeEnter: () => void): void {
  const namespace = getCurrentNamespace()
  if (namespace === "explore") {
    void bootExplorePage()
    return
  }

  if (namespace === "shop") {
    applyShopPageShell()
    return
  }

  if (namespace === "home") {
    restoreHomePageShell()
    onHomeEnter()
  }
}

function killHomeScrollTriggers(): void {
  ScrollTrigger.getAll().forEach((trigger) => {
    const el = trigger.trigger
    if (el instanceof Element && el.closest(".hero-track, .sticky-track")) {
      trigger.kill()
    }
  })
}

export function initExploreTransition(onHomeEnter: () => void): void {
  initLottieTransition()

  if (barbaInitialized) return
  barbaInitialized = true

  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual"
  }

  barba.use(barbaPrefetch)

  barba.init({
    preventRunning: true,
    prefetchIgnore: false,
    prevent: ({ el, href }: { el?: HTMLElement; href?: string }) => shouldPreventBarba(el, href),
    transitions: [
      {
        name: "lottie-page",
        async leave() {
          if (prefersReducedMotion()) return
          await playLottieTransition()
        },
        async enter() {
          clickDebugLog("barba:enter")
          await playPageLoadTransition()
          window.scrollTo(0, 0)
          window.Webflow?.ready()
          clickDebugLog("barba:enter:done")
        },
      },
    ],
    views: [
      {
        namespace: "home",
        beforeLeave() {
          killHomeScrollTriggers()
        },
        beforeEnter() {
          restoreHomePageShell()
        },
        afterEnter() {
          onHomeEnter()
        },
      },
      {
        namespace: "explore",
        beforeEnter() {
          applyExplorePageShell()
        },
        afterEnter() {
          void bootExplorePage()
        },
        beforeLeave() {
          void teardownExplorePage()
        },
      },
      {
        namespace: "shop",
        beforeEnter() {
          applyShopPageShell()
        },
        beforeLeave() {
          document.body.classList.remove("shop-page")
        },
      },
    ],
  })

  bootCurrentPage(onHomeEnter)
}
