import { Pipe, PipeTransform } from '@angular/core';
import { repairDisplayText } from './display-text.util';

@Pipe({
  name: 'displayText',
  standalone: true,
  pure: true
})
export class DisplayTextPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return repairDisplayText(value);
  }
}
