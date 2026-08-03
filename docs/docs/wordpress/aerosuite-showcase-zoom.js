/**
 * Zoom: hover no card + lightbox ao clicar nas capturas do showcase.
 * Tabs: sincroniza faixa KPI com o módulo ativo.
 */
(function () {
  'use strict';

  function bind(img) {
    if (!img || img.dataset.asZoomBound === '1') return;
    img.dataset.asZoomBound = '1';
    img.setAttribute('tabindex', '0');
    img.style.cursor = 'zoom-in';

    function open() {
      const lb = document.createElement('div');
      lb.className = 'as-shot-lightbox';
      lb.setAttribute('role', 'dialog');
      lb.setAttribute('aria-modal', 'true');
      const full = document.createElement('img');
      full.src = img.currentSrc || img.src;
      full.alt = img.alt || '';
      lb.appendChild(full);
      function close() {
        lb.remove();
        document.removeEventListener('keydown', onKey);
      }
      function onKey(e) {
        if (e.key === 'Escape') close();
      }
      lb.addEventListener('click', close);
      document.addEventListener('keydown', onKey);
      document.body.appendChild(lb);
    }

    img.addEventListener('click', open);
    img.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });
  }

  function activateShowcaseTab(index) {
    const root = document.querySelector('.as-showcase');
    if (!root) return;
    const tabs = root.querySelectorAll('[data-as-showcase-index][role="tab"]');
    const panels = root.querySelectorAll('[data-as-showcase-index][role="tabpanel"]');
    if (!tabs.length || !panels.length) return;

    tabs.forEach(function (tab) {
      const i = Number(tab.getAttribute('data-as-showcase-index'));
      const active = i === index;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    panels.forEach(function (panel) {
      const i = Number(panel.getAttribute('data-as-showcase-index'));
      const active = i === index;
      panel.classList.toggle('is-active', active);
      if (active) panel.removeAttribute('hidden');
      else panel.setAttribute('hidden', '');
    });
  }

  function initShowcaseTabs() {
    const root = document.querySelector('.as-showcase');
    if (!root || root.dataset.asShowcaseTabsInit === '1') return;
    root.dataset.asShowcaseTabsInit = '1';

    root.querySelectorAll('[data-as-showcase-index][role="tab"]').forEach(function (tab) {
      tab.addEventListener('click', function () {
        activateShowcaseTab(Number(tab.getAttribute('data-as-showcase-index')));
      });
    });

    activateShowcaseTab(0);
  }

  function scan() {
    document.querySelectorAll('.as-ui-shot img').forEach(bind);
    initShowcaseTabs();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scan);
  } else {
    scan();
  }
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
})();
