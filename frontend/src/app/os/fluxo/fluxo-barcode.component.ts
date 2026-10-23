import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, ViewChild } from '@angular/core';
import JsBarcode from 'jsbarcode';

/** Código de barras CODE128 em SVG (nítido na impressão e legível por leitores 1D comuns). */
@Component({
  standalone: true,
  selector: 'app-fluxo-barcode',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<svg #svg class="barcode" role="img" [attr.aria-label]="'Código de barras ' + valor"></svg>`,
  styles: [`
    :host { display: inline-block; line-height: 0; }
    .barcode { max-width: 100%; height: auto; }
  `]
})
export class FluxoBarcodeComponent implements AfterViewInit, OnChanges {
  @Input({ required: true }) valor = '';
  @Input() altura = 64;
  @Input() largura = 2;
  @Input() mostrarTexto = true;
  @Input() tamanhoFonte = 14;
  @Input() cor = '#0b1220';

  @ViewChild('svg', { static: true }) svg!: ElementRef<SVGElement>;

  ngAfterViewInit(): void {
    this.render();
  }

  ngOnChanges(): void {
    if (this.svg) this.render();
  }

  private render(): void {
    if (!this.valor) return;
    try {
      JsBarcode(this.svg.nativeElement, this.valor, {
        format: 'CODE128',
        height: this.altura,
        width: this.largura,
        displayValue: this.mostrarTexto,
        fontSize: this.tamanhoFonte,
        font: 'IBM Plex Mono, Consolas, monospace',
        textMargin: 4,
        margin: 8,
        background: '#ffffff',
        lineColor: this.cor
      });
    } catch {
      // valor inválido para CODE128: mantém SVG vazio
    }
  }
}
