import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import JsBarcode from 'jsbarcode';

/**
 * Renderiza código de barras no cliente (evita &lt;img src&gt; sem Authorization).
 */
@Component({
  standalone: true,
  selector: 'app-barcode-svg',
  template: `<svg #svg class="barcode-svg" role="img" [attr.aria-label]="code"></svg>`,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        max-width: 100%;
      }
      .barcode-svg {
        max-width: 100%;
        height: auto;
      }
    `
  ]
})
export class BarcodeSvgComponent implements AfterViewInit, OnChanges {
  @Input({ required: true }) code = '';
  @Input() barWidth = 1.15;
  @Input() barHeight = 36;
  @Input() showValue = false;

  @ViewChild('svg') private svgRef?: ElementRef<SVGSVGElement>;

  ngAfterViewInit(): void {
    this.render();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['code'] || changes['barWidth'] || changes['barHeight'] || changes['showValue']) {
      this.render();
    }
  }

  /** PNG data URL para impressão. */
  toDataUrl(width = 400, height = 120): string | null {
    const canvas = document.createElement('canvas');
    try {
      const opts = this.buildOptions(height);
      JsBarcode(canvas, opts.value, {
        format: opts.format,
        width: opts.barWidth,
        height: opts.barHeight,
        displayValue: true,
        fontSize: 14,
        margin: 8
      });
      return canvas.toDataURL('image/png');
    } catch {
      return null;
    }
  }

  private render(): void {
    const el = this.svgRef?.nativeElement;
    if (!el) return;
    el.innerHTML = '';
    const raw = (this.code ?? '').trim();
    if (!raw) return;
    try {
      const opts = this.buildOptions();
      JsBarcode(el, opts.value, {
        format: opts.format,
        width: opts.barWidth,
        height: opts.barHeight,
        displayValue: this.showValue,
        fontSize: 10,
        margin: 2
      });
    } catch {
      /* valor inválido para o formato — mantém célula vazia */
    }
  }

  private buildOptions(overrideHeight?: number): {
    format: string;
    value: string;
    barWidth: number;
    barHeight: number;
  } {
    const digits = this.code.replace(/\D/g, '');
    let format = 'CODE128';
    let value = this.code.trim();
    if (digits.length === 12) {
      format = 'EAN13';
      value = digits;
    } else if (digits.length === 13) {
      format = 'EAN13';
      value = digits;
    }
    return {
      format,
      value,
      barWidth: this.barWidth,
      barHeight: overrideHeight ?? this.barHeight
    };
  }
}
