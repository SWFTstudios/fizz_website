(function () {
  'use strict';
  if (window.__fizzNavCart) return;
  window.__fizzNavCart = true;

  var CFG = window.FIZZ_STOREFRONT || {};
  var DOMAIN = CFG.domain || 'fizz-9820.myshopify.com';
  var TOKEN = CFG.token || '';
  var API = 'https://' + DOMAIN + '/api/2025-01/graphql.json';
  var CART_KEY = 'fizz-sf-cart-id';
  var VARIANT_BY_HANDLE = {
    'fizz-bottle': 'gid://shopify/ProductVariant/51846210421021',
    'fizz-bottle-white': 'gid://shopify/ProductVariant/51846210421021',
    'fizz-bottle-black': 'gid://shopify/ProductVariant/51846210388253',
    'fizz-bottle-blue': 'gid://shopify/ProductVariant/51846210519325',
    'fizz-co2-refills': 'gid://shopify/ProductVariant/51885256671517',
    'fizz-flavor-mixed-berry': 'gid://shopify/ProductVariant/51885256638749',
    'fizz-flavor-zesty-lime': 'gid://shopify/ProductVariant/51885256573213',
    'fizz-flavor-orange-tangerine': 'gid://shopify/ProductVariant/51885256442141'
  };

  // Shopify still titles the bottle variants White / Black / Blue; show the colorway names.
  var COLOR_NAMES = { White: 'Stone', Black: 'Onyx', Blue: 'Pacific' };

  var BOTTLE_SWATCH_VARIANTS = {
    '0': '51846210421021',
    '1': '51846210388253',
    '2': '51846210519325'
  };
  var FLAVOR_SWATCH_VARIANTS = {
    '0': '51885256638749',
    '1': '51885256573213',
    '2': '51885256442141'
  };

  var root, menu, menuToggle, cartDrawer, cartCountEl, cartContent, cartBusy = false;

  function $(sel, el) {
    return (el || document).querySelector(sel);
  }
  function $$(sel, el) {
    return Array.prototype.slice.call((el || document).querySelectorAll(sel));
  }

  function money(amount, currency) {
    var n = Number(amount || 0);
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currency || 'USD'
      }).format(n);
    } catch (e) {
      return '$' + n.toFixed(2);
    }
  }

  function gql(query, variables) {
    if (!TOKEN) {
      return Promise.reject(new Error('Missing Storefront token. Set window.FIZZ_STOREFRONT.token'));
    }
    return fetch(API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': TOKEN
      },
      body: JSON.stringify({ query: query, variables: variables || {} })
    }).then(function (r) {
      return r.json();
    }).then(function (json) {
      if (json.errors && json.errors.length) {
        throw new Error(json.errors.map(function (e) { return e.message; }).join('; '));
      }
      return json.data;
    });
  }

  var CART_FRAGMENT =
    'id checkoutUrl totalQuantity ' +
    'cost { subtotalAmount { amount currencyCode } totalAmount { amount currencyCode } } ' +
    'lines(first: 50) { edges { node { id quantity ' +
    'cost { totalAmount { amount currencyCode } } ' +
    'sellingPlanAllocation { sellingPlan { name } } ' +
    'merchandise { ... on ProductVariant { id title image { url altText } product { title handle } } } ' +
    '} } }';

  function getCartId() {
    try { return localStorage.getItem(CART_KEY) || ''; } catch (e) { return ''; }
  }
  function setCartId(id) {
    try {
      if (id) localStorage.setItem(CART_KEY, id);
      else localStorage.removeItem(CART_KEY);
    } catch (e) {}
  }

  function fetchCart(id) {
    if (!id) return Promise.resolve(null);
    return gql(
      'query Cart($id: ID!) { cart(id: $id) { ' + CART_FRAGMENT + ' } }',
      { id: id }
    ).then(function (d) { return d && d.cart; });
  }

  function createCart(lines) {
    return gql(
      'mutation CartCreate($lines: [CartLineInput!]) { cartCreate(input: { lines: $lines }) { cart { ' +
        CART_FRAGMENT +
        ' } userErrors { field message } } }',
      { lines: lines || [] }
    ).then(function (d) {
      var payload = d.cartCreate;
      if (payload.userErrors && payload.userErrors.length) {
        throw new Error(payload.userErrors.map(function (e) { return e.message; }).join('; '));
      }
      setCartId(payload.cart.id);
      return payload.cart;
    });
  }

  function ensureCart() {
    var id = getCartId();
    if (!id) return createCart([]);
    return fetchCart(id).then(function (cart) {
      if (cart) return cart;
      setCartId('');
      return createCart([]);
    });
  }

  /**
   * addLines('gid://…', 2) or addLines([{ merchandiseId, quantity, sellingPlanId? }, …])
   */
  function addLines(merchandiseId, quantity) {
    var lines = Array.isArray(merchandiseId)
      ? merchandiseId
      : [{ merchandiseId: merchandiseId, quantity: quantity || 1 }];
    return ensureCart().then(function (cart) {
      return gql(
        'mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) { cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ' +
          CART_FRAGMENT +
          ' } userErrors { field message } } }',
        {
          cartId: cart.id,
          lines: lines
        }
      ).then(function (d) {
        var payload = d.cartLinesAdd;
        if (payload.userErrors && payload.userErrors.length) {
          throw new Error(payload.userErrors.map(function (e) { return e.message; }).join('; '));
        }
        setCartId(payload.cart.id);
        return payload.cart;
      });
    });
  }

  function updateLine(lineId, quantity) {
    return ensureCart().then(function (cart) {
      if (quantity <= 0) return removeLine(lineId);
      return gql(
        'mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) { cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { ' +
          CART_FRAGMENT +
          ' } userErrors { field message } } }',
        { cartId: cart.id, lines: [{ id: lineId, quantity: quantity }] }
      ).then(function (d) {
        var payload = d.cartLinesUpdate;
        if (payload.userErrors && payload.userErrors.length) {
          throw new Error(payload.userErrors.map(function (e) { return e.message; }).join('; '));
        }
        return payload.cart;
      });
    });
  }

  function removeLine(lineId) {
    return ensureCart().then(function (cart) {
      return gql(
        'mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) { cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { ' +
          CART_FRAGMENT +
          ' } userErrors { field message } } }',
        { cartId: cart.id, lineIds: [lineId] }
      ).then(function (d) {
        var payload = d.cartLinesRemove;
        if (payload.userErrors && payload.userErrors.length) {
          throw new Error(payload.userErrors.map(function (e) { return e.message; }).join('; '));
        }
        return payload.cart;
      });
    });
  }

  function setCount(n) {
    if (!cartCountEl) return;
    var q = Number(n) || 0;
    if (q > (Number(cartCountEl.textContent) || 0)) {
      // Little pop when something lands in the cart
      cartCountEl.classList.remove('is-bump');
      void cartCountEl.offsetWidth;
      cartCountEl.classList.add('is-bump');
    }
    cartCountEl.textContent = String(q);
    if (q > 0) cartCountEl.removeAttribute('hidden');
    else cartCountEl.setAttribute('hidden', '');
  }

  function renderCart(cart) {
    if (!cartContent) return;
    setCount(cart && cart.totalQuantity);

    if (!cart || !cart.lines || !cart.lines.edges || !cart.lines.edges.length) {
      cartContent.innerHTML =
        '<div class="fizz-cart-empty">' +
          '<p class="fizz-cart-empty-text">Your cart is empty</p>' +
          '<button type="button" class="fizz-cart-continue" data-fizz-cart-close>Continue shopping</button>' +
        '</div>';
      return;
    }

    var linesHtml = cart.lines.edges
      .map(function (edge) {
        var node = edge.node;
        var merch = node.merchandise || {};
        var product = merch.product || {};
        var img = (merch.image && merch.image.url) || '';
        var title = product.title || 'Item';
        var variant = merch.title && merch.title !== 'Default Title' ? merch.title : '';
        if (COLOR_NAMES[variant]) variant = COLOR_NAMES[variant];
        var plan = node.sellingPlanAllocation && node.sellingPlanAllocation.sellingPlan;
        var lineTotal = node.cost && node.cost.totalAmount;
        return (
          '<li class="fizz-cart-item" data-line-id="' + node.id + '">' +
            '<div class="fizz-cart-item-media">' +
              (img
                ? '<img src="' + img + '" alt="' + (merch.image.altText || title).replace(/"/g, '') + '">'
                : '') +
            '</div>' +
            '<div class="fizz-cart-item-info">' +
              '<span class="fizz-cart-item-title">' + title + '</span>' +
              (variant ? '<p class="fizz-cart-item-variant">' + variant + '</p>' : '') +
              (plan ? '<p class="fizz-cart-item-variant fizz-cart-item-plan">Subscription · ' + plan.name + '</p>' : '') +
              '<p class="fizz-cart-item-price">' +
                money(lineTotal && lineTotal.amount, lineTotal && lineTotal.currencyCode) +
              '</p>' +
              '<div class="fizz-cart-item-controls">' +
                '<div class="fizz-cart-stepper">' +
                  '<button type="button" class="fizz-cart-stepper-btn" data-fizz-qty="-1" aria-label="Decrease">−</button>' +
                  '<span class="fizz-cart-qty">' + node.quantity + '</span>' +
                  '<button type="button" class="fizz-cart-stepper-btn" data-fizz-qty="1" aria-label="Increase">+</button>' +
                '</div>' +
                '<button type="button" class="fizz-cart-remove" data-fizz-remove>Remove</button>' +
              '</div>' +
            '</div>' +
          '</li>'
        );
      })
      .join('');

    var sub = cart.cost && (cart.cost.subtotalAmount || cart.cost.totalAmount);
    cartContent.innerHTML =
      '<ul class="fizz-cart-items">' + linesHtml + '</ul>' +
      '<div class="fizz-cart-footer">' +
        '<div class="fizz-cart-summary">' +
          '<p class="fizz-cart-row"><span>Subtotal</span><span>' +
            money(sub && sub.amount, sub && sub.currencyCode) +
          '</span></p>' +
          '<p class="fizz-cart-note">Taxes and shipping calculated at checkout.</p>' +
        '</div>' +
        '<a class="fizz-cart-checkout" href="' + (cart.checkoutUrl || '#') + '">Checkout</a>' +
        '<button type="button" class="fizz-cart-continue" data-fizz-cart-close>Continue shopping</button>' +
      '</div>';
  }

  function withBusy(promise) {
    cartBusy = true;
    if (cartContent) cartContent.classList.add('is-updating');
    return promise
      .then(function (cart) {
        renderCart(cart);
        return cart;
      })
      .catch(function (err) {
        console.error('[fizz-nav-cart]', err);
        if (cartContent) {
          var msg = document.createElement('p');
          msg.className = 'fizz-cart-note';
          msg.style.padding = '1rem 1.25rem';
          msg.textContent = err.message || 'Cart error';
          cartContent.prepend(msg);
        }
      })
      .then(function (cart) {
        cartBusy = false;
        if (cartContent) cartContent.classList.remove('is-updating');
        return cart;
      });
  }

  function openMenu() {
    if (!root || !menu) return;
    root.classList.add('is-menu-open');
    menu.classList.add('is-open');
    menu.removeAttribute('hidden');
    if (menuToggle) menuToggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('fizz-menu-open');
  }
  function closeMenu() {
    if (!root || !menu) return;
    root.classList.remove('is-menu-open');
    menu.classList.remove('is-open');
    menu.setAttribute('hidden', '');
    if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('fizz-menu-open');
  }
  function toggleMenu() {
    if (root && root.classList.contains('is-menu-open')) closeMenu();
    else openMenu();
  }

  var cartCloseTimer = null;
  var CART_SLIDE_MS = 380;

  function prefersReducedMotion() {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {
      return false;
    }
  }

  function openCart() {
    if (!cartDrawer) return;
    closeMenu();
    if (cartCloseTimer) {
      window.clearTimeout(cartCloseTimer);
      cartCloseTimer = null;
    }
    cartDrawer.removeAttribute('hidden');
    cartDrawer.style.removeProperty('display');
    // Mount off-screen first so translateX can animate (display:none kills transitions).
    cartDrawer.classList.add('is-mounted');
    cartDrawer.classList.remove('is-open');
    document.body.classList.add('fizz-cart-open');
    var cartBtn = $('[data-fizz-cart-link]', root);
    if (cartBtn) cartBtn.setAttribute('aria-expanded', 'true');

    function slideIn() {
      cartDrawer.classList.add('is-open');
    }
    if (prefersReducedMotion()) {
      slideIn();
    } else {
      // Double rAF: paint at translateX(100%), then open.
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(slideIn);
      });
    }

    withBusy(ensureCart().then(function (cart) {
      renderCart(cart);
      return cart;
    }));
  }
  function closeCart() {
    if (!cartDrawer) return;
    if (cartCloseTimer) {
      window.clearTimeout(cartCloseTimer);
      cartCloseTimer = null;
    }
    cartDrawer.classList.remove('is-open');
    document.body.classList.remove('fizz-cart-open');
    var cartBtn = $('[data-fizz-cart-link]', root);
    if (cartBtn) cartBtn.setAttribute('aria-expanded', 'false');

    function finishClose() {
      cartCloseTimer = null;
      cartDrawer.classList.remove('is-mounted');
      cartDrawer.setAttribute('hidden', '');
      cartDrawer.style.removeProperty('display');
    }

    if (prefersReducedMotion()) {
      finishClose();
      return;
    }
    cartCloseTimer = window.setTimeout(finishClose, CART_SLIDE_MS);
  }

  function toVariantGid(raw) {
    if (!raw) return null;
    var s = String(raw).trim();
    if (!s) return null;
    if (s.indexOf('gid://shopify/ProductVariant/') === 0) return s;
    if (VARIANT_BY_HANDLE[s]) return VARIANT_BY_HANDLE[s];
    if (/^\d+$/.test(s)) return 'gid://shopify/ProductVariant/' + s;
    return null;
  }

  function variantFromShopifyUrl(href) {
    try {
      var u = new URL(href, window.location.href);
      var m = u.pathname.match(/\/products\/([^/?#]+)/);
      if (!m) return null;
      var handle = decodeURIComponent(m[1]);
      return VARIANT_BY_HANDLE[handle] || null;
    } catch (e) {
      return null;
    }
  }

  function variantFromAtcLink(link) {
    if (!link) return null;
    var fromAttr =
      toVariantGid(link.getAttribute('data-fizz-variant')) ||
      toVariantGid(link.getAttribute('data-variant-id')) ||
      toVariantGid(link.getAttribute('data-fizz-variant-id'));
    if (fromAttr) return fromAttr;
    return variantFromShopifyUrl(link.getAttribute('href') || '');
  }

  function primaryAtcButton() {
    return (
      $('.pdp-buybox .pdp-add-btn[data-fizz-atc]') ||
      $('.pdp-hero .pdp-add-btn[data-fizz-atc]') ||
      $('.pdp-add-btn[data-fizz-atc]')
    );
  }

  function resolveSwatchVariant(swatch) {
    if (!swatch) return null;
    var fromAttr =
      toVariantGid(swatch.getAttribute('data-fizz-variant')) ||
      toVariantGid(swatch.getAttribute('data-variant-id'));
    if (fromAttr) return fromAttr;
    var fromProduct = variantFromShopifyUrl(swatch.getAttribute('data-product') || '');
    if (fromProduct) return fromProduct;
    var idx = swatch.getAttribute('data-swatch');
    var onFlavors = /\/flavors(\.html)?\/?$/.test(window.location.pathname) || !!$('.pdp-swatch.is-berry');
    var onBottle = /\/bottle(\.html)?\/?$/.test(window.location.pathname) || !!$('.pdp-swatch.is-white');
    if (onFlavors && FLAVOR_SWATCH_VARIANTS[idx]) {
      return toVariantGid(FLAVOR_SWATCH_VARIANTS[idx]);
    }
    if (onBottle && BOTTLE_SWATCH_VARIANTS[idx]) {
      return toVariantGid(BOTTLE_SWATCH_VARIANTS[idx]);
    }
    return null;
  }

  function syncAtcFromSwatch(swatch) {
    var variantId = resolveSwatchVariant(swatch);
    if (!variantId) return;
    var atc = primaryAtcButton();
    if (!atc) return;
    var numeric = String(variantId).replace('gid://shopify/ProductVariant/', '');
    atc.setAttribute('data-fizz-variant', numeric);
    atc.setAttribute('data-fizz-atc', 'true');
  }

  function bindSwatchVariants() {
    var swatches = $$('[data-swatch]');
    if (!swatches.length) return;
    swatches.forEach(function (swatch) {
      // Seed missing attrs from known maps / data-product URLs
      if (!swatch.getAttribute('data-fizz-variant')) {
        var seeded = resolveSwatchVariant(swatch);
        if (seeded) {
          swatch.setAttribute(
            'data-fizz-variant',
            String(seeded).replace('gid://shopify/ProductVariant/', '')
          );
        }
      }
      swatch.addEventListener('click', function () {
        syncAtcFromSwatch(swatch);
      });
      swatch.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') syncAtcFromSwatch(swatch);
      });
    });
    var active = $('.pdp-swatch.is-active[data-swatch]') || swatches[0];
    if (active) syncAtcFromSwatch(active);
  }

  function bind() {
    root = $('[data-fizz-nav]');
    if (!root) return;
    menu = $('[data-fizz-menu]', root);
    menuToggle = $('[data-fizz-menu-toggle]', root);
    cartDrawer = $('[data-fizz-cart-drawer]', root);
    cartCountEl = $('[data-fizz-cart-count]', root);
    cartContent = $('[data-fizz-cart-content]', root);
    bindSwatchVariants();

    if (menuToggle) {
      menuToggle.addEventListener('click', function (e) {
        e.preventDefault();
        toggleMenu();
      });
    }

    var cartLink = $('[data-fizz-cart-link]', root);
    if (cartLink) {
      cartLink.addEventListener('click', function (e) {
        e.preventDefault();
        openCart();
      });
    }

    root.addEventListener('click', function (e) {
      var t = e.target instanceof Element ? e.target : null;
      if (!t) return;
      if (t.closest('[data-fizz-cart-close]')) {
        e.preventDefault();
        closeCart();
        return;
      }
      if (t.closest('[data-fizz-nav-link]')) {
        closeMenu();
      }

      var item = t.closest('.fizz-cart-item');
      if (!item || cartBusy) return;
      var lineId = item.getAttribute('data-line-id');
      var qtyBtn = t.closest('[data-fizz-qty]');
      if (qtyBtn) {
        e.preventDefault();
        var delta = Number(qtyBtn.getAttribute('data-fizz-qty')) || 0;
        var qtyEl = item.querySelector('.fizz-cart-qty');
        var current = Number(qtyEl && qtyEl.textContent) || 1;
        withBusy(updateLine(lineId, current + delta));
        return;
      }
      if (t.closest('[data-fizz-remove]')) {
        e.preventDefault();
        withBusy(removeLine(lineId));
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (root && root.classList.contains('is-menu-open')) {
          closeMenu();
          if (menuToggle) menuToggle.focus();
        }
        closeCart();
      }
    });

    // Shopify parity: close menu when clicking outside the nav root
    document.addEventListener('click', function (e) {
      if (!root || !root.classList.contains('is-menu-open')) return;
      var t = e.target instanceof Element ? e.target : null;
      if (t && !root.contains(t)) closeMenu();
    });

    document.addEventListener(
      'click',
      function (e) {
        if (e.defaultPrevented || e.button !== 0) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        var t = e.target instanceof Element ? e.target : null;
        var link = t ? t.closest('a[href]') : null;
        if (!link) return;
        if (link.classList.contains('fizz-cart-checkout')) return;
        var isAtc =
          link.classList.contains('pdp-add-btn') ||
          /add to cart/i.test(link.textContent || '') ||
          link.hasAttribute('data-fizz-atc');
        if (!isAtc) return;
        // Never hijack real /flavors navigation (the flavor animation in fizz.js owns those). Hash-only / empty
        // hrefs are ignored here — on /flavors, href="#" resolves to /flavors and must still ATC.
        try {
          var rawHref = (link.getAttribute('href') || '').trim();
          if (rawHref && rawHref.charAt(0) !== '#') {
            var atcUrl = new URL(rawHref, window.location.href);
            var atcPath = atcUrl.pathname.replace(/\/+$/, '') || '/';
            if (
              atcUrl.origin === window.location.origin &&
              /\/flavors(\.html)?$/.test(atcPath)
            ) {
              return;
            }
          }
        } catch (err) {}
        var variantId = variantFromAtcLink(link);
        if (!variantId) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        openCart();
        withBusy(addLines(variantId, 1));
      },
      true
    );

    // Warm cart count
    var id = getCartId();
    if (id && TOKEN) {
      fetchCart(id).then(function (cart) {
        if (cart) setCount(cart.totalQuantity);
        else setCartId('');
      }).catch(function () {});
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }

  window.FizzNavCart = {
    open: openCart,
    close: closeCart,
    add: function (handleOrGid, qty) {
      var id = VARIANT_BY_HANDLE[handleOrGid] || handleOrGid;
      openCart();
      return withBusy(addLines(id, qty || 1));
    },
    /** Adds lines without opening the drawer; rejects on error so callers can show it. */
    addLines: function (lines) {
      return addLines(lines).then(function (cart) {
        renderCart(cart);
        return cart;
      });
    },
    get: function () {
      return fetchCart(getCartId());
    }
  };
})();

