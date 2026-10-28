/**
 * Fizz homepage — "Meet the bottle" scroll story, plus the hero's "Scroll to explore" cue.
 *
 * The section is four screens tall; its stage stays pinned while the page scrolls through
 * four chapters (still water → the canister → the fizz → your colorway). Scroll progress
 * picks the chapter, fills the progress bars and sets data-chapter on the section, which
 * the CSS uses to move the bottle, bring in the actual-size canister photo and start the
 * rising bubbles. Points on the bottle open short notes ("tap for more"), and the colorway
 * swatches swap the bottle and keep the featured buy box below in sync.
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
  var N = chapters.length;
  var FOCUS_SPOT = ['fill', 'base', 'lid', null]; // the point each chapter draws the eye to

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
      // Keep the featured buy box below on the same color.
      var match = document.querySelector('.fizz-featured [data-swatch][aria-label="' + name + '"]');
      if (match && match.getAttribute('aria-checked') !== 'true') match.click();
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
    closePops(null);
  }

  if (!motion) {
    chapters.forEach(function (c) { c.classList.add('is-active'); });
    return;
  }
  section.classList.add('is-live');

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
    b.addEventListener('click', function () {
      var span = section.offsetHeight - window.innerHeight;
      var top = section.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top + span * ((k + 0.08) / N), behavior: 'smooth' });
    });
  });

  /* ---------- Hero: "Scroll to explore" ---------- */

  var cue = document.createElement('a');
  cue.className = 'fizz-scroll-cue';
  cue.href = '#story';
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
