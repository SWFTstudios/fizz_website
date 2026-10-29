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

  /* Style guide: copy swatch values + replayable motion demos */
  function styleGuide() {
    var status = document.querySelector('[data-sg-copied]');
    if (!status) return;
    var hideTimer;
    document.querySelectorAll('.sg-swatch[data-copy]').forEach(function (sw) {
      sw.tabIndex = 0;
      sw.setAttribute('role', 'button');
      sw.setAttribute('aria-label', 'Copy ' + sw.querySelector('strong').textContent + ' ' + sw.getAttribute('data-copy'));
      function copy() {
        var value = sw.getAttribute('data-copy');
        var show = function (ok) {
          status.textContent = ok ? 'Copied ' + value : value + '. Press \u2318C / Ctrl+C to copy.';
          status.classList.add('is-on');
          clearTimeout(hideTimer);
          hideTimer = setTimeout(function () { status.classList.remove('is-on'); }, 1800);
        };
        var fallback = function () {
          var field = document.createElement('textarea');
          field.value = value;
          field.setAttribute('readonly', '');
          field.style.cssText = 'position:fixed;opacity:0;pointer-events:none;';
          document.body.appendChild(field);
          field.select();
          var ok = false;
          try { ok = document.execCommand('copy'); } catch (e) {}
          field.remove();
          show(ok);
        };
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(value).then(function () { show(true); }, fallback);
        } else {
          fallback();
        }
      }
      sw.addEventListener('click', copy);
      sw.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); copy(); } });
    });
    document.querySelectorAll('[data-demo]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var kind = btn.getAttribute('data-demo');
        if (kind === 'burst' && window.Fizz && Fizz.burst) Fizz.burst(btn, 16);
        if (kind === 'reveal') {
          var target = document.querySelector('[data-demo-target="reveal"]');
          target.classList.remove('is-playing');
          void target.offsetWidth;
          target.classList.add('is-playing');
        }
      });
    });
  }

  /* Tutorial modal (shared with homepage-style Watch tutorial CTAs) */
  var TUTORIAL = {
    desktop: 'https://player.vimeo.com/video/1221538140?autoplay=1&title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479',
    mobile: 'https://player.vimeo.com/video/1223164997?h=53591d98ff&autoplay=1&title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479'
  };
  var tutorialModal, tutorialFrame, tutorialRatio;

  function buildTutorialModal() {
    if (tutorialModal) return;
    tutorialModal = document.createElement('div');
    tutorialModal.className = 'auto-tabs-tutorial-modal';
    tutorialModal.setAttribute('aria-hidden', 'true');
    tutorialModal.innerHTML =
      '<div class="auto-tabs-tutorial-modal__backdrop" data-tutorial-close></div>' +
      '<div class="auto-tabs-tutorial-modal__dialog" role="dialog" aria-modal="true" aria-label="Watch tutorial">' +
      '<button type="button" class="auto-tabs-tutorial-modal__close" data-tutorial-close aria-label="Close video">&times;</button>' +
      '<div class="auto-tabs-tutorial-modal__ratio"><iframe title="Fizz tutorial" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" allowfullscreen></iframe></div>' +
      '</div>';
    document.body.appendChild(tutorialModal);
    tutorialRatio = tutorialModal.querySelector('.auto-tabs-tutorial-modal__ratio');
    tutorialFrame = tutorialModal.querySelector('iframe');
    tutorialModal.querySelectorAll('[data-tutorial-close]').forEach(function (el) {
      el.addEventListener('click', closeTutorial);
    });
  }

  function openTutorial(kind) {
    buildTutorialModal();
    var mobile = kind === 'mobile' || window.innerWidth <= 767;
    tutorialRatio.style.paddingBottom = mobile ? '125%' : '56.25%';
    tutorialFrame.src = mobile ? TUTORIAL.mobile : TUTORIAL.desktop;
    tutorialModal.classList.add('is-open');
    tutorialModal.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('auto-tabs-tutorial-open');
  }

  function closeTutorial() {
    if (!tutorialModal) return;
    tutorialModal.classList.remove('is-open');
    tutorialModal.setAttribute('aria-hidden', 'true');
    tutorialFrame.src = '';
    document.documentElement.classList.remove('auto-tabs-tutorial-open');
  }

  function tutorialModalClicks() {
    if (!document.querySelector('[data-tutorial-video]')) return;
    document.addEventListener('click', function (e) {
      var t = e.target instanceof Element && e.target.closest('[data-tutorial-video]');
      if (!t) return;
      e.preventDefault();
      openTutorial(t.getAttribute('data-tutorial-video'));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeTutorial();
    });
  }

  function boot() {
    styleGuide();
    smoothAnchors();
    stepsRail();
    partsDiagram();
    countUps();
    cans();
    calculator();
    tutorialModalClicks();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
