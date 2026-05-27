import { Flip } from "gsap/Flip"
import { clickDebugLog } from "./clickDebug"

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
  FOCUS_DIST: number
  CARD_MOUSE_DRIFT: number
  DRIFT_EASE: number
  EASE: number
}

type CardPosition = { v: string; h: string }

const FALLBACK_FACTS: Fact[] = [
  {
    title: "Add Some Fizz",
    blurb:
      "Portable carbonation that turns still water into sparkling water in seconds — just add some Fizz.",
    image: "",
    layout: "background",
    order: 1,
    accent: "#e94560",
    color: "#1a1a2e",
    detailEl: null,
    detail: {
      rich:
        "<p>Fizz is a portable carbonation bottle paired with in-house flavor packs. We built it for people who want sparkling water on their terms — at the gym, at your desk, on a hike — without hauling cases of seltzer or settling for flat water.</p><p>Our mission is simple: make hydration feel a little more alive. Less plastic. Less sugar. More fizz when you want it.</p><p>Every bottle is designed to be refilled, recharged, and carried. Fizz up your day, wherever you are.</p>",
      specs:
        "<ul><li>Founded to rethink at-home carbonation</li><li>Flavor packs made in-house</li><li>Refillable, travel-ready bottle design</li><li>No artificial colors in core lineup</li></ul>",
      ctaLabel: "Shop the bottle",
      ctaHref: "/",
    },
  },
  {
    title: "Zero Sugar, All Flavor",
    blurb:
      "Real taste from natural extracts — zero sugar, zero guilt, all the sparkle.",
    image: "",
    layout: "beside",
    order: 2,
    accent: "#533483",
    color: "#0f3460",
    detailEl: null,
    detail: {
      rich:
        "<p>Our flavor packs use natural citrus, botanical, and fruit extracts — never high-fructose syrups. You get a bright, clean finish that stays crisp, not cloying.</p><p>Each pack is portioned for one bottle fill, so you never over-sweeten or waste product. Swap flavors in seconds without rinsing the whole system.</p>",
      specs:
        "<ul><li>0 g sugar per serving</li><li>Natural extract-based flavors</li><li>No artificial aftertaste</li><li>Compatible with still or sparkling water</li><li>Recyclable pack format</li></ul>",
      ctaLabel: "Explore flavors",
      ctaHref: "/",
    },
  },
  {
    title: "Fizz Anywhere",
    blurb:
      "Carbonation you can take anywhere — gym bag, commute, kitchen counter, campsite.",
    image: "",
    layout: "background",
    order: 3,
    accent: "#0f3460",
    color: "#16213e",
    detailEl: null,
    detail: {
      rich:
        "<p>Still water at breakfast. Sparkling with lunch. A citrus lift before a workout. Fizz adapts to your routine instead of locking you into one use case.</p><p>The bottle is sized for daily carry, and the CO₂ charge lasts for multiple fills. Fewer store runs, less fridge clutter, more control over when and how you hydrate.</p><p>That is the benefit we care about most: freedom. Sparkling water when you want it, flat water when you do not — one bottle, your choice.</p>",
      specs:
        "<ul><li>Compact bottle footprint</li><li>Quick twist-and-fizz operation</li><li>Multiple fills per charge</li><li>Works with tap or filtered water</li><li>Designed for travel and daily carry</li></ul>",
      ctaLabel: "Get started",
      ctaHref: "/",
    },
  },
]

const WATER_VIDEO_POSTER =
  "/videos/loop-animation-of-water-on-black-background-2026-01-28-04-38-31-utc_poster.0000000.jpg"
const WATER_VIDEO_MP4 =
  "/videos/loop-animation-of-water-on-black-background-2026-01-28-04-38-31-utc_mp4.mp4"
const WATER_VIDEO_WEBM =
  "/videos/loop-animation-of-water-on-black-background-2026-01-28-04-38-31-utc_webm.webm"

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

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

interface ResolvedFactDetail {
  rich: string
  specs: string
  ctaLabel: string
  ctaHref: string
}

