/**
 * Fizz homepage intro (only runs when js/fizz-head.js set html.fizz-intro).
 *
 *   1. F · I · Z · Z rise into view, one after another
 *   2. The I stretches up and down until it spans the full screen height
 *   3. The page splits along the I like sliding doors — F rides the left door,
 *      Z Z ride the right door — revealing the homepage behind it
 *
 * The whole timeline is scheduled up front with the Web Animations API
 * (transform/opacity only), so the browser's compositor plays it with exact timing
 * even while the main thread is busy starting up the rest of the homepage.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  if (!root.classList.contains('fizz-intro')) return;

  // Timeline (ms)
  var LETTERS_START = 100;
  var LETTER_STAGGER = 110;
  var LETTER_DURATION = 750;
  var STRETCH_AT = 1350;
  var STRETCH_DURATION = 700;
  var SPLIT_AT = STRETCH_AT + STRETCH_DURATION + 50;
  var DOOR_DURATION = 1150;
  var END_AT = SPLIT_AT + DOOR_DURATION + 50;

  var EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
  var STRETCH_EASE = 'cubic-bezier(0.83, 0, 0.17, 1)';
  var DOOR_EASE = 'cubic-bezier(0.76, 0, 0.24, 1)';

  var overlay = document.querySelector('.loading-intro-section');
  var wrapper = overlay && overlay.querySelector('.intro-logo-wrapper');
  var letters = ['._1', '._2', '._3', '._4'].map(function (s) { return overlay && overlay.querySelector(s); });
  var done = false;

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  function finish() {
    if (done) return;
    done = true;
    root.classList.remove('fizz-intro');
    if (overlay) {
      overlay.querySelectorAll('.fizz-intro-bar, .fizz-intro-door, .fizz-intro-backdrop').forEach(function (node) { node.remove(); });
      overlay.style.pointerEvents = '';
      overlay.getAnimations({ subtree: true }).forEach(function (a) { a.cancel(); });
    }
    if ('scrollRestoration' in history) history.scrollRestoration = 'auto';
    if (window.Fizz) window.Fizz.reveal();
  }

  if (!overlay || !wrapper || letters.some(function (l) { return !l; }) || !document.body.animate) {
    finish();
    return;
  }

  function layer(className, css) {
    var node = document.createElement('div');
    node.className = className;
    if (css) node.style.cssText = css;
    return node;
  }

  /**
   * Instant opacity switch at time `at` (compositor-timed, no main-thread callback).
   * `holdBefore` keeps the `from` value until then; leave it off for a later switch on
   * the same element so it doesn't override the earlier state.
   */
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

  function run() {
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var glyph = letters[1].querySelector('.letter-i') || letters[1];
    var r = glyph.getBoundingClientRect(); // measured before any transforms are applied
    var center = r.left + r.width / 2;
    // The logo may be scaled down on small screens; letter offsets are applied inside that scale.
    var scale = wrapper.getBoundingClientRect().width / wrapper.offsetWidth || 1;

    // Layers inside the overlay: white backdrop (0) < doors (1) < letters (5) < I bar (6)
    var backdrop = layer('fizz-intro-backdrop');
    var bar = layer('fizz-intro-bar', 'left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px;');
    var doorL = layer('fizz-intro-door is-left', 'width:' + center + 'px;');
    var doorR = layer('fizz-intro-door is-right', 'left:' + center + 'px;');
    [doorL, doorR].forEach(function (d) { d.style.setProperty('--fizz-seam', r.width / 2 + 'px'); });
    overlay.insertBefore(doorR, overlay.firstChild);
    overlay.insertBefore(doorL, overlay.firstChild);
    overlay.insertBefore(backdrop, overlay.firstChild);
    overlay.appendChild(bar);
    overlay.style.background = 'transparent'; // the backdrop layer takes over the white

    // 1. Letters rise in
    letters.forEach(function (letter, i) {
      letter.animate(
        [
          { opacity: 0, transform: 'translate3d(0, 40px, 0) scale(0.92)' },
          { opacity: 1, transform: 'none' }
        ],
        { duration: LETTER_DURATION, delay: LETTERS_START + i * LETTER_STAGGER, easing: EASE_OUT, fill: 'both' }
      );
    });

    // 2. Swap the I glyph for a bar, then stretch it to the full screen height
    switchOpacity(letters[1], 1, 0, STRETCH_AT);
    switchOpacity(bar, 0, 1, STRETCH_AT, true);
    bar.animate(
      [
        { transform: 'none' },
        { transform: 'translate3d(0,' + -r.top + 'px,0) scaleY(' + vh / r.height + ')' }
      ],
      { duration: STRETCH_DURATION, delay: STRETCH_AT, easing: STRETCH_EASE, fill: 'both' }
    );

    // 3. Split: backdrop + bar give way to two doors that look identical, then slide apart
    switchOpacity(backdrop, 1, 0, SPLIT_AT);
    switchOpacity(bar, 1, 0, SPLIT_AT);
    [doorL, doorR].forEach(function (d) { switchOpacity(d, 0, 1, SPLIT_AT, true); });
    var slide = { duration: DOOR_DURATION, delay: SPLIT_AT, easing: DOOR_EASE, fill: 'both' };
    doorL.animate([{ transform: 'none' }, { transform: 'translate3d(-100%,0,0)' }], slide);
    doorR.animate([{ transform: 'none' }, { transform: 'translate3d(100%,0,0)' }], slide);
    var ride = { duration: DOOR_DURATION, delay: SPLIT_AT, easing: DOOR_EASE, fill: 'forwards' };
    letters[0].animate([{ transform: 'none' }, { transform: 'translate3d(' + -center / scale + 'px,0,0)' }], ride);
    [letters[2], letters[3]].forEach(function (z) {
      z.animate([{ transform: 'none' }, { transform: 'translate3d(' + (vw - center) / scale + 'px,0,0)' }], ride);
    });

    // The homepage settles into place behind the doors.
    var hero = document.querySelector('.video-bg_wrapper');
    if (hero) {
      hero.animate([{ transform: 'scale(1.12)' }, { transform: 'none' }], { duration: 1700, delay: SPLIT_AT, easing: EASE_OUT, fill: 'backwards' });
    }

    setTimeout(function () {
      overlay.style.pointerEvents = 'none';
      if (window.Fizz) window.Fizz.reveal();
    }, SPLIT_AT + 400);
    setTimeout(finish, END_AT);
  }

  // Block scrolling under the intro without hiding the scrollbar (no layout shift).
  overlay.style.pointerEvents = 'auto';
  var blockScroll = function (e) { if (!done) e.preventDefault(); };
  overlay.addEventListener('wheel', blockScroll, { passive: false });
  overlay.addEventListener('touchmove', blockScroll, { passive: false });

  // Never let the intro hold the page hostage.
  setTimeout(finish, 7000);

  // Loaded async right after the intro markup, so it starts before the rest of the page finishes parsing.
  lettersDecoded().then(run).catch(finish);
})();
