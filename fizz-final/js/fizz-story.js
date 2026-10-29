/**
 * Fizz homepage — "Meet the bottle" scroll story, plus the hero's "Scroll to explore" cue.
 *
 * The section is three screens tall; its stage stays pinned while the page scrolls through
 * three chapters (the Fizz Bottle → the canister → your colorway). Scroll progress picks
 * the chapter, fills the progress bars and sets data-chapter on the section, which the CSS
 * uses to move the bottle and bring in the actual-size canister photo. Points on the bottle
 * open short feature notes ("tap for more"), and the colorway swatches swap the bottle.
 * Horizontal swipe / drag and prev/next arrows also advance chapters like a slideshow,
 * staying in sync with scroll position.
 *
 * Without motion (prefers-reduced-motion) nothing is pinned: chapters simply stack.
 */
(function () {
  'use strict';

  var section = document.querySelector('[data-fizz-story]');
  if (!section) return;

  var root = document.documentElement;
  var motion = root.classList.contains('fizz-motion');
  var chapters = Array.prototype.slice.call(section.querySelectorAll('[data-story-chapter]'));
  var bars = Array.prototype.slice.call(section.querySelectorAll('[data-story-go]'));
  var indexEl = section.querySelector('[data-story-index]');
  var bottle = section.querySelector('[data-story-bottle]');
  var spots = Array.prototype.slice.call(section.querySelectorAll('[data-story-spot]'));
  var pops = Array.prototype.slice.call(section.querySelectorAll('[data-story-pop]'));
  var swatches = Array.prototype.slice.call(section.querySelectorAll('[data-story-color]'));
  var stage = section.querySelector('.fizz-story-stage');
  var prevBtn = section.querySelector('[data-story-prev]');
  var nextBtn = section.querySelector('[data-story-next]');
  var N = chapters.length;
  var FOCUS_SPOT = ['lid', 'base', null]; // the point each chapter draws the eye to

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* ---------- Tap for more: points on the bottle ---------- */

  function closePops(except) {
    spots.forEach(function (s) {
      var open = s.getAttribute('data-story-spot') === except;
      s.setAttribute('aria-expanded', open ? 'true' : 'false');
      s.classList.toggle('is-open', open);
    });
    pops.forEach(function (p) { p.hidden = p.getAttribute('data-story-pop') !== except; });
  }
  spots.forEach(function (spot) {
    spot.addEventListener('click', function (e) {
      e.stopPropagation();
      var name = spot.getAttribute('data-story-spot');
      closePops(spot.getAttribute('aria-expanded') === 'true' ? null : name);
    });
  });
  document.addEventListener('click', function (e) {
    if (!(e.target instanceof Element) || !e.target.closest('[data-story-pop]')) closePops(null);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePops(null); });

  /* ---------- Colorway ---------- */

  swatches.forEach(function (sw) {
    sw.addEventListener('click', function () {
      swatches.forEach(function (o) {
        o.classList.toggle('is-active', o === sw);
        o.setAttribute('aria-checked', o === sw ? 'true' : 'false');
      });
      var name = sw.getAttribute('data-story-color');
      if (bottle) {
        bottle.classList.add('is-swapping');
        setTimeout(function () {
          bottle.removeAttribute('srcset');
          bottle.src = sw.getAttribute('data-src');
          bottle.alt = 'Fizz Bottle in ' + name;
          bottle.classList.remove('is-swapping');
        }, 220);
      }
    });
  });

  /* ---------- Scroll-driven chapters ---------- */

  var active = -1;
  function setChapter(i) {
    if (i === active) return;
    active = i;
    section.setAttribute('data-chapter', String(i));
    chapters.forEach(function (c, k) {
      c.classList.toggle('is-active', k === i);
      c.setAttribute('aria-hidden', k === i ? 'false' : 'true');
      c.inert = k !== i;
    });
    bars.forEach(function (b, k) {
      b.classList.toggle('is-active', k === i);
      b.setAttribute('aria-selected', k === i ? 'true' : 'false');
    });
    if (indexEl) indexEl.textContent = ('0' + (i + 1)).slice(-2);
    spots.forEach(function (s) { s.classList.toggle('is-focus', s.getAttribute('data-story-spot') === FOCUS_SPOT[i]); });
    if (prevBtn) prevBtn.disabled = i <= 0;
    if (nextBtn) nextBtn.disabled = i >= N - 1;
    closePops(null);
  }

  if (!motion) {
    chapters.forEach(function (c) { c.classList.add('is-active'); });
    return;
  }
  section.classList.add('is-live');

  function goToChapter(k, behavior) {
    k = clamp(k, 0, N - 1);
    var span = section.offsetHeight - window.innerHeight;
    if (span <= 0) {
      setChapter(k);
      return;
    }
    var top = section.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + span * ((k + 0.08) / N), behavior: behavior || 'smooth' });
  }

  var ticking = false;
  function update() {
    ticking = false;
    var rect = section.getBoundingClientRect();
    var span = section.offsetHeight - window.innerHeight;
    if (span <= 0) return;
    var p = clamp(-rect.top / span, 0, 1);
    section.style.setProperty('--story-p', p.toFixed(4));
    bars.forEach(function (b, k) { b.style.setProperty('--fill', clamp(p * N - k, 0, 1).toFixed(3)); });
    setChapter(Math.min(N - 1, Math.floor(p * N)));
  }
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();

  bars.forEach(function (b, k) {
    b.addEventListener('click', function () { goToChapter(k); });
  });
  if (prevBtn) prevBtn.addEventListener('click', function () { goToChapter(active - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { goToChapter(active + 1); });

  /* ---------- Swipe / drag slideshow (whole pinned stage) ---------- */

  (function bindSwipe() {
    var surface = stage || section;
    if (!surface) return;

    var startX = 0;
    var startY = 0;
    var tracking = false;
    var axis = null; // 'x' | 'y' | null
    var pointerId = null;
    var SWIPE = 36;
    var LOCK = 10;

    function ignoreTarget(el) {
      return !!(el && el.closest && el.closest(
        '[data-story-spot], [data-story-pop], [data-story-color], [data-story-go], [data-story-prev], [data-story-next], a, button, input, label'
      ));
    }

    function point(e) {
      if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      if (e.changedTouches && e.changedTouches[0]) {
        return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
      }
      return { x: e.clientX, y: e.clientY };
    }

    function begin(e) {
      if (e.type === 'pointerdown' && e.pointerType === 'mouse' && e.button !== 0) return;
      if (ignoreTarget(e.target)) return;
      var p = point(e);
      tracking = true;
      axis = null;
      startX = p.x;
      startY = p.y;
      pointerId = e.pointerId != null ? e.pointerId : 'touch';
      surface.classList.add('is-swiping');
      if (e.pointerId != null) {
        try { surface.setPointerCapture(e.pointerId); } catch (err) {}
      }
    }

    function move(e) {
      if (!tracking) return;
      if (pointerId !== 'touch' && e.pointerId != null && e.pointerId !== pointerId) return;
      var p = point(e);
      var dx = p.x - startX;
      var dy = p.y - startY;
      if (!axis) {
        if (Math.abs(dx) < LOCK && Math.abs(dy) < LOCK) return;
        axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (axis === 'y') {
          // Let the page keep scrolling; abandon this gesture.
          tracking = false;
          surface.classList.remove('is-swiping');
          if (e.pointerId != null) {
            try { surface.releasePointerCapture(e.pointerId); } catch (err) {}
          }
          return;
        }
      }
      if (axis === 'x') {
        if (e.cancelable) e.preventDefault();
      }
    }

    function end(e) {
      if (!tracking) return;
      if (pointerId !== 'touch' && e.pointerId != null && e.pointerId !== pointerId) return;
      var p = point(e);
      var dx = p.x - startX;
      var dy = p.y - startY;
      var wasX = axis === 'x';
      tracking = false;
      axis = null;
      pointerId = null;
      surface.classList.remove('is-swiping');
      if (e.pointerId != null) {
        try { surface.releasePointerCapture(e.pointerId); } catch (err) {}
      }
      if (!wasX) return;
      if (Math.abs(dx) < SWIPE || Math.abs(dx) <= Math.abs(dy)) return;
      if (dx < 0) goToChapter(active + 1);
      else goToChapter(active - 1);
    }

    surface.classList.add('is-swipeable');
    if (window.PointerEvent) {
      surface.addEventListener('pointerdown', begin);
      surface.addEventListener('pointermove', move, { passive: false });
      surface.addEventListener('pointerup', end);
      surface.addEventListener('pointercancel', end);
    } else {
      surface.addEventListener('touchstart', begin, { passive: true });
      surface.addEventListener('touchmove', move, { passive: false });
      surface.addEventListener('touchend', end);
      surface.addEventListener('touchcancel', end);
    }
  })();

  /* ---------- Hero: "Scroll to explore" ---------- */

  var cue = document.createElement('a');
  cue.className = 'fizz-scroll-cue';
  cue.href = '#just-fizz';
  cue.innerHTML = '<span>Scroll to explore</span><span class="fizz-scroll-cue-line" aria-hidden="true"><i></i></span>';
  document.body.appendChild(cue);
  var showCue = function () {
    cue.classList.toggle('is-hidden', window.scrollY > window.innerHeight * 0.15);
  };
  window.addEventListener('scroll', showCue, { passive: true });
  var reveal = function () { setTimeout(function () { cue.classList.add('is-ready'); showCue(); }, 600); };
  if (window.Fizz && window.Fizz.onReveal) window.Fizz.onReveal(reveal);
  else reveal();
})();