function resolveFactDetail(fact: Fact): ResolvedFactDetail {
  const cms = fact.detailEl
  if (cms) {
    const srcRich = cms.querySelector(".detail-rich")
    const srcSpecs = cms.querySelector(".detail-specs")
    const srcCtaLabel = cms.querySelector(".detail-cta-label")
    const srcCtaUrl = cms.querySelector<HTMLAnchorElement>(".detail-cta-url")
    const href = srcCtaUrl
      ? (srcCtaUrl.getAttribute("href") || srcCtaUrl.textContent || "").trim()
      : ""
    const label = srcCtaLabel ? srcCtaLabel.textContent.trim() : ""
    return {
      rich: srcRich ? srcRich.innerHTML : "",
      specs: srcSpecs ? srcSpecs.innerHTML.trim() : "",
      ctaLabel: label,
      ctaHref: href,
    }
  }
  if (fact.detail) {
    return {
      rich: fact.detail.rich || "",
      specs: fact.detail.specs || "",
      ctaLabel: fact.detail.ctaLabel || "",
      ctaHref: fact.detail.ctaHref || "",
    }
  }
  return { rich: "", specs: "", ctaLabel: "", ctaHref: "" }
}

function clearExpandedContent(card: HTMLDivElement): void {
  card.querySelector(".zs-card-detail")?.remove()
}

function pointInRect(x: number, y: number, rect: DOMRect): boolean {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
}

function mountWaterBackdrop(container: HTMLElement): {
  backdrop: HTMLDivElement
  video: HTMLVideoElement | null
} {
  document.getElementById("zs-water-base")?.remove()
  document.getElementById("zs-water-backdrop")?.remove()

  const base = document.createElement("div")
  base.id = "zs-water-base"
  base.className = "zs-water-base"
  base.setAttribute("aria-hidden", "true")

  const backdrop = document.createElement("div")
  backdrop.id = "zs-water-backdrop"
  backdrop.className = "zs-water-backdrop"
  backdrop.setAttribute("aria-hidden", "true")

  let video: HTMLVideoElement | null = null

  if (prefersReducedMotion()) {
    const poster = document.createElement("div")
    poster.className = "zs-water-poster"
    poster.style.backgroundImage = `url('${WATER_VIDEO_POSTER}')`
    backdrop.appendChild(poster)
  } else {
    video = document.createElement("video")
    video.muted = true
    video.loop = true
    video.autoplay = true
    video.playsInline = true
    video.preload = "auto"
    video.poster = WATER_VIDEO_POSTER
    video.setAttribute("aria-hidden", "true")
    video.className = "zs-water-video"

    const mp4 = document.createElement("source")
    mp4.src = WATER_VIDEO_MP4
    mp4.type = "video/mp4"
    const webm = document.createElement("source")
    webm.src = WATER_VIDEO_WEBM
    webm.type = "video/webm"
    video.append(mp4, webm)

    const startPlayback = (): void => {
      void video?.play().catch(() => {
        // Ignore autoplay failures (should be rare with muted video).
      })
    }

    video.addEventListener("loadeddata", startPlayback, { once: true })
    video.addEventListener("canplay", startPlayback, { once: true })
    video.load()

    backdrop.appendChild(video)
  }

  const vignette = document.createElement("div")
  vignette.className = "zs-water-vignette"
  backdrop.appendChild(vignette)

  if (container.firstChild) {
    container.insertBefore(backdrop, container.firstChild)
    container.insertBefore(base, backdrop)
  } else {
    container.append(base, backdrop)
  }

  return { backdrop, video }
}

let isInitialized = false
let activeCleanup: (() => void) | null = null

