/**
 * Barra fixa de conversão — apenas mobile, após rolar a página.
 */
(function () {
  'use strict';

  var cfg = window.AEROSUITE_SITE || {};
  var demoUrl = cfg.contatoAgendar || '/contato/#agendar-demo';
  var shown = false;

  function isMobile() {
    return window.matchMedia('(max-width: 768px)').matches;
  }

  function ensureBar() {
    if (!isMobile()) return;
    if (document.getElementById('as-sticky-cta')) return;

    var bar = document.createElement('div');
    bar.id = 'as-sticky-cta';
    bar.className = 'as-sticky-cta';
    bar.setAttribute('aria-hidden', 'true');
    bar.innerHTML =
      '<a class="as-sticky-cta__btn as-track-demo" href="' +
      demoUrl +
      '" data-as-event="cta_demo" data-as-location="sticky_mobile">Agendar demo</a>' +
      '<button type="button" class="as-sticky-cta__close" aria-label="Fechar barra">×</button>';
    document.body.appendChild(bar);

    bar.querySelector('.as-sticky-cta__close').addEventListener('click', function () {
      bar.setAttribute('hidden', '');
      try {
        sessionStorage.setItem('as_sticky_cta_dismissed', '1');
      } catch (err) {
        /* ignore */
      }
    });
  }

  function onScroll() {
    if (!isMobile()) return;
    try {
      if (sessionStorage.getItem('as_sticky_cta_dismissed') === '1') return;
    } catch (err) {
      /* ignore */
    }
    var bar = document.getElementById('as-sticky-cta');
    if (!bar) return;
    if (window.scrollY < 400) {
      bar.setAttribute('hidden', '');
      return;
    }
    if (!shown) {
      shown = true;
      bar.removeAttribute('hidden');
      bar.setAttribute('aria-hidden', 'false');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      ensureBar();
      onScroll();
    });
  } else {
    ensureBar();
    onScroll();
  }
  window.addEventListener('scroll', onScroll, { passive: true });
})();
