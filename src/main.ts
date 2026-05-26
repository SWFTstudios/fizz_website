import "./styles/global.css"
import "./styles/home-overrides.css"
import { initHeroSlider, initLogoMarquee, initNavToggle } from "./lib/heroHome"
import { initHeroScroll } from "./lib/heroScroll"
import {
  initLottieTransition,
  isPostIntroUnlocked,
  unlockPostIntro,
} from "./lib/lottieScroll"

const GATED_HASHES = new Set(["#explore", "#shop-stub"])

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

document.documentElement.classList.add("js")

document.addEventListener("click", (e) => {
  const target = e.target as Element | null
  const link = target?.closest?.('a[href^="#"]') as HTMLAnchorElement | null
  if (!link) return

  const ctaTransitionLink = target?.closest?.("a.cta-link[data-transition]")
  if (ctaTransitionLink) return

  const hash = link.getAttribute("href")
  if (!hash || hash === "#") return

  if (GATED_HASHES.has(hash) && !isPostIntroUnlocked()) {
    e.preventDefault()
    return
  }

  const el = document.querySelector(hash)
  if (!el) return

  e.preventDefault()
  el.scrollIntoView({ behavior: "smooth", block: "start" })
})

initNavToggle()
initLogoMarquee()
initHeroSlider()
initHeroScroll()
initLottieTransition()

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
    e.preventDefault()
    e.stopPropagation()
    runCtaTransition(link.getAttribute("href"))
  })
})
