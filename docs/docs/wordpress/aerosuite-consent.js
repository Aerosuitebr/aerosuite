/**
 * Banner LGPD — analytics (GA4) e marketing (pixels) só após consentimento.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'as_consent_v1';
  var cfg = window.AEROSUITE_SITE || {};

  function readConsent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      return null;
    }
  }

  function saveConsent(level) {
    var payload = { level: level, at: new Date().toISOString() };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      /* ignore */
    }
    document.documentElement.setAttribute('data-as-consent', level);
    if (typeof window.AEROSUITE_ON_CONSENT === 'function') {
      window.AEROSUITE_ON_CONSENT(level);
    }
    var banner = document.getElementById('as-consent-banner');
    if (banner) banner.setAttribute('hidden', '');
  }

  function ensureBanner() {
    if (readConsent()) return;
    if (document.getElementById('as-consent-banner')) return;

    var priv = cfg.privacyUrl || '/politica-de-privacidade/';
    var el = document.createElement('div');
    el.id = 'as-consent-banner';
    el.className = 'as-consent-banner';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Preferências de cookies');
    el.innerHTML =
      '<div class="as-consent-banner__inner">' +
      '<p><strong>Cookies e privacidade</strong> Usamos cookies essenciais e, com seu consentimento, analytics e campanhas para melhorar o site. <a href="' +
      priv +
      '">Política de privacidade</a>.</p>' +
      '<div class="as-consent-banner__actions">' +
      '<button type="button" class="as-btn as-btn--ghost" data-as-consent="essential">Somente essenciais</button>' +
      '<button type="button" class="as-btn as-btn--gold" data-as-consent="all">Aceitar todos</button>' +
      '</div></div>';
    document.body.appendChild(el);

    el.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-as-consent]');
      if (!btn) return;
      var level = btn.getAttribute('data-as-consent');
      saveConsent(level === 'all' ? 'all' : 'essential');
    });
  }

  var existing = readConsent();
  if (existing) {
    document.documentElement.setAttribute('data-as-consent', existing.level || 'essential');
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureBanner);
  } else {
    ensureBanner();
  }

  window.AEROSUITE_GET_CONSENT = readConsent;
  window.AEROSUITE_SAVE_CONSENT = saveConsent;
})();
