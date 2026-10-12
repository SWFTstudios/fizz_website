/**
 * Fizz product pages (bottle / flavors / charge).
 *
 *  - Live prices + availability from Shopify (the HTML prices are only a fallback)
 *  - Option picker, quantity stepper, one-time vs. subscribe (Charge)
 *  - Add to cart through js/fizz-nav-cart.js (window.FizzNavCart)
 *  - Sticky add-to-cart bar on phones once the main button scrolls away
 *  - "Complete your Fizz kit" pop-up after adding: bundle the bottle, a flavor and
 *    the CO2 Charge (one-time or subscribe), skipping anything already in the cart
 */
(function () {
  'use strict';

  var GID = 'gid://shopify/ProductVariant/';
  var SUBSCRIBE_PLAN = 'gid://shopify/SellingPlan/690569183517';

  var CATALOG = {
    bottle: {
      title: 'Fizz Bottle',
      optionName: 'Color',
      url: 'bottle.html',
      price: 50,
      variants: [
        { id: '51846210421021', label: 'White', swatch: '#ffffff', image: 'images/6a9838827fdf3fc468b579c6_bottle-white-p-500.webp' },
        { id: '51846210388253', label: 'Black', swatch: '#1a1a1a', image: 'images/6a9838827fdf3fc468b579c0_bottle-black-p-500.webp' },
        { id: '51846210519325', label: 'Blue', swatch: '#2a4494', image: 'images/6a9838827fdf3fc468b579d9_bottle-blue-p-500.webp' }
      ],
      pitch: 'The portable carbonating bottle that started it all.'
    },
    flavor: {
      title: 'Fizz Flavor Pack',
      optionName: 'Flavor',
      url: 'flavors.html',
      price: 1.5,
      variants: [
        { id: '51885256638749', label: 'Mixed Berry', swatch: '#c23a7a', image: 'images/6a99c5835d79d47b93de1c87_flavor-mixed-berry-p-500.webp' },
        { id: '51885256573213', label: 'Cherry Limeade', swatch: '#e23b3b', image: 'images/6a99c5844efc137d51397380_flavor-cherry-limeade-p-500.webp' },
        { id: '51885256442141', label: 'Orange Tangerine', swatch: '#f07a1a', image: 'images/6a99c5844b05093adf51a20b_flavor-orange-tangerine-p-500.webp' }
      ],
      pitch: 'Drop a pack, press, drink. Try one — or all three.'
    },
    charge: {
      title: 'Fizz Charge CO₂ 6-pack',
      url: 'charge.html',
      price: 10,
      variants: [
        { id: '51885256671517', label: '6-pack', image: 'images/6a99caff47d2352ba2661c23_fizz-charge-lifestyle-p-500.webp' }
      ],
      pitch: 'Six CO₂ refills to keep every bottle sparkling.'
    }
  };

  /* ------------------------------------------------------------------ *
   * Helpers
   * ------------------------------------------------------------------ */

  function money(n) {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
    } catch (e) {
      return '$' + Number(n).toFixed(2);
    }
  }

  function productForVariant(id) {
    id = String(id).replace(GID, '');
    for (var key in CATALOG) {
      if (CATALOG[key].variants.some(function (v) { return v.id === id; })) return key;
    }
    return null;
  }

  function variantById(key, id) {
    return CATALOG[key].variants.filter(function (v) { return v.id === id; })[0] || CATALOG[key].variants[0];
  }

  function cart() {
    return window.FizzNavCart;
  }

  function el(tag, attrs, html) {
    var node = document.createElement(tag);
    for (var k in attrs || {}) node.setAttribute(k, attrs[k]);
    if (html != null) node.innerHTML = html;
    return node;
  }

  /* ------------------------------------------------------------------ *
   * Live prices from Shopify (cached for 10 minutes)
   * ------------------------------------------------------------------ */

  var PRICE_KEY = 'fizz-prices-v1';
  var available = {};

  function applyPrices(map) {
    Object.keys(CATALOG).forEach(function (key) {
      var first = map[CATALOG[key].variants[0].id];
      if (first) CATALOG[key].price = first.price;
      CATALOG[key].variants.forEach(function (v) {
        if (map[v.id]) available[v.id] = map[v.id].available;
      });
    });
    document.dispatchEvent(new CustomEvent('fizz:prices'));
  }

  function loadPrices() {
    try {
      var cached = JSON.parse(sessionStorage.getItem(PRICE_KEY) || 'null');
      if (cached && Date.now() - cached.t < 600000) {
        applyPrices(cached.map);
        return;
      }
    } catch (e) {}

    var cfg = window.FIZZ_STOREFRONT;
    if (!cfg || !cfg.token) return;
    var ids = [];
    Object.keys(CATALOG).forEach(function (k) {
      CATALOG[k].variants.forEach(function (v) { ids.push(GID + v.id); });
    });
    fetch('https://' + cfg.domain + '/api/2025-01/graphql.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': cfg.token },
      body: JSON.stringify({
        query: 'query($ids:[ID!]!){nodes(ids:$ids){... on ProductVariant{id availableForSale price{amount}}}}',
        variables: { ids: ids }
      })
    })
      .then(function (r) { return r.json(); })
      .then(function (json) {
        var map = {};
        ((json.data && json.data.nodes) || []).forEach(function (n) {
          if (n) map[n.id.replace(GID, '')] = { price: Number(n.price.amount), available: n.availableForSale };
        });
        try { sessionStorage.setItem(PRICE_KEY, JSON.stringify({ t: Date.now(), map: map })); } catch (e) {}
        applyPrices(map);
      })
      .catch(function () {});
  }

  /* ------------------------------------------------------------------ *
   * Buy box
   * ------------------------------------------------------------------ */

  function initBuybox(box) {
    var key = box.getAttribute('data-fizz-buybox');
    var product = CATALOG[key];
    if (!product) return;

    var swatches = Array.prototype.slice.call(box.querySelectorAll('[data-swatch]'));
    var optionValue = box.querySelector('[data-fizz-option-value]');
    var qtyInput = box.querySelector('[data-fizz-qty]');
    var buyBtn = box.querySelector('[data-fizz-buy]');
    var buyLabel = box.querySelector('[data-fizz-buy-label]');
    var totalEl = box.querySelector('[data-fizz-total]');
    var status = box.querySelector('[data-fizz-buy-status]');
    var plans = Array.prototype.slice.call(box.querySelectorAll('input[name="fizz-plan"]'));

    var state = {
      variantId: box.getAttribute('data-fizz-variant') || (swatches[0] && swatches[0].getAttribute('data-fizz-variant')) || product.variants[0].id,
      qty: 1,
      plan: ''
    };

    function render() {
      var variant = variantById(key, state.variantId);
      if (optionValue) optionValue.textContent = variant.label;
      box.querySelectorAll('[data-fizz-price]').forEach(function (p) { p.textContent = money(product.price); });
      if (totalEl) totalEl.textContent = money(product.price * state.qty);
      var soldOut = available[state.variantId] === false;
      buyBtn.disabled = soldOut;
      if (!buyBtn.classList.contains('is-busy')) buyLabel.textContent = soldOut ? 'Sold out' : 'Add to cart';
      document.dispatchEvent(new CustomEvent('fizz:buybox', { detail: { key: key, variant: variant, qty: state.qty, plan: state.plan, soldOut: soldOut } }));
    }

    // Swatches: the gallery script owns clicks (it also moves the photo), so follow its is-active class.
    swatches.forEach(function (s, i) {
      new MutationObserver(function () {
        var on = s.classList.contains('is-active');
        s.setAttribute('aria-checked', on ? 'true' : 'false');
        s.tabIndex = on ? 0 : -1;
        if (on) {
          state.variantId = s.getAttribute('data-fizz-variant');
          render();
        }
      }).observe(s, { attributes: true, attributeFilter: ['class'] });
      s.tabIndex = i === 0 ? 0 : -1;
      // Radio-group arrow keys
      s.addEventListener('keydown', function (e) {
        var step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (!step) return;
        e.preventDefault();
        var next = swatches[(i + step + swatches.length) % swatches.length];
        next.click();
        next.focus();
      });
    });

    box.querySelectorAll('[data-fizz-qty-step]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setQty(state.qty + Number(btn.getAttribute('data-fizz-qty-step')));
      });
    });
    function setQty(n) {
      state.qty = Math.max(1, Math.min(99, Math.round(Number(n) || 1)));
      qtyInput.value = state.qty;
      render();
    }
    qtyInput.addEventListener('change', function () { setQty(qtyInput.value); });

    plans.forEach(function (input) {
      input.addEventListener('change', function () {
        state.plan = input.value;
        render();
      });
    });

    function buy() {
      if (buyBtn.disabled || buyBtn.classList.contains('is-busy') || !cart()) return;
      var variant = variantById(key, state.variantId);
      var line = { merchandiseId: GID + variant.id, quantity: state.qty };
      if (state.plan) line.sellingPlanId = state.plan;

      buyBtn.classList.add('is-busy');
      buyLabel.textContent = 'Adding…';
      status.textContent = '';
      cart().addLines([line])
        .then(function (c) {
          buyLabel.textContent = 'Added ✓';
          if (window.Fizz && Fizz.burst) Fizz.burst(buyBtn);
          status.textContent = product.title + (product.optionName ? ' — ' + variant.label : '') + ' added to your cart.';
          openBundle(key, variant, state, c);
        })
        .catch(function (err) {
          buyLabel.textContent = 'Add to cart';
          status.textContent = 'Couldn’t add to cart: ' + (err && err.message ? err.message : 'please try again.');
        })
        .then(function () {
          setTimeout(function () {
            buyBtn.classList.remove('is-busy');
            render();
          }, 1400);
        });
    }
    buyBtn.addEventListener('click', buy);
    document.addEventListener('fizz:prices', render);

    initStickyBar(box, key, buy);
    render();
  }

  /* ------------------------------------------------------------------ *
   * Sticky add-to-cart bar (phones / tablets)
   * ------------------------------------------------------------------ */

  function initStickyBar(box, key, buy) {
    var row = box.querySelector('[data-fizz-buy-row]');
    if (!row || !('IntersectionObserver' in window)) return;
    var bar = el('div', { class: 'pdp-sticky-buy', 'aria-hidden': 'true' },
      '<img class="pdp-sticky-thumb" alt="">' +
      '<div class="pdp-sticky-info"><p class="pdp-sticky-title"></p><p class="pdp-sticky-meta"></p></div>' +
      '<button type="button" class="pdp-add-btn pdp-sticky-btn" tabindex="-1">Add to cart</button>');
    document.body.appendChild(bar);
    var thumb = bar.querySelector('.pdp-sticky-thumb');
    var meta = bar.querySelector('.pdp-sticky-meta');
    var btn = bar.querySelector('.pdp-sticky-btn');
    bar.querySelector('.pdp-sticky-title').textContent = CATALOG[key].title;
    btn.addEventListener('click', buy);

    document.addEventListener('fizz:buybox', function (e) {
      var d = e.detail;
      thumb.src = d.variant.image;
      meta.textContent =
        (CATALOG[key].optionName ? d.variant.label + ' · ' : '') +
        (d.qty > 1 ? d.qty + ' × ' : '') + money(CATALOG[key].price) +
        (d.plan ? ' · Subscription' : '');
      btn.disabled = d.soldOut;
      btn.textContent = d.soldOut ? 'Sold out' : 'Add to cart';
    });

    new IntersectionObserver(function (entries) {
      var entry = entries[0];
      // Show only once the buy row has scrolled up out of view (not before reaching it).
      var show = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      bar.classList.toggle('is-visible', show);
      bar.setAttribute('aria-hidden', show ? 'false' : 'true');
      btn.tabIndex = show ? 0 : -1;
      document.documentElement.classList.toggle('pdp-sticky-on', show);
    }).observe(row);
  }

  /* ------------------------------------------------------------------ *
   * "Complete your Fizz kit" pop-up
   * ------------------------------------------------------------------ */

  var modal, lastFocus;

  function cartProductKeys(c) {
    var keys = {};
    (((c && c.lines && c.lines.edges) || [])).forEach(function (edge) {
      var merch = edge.node.merchandise;
      var k = merch && productForVariant(merch.id);
      if (k) keys[k] = true;
    });
    return keys;
  }

  function suggestionCard(key) {
    var p = CATALOG[key];
    var card = el('li', { class: 'fizz-kit-card', 'data-kit': key });
    var options = '';
    if (key === 'bottle') {
      options = '<div class="fizz-kit-options" role="radiogroup" aria-label="Bottle color">' +
        p.variants.map(function (v, i) {
          return '<button type="button" role="radio" class="fizz-kit-swatch' + (i === 0 ? ' is-active' : '') + '" aria-checked="' + (i === 0) + '" aria-label="' + v.label + '" title="' + v.label + '" data-variant="' + v.id + '" style="--swatch:' + v.swatch + '"></button>';
        }).join('') + '</div>';
    } else if (key === 'flavor') {
      options = '<div class="fizz-kit-options is-chips" role="radiogroup" aria-label="Flavor">' +
        p.variants.map(function (v, i) {
          return '<button type="button" role="radio" class="fizz-kit-chip' + (i === 0 ? ' is-active' : '') + '" aria-checked="' + (i === 0) + '" data-variant="' + v.id + '">' + v.label + '</button>';
        }).join('') +
        '<button type="button" role="radio" class="fizz-kit-chip" aria-checked="false" data-variant="all">All 3 · sampler</button></div>';
    } else if (key === 'charge') {
      options = '<div class="fizz-kit-options is-chips" role="radiogroup" aria-label="Purchase option">' +
        '<button type="button" role="radio" class="fizz-kit-chip is-active" aria-checked="true" data-plan="">One-time</button>' +
        '<button type="button" role="radio" class="fizz-kit-chip" aria-checked="false" data-plan="' + SUBSCRIBE_PLAN + '">Subscribe &amp; refill</button></div>' +
        '<p class="fizz-kit-note" hidden>Delivery on Demand — reorder when you run low.</p>';
    }
    card.innerHTML =
      '<div class="fizz-kit-media' + (key === 'bottle' ? ' is-product' : '') + '"><img alt="" src="' + p.variants[0].image + '"></div>' +
      '<div class="fizz-kit-body">' +
        '<p class="fizz-kit-title">' + p.title + '</p>' +
        '<p class="fizz-kit-pitch">' + p.pitch + '</p>' +
        options +
      '</div>' +
      '<button type="button" class="fizz-kit-add"><span class="fizz-kit-add-label">Add</span> <span class="fizz-kit-price">' + money(p.price) + '</span></button>';

    var sel = { variant: p.variants[0].id, plan: '' };
    var img = card.querySelector('img');
    var priceEl = card.querySelector('.fizz-kit-price');
    var addBtn = card.querySelector('.fizz-kit-add');
    var note = card.querySelector('.fizz-kit-note');

    function lines() {
      if (sel.variant === 'all') {
        return p.variants.map(function (v) { return { merchandiseId: GID + v.id, quantity: 1 }; });
      }
      var line = { merchandiseId: GID + sel.variant, quantity: 1 };
      if (sel.plan) line.sellingPlanId = sel.plan;
      return [line];
    }

    card.querySelectorAll('[role="radio"]').forEach(function (opt, i, all) {
      opt.addEventListener('click', function () {
        all.forEach(function (o) {
          o.classList.toggle('is-active', o === opt);
          o.setAttribute('aria-checked', o === opt ? 'true' : 'false');
        });
        if (opt.hasAttribute('data-variant')) sel.variant = opt.getAttribute('data-variant');
        if (opt.hasAttribute('data-plan')) sel.plan = opt.getAttribute('data-plan');
        if (sel.variant !== 'all') img.src = variantById(key, sel.variant).image;
        priceEl.textContent = money(p.price * lines().length);
        if (note) note.hidden = !sel.plan;
        if (addBtn.classList.contains('is-added')) {
          addBtn.classList.remove('is-added');
          addBtn.querySelector('.fizz-kit-add-label').textContent = 'Add';
        }
      });
    });

    addBtn.addEventListener('click', function () {
      if (addBtn.classList.contains('is-busy') || addBtn.classList.contains('is-added')) return;
      addBtn.classList.add('is-busy');
      var label = addBtn.querySelector('.fizz-kit-add-label');
      label.textContent = 'Adding…';
      cart().addLines(lines())
        .then(function (c) {
          addBtn.classList.add('is-added');
          label.textContent = 'Added ✓';
          if (window.Fizz && Fizz.burst) Fizz.burst(addBtn, 10);
          updateCheckout(c);
        })
        .catch(function () { label.textContent = 'Try again'; })
        .then(function () { addBtn.classList.remove('is-busy'); });
    });

    return card;
  }

  function updateCheckout(c) {
    if (!modal || !c) return;
    var link = modal.querySelector('.fizz-kit-checkout');
    if (c.checkoutUrl) link.href = c.checkoutUrl;
    var sub = c.cost && (c.cost.subtotalAmount || c.cost.totalAmount);
    modal.querySelector('.fizz-kit-subtotal').textContent =
      c.totalQuantity + (c.totalQuantity === 1 ? ' item' : ' items') + ' · ' + money(sub ? Number(sub.amount) : 0);
  }

  function closeBundle() {
    if (!modal) return;
    modal.classList.remove('is-open');
    document.documentElement.classList.remove('fizz-kit-open');
    var m = modal;
    setTimeout(function () { m.remove(); }, 300);
    modal = null;
    if (lastFocus) lastFocus.focus();
  }

  function openBundle(addedKey, variant, state, c) {
    var inCart = cartProductKeys(c);
    var suggestions = ['bottle', 'flavor', 'charge'].filter(function (k) { return k !== addedKey && !inCart[k]; });
    if (!suggestions.length) {
      cart().open();
      return;
    }
    if (modal) modal.remove();
    lastFocus = document.activeElement;

    var added = CATALOG[addedKey];
    var summary =
      (state.qty > 1 ? state.qty + ' × ' : '') + added.title +
      (added.optionName ? ' — ' + variant.label : '') +
      (state.plan ? ' (subscription)' : '');

    modal = el('div', { class: 'fizz-kit', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'fizz-kit-title' });
    modal.innerHTML =
      '<div class="fizz-kit-backdrop" data-kit-close></div>' +
      '<div class="fizz-kit-panel">' +
        '<button type="button" class="fizz-kit-close" data-kit-close aria-label="Close">×</button>' +
        '<p class="fizz-kit-added"><span class="fizz-kit-check" aria-hidden="true">✓</span> Added to cart: ' + summary + '</p>' +
        '<h2 class="fizz-kit-heading" id="fizz-kit-title">Complete your Fizz kit</h2>' +
        '<p class="fizz-kit-sub">' + (addedKey === 'bottle'
          ? 'Your bottle needs CO₂ to fizz — and flavor makes it fun.'
          : 'Everything works together. Add what you’re missing.') + '</p>' +
        '<ul class="fizz-kit-list"></ul>' +
        '<div class="fizz-kit-footer">' +
          '<p class="fizz-kit-subtotal"></p>' +
          '<div class="fizz-kit-actions">' +
            '<button type="button" class="fizz-kit-secondary" data-kit-cart>View cart</button>' +
            '<a class="fizz-kit-checkout" href="#">Checkout</a>' +
          '</div>' +
          '<button type="button" class="fizz-kit-link" data-kit-close>Keep shopping</button>' +
        '</div>' +
      '</div>';

    var list = modal.querySelector('.fizz-kit-list');
    suggestions.forEach(function (k) { list.appendChild(suggestionCard(k)); });
    updateCheckout(c);

    modal.querySelectorAll('[data-kit-close]').forEach(function (b) { b.addEventListener('click', closeBundle); });
    modal.querySelector('[data-kit-cart]').addEventListener('click', function () {
      closeBundle();
      cart().open();
    });
    modal.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeBundle();
      if (e.key !== 'Tab') return;
      // Keep focus inside the dialog
      var f = modal.querySelectorAll('button:not([disabled]), a[href]');
      var first = f[0];
      var last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    document.body.appendChild(modal);
    document.documentElement.classList.add('fizz-kit-open');
    requestAnimationFrame(function () {
      modal.classList.add('is-open');
      modal.querySelector('.fizz-kit-close').focus({ preventScroll: true });
    });
  }

  /* ------------------------------------------------------------------ *
   * Details rows slide open / closed
   * ------------------------------------------------------------------ */

  function initAccordions(scope) {
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    scope.querySelectorAll('details.pdp-accordion').forEach(function (row) {
      var summary = row.querySelector('summary');
      var body = row.querySelector('.pdp-accordion-body');
      if (!summary || !body || reduced || !body.animate) return;
      var anim = null;

      summary.addEventListener('click', function (e) {
        e.preventDefault();
        var opening = !row.open || row.classList.contains('is-closing');
        var from = anim ? getComputedStyle(body).height : null;
        if (anim) anim.cancel();
        row.classList.remove('is-closing');
        row.open = true;
        var full = body.scrollHeight + 'px';
        var gap = getComputedStyle(body).marginBottom;
        var open = { height: full, marginBottom: gap, opacity: 1, transform: 'none' };
        var shut = { height: '0px', marginBottom: '0px', opacity: 0, transform: 'translate3d(0,-8px,0)' };
        if (from) (opening ? shut : open).height = from;
        body.style.overflow = 'hidden';
        if (!opening) row.classList.add('is-closing');
        anim = body.animate(opening ? [shut, open] : [open, shut], {
          duration: opening ? 420 : 300,
          easing: opening ? 'cubic-bezier(0.16, 1, 0.3, 1)' : 'cubic-bezier(0.4, 0, 1, 1)'
        });
        anim.onfinish = function () {
          anim = null;
          body.style.overflow = '';
          if (!opening) {
            row.open = false;
            row.classList.remove('is-closing');
          }
        };
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * Boot
   * ------------------------------------------------------------------ */

  function boot() {
    var box = document.querySelector('[data-fizz-buybox]');
    if (!box) return;
    loadPrices();
    initBuybox(box);
    initAccordions(box);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
