import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import {
  goToHeroSlide,
  pauseHeroAutoRotate,
  resumeHeroAutoRotate,
} from "./heroHome"

const SCALE_END = 0.76
const SCROLL_COMPLETE_THRESHOLD = 0.55
const PRODUCT_SLIDE_INDEX = 2

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function killHomeScrollTriggers(): void {
  ScrollTrigger.getAll().forEach((trigger) => {
    const el = trigger.trigger
    if (!(el instanceof Element)) return
    if (
      el.closest(".hero-track") ||
      el.closest("#intro") ||
      el.closest(".sticky-track") ||
      el.closest("#home-z-scroll") ||
      el.closest("#feature-spotlight")
    ) {
      trigger.kill()
    }
  })
}

export function initHomeScrollStory(): void {
  const track = document.querySelector<HTMLElement>(".hero-track")
  const videoWrapper = document.querySelector<HTMLElement>(".video-bg_wrapper")
  const heroContent = document.getElementById("hero-content-container")
  const chrome = document.querySelector<HTMLElement>(".hero-eco-chrome")

  if (!track || !videoWrapper) return

  pauseHeroAutoRotate()

  if (prefersReducedMotion()) {
    track.setAttribute("data-hero-scroll-complete", "")
    track.dataset.heroPhase = "product"
    goToHeroSlide(PRODUCT_SLIDE_INDEX)
    gsap.set(videoWrapper, { scale: SCALE_END })
    if (heroContent) gsap.set(heroContent, { opacity: 0, pointerEvents: "none" })
    if (chrome) {
      chrome.hidden = false
      chrome.setAttribute("aria-hidden", "false")
    }
    resumeHeroAutoRotate()
    return
  }

  if (track.hasAttribute("data-hero-scroll-complete")) {
    resumeHeroAutoRotate()
    return
  }

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: track,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate(self) {
        const p = self.progress
        if (p >= SCROLL_COMPLETE_THRESHOLD && !track.hasAttribute("data-hero-scroll-complete")) {
          track.setAttribute("data-hero-scroll-complete", "")
          track.dataset.heroPhase = "product"
          resumeHeroAutoRotate()
        } else if (p < SCROLL_COMPLETE_THRESHOLD) {
          track.removeAttribute("data-hero-scroll-complete")
          track.dataset.heroPhase = p < 0.35 ? "video" : p < 0.5 ? "handoff" : "product"
          pauseHeroAutoRotate()
        }
      },
    },
  })

  tl.fromTo(
    videoWrapper,
    { scale: 1 },
    { scale: SCALE_END, ease: "none", duration: 0.35 },
    0,
  )

  if (heroContent) {
    tl.fromTo(heroContent, { opacity: 1 }, { opacity: 0, ease: "none", duration: 0.2 }, 0.25)
    tl.set(heroContent, { pointerEvents: "none" }, 0.45)
  }

  tl.call(
    () => {
      goToHeroSlide(1)
    },
    [],
    0.35,
  )

  tl.call(
    () => {
      goToHeroSlide(PRODUCT_SLIDE_INDEX)
    },
    [],
    0.45,
  )

  if (chrome) {
    tl.fromTo(chrome, { opacity: 0 }, { opacity: 1, ease: "none", duration: 0.15 }, 0.48)
    tl.call(
      () => {
        chrome.hidden = false
        chrome.setAttribute("aria-hidden", "false")
      },
      [],
      0.48,
    )
  }
}
