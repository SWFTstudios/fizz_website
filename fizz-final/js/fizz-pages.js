/**
 * Fizz content pages (How it works, About).
 *
 *  - Smooth scrolling for in-page links (#steps, #tutorial)
 *  - Steps progress rail that fills as you scroll through the steps
 *  - Bottle parts diagram: markers and the parts list highlight each other
 *  - Count-up stats, staggered can graphic, "how many cans could you skip" calculator
 */
(function () {
  'use strict';

  var motion = document.documentElement.classList.contains('fizz-motion');

  function onReveal(fn) {
    if (window.Fizz && Fizz.onReveal) Fizz.onReveal(fn);
    else fn();
  }

  function whenVisible(el, fn, margin) {
    new IntersectionObserver(function (entries, io) {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      fn();
    }, { rootMargin: margin || '0px 0px -15% 0px' }).observe(el);
  }

  /* In-page links glide instead of jumping */
  function smoothAnchors() {
    document.addEventListener('click', function (e) {
      var a = e.target instanceof Element && e.target.closest('a[href^="#"]');
      if (!a) return;
      var target = document.getElementById(a.getAttribute('href').slice(1));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: motion ? 'smooth' : 'auto', block: 'start' });
      history.replaceState(null, '', a.getAttribute('href'));
    });
  }

  /* Steps progress rail */
  function stepsRail() {
    var list = document.querySelector('[data-steps]');
    var fill = document.querySelector('[data-rail-fill]');
    if (!list || !fill) return;
    var raf = 0;
    function update() {
      raf = 0;
      var r = list.getBoundingClientRect();
      var mid = window.innerHeight * 0.55;
      var p = Math.min(1, Math.max(0, (mid - r.top) / r.height));
      fill.style.transform = 'scaleY(' + p.toFixed(4) + ')';
      list.querySelectorAll('.hiw-step').forEach(function (step) {
        var sr = step.getBoundingClientRect();
        step.classList.toggle('is-current', sr.top < mid && sr.bottom > mid);
      });
    }
    window.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* Parts diagram: hovering/focusing a marker or a list row highlights both */
  function partsDiagram() {
    var rows = document.querySelectorAll('[data-parts] [data-part]');
    var markers = document.querySelectorAll('.hiw-marker[data-part]');
    if (!rows.length) return;
    function set(n) {
      rows.forEach(function (r) { r.classList.toggle('is-active', r.getAttribute('data-part') === n); });
      markers.forEach(function (m) { m.classList.toggle('is-active', m.getAttribute('data-part') === n); });
    }
    [].forEach.call(rows, bind);
    [].forEach.call(markers, bind);
    function bind(el) {
      var n = el.getAttribute('data-part');
      el.addEventListener('pointerenter', function () { set(n); });
      el.addEventListener('focus', function () { set(n); });
      el.addEventListener('click', function () { set(n); });
      el.addEventListener('pointerleave', function () { set(null); });
    }
  }

  /* Count-up numbers */
  function countUps() {
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var end = Number(el.getAttribute('data-count'));
      if (!motion) return;
      el.textContent = '0';
      onReveal(function () {
        whenVisible(el, function () {
          var start = performance.now();
          var dur = 1400;
          (function tick(now) {
            var t = Math.min(1, (now - start) / dur);
            el.textContent = Math.round(end * (1 - Math.pow(1 - t, 3)));
            if (t < 1) requestAnimationFrame(tick);
          })(start);
        });
      });
    });
  }

  /* Cans graphic: pop in one after another */
  function cans() {
    var block = document.querySelector('[data-cans]');
    if (!block) return;
    if (!motion) { block.classList.add('is-filled'); return; }
    onReveal(function () {
      whenVisible(block.querySelector('.about-cans-grid'), function () { block.classList.add('is-filled'); });
    });
  }

  /* Calculator */
  function calculator() {
    var root = document.querySelector('[data-calc]');
    if (!root) return;
    var range = root.querySelector('[data-calc-range]');
    var out = {
      week: root.querySelector('[data-calc-out-week]'),
      cans: root.querySelector('[data-calc-cans]'),
      liters: root.querySelector('[data-calc-liters]'),
      charges: root.querySelector('[data-calc-charges]'),
      packs: root.querySelector('[data-calc-packs]')
    };
    var fmt = new Intl.NumberFormat('en-US');
    function update() {
      var perWeek = Number(range.value);
      var cansYear = perWeek * 52;
      var liters = cansYear * 0.355;
      var charges = Math.ceil(liters / 12);
      out.week.textContent = perWeek;
      out.cans.textContent = fmt.format(cansYear);
      out.liters.textContent = fmt.format(Math.round(liters));
      out.charges.textContent = fmt.format(charges);
      out.packs.textContent = fmt.format(Math.ceil(charges / 6));
      range.style.setProperty('--fill', ((perWeek - range.min) / (range.max - range.min)) * 100 + '%');
    }
    range.addEventListener('input', update);
    update();
  }

  function boot() {
    smoothAnchors();
    stepsRail();
    partsDiagram();
    countUps();
    cans();
    calculator();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
