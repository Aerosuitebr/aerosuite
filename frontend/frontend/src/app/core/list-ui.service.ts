import { Injectable } from '@angular/core';
import { DEFAULT_LIST_PAGE_SIZE, LIST_ROWS_PER_PAGE_OPTIONS } from './list-pagination.constants';

export { DEFAULT_LIST_PAGE_SIZE, LIST_ROWS_PER_PAGE_OPTIONS };

/**
 * Padrão de listagens Aero Suite:
 * - Scroll vertical no `.main-content` (página rola; paginador sempre visível no fluxo).
 * - Constantes de paginação compartilhadas entre listas.
 */
@Injectable({ providedIn: 'root' })
export class ListUiService {
  readonly defaultPageSize = DEFAULT_LIST_PAGE_SIZE;
  readonly rowsPerPageOptions = LIST_ROWS_PER_PAGE_OPTIONS;

  /** @deprecated Listagens usam page scroll; mantido por compatibilidade. */
  useDatatableFlexScroll(): boolean {
    return false;
  }

  /** @deprecated Listagens usam page scroll; mantido por compatibilidade. */
  datatableScrollHeight(): undefined {
    return undefined;
  }
}
