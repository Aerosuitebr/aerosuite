import { Pipe, PipeTransform } from '@angular/core';
import { displayPhoneBr } from './br-input.util';

/** Máscara BR padrão para exibição de telefones na UI. */
@Pipe({
  name: 'phoneBr',
  standalone: true,
  pure: true,
})
export class PhoneBrPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return displayPhoneBr(value);
  }
}
