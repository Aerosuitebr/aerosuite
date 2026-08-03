import type { Confirmation } from 'primeng/api';

/** Aceitar ação destrutiva: vermelho sólido (exclusão irreversível). */
export const CONFIRM_DESTRUCTIVE_ACCEPT_CLASS = 'p-button-danger as-confirm-destructive-accept';

/** Rejeitar / cancelar: neutro secundário (não compete com a ação destrutiva). */
export const CONFIRM_SAFE_REJECT_CLASS = 'p-button-outlined as-confirm-safe-reject';

/** Opções padrão para exclusão permanente (Sim/Não localizados + UX destrutiva). */
export function destructiveDeleteConfirm(
  message: string,
  accept: () => void,
  header = 'confirm.header.delete'
): Confirmation {
  return {
    message,
    header,
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'common.confirm.yes',
    rejectLabel: 'common.confirm.noShort',
    acceptIcon: 'pi pi-check',
    acceptButtonStyleClass: CONFIRM_DESTRUCTIVE_ACCEPT_CLASS,
    rejectButtonStyleClass: CONFIRM_SAFE_REJECT_CLASS,
    accept
  };
}
