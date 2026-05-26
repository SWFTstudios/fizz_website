import barba from "@barba/core"
import barbaPrefetch from "@barba/prefetch"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import "../styles/z-scroll.css"
import {
  initLottieTransition,
  playLottieTransition,
  playPageLoadTransition,
} from "./lottieScroll"

let barbaInitialized = false

const HOME_TITLE = "fizz5"
const EXPLORE_TITLE = "Explore Fizz | fizz5"

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
  document.body.classList.remove("home-page")
  document.body.classList.add("z-scroll-page")
  document.documentElement.classList.add("z-scroll-page")
  document.title = EXPLORE_TITLE
}

export function restoreHomePageShell(): void {
  document.body.classList.remove("z-scroll-page", "modal-open", "cursor-hover")
  document.body.classList.add("home-page")
  document.documentElement.classList.remove("z-scroll-page")
  document.title = HOME_TITLE
}

export async function bootExplorePage(options: { skipLoader?: boolean } = {}): Promise<void> {
  if (!document.getElementById("zs-scene")) return

  applyExplorePageShell()

  const { destroyZScroll, runLoaderThenInit } = await import("./zScroll")
  destroyZScroll()
  runLoaderThenInit(options)
}

async function teardownExplorePage(): Promise<void> {
  const { destroyZScroll } = await import("./zScroll")
  destroyZScroll()
}

function bootCurrentPage(onHomeEnter: () => void): void {
  const namespace = getCurrentNamespace()
  if (namespace === "explore") {
    void bootExplorePage({ skipLoader: false })
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
          await playPageLoadTransition()
          window.scrollTo(0, 0)
          window.Webflow?.ready()
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
          void bootExplorePage({ skipLoader: true })
        },
        beforeLeave() {
          void teardownExplorePage()
        },
      },
    ],
  })

  bootCurrentPage(onHomeEnter)
}
