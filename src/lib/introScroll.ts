import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function initIntroScroll(): void {
  const section = document.getElementById("intro")
  const sticky = section?.querySelector<HTMLElement>(".intro-sticky")
  const content = section?.querySelector<HTMLElement>(".intro-content")
  const videoWrap = section?.querySelector<HTMLElement>(".background-video")

  if (!section || !sticky || !content) return

  if (prefersReducedMotion()) return

  const items = content.querySelectorAll<HTMLElement>(
    ".intro-subhead, .flex-block img, .intro-paragraph, .cta-links a",
  )

  gsap.set(items, { opacity: 0, y: 24 })

  ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: "+=150%",
    pin: sticky,
    scrub: 0.6,
    anticipatePin: 1,
  })

  gsap.to(items, {
    opacity: 1,
    y: 0,
    stagger: 0.08,
    ease: "power2.out",
    scrollTrigger: {
      trigger: section,
      start: "top 70%",
      end: "top 30%",
      scrub: true,
    },
  })

  if (videoWrap) {
    gsap.fromTo(
      videoWrap,
      { scale: 1.05, opacity: 0.85 },
      {
        scale: 1,
        opacity: 1,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      },
    )
  }
}
