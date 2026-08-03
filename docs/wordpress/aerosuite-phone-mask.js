/**
 * Máscara telefone BR — WPForms (Aero Suite)
 * Campos: input com name*="telefone" ou placeholder com (00)
 */
(function () {
  'use strict';

  function digits(v) {
    return String(v || '').replace(/\D/g, '').slice(0, 11);
  }

  function formatBR(d) {
    if (!d) return '';
    if (d.length <= 2) return '(' + d;
    if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length <= 10) {
      return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    }
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7, 11);
  }

  function bind(input) {
    if (!input || input.dataset.asPhoneMask === '1') return;
    input.dataset.asPhoneMask = '1';
    input.setAttribute('inputmode', 'tel');
    input.setAttribute('autocomplete', 'tel');

    input.addEventListener('input', function () {
      const d = digits(input.value);
      const formatted = formatBR(d);
      if (input.value !== formatted) input.value = formatted;
    });

    input.addEventListener('blur', function () {
      const d = digits(input.value);
      if (d.length > 0 && d.length < 10) {
        input.setAttribute('aria-invalid', 'true');
        input.dataset.asPhoneInvalid = '1';
      } else {
        input.removeAttribute('aria-invalid');
        delete input.dataset.asPhoneInvalid;
      }
    });
  }

  function scan() {
    document.querySelectorAll('.wpforms-form input[type="text"], .wpforms-form input[type="tel"]').forEach(function (el) {
      const name = (el.getAttribute('name') || '').toLowerCase();
      const label = (el.getAttribute('aria-label') || '').toLowerCase();
      const ph = (el.getAttribute('placeholder') || '').toLowerCase();
      const id = (el.id || '').toLowerCase();
      if (
        name.includes('telefone') ||
        label.includes('telefone') ||
        ph.includes('00000') ||
        id.includes('telefone') ||
        id.includes('field_7') ||
        name.includes('fields][7]')
      ) {
        bind(el);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scan);
  } else {
    scan();
  }
  document.addEventListener('wpformsReady', scan);
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
})();
