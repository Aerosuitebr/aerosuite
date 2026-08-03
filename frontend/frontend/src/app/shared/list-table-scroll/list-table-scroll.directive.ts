import { Directive } from '@angular/core';

/**
 * Marca p-table de listagens que seguem o padrão Aero Suite (scroll no main-content).
 * Usar: <p-table appListScroll ...>
 */
@Directive({
  selector: 'p-table[appListScroll]',
  standalone: true,
})
export class ListTableScrollDirective {}
