/**
 * Homepage featured Bottle PDP (replaces Find Your Color).
 * Swatches swap the hero image; qty + ATC go through FizzNavCart.
 */
(function () {
  'use strict';

  var section = document.querySelector('[data-fizz-featured]');
  if (!section) return;

  var box = section.querySelector('[data-fizz-buybox="bottle"]');
  var img = section.querySelector('[data-featured-img]');
  if (!box || !img) return;

  var GID = 'gid://shopify/ProductVariant/';
  var PRICE = 50;
  var LABELS = {
    '51846210421021': 'White',
    '51846210388253': 'Black',
    '51846210519325': 'Blue'
  };

  var swatches = Array.prototype.slice.call(box.querySelectorAll('[data-swatch]'));
  var optionValue = box.querySelector('[data-fizz-option-value]');
  var qtyInput = box.querySelector('[data-fizz-qty]');
  var buyBtn = box.querySelector('[data-fizz-buy]');
  var buyLabel = box.querySelector('[data-fizz-buy-label]');
  var totalEl = box.querySelector('[data-fizz-total]');
  var status = box.querySelector('[data-fizz-buy-status]');

  var state = {
    variantId: box.getAttribute('data-fizz-variant') || swatches[0].getAttribute('data-fizz-variant'),
    qty: 1
  };

  function money(n) {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
    } catch (e) {
      return '$' + Number(n).toFixed(2);
    }
  }

  function cart() {
    return window.FizzNavCart;
  }

  function setActiveSwatch(swatch) {
    swatches.forEach(function (s) {
      var on = s === swatch;
      s.classList.toggle('is-active', on);
      s.setAttribute('aria-checked', on ? 'true' : 'false');
      s.tabIndex = on ? 0 : -1;
    });
    state.variantId = swatch.getAttribute('data-fizz-variant');
    var src = swatch.getAttribute('data-featured-src');
    var srcset = swatch.getAttribute('data-featured-srcset');
    if (src) {
      img.src = src;
      if (srcset) img.srcset = srcset;
      img.alt = 'Fizz Bottle in ' + (LABELS[state.variantId] || 'White');
    }
    render();
  }

  function render() {
    if (optionValue) optionValue.textContent = LABELS[state.variantId] || 'White';
    box.querySelectorAll('[data-fizz-price]').forEach(function (el) {
      el.textContent = money(PRICE);
    });
    if (totalEl) totalEl.textContent = money(PRICE * state.qty);
    if (buyLabel && !buyBtn.classList.contains('is-busy')) {
      buyLabel.textContent = 'Add to cart';
    }
  }

  function setQty(n) {
    state.qty = Math.max(1, Math.min(99, Math.round(Number(n) || 1)));
    if (qtyInput) qtyInput.value = state.qty;
    render();
  }

  swatches.forEach(function (s, i) {
    s.tabIndex = i === 0 ? 0 : -1;
    s.addEventListener('click', function () {
      setActiveSwatch(s);
    });
    s.addEventListener('keydown', function (e) {
      var step =
        e.key === 'ArrowRight' || e.key === 'ArrowDown'
          ? 1
          : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
            ? -1
            : 0;
      if (!step) return;
      e.preventDefault();
      var next = swatches[(i + step + swatches.length) % swatches.length];
      setActiveSwatch(next);
      next.focus();
    });
  });

  box.querySelectorAll('[data-fizz-qty-step]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      setQty(state.qty + Number(btn.getAttribute('data-fizz-qty-step')));
    });
  });
  if (qtyInput) {
    qtyInput.addEventListener('change', function () {
      setQty(qtyInput.value);
    });
  }

  buyBtn.addEventListener('click', function () {
    if (buyBtn.classList.contains('is-busy') || !cart()) return;
    buyBtn.classList.add('is-busy');
    buyLabel.textContent = 'Adding…';
    if (status) status.textContent = '';
    cart()
      .addLines([{ merchandiseId: GID + state.variantId, quantity: state.qty }])
      .then(function () {
        buyLabel.textContent = 'Added ✓';
        if (window.Fizz && Fizz.burst) Fizz.burst(buyBtn);
        if (status) {
          status.textContent =
            'Fizz Bottle — ' + (LABELS[state.variantId] || '') + ' added to your cart.';
        }
        setTimeout(function () {
          cart().open();
        }, 500);
      })
      .catch(function (err) {
        buyLabel.textContent = 'Add to cart';
        if (status) {
          status.textContent =
            'Couldn’t add to cart: ' +
            (err && err.message ? err.message : 'please try again.');
        }
      })
      .then(function () {
        setTimeout(function () {
          buyBtn.classList.remove('is-busy');
          render();
        }, 1400);
      });
  });

  render();
})();
