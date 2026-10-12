/**
 * Fizz homepage — "Turn boring flat water…" story section.
 *
 * The two photos float as if suspended in seltzer: a slow buoyant bob that never syncs
 * between them, a scroll parallax in opposite directions, and a soft "surfacing" entrance.
 * Carbonation rises on two canvases: a deep field of tiny bubbles and nucleation streams
 * behind everything, and a few larger bubbles drifting up across the photos in front.
 * Scrolling stirs the water a little (bubbles rise faster, far ones lag behind).
 *
 * Replaces Webflow's "Parallax image - Left/Right" interactions; the photos' data-w-id
 * attributes were removed in index.html so the two don't fight over the transform.
 */
(function () {
  'use strict';

  var section = document.querySelector('[data-fizz-seltzer]');
  if (!section) return;

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MOBILE = window.matchMedia('(max-width: 767px)');
  var TAU = Math.PI * 2;
  var BUBBLE_RGB = 'rgb(226, 246, 255)';

  function rand(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* ---------- Canvases ---------- */

  function layer(name) {
    var c = document.createElement('canvas');
    c.className = 'fizz-seltzer-layer ' + name;
    c.setAttribute('aria-hidden', 'true');
    return c;
  }
  var back = layer('is-back');
  var front = layer('is-front');
  section.insertBefore(back, section.firstChild);
  section.appendChild(front);
  var bctx = back.getContext('2d');
  var fctx = front.getContext('2d');
  if (!bctx || !fctx) return;

  var W = 0;
  var H = 0;
  var DPR = 1;

  /* ---------- Bubbles ---------- */

  var field = [];  // free-floating carbonation, z = depth (0 far, 1 near)
  var sites = [];  // nucleation sites that emit thin chains of tiny bubbles
  var chain = [];  // bubbles emitted by the sites
  var near = [];   // a few bigger bubbles rising across the photos

  function fieldBubble(anywhere) {
    var z = Math.random();
    var big = Math.random() < 0.06;
    var r = big ? rand(2.4, 4.8) * (0.6 + 0.4 * z) : rand(0.5, 1.5) * (0.7 + 0.5 * z);
    return {
      x: rand(0, W),
      y: anywhere ? rand(0, H) : H + rand(4, 40),
      r: r,
      z: z,
      v: (10 + r * 9) * (0.5 + 0.5 * z), // bigger bubbles rise faster
      wa: big ? rand(2, 5) : rand(0.3, 1.6),
      wf: rand(0.4, 1.2),
      ph: rand(0, TAU),
      a: 0.1 + 0.4 * z,
      dx: 0
    };
  }

  function site() {
    // Desktop keeps the streams out of the copy column so the headline stays clean.
    var side = Math.random() < 0.5;
    var x = MOBILE.matches ? rand(0.04, 0.96) : side ? rand(0.03, 0.3) : rand(0.7, 0.97);
    return {
      x: W * x,
      base: H * rand(0.72, 1.02),
      every: rand(0.16, 0.32),
      wait: 0,
      v: rand(16, 26),
      life: rand(7, 14),
      age: 0
    };
  }

  function fieldCount() {
    return Math.min(MOBILE.matches ? 80 : 190, Math.round((W * H) / (MOBILE.matches ? 6000 : 7000)));
  }

  function populate() {
    field = [];
    chain = [];
    near = [];
    for (var i = 0, n = fieldCount(); i < n; i++) field.push(fieldBubble(true));
    sites = [];
    for (var s = 0, m = MOBILE.matches ? 2 : 3; s < m; s++) {
      var st = site();
      st.age = rand(0, st.life * 0.6);
      sites.push(st);
    }
    // Pre-run the streams so they are already flowing when the section comes into view.
    for (var k = 0; k < 240; k++) stepChains(1 / 30, k / 30, 0, 1);
  }

  function resize() {
    var w = section.clientWidth;
    var h = section.clientHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    if (w === W && h === H && dpr === DPR) return;
    W = w;
    H = h;
    DPR = dpr;
    [back, front].forEach(function (c) {
      c.width = Math.round(W * DPR);
      c.height = Math.round(H * DPR);
    });
    populate();
    if (REDUCED) paint(0);
  }

  function drawBubble(ctx, x, y, r, a) {
    if (a <= 0.004) return;
    if (r < 1.9) {
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
      return;
    }
    // Larger bubbles: faint body, thin rim, a pin of light near the top.
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.globalAlpha = a * 0.12;
    ctx.fill();
    ctx.globalAlpha = a * 0.8;
    ctx.lineWidth = Math.max(0.7, r * 0.16);
    ctx.stroke();
    ctx.globalAlpha = a;
    ctx.beginPath();
    ctx.arc(x - r * 0.36, y - r * 0.38, r * 0.24, 0, TAU);
    ctx.fill();
  }

  function prep(ctx) {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = BUBBLE_RGB;
    ctx.strokeStyle = BUBBLE_RGB;
  }

  function paint() {
    prep(bctx);
    field.forEach(function (b) { drawBubble(bctx, b.x + b.dx, b.y, b.r, b.a); });
    chain.forEach(function (b) { drawBubble(bctx, b.x + b.dx, b.y, b.r, b.a * b.fade); });
    bctx.globalAlpha = 1;
    prep(fctx);
    near.forEach(function (b) { drawBubble(fctx, b.x + b.dx, b.y, b.r, b.a * b.fade); });
    fctx.globalAlpha = 1;
  }

  /* ---------- Photos ---------- */

  var cards = Array.prototype.map.call(section.querySelectorAll('.story-image'), function (el, i) {
    return {
      el: el,
      inner: el.querySelector('.story-background-wrapper'),
      dir: i === 0 ? 1 : -1,         // opposite parallax, like the original interaction
      period: i === 0 ? 7.6 : 9.3,   // seconds per bob; different so they never sync
      phase: i === 0 ? 0 : 2.2,
      tilt: i === 0 ? -1.2 : 1.4,
      tiltMobile: i === 0 ? -3 : 2.6,
      delay: i * 0.18,
      spawn: rand(0.2, 1)
    };
  });

  // A damped spring: rises into place, overshoots a touch, settles — like something buoyant.
  function settle(x) {
    if (x <= 0) return 0;
    if (x > 3) return 1;
    return 1 - Math.exp(-4 * x) * Math.cos(3.4 * x);
  }

  var enterAt = 0;

  function moveCards(t, p) {
    var mobile = MOBILE.matches;
    var amp = mobile ? 6 : 10;
    cards.forEach(function (c) {
      var h = c.el.offsetHeight;
      var w = (t * TAU) / c.period + c.phase;
      var bob = Math.sin(w) * amp;
      var sway = Math.sin(w * 0.73 + 1.3) * amp * 0.45;
      var tilt = (mobile ? c.tiltMobile : c.tilt) + Math.sin(w * 0.88 + 0.6) * 0.7;
      var par = -p * c.dir * h * (mobile ? 0.05 : 0.08);
      var since = enterAt ? t - enterAt - c.delay : 0;
      var rise = (1 - settle(since)) * 70;
      c.el.style.opacity = enterAt ? clamp(since * 2.2, 0, 1).toFixed(3) : '0';
      c.el.style.transform =
        'translate3d(' + sway.toFixed(2) + 'px,' + (par + bob + rise).toFixed(2) + 'px,0) rotate(' + tilt.toFixed(3) + 'deg)';
      if (c.inner) {
        c.inner.style.transform = 'translate3d(0,' + (p * c.dir * h * 0.045).toFixed(2) + 'px,0) scale(1.14)';
      }
    });
  }

  /* ---------- Simulation ---------- */

  var energy = 0;
  var lastScroll = window.scrollY;

  function stepChains(dt, t, ds, stir) {
    sites.forEach(function (s, i) {
      s.age += dt;
      if (s.age > s.life) {
        sites[i] = site();
        return;
      }
      s.wait -= dt * stir;
      if (s.wait > 0) return;
      s.wait = s.every * rand(0.8, 1.25);
      var strength = Math.min(1, s.age / 1.5, (s.life - s.age) / 1.5);
      chain.push({ x: s.x, y: s.base, base: s.base, r0: rand(0.45, 0.7), r: 0.5, v: s.v * rand(0.9, 1.1), ph: rand(0, TAU), a: 0.22 * strength, fade: 0, dx: 0 });
    });

    for (var i = chain.length - 1; i >= 0; i--) {
      var c = chain[i];
      // Real seltzer chains: bubbles grow and speed up as they rise, so the stream starts
      // as a tight thread and opens out toward the top.
      c.v += 34 * dt;
      c.y -= c.v * stir * dt;
      c.y += ds * 0.15;
      var risen = (c.base - c.y) / H;
      c.r = c.r0 + risen * 1.2;
      c.fade = Math.min(1, risen * 8);
      c.dx = Math.sin(t * 1.6 + c.ph + c.y * 0.02) * 0.8;
      if (c.y < -8) chain.splice(i, 1);
    }
  }

  function step(dt, t, ds, sr, rects) {
    var stir = 1 + energy;

    field.forEach(function (b, i) {
      b.y -= b.v * stir * dt;
      b.y += ds * 0.35 * (1 - b.z); // far bubbles lag behind the page: depth
      b.dx = Math.sin(t * b.wf * TAU + b.ph) * b.wa;
      if (b.y < -12) field[i] = fieldBubble(false);
      else if (b.y > H + 60) b.y -= H + 60;
    });

    stepChains(dt, t, ds, stir);

    // Bigger bubbles drifting up across each photo, more of them when the water is stirred.
    cards.forEach(function (card, k) {
      if (!enterAt) return;
      card.spawn -= dt * (1 + energy * 2.5);
      if (card.spawn > 0) return;
      card.spawn = rand(0.55, 1.5);
      var r = rects[k];
      var top = r.top - sr.top;
      var startY = r.bottom - sr.top - rand(0, r.height * 0.25);
      near.push({
        x: r.left - sr.left + rand(0.08, 0.92) * r.width,
        y: startY,
        from: startY,
        to: top + r.height * rand(0, 0.25),
        r: rand(1.3, 3.4),
        v: rand(26, 52),
        wa: rand(1, 3),
        wf: rand(0.5, 1),
        ph: rand(0, TAU),
        a: rand(0.35, 0.6),
        fade: 0,
        dx: 0
      });
    });

    for (var j = near.length - 1; j >= 0; j--) {
      var b = near[j];
      b.y -= b.v * stir * dt;
      b.dx = Math.sin(t * b.wf * TAU + b.ph) * b.wa;
      var f = (b.from - b.y) / Math.max(1, b.from - b.to);
      b.fade = clamp(Math.min(f / 0.15, (1 - f) / 0.25), 0, 1);
      if (f >= 1) near.splice(j, 1);
    }
  }

  var raf = 0;
  var last = 0;

  function frame(now) {
    raf = requestAnimationFrame(frame);
    var t = now / 1000;
    var dt = last ? Math.min(0.05, t - last) : 0;
    last = t;

    var sy = window.scrollY;
    var ds = sy - lastScroll;
    lastScroll = sy;
    energy = Math.min(0.9, energy * Math.pow(0.15, dt) + Math.abs(ds) * 0.0025);

    // Read layout first, then write.
    var sr = section.getBoundingClientRect();
    var vh = window.innerHeight;
    var rects = cards.map(function (c) { return c.el.getBoundingClientRect(); });
    if (!enterAt && sr.top < vh * 0.82) enterAt = t;
    // -1 while the section is below the viewport centre, +1 once it has scrolled past.
    var p = clamp((vh / 2 - (sr.top + sr.height / 2)) / (vh / 2 + sr.height / 2), -1, 1);

    moveCards(t, p);
    step(dt, t, ds, sr, rects);
    paint();
  }

  function start() {
    if (raf) return;
    last = 0;
    lastScroll = window.scrollY;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
  }

  resize();
  new ResizeObserver(resize).observe(section);
  MOBILE.addEventListener('change', populate);

  // Reduced motion: a still glass of seltzer, photos stay put.
  if (REDUCED) return;

  cards.forEach(function (c) { c.el.style.opacity = '0'; });
  new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) start();
    else stop();
  }, { rootMargin: '120px 0px' }).observe(section);
})();
