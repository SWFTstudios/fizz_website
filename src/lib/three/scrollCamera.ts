import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import type { PerspectiveCamera } from "three"

gsap.registerPlugin(ScrollTrigger)

/**
 * Optional v2: subtle camera drift on scroll (Eco Pulse dashboard feel).
 */
export function bindScrollCamera(
  camera: PerspectiveCamera,
  scrollTrack: HTMLElement | null,
): () => void {
  if (!scrollTrack) return () => undefined

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  if (reduced) return () => undefined

  const baseZ = camera.position.z
  const baseY = camera.position.y

  const st = ScrollTrigger.create({
    trigger: scrollTrack,
    start: "top top",
    end: "bottom bottom",
    scrub: 1.2,
    onUpdate: (self) => {
      const p = self.progress
      camera.position.z = baseZ - p * 1.2
      camera.position.y = baseY + p * 0.15
      camera.lookAt(0, 0.35, 0)
    },
  })

  return () => {
    st.kill()
    camera.position.z = baseZ
    camera.position.y = baseY
  }
}
