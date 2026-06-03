import gsap from "gsap"

let controlsCtx: gsap.Context | null = null

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function initShopControls(root: HTMLElement | Document = document): void {
  const scope =
    root instanceof Document
      ? root.querySelector<HTMLElement>(".shop-layout-full .shop-controls")
      : root.querySelector<HTMLElement>(".shop-controls")

  if (!scope) return

  destroyShopControls()

  const buttons = scope.querySelectorAll<HTMLElement>(".shop-control")
  if (!buttons.length) return

  controlsCtx = gsap.context(() => {
    buttons.forEach((btn) => {
      const fill = btn.querySelector<HTMLElement>(".shop-control__fill")
      if (!fill) return

      gsap.set(fill, { xPercent: 100, yPercent: -100 })

      const onEnter = () => {
        if (prefersReducedMotion()) {
          gsap.set(fill, { xPercent: 0, yPercent: 0 })
          return
        }
        gsap.to(fill, {
          xPercent: 0,
          yPercent: 0,
          duration: 0.35,
          ease: "power2.out",
        })
        gsap.to(btn, { color: "#eef6fb", duration: 0.25 })
      }

      const onLeave = () => {
        gsap.to(fill, {
          xPercent: 100,
          yPercent: -100,
          duration: 0.35,
          ease: "power2.in",
        })
        gsap.to(btn, { color: "", duration: 0.25, clearProps: "color" })
      }

      const onDown = () => gsap.to(btn, { scale: 0.9, duration: 0.15 })
      const onUp = () => gsap.to(btn, { scale: 1, duration: 0.2, ease: "back.out(2)" })

      btn.addEventListener("mouseenter", onEnter)
      btn.addEventListener("mouseleave", onLeave)
      btn.addEventListener("mousedown", onDown)
      btn.addEventListener("mouseup", onUp)

      controlsCtx?.add(() => {
        btn.removeEventListener("mouseenter", onEnter)
        btn.removeEventListener("mouseleave", onLeave)
        btn.removeEventListener("mousedown", onDown)
        btn.removeEventListener("mouseup", onUp)
      })
    })
  }, scope)
}

export function destroyShopControls(): void {
  controlsCtx?.revert()
  controlsCtx = null
}
