import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

/** Webflow scrubs the whole sticky video frame (not just the copy overlay). */
const SCALE_END = 0.76

export function initHeroScroll(): void {
  const track = document.querySelector<HTMLElement>(".hero-track")
  const videoWrapper = document.querySelector<HTMLElement>(".video-bg_wrapper")

  if (!track || !videoWrapper) return

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

  gsap.fromTo(
    videoWrapper,
    { scale: 1 },
    {
      scale: SCALE_END,
      ease: "none",
      scrollTrigger: {
        trigger: track,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
      },
    },
  )
}
