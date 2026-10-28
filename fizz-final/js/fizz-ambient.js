/**
 * Fizz — site-wide carbonation behind every section.
 *
 * Two fixed canvases sit behind the page content: a far layer (small, dim, softly blurred
 * bubbles that barely move with the page) and a near layer (fewer, brighter bubbles that
 * slide with the scroll). The difference in parallax is what reads as depth, the same
 * water the homepage "Turn boring flat water…" section is set in. A few thin bubble
 * streams rise along the edges so the copy column stays clean.
 *
 * Skipped under prefers-reduced-motion. Pauses while the tab is hidden.
 */
(function () {
  'use strict';

  if (!window.matchMedia || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var TAU = Math.PI * 2;
  var RGB = 'rgb(226, 246, 255)';
  var MOBILE = matchMedia('(max-width: 767px)');

  function rand(a, b) { return a + Math.random() * (b - a); }

  function layer(name) {
    var c = document.createElement('canvas');
    c.className = 'fizz-ambient ' + name;
    c.setAttribute('aria-hidden', 'true');
    document.body.appendChild(c);
    return c;
  }
  var far = layer('is-far');
  var near = layer('is-near');
  var fctx = far.getContext('2d');
  var nctx = near.getContext('2d');
  if (!fctx || !nctx) return;

  var W = 0, H = 0, DPR = 1;
  var bubbles = [];
  var sites = [];
  var chain = [];
  var lastY = window.scrollY;

  function bubble(anywhere) {
    var z = Math.random(); // 0 far … 1 near
    var big = Math.random() < 0.1;
    var r = big ? rand(2, 4.6) * (0.6 + 0.5 * z) : rand(0.5, 1.7) * (0.7 + 0.5 * z);
    return {
      x: rand(0, W),
      y: anywhere ? rand(0, H) : H + rand(4, 60),
      r: r,
      z: z,
      v: (10 + r * 9) * (0.45 + 0.55 * z),
      wa: big ? rand(1.5, 4) : rand(0.3, 1.4),
      wf: rand(0.3, 1),
      ph: rand(0, TAU),
      a: 0.12 + 0.42 * z,
      dx: 0
    };
  }

  function site() {
    var left = Math.random() < 0.5;
    return {
      x: W * (left ? rand(0.02, 0.16) : rand(0.84, 0.98)),
      every: rand(0.12, 0.26),
      wait: rand(0, 0.2),
      v: rand(26, 40),
      life: rand(8, 16),
      age: 0
    };
  }

  function count() {
    return Math.min(MOBILE.matches ? 90 : 220, Math.round((W * H) / (MOBILE.matches ? 4200 : 6200)));
  }

  function resize() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    if (w === W && Math.abs(h - H) < 120 && dpr === DPR) return; // ignore mobile URL-bar jitter
    W = w;
    H = h;
    DPR = dpr;
    [far, near].forEach(function (c) {
      c.width = Math.round(W * DPR);
      c.height = Math.round(H * DPR);
    });
    bubbles = [];
    for (var i = 0, n = count(); i < n; i++) bubbles.push(bubble(true));
    sites = [];
    chain = [];
    for (var s = 0, m = MOBILE.matches ? 2 : 4; s < m; s++) {
      var st = site();
      st.age = rand(0, st.life * 0.7);
      sites.push(st);
    }
  }

  function draw(ctx, b, alpha) {
    var a = alpha;
    if (a <= 0.004) return;
    if (b.r < 1.8) {
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(b.x + b.dx, b.y, b.r, 0, TAU);
      ctx.fill();
      return;
    }
    ctx.beginPath();
    ctx.arc(b.x + b.dx, b.y, b.r, 0, TAU);
    ctx.globalAlpha = a * 0.1;
    ctx.fill();
    ctx.globalAlpha = a * 0.75;
    ctx.lineWidth = Math.max(0.6, b.r * 0.15);
    ctx.stroke();
    ctx.globalAlpha = a;
    ctx.beginPath();
    ctx.arc(b.x + b.dx - b.r * 0.35, b.y - b.r * 0.38, b.r * 0.22, 0, TAU);
    ctx.fill();
  }

  function prep(ctx) {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = RGB;
    ctx.strokeStyle = RGB;
  }

  var running = false;
  var last = 0;
  var t = 0;

  function frame(now) {
    if (!running) return;
    var dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    t += dt;

    // Scrolling the page moves the water past you: near bubbles more than far ones.
    var y = window.scrollY;
    var ds = y - lastY;
    lastY = y;
    if (Math.abs(ds) > H) ds = 0; // jumps (anchor links) shouldn't smear the field

    for (var i = 0; i < bubbles.length; i++) {
      var b = bubbles[i];
      b.y -= b.v * dt + ds * (0.08 + 0.5 * b.z);
      b.dx = Math.sin(t * b.wf + b.ph) * b.wa;
      if (b.y < -12) bubbles[i] = bubble(false);
      else if (b.y > H + 70) { b.y = -10; b.x = rand(0, W); }
    }

    for (var s = 0; s < sites.length; s++) {
      var st = sites[s];
      st.age += dt;
      st.wait -= dt;
      if (st.age > st.life) { sites[s] = site(); continue; }
      if (st.wait <= 0) {
        st.wait = st.every;
        chain.push({ x: st.x, y: H + 4, r: rand(0.5, 1.3), z: 0.75, v: st.v, a: 0.45, dx: 0, ph: rand(0, TAU), age: 0 });
      }
    }
    for (var c = chain.length - 1; c >= 0; c--) {
      var p = chain[c];
      p.age += dt;
      p.v += 10 * dt; // seltzer streams speed up and grow as they rise
      p.r = Math.min(2.2, p.r + 0.05 * dt);
      p.y -= p.v * dt + ds * 0.45;
      p.dx = Math.sin(p.age * 2 + p.ph) * 0.8;
      if (p.y < -10) chain.splice(c, 1);
    }

    prep(fctx);
    prep(nctx);
    for (var k = 0; k < bubbles.length; k++) {
      var q = bubbles[k];
      draw(q.z < 0.5 ? fctx : nctx, q, q.a * Math.min(1, q.y / (H * 0.25))); // fade toward the surface
    }
    for (var j = 0; j < chain.length; j++) {
      var cb = chain[j];
      draw(nctx, cb, cb.a * Math.min(1, cb.y / (H * 0.3)));
    }
    fctx.globalAlpha = 1;
    nctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }

  function start() {
    if (running || document.hidden) return;
    running = true;
    last = 0;
    lastY = window.scrollY;
    requestAnimationFrame(frame);
  }
  function stop() { running = false; }

  resize();
  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
  var begin = function () {
    document.documentElement.classList.add('fizz-ambient-on');
    start();
  };
  if (window.Fizz && window.Fizz.onReveal) window.Fizz.onReveal(begin);
  else begin();
})();
