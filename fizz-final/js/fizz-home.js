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
    var sectionVisible = false;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    function bars() {
      return document.querySelectorAll('[data-auto-tabs="bar"]');
    }

    function syncComplete(activeLink) {
      var idx = links.indexOf(activeLink);
      links.forEach(function (l, i) {
        l.classList.toggle('is-complete', idx > 0 && i < idx);
      });
    }

    function resetBars() {
      bars().forEach(function (bar) {
        bar.getAnimations().forEach(function (a) { a.cancel(); });
        var link = bar.closest('[data-auto-tabs="link"]');
        var complete = link && link.classList.contains('is-complete');
        if (MOBILE.matches) {
          bar.style.width = complete ? '100%' : '0%';
          bar.style.height = '';
        } else {
          bar.style.height = complete ? '100%' : '0%';
          bar.style.width = '';
        }
      });
    }

    function puff(link) {
      if (!sectionVisible || reduceMotion.matches) return;
      if (!window.Fizz || typeof Fizz.burst !== 'function') return;
      var label = link.querySelector('.fizz-heading-tab');
      if (label) Fizz.burst(label, 7);
    }

    function activate(link, opts) {
      links.forEach(function (l) { l.classList.toggle('w--current', l === link); });
      syncComplete(link);
      if (window.Webflow && Webflow.require) Webflow.require('tabs').redraw();
      if (opts && opts.burst) puff(link);
    }

    function run(link) {
      clearTimeout(timer);
      syncComplete(link);
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
        activate(next, { burst: true });
        run(next);
      }, TAB_MS);
    }

    function current() {
      return links.filter(function (l) { return l.classList.contains('w--current'); })[0] || links[0];
    }

    links.forEach(function (link) {
      link.addEventListener('click', function () {
        activate(link, { burst: true });
        run(link);
      });
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
      sectionVisible = entries[0].isIntersecting;
      if (sectionVisible) run(current());
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

  /* ---------- Hero: video card shrinks + floats up on first scroll ---------- */

  // Replaces Webflow's "Hero Scroll" interaction, which scaled the video to 50% but the
  // text + overlay layer to 55%, so the overlay always spilled past the video. Here both
  // layers get the exact same transform, so they stay locked together. On the first swipe
  // the card also lifts — like the sparkling bubble field is carrying it away.
  function initHeroScroll() {
    var hero = document.querySelector('[data-fizz-hero]');
    if (!hero) return;
    var layers = hero.querySelectorAll('.hero-video_container, .fizz-hero-content');
    var content = hero.querySelector('.fizz-hero-content');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    function isMobile() { return window.matchMedia('(max-width: 767px)').matches; }
    // Phones and portrait tablets keep a bigger card; wide screens shrink further.
    function minScale() {
      if (isMobile()) return 0.82;
      if (window.innerHeight > window.innerWidth) return 0.78;
      return 0.58;
    }
    // How far the card drifts upward (px) as if the bubbles are lifting it.
    function maxLift() {
      return Math.round(window.innerHeight * (isMobile() ? 0.14 : 0.2));
    }
    var MIN_SCALE = minScale();
    var FLOAT_MAX = maxLift();
    var top = 0;
    var range = 1;
    var raf = 0;
    var armed = false; // first wheel/touch at the top kicks the bubble field on

    // Front-loaded: the first swipe does most of the lift/scale so it feels intentional.
    function easeFloat(t) {
      t = Math.min(1, Math.max(0, t));
      // First ~28% of the pin does most of the lift so the opening swipe feels decisive.
      if (t <= 0.28) return 0.62 * (1 - Math.pow(1 - t / 0.28, 2.4));
      return 0.62 + 0.38 * (1 - Math.pow(1 - (t - 0.28) / 0.72, 1.6));
    }

    // The motion spans the whole pinned stretch and finishes as the next section rises.
    function measure() {
      var rect = hero.getBoundingClientRect();
      var next = hero.nextElementSibling;
      var overlap = next ? Math.max(0, rect.bottom - next.getBoundingClientRect().top) : 0;
      top = rect.top + window.scrollY;
      range = Math.max(1, hero.offsetHeight - window.innerHeight - overlap);
      MIN_SCALE = minScale();
      FLOAT_MAX = maxLift();
    }
    var bgVideo = document.querySelector('.fizz-bg-video video');
    function update() {
      raf = 0;
      var p = Math.min(1, Math.max(0, (window.scrollY - top) / range));
      var eased = easeFloat(p);
      var scale = 1 - (1 - MIN_SCALE) * eased;
      var lift = FLOAT_MAX * eased;
      // Soft overshoot near the end so it keeps drifting up into the bubbles.
      var drift = FLOAT_MAX * 0.08 * Math.sin(Math.min(1, eased) * Math.PI);
      var y = -(lift + drift);
      var radius = (28 * eased) / scale; // stays ~28px on screen as the card shrinks
      var transform = 'translate3d(0, ' + y.toFixed(1) + 'px, 0) scale(' + scale.toFixed(4) + ')';
      layers.forEach(function (el) {
        el.style.transform = transform;
        el.style.borderRadius = radius.toFixed(1) + 'px';
      });
      if (content) {
        // Let the video read as the thing being carried; type fades as it lifts away.
        content.style.opacity = String((1 - 0.72 * eased).toFixed(3));
      }
      hero.classList.toggle('is-carded', p > 0.008 || armed);
      // Bubble bokeh turns on with the first lift — not behind Just Fizz / explore.
      var showBubbles = (armed || p > 0.01) && p < 0.94 && hero.getBoundingClientRect().bottom > window.innerHeight * 0.12;
      document.documentElement.classList.toggle('fizz-bg-bubbles', showBubbles);
      if (bgVideo) {
        if (showBubbles) {
          if (bgVideo.paused && bgVideo.readyState >= 2) bgVideo.play().catch(function () {});
        } else if (!bgVideo.paused) {
          bgVideo.pause();
        }
      }
      if (p > 0.02) armed = true;
      if (p === 0) armed = false;
    }

    function armFromGesture() {
      if (window.scrollY - top > 4) return;
      if (armed) return;
      armed = true;
      document.documentElement.classList.add('fizz-bg-bubbles');
      if (bgVideo && bgVideo.paused && bgVideo.readyState >= 2) {
        bgVideo.play().catch(function () {});
      }
      if (!raf) raf = requestAnimationFrame(update);
    }

    measure();
    update();
    window.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    window.addEventListener('wheel', armFromGesture, { passive: true });
    window.addEventListener('touchstart', armFromGesture, { passive: true });
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
