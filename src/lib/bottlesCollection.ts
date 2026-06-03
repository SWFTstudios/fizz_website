import Splide from "@splidejs/splide"
import { AutoScroll } from "@splidejs/splide-extension-auto-scroll"
import "@splidejs/splide/css/core"
import { BOTTLE_PRODUCTS, type BottleProduct } from "./shopData"

export type BottlesViewMode = "carousel" | "grid"
export type BottlesSortOrder = "catalog" | "name-asc" | "name-desc"
type ScrollDirection = 1 | -1

const SORT_OPTIONS: { value: BottlesSortOrder; label: string }[] = [
  { value: "catalog", label: "Featured" },
  { value: "name-asc", label: "Name (A–Z)" },
  { value: "name-desc", label: "Name (Z–A)" },
]

/** Pixel-per-frame speed; positive = slides advance (visual flow right → left). */
const AUTO_SCROLL_SPEED = 0.85

let bottlesSplide: Splide | null = null
let viewMode: BottlesViewMode = "carousel"
let sortOrder: BottlesSortOrder = "catalog"
let autoScrollEnabled = true
let scrollDirection: ScrollDirection = 1

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function canUseAutoScroll(): boolean {
  return autoScrollEnabled && !prefersReducedMotion()
}

function sortBottles(products: BottleProduct[], order: BottlesSortOrder): BottleProduct[] {
  const list = [...products]
  if (order === "name-asc") {
    return list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }))
  }
  if (order === "name-desc") {
    return list.sort((a, b) => b.name.localeCompare(a.name, undefined, { sensitivity: "base" }))
  }
  return list
}

function buildProductCardMarkup(bottle: BottleProduct): string {
  return `
    <a
      class="product-card product-card--link"
      href="${bottle.productHref}"
      data-product-slug="${bottle.slug}"
    >
      <div class="card-bg" style="background: ${bottle.gradient}">
        <img
          class="card-bottle-img"
          src="${bottle.image}"
          alt="Fizz5 Bottle – ${bottle.name}"
          loading="lazy"
          width="400"
          height="400"
        />
      </div>
      <div class="card-info">
        <h2 class="card-name fizz-heading">${bottle.name}</h2>
        <p class="card-desc fizz-lead">${bottle.description}</p>
        <span class="fizz-btn fizz-btn--outline">View product</span>
      </div>
    </a>
  `
}

function buildCarouselSlideMarkup(bottle: BottleProduct): string {
  return `
    <li class="splide__slide bottles-carousel__slide">
      ${buildProductCardMarkup(bottle)}
    </li>
  `
}

function getSortedProducts(): BottleProduct[] {
  return sortBottles(BOTTLE_PRODUCTS, sortOrder)
}

function getRoot(): HTMLElement | null {
  return document.querySelector<HTMLElement>("[data-bottles-collection]")
}

function getIndexDelta(prev: number, next: number, length: number): number {
  let delta = next - prev
  if (delta > length / 2) delta -= length
  if (delta < -length / 2) delta += length
  return delta
}

function autoScrollOptions() {
  return {
    speed: scrollDirection * AUTO_SCROLL_SPEED,
    autoStart: true,
    pauseOnHover: true,
    pauseOnFocus: true,
    rewind: true,
  }
}

function syncAutoScrollOptions(): void {
  if (!bottlesSplide) return

  if (canUseAutoScroll()) {
    bottlesSplide.options.autoScroll = autoScrollOptions()
    bottlesSplide.emit("updated")
    bottlesSplide.Components.AutoScroll?.play()
  } else {
    bottlesSplide.Components.AutoScroll?.pause()
    bottlesSplide.options.autoScroll = false
    bottlesSplide.emit("updated")
  }
}

function setScrollDirection(dir: ScrollDirection): void {
  if (scrollDirection === dir) return
  scrollDirection = dir
  syncAutoScrollOptions()
}

function destroyBottlesSplide(): void {
  if (bottlesSplide) {
    bottlesSplide.destroy(true)
    bottlesSplide = null
  }
}

function renderGrid(products: BottleProduct[]): void {
  const grid = document.querySelector<HTMLElement>(".collection-grid")
  if (!grid) return
  grid.innerHTML = products.map(buildProductCardMarkup).join("")
}

function renderCarouselList(products: BottleProduct[]): void {
  const list = document.querySelector<HTMLElement>(".bottles-splide .splide__list")
  if (!list) return
  list.innerHTML = products.map(buildCarouselSlideMarkup).join("")
}

function bindCarouselControls(): void {
  const section = document.querySelector<HTMLElement>(".collection-carousel")
  if (!section || section.dataset.controlsBound === "1") return

  section.dataset.controlsBound = "1"
  section.addEventListener("click", (e) => {
    const target = e.target as HTMLElement
    if (target.closest(".bottles-control--prev")) {
      setScrollDirection(1)
      bottlesSplide?.go("<")
    }
    if (target.closest(".bottles-control--next")) {
      setScrollDirection(-1)
      bottlesSplide?.go(">")
    }
  })
}

function bindSplideInteraction(): void {
  if (!bottlesSplide) return

  bottlesSplide.on("moved", (splide, index, prevIndex) => {
    if (typeof prevIndex !== "number" || index === prevIndex) return
    const delta = getIndexDelta(prevIndex, index, splide.length)
    if (delta > 0) setScrollDirection(-1)
    else if (delta < 0) setScrollDirection(1)
  })
}

