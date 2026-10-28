/**
 * Fizz homepage — infinite-loop snap carousels ([data-fizz-loop]).
 *
 * Replaces Webflow's w-slider on .basic-slider / .product-slider. Clones fill the band so it
 * wraps seamlessly; one float `pos` (in cards) drives everything: a critically damped spring
 * settles it on whole cards, and the coverflow warp, velocity lean, image parallax, depth dim
 * and active-card reveal are all derived from each card's offset to it.
 *
 * Exactly one copy of each slide is exposed at a time: the n cards nearest the centre. Every
 * other copy is aria-hidden + inert, so the centred card is always clickable even after the
 * band has wrapped onto clones.
 */
(function () {
  'use strict';

  var AUTOPLAY_MS = 4500;
  var OMEGA = 11; // spring angular frequency (1/s); critically damped, so no overshoot
  var MAX_ROTATE = 28; // deg
  var MAX_SCALE_DROP = 0.12;
  var MAX_Z = 60; // px
  var LEAN_PER_CARD = 0.9; // deg of lean per card/s of travel
  var MAX_LEAN = 4; // deg
  var PARALLAX_SCALE = 1.15;
  var PARALLAX_SHIFT = 0.07; // of card width; stays inside the 7.5% slack the scale leaves
  var FLICK_TIME = 0.25; // s of projected travel after release
  var MAX_FLICK = 3; // cards per flick
  var MAX_SPEED = 15; // cards/s
  var DRAG_THRESHOLD = 6; // px
  var WHEEL_IDLE_MS = 140;

  var CARD = '.basic-slide-wrapper, .product-slide-card';
  var MEDIA = '.feature-background, .product-image';
  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');

  function mod(n, m) {
    return ((n % m) + m) % m;
  }
  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }
  // Signed distance wrapped into [-total/2, total/2)
  function wrap(d, total) {
    return mod(d + total / 2, total) - total / 2;
  }

  function LoopSlider(root) {
    var mask = root.querySelector('.w-slider-mask');
    if (!mask) return;
    var real = Array.prototype.filter.call(mask.children, function (el) {
      return el.classList.contains('w-slide');
    });
    var n = real.length;
    if (n < 2) return;

    var nav = root.querySelector('.w-slider-nav');
    var prevBtn = root.querySelector('.w-slider-arrow-left');
    var nextBtn = root.querySelector('.w-slider-arrow-right');
    var autoplay = root.getAttribute('data-autoplay') !== 'false';

    var cards = [];
    var clones = [];
    var total = 0;
    var W = 1; // card width (px) = mask width
    var half = 1; // half the viewport, in cards

    var pos = 0;
    var vel = 0; // spring velocity, cards/s
    var target = 0;
    var mode = 'idle'; // idle | spring | drag | wheel
    var lastPos = 0;
    var shownVel = 0; // smoothed travel speed for the lean
    var lean = 0;
    var raf = 0;
    var lastT = 0;
    var activeCard = -1;
    var activeReal = -1;

    var dots = [];
    var paused = { offscreen: true };
    var timer = 0;

    /* ---------- Accessibility scaffolding ---------- */

    root.setAttribute('role', 'region');
    root.setAttribute('aria-roledescription', 'carousel');
    if (!root.hasAttribute('aria-label')) root.setAttribute('aria-label', 'Carousel');

    var titles = real.map(function (slide) {
      var heading = slide.querySelector('h1, h2, h3');
      return heading ? heading.textContent.trim() : '';
    });

    var live = document.createElement('div');
    live.className = 'w-slider-aria-label';
    live.setAttribute('aria-live', 'polite');
    live.setAttribute('aria-atomic', 'true');
    root.appendChild(live);

    function announce() {
      var r = mod(target, n);
      live.textContent = 'Slide ' + (r + 1) + ' of ' + n + (titles[r] ? ': ' + titles[r] : '');
    }

    function asButton(el, label, onPress) {
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', label);
      el.addEventListener('click', function (e) {
        e.preventDefault();
        onPress();
      });
      el.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        onPress();
      });
    }

    if (prevBtn) asButton(prevBtn, 'Previous slide', function () { step(-1); });
    if (nextBtn) asButton(nextBtn, 'Next slide', function () { step(1); });

    if (nav) {
      nav.textContent = '';
      for (var d = 0; d < n; d++) {
        var dot = document.createElement('div');
        dot.className = 'w-slider-dot';
        asButton(dot, 'Show slide ' + (d + 1) + ' of ' + n, goToReal.bind(null, d));
        nav.appendChild(dot);
        dots.push(dot);
      }
    }

    function updateDots() {
      for (var i = 0; i < dots.length; i++) {
        var on = i === activeReal;
        dots[i].classList.toggle('w-active', on);
        if (on) dots[i].setAttribute('aria-current', 'true');
        else dots[i].removeAttribute('aria-current');
      }
    }

    /* ---------- Clones + layout ---------- */

    function measure() {
      W = mask.offsetWidth || 1;
      var vw = document.documentElement.clientWidth || window.innerWidth;
      half = vw / W / 2;
      // Cover the viewport, plus a spare card each side so the wrap jump always happens off-screen
      var needed = Math.ceil(vw / W + 1) + 2;
      return Math.max(1, Math.ceil(needed / n)) * n;
    }

    function build() {
      var nextTotal = measure();
      if (nextTotal !== total) {
        clones.forEach(function (c) { c.remove(); });
        clones = [];
        for (var c = n; c < nextTotal; c++) {
          var clone = real[c % n].cloneNode(true);
          clone.classList.remove('is-active');
          clone.classList.add('is-loop-clone');
          mask.appendChild(clone);
          clones.push(clone);
        }
        total = nextTotal;
        cards = real.concat(clones).map(function (el, i) {
          el.setAttribute('role', 'group');
          el.setAttribute('aria-roledescription', 'slide');
          el.setAttribute('aria-label', (i % n) + 1 + ' of ' + n);
          return { el: el, card: el.querySelector(CARD), media: el.querySelector(MEDIA), hidden: null, active: false, live: null };
        });
        activeCard = -1;
      }
      render(true);
    }

    // Expose the n copies nearest `center`; hide the rest from AT, focus and clicks.
    function syncLive(center) {
      for (var i = 0; i < cards.length; i++) {
        var c = cards[i];
        var rel = wrap(i - center, total);
        var live = rel >= -n / 2 && rel < n / 2;
        if (live === c.live) continue;
        c.live = live;
        if (live) {
          c.el.removeAttribute('aria-hidden');
          c.el.removeAttribute('inert');
        } else {
          c.el.setAttribute('aria-hidden', 'true');
          c.el.setAttribute('inert', '');
        }
      }
    }

    function render(force) {
      var flat = reduceMQ.matches;
      var nearest = Math.round(pos);
      var act = mod(nearest, total);
      syncLive(mode === 'spring' || mode === 'idle' ? target : nearest);
      for (var i = 0; i < cards.length; i++) {
        var c = cards[i];
        var o = wrap(i - pos, total);
        var ao = Math.abs(o);
        var far = ao - 0.5 > half + 0.5;
        if (far !== c.hidden) {
          c.el.style.visibility = far ? 'hidden' : '';
          c.hidden = far;
        }
        if (far && !force) continue;

        var t = Math.min(ao, 1);
        c.el.style.transform = 'translate3d(' + (o * W).toFixed(2) + 'px, 0, 0)';
        c.el.style.zIndex = String(100 - Math.round(ao * 10));

        if (c.card) {
          c.card.style.setProperty('--loop-depth', t.toFixed(3));
          c.card.style.transform = flat
            ? ''
            : 'translateZ(' + (-t * MAX_Z).toFixed(2) + 'px) rotateY(' + clamp(-o * MAX_ROTATE, -MAX_ROTATE, MAX_ROTATE).toFixed(2) +
              'deg) rotateZ(' + lean.toFixed(2) + 'deg) scale(' + (1 - t * MAX_SCALE_DROP).toFixed(4) + ')';
        }
        if (c.media) {
          c.media.style.transform = flat
            ? ''
            : 'translate3d(' + (clamp(-o, -1, 1) * PARALLAX_SHIFT * W).toFixed(2) + 'px, 0, 0) scale(' + PARALLAX_SCALE + ')';
        }

        var isActive = i === act;
        if (isActive !== c.active) {
          c.el.classList.toggle('is-active', isActive);
          c.active = isActive;
        }
      }
      if (act !== activeCard) {
        activeCard = act;
        var r = mod(nearest, n);
        if (r !== activeReal) {
          activeReal = r;
          updateDots();
        }
      }
    }

    /* ---------- Motion loop ---------- */

    function kick() {
      if (raf) return;
      lastT = 0;
      lastPos = pos;
      raf = requestAnimationFrame(frame);
    }

    function frame(now) {
      raf = 0;
      var dt = lastT ? Math.min((now - lastT) / 1000, 0.05) : 1 / 60;
      lastT = now;

      if (mode === 'spring') {
        // Exact critically damped step: x(t) = (x0 + (v0 + w*x0) t) e^(-wt)
        var x = pos - target;
        var k = vel + OMEGA * x;
        var e = Math.exp(-OMEGA * dt);
        pos = target + (x + k * dt) * e;
        vel = (vel - k * OMEGA * dt) * e;
        if (Math.abs(pos - target) < 0.0005 && Math.abs(vel) < 0.01) {
          pos = target;
          vel = 0;
          mode = 'idle';
        }
      }

      var inst = (pos - lastPos) / dt;
      lastPos = pos;
      shownVel += (inst - shownVel) * (1 - Math.exp(-dt * 14));
      lean = reduceMQ.matches ? 0 : clamp(-shownVel * LEAN_PER_CARD, -MAX_LEAN, MAX_LEAN);

      var settled = mode === 'idle' && Math.abs(lean) < 0.01;
      if (settled) {
        lean = 0;
        shownVel = 0;
      }
      render(false);
      if (!settled) raf = requestAnimationFrame(frame);
    }

    function setTarget(t, initialVel) {
      target = t;
      if (reduceMQ.matches) {
        pos = t;
        vel = 0;
        mode = 'idle';
        render(false);
        return;
      }
      if (initialVel !== undefined) vel = clamp(initialVel, -MAX_SPEED, MAX_SPEED);
      mode = 'spring';
      kick();
    }

    function base() {
      return mode === 'spring' ? target : Math.round(pos);
    }

    function userMove(t, initialVel) {
      setTarget(t, initialVel);
      announce();
      schedule();
    }

    function step(dir) {
      var from = Math.round(pos);
      userMove(clamp(base() + dir, from - MAX_FLICK, from + MAX_FLICK));
    }

    function goToReal(r) {
      var b = base();
      userMove(b + Math.round(wrap(r - mod(b, n), n)));
    }

    function goToCard(i) {
      userMove(Math.round(pos + wrap(i - pos, total)));
    }

    /* ---------- Drag ---------- */

    var drag = null;
    var suppressClick = false;
    var suppressTimer = 0;

    function sample(e) {
      var now = e.timeStamp || performance.now();
      drag.samples.push({ x: e.clientX, t: now });
      while (drag.samples.length > 2 && now - drag.samples[0].t > 100) drag.samples.shift();
    }

    function releaseVelocity(d) {
      var s = d.samples;
      if (s.length < 2) return 0;
      var a = s[0];
      var b = s[s.length - 1];
      var dtMs = b.t - a.t;
      if (dtMs < 8) return 0;
      return -((b.x - a.x) / dtMs) * 1000 / W; // px/ms -> cards/s, finger left = pos up
    }

    var CONTROLS = '.w-slider-arrow-left, .w-slider-arrow-right, .w-slider-nav';

    function onDown(e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (drag || (e.target.closest && e.target.closest(CONTROLS))) return;
      drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, pos0: pos, active: false, moved: false, samples: [] };
      sample(e);
      suppressClick = false;
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    }

    function onMove(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x0;
      var dy = e.clientY - drag.y0;
      if (!drag.moved) {
        if (Math.abs(dx) <= DRAG_THRESHOLD && Math.abs(dy) <= DRAG_THRESHOLD) return;
        drag.moved = true;
        if (Math.abs(dy) > Math.abs(dx)) return; // vertical intent: leave it to the page
        drag.active = true;
        drag.x0 = e.clientX;
        drag.pos0 = pos;
        drag.samples = [];
        mode = 'drag';
        vel = 0;
        root.classList.add('is-dragging');
        setPaused('drag', true);
        try { root.setPointerCapture(e.pointerId); } catch (err) { /* pointer already gone */ }
      }
      if (!drag.active) return;
      sample(e);
      pos = drag.pos0 - (e.clientX - drag.x0) / W;
      kick();
    }

    function onUp(e) {
      if (!drag || e.pointerId !== drag.id) return;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      var d = drag;
      drag = null;

      if (d.moved) {
        suppressClick = true;
        clearTimeout(suppressTimer);
        suppressTimer = setTimeout(function () { suppressClick = false; }, 400);
      }
      if (!d.active) return;

      root.classList.remove('is-dragging');
      var v = e.type === 'pointercancel' ? 0 : releaseVelocity(d);
      var start = Math.round(d.pos0);
      var t = Math.round(pos + v * FLICK_TIME);
      if (t === start && Math.abs(v) > 0.8) t = start + (v > 0 ? 1 : -1);
      t = clamp(t, start - MAX_FLICK, start + MAX_FLICK);
      setPaused('drag', false);
      userMove(t, v);
    }

    // On the root, not the mask: inert edge cards pass hit-testing through to it.
    root.addEventListener('pointerdown', onDown);
    root.addEventListener('dragstart', function (e) { e.preventDefault(); });
    // On window (capture) so a drag's trailing click is swallowed before document-level
    // handlers such as the cart's quick add (js/fizz-nav-cart.js) see it.
    window.addEventListener('click', function (e) {
      if (!suppressClick || !root.contains(e.target)) return;
      suppressClick = false;
      e.preventDefault();
      e.stopImmediatePropagation();
    }, true);

    /* ---------- Trackpad horizontal scroll ---------- */

    var wheelTimer = 0;
    var wheelStart = 0;
    var wheelDir = 0;

    root.addEventListener('wheel', function (e) {
      if (drag && drag.active) return;
      var dx = e.deltaX;
      if (Math.abs(dx) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      if (e.deltaMode === 1) dx *= 16;
      else if (e.deltaMode === 2) dx *= W;
      if (mode !== 'wheel') {
        wheelStart = Math.round(pos);
        mode = 'wheel';
        vel = 0;
      }
      wheelDir = dx > 0 ? 1 : -1;
      pos = clamp(pos + dx / W, wheelStart - MAX_FLICK, wheelStart + MAX_FLICK);
      kick();
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(function () {
        if (mode !== 'wheel') return;
        userMove(Math.round(pos + wheelDir * 0.2), 0);
      }, WHEEL_IDLE_MS);
    }, { passive: false });

    /* ---------- Keyboard ---------- */

    root.addEventListener('keydown', function (e) {
      var dir = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
      if (!dir) return;
      e.preventDefault();
      step(dir);
      // Focus rides along with the card, so it never sits in a copy that is about to go inert.
      if (e.target.closest && e.target.closest('.w-slide')) {
        syncLive(target);
        var link = cards[mod(target, total)].el.querySelector('a[href]');
        if (link) link.focus({ preventScroll: true });
      }
    });

    /* ---------- Autoplay + pausing ---------- */

    function canAutoplay() {
      if (!autoplay || reduceMQ.matches) return false;
      for (var key in paused) if (paused[key]) return false;
      return true;
    }

    function schedule() {
      clearTimeout(timer);
      timer = 0;
      if (!canAutoplay()) return;
      timer = setTimeout(function () {
        setTarget(base() + 1);
        schedule();
      }, AUTOPLAY_MS);
    }

    function setPaused(key, on) {
      if (!!paused[key] === on) return;
      paused[key] = on;
      schedule();
    }

    root.addEventListener('pointerenter', function (e) {
      if (e.pointerType === 'mouse') setPaused('hover', true);
    });
    root.addEventListener('pointerleave', function (e) {
      if (e.pointerType === 'mouse') setPaused('hover', false);
    });

    root.addEventListener('focusin', function (e) {
      var el = e.target;
      var keyboard = false;
      try { keyboard = el.matches(':focus-visible'); } catch (err) { keyboard = true; }
      if (!keyboard) return;
      setPaused('focus', true);
      var slide = el.closest('.w-slide');
      for (var i = 0; i < cards.length; i++) {
        if (cards[i].el === slide) {
          if (!cards[i].active) goToCard(i);
          break;
        }
      }
    });
    root.addEventListener('focusout', function (e) {
      if (!root.contains(e.relatedTarget)) setPaused('focus', false);
    });

    document.addEventListener('visibilitychange', function () {
      setPaused('hidden', document.hidden);
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        setPaused('offscreen', !entries[entries.length - 1].isIntersecting);
      }, { threshold: 0.25 }).observe(root);
    } else {
      setPaused('offscreen', false);
    }

    function onMotionPref() {
      if (reduceMQ.matches) {
        pos = Math.round(mode === 'spring' ? target : pos);
        target = pos;
        vel = 0;
        mode = 'idle';
      }
      render(true);
      schedule();
    }
    if (reduceMQ.addEventListener) reduceMQ.addEventListener('change', onMotionPref);
    else if (reduceMQ.addListener) reduceMQ.addListener(onMotionPref);

    /* ---------- Resize ---------- */

    var resizeTimer = 0;
    function onResize() {
      W = mask.offsetWidth || W;
      render(true);
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(build, 150);
    }
    if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(root);
    else window.addEventListener('resize', onResize);

    build();
    root.classList.add('is-loop-ready');
  }

  var roots = document.querySelectorAll('[data-fizz-loop]');
  for (var i = 0; i < roots.length; i++) LoopSlider(roots[i]);
})();
