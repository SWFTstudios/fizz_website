(function () {
  var THEMES = {
    "slide-1": {
      trackBg: "#a8d0e4",
      textColor: "#204b6d",
      contentColor: "#204b6d",
      logoFilter: "sepia(1) hue-rotate(175deg) saturate(2.6) brightness(0.6) contrast(1.08)",
      logoFilterEven: "brightness(1.25) contrast(1.05)",
      dotActive: "#204b6d",
      dotInactive: "rgba(32, 75, 109, 0.35)",
      navTheme: "light",
    },
    "slide-2": {
      trackBg: "#030303",
      textColor: "#ffffff",
      contentColor: "#ffffff",
      logoFilter: "brightness(1.6) contrast(1.05)",
      dotActive: "#ffffff",
      dotInactive: "rgba(255, 255, 255, 0.35)",
      navTheme: "dark",
    },
    "slide-3": {
      trackBg: "#d95d07",
      textColor: "#2e1600",
      contentColor: "#2e1600",
      logoFilter: "sepia(1) hue-rotate(326deg) saturate(3.2) brightness(1.05) contrast(1.05)",
      dotActive: "#2e1600",
      dotInactive: "rgba(46, 22, 0, 0.35)",
      navTheme: "light",
    },
    "slide-4": {
      trackBg: "#1e2530",
      textColor: "#ffffff",
      contentColor: "#ffffff",
      logoFilter: "brightness(1.55) contrast(1.05)",
      dotActive: "#ffffff",
      dotInactive: "rgba(255, 255, 255, 0.35)",
      navTheme: "dark",
    },
    "slide-5": {
      trackBg: "#c5d3bc",
      textColor: "#1a2418",
      contentColor: "#1a2418",
      logoFilter: "sepia(1) hue-rotate(68deg) saturate(1.4) brightness(0.92) contrast(1.04)",
      dotActive: "#1a2418",
      dotInactive: "rgba(26, 36, 24, 0.35)",
      navTheme: "light",
    },
    "slide-6": {
      trackBg: "#2c4557",
      textColor: "#ffffff",
      contentColor: "#ffffff",
      logoFilter: "sepia(1) hue-rotate(195deg) saturate(2.8) brightness(1.1) contrast(1.05)",
      dotActive: "#ffffff",
      dotInactive: "rgba(255, 255, 255, 0.35)",
      navTheme: "dark",
    },
    "slide-7": {
      trackBg: "#e8e8e8",
      textColor: "#1a1a1a",
      contentColor: "#1a1a1a",
      logoFilter: "sepia(1) hue-rotate(180deg) saturate(0.35) brightness(0.38) contrast(1.1)",
      dotActive: "#1a1a1a",
      dotInactive: "rgba(26, 26, 26, 0.35)",
      navTheme: "light",
    },
    "slide-8": {
      trackBg: "#4a5ca6",
      textColor: "#ffffff",
      contentColor: "#ffffff",
      logoFilter: "sepia(1) hue-rotate(210deg) saturate(3.2) brightness(1.15) contrast(1.04)",
      dotActive: "#ffffff",
      dotInactive: "rgba(255, 255, 255, 0.35)",
      navTheme: "dark",
    },
  };

  function initHeroScroll(root) {
    var track = root.querySelector("[data-fizz-hero-track]");
    var videoWrapper = root.querySelector("[data-fizz-video-bg]");
    var carousel = root.querySelector("[data-fizz-carousel]");
    if (!track || !videoWrapper) return;
    if (track.dataset.scrollEnabled === "false") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

    var scaleEnd = parseFloat(track.dataset.scrollScaleEnd || "0.76");
    if (Number.isNaN(scaleEnd)) scaleEnd = 0.76;

    gsap.registerPlugin(ScrollTrigger);

    gsap.fromTo(
      videoWrapper,
      { scale: 1 },
      {
        scale: scaleEnd,
        ease: "none",
        scrollTrigger: {
          trigger: track,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.5,
          invalidateOnRefresh: true,
        },
      }
    );

    if (carousel) {
      ScrollTrigger.create({
        trigger: track,
        start: "top top",
        end: "bottom top",
        onLeave: function () {
          carousel.style.visibility = "hidden";
        },
        onEnterBack: function () {
          carousel.style.visibility = "visible";
        },
      });
    }
  }

  function initHero(root) {
    var track = root.querySelector("[data-fizz-hero-track]");
    var slider = root.querySelector("[data-fizz-hero-slider]");
    var content = root.querySelector("[data-fizz-hero-content]");
    var slides = Array.from(root.querySelectorAll("[data-fizz-hero-slide]"));
    var dotsWrap = root.querySelector("[data-fizz-hero-dots]");
    var logos = root.querySelectorAll(".fizz-carousel-image");
    var nav = document.querySelector("[data-fizz-nav]");
    if (!track || !slides.length) return;

    var activeIndex = 0;
    var autoplayMs = parseInt(root.dataset.autoplayMs || "4000", 10);
    var timer = null;

    function applyTheme(themeId) {
      var theme = THEMES[themeId];
      if (!theme) return;
      track.style.backgroundColor = theme.trackBg;
      track.style.color = theme.textColor;
      track.dataset.slideTheme = themeId;
      if (slider) slider.dataset.slideTheme = themeId;
      if (content) content.style.color = theme.contentColor;
      track.style.setProperty("--fizz-dot-active", theme.dotActive);
      track.style.setProperty("--fizz-dot-inactive", theme.dotInactive);
      if (nav) {
        nav.dataset.navTheme = theme.navTheme;
        nav.style.setProperty("--fizz-nav-fg", theme.contentColor);
      }
      logos.forEach(function (img, i) {
        var filter = theme.logoFilter;
        if (themeId === "slide-1" && i % 2 === 1 && theme.logoFilterEven) {
          filter = theme.logoFilterEven;
        }
        img.style.filter = filter;
      });
      if (dotsWrap) {
        dotsWrap.querySelectorAll(".fizz-hero-dot").forEach(function (dot, i) {
          dot.style.backgroundColor = i === activeIndex ? theme.dotActive : theme.dotInactive;
        });
      }
    }

    function setActive(index) {
      activeIndex = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === activeIndex);
        slide.setAttribute("aria-hidden", i === activeIndex ? "false" : "true");
      });
      if (dotsWrap) {
        dotsWrap.querySelectorAll(".fizz-hero-dot").forEach(function (dot, i) {
          dot.classList.toggle("is-active", i === activeIndex);
          dot.setAttribute("aria-current", i === activeIndex ? "true" : "false");
        });
      }
      var themeId = slides[activeIndex].dataset.themePreset;
      if (themeId) applyTheme(themeId);
    }

    if (dotsWrap && !dotsWrap.children.length) {
      slides.forEach(function (_, i) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "fizz-hero-dot";
        dot.setAttribute("aria-label", "Go to slide " + (i + 1));
        dot.addEventListener("click", function () {
          setActive(i);
          restartAutoplay();
        });
        dotsWrap.appendChild(dot);
      });
    }

    root.querySelector("[data-fizz-prev]")?.addEventListener("click", function () {
      setActive(activeIndex - 1);
      restartAutoplay();
    });
    root.querySelector("[data-fizz-next]")?.addEventListener("click", function () {
      setActive(activeIndex + 1);
      restartAutoplay();
    });

    function restartAutoplay() {
      if (timer) clearInterval(timer);
      if (autoplayMs > 0) {
        timer = setInterval(function () {
          setActive(activeIndex + 1);
        }, autoplayMs);
      }
    }

    root.querySelectorAll(".fizz-carousel-div-wrapper .fizz-carousel-flex").forEach(function (row) {
      if (row.dataset.marqueeDuped === "1") return;
      row.innerHTML = row.innerHTML + row.innerHTML;
      row.dataset.marqueeDuped = "1";
    });

    setActive(0);
    restartAutoplay();
  }

  function initAllHeroScroll() {
    document.querySelectorAll("[data-fizz-hero]").forEach(initHeroScroll);
  }

  function initMobileHeroImages() {
    var mq = window.matchMedia("(max-width: 767px)");
    function apply() {
      document.querySelectorAll(".fizz-hero-lifestyle").forEach(function (img) {
        var mobile = img.getAttribute("data-mobile-src");
        var desktop = img.getAttribute("data-desktop-src") || img.getAttribute("src");
        if (!mobile || !desktop) return;
        img.setAttribute("src", mq.matches ? mobile : desktop);
      });
    }
    apply();
    mq.addEventListener("change", apply);
  }

  function initCollectionRails() {
    document.querySelectorAll("[data-fizz-collections-rail]").forEach(function (root) {
      var track = root.querySelector("[data-fizz-rail-track]");
      var prev = root.querySelector("[data-fizz-rail-prev]");
      var next = root.querySelector("[data-fizz-rail-next]");
      if (!track || !prev || !next) return;
      var card = track.querySelector(".fizz-product-card");
      var step = card ? card.getBoundingClientRect().width + 16 : 296;
      prev.addEventListener("click", function () {
        track.scrollBy({ left: -step, behavior: "smooth" });
      });
      next.addEventListener("click", function () {
        track.scrollBy({ left: step, behavior: "smooth" });
      });
    });
  }

  function boot() {
    document.querySelectorAll("[data-fizz-hero]").forEach(initHero);
    initAllHeroScroll();
    initMobileHeroImages();
    initCollectionRails();

    window.addEventListener("load", function () {
      if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
    });
    window.addEventListener("resize", function () {
      if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