/* Menu photo panel: hovering or focusing a link brings its photo and note forward. */
(function () {
  'use strict';
  var menu = document.querySelector('.fizz-menu');
  if (!menu) return;
  var links = Array.prototype.slice.call(menu.querySelectorAll('a[data-menu-img]'));
  var imgs = Array.prototype.slice.call(menu.querySelectorAll('img[data-menu-img]'));
  var caption = menu.querySelector('[data-menu-caption]');
  var current = links.filter(function (l) { return l.classList.contains('w--current'); })[0];

  function show(link) {
    var i = link.getAttribute('data-menu-img');
    imgs.forEach(function (img) { img.classList.toggle('is-active', img.getAttribute('data-menu-img') === i); });
    links.forEach(function (l) { l.classList.toggle('is-hover', l === link); });
    var desc = link.querySelector('.fizz-menu-desc');
    if (caption && desc) caption.textContent = desc.textContent;
  }
  function reset() {
    var home = current || links[0];
    if (home) show(home);
    links.forEach(function (l) { l.classList.remove('is-hover'); });
  }
  links.forEach(function (link) {
    link.addEventListener('pointerenter', function () { show(link); });
    link.addEventListener('focus', function () { show(link); });
  });
  menu.addEventListener('pointerleave', reset);
  reset();
})();

