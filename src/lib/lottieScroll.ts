import lottie, { type AnimationItem } from "lottie-web"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

gsap.registerPlugin(ScrollTrigger)

let scrollLottieInitialized = false

export function isPostIntroUnlocked(): boolean {
  return document.body.classList.contains("is-post-intro-unlocked")
}

/** Reveal sticky-track and lower sections; lazy-load scroll-scrub Lottie. */
export function unlockPostIntro(): void {
  if (isPostIntroUnlocked()) {
    ScrollTrigger.refresh()
    return
  }

  const postIntro = document.getElementById("post-intro")
  if (!postIntro) return

  postIntro.removeAttribute("hidden")
  postIntro.classList.remove("is-gated")
  document.body.classList.add("is-post-intro-unlocked")

  if (!scrollLottieInitialized) {
    initLottieScroll()
    scrollLottieInitialized = true
  }

  ScrollTrigger.refresh()
}

export function initLottieScroll(): void {
  const track = document.querySelector<HTMLElement>(".sticky-track")
  const container = document.querySelector<HTMLElement>("[data-lottie-scroll]")
  if (!track || !container) return

  if (prefersReducedMotion()) {
    container.setAttribute("aria-hidden", "true")
    return
  }

  let anim: AnimationItem | null = null

  anim = lottie.loadAnimation({
    container,
    renderer: "svg",
    loop: false,
    autoplay: false,
    path: "/lottie/fizz-lottie-transition.json",
  })

  anim.addEventListener("DOMLoaded", () => {
    const totalFrames = anim?.totalFrames ?? 0
    if (totalFrames <= 0 || !anim) return

    ScrollTrigger.create({
      trigger: track,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        const frame = Math.round(self.progress * (totalFrames - 1))
        anim?.goToAndStop(frame, true)
      },
    })

    ScrollTrigger.refresh()
  })
}

declare global {
  interface Window {
    __fizzTransition?: (onComplete?: () => void) => void
  }
}

let transitionAnim: AnimationItem | null = null
let transitionReady = false
const transitionReadyCallbacks: Array<() => void> = []

export function initLottieTransition(): void {
  const overlay = document.getElementById("lottie-overlay")
  const canvas = document.getElementById("lottie-overlay-canvas")
  if (!overlay || !canvas) return

  if (transitionAnim) return

  transitionAnim = lottie.loadAnimation({
    container: canvas,
    renderer: "svg",
    loop: false,
    autoplay: false,
    path: "/lottie/fizz-lottie-transition.json",
  })

  transitionAnim.addEventListener("DOMLoaded", () => {
    transitionReady = true
    transitionReadyCallbacks.splice(0).forEach((cb) => cb())
  })

  // Primary “through the bottle” moment on Explore/Shop CTA.
  window.__fizzTransition = (onComplete?: () => void): void => {
    overlay.classList.add("is-active")
    overlay.setAttribute("aria-hidden", "false")

    const start = (): void => {
      if (!transitionAnim) return
      transitionAnim.goToAndStop(0, true)
      transitionAnim.play()

      const done = (): void => {
        transitionAnim?.removeEventListener("complete", done)
        onComplete?.()
        overlay.classList.remove("is-active")
        overlay.setAttribute("aria-hidden", "true")
        transitionAnim?.stop()
      }

      transitionAnim.addEventListener("complete", done)
    }

    if (transitionReady) start()
    else transitionReadyCallbacks.push(start)
  }
}
