import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { FEATURES_CHAPTERS } from "../data/featuresChapters"

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function initFeaturesTimeline(): void {
  const root = document.querySelector<HTMLElement>("[data-features-root]")
  if (!root) return

  const panelTitle = root.querySelector<HTMLElement>("[data-features-panel-title]")
  const panelBody = root.querySelector<HTMLElement>("[data-features-panel-body]")
  const cardHeading = root.querySelector<HTMLElement>("[data-features-card-heading]")
  const cardLeftLabel = root.querySelector<HTMLElement>("[data-features-card-left-label]")
  const cardLeftValue = root.querySelector<HTMLElement>("[data-features-card-left-value]")
  const cardRightLabel = root.querySelector<HTMLElement>("[data-features-card-right-label]")
  const cardRightValue = root.querySelector<HTMLElement>("[data-features-card-right-value]")
  const rail = root.querySelector<HTMLElement>("[data-features-rail]")
  const pin = root.querySelector<HTMLElement>("[data-features-pin]")

  const buttons = rail
    ? Array.from(rail.querySelectorAll<HTMLButtonElement>("[data-features-index]"))
    : []

  let active = 0

  const apply = (index: number): void => {
    const chapter = FEATURES_CHAPTERS[index]
    if (!chapter) return
    active = index
    if (panelTitle) panelTitle.textContent = chapter.title
    if (panelBody) {
      panelBody.replaceChildren(
        ...chapter.body.map((p) => {
          const el = document.createElement("p")
          el.textContent = p
          return el
        }),
      )
    }
    if (cardHeading) cardHeading.textContent = chapter.card.heading
    if (cardLeftLabel) cardLeftLabel.textContent = chapter.card.leftLabel
    if (cardLeftValue) cardLeftValue.textContent = chapter.card.leftValue
    if (cardRightLabel) cardRightLabel.textContent = chapter.card.rightLabel
    if (cardRightValue) cardRightValue.textContent = chapter.card.rightValue
    buttons.forEach((btn, i) => {
      btn.classList.toggle("is-active", i === index)
      btn.setAttribute("aria-current", i === index ? "true" : "false")
    })
  }

  apply(0)

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.featuresIndex)
      if (Number.isNaN(idx)) return
      apply(idx)
    })
  })

  if (prefersReducedMotion() || !pin) return

  ScrollTrigger.create({
    trigger: root,
    start: "top top",
    end: "+=800%",
    pin: pin,
    anticipatePin: 1,
  })

  ScrollTrigger.create({
    trigger: root,
    start: "top top",
    end: "+=800%",
    scrub: true,
    snap: {
      snapTo: 1 / (FEATURES_CHAPTERS.length - 1),
      duration: { min: 0.15, max: 0.35 },
    },
    onUpdate(self) {
      const idx = Math.round(self.progress * (FEATURES_CHAPTERS.length - 1))
      if (idx !== active) apply(idx)
    },
  })
}

export function destroyFeaturesTimeline(): void {
  ScrollTrigger.getAll().forEach((trigger) => {
    const el = trigger.trigger
    if (el instanceof Element && el.closest("[data-features-root]")) {
      trigger.kill()
    }
  })
}