/* Shared footer: one partial injected wherever [data-fizz-footer] is placed. */
(function () {
  'use strict';
  var host = document.querySelector('[data-fizz-footer]');
  if (!host) return;

  function resolvePartial() {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].src || '';
      if (src.indexOf('fizz-nav-cart.js') !== -1) {
        return src.replace(/js\/fizz-nav-cart\.js.*$/, 'partials/footer.html');
      }
    }
    return 'partials/footer.html';
  }

  fetch(resolvePartial(), { credentials: 'same-origin' })
    .then(function (res) {
      if (!res.ok) throw new Error('footer ' + res.status);
      return res.text();
    })
    .then(function (html) {
      var wrap = document.createElement('div');
      wrap.innerHTML = html.trim();
      var footer = wrap.firstElementChild;
      if (!footer) return;
      host.replaceWith(footer);
      var reveals = footer.querySelectorAll('[data-reveal]');
      if (!reveals.length) return;
      if (!document.documentElement.classList.contains('fizz-motion')) {
        reveals.forEach(function (el) { el.classList.add('is-in'); });
        return;
      }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          io.unobserve(entry.target);
          entry.target.classList.add('is-in');
        });
      }, { rootMargin: '0px 0px -10% 0px' });
      reveals.forEach(function (el) { io.observe(el); });
    })
    .catch(function () {
      host.hidden = true;
    });
})();
