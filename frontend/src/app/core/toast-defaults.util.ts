/** Auto-dismiss padrão para toasts PrimeNG (homolog F10). */
export type ToastSeverity = 'success' | 'info' | 'warn' | 'error' | 'secondary' | 'contrast' | string | undefined;

export function defaultToastLife(severity?: ToastSeverity): number {
  switch (severity) {
    case 'error':
      return 8000;
    case 'warn':
      return 5000;
    default:
      return 4000;
  }
}
