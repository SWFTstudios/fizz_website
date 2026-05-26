type Layout = "beside" | "background"

interface FactDetail {
  rich: string
  specs: string
  ctaLabel: string
  ctaHref: string
}

interface Fact {
  title: string
  blurb: string
  image: string
  layout: Layout
  order: number
  accent: string
  color: string
  detailEl: Element | null
  detail?: FactDetail
}

interface ZScrollConfig {
  Z_SPACING: number
  SCROLL_PER_CARD: number
  Z_OFFSET: number
  MAX_BLUR: number
  BLUR_FAR: number
  PARALLAX_STRENGTH: number
  EASE: number
}

type CardPosition = { v: string; h: string }

const FALLBACK_FACTS: Fact[] = [
  {
    title: "Natural Citrus Extract",
    blurb:
      "Bright, clean flavor from real citrus oils — no artificial aftertaste.",
    image: "",
    layout: "background",
    order: 1,
    accent: "#e94560",
    color: "#1a1a2e",
    detailEl: null,
    detail: {
      rich:
        "<p>Our citrus extract is cold-pressed from whole fruit, preserving volatile aromatics that survive carbonation.</p><p>Designed for sparkling beverages that need a true peel note without harsh acidity.</p>",
      specs:
        "<ul><li>Source: Valencia orange &amp; Meyer lemon</li><li>Format: liquid concentrate</li><li>Shelf life: 18 months refrigerated</li></ul>",
      ctaLabel: "Request a sample",
      ctaHref: "https://fizz5.design.webflow.com",
    },
  },
  {
    title: "Zero Sugar Sweetener Blend",
    blurb: "Balanced sweetness with a finish that stays crisp, not cloying.",
    image: "",
    layout: "beside",
    order: 2,
    accent: "#533483",
    color: "#0f3460",
    detailEl: null,
    detail: {
      rich:
        "<p>A proprietary blend tuned for carbonated matrices where stevia alone can read bitter or metallic.</p><p>Pairs especially well with botanical and citrus profiles.</p>",
      specs:
        "<ul><li>Calories: 0 per serving</li><li>GI impact: minimal</li><li>Recommended dose: 0.8–1.2%</li></ul>",
      ctaLabel: "See formulation guide",
      ctaHref: "#",
    },
  },
  {
    title: "Micro-Carbonation System",
    blurb:
      "Finer bubbles, smoother mouthfeel, longer-lasting effervescence.",
    image: "",
    layout: "background",
    order: 3,
    accent: "#0f3460",
    color: "#16213e",
    detailEl: null,
    detail: {
      rich:
        "<p>Micro-carbonation introduces smaller CO₂ nucleation sites for a silkier perception of fizz.</p><p>Ideal for premium seltzer and functional beverage lines.</p>",
      specs:
        "<ul><li>Bubble size: ~40% smaller vs standard</li><li>Compatible with PET &amp; aluminum</li><li>Line speed: up to 1,200 bpm</li></ul>",
      ctaLabel: "Talk to engineering",
      ctaHref: "mailto:hello@fizz5.com",
    },
  },
]

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function normalizeLayout(value: string | undefined | null): Layout {
  const v = (value || "").toLowerCase().trim()
  if (v === "beside" || v === "7240599a2919d37128c6f2c2a6636b39") return "beside"
  return "background"
}

let isInitialized = false
let activeCleanup: (() => void) | null = null
let loaderFrameId: number | null = null
let loaderIntervalId: ReturnType<typeof setInterval> | null = null

export function destroyZScroll(): void {
  activeCleanup?.()
  activeCleanup = null

  if (loaderFrameId !== null) {
    cancelAnimationFrame(loaderFrameId)
    loaderFrameId = null
  }

  if (loaderIntervalId !== null) {
    clearInterval(loaderIntervalId)
    loaderIntervalId = null
  }

  document.getElementById("zs-scene")?.replaceChildren()

  const loader = document.getElementById("zs-loader")
  loader?.classList.remove("is-done")
  loader?.setAttribute("aria-busy", "true")

  const pctEl = document.getElementById("zs-loader-pct")
  if (pctEl) pctEl.textContent = "Loading - 0%"

  document.body.classList.remove("modal-open", "cursor-hover")
  isInitialized = false
}

