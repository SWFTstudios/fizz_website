/**
 * Fizz homepage — "Turn boring flat water…" story section.
 *
 * Photos float as if suspended in seltzer, at different depths:
 *   deep bubbles → far photos (small, soft, dim) → nearer bubbles → mid photos
 *   → the copy and the two hero photos → a few bubbles drifting across the front.
 * About six floating photos rise through the water at a time, like the bubbles do: farther
 * ones slower, swaying as they go, fading out toward the surface and resurfacing from below
 * in a new spot with the next photo in the rotation. Tapping a photo opens it on its own in
 * a lightbox with a "Shop the bottle" call to action.
 * The section overlaps the end of the hero with a clear-to-deep gradient, so the page sinks
 * into the water, and the copy surfaces as it scrolls in.
 *
 * Replaces Webflow's "Parallax image - Left/Right" interactions; the hero photos'
 * data-w-id attributes were removed in index.html so the two don't fight over transforms.
 */
(function () {
  'use strict';

  var section = document.querySelector('[data-fizz-seltzer]');
  if (!section) return;

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MOBILE = window.matchMedia('(max-width: 767px)');
  var FINE_POINTER = window.matchMedia('(pointer: fine)');
  var TAU = Math.PI * 2;
  var BUBBLE_RGB = 'rgb(226, 246, 255)';
  var FAR = 0.45; // photos and bubbles shallower than this sit behind the mid layer

  function rand(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* ---------- Photos ---------- */

  // Webflow exports keep -p-500/-p-800/-p-1600 variants next to the original.
  function photo(file, alt, opts) {
    var base = 'images/' + file;
    var o = opts || {};
    if (o.still) {
      // 864×1080 video stills: the original is already small.
      return { small: base + '.webp', medium: base + '.webp', large: base + '.webp', alt: alt };
    }
    return {
      small: base + '-p-500.webp',
      medium: base + '-p-800.webp',
      large: o.noLarge ? base + '.webp' : base + '-p-1600.webp',
      alt: alt
    };
  }

  var L = '_CoreHome_FIZZ_Lifestyles_';
  var PHOTOS = {
    drink: photo('6a96f4a3a8e021558ee41cc0_Fizz_4x5.00_00_24_08.Still022', 'Drinking sparkling water from a black Fizz bottle', { still: true }),
    courtside: photo('6a96f4adf758c41a0972b938' + L + '22', 'Holding a black Fizz bottle by a tennis court fence'),
    field: photo('6a96f4efe520901f07f813fc' + L + '15', 'Carrying a black Fizz bottle across a sports field'),
    toss: photo('6a96f4d74a1bebd117817b23' + L + '31', 'A blue Fizz bottle tossed in the air in a city park'),
    blueClose: photo('6a96f4d89088f84fc6dd71d9' + L + '65', 'Bubbles rising inside a blue Fizz bottle'),
    sandBlue: photo('6a96f4e7f758c41a0972e32f' + L + '73', 'A blue Fizz bottle lifted from the sand beside a volleyball'),
    tennis: photo('6a96f4a90c862000b0869089' + L + '34', 'Smiling on a tennis court with a white Fizz bottle'),
    tennisSit: photo('6a96f4a53e0f8edd6facab58' + L + '37', 'A courtside break with a white Fizz bottle'),
    cheers: photo('6a96f4b95dc455665ea0ba84' + L + '29', 'Three Fizz bottles raised against a blue sky'),
    sunset: photo('6a96f4d098f5689a40038ffa' + L + '69', 'A Fizz bottle held up at sunset on the beach'),
    press: photo('6a96f4d925fc106e23d5f84c' + L + '52', 'Pressing the lid of a white Fizz bottle to carbonate'),
    charge: photo('6a96f4e1e520901f07f80f4d' + L + '48', 'A Fizz CO2 charge beside the bottle'),
    grass: photo('6a96f4e7d0e30d8bc8aacdaa' + L + '18', 'Sitting on the grass with a black Fizz bottle'),
    walk: photo('6a96f4a0dba7c9a2440ec55c_Fizz_4x5.00_00_09_27.Still004', 'Walking on the sand with a blue Fizz bottle', { still: true }),
    car: photo('6a96f4b69088f84fc6dd53ae' + L + '11', 'A white Fizz bottle in a car cup holder'),
    carHand: photo('6a96f4e77c21af0d51d9062a' + L + '08', 'Reaching for a white Fizz bottle in the car'),
    fizzClose: photo('6a96f4a5f758c41a0972b5bc' + L + '14', 'Fine bubbles inside a Fizz bottle', { noLarge: true }),
    carry: photo('6a96f4a08ffdf9cb45d428e6_Fizz_4x5.00_00_09_07.Still003', 'Carrying a black Fizz bottle by the water', { still: true }),
    courtTop: photo('6a96f4f175ce6e2538cf01f5' + L + '39', 'A white Fizz bottle on a tennis court beside a racket'),
    volley: photo('6a96f4ddd0c177cc41c631ad' + L + '74', 'A blue Fizz bottle beside a volleyball in the sand'),
    share: photo('6a96f4d12cf312de51828786' + L + '41', 'Passing Fizz bottles over the tennis net'),
    bleachers: photo('6a96f4d72ce74d2fb0218aee' + L + '55', 'A blue Fizz bottle at the bleachers'),
    chargeLife: photo('6a99caff47d2352ba2661c23_fizz-charge-lifestyle', 'A Fizz charge cartridge next to the bottle'),
    rooftop: photo('6a96f4eb4a1bebd117818394' + L + '60', 'Black, blue and white Fizz bottles on a rooftop bench')
  };

  // The two hero photos already in the page (left, right).
  var HERO = ['drink', 'toss'];

  // The rotation of floating photos. depth: 0 = far back, 1 = against the glass.
  // w: [desktop, phone] width as a fraction of the section.
  var FLOATERS = [
    { depth: 0.62, photo: 'grass', w: [0.12, 0.24] },
    { depth: 0.6, photo: 'tennis', w: [0.115, 0.27] },
    { depth: 0.58, photo: 'courtside', w: [0.11, 0.23] },
    { depth: 0.56, photo: 'cheers', w: [0.105, 0.25] },
    { depth: 0.54, photo: 'sunset', w: [0.105, 0.22] },
    { depth: 0.52, photo: 'blueClose', w: [0.1, 0.22] },
    { depth: 0.5, photo: 'press', w: [0.1, 0.21] },
    { depth: 0.36, photo: 'rooftop', w: [0.09, 0.2] },
    { depth: 0.32, photo: 'car', w: [0.08, 0.2] },
    { depth: 0.3, photo: 'field', w: [0.08, 0.17] },
    { depth: 0.28, photo: 'volley', w: [0.085, 0.18] },
    { depth: 0.26, photo: 'sandBlue', w: [0.075, 0.16] },
    { depth: 0.24, photo: 'walk', w: [0.07, 0.17] },
    { depth: 0.22, photo: 'carry', w: [0.07, 0.16] },
    { depth: 0.2, photo: 'chargeLife', w: [0.075, 0.16] },
    { depth: 0.19, photo: 'charge', w: [0.065, 0.16] },
    { depth: 0.18, photo: 'tennisSit', w: [0.065, 0.15] },
    { depth: 0.16, photo: 'courtTop', w: [0.06, 0.15] }
  ];

  // How many photos float at once (about six on screen; the rest are below or surfacing).
  var SLOTS = { desk: 11, phone: 11 };

  // Rotation order: one nearer photo, then two farther ones, so depths stay mixed.
  function rotation(list) {
    var nearer = list.filter(function (f) { return f.depth >= FAR; });
    var farther = list.filter(function (f) { return f.depth < FAR; });
    var out = [];
    while (nearer.length || farther.length) {
      if (nearer.length) out.push(nearer.shift());
      if (farther.length) out.push(farther.shift());
      if (farther.length) out.push(farther.shift());
    }
    return out;
  }
  var POOL = {
    desk: rotation(FLOATERS),
    phone: rotation(FLOATERS.filter(function (f) { return f.w[1] > 0; }))
  };
  var poolAt = 0;

  /* ---------- Cards: the two hero photos + the floaters ---------- */

  var W = 0;
  var H = 0;
  var DPR = 1;
  var cards = [];

  Array.prototype.forEach.call(section.querySelectorAll('.story-image'), function (el, i) {
    var inner = el.querySelector('.story-background-wrapper');
    var key = HERO[i];
    if (!inner || !key) return;
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', 'View photo: ' + PHOTOS[key].alt);
    cards.push({
      el: el,
      inner: inner,
      hero: true,
      depth: 1,
      photo: key,
      dir: i === 0 ? 1 : -1,         // opposite parallax, like the original interaction
      period: i === 0 ? 7.6 : 9.3,   // seconds per bob; different so they never sync
      phase: i === 0 ? 0 : 2.2,
      tilt: i === 0 ? -1.2 : 1.4,
      tiltMobile: i === 0 ? -3 : 2.6,
      delay: i * 0.18,
      rise: 70,
      spawn: rand(0.2, 1)
    });
  });

  // Floating cards are reusable slots: each takes the next photo in the rotation whenever it
  // resurfaces below the section, out of sight.
  for (var n = 0; n < Math.max(SLOTS.desk, SLOTS.phone); n++) {
    (function () {
      var el = document.createElement('button');
      el.type = 'button';
      el.className = 'fizz-floater';
      var media = document.createElement('span');
      media.className = 'fizz-floater-media';
      var img = document.createElement('img');
      img.alt = '';
      img.decoding = 'async';
      media.appendChild(img);
      el.appendChild(media);
      section.appendChild(el);
      var card = {
        el: el,
        img: img,
        hero: false,
        cfg: null,
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        ph: rand(0, TAU),
        speed: 1,
        hover: false
      };
      // Ease off under the cursor, so a photo is easy to catch.
      el.addEventListener('pointerenter', function () { card.hover = true; });
      el.addEventListener('pointerleave', function () { card.hover = false; });
      cards.push(card);
    })();
  }

  var heroes = cards.filter(function (c) { return c.hero; });
  var floaters = cards.filter(function (c) { return !c.hero; });
  var content = section.querySelector('.story-content');
  var textBox = null; // the copy, in section coordinates: photos dim as they pass behind it
  var placed = false;
  var lastW = 0;
  var lastH = 0;

  function slotCount() { return MOBILE.matches ? SLOTS.phone : SLOTS.desk; }

  // Give a slot the next photo in the rotation that isn't already floating.
  function assign(c) {
    var pool = POOL[MOBILE.matches ? 'phone' : 'desk'];
    var f = pool[0];
    for (var i = 0; i < pool.length; i++) {
      f = pool[poolAt++ % pool.length];
      var taken = floaters.some(function (o) { return o !== c && !o.el.hidden && o.cfg === f; });
      if (!taken) break;
    }
    c.cfg = f;
    c.photo = f.photo;
    c.depth = f.depth;
    c.opacity = Math.min(1, 0.32 + f.depth * 1.2);
    c.delay = 0.15 + (1 - f.depth) * 0.5;
    c.el.classList.toggle('is-far', f.depth < FAR);
    c.el.classList.toggle('is-mid', f.depth >= FAR);
    c.el.setAttribute('aria-label', 'View photo: ' + PHOTOS[f.photo].alt);
    // Atmospheric depth: farther photos are softer and bluer (and smaller).
    c.el.style.setProperty('--blur', Math.max(0, (FAR + 0.05 - f.depth) * 4.5).toFixed(2) + 'px');
    c.el.style.setProperty('--tint', ((1 - f.depth) * 0.5).toFixed(2));
    c.img.src = PHOTOS[f.photo].small;
    sizeFloater(c);
  }

  function sizeFloater(c) {
    var frac = c.cfg.w[MOBILE.matches ? 1 : 0];
    c.w = Math.max(MOBILE.matches ? 64 : 84, W * frac);
    c.h = c.w * 1.25;
    c.el.style.width = c.w.toFixed(1) + 'px';
    c.el.style.height = c.h.toFixed(1) + 'px';
  }

  // Desktop keeps the nearer photos out of the copy column. Of a few random spots, take the
  // one farthest from photos still low in the water, so they don't rise in clumps.
  function pickX(c) {
    var lanes = !MOBILE.matches && c.depth >= FAR;
    var best = W / 2;
    var bestGap = -1;
    for (var i = 0; i < 6; i++) {
      var x;
      if (lanes && textBox) {
        // Lanes either side of the copy, wide enough that the whole photo clears it.
        var leftMax = Math.max(c.w * 0.6, textBox.l - c.w * 0.45);
        var rightMin = Math.min(W - c.w * 0.6, textBox.r + c.w * 0.45);
        x = Math.random() < 0.5 ? rand(c.w * 0.4, leftMax) : rand(rightMin, W - c.w * 0.4);
      } else {
        x = W * rand(0.06, 0.94);
      }
      var gap = Infinity;
      floaters.forEach(function (o) {
        if (o !== c && !o.el.hidden && o.y > H * 0.5) gap = Math.min(gap, Math.abs(o.x - x));
      });
      if (gap > bestGap) {
        bestGap = gap;
        best = x;
      }
    }
    return best;
  }

  function launch(c) {
    assign(c);
    c.x = pickX(c);
    c.y = H + c.h * 0.6 + rand(0, H * 0.05);
    c.v = (22 + c.depth * 52) * rand(0.85, 1.15); // nearer photos rise faster, like bigger bubbles
    c.wa = 8 + c.depth * 16;                      // sway
    c.wf = rand(0.35, 0.6);
    c.tilt = rand(-5, 5);
  }

  function layoutCards() {
    heroes.forEach(function (c) { c.h = c.el.offsetHeight; });
    if (content) {
      var sr = section.getBoundingClientRect();
      var cr = content.getBoundingClientRect();
      textBox = { l: cr.left - sr.left, t: cr.top - sr.top, r: cr.right - sr.left, b: cr.bottom - sr.top };
    }
    floaters.forEach(function (c, i) { c.el.hidden = i >= slotCount(); });
    var shown = floaters.filter(function (c) { return !c.el.hidden; });
    if (!placed) {
      // Start mid-rise, spread through the water.
      poolAt = Math.floor(rand(0, 18));
      shown.forEach(function (c) { c.cfg = null; c.y = -H; });
      shown.forEach(function (c, i) {
        launch(c);
        c.y = H * 0.2 + (H * 0.85) * ((i + rand(0.15, 0.85)) / shown.length);
      });
      placed = true;
    } else if (lastW && lastH) {
      shown.forEach(function (c) {
        sizeFloater(c);
        c.x *= W / lastW;
        c.y *= H / lastH;
      });
    }
    lastW = W;
    lastH = H;
  }

  /* ---------- Canvases ---------- */

  function layer(name) {
    var c = document.createElement('canvas');
    c.className = 'fizz-seltzer-layer ' + name;
    c.setAttribute('aria-hidden', 'true');
    return c;
  }
  var deep = layer('is-deep');   // far bubbles, behind the far photos
  var mid = layer('is-mid');     // nearer bubbles and streams, between far and mid photos
  var front = layer('is-front'); // over the hero photos
  section.insertBefore(mid, section.firstChild);
  section.insertBefore(deep, section.firstChild);
  section.appendChild(front);
  var dctx = deep.getContext('2d');
  var mctx = mid.getContext('2d');
  var fctx = front.getContext('2d');
  if (!dctx || !mctx || !fctx) return;

  /* ---------- Bubbles ---------- */

  var field = [];  // free-floating carbonation, z = depth (0 far, 1 near)
  var sites = [];  // nucleation sites that emit thin chains of tiny bubbles
  var chain = [];  // bubbles emitted by the sites
  var near = [];   // a few bigger bubbles rising across the hero photos

  function fieldBubble(anywhere) {
    var z = Math.random();
    var big = Math.random() < 0.13;
    var r = big ? rand(2.2, 5.2) * (0.6 + 0.4 * z) : rand(0.6, 1.9) * (0.7 + 0.5 * z);
    return {
      x: rand(0, W),
      y: anywhere ? rand(0, H) : H + rand(4, 40),
      r: r,
      z: z,
      v: (16 + r * 12) * (0.5 + 0.5 * z), // bigger bubbles rise faster
      wa: big ? rand(2, 5) : rand(0.3, 1.6),
      wf: rand(0.4, 1.2),
      ph: rand(0, TAU),
      a: 0.16 + 0.5 * z,
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
      every: rand(0.09, 0.2),
      wait: 0,
      v: rand(22, 34),
      life: rand(7, 14),
      age: 0
    };
  }

  function fieldCount() {
    return Math.min(MOBILE.matches ? 200 : 460, Math.round((W * H) / (MOBILE.matches ? 2400 : 3000)));
  }

  function populate() {
    field = [];
    chain = [];
    near = [];
    for (var i = 0, n = fieldCount(); i < n; i++) field.push(fieldBubble(true));
    sites = [];
    for (var s = 0, m = MOBILE.matches ? 4 : 7; s < m; s++) {
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
    [deep, mid, front].forEach(function (c) {
      c.width = Math.round(W * DPR);
      c.height = Math.round(H * DPR);
    });
    layoutCards();
    populate();
    if (REDUCED) {
      placeStill();
      paint();
    }
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
    prep(dctx);
    prep(mctx);
    field.forEach(function (b) { drawBubble(b.z < FAR ? dctx : mctx, b.x + b.dx, b.y, b.r, b.a); });
    chain.forEach(function (b) { drawBubble(mctx, b.x + b.dx, b.y, b.r, b.a * b.fade); });
    dctx.globalAlpha = 1;
    mctx.globalAlpha = 1;
    prep(fctx);
    near.forEach(function (b) { drawBubble(fctx, b.x + b.dx, b.y, b.r, b.a * b.fade); });
    fctx.globalAlpha = 1;
  }

  /* ---------- Motion ---------- */

  // A damped spring: rises into place, overshoots a touch, settles — like something buoyant.
  function settle(x) {
    if (x <= 0) return 0;
    if (x > 3) return 1;
    return 1 - Math.exp(-4 * x) * Math.cos(3.4 * x);
  }

  var enterAt = 0;
  var mx = 0;
  var my = 0;
  var targetX = 0;
  var targetY = 0;

  window.addEventListener('pointermove', function (e) {
    if (!FINE_POINTER.matches) return;
    targetX = e.clientX / window.innerWidth - 0.5;
    targetY = e.clientY / window.innerHeight - 0.5;
  }, { passive: true });

  // How visible a floating photo is: it fades in rising from below, fades out toward the
  // surface, and dims while it passes behind the copy.
  function visibility(c) {
    var top = clamp((c.y + c.h * 0.3) / (H * 0.24 + c.h * 0.3), 0, 1);
    var bottom = clamp((H + c.h * 0.5 - c.y) / (c.h + H * 0.08), 0, 1);
    var dim = 1;
    if (textBox) {
      var ox = Math.min(textBox.r, c.x + c.w / 2) - Math.max(textBox.l, c.x - c.w / 2);
      var oy = Math.min(textBox.b, c.y + c.h / 2) - Math.max(textBox.t, c.y - c.h / 2);
      if (ox > 0 && oy > 0) dim = 1 - 0.8 * ((ox * oy) / (c.w * c.h));
    }
    return top * bottom * dim;
  }

  function moveCards(t, p) {
    var phone = MOBILE.matches;
    cards.forEach(function (c) {
      if (c.el.hidden) return;
      var since = enterAt ? t - enterAt - c.delay : 0;
      var fade = enterAt ? clamp(since * 2.2, 0, 1) : 0;
      // Nearer things move more with the pointer: depth.
      var px = -mx * 26 * c.depth;
      var py = -my * 14 * c.depth;
      var x;
      var y;
      var tilt;
      if (c.hero) {
        var w = (t * TAU) / c.period + c.phase;
        var amp = phone ? 6 : 10;
        x = Math.sin(w * 0.73 + 1.3) * amp * 0.45 + px;
        y = Math.sin(w) * amp - p * c.dir * c.h * (phone ? 0.05 : 0.08) + py + (1 - settle(since)) * c.rise;
        tilt = (phone ? c.tiltMobile : c.tilt) + Math.sin(w * 0.88 + 0.6) * 0.7;
        c.el.style.opacity = fade.toFixed(3);
        c.inner.style.transform = 'translate3d(0,' + (p * c.dir * c.h * 0.045).toFixed(2) + 'px,0) scale(1.14)';
      } else {
        x = c.x + Math.sin(t * c.wf + c.ph) * c.wa + px - c.w / 2;
        y = c.y + py - c.h / 2;
        tilt = c.tilt + Math.sin(t * c.wf * 0.8 + c.ph) * 2.2;
        c.el.style.opacity = (c.opacity * fade * visibility(c)).toFixed(3);
      }
      c.el.style.transform =
        'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' + tilt.toFixed(3) + 'deg)';
    });
  }

  function placeStill() {
    cards.forEach(function (c) {
      if (c.hero) {
        c.el.style.transform = 'rotate(' + (MOBILE.matches ? c.tiltMobile : c.tilt).toFixed(2) + 'deg)';
        return;
      }
      if (c.el.hidden) return;
      c.el.style.opacity = (c.opacity * visibility(c)).toFixed(3);
      c.el.style.transform = 'translate3d(' + (c.x - c.w / 2).toFixed(1) + 'px,' + (c.y - c.h / 2).toFixed(1) + 'px,0) rotate(' + c.tilt.toFixed(2) + 'deg)';
    });
  }

  // The copy surfaces as the section scrolls in (scroll-linked, not timed).
  var revealed = -1;
  function revealCopy(sr, vh) {
    if (!content || !textBox) return;
    var q = clamp((vh * 0.96 - (sr.top + textBox.t)) / (vh * 0.42), 0, 1);
    var e = 1 - Math.pow(1 - q, 3);
    if (Math.abs(e - revealed) < 0.002) return;
    revealed = e;
    content.style.opacity = e.toFixed(3);
    content.style.transform = e >= 1 ? '' : 'translate3d(0,' + ((1 - e) * 36).toFixed(1) + 'px,0)';
    content.style.filter = e >= 1 ? '' : 'blur(' + ((1 - e) * 6).toFixed(2) + 'px)';
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
      chain.push({ x: s.x, y: s.base, base: s.base, r0: rand(0.55, 0.85), r: 0.6, v: s.v * rand(0.9, 1.1), ph: rand(0, TAU), a: 0.34 * strength, fade: 0, dx: 0 });
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

    // The floating photos rise like the bubbles; at the surface they resurface below, elsewhere.
    floaters.forEach(function (c) {
      if (c.el.hidden) return;
      c.speed += ((c.hover ? 0.08 : 1) - c.speed) * Math.min(1, dt * 4);
      c.y -= c.v * stir * c.speed * dt;
      c.y += ds * 0.3 * (1 - c.depth); // far photos lag behind the page
      if (c.y < -c.h * 0.8) {
        launch(c);
      } else if (c.y > H + c.h + H * 0.3) {
        c.y = H + c.h + H * 0.3;
      }
    });

    // Bigger bubbles drifting up across each hero photo, more of them when the water is stirred.
    heroes.forEach(function (card, k) {
      if (!enterAt) return;
      card.spawn -= dt * (1 + energy * 2.5);
      if (card.spawn > 0) return;
      card.spawn = rand(0.25, 0.7);
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
  var visible = false;

  function frame(now) {
    raf = requestAnimationFrame(frame);
    var t = now / 1000;
    var dt = last ? Math.min(0.05, t - last) : 0;
    last = t;

    var sy = window.scrollY;
    var ds = sy - lastScroll;
    lastScroll = sy;
    energy = Math.min(0.9, energy * Math.pow(0.15, dt) + Math.abs(ds) * 0.0025);
    var ease = Math.min(1, dt * 3);
    mx += (targetX - mx) * ease;
    my += (targetY - my) * ease;

    // Read layout first, then write.
    var sr = section.getBoundingClientRect();
    var vh = window.innerHeight;
    var rects = heroes.map(function (c) { return c.el.getBoundingClientRect(); });
    if (!enterAt && rects.length && rects[0].top < vh * 0.9) enterAt = t;
    // -1 while the section is below the viewport centre, +1 once it has scrolled past.
    var p = clamp((vh / 2 - (sr.top + sr.height / 2)) / (vh / 2 + sr.height / 2), -1, 1);

    revealCopy(sr, vh);
    moveCards(t, p);
    step(dt, t, ds, sr, rects);
    paint();
  }

  function start() {
    if (raf || REDUCED || lightboxOpen()) return;
    last = 0;
    lastScroll = window.scrollY;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
  }

  /* ---------- Lightbox: the tapped photo, with a call to action ---------- */

  var lb;
  var lbImg;
  var lbToken = 0;
  var lastFocus = null;
  var openedByKey = false;
  var shownPhoto = null;

  var CLOSE_ICON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  function lightboxOpen() { return !!lb && lb.classList.contains('is-open'); }

  function track(event, props) {
    if (window.posthog && window.posthog.capture) window.posthog.capture(event, props);
  }

  function buildLightbox() {
    if (lb) return;
    lb = document.createElement('div');
    lb.className = 'fizz-lb';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Fizz photo');
    lb.setAttribute('aria-hidden', 'true');
    lb.innerHTML =
      '<div class="fizz-lb-backdrop" data-lb-close></div>' +
      '<div class="fizz-lb-top">' +
      '<button type="button" class="fizz-lb-btn fizz-lb-close" data-lb-close aria-label="Close photo">' + CLOSE_ICON + '</button></div>' +
      '<div class="fizz-lb-stage" data-lb-close><figure class="fizz-lb-figure"><img class="fizz-lb-img" alt=""></figure></div>' +
      '<div class="fizz-lb-bottom"><div class="fizz-lb-cta">' +
      '<div class="fizz-lb-cta-text"><p class="fizz-lb-cta-name">Fizz Bottle</p><p class="fizz-lb-cta-meta">$50 · Free shipping</p></div>' +
      '<a href="bottle.html" class="button dark w-inline-block fizz-lb-shop" data-lb-shop><div class="button-text-wrapper"><div class="button-text">Shop the bottle</div></div></a>' +
      '</div></div>';
    document.body.appendChild(lb);
    lbImg = lb.querySelector('.fizz-lb-img');

    lb.addEventListener('click', function (e) {
      var el = e.target instanceof Element ? e.target : null;
      if (!el) return;
      // Tapping anywhere but the photo or the call to action closes it.
      if (el.closest('[data-lb-shop]')) track('gallery_shop_click', { photo: shownPhoto });
      else if (el.hasAttribute('data-lb-close') || el.closest('.fizz-lb-close')) closeLightbox();
    });

    document.addEventListener('keydown', function (e) {
      if (!lightboxOpen()) return;
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'Tab') trapFocus(e);
    });
  }

  function trapFocus(e) {
    var f = Array.prototype.filter.call(lb.querySelectorAll('button, a[href]'), function (el) {
      return el.offsetParent !== null;
    });
    if (!f.length) return;
    var first = f[0];
    var lastEl = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      lastEl.focus();
    } else if (!e.shiftKey && document.activeElement === lastEl) {
      e.preventDefault();
      first.focus();
    }
  }

  function openLightbox(card, byKey) {
    buildLightbox();
    openedByKey = !!byKey;
    lastFocus = document.activeElement;
    stop();
    shownPhoto = card.photo;
    var p = PHOTOS[card.photo];
    var token = ++lbToken;
    lbImg.classList.remove('is-active');
    lbImg.src = p.large;
    lbImg.alt = p.alt;
    var reveal = function () { if (token === lbToken) lbImg.classList.add('is-active'); };
    if (lbImg.decode) lbImg.decode().then(reveal, reveal);
    else reveal();
    lb.classList.add('is-open');
    lb.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('fizz-lb-open');
    lb.querySelector('.fizz-lb-close').focus();
    track('gallery_open', { photo: card.photo });
  }

  function closeLightbox() {
    if (!lightboxOpen()) return;
    lbToken++;
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('fizz-lb-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true, focusVisible: openedByKey });
    if (visible) start();
  }

  cards.forEach(function (c) {
    c.el.addEventListener('click', function (e) { openLightbox(c, e.detail === 0); });
    if (c.hero) {
      c.el.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        openLightbox(c, true);
      });
    }
  });

  /* ---------- Boot ---------- */

  resize();
  new ResizeObserver(resize).observe(section);
  MOBILE.addEventListener('change', function () {
    placed = false;
    layoutCards();
    populate();
  });

  // Reduced motion: a still glass of seltzer, photos stay put.
  if (REDUCED) return;

  cards.forEach(function (c) { c.el.style.opacity = '0'; });
  new IntersectionObserver(function (entries) {
    visible = entries[0].isIntersecting;
    if (visible) start();
    else stop();
  }, { rootMargin: '120px 0px' }).observe(section);
})();
