/**
 * Meta Pixel e LinkedIn Insight — carregam só com consentimento "all".
 */
(function () {
  'use strict';

  var cfg = window.AEROSUITE_SITE || {};

  function hasMarketingConsent() {
    if (typeof window.AEROSUITE_GET_CONSENT !== 'function') return false;
    var c = window.AEROSUITE_GET_CONSENT();
    if (!c) return false;
    return c.level === 'all';
  }

  function loadMetaPixel(pixelId) {
    if (!pixelId || !/^\d{8,20}$/.test(String(pixelId))) return;
    if (window.fbq) return;
    var n = (window.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    });
    if (!window._fbq) window._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    var t = document.createElement('script');
    t.async = true;
    t.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(t);
    window.fbq('init', pixelId);
    window.fbq('track', 'PageView');
  }

  function loadLinkedIn(partnerId) {
    if (!partnerId || !/^\d{5,10}$/.test(String(partnerId))) return;
    if (window._linkedin_data_partner_ids) return;
    window._linkedin_data_partner_ids = [partnerId];
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://snap.licdn.com/li.lms-analytics/insight.min.js';
    document.head.appendChild(s);
  }

  function maybeLoad() {
    if (!hasMarketingConsent()) return;
    if (cfg.metaPixel) loadMetaPixel(cfg.metaPixel);
    if (cfg.linkedInPartner) loadLinkedIn(cfg.linkedInPartner);
  }

  window.AEROSUITE_ON_CONSENT = function (level) {
    if (level === 'all') maybeLoad();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', maybeLoad);
  } else {
    maybeLoad();
  }
})();
