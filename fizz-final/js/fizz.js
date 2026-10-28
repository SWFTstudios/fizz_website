/**
 * Fizz — shared site script (every page).
 *
 *  1. Page reveal       — one place that decides when the page is "shown"
 *  2. Page transition   — a deep-water veil with fine bubbles rises on leave, lifts on arrival
 *  3. Flavor animation  — plays whenever a link goes to the Flavors page
 *  4. Link handling     — routes internal link clicks to 2 or 3
 *  5. Lazy videos       — off-screen videos load/play only when near the viewport
 *  6. Marquees + text reveals
 *
 * Every animation uses the Web Animations API or CSS (transform/opacity only), so it
 * runs on the compositor and stays smooth while the next page is still loading.
 */
(function () {
  'use strict';
  if (window.Fizz) return;

  var root = document.documentElement;
  var motion = root.classList.contains('fizz-motion');
  var revealed = false;
  var revealCallbacks = [];

  var Fizz = (window.Fizz = {
    motion: motion,
    onReveal: function (fn) {
      if (revealed) fn();
      else revealCallbacks.push(fn);
    },
    reveal: function () {
      if (revealed) return;
      revealed = true;
      root.classList.remove('fizz-loading');
      revealCallbacks.splice(0).forEach(function (fn) { fn(); });
    },
    go: go
  });

  function rand(min, max) { return min + Math.random() * (max - min); }

  function pageLoaded(maxWait) {
    return new Promise(function (resolve) {
      if (document.readyState === 'complete') return resolve();
      window.addEventListener('load', resolve, { once: true });
      setTimeout(resolve, maxWait);
    });
  }

  function isFlavorsPath(pathname) {
    return /\/flavors(\.html)?\/?$/.test(pathname);
  }

  /** "/flavors.html", "/flavors/" and "/flavors" are the same page (static export vs. clean-URL hosting). */
  function samePath(a, b) {
    var clean = function (p) { return p.replace(/(\/index)?\.html$/, '').replace(/\/+$/, '') || '/'; };
    return clean(a) === clean(b);
  }

  /* ------------------------------------------------------------------ *
   * 2. Bubble transition
   * ------------------------------------------------------------------ */

  var tx, liquid, bubbleLayer, flavorStage;
  var busy = false;

  function buildOverlay() {
    if (tx) return;
    tx = document.createElement('div');
    tx.id = 'fizz-tx';
    tx.setAttribute('aria-hidden', 'true');
    tx.innerHTML =
      '<div class="fizz-tx-liquid">' +
      '<div class="fizz-tx-edge is-top"></div>' +
      '<div class="fizz-tx-edge is-bottom"></div>' +
      '</div>' +
      '<div class="fizz-tx-flavor"></div>' +
      '<div class="fizz-tx-bubbles"></div>';
    document.body.appendChild(tx);
    liquid = tx.querySelector('.fizz-tx-liquid');
    flavorStage = tx.querySelector('.fizz-tx-flavor');
    bubbleLayer = tx.querySelector('.fizz-tx-bubbles');
    var block = function (e) { e.preventDefault(); };
    tx.addEventListener('wheel', block, { passive: false });
    tx.addEventListener('touchmove', block, { passive: false });
  }

  /**
   * Fine carbonation: mostly pin-point bubbles with a few small ones, some rising in
   * thin champagne-style streams and the rest scattered. Bigger bubbles rise faster.
   */
  function spawnBubbles(count, spread, rise) {
    var vh = window.innerHeight;
    var frag = document.createDocumentFragment();
    var streams = [];
    for (var s = 0; s < 9; s++) streams.push(rand(4, 96));
    for (var i = 0; i < count; i++) {
      var r = Math.random();
      var size = r < 0.7 ? rand(1.5, 3.5) : r < 0.95 ? rand(3.5, 6) : rand(6, 9);
      var inStream = Math.random() < 0.55;
      var x = inStream ? streams[i % streams.length] + rand(-0.4, 0.4) : rand(0, 100);
      var b = document.createElement('span');
      b.className = 'fizz-tx-bubble' + (size < 3.5 ? ' is-tiny' : '');
      b.style.width = b.style.height = size.toFixed(1) + 'px';
      b.style.left = 'calc(' + x.toFixed(2) + '% - ' + size / 2 + 'px)';
      // Some bubbles start already rising in the lower part of the screen.
      if (Math.random() < 0.4) b.style.top = 'calc(100% - ' + rand(0, vh * 0.35).toFixed(0) + 'px)';
      frag.appendChild(b);
      var travel = -(vh * rise + size * 2 + rand(0, vh * 0.1));
      var sway = rand(1, inStream ? 3 : 7) * (Math.random() < 0.5 ? -1 : 1);
      var peak = rand(0.45, 0.85);
      var anim = b.animate(
        [
          { transform: 'translate3d(0,0,0) scale(0.7)', opacity: 0 },
          { transform: 'translate3d(' + sway + 'px,' + travel * 0.35 + 'px,0) scale(0.95)', opacity: peak, offset: 0.3 },
          { transform: 'translate3d(' + -sway * 0.6 + 'px,' + travel * 0.7 + 'px,0) scale(1)', opacity: peak * 0.9, offset: 0.7 },
          { transform: 'translate3d(' + sway * 0.3 + 'px,' + travel + 'px,0) scale(1)', opacity: 0 }
        ],
        {
          duration: rand(700, 1100) - size * 20,
          delay: (inStream ? (i / count) : Math.pow(Math.random(), 2)) * spread,
          easing: 'cubic-bezier(0.45, 0, 0.6, 0.6)',
          fill: 'backwards'
        }
      );
      anim.onfinish = (function (el) { return function () { el.remove(); }; })(b);
    }
    bubbleLayer.appendChild(frag);
  }

  function bubbleCount() {
    var w = window.innerWidth;
    return w < 600 ? 45 : w < 1024 ? 65 : 90;
  }

  function animateLiquid(from, to, duration, easing, delay) {
    var anim = liquid.animate(
      [{ transform: from }, { transform: to }],
      { duration: duration, delay: delay || 0, easing: easing, fill: 'both' }
    );
    return new Promise(function (resolve) {
      anim.onfinish = resolve;
      setTimeout(resolve, duration + (delay || 0) + 400);
    });
  }

  /** Fizz-styled bubble pop around an element (e.g. after "Add to cart"). */
  function burst(el, count) {
    if (!motion || !el || !document.body.animate) return;
    var box = el.getBoundingClientRect();
    for (var i = 0; i < (count || 14); i++) {
      var size = rand(2, 6);
      var b = document.createElement('span');
      b.className = 'fizz-burst';
      b.style.cssText =
        'width:' + size + 'px;height:' + size + 'px;' +
        'left:' + (box.left + rand(0.1, 0.9) * box.width - size / 2) + 'px;' +
        'top:' + (box.top + box.height * rand(0.3, 0.8) - size / 2) + 'px;';
      document.body.appendChild(b);
      b.animate(
        [
          { transform: 'translate3d(0,0,0) scale(0.3)', opacity: 0 },
          { opacity: 1, offset: 0.2 },
          { transform: 'translate3d(' + rand(-30, 30) + 'px,' + -rand(40, 110) + 'px,0) scale(1)', opacity: 0 }
        ],
        { duration: rand(600, 1000), delay: rand(0, 160), easing: 'cubic-bezier(0.2, 0.6, 0.4, 1)', fill: 'backwards' }
      ).onfinish = (function (node) { return function () { node.remove(); }; })(b);
    }
  }
  Fizz.burst = burst;

  /** Fizz floods up from the bottom of the screen. Resolves once fully covered. */
  function coverPage() {
    buildOverlay();
    tx.classList.add('is-active');
    // A first stream of fine bubbles, then the water rises smoothly behind it.
    spawnBubbles(bubbleCount(), 300, 1.25);
    return animateLiquid('translate3d(0,135%,0)', 'translate3d(0,0,0)', 700, 'cubic-bezier(0.7, 0, 0.3, 1)', 200);
  }

  /** Arrival: the page starts covered, then the fizz rises off the top. */
  function uncoverPage() {
    buildOverlay();
    tx.classList.add('is-active');
    liquid.style.transform = 'translate3d(0,0,0)';
    root.classList.remove('fizz-tx-cover');

    // Give the new page a moment to paint its first screen; the animation itself
    // runs on the compositor, so a busy main thread won't make it stutter.
    pageLoaded(300).then(function () {
      requestAnimationFrame(function () {
        spawnBubbles(bubbleCount(), 260, 1.25);
        setTimeout(Fizz.reveal, 350);
        animateLiquid('translate3d(0,0,0)', 'translate3d(0,-135%,0)', 1000, 'cubic-bezier(0.7, 0, 0.3, 1)').then(resetOverlay);
      });
    });
  }

  function resetOverlay() {
    busy = false;
    if (!tx) return;
    tx.classList.remove('is-active');
    // Cancel scripted animations only; the CSS slosh/glow loops keep running for next time.
    tx.getAnimations({ subtree: true }).forEach(function (a) {
      if (!a.animationName) a.cancel();
    });
    liquid.style.transform = '';
    bubbleLayer.textContent = '';
    flavorStage.textContent = '';
    flavorStage.style.opacity = '';
  }

  function navigate(href, kind) {
    try { sessionStorage.setItem('fizz-tx', kind); } catch (e) {}
    window.location.href = href;
  }

  /* ------------------------------------------------------------------ *
   * 3. Flavor animation (61-frame sequence hosted on the Shopify CDN)
   * ------------------------------------------------------------------ */

  var FLAVOR = {
    base: 'https://fizz-9820.myshopify.com/cdn/shop/t/22/assets/fizz-flavor-',
    count: 61,
    fps: 30
  };
  var frames = new Array(FLAVOR.count);
  var framesSettled = 0;
  var frameQueue = null;
  var frameConcurrency = 0;
  var frameWaiters = [];
  var inFlight = 0;

  function frameUrl(i) {
    return FLAVOR.base + ('00' + i).slice(-3) + '.webp';
  }

  function slowConnection() {
    var c = navigator.connection;
    return !!(c && (c.saveData || /2g/.test(c.effectiveType || '')));
  }

  /** Load every frame in order. Calling again with high priority speeds it up. */
  function loadFrames(priority) {
    var high = priority === 'high';
    frameConcurrency = Math.max(frameConcurrency, high ? 6 : 2);
    if (!frameQueue) {
      frameQueue = [];
      for (var i = 0; i < FLAVOR.count; i++) frameQueue.push(i);
    }
    pumpFrames(high);
  }

  function pumpFrames(high) {
    while (frameQueue.length && inFlight < frameConcurrency) {
      inFlight++;
      (function (i) {
        var img = new Image();
        img.decoding = 'async';
        if (high) img.fetchPriority = 'high';
        var settle = function (ok) {
          if (ok) frames[i] = img;
          inFlight--;
          framesSettled++;
          if (framesSettled === FLAVOR.count) frameWaiters.splice(0).forEach(function (fn) { fn(); });
          pumpFrames(high);
        };
        img.onload = function () {
          if (img.decode) img.decode().then(function () { settle(true); }, function () { settle(true); });
          else settle(true);
        };
        img.onerror = function () { settle(false); };
        img.src = frameUrl(i);
      })(frameQueue.shift());
    }
  }

  function framesReady(maxWait) {
    return new Promise(function (resolve) {
      if (framesSettled === FLAVOR.count) return resolve();
      frameWaiters.push(resolve);
      setTimeout(resolve, maxWait);
    });
  }

  function playFlavorFrames() {
    var canvas = document.createElement('canvas');
    var skip = document.createElement('button');
    skip.type = 'button';
    skip.className = 'fizz-tx-skip';
    skip.textContent = 'Skip';
    flavorStage.appendChild(canvas);
    flavorStage.appendChild(skip);

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var box = canvas.getBoundingClientRect();
    canvas.width = Math.round(box.width * dpr);
    canvas.height = Math.round(box.height * dpr);
    var ctx = canvas.getContext('2d');
    var lastDrawn = -1;

    function draw(i) {
      // Hold the latest frame that is ready rather than jumping ahead.
      while (i > 0 && !frames[i]) i--;
      var img = frames[i];
      if (!img || i === lastDrawn) return;
      lastDrawn = i;
      var s = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
      var w = img.naturalWidth * s;
      var h = img.naturalHeight * s;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    }

    draw(0);
    flavorStage.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 350, fill: 'forwards' });

    return new Promise(function (resolve) {
      var done = false;
      var finish = function () {
        if (done) return;
        done = true;
        resolve();
      };
      skip.addEventListener('click', finish);

      var duration = ((FLAVOR.count - 1) / FLAVOR.fps) * 1000;
      var start = performance.now();
      (function tick(now) {
        if (done) return;
        var t = Math.min(1, (now - start) / duration);
        draw(Math.round(t * (FLAVOR.count - 1)));
        if (t < 1) requestAnimationFrame(tick);
        else setTimeout(finish, 250);
      })(start);
    });
  }

  function flavorTransition(href) {
    loadFrames('high');
    coverPage()
      .then(function () { return framesReady(4000); })
      .then(playFlavorFrames)
      .then(function () {
        spawnBubbles(bubbleCount(), 150, 1.2);
        flavorStage.animate(
          [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(0.94)' }],
          { duration: 300, easing: 'ease-in', fill: 'forwards' }
        );
        setTimeout(function () { navigate(href, 'flavor'); }, 280);
      });
  }

  function warmFlavorFrames() {
    if (isFlavorsPath(location.pathname) || slowConnection()) return;
    if (!document.querySelector('a[href*="flavors"]')) return;
    pageLoaded(4000).then(function () {
      var start = function () { loadFrames('low'); };
      if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 3000 });
      else setTimeout(start, 1500);
    });
  }

  /* ------------------------------------------------------------------ *
   * 4. Link handling
   * ------------------------------------------------------------------ */

  function go(href) {
    if (busy) return;
    var url = new URL(href, location.href);
    if (!motion) {
      location.href = url.href;
      return;
    }
    busy = true;
    if (isFlavorsPath(url.pathname) && !isFlavorsPath(location.pathname)) {
      flavorTransition(url.href);
    } else {
      coverPage().then(function () { navigate(url.href, 'bubble'); });
    }
  }

  function internalLink(event) {
    var target = event.target instanceof Element ? event.target : null;
    var link = target && target.closest('a[href]');
    if (!link) return null;
    if (link.target && link.target !== '_self') return null;
    if (link.hasAttribute('download') || link.hasAttribute('data-no-transition') || link.hasAttribute('data-no-bubble-transition')) return null;
    var raw = link.getAttribute('href');
    if (!raw || raw.charAt(0) === '#' || /^(mailto|tel|sms|javascript):/i.test(raw)) return null;
    var url;
    try { url = new URL(link.href); } catch (e) { return null; }
    if (url.origin !== location.origin) return null;
    if (samePath(url.pathname, location.pathname) && url.search === location.search) return null;
    return url;
  }

  // Bubble phase on window = runs after Webflow, the cart and every other click handler,
  // so anything that already handled the click (add to cart, tabs, sliders) wins.
  window.addEventListener('click', function (event) {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var url = internalLink(event);
    if (!url) return;
    event.preventDefault();
    go(url.href);
  });

  var prefetched = {};
  function prefetchOnIntent(event) {
    var url = internalLink(event);
    if (!url) return;
    if (isFlavorsPath(url.pathname) && !isFlavorsPath(location.pathname)) loadFrames('high');
    if (prefetched[url.href]) return;
    prefetched[url.href] = true;
    var link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url.href;
    document.head.appendChild(link);
  }
  document.addEventListener('pointerover', prefetchOnIntent, { passive: true });
  document.addEventListener('touchstart', prefetchOnIntent, { passive: true });
  document.addEventListener('focusin', prefetchOnIntent);

  // Restored from the back/forward cache: drop any half-finished transition.
  window.addEventListener('pageshow', function (event) {
    if (event.persisted) {
      resetOverlay();
      Fizz.reveal();
    }
  });

  /* ------------------------------------------------------------------ *
   * 5. Lazy videos (sources are written as data-src in the HTML)
   * ------------------------------------------------------------------ */

  function playVideo(video) {
    if (!motion) return;
    var p = video.play();
    if (p && p.catch) p.catch(function () {});
  }

  function loadVideo(video) {
    if (video.dataset.fizzLoaded) return;
    video.dataset.fizzLoaded = '1';
    video.querySelectorAll('source[data-src]').forEach(function (s) {
      s.src = s.getAttribute('data-src');
      s.removeAttribute('data-src');
    });
    video.load();
  }

  function inActiveTab(video) {
    var pane = video.closest('.w-tab-pane');
    return !pane || pane.classList.contains('w--tab-active');
  }

  function setupVideos() {
    var videos = document.querySelectorAll('video');
    if (!videos.length) return;

    // The fixed bubble background waits until the page has been revealed and loaded.
    var bg = document.querySelector('.fizz-bg-video video[data-fizz-lazy]');
    if (bg) {
      Fizz.onReveal(function () {
        pageLoaded(3000).then(function () {
          loadVideo(bg);
          playVideo(bg);
        });
      });
    }

    var inView = new Map();
    var sync = function (video) {
      if (inView.get(video) && inActiveTab(video)) playVideo(video);
      else video.pause();
    };

    var nearIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        nearIO.unobserve(entry.target);
        loadVideo(entry.target);
      });
    }, { rootMargin: '0px 0px 600px 0px' });

    var viewIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        inView.set(entry.target, entry.isIntersecting);
        sync(entry.target);
      });
    });

    // Every video (hero included) plays only while on screen; lazy ones also load on approach.
    videos.forEach(function (video) {
      if (video === bg) return;
      if (video.hasAttribute('data-fizz-lazy')) nearIO.observe(video);
      viewIO.observe(video);
    });

    // Tab panes: only the active tab's video plays.
    document.querySelectorAll('.w-tab-pane').forEach(function (pane) {
      var vids = pane.querySelectorAll('video');
      if (!vids.length) return;
      new MutationObserver(function () { vids.forEach(sync); })
        .observe(pane, { attributes: true, attributeFilter: ['class'] });
    });
  }

  /* ------------------------------------------------------------------ *
   * 6. Marquees + text reveals
   * ------------------------------------------------------------------ */

  function setupMarquees() {
    var nodes = document.querySelectorAll('.social-media-marquee, .marquee-vertical_wrapper, .action-background');
    if (!nodes.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle('is-in-view', entry.isIntersecting);
      });
    }, { rootMargin: '10% 0px' });
    nodes.forEach(function (el) {
      el.setAttribute('data-fizz-marquee', '');
      io.observe(el);
    });
  }

  function setupReveals() {
    if (!motion) return;

    // Generic block reveals: anything marked [data-reveal] rises in when scrolled into view.
    var blocks = document.querySelectorAll('[data-reveal]');
    if (blocks.length) {
      var blockIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          blockIO.unobserve(entry.target);
          entry.target.classList.add('is-in');
        });
      }, { rootMargin: '0px 0px -10% 0px' });
      Fizz.onReveal(function () {
        blocks.forEach(function (el) { blockIO.observe(el); });
      });
    }

    var masks = document.querySelectorAll('.fizz-reveal-mask');
    if (!masks.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        entry.target._fizzMasks.forEach(function (m) { m.classList.add('is-in'); });
      });
    }, { rootMargin: '0px 0px -8% 0px' });

    masks.forEach(function (mask) {
      // Collapsed tab descriptions have no height of their own; watch their tab instead.
      var trigger = mask.closest('[data-auto-tabs="link"]') || mask;
      (trigger._fizzMasks = trigger._fizzMasks || []).push(mask);
      if (trigger._fizzMasks.length === 1) {
        Fizz.onReveal(function () { io.observe(trigger); });
      }
    });
  }

  /* ------------------------------------------------------------------ *
   * Details rows slide open / closed
   * ------------------------------------------------------------------ */

  function initAccordions(scope) {
    scope.querySelectorAll('details.pdp-accordion').forEach(function (row) {
      var summary = row.querySelector('summary');
      var body = row.querySelector('.pdp-accordion-body');
      if (!summary || !body || !motion || !body.animate) return;
      var anim = null;

      summary.addEventListener('click', function (e) {
        e.preventDefault();
        var opening = !row.open || row.classList.contains('is-closing');
        var from = anim ? getComputedStyle(body).height : null;
        if (anim) anim.cancel();
        row.classList.remove('is-closing');
        row.open = true;
        var full = body.scrollHeight + 'px';
        var gap = getComputedStyle(body).marginBottom;
        var open = { height: full, marginBottom: gap, opacity: 1, transform: 'none' };
        var shut = { height: '0px', marginBottom: '0px', opacity: 0, transform: 'translate3d(0,-8px,0)' };
        if (from) (opening ? shut : open).height = from;
        body.style.overflow = 'hidden';
        if (!opening) row.classList.add('is-closing');
        anim = body.animate(opening ? [shut, open] : [open, shut], {
          duration: opening ? 420 : 300,
          easing: opening ? 'cubic-bezier(0.16, 1, 0.3, 1)' : 'cubic-bezier(0.4, 0, 1, 1)'
        });
        anim.onfinish = function () {
          anim = null;
          body.style.overflow = '';
          if (!opening) {
            row.open = false;
            row.classList.remove('is-closing');
          }
        };
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * Boot
   * ------------------------------------------------------------------ */

  /* ------------------------------------------------------------------ *
   * Boot
   * ------------------------------------------------------------------ */

  function boot() {
    setupVideos();
    setupMarquees();
    setupReveals();
    initAccordions(document);
    warmFlavorFrames();

    if (root.classList.contains('fizz-tx-cover')) uncoverPage();
    else if (!root.classList.contains('fizz-intro')) Fizz.reveal();
    // Otherwise js/fizz-intro.js calls Fizz.reveal() as the doors open.
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
