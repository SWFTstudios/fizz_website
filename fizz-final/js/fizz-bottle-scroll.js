/**
 * Fizz Bottle page — "key features" scroll scrub.
 *
 * Scrolling through [data-kf-section] plays a 121-frame image sequence on a canvas
 * and fades the feature cards in and out.
 *
 * Smoothness rules:
 *  - Frames load coarse-to-fine (every 8th, then every 4th, 2nd, then the rest), so a
 *    fast scroll always has evenly spaced frames to show instead of jumping around.
 *  - Frames are decoded before they're drawn, so drawing never stalls the main thread.
 *  - Section geometry is measured on resize only — no layout reads while scrolling.
 *  - Time-based easing: the same glide at 60 Hz or 120 Hz, and the loop sleeps when idle.
 */
(function () {
  'use strict';

  var MANIFEST = 'documents/6a9ac62ff19a782df3e07fba_fizz-kf-frame-urls-v4.json';
  var MOBILE = window.matchMedia('(max-width: 991px)');
  var EASE_MS = 110; // smoothing time constant
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  /** Coarse-to-fine load order: 0, 8, 16 … then 4, 12 … then 2, 6 … then odd frames. */
  function loadOrder(count) {
    var order = [];
    var seen = {};
    [8, 4, 2, 1].forEach(function (step) {
      for (var i = 0; i < count; i += step) {
        if (!seen[i]) { seen[i] = true; order.push(i); }
      }
    });
    if (!seen[count - 1]) order.push(count - 1);
    return order;
  }

  function Player(host, urls) {
    var canvas = document.createElement('canvas');
    host.textContent = '';
    host.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var frames = new Array(urls.length);
    var queue = loadOrder(urls.length);
    var inFlight = 0;
    var drawn = -1;
    var wanted = 0;
    var alive = true;

    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.round(host.clientWidth * dpr);
      var h = Math.round(host.clientHeight * dpr);
      if (!w || !h || (canvas.width === w && canvas.height === h)) return;
      canvas.width = w;
      canvas.height = h;
      drawn = -1;
      draw(wanted);
    }

    function paint(img) {
      var s = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
      var w = img.naturalWidth * s;
      var h = img.naturalHeight * s;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    }

    /** Draw the closest loaded frame, preferring the one just behind the target. */
    function draw(i) {
      wanted = i;
      var pick = -1;
      for (var d = 0; d < frames.length; d++) {
        if (i - d >= 0 && frames[i - d]) { pick = i - d; break; }
        if (i + d < frames.length && frames[i + d]) { pick = i + d; break; }
      }
      if (pick < 0 || pick === drawn) return;
      drawn = pick;
      paint(frames[pick]);
    }

    function pump() {
      while (alive && queue.length && inFlight < 6) {
        inFlight++;
        (function (i) {
          var img = new Image();
          img.decoding = 'async';
          var done = function (ok) {
            inFlight--;
            if (!alive) return;
            if (ok) {
              frames[i] = img;
              // A closer frame just arrived — show it.
              if (Math.abs(i - wanted) < Math.abs(drawn - wanted) || drawn < 0) { drawn = -1; draw(wanted); }
            }
            pump();
          };
          img.onload = function () {
            (img.decode ? img.decode() : Promise.resolve()).then(function () { done(true); }, function () { done(true); });
          };
          img.onerror = function () { done(false); };
          img.src = urls[i];
        })(queue.shift());
      }
    }

    new ResizeObserver(size).observe(host);
    size();
    pump();

    return {
      count: urls.length,
      draw: draw,
      destroy: function () {
        alive = false;
        host.textContent = '';
      }
    };
  }

  function init() {
    var section = document.querySelector('[data-kf-section]');
    if (!section) return;
    var hosts = {
      desktop: section.querySelector('[data-kf-lottie="desktop"]'),
      mobile: section.querySelector('[data-kf-lottie="mobile"]')
    };
    var cards = Array.prototype.slice.call(section.querySelectorAll('[data-kf-card]')).map(function (el) {
      var start = parseFloat(el.getAttribute('data-kf-start')) || 0;
      var end = parseFloat(el.getAttribute('data-kf-end')) || 1;
      return { el: el, start: start, end: Math.max(end, start + 0.01) };
    });

    var manifest = null;
    var player = null;
    var geometry = { top: 0, scrub: 1, curtain: 0 };
    var target = 0;
    var shown = 0;
    var raf = 0;
    var last = 0;

    function measure() {
      var rect = section.getBoundingClientRect();
      var vh = window.innerHeight;
      var total = section.offsetHeight - vh;
      // The section slides up under the hero for the first screen ("curtain"), then scrubs.
      geometry.top = rect.top + window.scrollY;
      geometry.curtain = total - vh > 0 ? vh : 0;
      geometry.scrub = Math.max(1, total - geometry.curtain);
    }

    function progress() {
      return clamp((window.scrollY - geometry.top - geometry.curtain) / geometry.scrub, 0, 1);
    }

    function render(p) {
      if (player) player.draw(Math.round(p * (player.count - 1)));
      cards.forEach(function (c) {
        var t = clamp((p - c.start) / (c.end - c.start), 0, 1);
        c.el.style.opacity = t;
        c.el.style.transform = 'translate3d(0,' + (1 - t) * 28 + 'px,0)';
      });
    }

    function tick(now) {
      var dt = Math.min(64, now - (last || now));
      last = now;
      shown = reduced ? target : shown + (target - shown) * (1 - Math.exp(-dt / EASE_MS));
      if (Math.abs(target - shown) < 0.0005) shown = target;
      render(shown);
      raf = shown === target ? 0 : requestAnimationFrame(tick);
      if (!raf) last = 0;
    }

    function onScroll() {
      target = progress();
      if (!raf) raf = requestAnimationFrame(tick);
    }

    function usePlayer() {
      if (!manifest) return;
      var key = MOBILE.matches ? 'mobile' : 'desktop';
      if (player && player.key === key) return;
      if (player) player.destroy();
      player = Player(hosts[key], manifest[key] || []);
      player.key = key;
      render(shown);
    }

    function start() {
      fetch(MANIFEST)
        .then(function (r) { return r.json(); })
        .then(function (data) {
          manifest = data;
          usePlayer();
        })
        .catch(function () {});
    }

    measure();
    target = shown = progress();
    render(shown);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { measure(); usePlayer(); onScroll(); });
    window.addEventListener('load', function () { measure(); onScroll(); });
    MOBILE.addEventListener('change', usePlayer);

    // Start fetching frames a couple of screens before the section arrives.
    new IntersectionObserver(function (entries, io) {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      start();
    }, { rootMargin: '200% 0px' }).observe(section);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
