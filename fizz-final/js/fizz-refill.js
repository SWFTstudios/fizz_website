/**
 * Fizz homepage — "Keep the fizz coming" refill loop (Use → Return → Refill → Repeat).
 *
 * The stage pins while you scroll through the section. Each step (name, dot, description)
 * rides the timeline one at a time: it slides in from the left, holds in the centre, then
 * slides off to the right as the next one comes in behind it. The magenta arrow in front of
 * each name draws itself on the way in, and the line fills as you move through the loop.
 *
 * Without this script, or with reduced motion, the section stays a single screen with all
 * four steps on the line at once (see "refill loop" in css/fizz.css).
 */
(function () {
  'use strict';

  var section = document.querySelector('[data-fizz-refill]');
  if (!section) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var steps = Array.prototype.slice.call(section.querySelectorAll('[data-refill-step]'));
  var pips = Array.prototype.slice.call(section.querySelectorAll('[data-refill-pip]'));
  var stage = section.querySelector('.fizz-refill-stage');
  var MOBILE = window.matchMedia('(max-width: 767px)');
  var N = steps.length;
  // Share of each step's stretch, either side of its centre, where it sits still.
  var HOLD = 0.22;

  var top = 0;
  var range = 1;
  var travel = 0;
  var raf = 0;
  var active = -1;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function smooth(t) { return t * t * (3 - 2 * t); }

  function measure() {
    top = section.getBoundingClientRect().top + window.scrollY;
    range = Math.max(1, section.offsetHeight - window.innerHeight);
    travel = section.offsetWidth * (MOBILE.matches ? 0.6 : 0.34);
  }

  function setActive(i) {
    if (i === active) return;
    active = i;
    steps.forEach(function (step, j) { step.classList.toggle('is-active', j === i); });
    pips.forEach(function (pip, j) {
      if (j === i) pip.setAttribute('aria-current', 'step');
      else pip.removeAttribute('aria-current');
    });
  }

  function update() {
    raf = 0;
    // 0 → N across the section; step i owns [i, i + 1] and sits still around i + 0.5.
    var p = clamp((window.scrollY - top) / range, 0, 1) * N;
    steps.forEach(function (step, i) {
      var d = p - (i + 0.5);
      if (i === 0 && d < 0) d = 0; // first step is already there when the stage pins
      if (i === N - 1 && d > 0) d = 0; // last step stays until the stage lets go
      var u = clamp((Math.abs(d) - HOLD) / (1 - 2 * HOLD), 0, 1);
      var e = smooth(u);
      step.style.setProperty('--refill-x', ((d < 0 ? -1 : 1) * e * travel).toFixed(1) + 'px');
      step.style.setProperty('--refill-opacity', (1 - smooth(Math.min(1, u * 1.8))).toFixed(3));
      // Arrow draws in on the way in and stays drawn on the way out.
      step.style.setProperty('--refill-draw', d < 0 ? (1 - smooth(Math.min(1, u * 1.6))).toFixed(3) : '1');
    });
    section.style.setProperty('--refill-progress', (p / N).toFixed(4));
    setActive(clamp(Math.floor(p), 0, N - 1));
    stage.style.setProperty('--refill-orb-scale', (0.94 + 0.08 * (p / N)).toFixed(4));
    stage.style.setProperty('--refill-ring-turn', (-8 + 16 * (p / N)).toFixed(2) + 'deg');
  }

  function requestUpdate() {
    if (!raf) raf = requestAnimationFrame(update);
  }

  pips.forEach(function (pip, i) {
    pip.addEventListener('click', function () {
      measure();
      window.scrollTo({ top: top + range * ((i + 0.5) / N), behavior: 'smooth' });
    });
  });

  section.classList.add('is-live');
  measure();
  update();
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', function () { measure(); requestUpdate(); });
  window.addEventListener('load', function () { measure(); requestUpdate(); });
  MOBILE.addEventListener('change', function () { measure(); requestUpdate(); });
  // Photos and videos above the section settle after load and move its start point.
  if (window.ResizeObserver) new ResizeObserver(function () { measure(); requestUpdate(); }).observe(document.body);
})();