export interface RunLoaderOptions {
  skipLoader?: boolean
}

export function initZScroll(): void {
  if (isInitialized) return

  const cmsItems = Array.from(
    document.querySelectorAll<HTMLElement>(
      "#cms-data .cms-fact-item, #cms-data [data-title]",
    ),
  )

  let facts: Fact[] = cmsItems
    .map((el) => {
      const title = (
        el.dataset.title ||
        el.querySelector(".fact-title")?.textContent ||
        ""
      ).trim()
      const blurb = (
        el.dataset.blurb ||
        el.querySelector(".fact-blurb")?.textContent ||
        ""
      ).trim()
      const layoutRaw =
        el.dataset.layout ||
        el.querySelector(".fact-layout")?.textContent ||
        ""
      const orderRaw =
        el.dataset.order || el.querySelector(".fact-order")?.textContent || "0"
      const accent = (
        el.dataset.accent ||
        el.querySelector(".fact-accent")?.textContent ||
        "#333333"
      ).trim()
      const color = (
        el.dataset.color ||
        el.querySelector(".fact-color")?.textContent ||
        "#111111"
      ).trim()
      const imgEl = el.querySelector<HTMLImageElement | HTMLElement>(
        ".fact-image img, .fact-image",
      )
      let image = el.dataset.image || ""
      if (!image && imgEl) {
        const bg = imgEl.style.backgroundImage
        image =
          imgEl.getAttribute("src") ||
          bg?.replace(/^url\(["']?|["']?\)$/g, "") ||
          ""
      }
      return {
        title: title || "Untitled",
        blurb,
        image,
        layout: normalizeLayout(layoutRaw),
        order: Number(orderRaw) || 0,
        accent,
        color,
        detailEl: el.querySelector(".cms-detail"),
      }
    })
    .sort((a, b) => a.order - b.order)

  const isPlaceholder =
    facts.length > 0 && facts.every((f) => f.title === "Title" && f.blurb === "Blurb")
  if (facts.length === 0 || isPlaceholder) {
    facts = FALLBACK_FACTS.map((f) => ({ ...f }))
  }

  const CONFIG: ZScrollConfig = {
    Z_SPACING: 900,
    SCROLL_PER_CARD: 900,
    Z_OFFSET: 1200,
    MAX_BLUR: 8,
    BLUR_FAR: 1800,
    PARALLAX_STRENGTH: 0.08,
    EASE: 0.1,
  }

  const scene = document.getElementById("zs-scene")
  const sceneContainer = document.getElementById("zs-scene-container")
  const scrollTrack = document.getElementById("zs-scroll-track")
  const scrollHint = document.getElementById("zs-scroll-hint")
  const factTitle = document.getElementById("zs-fact-title")
  const factTitleText = document.getElementById("zs-fact-title-text")
  const endScreen = document.getElementById("zs-end-screen")
  const emptyState = document.getElementById("zs-empty-state")
  const cursorEl = document.getElementById("zs-cursor")
  const cursorRing = document.getElementById("zs-cursor-ring")
  const modal = document.getElementById("zs-modal")
  const modalBackdrop = document.getElementById("zs-modal-backdrop")
  const modalClose = document.getElementById("zs-modal-close")
  const modalHero = document.getElementById("zs-modal-hero")
  const modalBody = document.getElementById("zs-modal-body")

  if (
    !scene ||
    !sceneContainer ||
    !scrollTrack ||
    !scrollHint ||
    !factTitle ||
    !factTitleText ||
    !endScreen ||
    !emptyState ||
    !cursorEl ||
    !cursorRing ||
    !modal ||
    !modalBackdrop ||
    !modalClose ||
    !modalHero ||
    !modalBody
  ) {
    console.warn("[z-scroll] Missing required DOM elements")
    return
  }

  const sceneEl = scene
  const sceneContainerEl = sceneContainer
  const scrollTrackEl = scrollTrack
  const scrollHintEl = scrollHint
  const factTitleEl = factTitle
  const factTitleTextEl = factTitleText
  const endScreenEl = endScreen
  const emptyStateEl = emptyState
  const cursorElNode = cursorEl
  const cursorRingEl = cursorRing
  const modalEl = modal
  const modalBackdropEl = modalBackdrop
  const modalCloseEl = modalClose
  const modalHeroEl = modalHero
  const modalBodyEl = modalBody

  if (!facts.length) {
    console.warn("[z-scroll] No Product Facts found in #cms-data")
    scrollTrackEl.style.height = "100vh"
    emptyStateEl.classList.add("visible")
    scrollHintEl.classList.add("hidden")
    return
  }

  emptyStateEl.classList.remove("visible")
  const totalScrollHeight =
    CONFIG.SCROLL_PER_CARD * facts.length + CONFIG.Z_OFFSET + 600
  scrollTrackEl.style.height = totalScrollHeight + "px"

  const positions: CardPosition[] = [
    { v: "pos-top", h: "pos-right" },
    { v: "pos-top", h: "pos-left" },
    { v: "pos-bottom", h: "pos-right" },
    { v: "pos-bottom", h: "pos-left" },
  ]

  function gradientStyle(fact: Fact): string {
    return `background-image:linear-gradient(135deg,${fact.color} 0%,${fact.accent} 100%);`
  }

  function buildCardHtml(fact: Fact): string {
    const title = escapeHtml(fact.title)
    const blurb = escapeHtml(fact.blurb)
    const bgStyle = fact.image
      ? `background-image:url('${fact.image.replace(/'/g, "\\'")}');background-size:cover;background-position:center;`
      : gradientStyle(fact)
    if (fact.layout === "beside") {
      const media = `<div class="zs-card-media" style="${bgStyle}"></div>`
      return `
          <div class="zs-card-inner">
            ${media}
            <div class="zs-card-copy">
              <div class="zs-card-label">${title}</div>
              <p class="zs-card-blurb">${blurb}</p>
            </div>
            <div class="zs-card-hint">View ↗</div>
          </div>`
    }
    return `
        <div class="zs-card-inner">
          <div class="zs-card-bg" style="${bgStyle}"></div>
          <div class="zs-card-overlay"></div>
          <div class="zs-card-copy">
            <div class="zs-card-label">${title}</div>
            <p class="zs-card-blurb">${blurb}</p>
          </div>
          <div class="zs-card-hint">View ↗</div>
        </div>`
  }

  const cardEls: HTMLDivElement[] = facts.map((fact, i) => {
    const pos = positions[i % positions.length]
    const zPos = -(CONFIG.Z_OFFSET + i * CONFIG.Z_SPACING)
    const card = document.createElement("div")
    card.className = `zs-card zs-card--${fact.layout} ${pos.v} ${pos.h}`
    card.dataset.index = String(i)
    card.dataset.z = String(zPos)
    card.innerHTML = buildCardHtml(fact)
    card.style.filter = `blur(${CONFIG.MAX_BLUR}px)`
    card.style.opacity = "0"
    card.style.transform = `translateZ(${zPos}px)`
    card.addEventListener("click", () => openModal(i))
    sceneEl.appendChild(card)
    return card
  })

  let modalOpen = false

  function openModal(index: number): void {
    const fact = facts[index]
    const detail = fact.detailEl

    if (fact.image) {
      modalHeroEl.style.backgroundImage = `url('${fact.image.replace(/'/g, "\\'")}')`
      modalHeroEl.classList.remove("no-image")
    } else {
      modalHeroEl.style.backgroundImage = `linear-gradient(135deg, ${fact.color} 0%, ${fact.accent} 100%)`
      modalHeroEl.classList.add("no-image")
    }

    const modalTitle = modalEl.querySelector(".zs-modal-title")
    const modalBlurb = modalEl.querySelector(".zs-modal-blurb")
    if (modalTitle) modalTitle.textContent = fact.title
    if (modalBlurb) modalBlurb.textContent = fact.blurb

    const richEl = modalEl.querySelector<HTMLElement>(".zs-modal-rich")
    const specsWrap = modalEl.querySelector<HTMLElement>(".zs-modal-specs-wrap")
    const specsEl = modalEl.querySelector<HTMLElement>(".zs-modal-specs")
    const ctaWrap = modalEl.querySelector<HTMLElement>(".zs-modal-cta-wrap")
    const ctaLink = document.getElementById("zs-modal-cta-link") as HTMLAnchorElement | null
    const ctaText = ctaLink?.querySelector<HTMLElement>(".zs-modal-cta-text")

    if (!richEl || !specsWrap || !specsEl || !ctaWrap || !ctaLink || !ctaText) return

    if (detail) {
      const srcRich = detail.querySelector(".detail-rich")
      const srcSpecs = detail.querySelector(".detail-specs")
      const srcCtaLabel = detail.querySelector(".detail-cta-label")
      const srcCtaUrl = detail.querySelector<HTMLAnchorElement>(".detail-cta-url")
      richEl.innerHTML = srcRich ? srcRich.innerHTML : ""
      const specsHtml = srcSpecs ? srcSpecs.innerHTML.trim() : ""
      specsEl.innerHTML = specsHtml
      specsWrap.classList.toggle("is-hidden", !specsHtml)
      const href = srcCtaUrl
        ? (srcCtaUrl.getAttribute("href") || srcCtaUrl.textContent || "").trim()
        : ""
      const label = srcCtaLabel ? srcCtaLabel.textContent.trim() : ""
      if (href && href !== "#") {
        ctaLink.href = href
        ctaText.textContent = label || "Learn more"
        ctaWrap.classList.remove("is-hidden")
      } else {
        ctaWrap.classList.add("is-hidden")
      }
    } else if (fact.detail) {
      richEl.innerHTML = fact.detail.rich || ""
      const specsHtml = fact.detail.specs || ""
      specsEl.innerHTML = specsHtml
      specsWrap.classList.toggle("is-hidden", !specsHtml)
      if (fact.detail.ctaHref && fact.detail.ctaHref !== "#") {
        ctaLink.href = fact.detail.ctaHref
        ctaText.textContent = fact.detail.ctaLabel || "Learn more"
        ctaWrap.classList.remove("is-hidden")
      } else {
        ctaWrap.classList.add("is-hidden")
      }
    } else {
      richEl.innerHTML = ""
      specsEl.innerHTML = ""
      specsWrap.classList.add("is-hidden")
      ctaWrap.classList.add("is-hidden")
    }

    modalBodyEl.scrollTop = 0
    modalEl.classList.add("active")
    modalBackdropEl.classList.add("active")
    document.body.classList.add("modal-open")
    modalOpen = true
    modalEl.focus()
  }

  function closeModal(): void {
    modalEl.classList.remove("active")
    modalBackdropEl.classList.remove("active")
    document.body.classList.remove("modal-open")
    modalOpen = false
  }

  modalCloseEl.addEventListener("click", closeModal)
  modalBackdropEl.addEventListener("click", closeModal)
  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === "Escape" && modalOpen) closeModal()
  }
  document.addEventListener("keydown", onKeyDown)
  modalEl.addEventListener("click", (e) => e.stopPropagation())

  let currentScrollY = 0
  let smoothCameraZ = 0
  let mouseX = 0.5
  let mouseY = 0.5
  let animFrameId = 0
  let animating = true

  const onScroll = (): void => {
    currentScrollY = window.scrollY
    scrollHintEl.classList.toggle("hidden", currentScrollY > 50)
  }

  window.addEventListener("scroll", onScroll, { passive: true })

  const onMouseMove = (e: MouseEvent): void => {
    mouseX = e.clientX / window.innerWidth
    mouseY = e.clientY / window.innerHeight
    cursorElNode.style.left = e.clientX + "px"
    cursorElNode.style.top = e.clientY + "px"
    cursorRingEl.style.left = e.clientX + "px"
    cursorRingEl.style.top = e.clientY + "px"
    const target = e.target
    const over =
      target instanceof Element
        ? target.closest(".zs-card, button, a, #zs-modal-close")
        : null
    document.body.classList.toggle("cursor-hover", !!over)
  }

  window.addEventListener("mousemove", onMouseMove)

  function animate(): void {
    if (!animating) return
    animFrameId = requestAnimationFrame(animate)
    const targetZ = modalOpen ? smoothCameraZ : currentScrollY
    smoothCameraZ += (targetZ - smoothCameraZ) * CONFIG.EASE
    sceneEl.style.transform = `translateZ(${smoothCameraZ}px)`
    if (!modalOpen) {
      const ox = 50 + (mouseX - 0.5) * 100 * CONFIG.PARALLAX_STRENGTH
      const oy = 50 + (mouseY - 0.5) * 100 * CONFIG.PARALLAX_STRENGTH
      sceneContainerEl.style.perspectiveOrigin = `${ox}% ${oy}%`
    }
    let nearestDist = Infinity
    let nearestIdx = -1
    cardEls.forEach((el) => {
      const cardZ = parseFloat(el.dataset.z ?? "0")
      const dist = -(cardZ + smoothCameraZ)
      if (dist < -200) {
        el.style.opacity = "0"
        el.style.filter = "blur(0px)"
        el.style.pointerEvents = "none"
        return
      }
      if (dist > CONFIG.BLUR_FAR) {
        el.style.opacity = "0"
        el.style.filter = `blur(${CONFIG.MAX_BLUR}px)`
        el.style.pointerEvents = "none"
        return
      }
      const t = Math.max(0, Math.min(1, dist / CONFIG.BLUR_FAR))
      const opacity = Math.max(0, 1 - t * 1.4)
      const blur = t * CONFIG.MAX_BLUR
      el.style.opacity = String(opacity)
      el.style.filter = `blur(${blur.toFixed(2)}px)`
      el.style.pointerEvents = !modalOpen && dist < 400 ? "all" : "none"
      if (dist < nearestDist && dist > -100) {
        nearestDist = dist
        nearestIdx = parseInt(el.dataset.index ?? "-1", 10)
      }
    })
    if (nearestIdx !== -1 && nearestDist < 500 && !modalOpen) {
      factTitleTextEl.textContent = facts[nearestIdx].title
      factTitleEl.classList.add("visible")
    } else {
      factTitleEl.classList.remove("visible")
    }
    const denom = Math.max(1, totalScrollHeight - window.innerHeight)
    const frac = currentScrollY / denom
    endScreenEl.classList.toggle("visible", frac > 0.96)
  }

  animate()

  isInitialized = true
  activeCleanup = (): void => {
    animating = false
    cancelAnimationFrame(animFrameId)
    window.removeEventListener("scroll", onScroll)
    window.removeEventListener("mousemove", onMouseMove)
    document.removeEventListener("keydown", onKeyDown)
  }
}

export function runLoaderThenInit(options: RunLoaderOptions = {}): void {
  if (!document.getElementById("zs-scene")) return
  if (isInitialized) return

  const loader = document.getElementById("zs-loader")
  const pctEl = document.getElementById("zs-loader-pct")
  const hudTime = document.getElementById("zs-hud-time")

  if (hudTime && loaderIntervalId === null) {
    const tick = (): void => {
      const d = new Date()
      hudTime.textContent = d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    }
    tick()
    loaderIntervalId = setInterval(tick, 1000)
  }

  if (options.skipLoader || !loader) {
    if (loader) {
      loader.classList.add("is-done")
      loader.setAttribute("aria-busy", "false")
    }
    initZScroll()
    return
  }

  const loaderEl = loader
  const duration = 2200
  const start = performance.now()

  function frame(now: number): void {
    const p = Math.min(100, Math.round(((now - start) / duration) * 100))
    if (pctEl) pctEl.textContent = "Loading - " + p + "%"
    if (p < 100) {
      loaderFrameId = requestAnimationFrame(frame)
    } else {
      loaderFrameId = null
      loaderEl.classList.add("is-done")
      loaderEl.setAttribute("aria-busy", "false")
      setTimeout(initZScroll, 350)
    }
  }

  loaderFrameId = requestAnimationFrame(frame)
}
