import type { AnimationItem } from "lottie-web"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { initHomeCategoryCarousel } from "./categoryCarousel"

const LOTTIE_PATH = "/lottie/fizz-lottie-transition.json"

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

let lottieModulePromise: Promise<{
  loadAnimation: (params: object) => AnimationItem
}> | null = null
let animationDataPromise: Promise<object> | null = null

async function getLottie(): Promise<{
  loadAnimation: (params: object) => AnimationItem
}> {
  lottieModulePromise ??= import("lottie-web").then((mod) => {
    const player = mod.default as unknown as {
      loadAnimation: (params: object) => AnimationItem
    }
    return player
  })
  return lottieModulePromise
}

async function getAnimationData(): Promise<object> {
  animationDataPromise ??= fetch(LOTTIE_PATH).then((res) => {
    if (!res.ok) throw new Error(`Lottie fetch failed: ${res.status}`)
    return res.json() as Promise<object>
  })
  return animationDataPromise
}

export function isPostIntroUnlocked(): boolean {
  return document.body.classList.contains("is-post-intro-unlocked")
}

/** Reveal Onyx-style sections (and shop marquee) after Explore / Shop CTA. */
export function unlockPostIntro(): void {
  if (isPostIntroUnlocked()) {
    initHomeCategoryCarousel()
    ScrollTrigger.refresh()
    return
  }

  const postIntro = document.getElementById("post-intro")
  if (!postIntro) return

  postIntro.removeAttribute("hidden")
  postIntro.classList.remove("is-gated")
  document.body.classList.add("is-post-intro-unlocked")

  initHomeCategoryCarousel()
  ScrollTrigger.refresh()
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

async function ensureTransitionAnim(): Promise<AnimationItem | null> {
  if (transitionAnim) return transitionAnim
  if (prefersReducedMotion()) return null

  const elements = getOverlayElements()
  if (!elements) return null

  const { canvas } = elements
  const [lottie, animationData] = await Promise.all([getLottie(), getAnimationData()])

  transitionAnim = lottie.loadAnimation({
    container: canvas,
    renderer: "svg",
    loop: false,
    autoplay: false,
    animationData,
    ...FULL_VIEWPORT_LOTTIE,
  })

  const finishReady = (): void => {
    if (transitionAnim) bindLottieResize(transitionAnim, canvas)
    transitionReady = true
    transitionReadyCallbacks.splice(0).forEach((cb) => cb())
  }

  const anim = transitionAnim

  return new Promise((resolve) => {
    if (anim.isLoaded) {
      finishReady()
      resolve(anim)
      return
    }
    anim.addEventListener("DOMLoaded", () => {
      finishReady()
      resolve(anim)
    })
  })
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
export async function playLottieTransition(): Promise<void> {
  if (prefersReducedMotion()) return Promise.resolve()

  const elements = getOverlayElements()
  if (!elements) return Promise.resolve()

  const { overlay } = elements
  await ensureTransitionAnim()

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

/** Registers CTA transition hook; Lottie loads on first use. */
let stickyAnim: AnimationItem | null = null
let stickyScrollTrigger: ScrollTrigger | null = null
let stickyObserver: IntersectionObserver | null = null

export function destroyStickyLottieScrub(): void {
  stickyScrollTrigger?.kill()
  stickyScrollTrigger = null
  stickyObserver?.disconnect()
  stickyObserver = null
  stickyAnim?.destroy()
  stickyAnim = null
}

export function initStickyLottieScrub(): void {
  const track = document.querySelector<HTMLElement>(".sticky-track")
  const host = document.querySelector<HTMLElement>("[data-sticky-lottie]")
  if (!track || !host) return

  if (prefersReducedMotion()) {
    track.style.height = "auto"
    track.classList.add("is-reduced-motion")
    return
  }

  const mount = (): void => {
    if (stickyAnim) return
    void ensureStickyAnim(host, track)
  }

  stickyObserver?.disconnect()
  stickyObserver = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) mount()
    },
    { rootMargin: "200px 0px" },
  )
  stickyObserver.observe(track)
}

async function ensureStickyAnim(
  host: HTMLElement,
  track: HTMLElement,
): Promise<void> {
  const [lottie, animationData] = await Promise.all([getLottie(), getAnimationData()])

  stickyAnim = lottie.loadAnimation({
    container: host,
    renderer: "svg",
    loop: false,
    autoplay: false,
    animationData,
    ...FULL_VIEWPORT_LOTTIE,
  })

  await new Promise<void>((resolve) => {
    if (stickyAnim!.isLoaded) {
      resolve()
      return
    }
    stickyAnim!.addEventListener("DOMLoaded", () => resolve(), { once: true })
  })

  bindLottieResize(stickyAnim, host)

  const totalFrames = Math.max(1, stickyAnim.totalFrames - 1)

  stickyScrollTrigger = ScrollTrigger.create({
    trigger: track,
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    onUpdate(self) {
      const frame = Math.round(self.progress * totalFrames)
      stickyAnim?.goToAndStop(frame, true)
    },
  })

  track.classList.add("is-lottie-ready")
}

export function registerLottieTransitionHook(): void {
  if (window.__fizzTransition) return

  window.__fizzTransition = (onComplete?: () => void): void => {
    if (prefersReducedMotion()) {
      onComplete?.()
      return
    }

    const elements = getOverlayElements()
    if (!elements) {
      onComplete?.()
      return
    }

    const { overlay } = elements

    void ensureTransitionAnim().then(() => {
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
    })
  }
}
