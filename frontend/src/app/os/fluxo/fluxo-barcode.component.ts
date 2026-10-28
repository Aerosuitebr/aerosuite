import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, OnDestroy, ViewChild } from '@angular/core';
import JsBarcode from 'jsbarcode';

/** Código de barras CODE128 em SVG (nítido na impressão e legível por leitores 1D comuns). */
@Component({
  standalone: true,
  selector: 'app-fluxo-barcode',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.tela]': 'paraTela' },
  template: `<svg #svg class="barcode" role="img" [attr.aria-label]="'Código de barras ' + valor"></svg>`,
  styles: [`
    :host { display: inline-block; line-height: 0; }
    :host.tela { display: block; width: 100%; text-align: center; }
    .barcode { max-width: 100%; height: auto; }
    :host.tela .barcode { max-width: none; shape-rendering: crispEdges; }
  `]
})
export class FluxoBarcodeComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) valor = '';
  @Input() altura = 64;
  @Input() largura = 2;
  @Input() mostrarTexto = true;
  @Input() tamanhoFonte = 14;
  @Input() cor = '#0b1220';
  /** Barras alinhadas a pixels físicos, com zona quieta, para leitura na tela. */
  @Input() paraTela = false;

  @ViewChild('svg', { static: true }) svg!: ElementRef<SVGSVGElement>;

  private observer?: ResizeObserver;
  private ultimaLargura = -1;

  ngAfterViewInit(): void {
    this.render();
    const alvo = this.svg.nativeElement.parentElement?.parentElement;
    if (!alvo || typeof ResizeObserver === 'undefined') return;
    this.observer = new ResizeObserver(() => {
      if (Math.abs(alvo.clientWidth - this.ultimaLargura) >= 4) this.render();
    });
    this.observer.observe(alvo);
  }

  ngOnChanges(): void {
    this.ultimaLargura = -1;
    if (this.svg) this.render();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private render(): void {
    const el = this.svg?.nativeElement;
    if (!el || !this.valor) return;
    const tela = this.medidaTela();
    if (this.paraTela && !tela) return;
    this.ultimaLargura = this.paraTela ? (tela?.caixa ?? 0) : 0;
    try {
      JsBarcode(el, this.valor, {
        format: 'CODE128',
        height: tela?.altura ?? this.altura,
        width: tela?.modulo ?? this.largura,
        displayValue: this.mostrarTexto,
        fontSize: this.paraTela ? Math.max(this.tamanhoFonte, 20) : this.tamanhoFonte,
        font: 'IBM Plex Mono, Consolas, monospace',
        textMargin: this.paraTela ? 8 : 4,
        margin: tela?.margem ?? 8,
        background: '#ffffff',
        lineColor: this.paraTela ? '#000000' : this.cor
      });
      if (this.paraTela) el.setAttribute('shape-rendering', 'crispEdges');
    } catch {
      // valor inválido para CODE128: mantém SVG vazio
    }
  }

  /** Módulo em pixels físicos inteiros e zona quieta de 10 módulos, sem reduzir o SVG depois. */
  private medidaTela(): { modulo: number; margem: number; altura: number; caixa: number } | null {
    if (!this.paraTela) return null;
    const caixa = this.svg.nativeElement.parentElement?.parentElement?.clientWidth ?? 0;
    if (caixa < 80) return null;
    const dpr = window.devicePixelRatio || 1;
    const modulos = 11 * this.valor.length + 35 + 20;
    let device = Math.floor((caixa / modulos) * dpr);
    device = Math.max(2, Math.min(device, 8));
    const modulo = device / dpr;
    const larguraBarras = modulo * (11 * this.valor.length + 35);
    return {
      modulo,
      margem: 10 * modulo,
      altura: Math.max(this.altura, Math.round(larguraBarras * 0.28)),
      caixa
    };
  }
}
