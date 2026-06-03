import gsap from "gsap"
import type { AnimationItem } from "lottie-web"

const MENU_WAVE_PATH = "/lottie/menu-wave.json"

let menuCtx: gsap.Context | null = null
let menuAnim: AnimationItem | null = null
let isOpen = false
let reducedMotion = false

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

async function getLottie(): Promise<{
  loadAnimation: (params: object) => AnimationItem
}> {
  const mod = await import("lottie-web")
  return mod.default as { loadAnimation: (params: object) => AnimationItem }
}

async function ensureMenuLottie(host: HTMLElement): Promise<AnimationItem | null> {
  if (menuAnim) return menuAnim
  if (reducedMotion) return null

  const res = await fetch(MENU_WAVE_PATH)
  if (!res.ok) return null
  const animationData = await res.json()
  const lottie = await getLottie()

  menuAnim = lottie.loadAnimation({
    container: host,
    renderer: "svg",
    loop: false,
    autoplay: false,
    animationData,
  })
  return menuAnim
}

function getElements(root: HTMLElement) {
  return {
    menu: root.querySelector<HTMLElement>(".shop-menu"),
    trigger: root.querySelector<HTMLButtonElement>(".shop-trigger"),
    triggerCircle: root.querySelector<HTMLElement>(".shop-trigger__circle"),
    line1: root.querySelector<HTMLElement>(".shop-trigger__line--1"),
    line2: root.querySelector<HTMLElement>(".shop-trigger__line--2"),
    menuContainer: root.querySelector<HTMLElement>(".shop-menu__container"),
    lottieHost: root.querySelector<HTMLElement>(".shop-menu__lottie"),
    linkContains: root.querySelectorAll<HTMLElement>(
      ".shop-nav-link__contain, .shop-sublink__contain",
    ),
  }
}

function lockBodyScroll(lock: boolean): void {
  document.body.classList.toggle("shop-menu-open", lock)
}

export function initShopMenu(root: HTMLElement | Document = document): void {
  if (!document.body.classList.contains("shop-layout-full")) return

  const main = root instanceof Document ? root.querySelector<HTMLElement>("#main") : root
  if (!main) return

  destroyShopMenu()

  reducedMotion = prefersReducedMotion()
  const el = getElements(main)
  if (!el.menu || !el.trigger) return

  menuCtx = gsap.context(() => {
    gsap.set(el.menu, { display: "none", visibility: "hidden" })
    gsap.set(el.menuContainer, { opacity: 0 })
    gsap.set(el.linkContains, { opacity: 0, y: reducedMotion ? 0 : 80 })
    if (el.triggerCircle) gsap.set(el.triggerCircle, { scale: 1, rotation: 0 })
    if (el.line1) gsap.set(el.line1, { rotation: 0, y: 0 })
    if (el.line2) gsap.set(el.line2, { rotation: 0, y: 0 })
  }, main)

  const openMenu = async () => {
    if (isOpen) return
    isOpen = true
    el.menu!.removeAttribute("hidden")
    el.trigger!.setAttribute("aria-expanded", "true")
    el.trigger!.setAttribute("aria-label", "Close menu")
    lockBodyScroll(true)
    document.querySelector(".shop-cursor")?.classList.add("shop-cursor--hidden")

    if (reducedMotion) {
      el.menu!.style.display = "block"
      el.menu!.style.visibility = "visible"
      el.menuContainer!.style.opacity = "1"
      el.linkContains.forEach((node) => {
        node.style.opacity = "1"
        node.style.transform = "none"
      })
      return
    }

    const anim = el.lottieHost ? await ensureMenuLottie(el.lottieHost) : null

    const tl = gsap.timeline()
    tl.set(el.menu, { display: "block", visibility: "visible" })
      .to(el.menuContainer, { opacity: 1, duration: 0.35, ease: "power2.out" }, 0)
      .to(
        el.linkContains,
        {
          opacity: 1,
          y: 0,
          duration: 1.1,
          stagger: 0.12,
          ease: "expo.out",
        },
        0.2,
      )

    if (el.triggerCircle) {
      tl.to(el.triggerCircle, { scale: 0.85, duration: 0.4, ease: "power2.inOut" }, 0)
    }
    if (el.line1 && el.line2) {
      tl.to(el.line1, { rotation: 45, y: 6, duration: 0.35, ease: "power2.inOut" }, 0.05)
      tl.to(el.line2, { rotation: -45, y: -6, duration: 0.35, ease: "power2.inOut" }, 0.05)
    }

    if (anim) {
      anim.goToAndPlay(0, true)
    }
  }

  const closeMenu = () => {
    if (!isOpen) return
    isOpen = false
    el.trigger!.setAttribute("aria-expanded", "false")
    el.trigger!.setAttribute("aria-label", "Open menu")
    lockBodyScroll(false)
    document.querySelector(".shop-cursor")?.classList.remove("shop-cursor--hidden")

    if (reducedMotion) {
      el.menu!.setAttribute("hidden", "")
      el.menu!.style.display = "none"
      el.menu!.style.visibility = "hidden"
      return
    }

    const tl = gsap.timeline({
      onComplete: () => {
        el.menu!.setAttribute("hidden", "")
        gsap.set(el.menu, { display: "none", visibility: "hidden" })
      },
    })

    tl.to(el.menuContainer, { opacity: 0, duration: 0.25, ease: "power2.in" })
      .to(
        el.linkContains,
        { opacity: 0, y: 40, duration: 0.35, stagger: 0.05, ease: "power2.in" },
        0,
      )

    if (el.line1 && el.line2) {
      tl.to(el.line1, { rotation: 0, y: 0, duration: 0.3, ease: "power2.inOut" }, 0)
      tl.to(el.line2, { rotation: 0, y: 0, duration: 0.3, ease: "power2.inOut" }, 0)
    }
    if (el.triggerCircle) {
      tl.to(el.triggerCircle, { scale: 1, duration: 0.3, ease: "power2.inOut" }, 0)
    }

    if (menuAnim) {
      const total = menuAnim.totalFrames
      const frame = menuAnim.currentFrame
      gsap.to(
        {},
        {
          duration: 0.5,
          ease: "power2.inOut",
          onUpdate: function () {
            const p = this.progress()
            menuAnim!.goToAndStop(Math.max(0, frame * (1 - p)), true)
          },
        },
      )
    }
  }

  const onTriggerClick = () => {
    if (isOpen) closeMenu()
    else void openMenu()
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && isOpen) {
      e.preventDefault()
      closeMenu()
      el.trigger?.focus()
    }
  }

  el.trigger.addEventListener("click", onTriggerClick)
  document.addEventListener("keydown", onKeyDown)

  menuCtx?.add(() => {
    el.trigger?.removeEventListener("click", onTriggerClick)
    document.removeEventListener("keydown", onKeyDown)
  })

  ;(main as HTMLElement & { _shopMenuClose?: () => void })._shopMenuClose = closeMenu
}

export function destroyShopMenu(): void {
  const main = document.querySelector<HTMLElement>("#main")
  const close = (main as HTMLElement & { _shopMenuClose?: () => void })?._shopMenuClose
  close?.()

  menuCtx?.revert()
  menuCtx = null

  if (menuAnim) {
    menuAnim.destroy()
    menuAnim = null
  }

  isOpen = false
  document.body.classList.remove("shop-menu-open")
  document.querySelector(".shop-cursor")?.classList.remove("shop-cursor--hidden")

  const menu = document.querySelector<HTMLElement>(".shop-menu")
  menu?.setAttribute("hidden", "")
}
