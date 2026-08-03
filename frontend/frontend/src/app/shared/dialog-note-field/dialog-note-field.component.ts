import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TranslatePipe } from '../../core/translate.pipe';

@Component({
  selector: 'app-dialog-note-field',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextareaModule, TranslatePipe],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DialogNoteFieldComponent),
      multi: true
    }
  ],
  template: `
    <div class="as-dialog-note">
      <label *ngIf="labelKey" class="as-dialog-note__label" [attr.for]="inputId">{{ labelKey | translate }}</label>
      <div class="as-dialog-note__box">
        <textarea
          [id]="inputId"
          pInputTextarea
          class="as-dialog-note__textarea w-full"
          [rows]="rows"
          [disabled]="disabled"
          [placeholder]="placeholderKey ? (placeholderKey | translate) : ''"
          [attr.maxlength]="maxLength ?? null"
          [(ngModel)]="value"
          (ngModelChange)="onChange($event)"
          (blur)="onTouched()">
        </textarea>
      </div>
      <p *ngIf="hintKey" class="as-dialog-note__hint">{{ hintKey | translate }}</p>
      <span *ngIf="showCounter && maxLength" class="as-dialog-note__counter">
        {{ (value?.length ?? 0) }}/{{ maxLength }}
      </span>
    </div>
  `
})
export class DialogNoteFieldComponent implements ControlValueAccessor {
  @Input() labelKey = '';
  @Input() hintKey = '';
  @Input() placeholderKey = '';
  @Input() inputId = 'dialog-note-' + Math.random().toString(36).slice(2, 9);
  @Input() rows = 5;
  @Input() maxLength: number | null = null;
  @Input() showCounter = false;
  @Input() disabled = false;

  value = '';

  private onChangeFn: (v: string) => void = () => {};
  private onTouchedFn: () => void = () => {};

  writeValue(v: string | null): void {
    this.value = v ?? '';
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onChange(v: string): void {
    this.value = v;
    this.onChangeFn(v);
  }

  onTouched(): void {
    this.onTouchedFn();
  }
}
