import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs';

export interface ListSearchHandle {
  /** Use em `(input)` — lê o valor atual do campo. */
  fromInput(event: Event): void;
  /** Use em `(ngModelChange)` — paste, autofill e IME. */
  fromModel(value: string | null | undefined): void;
}

/**
 * Busca com debounce para listas (300 ms por padrão).
 * O callback recebe o termo já normalizado (trim) e deve recarregar a lista.
 */
export function createListSearch(
  destroyRef: DestroyRef,
  onTerm: (term: string) => void,
  debounceMs = 300
): ListSearchHandle {
  const subject = new Subject<string>();

  subject
    .pipe(debounceTime(debounceMs), distinctUntilChanged(), takeUntilDestroyed(destroyRef))
    .subscribe(term => onTerm(term.trim()));

  const push = (value: string | null | undefined) => subject.next(value ?? '');

  return {
    fromInput(event: Event) {
      const el = event.target as HTMLInputElement | null;
      push(el?.value ?? '');
    },
    fromModel: push
  };
}
