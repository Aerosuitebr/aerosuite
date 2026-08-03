/** Evento mínimo emitido pelo p-table em modo lazy. */
export interface LazyLoadEvent {
  first?: number;
  rows?: number;
  sortField?: string;
  sortOrder?: 1 | -1 | null;
}

/** Parâmetros de página para chamadas à API (offset = page × size). */
export interface LazyPageRequest {
  page: number;
  size: number;
  offset: number;
  first: number;
}

/**
 * Converte o evento do PrimeNG em page/size para a API.
 * Ao mudar o tamanho da página, volta para a primeira página.
 */
export function resolveLazyPageRequest(
  event: LazyLoadEvent | undefined,
  current: { pageIndex: number; size: number }
): LazyPageRequest {
  const size = event?.rows && event.rows > 0 ? event.rows : current.size;
  const sizeChanged = size !== current.size;
  const first = sizeChanged ? 0 : (event?.first ?? current.pageIndex * size);
  const page = Math.floor(first / size);
  return {
    page,
    size,
    offset: page * size,
    first,
  };
}

/** Descarta respostas HTTP obsoletas quando o usuário muda de página rapidamente. */
export function createStaleRequestGuard(): {
  bump(): number;
  isStale(seq: number): boolean;
} {
  let seq = 0;
  return {
    bump: () => ++seq,
    isStale: (s: number) => s !== seq,
  };
}
