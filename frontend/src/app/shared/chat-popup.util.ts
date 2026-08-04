export interface ChatPopupScreen {
  availWidth: number;
  availHeight: number;
  availLeft?: number;
  availTop?: number;
}

/** Mantém o chat inteiramente dentro da área útil, inclusive em notebooks. */
export function buildChatPopupFeatures(screen: ChatPopupScreen): string {
  const width = Math.min(900, Math.max(320, screen.availWidth - 24));
  const height = Math.min(700, Math.max(480, screen.availHeight - 24));
  const left = (screen.availLeft ?? 0) + Math.max(0, Math.round((screen.availWidth - width) / 2));
  const top = (screen.availTop ?? 0) + Math.max(0, Math.round((screen.availHeight - height) / 2));

  return [
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
    'resizable=yes',
    'scrollbars=yes',
    'status=no',
    'toolbar=no',
    'menubar=no',
    'location=no'
  ].join(',');
}
