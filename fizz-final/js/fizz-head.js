/**
 * Fizz — runs synchronously in <head>, before first paint.
 * Decides which entrance the page gets so nothing flashes:
 *   - arrived through a Fizz page transition → keep the page covered (fizz-tx-cover)
 *   - homepage opened fresh (typed URL, external link, reload) → intro (fizz-intro)
 * Add ?intro to the homepage URL to force the intro.
 */
(function () {
  var root = document.documentElement;
  var add = function (c) { root.classList.add(c); };

  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  add('fizz-motion');
  add('fizz-loading');

  var tx = null;
  try {
    tx = sessionStorage.getItem('fizz-tx');
    sessionStorage.removeItem('fizz-tx');
  } catch (e) {}

  var navType = 'navigate';
  try {
    var nav = performance.getEntriesByType('navigation')[0];
    if (nav) navType = nav.type;
  } catch (e) {}

  if (tx && navType !== 'back_forward') {
    add('fizz-tx-cover');
    root.setAttribute('data-fizz-arrive', tx);
  } else if (root.getAttribute('data-fizz-page') === 'home') {
    var internal = false;
    try { internal = !!document.referrer && new URL(document.referrer).origin === location.origin; } catch (e) {}
    var forced = /[?&]intro\b/.test(location.search);
    if (forced || navType === 'reload' || (navType === 'navigate' && !internal)) add('fizz-intro');
  }

  // Safety net: if fizz.js never boots (blocked / network failure), never leave the page covered.
  setTimeout(function () {
    if (window.Fizz) return;
    ['fizz-loading', 'fizz-intro', 'fizz-tx-cover', 'fizz-motion'].forEach(function (c) {
      root.classList.remove(c);
    });
  }, 5000);
})();
