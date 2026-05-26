import lottie, { type AnimationItem } from "lottie-web"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

const FULL_VIEWPORT_LOTTIE = {
  rendererSettings: {
    preserveAspectRatio: "xMidYMid slice",
  },
} as const

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function bindLottieResize(anim: AnimationItem, container: HTMLElement): void {
  const resize = (): void => {
    anim.resize(container.clientWidth, container.clientHeight)
  }

  resize()
  window.addEventListener("resize", resize, { passive: true })
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
    ...FULL_VIEWPORT_LOTTIE,
  })

  anim.addEventListener("DOMLoaded", () => {
    const totalFrames = anim?.totalFrames ?? 0
    if (totalFrames <= 0 || !anim) return

    bindLottieResize(anim, container)

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
    Webflow?: { ready: () => void }
  }
}

let transitionAnim: AnimationItem | null = null
let transitionReady = false
const transitionReadyCallbacks: Array<() => void> = []

function getOverlayElements(): {
  overlay: HTMLElement
  canvas: HTMLElement
} | null {
  const overlay = document.getElementById("lottie-overlay")
  const canvas = document.getElementById("lottie-overlay-canvas")
  if (!overlay || !canvas) return null
  return { overlay, canvas }
}

function whenTransitionReady(run: () => void): void {
  if (transitionReady) run()
  else transitionReadyCallbacks.push(run)
}

const OVERLAY_FADE_MS = 450

function showLottieOverlay(overlay: HTMLElement): void {
  overlay.classList.remove("is-fading", "is-waiting")
  overlay.classList.add("is-active")
  overlay.setAttribute("aria-hidden", "false")
}

/** Fade out overlay and fully dismiss so it cannot block clicks. */
export function dismissLottieOverlay(): Promise<void> {
  const elements = getOverlayElements()
  if (!elements) return Promise.resolve()

  const { overlay } = elements

  if (prefersReducedMotion() || !overlay.classList.contains("is-active")) {
    overlay.classList.remove("is-active", "is-fading", "is-waiting")
    overlay.setAttribute("aria-hidden", "true")
    transitionAnim?.stop()
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    let settled = false

    const finish = (): void => {
      if (settled) return
      settled = true
      overlay.classList.remove("is-active", "is-fading", "is-waiting")
      overlay.setAttribute("aria-hidden", "true")
      transitionAnim?.stop()
      transitionAnim?.goToAndStop(0, true)
      resolve()
    }

    overlay.classList.remove("is-waiting")
    overlay.classList.add("is-fading")
    overlay.classList.remove("is-active")

    const onTransitionEnd = (event: TransitionEvent): void => {
      if (event.target !== overlay || event.propertyName !== "opacity") return
      overlay.removeEventListener("transitionend", onTransitionEnd)
      finish()
    }

    overlay.addEventListener("transitionend", onTransitionEnd)
    window.setTimeout(() => {
      overlay.removeEventListener("transitionend", onTransitionEnd)
      finish()
    }, OVERLAY_FADE_MS + 50)
  })
}

/** Barba leave: play forward and resolve when the Lottie animation completes. */
export function playLottieTransition(): Promise<void> {
  if (prefersReducedMotion()) return Promise.resolve()

  const elements = getOverlayElements()
  if (!elements) return Promise.resolve()

  const { overlay } = elements

  return new Promise((resolve) => {
    whenTransitionReady(() => {
      if (!transitionAnim) {
        resolve()
        return
      }

      const canvas = document.getElementById("lottie-overlay-canvas")
      if (canvas) transitionAnim.resize(canvas.clientWidth, canvas.clientHeight)

      showLottieOverlay(overlay)
      transitionAnim.goToAndStop(0, true)

      const done = (): void => {
        transitionAnim?.removeEventListener("complete", done)
        overlay.classList.add("is-waiting")
        resolve()
      }

      transitionAnim.addEventListener("complete", done)
      transitionAnim.play()
    })
  })
}

/** Barba enter: fade out overlay after new page content is mounted. */
export function playPageLoadTransition(): Promise<void> {
  return dismissLottieOverlay()
}

export function initLottieTransition(): void {
  const elements = getOverlayElements()
  if (!elements) return

  const { overlay, canvas } = elements

  if (transitionAnim) return

  transitionAnim = lottie.loadAnimation({
    container: canvas,
    renderer: "svg",
    loop: false,
    autoplay: false,
    path: "/lottie/fizz-lottie-transition.json",
    ...FULL_VIEWPORT_LOTTIE,
  })

  transitionAnim.addEventListener("DOMLoaded", () => {
    if (transitionAnim) bindLottieResize(transitionAnim, canvas)
    transitionReady = true
    transitionReadyCallbacks.splice(0).forEach((cb) => cb())
  })

  window.__fizzTransition = (onComplete?: () => void): void => {
    whenTransitionReady(() => {
      if (!transitionAnim) {
        onComplete?.()
        return
      }

      showLottieOverlay(overlay)

      const canvas = document.getElementById("lottie-overlay-canvas")
      if (canvas) transitionAnim.resize(canvas.clientWidth, canvas.clientHeight)
      transitionAnim.goToAndStop(0, true)
      transitionAnim.play()

      const done = (): void => {
        transitionAnim?.removeEventListener("complete", done)
        void dismissLottieOverlay().then(() => onComplete?.())
      }

      transitionAnim.addEventListener("complete", done)
    })
  }
}
