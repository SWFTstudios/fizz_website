import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { FEATURE_SPOTLIGHT_CHAPTERS } from "../data/featureSpotlight"

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function initFeatureSpotlight(): void {
  const section = document.getElementById("feature-spotlight")
  if (!section) return

  const pills = Array.from(
    section.querySelectorAll<HTMLButtonElement>("[data-spotlight-index]"),
  )
  const titleEl = section.querySelector<HTMLElement>("[data-spotlight-title]")
  const bodyEl = section.querySelector<HTMLElement>("[data-spotlight-body]")
  const kickerEl = section.querySelector<HTMLElement>("[data-spotlight-kicker]")
  const calloutTitle = section.querySelector<HTMLElement>("[data-spotlight-callout-title]")
  const calloutBody = section.querySelector<HTMLElement>("[data-spotlight-callout-body]")
  const callout = section.querySelector<HTMLElement>("[data-spotlight-callout]")
  const pin = section.querySelector<HTMLElement>(".feature-spotlight__pin")

  let active = 0

  const applyChapter = (index: number): void => {
    const chapter = FEATURE_SPOTLIGHT_CHAPTERS[index]
    if (!chapter) return
    active = index
    if (titleEl) titleEl.textContent = chapter.title
    if (bodyEl) bodyEl.textContent = chapter.body
    if (kickerEl) kickerEl.textContent = chapter.calloutKicker
    if (calloutTitle) calloutTitle.textContent = chapter.calloutTitle
    if (calloutBody) calloutBody.textContent = chapter.calloutBody
    pills.forEach((pill, i) => {
      const on = i === index
      pill.classList.toggle("is-active", on)
      pill.setAttribute("aria-selected", on ? "true" : "false")
    })
  }

  applyChapter(0)

  pills.forEach((pill) => {
    pill.addEventListener("click", () => {
      const idx = Number(pill.dataset.spotlightIndex)
      if (Number.isNaN(idx)) return
      applyChapter(idx)
      if (callout && !prefersReducedMotion()) {
        gsap.fromTo(callout, { opacity: 0.6, y: 8 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" })
      }
    })
  })

  if (prefersReducedMotion() || !pin) return

  ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: "+=80%",
    pin: pin,
    scrub: false,
    anticipatePin: 1,
  })

  ScrollTrigger.create({
    trigger: section,
    start: "top center",
    end: "bottom center",
    onUpdate(self) {
      const idx = Math.min(
        FEATURE_SPOTLIGHT_CHAPTERS.length - 1,
        Math.floor(self.progress * FEATURE_SPOTLIGHT_CHAPTERS.length),
      )
      if (idx !== active) applyChapter(idx)
    },
  })
}