function initBottlesSplide(): void {
  const splideRoot = document.querySelector<HTMLElement>(".bottles-splide")
  if (!splideRoot) return

  destroyBottlesSplide()

  const products = getSortedProducts()
  renderCarouselList(products)

  const useAutoScroll = canUseAutoScroll()

  bottlesSplide = new Splide(splideRoot, {
    type: "loop",
    perPage: 3,
    perMove: 1,
    focus: "center",
    gap: "1.25rem",
    pagination: false,
    arrows: false,
    drag: true,
    trimSpace: false,
    autoScroll: useAutoScroll ? autoScrollOptions() : false,
    breakpoints: {
      991: { perPage: 2 },
      767: { perPage: 1 },
    },
  })

  if (useAutoScroll) {
    bottlesSplide.mount({ AutoScroll })
  } else {
    bottlesSplide.mount()
  }

  bindSplideInteraction()
  bindCarouselControls()
  updateAutoScrollToggleUI()
}

function updateAutoScrollToggleUI(): void {
  const root = getRoot()
  const toggle = root?.querySelector<HTMLInputElement>("#bottles-autoscroll")
  const wrap = root?.querySelector<HTMLElement>(".collection-autoscroll")
  if (!toggle || !wrap) return

  const show = viewMode === "carousel"
  wrap.hidden = !show
  toggle.checked = autoScrollEnabled
  toggle.disabled = prefersReducedMotion()
  wrap.classList.toggle("is-disabled", prefersReducedMotion())
}

function updateViewVisibility(): void {
  const carousel = document.querySelector<HTMLElement>(".collection-carousel")
  const grid = document.querySelector<HTMLElement>(".collection-grid")
  const toggle = document.querySelector<HTMLElement>(".collection-view-toggle")

  if (carousel) {
    carousel.hidden = viewMode !== "carousel"
    carousel.classList.toggle("is-active", viewMode === "carousel")
  }
  if (grid) {
    grid.hidden = viewMode !== "grid"
    grid.classList.toggle("is-active", viewMode === "grid")
  }

  toggle?.querySelectorAll<HTMLButtonElement>("[data-bottles-view]").forEach((btn) => {
    const mode = btn.dataset.bottlesView as BottlesViewMode
    const pressed = mode === viewMode
    btn.setAttribute("aria-pressed", pressed ? "true" : "false")
    btn.classList.toggle("is-active", pressed)
  })

  updateAutoScrollToggleUI()
}

function applyView(mode: BottlesViewMode): void {
  viewMode = mode
  updateViewVisibility()

  if (mode === "carousel") {
    initBottlesSplide()
  } else {
    destroyBottlesSplide()
    renderGrid(getSortedProducts())
  }
}

function applySort(order: BottlesSortOrder): void {
  sortOrder = order
  if (viewMode === "carousel") {
    initBottlesSplide()
  } else {
    renderGrid(getSortedProducts())
  }
}

function setAutoScrollEnabled(enabled: boolean): void {
  autoScrollEnabled = enabled
  updateAutoScrollToggleUI()

  if (viewMode !== "carousel" || !bottlesSplide) return

  if (enabled && canUseAutoScroll()) {
    bottlesSplide.options.autoScroll = autoScrollOptions()
    bottlesSplide.emit("updated")
    bottlesSplide.Components.AutoScroll?.play()
  } else {
    bottlesSplide.Components.AutoScroll?.pause()
    bottlesSplide.options.autoScroll = false
    bottlesSplide.emit("updated")
  }
}

function bindToolbar(): void {
  const root = getRoot()
  if (!root || root.dataset.toolbarBound === "1") return

  root.dataset.toolbarBound = "1"

  const viewToggle = root.querySelector<HTMLElement>(".collection-view-toggle")
  viewToggle?.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-bottles-view]")
    if (!btn?.dataset.bottlesView) return
    applyView(btn.dataset.bottlesView as BottlesViewMode)
  })

  const sortSelect = root.querySelector<HTMLSelectElement>("#bottles-sort")
  sortSelect?.addEventListener("change", () => {
    applySort((sortSelect.value as BottlesSortOrder) || "catalog")
  })

  const autoScrollToggle = root.querySelector<HTMLInputElement>("#bottles-autoscroll")
  autoScrollToggle?.addEventListener("change", () => {
    setAutoScrollEnabled(autoScrollToggle.checked)
  })
}

function buildSortSelect(): string {
  return SORT_OPTIONS.map(
    (opt) =>
      `<option value="${opt.value}"${opt.value === sortOrder ? " selected" : ""}>${opt.label}</option>`,
  ).join("")
}

export function initBottlesCollectionPage(): void {
  const root = getRoot()
  if (!root) return

  destroyBottlesCollectionPage()

  if (prefersReducedMotion()) {
    autoScrollEnabled = false
  }

  const sortSelect = root.querySelector<HTMLSelectElement>("#bottles-sort")
  if (sortSelect) {
    sortSelect.innerHTML = buildSortSelect()
    sortOrder = (sortSelect.value as BottlesSortOrder) || "catalog"
  }

  const autoScrollToggle = root.querySelector<HTMLInputElement>("#bottles-autoscroll")
  if (autoScrollToggle && !prefersReducedMotion()) {
    autoScrollEnabled = autoScrollToggle.checked
  }

  bindToolbar()
  applyView(viewMode)
}

export function destroyBottlesCollectionPage(): void {
  destroyBottlesSplide()

  const root = getRoot()
  if (root) {
    delete root.dataset.toolbarBound
  }

  const section = document.querySelector<HTMLElement>(".collection-carousel")
  if (section) delete section.dataset.controlsBound

  const grid = document.querySelector<HTMLElement>(".collection-grid")
  if (grid) grid.innerHTML = ""

  const list = document.querySelector<HTMLElement>(".bottles-splide .splide__list")
  if (list) list.innerHTML = ""
}
