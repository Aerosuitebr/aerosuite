import { TranslationService } from '../core/translation.service';

export const OPS_CONFIRM_REJECT_CLASS = 'ops-confirm-reject';
export const OPS_CONFIRM_ACCEPT_CLASS = 'ops-confirm-accept';
export const OPS_CONFIRM_ACCEPT_DANGER_CLASS = 'ops-confirm-accept-danger';

const NAME_PLACEHOLDER = '{{__OPS_CONFIRM_NAME__}}';
const EMAIL_PLACEHOLDER = '{{__OPS_CONFIRM_EMAIL__}}';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapHighlight(value: string): string {
  return `<span class="ops-confirm-highlight">${escapeHtml(value)}</span>`;
}

/** Mensagem de confirmação com nome e e-mail destacados em Cyber Blue. */
export function formatOpsConfirmMessage(
  i18n: TranslationService,
  messageKey: string,
  params: { name: string; email: string }
): string {
  const raw = i18n.translate(messageKey, {
    name: NAME_PLACEHOLDER,
    email: EMAIL_PLACEHOLDER
  });
  return raw
    .replace(NAME_PLACEHOLDER, wrapHighlight(params.name))
    .replace(EMAIL_PLACEHOLDER, wrapHighlight(params.email));
}
