import "./styles/typography.css"
import "./styles/buttons.css"
import "./styles/3d-product.css"
import { BOTTLE_PRODUCTS } from "./lib/shopData"
import { BRAND_FOOTER_LEGAL } from "./data/brandTokens"
import { get3dCopyForSlug } from "./data/3dProductCopy"
import { createCompositeScene, type B3dPhase } from "./lib/three/compositeScene"
import { bindScrollCamera } from "./lib/three/scrollCamera"

const DEFAULT_VARIANT = "charcoal-black"

function readPhase(): B3dPhase {
  const env = (import.meta.env.VITE_B3D_PHASE as string | undefined)?.trim()
  return env === "full" ? "full" : "ocean"
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function applyPhaseClass(phase: B3dPhase): void {
  document.body.classList.remove("b3d-phase-ocean", "b3d-phase-full")
  document.body.classList.add(phase === "ocean" ? "b3d-phase-ocean" : "b3d-phase-full")
}

function setLoaderProgress(ratio: number, phase: B3dPhase): void {
  const el = document.getElementById("b3d-loader-progress")
  const text = document.querySelector<HTMLElement>(".b3d-loader-text")
  if (el) el.textContent = `${Math.round(ratio * 100)}%`
  if (text) {
    if (phase === "ocean") {
      text.textContent = ratio >= 1 ? "Preparing ocean…" : "Loading environment…"
    } else {
      text.textContent =
        ratio > 0 && ratio < 1
          ? `Downloading 3D model… ${Math.round(ratio * 100)}%`
          : ratio >= 1
            ? "Preparing scene…"
            : "Loading 3D bottle…"
    }
  }
}

function hideLoader(): void {
  document.getElementById("b3d-loader")?.classList.add("is-hidden")
}

function showWebGlFallback(): void {
  document.body.classList.add("b3d-fallback")
  const panel = document.querySelector<HTMLElement>(".b3d-fallback-panel")
  if (panel) {
    panel.hidden = false
    panel.setAttribute("aria-hidden", "false")
  }
  hideLoader()
}

function showLoadHint(message: string): void {
  const hint = document.getElementById("b3d-load-hint")
  if (!hint) return
  hint.textContent = message
  hint.hidden = false
}

function getWebGLCanvas(): HTMLCanvasElement | null {
  return document.getElementById("b3d-canvas") as HTMLCanvasElement | null
}

function canUseWebGL(canvas: HTMLCanvasElement): boolean {
  const opts = { failIfMajorPerformanceCaveat: false } as WebGLContextAttributes
  const gl2 = canvas.getContext("webgl2", opts)
  if (gl2) return true
  const gl = canvas.getContext("webgl", opts)
  return !!gl
}

function renderVariantSwatches(): void {
  const bar = document.getElementById("b3d-variant-buttons")
  if (!bar) return

  bar.innerHTML = BOTTLE_PRODUCTS.map((b) => {
    const active = b.slug === DEFAULT_VARIANT
    return `<button
      type="button"
      class="b3d-variant-btn${active ? " is-active" : ""}"
      data-variant="${b.slug}"
      role="tab"
      aria-selected="${active}"
      aria-label="${b.name}"
    >
      <img src="${b.image}" alt="" width="56" height="84" loading="lazy" />
    </button>`
  }).join("")

  const legal = document.getElementById("b3d-legal")
  if (legal) legal.textContent = BRAND_FOOTER_LEGAL
}

function bindVariantClicks(
  setVariant: (slug: string, animate?: boolean) => void,
): void {
  document.querySelectorAll<HTMLButtonElement>("[data-variant]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const slug = btn.dataset.variant
      if (!slug) return
      setVariant(slug, !prefersReducedMotion())
    })
  })
}

function bindViewToggles(api: {
  setInternalsVisible: (visible: boolean) => void
}): void {
  const internalsToggle = document.getElementById("b3d-toggle-internals") as HTMLInputElement | null
  if (!internalsToggle) return

  api.setInternalsVisible(internalsToggle.checked)
  internalsToggle.addEventListener("change", () => {
    api.setInternalsVisible(internalsToggle.checked)
  })
}

function bindScrollChevron(): void {
  const chevron = document.getElementById("b3d-scroll-chevron")
  const track = document.getElementById("b3d-scroll-track")
  if (!chevron || !track) return

  chevron.addEventListener("click", () => {
    track.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" })
  })
}

function initCopyPanels(): void {
  const copy = get3dCopyForSlug(DEFAULT_VARIANT)
  const title = document.getElementById("b3d-panel-title")
  const lead = document.getElementById("b3d-panel-lead")
  const buyNow = document.getElementById("b3d-shop-cta") as HTMLAnchorElement | null
  if (title) title.textContent = copy.panelTitle
  if (lead) lead.textContent = copy.panelLead
  if (buyNow) {
    buyNow.href = `/products/${DEFAULT_VARIANT}.html`
    buyNow.textContent = "Buy Now"
  }
}

async function boot(): Promise<void> {
  const canvas = getWebGLCanvas()
  if (!canvas) return

  const phase = readPhase()
  applyPhaseClass(phase)
  renderVariantSwatches()
  bindScrollChevron()
  initCopyPanels()

  if (!canUseWebGL(canvas)) {
    showWebGlFallback()
    return
  }

  try {
    const api = await createCompositeScene(canvas, document.body, {
      phase,
      onLoadProgress: (ratio) => setLoaderProgress(ratio, phase),
    })

    if (phase === "full") {
      bindVariantClicks(api.setVariant)
      bindViewToggles(api)
    }

    if (api.loadError) {
      showLoadHint(
        "Full model could not load (large file). Showing simplified 3D — use /local-dev/ URL in .env for faster local testing.",
      )
    } else if (api.usedPlaceholder && phase === "full") {
      showLoadHint("Using preview geometry. Set VITE_BOTTLE_GLTF_URL to load the real bottle.")
    }

    const scrollTrack = document.getElementById("b3d-scroll-track")
    const disposeScroll = bindScrollCamera(api.camera, scrollTrack)

    if (import.meta.env.DEV) {
      ;(window as unknown as { __b3dScene?: typeof api }).__b3dScene = api
    }

    hideLoader()

    window.addEventListener("beforeunload", () => {
      disposeScroll()
      api.dispose()
    })
  } catch (err) {
    console.error("[b3d] init failed", err)
    showLoadHint("3D scene error — check the browser console.")
    hideLoader()
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => void boot(), { once: true })
} else {
  void boot()
}
