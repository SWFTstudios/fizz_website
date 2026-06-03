import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { ABOUT_PATH_CARDS } from "../data/aboutCards"

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function initAboutPathScroll(): void {
  const root = document.querySelector<HTMLElement>("[data-about-root]")
  const path = root?.querySelector<SVGPathElement>("[data-about-path]")
  const cards = root
    ? Array.from(root.querySelectorAll<HTMLElement>("[data-about-card]"))
    : []

  if (!root || !path || cards.length === 0) return

  const pathLength = path.getTotalLength()
  gsap.set(path, {
    strokeDasharray: pathLength,
    strokeDashoffset: pathLength,
  })

  if (prefersReducedMotion()) {
    gsap.set(path, { strokeDashoffset: 0 })
    cards.forEach((card, i) => {
      const data = ABOUT_PATH_CARDS[i]
      if (!data) return
      card.querySelector("[data-about-card-title]")!.textContent = data.title
      card.querySelector("[data-about-card-body]")!.textContent = data.body
    })
    return
  }

  cards.forEach((card, i) => {
    const data = ABOUT_PATH_CARDS[i]
    if (!data) return
    card.querySelector("[data-about-card-title]")!.textContent = data.title
    card.querySelector("[data-about-card-body]")!.textContent = data.body
    gsap.set(card, { opacity: 0.35, y: 24 })
  })

  ScrollTrigger.create({
    trigger: root,
    start: "top top",
    end: "+=200%",
    scrub: true,
    onUpdate(self) {
      gsap.set(path, { strokeDashoffset: pathLength * (1 - self.progress) })
      cards.forEach((card, i) => {
        const threshold = (i + 1) / (cards.length + 1)
        const on = self.progress >= threshold - 0.15
        gsap.to(card, {
          opacity: on ? 1 : 0.35,
          y: on ? 0 : 24,
          duration: 0.3,
          overwrite: true,
        })
      })
    },
  })
}

export function destroyAboutPathScroll(): void {
  ScrollTrigger.getAll().forEach((trigger) => {
    const el = trigger.trigger
    if (el instanceof Element && el.closest("[data-about-root]")) {
      trigger.kill()
    }
  })
}
