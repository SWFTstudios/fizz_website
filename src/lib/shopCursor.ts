import gsap from "gsap"

let cursorCtx: gsap.Context | null = null
let moveHandler: ((e: MouseEvent) => void) | null = null
let dot2X = 0
let dot2Y = 0

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function isTouchDevice(): boolean {
  return window.matchMedia("(max-width: 991px), (hover: none)").matches
}

export function initShopCursor(): void {
  if (!document.body.classList.contains("shop-layout-full")) return
  if (prefersReducedMotion() || isTouchDevice()) return

  destroyShopCursor()

  const cursor = document.querySelector<HTMLElement>(".shop-cursor")
  const dot1 = document.querySelector<HTMLElement>(".shop-cursor__dot1")
  const dot2 = document.querySelector<HTMLElement>(".shop-cursor__dot2")
  const text = document.querySelector<HTMLElement>(".shop-cursor__text")
  const trigger = document.querySelector<HTMLElement>(".shop-trigger")
  const splideList = document.querySelector<HTMLElement>(".shop-splide .splide__list")
  const controls = document.querySelectorAll<HTMLElement>(".shop-control")

  if (!cursor || !dot1 || !dot2) return

  document.body.classList.add("shop-cursor-active")

  const setDot1X = gsap.quickSetter(dot1, "left", "px")
  const setDot1Y = gsap.quickSetter(dot1, "top", "px")
  const setDot2X = gsap.quickSetter(dot2, "left", "px")
  const setDot2Y = gsap.quickSetter(dot2, "top", "px")

  moveHandler = (e: MouseEvent) => {
    const x = e.clientX
    const y = e.clientY
    setDot1X(x)
    setDot1Y(y)
    dot2X += (x - dot2X) * 0.18
    dot2Y += (y - dot2Y) * 0.18
    setDot2X(dot2X)
    setDot2Y(dot2Y)
  }

  window.addEventListener("mousemove", moveHandler)

  const enlarge = () => {
    dot1.classList.add("is--larger")
    dot2.classList.add("is--larger")
  }
  const shrink = () => {
    dot1.classList.remove("is--larger", "opacity-0")
    dot2.classList.remove("is--larger", "light-ring")
  }

  splideList?.addEventListener("mouseenter", enlarge)
  splideList?.addEventListener("mouseleave", shrink)

  const onTriggerEnter = () => {
    if (text) text.textContent = "OPEN"
  }
  const onTriggerLeave = () => {
    if (text) text.textContent = "DRAG"
  }
  trigger?.addEventListener("mouseenter", onTriggerEnter)
  trigger?.addEventListener("mouseleave", onTriggerLeave)

  const controlHandlers: Array<{
    el: HTMLElement
    enter: () => void
    leave: () => void
  }> = []

  controls.forEach((control) => {
    const enter = () => {
      dot1.classList.add("opacity-0")
      dot2.classList.add("light-ring")
    }
    const leave = () => {
      dot1.classList.remove("opacity-0")
      dot2.classList.remove("light-ring")
    }
    control.addEventListener("mouseenter", enter)
    control.addEventListener("mouseleave", leave)
    controlHandlers.push({ el: control, enter, leave })
  })

  cursorCtx = gsap.context(() => {
    gsap.set(cursor, { opacity: 0 })
    gsap.to(cursor, { opacity: 1, duration: 0.2, delay: 0.1 })
  })

  const cleanup = () => {
    if (moveHandler) window.removeEventListener("mousemove", moveHandler)
    splideList?.removeEventListener("mouseenter", enlarge)
    splideList?.removeEventListener("mouseleave", shrink)
    trigger?.removeEventListener("mouseenter", onTriggerEnter)
    trigger?.removeEventListener("mouseleave", onTriggerLeave)
    controlHandlers.forEach(({ el, enter, leave }) => {
      el.removeEventListener("mouseenter", enter)
      el.removeEventListener("mouseleave", leave)
    })
  }

  cursorCtx.add(cleanup)
}

export function destroyShopCursor(): void {
  cursorCtx?.revert()
  cursorCtx = null
  moveHandler = null
  document.body.classList.remove("shop-cursor-active")
}
