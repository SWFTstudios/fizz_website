import "./styles/typography.css"
import "./styles/buttons.css"
import "./styles/global.css"
import "./styles/home-overrides.css"
import "./styles/shop.css"
import gsap from "gsap"
import { Flip } from "gsap/Flip"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { initHeroSlider, initLogoMarquee, initNavToggle } from "./lib/heroHome"
import { initHeroScroll } from "./lib/heroScroll"
import { installClickDebug } from "./lib/clickDebug"
import { initExploreTransition } from "./lib/exploreTransition"
import { isPostIntroUnlocked, unlockPostIntro } from "./lib/lottieScroll"

installClickDebug()

gsap.registerPlugin(ScrollTrigger, Flip)

const GATED_HASHES = new Set(["#shop"])

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function isSamePageHash(href: string | null): boolean {
  if (!href) return false
  return href.startsWith("#")
}

function scrollToShopPanel(): void {
  const el = document.getElementById("shop")
  if (!el) return
  el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" })
}

function goToShopMarquee(): void {
  unlockPostIntro()
  void import("./lib/shop").then(({ openShopPanel }) => {
    void openShopPanel().then(() => {
      requestAnimationFrame(scrollToShopPanel)
    })
  })
}

function tryOpenShopDeepLink(): void {
  if (location.hash !== "#shop") return
  if (!document.getElementById("shop")) return
  if (!isPostIntroUnlocked()) return

  goToShopMarquee()
}

document.documentElement.classList.add("js")

document.addEventListener("click", (e) => {
  const target = e.target as Element | null
  const link = target?.closest?.('a[href^="#"]') as HTMLAnchorElement | null
  if (!link) return

  const shopCta = target?.closest?.('a.cta-link[href="#shop"]')
  if (shopCta) return

  const hash = link.getAttribute("href")
  if (!hash || hash === "#") return

  if (GATED_HASHES.has(hash) && !isPostIntroUnlocked()) {
    e.preventDefault()
    return
  }

  const el = document.querySelector(hash)
  if (!el) return

  e.preventDefault()

  if (hash === "#shop") {
    goToShopMarquee()
    return
  }

  el.scrollIntoView({ behavior: "smooth", block: "start" })
})

function refreshHomePage(): void {
  if (!document.getElementById("hero--content")) return

  ScrollTrigger.getAll().forEach((trigger) => {
    const el = trigger.trigger
    if (el instanceof Element && el.closest(".hero-track, .sticky-track")) {
      trigger.kill()
    }
  })

  initNavToggle()
  initLogoMarquee()
  initHeroSlider()
  initHeroScroll()
  ScrollTrigger.refresh()
  tryOpenShopDeepLink()
}

initExploreTransition(refreshHomePage)

function runCtaTransition(href: string | null): void {
  const afterUnlock = (): void => {
    unlockPostIntro()
    if (!href) return

    requestAnimationFrame(() => {
      const el = document.querySelector(href)
      el?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  if (prefersReducedMotion()) {
    afterUnlock()
    return
  }

  window.__fizzTransition?.(afterUnlock)
}

document.querySelectorAll<HTMLAnchorElement>("a.cta-link[data-transition]").forEach((link) => {
  link.addEventListener("click", (e) => {
    const href = link.getAttribute("href")
    if (!isSamePageHash(href)) return

    e.preventDefault()
    e.stopPropagation()
    runCtaTransition(href)
  })
})

const shopCta = document.querySelector<HTMLAnchorElement>('a.cta-link[href="#shop"]')
shopCta?.addEventListener("click", (e) => {
  e.preventDefault()
  e.stopPropagation()
  goToShopMarquee()
})

if (document.getElementById("hero--content")) {
  tryOpenShopDeepLink()
}
