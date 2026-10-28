/**
 * Fizz homepage intro (only runs when js/fizz-head.js set html.fizz-intro).
 *
 *   1. Black stage; a slow water loop fades up along the bottom
 *   2. White F · I · Z · Z rise out of the water one by one — each sends a ripple
 *      across the surface and leaves a soft reflection below the waterline
 *   3. The water sinks to black while the I stretches into a full-height line of light
 *   4. The I splits open: the two halves part with glowing edges while the whole scene
 *      zooms toward you, so it feels like flying through the logo into the homepage
 *
 * Every animation is scheduled up front with the Web Animations API (transform,
 * opacity and filter only), so the compositor plays it with exact timing even while
 * the main thread is busy starting up the rest of the homepage.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  if (!root.classList.contains('fizz-intro')) return;

  // Timeline (ms)
  var WATER_IN = 1400;
  var LETTERS_AT = 400;
  var LETTER_STAGGER = 130;
  var LETTER_DURATION = 1250;
  var STRETCH_AT = 2150;
  var STRETCH_DURATION = 750;
  var SPLIT_AT = STRETCH_AT + STRETCH_DURATION + 40;
  var OPEN_DURATION = 1350;
  var END_AT = SPLIT_AT + OPEN_DURATION + 60;

  var EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
  var EASE_IN_OUT = 'cubic-bezier(0.83, 0, 0.17, 1)';
  var EASE_FLY = 'cubic-bezier(0.7, 0, 0.2, 1)';

  var WATER = 'videos/6a049da4e20d1d0555469d1e_loop-animation-of-water-on-black-background-2026-01-28-04-38-31-utc';
  var WATER_POSTER = 'images/6a049da4e20d1d0555469d1e_loop-animation-of-water-on-black-background-2026-01-28-04-38-31-utc_poster.0000000.jpg';
  var WATER_SURFACE = 0.47; // where the surface sits in the water video, top to bottom

  var overlay = document.querySelector('.loading-intro-section');
  var wrapper = overlay && overlay.querySelector('.intro-logo-wrapper');
  var letters = ['._1', '._2', '._3', '._4'].map(function (s) { return overlay && overlay.querySelector(s); });
  var done = false;

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  function finish() {
    if (done) return;
    done = true;
    // Nav was hidden during the intro; play its entrance (css/fizz.css) now.
    root.classList.add('fizz-nav-enter');
    setTimeout(function () { root.classList.remove('fizz-nav-enter'); }, 1600);
    root.classList.remove('fizz-intro');
    if (overlay) {
      overlay.querySelectorAll('.fizz-intro-bar, .fizz-intro-door, .fizz-intro-backdrop, .fizz-intro-water, .fizz-intro-ripple, .intro-logo-wrapper.is-reflection').forEach(function (n) { n.remove(); });
      overlay.style.cssText = '';
      overlay.getAnimations({ subtree: true }).forEach(function (a) { a.cancel(); });
      overlay.getAnimations().forEach(function (a) { a.cancel(); });
    }
    var hero = document.querySelector('.video-bg_wrapper');
    if (hero) hero.getAnimations().forEach(function (a) { a.cancel(); });
    if ('scrollRestoration' in history) history.scrollRestoration = 'auto';
    if (window.Fizz) window.Fizz.reveal();
  }

  if (!overlay || !wrapper || letters.some(function (l) { return !l; }) || !document.body.animate) {
    finish();
    return;
  }

  function layer(tag, className, css) {
    var node = document.createElement(tag);
    node.className = className;
    if (css) node.style.cssText = css;
    return node;
  }

  /** Instant opacity switch at time `at`. `holdBefore` keeps `from` until then. */
  function switchOpacity(node, from, to, at, holdBefore) {
    node.animate([{ opacity: from }, { opacity: to }], { duration: 1, delay: at, fill: holdBefore ? 'both' : 'forwards' });
  }

  function lettersDecoded() {
    var imgs = Array.prototype.slice.call(overlay.querySelectorAll('img'));
    return Promise.race([
      Promise.all(imgs.map(function (img) { return img.decode ? img.decode().catch(function () {}) : null; })),
      new Promise(function (resolve) { setTimeout(resolve, 1200); })
    ]);
  }

  // The water goes in right away so it can start loading while the letters decode.
  var water = layer('div', 'fizz-intro-water');
  water.innerHTML =
    '<video muted playsinline loop autoplay preload="auto" poster="' + WATER_POSTER + '">' +
    '<source src="' + WATER + '_mp4.mp4" type="video/mp4"><source src="' + WATER + '_webm.webm" type="video/webm"></video>';
  overlay.insertBefore(water, overlay.firstChild);
  var waterVideo = water.querySelector('video');
  waterVideo.muted = true;
  var playing = waterVideo.play();
  if (playing && playing.catch) playing.catch(function () {});

  function run() {
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var logo = wrapper.getBoundingClientRect(); // measured before any letter transforms
    var glyph = letters[1].querySelector('.letter-i') || letters[1];
    var r = glyph.getBoundingClientRect();
    var center = r.left + r.width / 2;
    // The logo may be scaled down on phones; letter offsets are applied inside that scale.
    var scale = logo.width / wrapper.offsetWidth || 1;
    var waterline = logo.bottom;

    // Water: its surface lines up with the bottom of the letters
    var waterWidth = Math.max(vw, vh * 1.6);
    var waterHeight = (waterWidth * 9) / 16;
    water.style.cssText = 'width:' + waterWidth + 'px;height:' + waterHeight + 'px;top:' + (waterline - waterHeight * WATER_SURFACE) + 'px;';

    // Layers: backdrop (0) < water (1) < doors (2) < ripples (4) < letters + reflection (5) < I bar (6)
    var backdrop = layer('div', 'fizz-intro-backdrop');
    var bar = layer('div', 'fizz-intro-bar', 'left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px;');
    var doorL = layer('div', 'fizz-intro-door is-left', 'width:' + center + 'px;');
    var doorR = layer('div', 'fizz-intro-door is-right', 'left:' + center + 'px;');
    [doorL, doorR].forEach(function (d) { d.style.setProperty('--fizz-seam', r.width / 2 + 'px'); });

    // Reflection: a mirrored copy of the logo just below the waterline
    var reflection = wrapper.cloneNode(true);
    reflection.classList.add('is-reflection');
    reflection.setAttribute('aria-hidden', 'true');
    reflection.style.cssText =
      // Flipped around its top edge, so anchor it one logo-height below the waterline.
      'left:' + logo.left + 'px;top:' + (logo.bottom + logo.height) + 'px;width:' + logo.width / scale + 'px;height:' + logo.height / scale + 'px;' +
      'transform:scale(' + scale + ', ' + -scale + ');transform-origin:0 0;';
    var mirror = ['._1', '._2', '._3', '._4'].map(function (s) { return reflection.querySelector(s); });

    overlay.insertBefore(doorR, overlay.firstChild);
    overlay.insertBefore(doorL, overlay.firstChild);
    overlay.insertBefore(backdrop, overlay.firstChild);
    overlay.appendChild(reflection);
    overlay.appendChild(bar);
    overlay.style.background = 'transparent'; // the backdrop layer takes over the black

    // 1. Water rises into view
    water.animate(
      [{ opacity: 0, transform: 'translate3d(-50%, 40px, 0)' }, { opacity: 1, transform: 'translate3d(-50%, 0, 0)' }],
      { duration: WATER_IN, easing: EASE_OUT, fill: 'both' }
    );

    // 2. Letters surface one by one, each with a ripple and a reflection
    letters.forEach(function (letter, i) {
      var at = LETTERS_AT + i * LETTER_STAGGER;
      var rise = { duration: LETTER_DURATION, delay: at, easing: EASE_OUT, fill: 'both' };
      letter.animate([{ opacity: 1, transform: 'translate3d(0, 105%, 0)', filter: 'blur(6px)' }, { opacity: 1, transform: 'none', filter: 'blur(0px)' }], rise);
      mirror[i].animate([{ opacity: 1, transform: 'translate3d(0, 105%, 0)' }, { opacity: 1, transform: 'none' }], rise);

      var box = letter.getBoundingClientRect();
      var w = Math.max(60, box.width * 1.5);
      var ripple = layer('span', 'fizz-intro-ripple', 'left:' + (box.left + box.width / 2 - w / 2) + 'px;top:' + (waterline - 9) + 'px;width:' + w + 'px;');
      overlay.appendChild(ripple);
      ripple.animate(
        [{ opacity: 0, transform: 'scale(0.2, 0.5)' }, { opacity: 0.9, offset: 0.15 }, { opacity: 0, transform: 'scale(1.7, 1)' }],
        { duration: 1400, delay: at + 120, easing: 'cubic-bezier(0.2, 0.6, 0.3, 1)', fill: 'both' }
      );
    });

    // 3. The water sinks away while the I stretches into a line of light
    var sink = { duration: 650, delay: STRETCH_AT, easing: 'ease-in', fill: 'forwards' };
    water.animate([{ opacity: 1 }, { opacity: 0 }], sink);
    reflection.animate([{ opacity: 1 }, { opacity: 0 }], sink);
    switchOpacity(letters[1], 1, 0, STRETCH_AT);
    switchOpacity(bar, 0, 1, STRETCH_AT, true);
    bar.animate(
      [{ transform: 'none' }, { transform: 'translate3d(0,' + -r.top + 'px,0) scaleY(' + vh / r.height + ')' }],
      { duration: STRETCH_DURATION, delay: STRETCH_AT, easing: EASE_IN_OUT, fill: 'both' }
    );

    // 4. Split + fly through: identical-looking doors replace backdrop + bar, then part
    //    while the whole stage zooms toward the viewer around the I.
    switchOpacity(backdrop, 1, 0, SPLIT_AT);
    switchOpacity(bar, 1, 0, SPLIT_AT);
    [doorL, doorR].forEach(function (d) { switchOpacity(d, 0, 1, SPLIT_AT, true); });
    var open = { duration: OPEN_DURATION, delay: SPLIT_AT, easing: EASE_FLY, fill: 'both' };
    doorL.animate([{ transform: 'none' }, { transform: 'translate3d(-100%,0,0)' }], open);
    doorR.animate([{ transform: 'none' }, { transform: 'translate3d(100%,0,0)' }], open);
    var ride = { duration: OPEN_DURATION, delay: SPLIT_AT, easing: EASE_FLY, fill: 'forwards' };
    letters[0].animate([{ transform: 'none' }, { transform: 'translate3d(' + -center / scale + 'px,0,0)' }], ride);
    [letters[2], letters[3]].forEach(function (z) {
      z.animate([{ transform: 'none' }, { transform: 'translate3d(' + (vw - center) / scale + 'px,0,0)' }], ride);
    });
    overlay.style.transformOrigin = center + 'px 50%';
    overlay.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(2.6)' }],
      { duration: OPEN_DURATION, delay: SPLIT_AT, easing: 'cubic-bezier(0.55, 0, 0.35, 1)', fill: 'both' }
    );

    // The homepage rushes forward to meet the camera.
    var hero = document.querySelector('.video-bg_wrapper');
    if (hero) {
      hero.style.transformOrigin = center + 'px 50%';
      hero.animate(
        [{ transform: 'scale(0.9)', filter: 'brightness(0.55)' }, { transform: 'none', filter: 'brightness(1)' }],
        { duration: OPEN_DURATION + 500, delay: SPLIT_AT, easing: EASE_OUT, fill: 'backwards' }
      );
    }

    setTimeout(function () {
      overlay.style.pointerEvents = 'none';
      if (window.Fizz) window.Fizz.reveal();
    }, SPLIT_AT + 450);
    setTimeout(finish, END_AT);
  }

  // Block scrolling under the intro without hiding the scrollbar (no layout shift).
  overlay.style.pointerEvents = 'auto';
  var blockScroll = function (e) { if (!done) e.preventDefault(); };
  overlay.addEventListener('wheel', blockScroll, { passive: false });
  overlay.addEventListener('touchmove', blockScroll, { passive: false });

  // Never let the intro hold the page hostage.
  setTimeout(finish, 8000);

  // Loaded async right after the intro markup, so it starts before the rest of the page finishes parsing.
  lettersDecoded().then(run).catch(finish);
})();
