/**
 * Fizz — shared site script (every page).
 *
 *  1. Page reveal       — one place that decides when the page is "shown"
 *  2. Bubble transition — fizz rises over the page on leave, drains away on arrival
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

  var WAVE =
    '<path d="M0 50 C120 20 240 20 360 50 S600 80 720 50 S960 20 1080 50 S1320 80 1440 50 V100 H0Z"/>';

  function buildOverlay() {
    if (tx) return;
    tx = document.createElement('div');
    tx.id = 'fizz-tx';
    tx.setAttribute('aria-hidden', 'true');
    tx.innerHTML =
      '<div class="fizz-tx-liquid">' +
      '<svg class="fizz-tx-wave is-top" viewBox="0 0 1440 100" preserveAspectRatio="none">' + WAVE + '</svg>' +
      '<svg class="fizz-tx-wave is-bottom" viewBox="0 0 1440 100" preserveAspectRatio="none">' + WAVE + '</svg>' +
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

  function spawnBubbles(count, spread, rise) {
    var vh = window.innerHeight;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < count; i++) {
      var size = 8 + Math.pow(Math.random(), 2.2) * 84;
      var b = document.createElement('span');
      b.className = 'fizz-tx-bubble';
      b.style.width = b.style.height = size + 'px';
      b.style.left = 'calc(' + rand(0, 100).toFixed(2) + '% - ' + size / 2 + 'px)';
      frag.appendChild(b);
      var drift = rand(-60, 60);
      var anim = b.animate(
        [
          { transform: 'translate3d(0,0,0) scale(0.5)', opacity: 0 },
          { opacity: 1, offset: 0.12 },
          { opacity: 0.9, offset: 0.8 },
          { transform: 'translate3d(' + drift + 'px,' + -(vh * rise + size * 2) + 'px,0) scale(1)', opacity: 0 }
        ],
        {
          duration: rand(900, 1500),
          delay: rand(0, spread),
          easing: 'cubic-bezier(0.45, 0, 0.75, 0.6)',
          fill: 'backwards'
        }
      );
      anim.onfinish = (function (el) { return function () { el.remove(); }; })(b);
    }
    bubbleLayer.appendChild(frag);
  }

  function bubbleCount() {
    return window.innerWidth < 768 ? 18 : 34;
  }

  function animateLiquid(from, to, duration, easing) {
    var anim = liquid.animate(
      [{ transform: from }, { transform: to }],
      { duration: duration, easing: easing, fill: 'forwards' }
    );
    return new Promise(function (resolve) {
      anim.onfinish = resolve;
      setTimeout(resolve, duration + 400);
    });
  }

  /** Fizz floods up from the bottom of the screen. Resolves once fully covered. */
  function coverPage() {
    buildOverlay();
    tx.classList.add('is-active');
    spawnBubbles(bubbleCount(), 350, 1.15);
    return animateLiquid('translate3d(0,115%,0)', 'translate3d(0,0,0)', 750, 'cubic-bezier(0.65, 0, 0.35, 1)');
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
        spawnBubbles(bubbleCount() + 10, 250, 1.2);
        setTimeout(Fizz.reveal, 350);
        animateLiquid('translate3d(0,0,0)', 'translate3d(0,-115%,0)', 950, 'cubic-bezier(0.76, 0, 0.24, 1)').then(resetOverlay);
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
    var nodes = document.querySelectorAll('.action-heading-wrapper, .social-media-marquee, .marquee-vertical_wrapper, .action-background');
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
    var masks = document.querySelectorAll('.fizz-reveal-mask');
    if (!masks.length) return;
    if (!motion) return;
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
   * Boot
   * ------------------------------------------------------------------ */

  function boot() {
    setupVideos();
    setupMarquees();
    setupReveals();
    warmFlavorFrames();

    if (root.classList.contains('fizz-tx-cover')) uncoverPage();
    else if (!root.classList.contains('fizz-intro')) Fizz.reveal();
    // Otherwise js/fizz-intro.js calls Fizz.reveal() as the doors open.
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
