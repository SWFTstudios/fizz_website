const SLIDE_THEMES: Record<string, { bg: string; color: string; contentColor: string }> = {
  "is--slide--1": { bg: "#a8d0e4", color: "#204b6d", contentColor: "#204b6d" },
  "is--slide--2": { bg: "#030303", color: "#ffffff", contentColor: "#ffffff" },
  "is--slide--3": { bg: "#ff8b2c", color: "#2e1600", contentColor: "#2e1600" },
  "is--slide--4": { bg: "#37bb6f", color: "#0b2d1b", contentColor: "#0b2d1b" },
  "is--slide--5": { bg: "#8f6bff", color: "#ffffff", contentColor: "#ffffff" },
}

let autoRotateTimer: number | null = null

export function initHeroSlider(): void {
  const track = document.querySelector<HTMLElement>(".hero-track")
  const heroSection = document.getElementById("hero--content")
  const heroSlider = document.querySelector<HTMLElement>(".hero-slider")
  const heroContent = document.getElementById("hero-content-container")
  const slides = Array.from(document.querySelectorAll<HTMLElement>(".hero-slider .w-slide"))
  if (!track || slides.length === 0) return

  let activeIndex = 0

  const applyTheme = (slideId: string): void => {
    const theme = SLIDE_THEMES[slideId]
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

  const ensureNavDots = (): HTMLElement | null => {
    const existingNav = document.querySelector<HTMLElement>(".hero-slider .w-slider-nav")
    if (existingNav) return existingNav

    const nav = document.createElement("div")
    nav.className = "w-slider-nav w-slider-nav-invert w-round"
    const slider = document.querySelector<HTMLElement>(".hero-slider")
    if (!slider) return null
    slider.appendChild(nav)
    return nav
  }

  const nav = ensureNavDots()

  const setActiveDots = (): void => {
    if (!nav) return
    const dots = Array.from(nav.querySelectorAll<HTMLElement>(".w-slider-dot"))
    dots.forEach((dot, i) => {
      dot.classList.toggle("w-active", i === activeIndex)
      dot.setAttribute("aria-current", i === activeIndex ? "true" : "false")
    })
  }

  // Create dots if they're missing (Webflow usually injects these via its runtime JS).
  if (nav && nav.querySelectorAll(".w-slider-dot").length === 0) {
    nav.innerHTML = ""
    slides.forEach((_, i) => {
      const dot = document.createElement("button")
      dot.type = "button"
      dot.className = "w-slider-dot fizz-slider-dot"
      dot.setAttribute("aria-label", `Go to slide ${i + 1}`)
      dot.setAttribute("aria-current", i === 0 ? "true" : "false")
      dot.addEventListener("click", () => setActiveSlide(i))
      nav.appendChild(dot)
    })
  }

  const setActiveSlide = (index: number): void => {
    activeIndex = index
    slides.forEach((slide, i) => {
      slide.classList.toggle("is-active", i === index)
      slide.setAttribute("aria-hidden", i === index ? "false" : "true")
    })
    setActiveDots()
    const id = slides[index]?.id
    if (id) applyTheme(id)
  }

  setActiveSlide(0)

  // Theme sync using IntersectionObserver (avoid relying solely on the timer).
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
    if (s.id && SLIDE_THEMES[s.id]) observer.observe(s)
  })

  const left = document.querySelector<HTMLElement>(".video-bg_wrapper .w-slider-arrow-left")
  const right = document.querySelector<HTMLElement>(".video-bg_wrapper .w-slider-arrow-right")
  left?.addEventListener("click", () => {
    setActiveSlide((activeIndex - 1 + slides.length) % slides.length)
  })
  right?.addEventListener("click", () => {
    setActiveSlide((activeIndex + 1) % slides.length)
  })

  if (autoRotateTimer !== null) {
    window.clearInterval(autoRotateTimer)
  }

  autoRotateTimer = window.setInterval(() => {
    setActiveSlide((activeIndex + 1) % slides.length)
  }, 4000)
}

export function initLogoMarquee(): void {
  document.querySelectorAll<HTMLElement>(".carousel-div-wrapper .hflex").forEach((row) => {
    // Prevent exponential DOM growth when Home re-inits after Barba navigation.
    if (row.dataset.marqueeDuped === "1") return
    row.innerHTML = row.innerHTML + row.innerHTML
    row.dataset.marqueeDuped = "1"
  })
}

export function initNavToggle(): void {
  const button = document.querySelector<HTMLElement>(".w-nav-button")
  const menu = document.querySelector<HTMLElement>(".w-nav-menu")
  if (!button || !menu) return

  button.addEventListener("click", () => {
    const open = menu.classList.toggle("is-open")
    button.setAttribute("aria-expanded", open ? "true" : "false")
  })
}
