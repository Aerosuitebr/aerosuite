import { Pipe, PipeTransform } from '@angular/core';
import { formatIsoDateDisplay } from './iso-local-date.util';

/** Formats YYYY-MM-DD (or Date) as dd/MM/yyyy without timezone conversion. */
@Pipe({ name: 'isoLocalDate', standalone: true })
export class IsoLocalDatePipe implements PipeTransform {
  transform(value?: string | Date | null): string {
    return formatIsoDateDisplay(value) || '-';
  }
}
