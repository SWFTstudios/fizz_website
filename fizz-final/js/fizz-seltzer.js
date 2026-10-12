/**
 * Fizz homepage — "Turn boring flat water…" story section.
 *
 * Photos float as if suspended in seltzer, at different depths:
 *   deep bubbles → far photos (small, soft, dim) → nearer bubbles → mid photos
 *   → the copy and the two hero photos → a few bubbles drifting across the front.
 * Every photo bobs on its own slow loop, parallaxes by depth as you scroll (and with the
 * pointer on desktop), and quietly cross-fades through a short slideshow. Tapping any
 * photo opens a lightbox gallery of all of them with a "Shop the bottle" call to action.
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

  // The two hero photos already in the page (left, right) and the slides they cycle through.
  var HERO_SLIDES = [['drink', 'courtside', 'field'], ['toss', 'blueClose', 'sandBlue']];

  // Floating photos. depth: 0 = far back in the water, 1 = against the glass.
  // desk / phone: [x, y, width] — centre as a fraction of the section, width as a fraction
  // of its width. null = not shown at that size.
  var FLOATERS = [
    { depth: 0.6, slides: ['tennis', 'tennisSit'], desk: [0.14, 0.12, 0.115], phone: [0.84, 0.065, 0.27] },
    { depth: 0.56, slides: ['cheers', 'sunset'], desk: [0.87, 0.14, 0.105], phone: [0.15, 0.955, 0.25] },
    { depth: 0.5, slides: ['press', 'charge'], desk: [0.38, 0.9, 0.105], phone: null },
    { depth: 0.62, slides: ['grass', 'walk'], desk: [0.8, 0.88, 0.12], phone: [0.85, 0.965, 0.24] },
    { depth: 0.32, slides: ['car', 'carHand'], desk: [0.3, 0.09, 0.08], phone: [0.15, 0.075, 0.2] },
    { depth: 0.22, slides: ['carry', 'fizzClose'], desk: [0.69, 0.07, 0.07], phone: [0.95, 0.3, 0.17] },
    { depth: 0.16, slides: ['courtTop', 'bleachers'], desk: [0.51, 0.05, 0.06], phone: null },
    { depth: 0.28, slides: ['volley', 'share'], desk: [0.6, 0.94, 0.085], phone: [0.1, 0.5, 0.18] },
    { depth: 0.2, slides: ['chargeLife', 'rooftop'], desk: [0.06, 0.92, 0.075], phone: null }
  ];

  // Gallery order: hero photos first, then near to far.
  var GALLERY = [];
  function addToGallery(key) { if (GALLERY.indexOf(key) < 0) GALLERY.push(key); }
  HERO_SLIDES.forEach(function (s) { s.forEach(addToGallery); });
  FLOATERS.slice().sort(function (a, b) { return b.depth - a.depth; })
    .forEach(function (f) { f.slides.forEach(addToGallery); });

  function slideImg(key, size, active) {
    var img = document.createElement('img');
    img.className = 'fizz-slide' + (active ? ' is-active' : '');
    img.src = PHOTOS[key][size];
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    return img;
  }

  /* ---------- Cards: the two hero photos + the floaters ---------- */

  var W = 0;
  var H = 0;
  var DPR = 1;
  var cards = [];

  Array.prototype.forEach.call(section.querySelectorAll('.story-image'), function (el, i) {
    var inner = el.querySelector('.story-background-wrapper');
    var keys = HERO_SLIDES[i] || [];
    var first = el.querySelector('.story-background');
    if (!inner || !first || !keys.length) return;
    var slides = [first];
    first.classList.add('fizz-slide', 'is-active');
    keys.slice(1).forEach(function (k) {
      var img = slideImg(k, 'medium', false);
      inner.appendChild(img);
      slides.push(img);
    });
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', 'Open photo gallery: ' + PHOTOS[keys[0]].alt);
    cards.push({
      el: el,
      inner: inner,
      hero: true,
      depth: 1,
      keys: keys,
      slides: slides,
      idx: 0,
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

  FLOATERS.forEach(function (f) {
    var el = document.createElement('button');
    el.type = 'button';
    el.className = 'fizz-floater ' + (f.depth < FAR ? 'is-far' : 'is-mid');
    el.setAttribute('aria-label', 'Open photo gallery: ' + PHOTOS[f.slides[0]].alt);
    // Atmospheric depth: farther photos are softer and bluer (and smaller, set in the layout).
    el.style.setProperty('--blur', Math.max(0, (FAR + 0.05 - f.depth) * 4.5).toFixed(2) + 'px');
    el.style.setProperty('--tint', ((1 - f.depth) * 0.5).toFixed(2));
    var media = document.createElement('span');
    media.className = 'fizz-floater-media';
    var slides = f.slides.map(function (k, j) {
      var img = slideImg(k, 'small', j === 0);
      media.appendChild(img);
      return img;
    });
    el.appendChild(media);
    section.appendChild(el);
    cards.push({
      el: el,
      hero: false,
      depth: f.depth,
      cfg: f,
      keys: f.slides,
      slides: slides,
      idx: 0,
      period: rand(8, 13),
      phase: rand(0, TAU),
      tilt: rand(-4, 4),
      delay: 0.25 + (1 - f.depth) * 0.7 + rand(0, 0.3),
      rise: 30 + f.depth * 30,
      opacity: Math.min(1, 0.32 + f.depth * 1.2)
    });
  });

  var heroes = cards.filter(function (c) { return c.hero; });

  function layoutCards() {
    var phone = MOBILE.matches;
    cards.forEach(function (c) {
      if (c.hero) {
        c.h = c.el.offsetHeight;
        return;
      }
      var spot = phone ? c.cfg.phone : c.cfg.desk;
      c.el.hidden = !spot;
      if (!spot) return;
      var w = Math.max(phone ? 64 : 84, W * spot[2]);
      var h = w * 1.25;
      c.h = h;
      c.el.style.width = w.toFixed(1) + 'px';
      c.el.style.height = h.toFixed(1) + 'px';
      c.el.style.left = (W * spot[0] - w / 2).toFixed(1) + 'px';
      c.el.style.top = (H * spot[1] - h / 2).toFixed(1) + 'px';
    });
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
    return Math.min(MOBILE.matches ? 90 : 210, Math.round((W * H) / (MOBILE.matches ? 5500 : 6500)));
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

  function moveCards(t, p) {
    var phone = MOBILE.matches;
    cards.forEach(function (c) {
      if (c.el.hidden) return;
      var w = (t * TAU) / c.period + c.phase;
      var since = enterAt ? t - enterAt - c.delay : 0;
      var rise = (1 - settle(since)) * c.rise;
      var fade = enterAt ? clamp(since * 2.2, 0, 1) : 0;
      // Nearer things move more with the pointer: depth.
      var px = -mx * 26 * c.depth;
      var py = -my * 14 * c.depth;
      var x;
      var y;
      var tilt;
      if (c.hero) {
        var amp = phone ? 6 : 10;
        x = Math.sin(w * 0.73 + 1.3) * amp * 0.45 + px;
        y = Math.sin(w) * amp - p * c.dir * c.h * (phone ? 0.05 : 0.08) + py;
        tilt = (phone ? c.tiltMobile : c.tilt) + Math.sin(w * 0.88 + 0.6) * 0.7;
        c.el.style.opacity = fade.toFixed(3);
        c.inner.style.transform = 'translate3d(0,' + (p * c.dir * c.h * 0.045).toFixed(2) + 'px,0) scale(1.14)';
      } else {
        var a = 3 + c.depth * 8;
        x = Math.sin(w * 0.7 + 1.1) * a * 0.5 + px;
        // Far photos lag behind the scroll, so they read as deeper in the water.
        y = Math.sin(w) * a + p * H * 0.1 * (1 - c.depth) + py;
        tilt = c.tilt + Math.sin(w * 0.85 + 0.4) * 0.8;
        c.el.style.opacity = (c.opacity * fade).toFixed(3);
      }
      c.el.style.transform =
        'translate3d(' + x.toFixed(2) + 'px,' + (y + rise).toFixed(2) + 'px,0) rotate(' + tilt.toFixed(3) + 'deg)';
    });
  }

  function placeStill() {
    cards.forEach(function (c) {
      var tilt = c.hero && MOBILE.matches ? c.tiltMobile : c.tilt;
      if (!c.hero) c.el.style.opacity = c.opacity.toFixed(3);
      c.el.style.transform = 'rotate(' + tilt.toFixed(2) + 'deg)';
    });
  }

  /* ---------- Slideshows ---------- */

  function showSlide(c, idx) {
    c.slides[c.idx].classList.remove('is-active');
    c.idx = idx;
    c.slides[c.idx].classList.add('is-active');
  }

  function stepSlides(t) {
    if (!enterAt) return;
    cards.forEach(function (c, i) {
      if (c.slides.length < 2 || c.el.hidden) return;
      if (!c.next) {
        c.every = rand(5.5, 8.5);
        c.next = enterAt + 3 + i * 0.9; // staggered so photos never change together
        return;
      }
      if (t < c.next) return;
      c.next = t + c.every;
      showSlide(c, (c.idx + 1) % c.slides.length);
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

    // Bigger bubbles drifting up across each hero photo, more of them when the water is stirred.
    heroes.forEach(function (card, k) {
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
    if (!enterAt && sr.top < vh * 0.82) enterAt = t;
    // -1 while the section is below the viewport centre, +1 once it has scrolled past.
    var p = clamp((vh / 2 - (sr.top + sr.height / 2)) / (vh / 2 + sr.height / 2), -1, 1);

    moveCards(t, p);
    stepSlides(t);
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

  /* ---------- Lightbox gallery ---------- */

  var lb;
  var lbImgs;
  var lbFront = 0;
  var lbCount;
  var lbThumbs;
  var lbIndex = 0;
  var lbToken = 0;
  var lastFocus = null;

  var ICON = {
    close: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    prev: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    next: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>'
  };

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
    lb.setAttribute('aria-label', 'Fizz photo gallery');
    lb.setAttribute('aria-hidden', 'true');
    lb.innerHTML =
      '<div class="fizz-lb-backdrop" data-lb-close></div>' +
      '<div class="fizz-lb-top"><span class="fizz-lb-count" aria-live="polite"></span>' +
      '<button type="button" class="fizz-lb-btn fizz-lb-close" data-lb-close aria-label="Close gallery">' + ICON.close + '</button></div>' +
      '<div class="fizz-lb-stage" data-lb-stage>' +
      '<button type="button" class="fizz-lb-btn fizz-lb-nav is-prev" data-lb-step="-1" aria-label="Previous photo">' + ICON.prev + '</button>' +
      '<figure class="fizz-lb-figure"><img class="fizz-lb-img" alt=""><img class="fizz-lb-img" alt=""></figure>' +
      '<button type="button" class="fizz-lb-btn fizz-lb-nav is-next" data-lb-step="1" aria-label="Next photo">' + ICON.next + '</button>' +
      '</div>' +
      '<div class="fizz-lb-bottom">' +
      '<div class="fizz-lb-thumbs" role="list"></div>' +
      '<div class="fizz-lb-cta"><div class="fizz-lb-cta-text"><p class="fizz-lb-cta-name">Fizz Bottle</p>' +
      '<p class="fizz-lb-cta-meta">$50 · Free shipping</p></div>' +
      '<a href="bottle.html" class="button dark w-inline-block fizz-lb-shop" data-lb-shop><div class="button-text-wrapper"><div class="button-text">Shop the bottle</div></div></a></div>' +
      '</div>';
    document.body.appendChild(lb);

    lbImgs = lb.querySelectorAll('.fizz-lb-img');
    lbCount = lb.querySelector('.fizz-lb-count');
    lbThumbs = lb.querySelector('.fizz-lb-thumbs');
    GALLERY.forEach(function (key, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'fizz-lb-thumb';
      b.setAttribute('role', 'listitem');
      b.setAttribute('aria-label', 'Photo ' + (i + 1) + ': ' + PHOTOS[key].alt);
      b.innerHTML = '<img src="' + PHOTOS[key].small + '" alt="" loading="lazy" decoding="async">';
      b.addEventListener('click', function () { show(i, i > lbIndex ? 1 : -1); });
      lbThumbs.appendChild(b);
    });

    lb.addEventListener('click', function (e) {
      var el = e.target instanceof Element ? e.target : null;
      if (!el) return;
      if (el.closest('[data-lb-close]') || el.hasAttribute('data-lb-stage')) closeLightbox();
      var s = el.closest('[data-lb-step]');
      if (s) go(Number(s.getAttribute('data-lb-step')));
      if (el.closest('[data-lb-shop]')) track('gallery_shop_click', { photo: GALLERY[lbIndex] });
    });

    // Swipe between photos on touch screens.
    var stage = lb.querySelector('[data-lb-stage]');
    var sx = 0;
    var sy = 0;
    stage.addEventListener('pointerdown', function (e) { sx = e.clientX; sy = e.clientY; });
    stage.addEventListener('pointerup', function (e) {
      var dx = e.clientX - sx;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - sy)) go(dx < 0 ? 1 : -1);
    });

    document.addEventListener('keydown', function (e) {
      if (!lightboxOpen()) return;
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
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

  function go(d) { show(lbIndex + d, d); }

  function show(i, dir) {
    var n = GALLERY.length;
    lbIndex = ((i % n) + n) % n;
    var p = PHOTOS[GALLERY[lbIndex]];
    var token = ++lbToken;
    var incoming = lbImgs[1 - lbFront];
    var outgoing = lbImgs[lbFront];
    lb.style.setProperty('--lb-dir', String(dir || 0));
    incoming.classList.remove('is-active', 'is-leaving');
    incoming.src = p.large;
    incoming.alt = p.alt;
    var swap = function () {
      if (token !== lbToken) return;
      outgoing.classList.remove('is-active');
      outgoing.classList.add('is-leaving');
      incoming.classList.add('is-active');
      lbFront = 1 - lbFront;
    };
    if (incoming.decode) incoming.decode().then(swap, swap);
    else swap();

    lbCount.textContent = (lbIndex + 1) + ' / ' + n;
    Array.prototype.forEach.call(lbThumbs.children, function (b, j) {
      b.classList.toggle('is-active', j === lbIndex);
      if (j === lbIndex) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current');
    });
    var active = lbThumbs.children[lbIndex];
    if (active) {
      lbThumbs.scrollTo({
        left: active.offsetLeft - lbThumbs.clientWidth / 2 + active.offsetWidth / 2,
        behavior: REDUCED ? 'auto' : 'smooth'
      });
    }
    // Warm up the neighbours so arrowing through feels instant.
    [lbIndex + 1, lbIndex - 1].forEach(function (k) {
      new Image().src = PHOTOS[GALLERY[((k % n) + n) % n]].large;
    });
  }

  function openLightbox(card) {
    buildLightbox();
    lastFocus = document.activeElement;
    stop();
    lb.classList.add('is-open');
    lb.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('fizz-lb-open');
    show(GALLERY.indexOf(card.keys[card.idx]), 0);
    lb.querySelector('.fizz-lb-close').focus();
    track('gallery_open', { photo: card.keys[card.idx] });
  }

  function closeLightbox() {
    if (!lightboxOpen()) return;
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('fizz-lb-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    if (visible) start();
  }

  cards.forEach(function (c) {
    c.el.addEventListener('click', function () { openLightbox(c); });
    if (c.hero) {
      c.el.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        openLightbox(c);
      });
    }
  });

  /* ---------- Boot ---------- */

  resize();
  new ResizeObserver(resize).observe(section);
  MOBILE.addEventListener('change', function () {
    layoutCards();
    populate();
  });

  // Reduced motion: a still glass of seltzer, photos stay put, slideshows don't advance.
  if (REDUCED) return;

  cards.forEach(function (c) { c.el.style.opacity = '0'; });
  new IntersectionObserver(function (entries) {
    visible = entries[0].isIntersecting;
    if (visible) start();
    else stop();
  }, { rootMargin: '120px 0px' }).observe(section);
})();
