import "./styles/typography.css"
import "./styles/buttons.css"
import "./styles/global.css"
import "./styles/home-overrides.css"
import "./styles/hero-eco.css"
import "./styles/sticky-lottie.css"
import "./styles/feature-spotlight.css"
import "./styles/z-scroll.css"
import "./styles/home-z-scroll.css"
import "./styles/home-offerings.css"
import "./styles/features-page.css"
import "./styles/about-page.css"
import "./styles/shop.css"
import "./styles/shop-menu.css"
import "./styles/product-pdp.css"
import gsap from "gsap"
import { Flip } from "gsap/Flip"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { initFeatureSpotlight } from "./lib/featureSpotlight"
import { initHeroEcoChrome } from "./lib/heroEco"
import { initHeroSlider, initLogoMarquee, initNavToggle } from "./lib/heroHome"
import { initHomeScrollStory, killHomeScrollTriggers } from "./lib/homeScrollStory"
import { initIntroScroll } from "./lib/introScroll"
import { installClickDebug } from "./lib/clickDebug"
import { initHomeCategoryCarousel } from "./lib/categoryCarousel"
import { destroyZScroll, initHomeZScroll } from "./lib/zScroll"
import {
  destroyStickyLottieScrub,
  initStickyLottieScrub,
  registerLottieTransitionHook,
} from "./lib/lottieScroll"

installClickDebug()
registerLottieTransitionHook()

gsap.registerPlugin(ScrollTrigger, Flip)

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function scrollToShopPanel(): void {
  const el = document.getElementById("shop")
  if (!el) return
  el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" })
}

function goToShopMarquee(): void {
  void import("./lib/shop").then(({ openShopPanel }) => {
    void openShopPanel().then(() => {
      requestAnimationFrame(scrollToShopPanel)
    })
  })
}

function tryOpenShopDeepLink(): void {
  if (location.hash !== "#shop") return
  if (!document.getElementById("shop")) return
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

  const el = document.querySelector(hash)
  if (!el) return

  e.preventDefault()

  if (hash === "#shop") {
    goToShopMarquee()
    return
  }

  el.scrollIntoView({ behavior: "smooth", block: "start" })
})

function initHomePageModules(): void {
  if (!document.getElementById("hero--content")) return

  initNavToggle()
  initLogoMarquee()
  initHeroSlider()
  initHeroEcoChrome()
  initHomeScrollStory()
  initIntroScroll()
  initStickyLottieScrub()
  initHomeZScroll()
  initFeatureSpotlight()
  initHomeCategoryCarousel()
  ScrollTrigger.refresh()
  tryOpenShopDeepLink()
}

function refreshHomePage(): void {
  if (!document.getElementById("hero--content")) return

  killHomeScrollTriggers()
  destroyStickyLottieScrub()
  destroyZScroll()
  initHomePageModules()
}

function bootstrapHomeHero(): void {
  if (!document.getElementById("hero--content")) return
  initNavToggle()
  initLogoMarquee()
  initHeroSlider()
  initHeroEcoChrome()
  initHomeScrollStory()
}

bootstrapHomeHero()

if (document.getElementById("post-intro")) {
  document.body.classList.add("is-post-intro-unlocked")
}

function bootSecondaryHomeModules(): void {
  initIntroScroll()
  initStickyLottieScrub()
  initHomeZScroll()
  initFeatureSpotlight()
  initHomeCategoryCarousel()
  ScrollTrigger.refresh()
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("hero--content")) bootSecondaryHomeModules()
  }, { once: true })
} else if (document.getElementById("hero--content")) {
  bootSecondaryHomeModules()
}

void import("./lib/exploreTransition").then(({ initExploreTransition }) => {
  initExploreTransition(refreshHomePage)
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
