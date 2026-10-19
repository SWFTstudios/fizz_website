/**
 * Cylindrical / coverflow warp for homepage Webflow sliders.
 * Transforms the inner card (.basic-slide-wrapper / .product-slide-card)
 * from each slide's distance to the viewport center — keeps w-slider drag intact.
 */
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var SELECTORS = ['.basic-slider', '.product-slider'];
  var CARD = '.basic-slide-wrapper, .product-slide-card';
  var MAX_ROTATE = 28; // deg
  var MAX_SCALE_DROP = 0.12;
  var MAX_Z = 60; // px

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function warpSlider(slider) {
    var slides = slider.querySelectorAll('.w-slide');
    if (!slides.length) return;

    var vx = window.innerWidth / 2;

    for (var i = 0; i < slides.length; i++) {
      var slide = slides[i];
      var card = slide.querySelector(CARD);
      if (!card) continue;

      var rect = slide.getBoundingClientRect();
      if (rect.width < 1) continue;

      var cx = rect.left + rect.width / 2;
      var x = (cx - vx) / rect.width;
      var ax = Math.min(Math.abs(x), 1.35);
      var rotate = clamp(x * -MAX_ROTATE, -MAX_ROTATE, MAX_ROTATE);
      var scale = 1 - Math.min(ax, 1) * MAX_SCALE_DROP;
      var z = -Math.min(ax, 1) * MAX_Z;

      card.style.transform =
        'translateZ(' + z.toFixed(2) + 'px) rotateY(' + rotate.toFixed(2) + 'deg) scale(' + scale.toFixed(4) + ')';
    }
  }

  var sliders = [];
  for (var s = 0; s < SELECTORS.length; s++) {
    var found = document.querySelectorAll(SELECTORS[s]);
    for (var f = 0; f < found.length; f++) sliders.push(found[f]);
  }
  if (!sliders.length) return;

  var ticking = false;
  function tick() {
    ticking = false;
    for (var i = 0; i < sliders.length; i++) warpSlider(sliders[i]);
  }
  function requestTick() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(tick);
  }

  // Keep updating while Webflow tram animates / user drags
  var loopOn = false;
  function startLoop() {
    if (loopOn) return;
    loopOn = true;
    (function loop() {
      tick();
      if (loopOn) requestAnimationFrame(loop);
    })();
  }
  function stopLoopSoon() {
    window.setTimeout(function () {
      loopOn = false;
      requestTick();
    }, 700);
  }

  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick);
  document.addEventListener('pointerdown', startLoop, true);
  document.addEventListener('pointerup', stopLoopSoon, true);
  document.addEventListener('touchend', stopLoopSoon, true);

  sliders.forEach(function (slider) {
    slider.addEventListener('mousedown', startLoop);
    slider.addEventListener('touchstart', startLoop, { passive: true });
    var arrows = slider.querySelectorAll('.w-slider-arrow-left, .w-slider-arrow-right, .w-slider-dot');
    for (var a = 0; a < arrows.length; a++) {
      arrows[a].addEventListener('click', function () {
        startLoop();
        stopLoopSoon();
      });
    }
  });

  // Initial + short settle after Webflow layout
  requestTick();
  window.setTimeout(requestTick, 100);
  window.setTimeout(requestTick, 500);
  startLoop();
  stopLoopSoon();
})();
