import { HERO_SLIDE_THEMES } from "../data/heroSlides"

let autoRotateTimer: number | null = null
let navToggleBound = false
let autoRotatePaused = false
let scrollControlsSlides = true

let setActiveSlideRef: ((index: number) => void) | null = null
let slidesRef: HTMLElement[] = []
let activeIndexRef = 0

function syncHeroSlideVideos(slides: HTMLElement[], activeIndex: number): void {
  slides.forEach((slide, i) => {
    const video = slide.querySelector<HTMLVideoElement>("video")
    if (!video) return
    if (i === activeIndex) {
      video.preload = "auto"
      void video.play().catch(() => {
        /* Autoplay may be blocked until user gesture. */
      })
    } else {
      video.pause()
      video.preload = "none"
    }
  })
}

export function pauseHeroAutoRotate(): void {
  autoRotatePaused = true
  if (autoRotateTimer !== null) {
    window.clearInterval(autoRotateTimer)
    autoRotateTimer = null
  }
}

export function resumeHeroAutoRotate(): void {
  if (!scrollControlsSlides) return
  autoRotatePaused = false
  scrollControlsSlides = false
  if (autoRotateTimer !== null) window.clearInterval(autoRotateTimer)
  if (!setActiveSlideRef || slidesRef.length === 0) return
  autoRotateTimer = window.setInterval(() => {
    if (autoRotatePaused) return
    setActiveSlideRef!((activeIndexRef + 1) % slidesRef.length)
  }, 4000)
}

/** Scroll choreography may drive slides before auto-rotate resumes. */
export function goToHeroSlide(index: number): void {
  if (setActiveSlideRef && index >= 0 && index < slidesRef.length) {
    setActiveSlideRef(index)
  }
}

export function isHeroScrollControllingSlides(): boolean {
  return scrollControlsSlides
}

export function initHeroSlider(): void {
  const track = document.querySelector<HTMLElement>(".hero-track")
  const heroSection = document.getElementById("hero--content")
  const heroSlider = document.querySelector<HTMLElement>(".hero-slider")
  const heroContent = document.getElementById("hero-content-container")
  const slides = Array.from(document.querySelectorAll<HTMLElement>(".hero-slider .w-slide"))
  if (!track || slides.length === 0) return

  slidesRef = slides
  let activeIndex = slides.findIndex((s) => s.classList.contains("is-active"))
  if (activeIndex < 0) activeIndex = 0
  activeIndexRef = activeIndex

  const applyTheme = (slideId: string): void => {
    const theme = HERO_SLIDE_THEMES[slideId]
    if (!theme) return
    track.style.backgroundColor = theme.bg
    track.style.color = theme.color
    track.dataset.slideTheme = slideId
    if (heroSection) {
      heroSection.style.backgroundColor = theme.bg
      heroSection.style.color = theme.color
    }
    if (heroSlider) {
      heroSlider.dataset.slideTheme = slideId
    }
    if (heroContent) {
      heroContent.style.transition = "color 200ms ease-in-out"
      heroContent.style.color = theme.contentColor
    }
  }

  const setActiveSlide = (index: number): void => {
    activeIndex = index
    activeIndexRef = index
    slides.forEach((slide, i) => {
      slide.classList.toggle("is-active", i === index)
      slide.setAttribute("aria-hidden", i === index ? "false" : "true")
    })
    syncHeroSlideVideos(slides, index)
    const id = slides[index]?.id
    if (id) {
      applyTheme(id)
      track.dispatchEvent(new CustomEvent("hero-slide-change", { detail: { slideId: id } }))
    }
  }

  setActiveSlideRef = setActiveSlide

  track.addEventListener("hero-goto-slide", ((e: CustomEvent<{ index: number }>) => {
    const idx = e.detail?.index
    if (typeof idx === "number" && idx >= 0 && idx < slides.length) {
      setActiveSlide(idx)
    }
  }) as EventListener)

  if (heroSlider) heroSlider.dataset.sliderReady = "1"

  const startAutoRotate = (): void => {
    if (autoRotatePaused || scrollControlsSlides) return
    if (autoRotateTimer !== null) window.clearInterval(autoRotateTimer)
    autoRotateTimer = window.setInterval(() => {
      if (autoRotatePaused) return
      setActiveSlide((activeIndex + 1) % slides.length)
    }, 4000)
  }

  if (track.dataset.heroSliderInited === "1") {
    pauseHeroAutoRotate()
    scrollControlsSlides = !track.hasAttribute("data-hero-scroll-complete")
    if (!scrollControlsSlides) {
      autoRotatePaused = false
      startAutoRotate()
    }
    setActiveSlide(activeIndex)
    return
  }
  track.dataset.heroSliderInited = "1"

  pauseHeroAutoRotate()

  setActiveSlide(activeIndex)

  const initialId = slides[activeIndex]?.id
  if (initialId) {
    track.dispatchEvent(new CustomEvent("hero-slide-change", { detail: { slideId: initialId } }))
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const el = entry.target as HTMLElement
        const id = el.id
        if (id) applyTheme(id)
      }
    },
    { threshold: 0.5 },
  )
  slides.forEach((s) => {
    if (s.id && HERO_SLIDE_THEMES[s.id]) observer.observe(s)
  })

  const left = document.querySelector<HTMLElement>(".video-bg_wrapper .w-slider-arrow-left")
  const right = document.querySelector<HTMLElement>(".video-bg_wrapper .w-slider-arrow-right")
  left?.addEventListener("click", () => {
    setActiveSlide((activeIndex - 1 + slides.length) % slides.length)
  })
  right?.addEventListener("click", () => {
    setActiveSlide((activeIndex + 1) % slides.length)
  })
}

export function initLogoMarquee(): void {
  document.querySelectorAll<HTMLElement>(".carousel-div-wrapper .hflex").forEach((row) => {
    if (row.dataset.marqueeDuped === "1") return
    row.innerHTML = row.innerHTML + row.innerHTML
    row.dataset.marqueeDuped = "1"
  })
}

export function initNavToggle(): void {
  const button = document.querySelector<HTMLElement>(".w-nav-button")
  const menu = document.querySelector<HTMLElement>(".w-nav-menu")
  if (!button || !menu) return
  if (navToggleBound) return
  navToggleBound = true

  button.addEventListener("click", () => {
    const open = menu.classList.toggle("is-open")
    button.setAttribute("aria-expanded", open ? "true" : "false")
  })
}
