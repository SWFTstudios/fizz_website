/**
 * Fizz Kinetic Spark theme interactions
 */
(function () {
  function initHeroSlideshow(root) {
    const slides = root.querySelectorAll(".hero-slide");
    if (slides.length < 2) return;
    let current = 0;
    setInterval(() => {
      slides[current].classList.remove("active");
      current = (current + 1) % slides.length;
      slides[current].classList.add("active");
    }, 5000);
  }

  function initHotspots(root) {
    root.querySelectorAll(".ks-hotspot-trigger").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const hotspot = btn.closest(".ks-hotspot");
        const open = hotspot.classList.contains("is-open");
        root.querySelectorAll(".ks-hotspot.is-open").forEach((el) => {
          el.classList.remove("is-open");
        });
        if (!open) hotspot.classList.add("is-open");
      });
    });
    document.addEventListener("click", () => {
      root.querySelectorAll(".ks-hotspot.is-open").forEach((el) => {
        el.classList.remove("is-open");
      });
    });
  }

  async function quickAdd(variantId, button) {
    if (!variantId) return;
    const original = button.textContent;
    button.disabled = true;
    button.textContent = "ADDING…";
    try {
      const res = await fetch(window.Shopify.routes.root + "cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [{ id: variantId, quantity: 1 }] }),
      });
      if (!res.ok) throw new Error("Add failed");
      button.textContent = "ADDED";
      setTimeout(() => {
        button.textContent = original;
        button.disabled = false;
      }, 1500);
    } catch {
      button.textContent = "ERROR";
      button.disabled = false;
    }
  }

  function initQuickAdd(root) {
    root.querySelectorAll("[data-ks-quick-add]").forEach((btn) => {
      btn.addEventListener("click", () => {
        quickAdd(btn.dataset.ksQuickAdd, btn);
      });
    });
  }

  function initSectionReveal(root) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100", "translate-y-0");
            entry.target.classList.remove("opacity-0", "translate-y-10");
          }
        });
      },
      { threshold: 0.1 },
    );
    root.querySelectorAll(".ks-reveal").forEach((el) => observer.observe(el));
  }

  function init(root) {
    if (!root) return;
    initHeroSlideshow(root);
    initHotspots(root);
    initQuickAdd(root);
    initSectionReveal(root);
  }

  document.addEventListener("DOMContentLoaded", () => init(document.body));
  document.addEventListener("shopify:section:load", (e) => init(e.target));
})();
