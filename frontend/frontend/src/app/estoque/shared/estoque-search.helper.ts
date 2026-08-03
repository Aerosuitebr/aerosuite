import { DestroyRef } from '@angular/core';
import { createListSearch, type ListSearchHandle } from '../../core/list-search.helper';

export type { ListSearchHandle as EstoqueSearchHandle };

/**
 * Busca com debounce para listas de estoque.
 * @deprecated Preferir `createListSearch` de `core/list-search.helper`.
 */
export function createEstoqueSearch(
  destroyRef: DestroyRef,
  onTerm: (term: string) => void,
  debounceMs = 300
): ListSearchHandle {
  return createListSearch(destroyRef, onTerm, debounceMs);
}
