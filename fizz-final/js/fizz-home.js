/**
 * Fizz homepage — "How it works" autoplay tabs + tutorial video modal.
 */
(function () {
  'use strict';

  /* ---------- Autoplay tabs ---------- */

  var TAB_MS = 6000;
  var MOBILE = window.matchMedia('(max-width: 767px)');

  function initTabs() {
    var links = Array.prototype.slice.call(document.querySelectorAll('[data-auto-tabs="link"]'));
    var button = document.querySelector('[data-auto-tabs="button"]');
    if (!links.length) return;

    var timer = null;
    var playing = true;

    function bars() {
      return document.querySelectorAll('[data-auto-tabs="bar"]');
    }

    function resetBars() {
      bars().forEach(function (bar) {
        bar.getAnimations().forEach(function (a) { a.cancel(); });
        bar.style.width = MOBILE.matches ? '0%' : '';
        bar.style.height = MOBILE.matches ? '' : '0%';
      });
    }

    function activate(link) {
      links.forEach(function (l) { l.classList.toggle('w--current', l === link); });
      if (window.Webflow && Webflow.require) Webflow.require('tabs').redraw();
    }

    function run(link) {
      clearTimeout(timer);
      resetBars();
      if (!playing) return;
      var bar = link.querySelector('[data-auto-tabs="bar"]');
      var dim = MOBILE.matches ? 'width' : 'height';
      if (bar) {
        var from = {}; from[dim] = '0%';
        var to = {}; to[dim] = '100%';
        bar.animate([from, to], { duration: TAB_MS, easing: 'linear', fill: 'forwards' });
      }
      timer = setTimeout(function () {
        var next = links[(links.indexOf(link) + 1) % links.length];
        activate(next);
        run(next);
      }, TAB_MS);
    }

    function current() {
      return links.filter(function (l) { return l.classList.contains('w--current'); })[0] || links[0];
    }

    links.forEach(function (link) {
      link.addEventListener('click', function () { run(link); });
    });

    if (button) {
      button.addEventListener('click', function () {
        playing = !playing;
        button.setAttribute('data-auto-tabs-button', playing ? 'play' : 'pause');
        run(current());
      });
    }

    MOBILE.addEventListener('change', function () { run(current()); });

    // Don't burn the timer while the section is off-screen.
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) run(current());
      else {
        clearTimeout(timer);
        resetBars();
      }
    }).observe(links[0].closest('.section-tabs-autoplay') || links[0]);
  }

  /* ---------- Tutorial video modal ---------- */

  var VIDEOS = {
    desktop: 'https://player.vimeo.com/video/1221538140?autoplay=1&title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479',
    mobile: 'https://player.vimeo.com/video/1223164997?h=53591d98ff&autoplay=1&title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479'
  };
  var modal, frame, ratio;

  function buildModal() {
    if (modal) return;
    modal = document.createElement('div');
    modal.className = 'auto-tabs-tutorial-modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML =
      '<div class="auto-tabs-tutorial-modal__backdrop" data-tutorial-close></div>' +
      '<div class="auto-tabs-tutorial-modal__dialog" role="dialog" aria-modal="true" aria-label="Watch tutorial">' +
      '<button type="button" class="auto-tabs-tutorial-modal__close" data-tutorial-close aria-label="Close video">&times;</button>' +
      '<div class="auto-tabs-tutorial-modal__ratio"><iframe title="Fizz tutorial" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" allowfullscreen></iframe></div>' +
      '</div>';
    document.body.appendChild(modal);
    ratio = modal.querySelector('.auto-tabs-tutorial-modal__ratio');
    frame = modal.querySelector('iframe');
    modal.querySelectorAll('[data-tutorial-close]').forEach(function (el) {
      el.addEventListener('click', closeModal);
    });
  }

  function openModal(kind) {
    buildModal();
    var mobile = kind === 'mobile' || window.innerWidth <= 767;
    ratio.style.paddingBottom = mobile ? '125%' : '56.25%';
    frame.src = mobile ? VIDEOS.mobile : VIDEOS.desktop;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('auto-tabs-tutorial-open');
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    frame.src = '';
    document.documentElement.classList.remove('auto-tabs-tutorial-open');
  }

  function initTutorial() {
    document.addEventListener('click', function (e) {
      var t = e.target instanceof Element && e.target.closest('[data-tutorial-video]');
      if (!t) return;
      e.preventDefault();
      openModal(t.getAttribute('data-tutorial-video'));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });
  }

  /* ---------- Hero: video card shrinks as you scroll ---------- */

  // Replaces Webflow's "Hero Scroll" interaction, which scaled the video to 50% but the
  // text + overlay layer to 55%, so the overlay always spilled past the video. Here both
  // layers get the exact same transform, so they stay locked together.
  function initHeroScroll() {
    var hero = document.querySelector('[data-fizz-hero]');
    if (!hero) return;
    var layers = hero.querySelectorAll('.hero-video_container, .fizz-hero-content');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Phones and portrait tablets keep a bigger card; wide screens shrink further.
    function minScale() {
      if (window.matchMedia('(max-width: 767px)').matches) return 0.84;
      if (window.innerHeight > window.innerWidth) return 0.8;
      return 0.62;
    }
    var MIN_SCALE = minScale();
    var top = 0;
    var range = 1;
    var raf = 0;

    // The shrink runs across the whole pinned stretch and finishes just as the next section
    // starts to rise over the card, so there's no dead zone where the card sits still.
    function measure() {
      var rect = hero.getBoundingClientRect();
      var next = hero.nextElementSibling;
      var overlap = next ? Math.max(0, rect.bottom - next.getBoundingClientRect().top) : 0;
      top = rect.top + window.scrollY;
      range = Math.max(1, hero.offsetHeight - window.innerHeight - overlap);
      MIN_SCALE = minScale();
    }
    function update() {
      raf = 0;
      var p = Math.min(1, Math.max(0, (window.scrollY - top) / range));
      // Mostly linear with a soft ease-out: it keeps moving right up to the hand-off.
      var eased = 0.6 * p + 0.4 * (1 - Math.pow(1 - p, 2));
      var scale = 1 - (1 - MIN_SCALE) * eased;
      var radius = (28 * eased) / scale; // stays ~28px on screen as the card shrinks
      layers.forEach(function (el) {
        el.style.transform = 'scale(' + scale.toFixed(4) + ')';
        el.style.borderRadius = radius.toFixed(1) + 'px';
      });
      hero.classList.toggle('is-carded', p > 0.01);
    }
    measure();
    update();
    window.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    window.addEventListener('resize', function () { measure(); update(); });
    window.addEventListener('load', function () { measure(); update(); });
  }

  function boot() {
    initHeroScroll();
    initTabs();
    initTutorial();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
