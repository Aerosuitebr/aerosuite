/**
 * Aero Suite — GA4, eventos de conversão e widget Calendly.
 * Config: window.AEROSUITE_SITE { ga4, calendly }
 */
(function () {
  'use strict';

  var cfg = window.AEROSUITE_SITE || {};
  var GA_ID = cfg.ga4 || '';
  var CALENDLY = cfg.calendly || '';
  var WA_PHONE = cfg.whatsappPhone || '';
  var WA_TEXT = cfg.whatsappText || '';

  function isPlaceholder(id) {
    return !id || /X{4,}|PLACEHOLDER/i.test(id) || !/^G-[A-Z0-9]+$/i.test(String(id));
  }

  function isCalendlyUrl(url) {
    if (!url || !/^https:\/\/calendly\.com\/.+/i.test(url) || url.length < 29) return false;
    if (/X{4,}/i.test(url)) return false;
    if (/calendly\.com\/aerosuite\/demo-aero-suite/i.test(url)) return false;
    return true;
  }

  var ga4Started = false;

  function hasAnalyticsConsent() {
    if (typeof window.AEROSUITE_GET_CONSENT !== 'function') return true;
    var c = window.AEROSUITE_GET_CONSENT();
    if (!c) return false;
    return c.level === 'all';
  }

  function initGa4() {
    if (ga4Started) return;
    if (isPlaceholder(GA_ID)) return;
    if (!hasAnalyticsConsent()) return;
    ga4Started = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_ID, { anonymize_ip: true, send_page_view: true });
  }

  var prevConsentCb = window.AEROSUITE_ON_CONSENT;
  window.AEROSUITE_ON_CONSENT = function (level) {
    if (level === 'all') initGa4();
    if (typeof prevConsentCb === 'function') prevConsentCb(level);
  };

  initGa4();

  function track(eventName, params) {
    if (typeof window.gtag !== 'function') return;
    if (isPlaceholder(GA_ID)) return;
    window.gtag('event', eventName, params || {});
  }

  function utmFromLocation() {
    var q = new URLSearchParams(window.location.search);
    var keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    var out = {};
    keys.forEach(function (k) {
      var v = q.get(k);
      if (v) out[k] = v;
    });
    return out;
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-as-event]');
    if (!el) return;
    var payload = {
      event_category: 'conversion',
      event_label: el.getAttribute('data-as-location') || '',
      link_url: el.getAttribute('href') || '',
    };
    var utm = utmFromLocation();
    Object.keys(utm).forEach(function (k) {
      payload[k] = utm[k];
    });
    track(el.getAttribute('data-as-event'), payload);
  });

  /* ── WhatsApp — abre chat direto (Web no desktop, app no mobile) ── */
  function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(
      navigator.userAgent
    );
  }

  function parseWhatsAppLink(href) {
    if (!href) return null;
    try {
      var u = new URL(href, window.location.href);
      var phone = u.searchParams.get('phone') || '';
      if (!phone) {
        var pathMatch = u.pathname.match(/\/(\d{10,15})(?:\/|$|\?)/);
        if (pathMatch) phone = pathMatch[1];
      }
      phone = String(phone).replace(/\D/g, '');
      if (!phone) return null;
      return {
        phone: phone,
        text: u.searchParams.get('text') || '',
      };
    } catch (err) {
      return null;
    }
  }

  function buildWhatsAppUrl(phone, text) {
    var q = 'phone=' + encodeURIComponent(phone);
    if (text) q += '&text=' + encodeURIComponent(text);
    if (isMobileDevice()) {
      var mobile = 'https://wa.me/' + phone;
      if (text) mobile += '?text=' + encodeURIComponent(text);
      return mobile;
    }
    return 'https://web.whatsapp.com/send?' + q;
  }

  function openWhatsAppChat(fallbackHref) {
    var parsed = parseWhatsAppLink(fallbackHref);
    var phone = WA_PHONE || (parsed ? parsed.phone : '');
    var text = WA_TEXT || (parsed ? parsed.text : '');
    if (!phone) return false;
    var url = buildWhatsAppUrl(phone, text);
    window.open(url, '_blank', 'noopener,noreferrer');
    track('whatsapp_open', {
      event_category: 'conversion',
      event_label: isMobileDevice() ? 'mobile' : 'desktop',
      link_url: url,
    });
    return true;
  }

  document.addEventListener('click', function (e) {
    var wa = e.target.closest('a.as-track-whatsapp');
    if (!wa) return;
    e.preventDefault();
    openWhatsAppChat(wa.getAttribute('href') || '');
  });

  /* ── Calendly ── */
  var calendlyLoadCallbacks = [];

  function runCalendlyLoadCallbacks() {
    calendlyLoadCallbacks.splice(0).forEach(function (cb) {
      cb();
    });
  }

  function ensureCalendlyCss() {
    if (document.querySelector('link[href*="calendly.com/assets/external/widget.css"]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://assets.calendly.com/assets/external/widget.css';
    document.head.appendChild(l);
  }

  function ensureCalendlyScript(onReady) {
    if (!isCalendlyUrl(CALENDLY)) return false;
    if (typeof onReady === 'function') calendlyLoadCallbacks.push(onReady);
    ensureCalendlyCss();
    if (window.Calendly) {
      runCalendlyLoadCallbacks();
      return true;
    }
    var existing = document.querySelector('script[src*="calendly.com"]');
    if (existing) {
      if (existing.getAttribute('data-as-loaded') === '1' || window.Calendly) {
        runCalendlyLoadCallbacks();
        return true;
      }
      existing.addEventListener('load', function () {
        existing.setAttribute('data-as-loaded', '1');
        runCalendlyLoadCallbacks();
      });
      var attempts = 0;
      var poll = window.setInterval(function () {
        if (window.Calendly) {
          window.clearInterval(poll);
          existing.setAttribute('data-as-loaded', '1');
          runCalendlyLoadCallbacks();
        } else if (++attempts > 100) {
          window.clearInterval(poll);
        }
      }, 100);
      return true;
    }
    var c = document.createElement('script');
    c.src = 'https://assets.calendly.com/assets/external/widget.js';
    c.async = true;
    document.body.appendChild(c);
    c.addEventListener('load', function () {
      c.setAttribute('data-as-loaded', '1');
      track('calendly_widget_loaded', { event_category: 'engagement' });
      runCalendlyLoadCallbacks();
    });
    return true;
  }

  function initInlineCalendly() {
    var widgets = document.querySelectorAll('.calendly-inline-widget[data-as-calendly-url]');
    if (!widgets.length) return;
    var url = CALENDLY || widgets[0].getAttribute('data-as-calendly-url');
    if (!isCalendlyUrl(url)) return;
    widgets.forEach(function (w) {
      w.setAttribute('data-url', url);
    });

    function mountWidgets() {
      ensureCalendlyScript(function () {
        if (!window.Calendly || !window.Calendly.initInlineWidget) return;
        widgets.forEach(function (w) {
          if (w.querySelector('iframe')) return;
          window.Calendly.initInlineWidget({
            url: w.getAttribute('data-url') || url,
            parentElement: w,
          });
        });
      });
    }

    if (!('IntersectionObserver' in window)) {
      mountWidgets();
      return;
    }

    var booted = false;
    var io = new IntersectionObserver(
      function (entries) {
        if (booted) return;
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) {
            booted = true;
            io.disconnect();
            mountWidgets();
            break;
          }
        }
      },
      { rootMargin: '240px 0px' }
    );
    widgets.forEach(function (w) {
      io.observe(w);
    });
  }

  function openCalendlyPopup(fallbackHref) {
    if (!isCalendlyUrl(CALENDLY)) {
      if (fallbackHref) window.location.href = fallbackHref;
      return false;
    }

    var opened = false;
    var fallbackTimer = window.setTimeout(function () {
      if (!opened) {
        if (fallbackHref) window.location.href = fallbackHref;
      }
    }, 2500);

    ensureCalendlyScript(function () {
      if (!window.Calendly || !window.Calendly.initPopupWidget) {
        window.clearTimeout(fallbackTimer);
        if (fallbackHref) window.location.href = fallbackHref;
        return;
      }
      window.Calendly.initPopupWidget({ url: CALENDLY });
      opened = true;
      window.clearTimeout(fallbackTimer);
      track('calendly_popup_open', { event_category: 'conversion' });
    });

    return true;
  }

  document.addEventListener('click', function (e) {
    var demo = e.target.closest('.as-track-demo');
    if (!demo || !isCalendlyUrl(CALENDLY)) return;
    var href = demo.getAttribute('href') || '';
    e.preventDefault();
    openCalendlyPopup(href);
  });

  function initCalendly() {
    if (!isCalendlyUrl(CALENDLY)) return;
    initInlineCalendly();
  }

  function mergeUtm(base) {
    var out = base || {};
    var utm = utmFromLocation();
    Object.keys(utm).forEach(function (k) {
      out[k] = utm[k];
    });
    return out;
  }

  function trackConversion(eventName, extra) {
    var label = '';
    if (extra) {
      if (extra.event_label) label = extra.event_label;
    }
    var payload = mergeUtm({
      event_category: 'conversion',
      event_label: label,
    });
    if (extra) {
      Object.keys(extra).forEach(function (k) {
        if (k !== 'event_label') payload[k] = extra[k];
      });
    }
    track(eventName, payload);
  }

  function trackGenerateLead(leadType, extra) {
    var payload = mergeUtm({
      event_category: 'conversion',
      lead_type: leadType,
    });
    if (extra) {
      Object.keys(extra).forEach(function (k) {
        payload[k] = extra[k];
      });
    }
    track('generate_lead', payload);
  }

  /* ── WPForms: envio com sucesso ── */
  function onWpformsSuccess(ev) {
    var detail = ev.detail || {};
    var formId = detail.formId != null ? String(detail.formId) : '';
    var loc = 'wpforms';
    if (detail.formElement) {
      if (detail.formElement.id) loc = detail.formElement.id;
    }
    trackConversion('form_submit', {
      event_label: loc,
      form_id: formId,
      form_provider: 'wpforms',
    });
    trackGenerateLead('form', { form_id: formId, form_provider: 'wpforms' });
    var thank = cfg.thankYouUrl || '';
    if (thank) {
      try {
        sessionStorage.setItem('aerosuite_lead_type', 'form');
      } catch (err) {
        /* ignore */
      }
      window.location.href = thank;
    }
  }

  document.addEventListener('wpformsFormSubmitSuccess', onWpformsSuccess);

  /* Fallback jQuery (WPForms legado) */
  if (typeof window.jQuery === 'function') {
    window.jQuery(document).on('wpformsFormSubmitSuccess', function (_ev, detail) {
      onWpformsSuccess({ detail: detail || {} });
    });
  }

  /* ── Calendly: reunião agendada ── */
  function onCalendlyMessage(ev) {
    if (!ev || !ev.data) return;
    var origin = ev.origin || '';
    if (origin.indexOf('calendly.com') === -1) return;
    var data = ev.data;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (err) {
        return;
      }
    }
    if (!data || data.event !== 'calendly.event_scheduled') return;
    var invitee = data.payload || {};
    var eventUri = '';
    if (invitee.event) {
      if (invitee.event.uri) eventUri = invitee.event.uri;
    }
    trackConversion('calendly_event_scheduled', {
      event_label: 'inline_or_popup',
      calendly_event_uri: eventUri,
    });
    trackGenerateLead('calendly', { event_label: 'calendly_event_scheduled' });
    var thankCal = cfg.thankYouUrl || '';
    if (thankCal) {
      try {
        sessionStorage.setItem('aerosuite_lead_type', 'calendly');
      } catch (err2) {
        /* ignore */
      }
      window.setTimeout(function () {
        window.location.href = thankCal;
      }, 1500);
    }
  }

  window.addEventListener('message', onCalendlyMessage);

  function initThankYouPage() {
    var path = window.location.pathname || '';
    if (path.indexOf('/obrigado') === -1) return;
    var lead = 'direct';
    try {
      var stored = sessionStorage.getItem('aerosuite_lead_type');
      if (stored) {
        lead = stored;
        sessionStorage.removeItem('aerosuite_lead_type');
      }
    } catch (err3) {
      /* ignore */
    }
    if (lead === 'direct') {
      var q = new URLSearchParams(window.location.search);
      var legacy = q.get('lead');
      if (legacy) lead = legacy;
    }
    document.querySelectorAll('[data-as-thank-hint]').forEach(function (el) {
      var match = el.getAttribute('data-as-thank-hint') === lead;
      if (match) el.classList.add('is-visible');
      else el.setAttribute('hidden', '');
    });
    trackConversion('thank_you_view', { lead_type: lead, event_label: 'obrigado' });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initCalendly();
      initThankYouPage();
    });
  } else {
    initCalendly();
    initThankYouPage();
  }

  window.AEROSUITE_TRACK = track;
  window.AEROSUITE_OPEN_DEMO = openCalendlyPopup;
  window.AEROSUITE_OPEN_WHATSAPP = openWhatsAppChat;
})();
