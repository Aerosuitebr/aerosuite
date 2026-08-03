/**
 * WPForms #12 — honeypot, erros visíveis e falhas AJAX (Aero Suite)
 */
(function () {
  'use strict';

  var FORM_SELECTOR = '#wpforms-form-12';

  function clearHoneypot(form) {
    if (!form) return;
    var trap = form.querySelector('[data-field-id="3"] input, #wpforms-12-field_3');
    if (!trap) return;
    trap.value = '';
    trap.setAttribute('autocomplete', 'off');
    trap.setAttribute('tabindex', '-1');
    trap.setAttribute('aria-hidden', 'true');
  }

  function clearNativeValidity(form) {
    if (!form) return;
    form.querySelectorAll('input, textarea, select').forEach(function (el) {
      if (typeof el.setCustomValidity === 'function') {
        el.setCustomValidity('');
      }
    });
  }

  function scrollToFirstError(form) {
    if (!form) return;
    var target =
      form.querySelector('.wpforms-error-container') ||
      form.querySelector('.wpforms-field.wpforms-has-error') ||
      form.querySelector('em.wpforms-error') ||
      form.querySelector(':invalid');
    if (target && target.scrollIntoView) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function showSubmitHint(form, message) {
    if (!form) return;
    var box = form.querySelector('.as-wpforms-submit-hint');
    if (!box) {
      box = document.createElement('p');
      box.className = 'as-wpforms-submit-hint wpforms-error';
      box.setAttribute('role', 'alert');
      var container = form.querySelector('.wpforms-submit-container');
      if (container) {
        container.parentNode.insertBefore(box, container);
      } else {
        form.appendChild(box);
      }
    }
    box.textContent = message;
    box.style.display = 'block';
    scrollToFirstError(form);
  }

  function attachForm(form) {
    if (!form || form.getAttribute('data-as-wpforms-fix') === '1') return;
    form.setAttribute('data-as-wpforms-fix', '1');
    clearHoneypot(form);

    form.addEventListener(
      'submit',
      function () {
        clearHoneypot(form);
        clearNativeValidity(form);
      },
      true
    );

    form.querySelectorAll('input, textarea').forEach(function (inp) {
      inp.addEventListener('invalid', function () {
        scrollToFirstError(form);
      });
    });
  }

  function scan() {
    document.querySelectorAll(FORM_SELECTOR).forEach(attachForm);
  }

  function pickMessage(value) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value.message) return String(value.message);
    return '';
  }

  function onAjaxFailed(detail) {
    var form = document.querySelector(FORM_SELECTOR);
    var status = detail && detail.status;
    var msg =
      pickMessage(detail && detail.error) ||
      pickMessage(detail && detail.data && detail.data.message) ||
      (status >= 500
        ? 'Erro no servidor ao enviar. Use Agendar demonstração (Calendly) ou WhatsApp enquanto corrigimos — ou atualize a página (F5) e tente de novo.'
        : 'Não foi possível enviar. Atualize a página (F5) e tente de novo.');
    if (form) {
      showSubmitHint(form, msg);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scan);
  } else {
    scan();
  }
  document.addEventListener('wpformsReady', scan);

  document.addEventListener('wpformsAjaxSubmitFailed', function (ev) {
    onAjaxFailed(ev.detail || {});
  });

  document.addEventListener('wpformsAjaxSubmitError', function (ev) {
    onAjaxFailed(ev.detail || {});
  });

  if (typeof window.jQuery === 'function') {
    window.jQuery(document).on('wpformsAjaxSubmitFailed', function (_ev, detail) {
      onAjaxFailed(detail || {});
    });
    window.jQuery(document).on('wpformsAjaxSubmitError', function (_ev, detail) {
      onAjaxFailed(detail || {});
    });
  }
})();
