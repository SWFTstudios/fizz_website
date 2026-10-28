(function () {
  'use strict';
  if (window.__fizzPdpGallery) return;
  window.__fizzPdpGallery = true;

  var SWIPE_THRESHOLD = 40;

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function ensureNav(stage) {
    if (!stage) return { prev: null, next: null };
    var prev = stage.querySelector('[data-gallery-prev]');
    var next = stage.querySelector('[data-gallery-next]');
    if (!prev) {
      prev = document.createElement('button');
      prev.type = 'button';
      prev.className = 'pdp-gallery-nav pdp-gallery-nav--prev';
      prev.setAttribute('data-gallery-prev', 'true');
      prev.setAttribute('aria-label', 'Previous image');
      prev.innerHTML = '<span aria-hidden="true">‹</span>';
      stage.appendChild(prev);
    }
    if (!next) {
      next = document.createElement('button');
      next.type = 'button';
      next.className = 'pdp-gallery-nav pdp-gallery-nav--next';
      next.setAttribute('data-gallery-next', 'true');
      next.setAttribute('aria-label', 'Next image');
      next.innerHTML = '<span aria-hidden="true">›</span>';
      stage.appendChild(next);
    }
    return { prev: prev, next: next };
  }

  ready(function () {
    var hero = document.querySelector('.pdp-hero');
    if (!hero) return;
    var stage = hero.querySelector('[data-gallery-stage]');
    var rail = hero.querySelector('[data-gallery-rail]');
    if (!rail) return;

    var slides = Array.prototype.slice.call(rail.querySelectorAll('.pdp-gallery-slide'));
    var thumbs = Array.prototype.slice.call(hero.querySelectorAll('[data-slide-index]'));
    var swatches = Array.prototype.slice.call(hero.querySelectorAll('[data-swatch]'));
    var index = 0;
    var isFlavors =
      hero.classList.contains('is-flavors') ||
      !!hero.querySelector('.pdp-swatch.is-berry, .pdp-swatch.is-cherry, .pdp-swatch.is-citrus');

    var COLORWAYS = isFlavors
      ? {
          '0': { bg: '#3a1428' },
          '1': { bg: '#3a1212' },
          '2': { bg: '#3a2410' }
        }
      : {
          '0': { bg: '#d4d3cc' },
          '1': { bg: '#101d23' },
          '2': { bg: '#0a1a22' }
        };

    var nav = ensureNav(stage);

    function setIndex(next) {
      if (!slides.length) return;
      index = ((next % slides.length) + slides.length) % slides.length;
      rail.style.transform = 'translateX(-' + index * 100 + '%)';
      thumbs.forEach(function (thumb) {
        var i = parseInt(thumb.getAttribute('data-slide-index'), 10);
        var on = i === index;
        thumb.classList.toggle('is-active', on);
        thumb.setAttribute('aria-current', on ? 'true' : 'false');
      });
      var slide = slides[index];
      var isLife = slide && slide.getAttribute('data-media-type') === 'lifestyle';
      if (stage) {
        if (isLife) {
          stage.style.backgroundColor = '#16161a';
        } else {
          var cw = COLORWAYS[String(index)] || COLORWAYS['0'];
          stage.style.backgroundColor = cw.bg;
        }
      }
      if (index <= 2) {
        var activeSwatch = null;
        swatches.forEach(function (s) {
          var on = parseInt(s.getAttribute('data-swatch'), 10) === index;
          s.classList.toggle('is-active', on);
          if (on) activeSwatch = s;
        });
        if (activeSwatch) syncAtcVariant(activeSwatch);
      }
    }

    function syncAtcVariant(swatch) {
      if (!swatch) return;
      var variant = swatch.getAttribute('data-fizz-variant') || '';
      if (!variant) {
        var product = swatch.getAttribute('data-product') || '';
        var m = product.match(/\/products\/([^/?#]+)/);
        var handle = m ? decodeURIComponent(m[1]) : '';
        var byHandle = {
          'fizz-flavor-mixed-berry': '51885256638749',
          'fizz-flavor-zesty-lime': '51885256573213',
          'fizz-flavor-orange-tangerine': '51885256442141'
        };
        var byIndexBottle = {
          '0': '51846210421021',
          '1': '51846210388253',
          '2': '51846210519325'
        };
        var byIndexFlavor = {
          '0': '51885256638749',
          '1': '51885256573213',
          '2': '51885256442141'
        };
        if (byHandle[handle]) variant = byHandle[handle];
        else if (
          swatch.classList.contains('is-berry') ||
          swatch.classList.contains('is-cherry') ||
          swatch.classList.contains('is-citrus')
        ) {
          variant = byIndexFlavor[swatch.getAttribute('data-swatch')] || '';
        } else {
          variant = byIndexBottle[swatch.getAttribute('data-swatch')] || '';
        }
      }
      if (!variant) return;
      var atc =
        hero.querySelector('.pdp-buybox .pdp-add-btn[data-fizz-atc]') ||
        hero.querySelector('.pdp-add-btn[data-fizz-atc]');
      if (!atc) return;
      atc.setAttribute('data-fizz-variant', variant);
      atc.setAttribute('data-fizz-atc', 'true');
      if ((atc.getAttribute('href') || '').indexOf('myshopify.com') !== -1) {
        atc.setAttribute('href', '#');
      }
    }

    function applySwatch(swatch) {
      var i = parseInt(swatch.getAttribute('data-swatch'), 10);
      if (isNaN(i)) return;
      swatches.forEach(function (s) {
        s.classList.toggle('is-active', s === swatch);
      });
      setIndex(i);
      syncAtcVariant(swatch);
    }

    thumbs.forEach(function (thumb) {
      thumb.style.cursor = 'pointer';
      thumb.style.pointerEvents = 'auto';
    });

    swatches.forEach(function (swatch) {
      swatch.style.cursor = 'pointer';
      swatch.style.pointerEvents = 'auto';
      swatch.setAttribute('role', 'button');
      swatch.setAttribute('tabindex', '0');
      swatch.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          applySwatch(swatch);
        }
      });
    });

    if (nav.prev) {
      nav.prev.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        setIndex(index - 1);
      });
    }
    if (nav.next) {
      nav.next.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        setIndex(index + 1);
      });
    }

    hero.addEventListener(
      'click',
      function (e) {
        var t = e.target instanceof Element ? e.target : null;
        if (!t) return;
        if (t.closest('[data-gallery-prev], [data-gallery-next]')) return;
        var swatch = t.closest('[data-swatch]');
        if (swatch && hero.contains(swatch)) {
          e.preventDefault();
          e.stopPropagation();
          applySwatch(swatch);
          return;
        }
        var thumb = t.closest('[data-slide-index]');
        if (thumb && hero.contains(thumb)) {
          var i = parseInt(thumb.getAttribute('data-slide-index'), 10);
          if (!isNaN(i)) {
            e.preventDefault();
            e.stopPropagation();
            setIndex(i);
          }
        }
      },
      true
    );

    /* Pointer swipe / drag on the photo stage */
    if (stage) {
      var pointerId = null;
      var startX = 0;
      var startY = 0;
      var tracking = false;
      var locked = null; /* 'h' | 'v' | null */

      function isInteractiveTarget(el) {
        if (!(el instanceof Element)) return false;
        return !!el.closest(
          '[data-gallery-prev], [data-gallery-next], [data-slide-index], [data-swatch], a, button, input, label'
        );
      }

      stage.addEventListener('pointerdown', function (e) {
        if (e.button != null && e.button !== 0) return;
        if (isInteractiveTarget(e.target) && !e.target.closest('[data-gallery-rail], .pdp-gallery-slide')) {
          if (e.target.closest('[data-gallery-prev], [data-gallery-next]')) return;
        }
        if (e.target.closest('[data-gallery-prev], [data-gallery-next]')) return;
        pointerId = e.pointerId;
        startX = e.clientX;
        startY = e.clientY;
        tracking = true;
        locked = null;
        try {
          stage.setPointerCapture(e.pointerId);
        } catch (_) {}
      });

      stage.addEventListener('pointermove', function (e) {
        if (!tracking || e.pointerId !== pointerId) return;
        var dx = e.clientX - startX;
        var dy = e.clientY - startY;
        if (!locked) {
          if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
          locked = Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v';
        }
        if (locked === 'h') {
          e.preventDefault();
        }
      });

      function endPointer(e) {
        if (!tracking || e.pointerId !== pointerId) return;
        var dx = e.clientX - startX;
        var dy = e.clientY - startY;
        tracking = false;
        pointerId = null;
        try {
          stage.releasePointerCapture(e.pointerId);
        } catch (_) {}
        if (locked === 'v') return;
        if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
        if (dx < 0) setIndex(index + 1);
        else setIndex(index - 1);
      }

      stage.addEventListener('pointerup', endPointer);
      stage.addEventListener('pointercancel', function (e) {
        if (e.pointerId !== pointerId) return;
        tracking = false;
        pointerId = null;
        locked = null;
      });
    }

    /* Keyboard: Left / Right when focus is within the gallery */
    var gallery = hero.querySelector('.pdp-gallery') || hero;
    gallery.setAttribute('tabindex', '0');
    gallery.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setIndex(index - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setIndex(index + 1);
      }
    });

    setIndex(0);
    if (swatches[0]) {
      swatches[0].classList.add('is-active');
      syncAtcVariant(swatches[0]);
    }

    // ?color=black (e.g. from the homepage Find Your Color cards) preselects that colourway.
    var wanted = (new URLSearchParams(location.search).get('color') || '').toLowerCase();
    var preset = wanted && swatches.filter(function (s) {
      return (s.getAttribute('aria-label') || '').toLowerCase() === wanted;
    })[0];
    if (preset) setTimeout(function () { preset.click(); }, 0);
  });
})();
