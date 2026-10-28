/**
 * Fizz — the cursor moves like it's underwater.
 *
 * A soft ring trails the pointer on a slow spring (water resists, so it lags and settles),
 * and moving through the page sheds a few fine bubbles that float up, wobble and fade.
 * Over links and buttons the ring opens up. The native cursor stays visible, so nothing
 * about clicking changes; this is texture only.
 *
 * Mouse / trackpad only (pointer: fine), skipped under prefers-reduced-motion. The canvas
 * idles (no animation frames) once the ring has settled and the last bubble is gone.
 */
(function () {
  'use strict';

  if (!window.matchMedia) return;
  if (!matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var TAU = Math.PI * 2;
  var canvas = document.createElement('canvas');
  canvas.className = 'fizz-cursor';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var W = 0, H = 0, DPR = 1;
  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  function rand(a, b) { return a + Math.random() * (b - a); }

  var mouse = { x: -100, y: -100, seen: false };
  var ring = { x: -100, y: -100, vx: 0, vy: 0, r: 14, tr: 14, a: 0 };
  var bubbles = [];
  var hovering = false;
  var budget = 0;
  var running = false;
  var last = 0;

  var INTERACTIVE = 'a, button, [role="button"], input, select, textarea, label, summary, .w-slide';

  window.addEventListener('pointermove', function (e) {
    if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    var dx = e.clientX - mouse.x;
    var dy = e.clientY - mouse.y;
    if (!mouse.seen) {
      ring.x = e.clientX;
      ring.y = e.clientY;
      dx = dy = 0;
    }
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.seen = true;
    // Faster strokes stir up more bubbles, capped so it never turns into a stream.
    budget = Math.min(budget + Math.sqrt(dx * dx + dy * dy) / 20, 3);
    var el = e.target instanceof Element ? e.target : null;
    hovering = !!(el && el.closest(INTERACTIVE));
    start();
  }, { passive: true });

  document.addEventListener('pointerleave', function () { mouse.seen = false; start(); });
  window.addEventListener('blur', function () { mouse.seen = false; start(); });
  window.addEventListener('pointerdown', function () {
    // A tap releases a small puff of bubbles at the pointer.
    for (var i = 0; i < 6; i++) spawn(mouse.x + rand(-6, 6), mouse.y + rand(-4, 4), true);
    start();
  }, { passive: true });

  function spawn(x, y, puff) {
    if (bubbles.length > 60) return;
    var r = Math.random() < 0.8 ? rand(0.8, 1.9) : rand(2, 3.4);
    bubbles.push({
      x: x, y: y, r: r,
      vy: -(puff ? rand(30, 70) : rand(14, 34)) - r * 6,
      vx: puff ? rand(-18, 18) : rand(-6, 6),
      ph: rand(0, TAU), wf: rand(2, 4), wa: rand(0.6, 1.6),
      life: 0, max: rand(0.9, 1.8), a: rand(0.35, 0.7)
    });
  }

  function frame(now) {
    if (!running) return;
    var dt = Math.min(0.033, (now - (last || now)) / 1000);
    last = now;

    // Ring: a damped spring toward the pointer, heavy enough to feel like water.
    var k = 38, damp = 9.5;
    ring.vx += ((mouse.x - ring.x) * k - ring.vx * damp) * dt;
    ring.vy += ((mouse.y - ring.y) * k - ring.vy * damp) * dt;
    ring.x += ring.vx * dt;
    ring.y += ring.vy * dt;
    ring.tr = hovering ? 26 : 14;
    ring.r += (ring.tr - ring.r) * Math.min(1, dt * 10);
    var targetA = mouse.seen ? 1 : 0;
    ring.a += (targetA - ring.a) * Math.min(1, dt * 6);

    // Bubbles shed from just behind the ring.
    while (budget >= 1 && mouse.seen) {
      budget -= 1;
      spawn(ring.x + rand(-ring.r, ring.r) * 0.6, ring.y + rand(-ring.r, ring.r) * 0.6, false);
    }

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);

    for (var i = bubbles.length - 1; i >= 0; i--) {
      var b = bubbles[i];
      b.life += dt;
      if (b.life > b.max) { bubbles.splice(i, 1); continue; }
      b.vy -= 18 * dt; // buoyancy
      b.vx *= 1 - 2.5 * dt; // water drag
      b.x += (b.vx + Math.sin(b.life * b.wf + b.ph) * b.wa * 8) * dt;
      b.y += b.vy * dt;
      var p = b.life / b.max;
      var a = b.a * (p < 0.15 ? p / 0.15 : 1 - (p - 0.15) / 0.85);
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, TAU);
      if (b.r < 2) {
        ctx.fillStyle = 'rgb(232, 248, 255)';
        ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(232, 248, 255, 0.12)';
        ctx.fill();
        ctx.strokeStyle = 'rgb(232, 248, 255)';
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
    }

    if (ring.a > 0.01) {
      ctx.globalAlpha = ring.a * 0.55;
      ctx.strokeStyle = 'rgb(214, 238, 248)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.r, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = ring.a * (hovering ? 0.1 : 0.05);
      ctx.fillStyle = 'rgb(196, 227, 253)';
      ctx.fill();
      // A pin of light on the upper-left rim, like a real bubble.
      ctx.globalAlpha = ring.a * 0.6;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(ring.x - ring.r * 0.5, ring.y - ring.r * 0.55, 1.2, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    var settled = Math.abs(mouse.x - ring.x) < 0.3 && Math.abs(mouse.y - ring.y) < 0.3 &&
      Math.abs(ring.r - ring.tr) < 0.2 && Math.abs(ring.a - targetA) < 0.01;
    if (settled && !bubbles.length) { running = false; return; }
    requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    last = 0;
    requestAnimationFrame(frame);
  }
})();
