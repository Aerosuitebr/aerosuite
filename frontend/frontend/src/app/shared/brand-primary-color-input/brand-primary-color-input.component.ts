import { CommonModule } from '@angular/common';
import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { normalizeHex } from '../../core/brand-colors.util';

@Component({
  selector: 'app-brand-primary-color-input',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BrandPrimaryColorInputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="brand-color-row">
      <span
        class="brand-color-row__preview"
        [style.background]="displayColor"
        aria-hidden="true"></span>
      <input
        type="color"
        class="brand-color-row__native"
        [id]="nativeInputId"
        [value]="displayColor"
        [disabled]="disabled"
        [attr.aria-label]="ariaLabel"
        (input)="onNativeInput($event)" />
      <input
        pInputText
        class="brand-color-row__hex"
        [id]="hexInputId"
        [ngModel]="hexDraft"
        (ngModelChange)="onHexDraftChange($event)"
        (blur)="commitHexDraft()"
        [placeholder]="placeholder"
        maxlength="7"
        spellcheck="false"
        [disabled]="disabled"
        [attr.aria-label]="hexAriaLabel || ariaLabel" />
    </div>
  `,
  styles: [
    `
      .brand-color-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.65rem;
      }

      .brand-color-row__preview {
        width: 2.25rem;
        height: 2.25rem;
        border-radius: 10px;
        border: 1px solid #cbd5e1;
        flex-shrink: 0;
      }

      .brand-color-row__native {
        width: 2.75rem;
        height: 2.75rem;
        padding: 0.15rem;
        border: 1px solid #cbd5e1;
        border-radius: 10px;
        background: #fff;
        cursor: pointer;
        flex-shrink: 0;
      }

      .brand-color-row__native:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }

      .brand-color-row__hex {
        max-width: 7.5rem;
        min-width: 6.5rem;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 0.85rem;
      }
    `,
  ],
})
export class BrandPrimaryColorInputComponent implements ControlValueAccessor {
  @Input() nativeInputId = 'brand-primary-color-native';
  @Input() hexInputId = 'brand-primary-color-hex';
  @Input() ariaLabel = '';
  @Input() hexAriaLabel = '';
  @Input() placeholder = '#0ea5e9';

  displayColor = normalizeHex('#0ea5e9');
  hexDraft = this.displayColor;
  disabled = false;

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.displayColor = normalizeHex(value);
    this.hexDraft = this.displayColor;
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onNativeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    const normalized = normalizeHex(value);
    if (normalized === '#000000' && this.displayColor !== '#000000') {
      input.value = this.displayColor;
      return;
    }
    this.emitColor(normalized);
  }

  onHexDraftChange(value: string): void {
    this.hexDraft = value;
  }

  commitHexDraft(): void {
    this.onTouched();
    const raw = (this.hexDraft ?? '').trim();
    if (!raw) {
      this.emitColor(normalizeHex(''));
      return;
    }
    const withHash = raw.startsWith('#') ? raw : `#${raw}`;
    if (withHash.length === 7 || withHash.length === 4) {
      this.emitColor(normalizeHex(withHash));
      return;
    }
    this.hexDraft = this.displayColor;
  }

  private emitColor(value: string): void {
    this.displayColor = value;
    this.hexDraft = value;
    this.onChange(value);
  }
}
