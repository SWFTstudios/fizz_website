/**
 * Click tracing. Enable with ?debugClicks=1 only.
 */
const ENABLED = new URLSearchParams(window.location.search).has("debugClicks")

function describeTarget(target: EventTarget | null): string {
  if (!(target instanceof Element)) return String(target)
  const id = target.id ? `#${target.id}` : ""
  const classes =
    target.classList.length > 0 ? `.${Array.from(target.classList).join(".")}` : ""
  return `${target.tagName.toLowerCase()}${id}${classes}`
}

function logClick(phase: string, e: MouseEvent): void {
  const target = e.target
  const card = target instanceof Element ? target.closest(".zs-card") : null
  const pe =
    target instanceof HTMLElement ? getComputedStyle(target).pointerEvents : "n/a"
  console.log(`[click-debug] ${phase}`, {
    page: document.body.dataset.barbaNamespace ?? window.location.pathname,
    target: describeTarget(target),
    cardIndex: card instanceof HTMLElement ? card.dataset.index : null,
    pointerEvents: pe,
    defaultPrevented: e.defaultPrevented,
    x: e.clientX,
    y: e.clientY,
  })
}

export function installClickDebug(): void {
  if (!ENABLED) return

  console.log("[click-debug] installed (capture phase). Add ?debugClicks=1 to force in production builds.")

  document.addEventListener(
    "click",
    (e) => {
      logClick("click", e)
    },
    true,
  )

  document.addEventListener(
    "pointerdown",
    (e) => {
      if (!(e instanceof PointerEvent)) return
      logClick("pointerdown", e)
    },
    true,
  )
}

export function clickDebugLog(tag: string, detail?: Record<string, unknown>): void {
  if (!ENABLED) return
  console.log(`[click-debug] ${tag}`, detail ?? {})
}