export function destroyZScroll(): void {
  activeCleanup?.()
  activeCleanup = null

  const scene = document.getElementById("zs-scene")
  const expanded = document.querySelector<HTMLDivElement>(".zs-card--expanded")
  if (expanded && scene) {
    clearExpandedContent(expanded)
    expanded.classList.remove("zs-card--expanded")
    const z = expanded.dataset.z ?? "0"
    expanded.style.transform = `translateZ(${z}px)`
    scene.appendChild(expanded)
  }
  document.getElementById("zs-card-backdrop")?.classList.remove("is-active")
  document.getElementById("zs-card-overlay")?.classList.remove("is-active")

  scene?.replaceChildren()

  const waterVideo = document.querySelector<HTMLVideoElement>("#zs-water-backdrop video")
  waterVideo?.pause()
  document.getElementById("zs-water-backdrop")?.remove()
  document.getElementById("zs-water-base")?.remove()

  document.body.classList.remove("modal-open", "cursor-hover")
  isInitialized = false
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
    PARALLAX_STRENGTH: 0.2,
    FOCUS_DIST: 220,
    CARD_MOUSE_DRIFT: 15,
    DRIFT_EASE: 0.12,
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
  const cardOverlay = document.getElementById("zs-card-overlay")
  const cardBackdrop = document.getElementById("zs-card-backdrop")

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
    !cardOverlay ||
    !cardBackdrop
  ) {
    console.warn("[z-scroll] Missing required DOM elements", {
      scene: !!scene,
      sceneContainer: !!sceneContainer,
      scrollTrack: !!scrollTrack,
      scrollHint: !!scrollHint,
      factTitle: !!factTitle,
      factTitleText: !!factTitleText,
      endScreen: !!endScreen,
      emptyState: !!emptyState,
      cursorEl: !!cursorEl,
      cursorRing: !!cursorRing,
      cardOverlay: !!cardOverlay,
      cardBackdrop: !!cardBackdrop,
    })
    return
  }

  clickDebugLog("initZScroll:start", { factCount: facts.length })

  const sceneEl = scene
  const sceneContainerEl = sceneContainer
  const scrollTrackEl = scrollTrack
  const scrollHintEl = scrollHint
  const factTitleEl = factTitle
  factTitleEl.setAttribute("role", "button")
  factTitleEl.setAttribute("tabindex", "0")
  factTitleEl.setAttribute("aria-label", "Open focused card details")
  const factTitleTextEl = factTitleText
  const endScreenEl = endScreen
  const emptyStateEl = emptyState
  const cursorElNode = cursorEl
  const cursorRingEl = cursorRing
  const cardOverlayEl = cardOverlay
  const cardBackdropEl = cardBackdrop

  const pageEmbed = sceneEl.closest<HTMLElement>(".page-embed")
  let waterVideoEl: HTMLVideoElement | null = null
  if (pageEmbed) {
    ;({ video: waterVideoEl } = mountWaterBackdrop(pageEmbed))
  } else {
    console.warn("[z-scroll] Missing .page-embed container for water backdrop")
  }

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
    sceneEl.appendChild(card)
    return card
  })

  function scrollToCard(index: number): void {
    const card = cardEls[index]
    if (!card) return
    const z = parseFloat(card.dataset.z ?? "0")
    const targetScroll = -z
    clickDebugLog("scrollToCard", { index, targetScroll })
    window.scrollTo({ top: targetScroll, behavior: "smooth" })
  }

  let focusedCardIdx = -1
  let smoothDriftX = 0
  let smoothDriftY = 0

  let expandedCard: HTMLDivElement | null = null
  let isCollapsing = false

  function isCardInteractive(card: HTMLDivElement): boolean {
    const pe = card.style.pointerEvents || getComputedStyle(card).pointerEvents
    return pe !== "none" && parseFloat(card.style.opacity || "0") > 0.05
  }

  /** 3D transforms break native hit targets — use projected screen rects. */
  function hitTestCardAt(x: number, y: number): HTMLDivElement | null {
    if (expandedCard || isCollapsing) return null

    if (focusedCardIdx >= 0) {
      const focused = cardEls[focusedCardIdx]
      if (focused && isCardInteractive(focused)) {
        const rect = focused.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0 && pointInRect(x, y, rect)) {
          return focused
        }
      }
    }

    for (let i = cardEls.length - 1; i >= 0; i--) {
      const card = cardEls[i]
      if (!isCardInteractive(card)) continue
      const rect = card.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0 && pointInRect(x, y, rect)) {
        return card
      }
    }

    return null
  }

  function handleCardPointerActivate(clientX: number, clientY: number): void {
    const card = hitTestCardAt(clientX, clientY)
    if (!card) return

    const idx = parseInt(card.dataset.index ?? "-1", 10)
    if (idx < 0 || idx >= facts.length) return

    clickDebugLog("zs-card:click", {
      index: idx,
      focused: card.classList.contains("zs-card--focused"),
    })

    if (card.classList.contains("zs-card--focused")) {
      expandCard(card, facts[idx])
    } else {
      scrollToCard(idx)
    }
  }

  const onSceneClick = (e: MouseEvent): void => {
    if (expandedCard || isCollapsing) return
    handleCardPointerActivate(e.clientX, e.clientY)
  }

  sceneContainerEl.addEventListener("click", onSceneClick)

  function renderExpandedContent(card: HTMLDivElement, fact: Fact): void {
    clearExpandedContent(card)
    const resolved = resolveFactDetail(fact)
    const heroStyle = fact.image
      ? `background-image:url('${fact.image.replace(/'/g, "\\'")}');`
      : `background-image:linear-gradient(135deg,${fact.color} 0%,${fact.accent} 100%);`
    const specsHidden = !resolved.specs
    const ctaHidden = !resolved.ctaHref || resolved.ctaHref === "#"
    const ctaLabel = escapeHtml(resolved.ctaLabel || "Learn more")
    const ctaHref = escapeHtml(resolved.ctaHref || "#")

    const panel = document.createElement("div")
    panel.className = "zs-card-detail"
    panel.innerHTML = `
      <button type="button" class="zs-card-close" aria-label="Close">✕</button>
      <div class="zs-card-detail-scroll">
        <div class="zs-card-detail-hero${fact.image ? "" : " zs-card-detail-hero--gradient"}" style="${heroStyle}"></div>
        <h2 class="zs-card-detail-title">${escapeHtml(fact.title)}</h2>
        <p class="zs-card-detail-lead">${escapeHtml(fact.blurb)}</p>
        <div class="zs-card-detail-rich">${resolved.rich}</div>
        <div class="zs-card-detail-specs-wrap${specsHidden ? " is-hidden" : ""}">
          <div class="zs-card-detail-specs-label">Details</div>
          <div class="zs-card-detail-specs">${resolved.specs}</div>
        </div>
        <div class="zs-card-detail-cta-wrap${ctaHidden ? " is-hidden" : ""}">
          <a href="${ctaHref}" class="fizz-btn fizz-btn--ghost fizz-btn--arrow" target="_blank" rel="noopener">
            <span>${ctaLabel}</span>
            <span class="fizz-btn__arrow" aria-hidden="true">→</span>
          </a>
        </div>
      </div>`

    panel.querySelector(".zs-card-close")?.addEventListener("click", (e) => {
      e.stopPropagation()
      collapseCard()
    })
    panel.addEventListener("click", (e) => e.stopPropagation())
    card.appendChild(panel)
  }

  function expandCard(cardEl: HTMLDivElement, fact: Fact): void {
    clickDebugLog("expandCard:called", {
      title: fact.title,
      expanded: !!expandedCard,
      isCollapsing,
    })
    if (expandedCard || isCollapsing) return

    waterVideoEl?.pause()

    const state = Flip.getState(cardEl)
    cardOverlayEl.appendChild(cardEl)
    cardEl.classList.remove("zs-card--focused")
    cardEl.classList.add("zs-card--expanded")
    renderExpandedContent(cardEl, fact)

    cardOverlayEl.classList.add("is-active")
    cardBackdropEl.classList.add("is-active")
    document.body.classList.add("modal-open")

    Flip.from(state, {
      duration: prefersReducedMotion() ? 0 : 0.55,
      ease: "power3.inOut",
      absolute: true,
    })

    expandedCard = cardEl
  }

  function collapseCard(): void {
    clickDebugLog("collapseCard:called", { hasExpanded: !!expandedCard, isCollapsing })
    if (!expandedCard || isCollapsing) return
    isCollapsing = true

    const card = expandedCard
    const state = Flip.getState(card)

    cardOverlayEl.classList.remove("is-active")
    cardBackdropEl.classList.remove("is-active")
    document.body.classList.remove("modal-open")

    sceneEl.appendChild(card)
    card.classList.remove("zs-card--expanded")
    clearExpandedContent(card)

    const z = card.dataset.z ?? "0"
    card.style.transform = `translateZ(${z}px)`

    Flip.from(state, {
      duration: prefersReducedMotion() ? 0 : 0.45,
      ease: "power3.inOut",
      absolute: true,
      onComplete: () => {
        expandedCard = null
        isCollapsing = false
        if (waterVideoEl) {
          void waterVideoEl.play().catch(() => {
            // No-op. If it can't resume (autoplay policy), it's fine.
          })
        }
      },
    })
  }

  const onFactTitleActivate = (): void => {
    if (expandedCard || isCollapsing) return
    if (focusedCardIdx < 0) return
    const card = cardEls[focusedCardIdx]
    if (!card?.classList.contains("zs-card--focused")) return
    clickDebugLog("factTitle:click", { index: focusedCardIdx })
    expandCard(card, facts[focusedCardIdx])
  }

  const onFactTitleKeyDown = (e: KeyboardEvent): void => {
    if (e.key !== "Enter" && e.key !== " ") return
    e.preventDefault()
    onFactTitleActivate()
  }

  factTitleEl.addEventListener("click", onFactTitleActivate)
  factTitleEl.addEventListener("keydown", onFactTitleKeyDown)

  cardBackdropEl.addEventListener("click", collapseCard)
  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === "Escape" && expandedCard) collapseCard()
  }
  document.addEventListener("keydown", onKeyDown)

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
    const overCard = hitTestCardAt(e.clientX, e.clientY)
    const overTitle =
      e.target instanceof Element ? e.target.closest("#zs-fact-title.visible") : null
    const over =
      overCard ||
      overTitle ||
      (e.target instanceof Element
        ? e.target.closest("button, a, .zs-card-close, .fizz-btn")
        : null)
    document.body.classList.toggle("cursor-hover", !!over)
  }

  window.addEventListener("mousemove", onMouseMove)

  function animate(): void {
    if (!animating) return
    animFrameId = requestAnimationFrame(animate)
    const cardExpanded = expandedCard !== null
    const targetZ = cardExpanded ? smoothCameraZ : currentScrollY
    smoothCameraZ += (targetZ - smoothCameraZ) * CONFIG.EASE
    sceneEl.style.transform = `translateZ(${smoothCameraZ}px)`

    if (!cardExpanded) {
      const ox = 50 + (mouseX - 0.5) * 100 * CONFIG.PARALLAX_STRENGTH
      const oy = 50 + (mouseY - 0.5) * 100 * CONFIG.PARALLAX_STRENGTH
      sceneContainerEl.style.perspectiveOrigin = `${ox}% ${oy}%`
    }
    let nearestDist = Infinity
    let nearestIdx = -1
    const cardMetrics: Array<{ dist: number; opacity: number }> = []

    cardEls.forEach((el, i) => {
      if (el === expandedCard) {
        cardMetrics[i] = { dist: Infinity, opacity: 0 }
        return
      }
      const cardZ = parseFloat(el.dataset.z ?? "0")
      const dist = -(cardZ + smoothCameraZ)
      cardMetrics[i] = { dist, opacity: 0 }

      if (dist < -200) {
        el.style.opacity = "0"
        el.style.filter = "blur(0px)"
        el.style.pointerEvents = "none"
        el.classList.remove("zs-card--focused")
        el.style.transform = `translateZ(${cardZ}px)`
        return
      }
      if (dist > CONFIG.BLUR_FAR) {
        el.style.opacity = "0"
        el.style.filter = `blur(${CONFIG.MAX_BLUR}px)`
        el.style.pointerEvents = "none"
        el.classList.remove("zs-card--focused")
        el.style.transform = `translateZ(${cardZ}px)`
        return
      }
      const t = Math.max(0, Math.min(1, dist / CONFIG.BLUR_FAR))
      const opacity = Math.max(0, 1 - t * 1.4)
      const blur = t * CONFIG.MAX_BLUR
      cardMetrics[i] = { dist, opacity }
      el.style.opacity = String(opacity)
      el.style.filter = `blur(${blur.toFixed(2)}px)`

      const visible = !cardExpanded && opacity > 0.12 && dist > -200 && dist <= CONFIG.BLUR_FAR
      el.style.pointerEvents = visible ? "all" : "none"

      if (dist < nearestDist && dist > -100) {
        nearestDist = dist
        nearestIdx = i
      }
    })

    focusedCardIdx = -1
    const nearestOpacity =
      nearestIdx >= 0 ? (cardMetrics[nearestIdx]?.opacity ?? 0) : 0
    const hasFocusedCard =
      nearestIdx >= 0 &&
      nearestDist < CONFIG.FOCUS_DIST &&
      nearestOpacity > 0.35 &&
      !cardExpanded

    if (hasFocusedCard) {
      focusedCardIdx = nearestIdx
      const targetDriftX = (mouseX - 0.5) * 2 * CONFIG.CARD_MOUSE_DRIFT
      const targetDriftY = (mouseY - 0.5) * 2 * CONFIG.CARD_MOUSE_DRIFT
      smoothDriftX += (targetDriftX - smoothDriftX) * CONFIG.DRIFT_EASE
      smoothDriftY += (targetDriftY - smoothDriftY) * CONFIG.DRIFT_EASE
    } else {
      smoothDriftX = 0
      smoothDriftY = 0
    }

    cardEls.forEach((el, i) => {
      if (el === expandedCard) return
      const { opacity } = cardMetrics[i] ?? { dist: Infinity, opacity: 0 }
      const cardZ = parseFloat(el.dataset.z ?? "0")
      const inFocus = i === focusedCardIdx

      el.classList.toggle("zs-card--focused", inFocus)

      if (inFocus) {
        el.style.transform = `translate3d(${smoothDriftX.toFixed(2)}px, ${smoothDriftY.toFixed(2)}px, ${cardZ}px)`
      } else if (opacity > 0) {
        el.style.transform = `translateZ(${cardZ}px)`
      }
    })

    if (focusedCardIdx >= 0 && !cardExpanded) {
      factTitleTextEl.textContent = facts[focusedCardIdx].title
      factTitleEl.classList.add("visible")
      factTitleEl.setAttribute(
        "aria-label",
        `Open details for ${facts[focusedCardIdx].title}`,
      )
    } else {
      factTitleEl.classList.remove("visible")
      factTitleEl.setAttribute("aria-label", "Open focused card details")
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
    sceneContainerEl.removeEventListener("click", onSceneClick)
    factTitleEl.removeEventListener("click", onFactTitleActivate)
    factTitleEl.removeEventListener("keydown", onFactTitleKeyDown)

    if (expandedCard) {
      const card = expandedCard
      clearExpandedContent(card)
      card.classList.remove("zs-card--expanded")
      const z = card.dataset.z ?? "0"
      card.style.transform = `translateZ(${z}px)`
      sceneEl.appendChild(card)
      expandedCard = null
    }
    cardOverlayEl.classList.remove("is-active")
    cardBackdropEl.classList.remove("is-active")
    document.body.classList.remove("modal-open")

    waterVideoEl?.pause()
  }
}

export function runLoaderThenInit(): void {
  if (!document.getElementById("zs-scene")) return
  if (isInitialized) return
  initZScroll()
}
