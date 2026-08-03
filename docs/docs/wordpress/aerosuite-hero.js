/**
 * Aero Suite — hero carousel, scroll reveal e contadores animados.
 */
(function () {
  'use strict';

  /* ── Hero preview carousel ── */
  function initHeroPreview(root) {
    if (!root || root.dataset.asHeroInit === '1') return;
    root.dataset.asHeroInit = '1';

    const slides = root.querySelectorAll('.as-hero-slide');
    const caption = root.querySelector('[data-as-hero-caption]');
    const progressBar = root.querySelector('.as-hero-device__status-progress span');
    if (!slides.length) return;

    let index = 0;
    let timer = null;
    const interval = 4500;

    function show(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach(function (s, j) {
        s.classList.toggle('is-active', j === index);
      });
      if (caption && slides[index]) {
        caption.textContent = slides[index].getAttribute('data-label') || '';
      }
      if (progressBar) {
        progressBar.style.width = ((index + 1) / slides.length) * 100 + '%';
      }
    }

    function next() {
      show(index + 1);
    }

    function start() {
      stop();
      timer = setInterval(next, interval);
    }

    function stop() {
      if (timer) clearInterval(timer);
    }

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', start);

    show(0);
    if (document.readyState === 'complete') {
      start();
    } else {
      window.addEventListener('load', start, { once: true });
    }
  }

  /* ── Scroll reveal ── */
  function revealHashTargets() {
    var hash = window.location.hash;
    if (!hash || hash.length < 2) return;
    var target = document.getElementById(hash.slice(1));
    if (!target) return;
    target.classList.add('is-visible');
    target.setAttribute('data-as-revealed', '1');
    target.querySelectorAll('.as-reveal').forEach(function (el) {
      el.classList.add('is-visible');
      el.setAttribute('data-as-revealed', '1');
    });
  }

  function initReveal() {
    var els = document.querySelectorAll('.as-reveal:not([data-as-revealed])');
    if (!els.length) return;

    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) {
        el.classList.add('is-visible');
      });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            entry.target.setAttribute('data-as-revealed', '1');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    els.forEach(function (el) {
      io.observe(el);
    });
  }

  /* ── Animated counters ── */
  function initCounters() {
    var items = document.querySelectorAll('[data-as-count]');
    if (!items.length) return;

    function animate(el) {
      if (el.dataset.asCounted === '1') return;
      el.dataset.asCounted = '1';
      var target = parseInt(el.getAttribute('data-as-count'), 10) || 0;
      var start = 0;
      var duration = 1200;
      var t0 = performance.now();

      function frame(now) {
        var p = Math.min((now - t0) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(start + (target - start) * eased);
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    if (!('IntersectionObserver' in window)) {
      items.forEach(animate);
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animate(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    items.forEach(function (el) {
      io.observe(el);
    });
  }

  var bootDone = false;

  function boot() {
    if (bootDone) return;
    bootDone = true;
    document.querySelectorAll('[data-as-hero-preview]').forEach(initHeroPreview);
    revealHashTargets();
    initReveal();
    initCounters();
  }

  function scheduleBoot() {
    if (bootDone) return;
    if (window.requestIdleCallback) {
      window.requestIdleCallback(boot, { timeout: 2500 });
    } else {
      window.setTimeout(boot, 0);
    }
  }

  if (document.readyState === 'complete') {
    scheduleBoot();
  } else {
    window.addEventListener('load', scheduleBoot, { once: true });
  }
  new MutationObserver(function () {
    if (!bootDone) scheduleBoot();
  }).observe(document.body, { childList: true, subtree: true });
})();
