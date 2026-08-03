import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { EstoqueService, ItemLinhaTempo } from '../../core/estoque.service';
import { TranslationService } from '../../core/translation.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { PageHeroComponent } from '../../shared/page-hero/page-hero.component';

@Component({
  selector: 'app-rastreio-peca',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    TimelineModule,
    ToastModule,
    CardModule,
    TranslatePipe,
    PageHeroComponent
  ],
  providers: [MessageService],
  styleUrls: ['./rastreio-peca.component.scss'],
  template: `
    <p-toast></p-toast>
    <div class="as-page rastreio-page">
      <app-page-hero
        variant="sky"
        titleKey="estoque.rastreio.title"
        subtitleKey="estoque.rastreio.subtitle"
        titleIcon="pi-shield"
        [hasActions]="false">
      </app-page-hero>

      <div class="search-section">
        <span class="compliance-badge">{{ 'estoque.rastreio.complianceBadge' | translate }}</span>
        <div class="search-row">
          <label for="codigo-busca">{{ 'estoque.rastreio.searchLabel' | translate }}</label>
          <div class="search-inputs">
            <input
              id="codigo-busca"
              pInputText
              class="codigo-input"
              [(ngModel)]="codigoBusca"
              [placeholder]="'estoque.rastreio.searchPh' | translate"
              (keyup.enter)="carregar()" />
            <button
              pButton
              type="button"
              icon="pi pi-search"
              [label]="'estoque.rastreio.btnSearch' | translate"
              (click)="carregar()"
              [loading]="loading"></button>
            <button
              pButton
              type="button"
              icon="pi pi-file-pdf"
              class="p-button-warning"
              [label]="'estoque.rastreio.btnPdf' | translate"
              (click)="exportarPdf()"
              [loading]="loadingPdf"
              [disabled]="!linhaTempo"></button>
          </div>
        </div>
      </div>

      <div class="page-empty" *ngIf="!linhaTempo && !loading">
        <i class="pi pi-history"></i>
        <p>{{ 'estoque.rastreio.emptyHint' | translate }}</p>
      </div>

      <ng-container *ngIf="linhaTempo as lt">
        <p-card styleClass="item-card">
          <ng-template pTemplate="title">{{ 'estoque.rastreio.sectionItem' | translate }}</ng-template>
          <ng-template pTemplate="content">
            <div class="kv-grid">
              <div class="kv" *ngIf="lt.item.codigoRastreio">
                <span class="k">{{ 'estoque.rastreio.field.rastreio' | translate }}</span>
                <span class="v"><strong>{{ lt.item.codigoRastreio }}</strong></span>
              </div>
              <div class="kv" *ngIf="lt.item.partNumber">
                <span class="k">{{ 'estoque.rastreio.field.pn' | translate }}</span>
                <span class="v">{{ lt.item.partNumber }}</span>
              </div>
              <div class="kv" *ngIf="lt.item.serialNumber">
                <span class="k">{{ 'estoque.rastreio.field.sn' | translate }}</span>
                <span class="v">{{ lt.item.serialNumber }}</span>
              </div>
              <div class="kv" *ngIf="lt.item.status">
                <span class="k">{{ 'estoque.rastreio.field.status' | translate }}</span>
                <span class="v"><p-tag [value]="getStatusLabel(lt.item.status)"></p-tag></span>
              </div>
              <div class="kv" *ngIf="lt.item.certificadoConformidade">
                <span class="k">{{ 'estoque.rastreio.field.cert' | translate }}</span>
                <span class="v cert">{{ lt.item.certificadoConformidade }}</span>
              </div>
              <div class="kv" *ngIf="lt.item.dataValidade">
                <span class="k">{{ 'estoque.rastreio.field.validade' | translate }}</span>
                <span class="v">{{ lt.item.dataValidade }}</span>
              </div>
              <div class="kv" *ngIf="lt.item.loteCodigo">
                <span class="k">{{ 'estoque.rastreio.field.lote' | translate }}</span>
                <span class="v">{{ lt.item.loteCodigo }}</span>
              </div>
              <div class="kv" *ngIf="lt.item.invoiceNumero">
                <span class="k">{{ 'estoque.rastreio.field.invoice' | translate }}</span>
                <span class="v">{{ lt.item.invoiceNumero }}</span>
              </div>
              <div class="kv" *ngIf="lt.item.fornecedorNome">
                <span class="k">{{ 'estoque.rastreio.field.fornecedor' | translate }}</span>
                <span class="v">{{ lt.item.fornecedorNome }}</span>
              </div>
              <div class="kv" *ngIf="lt.item.localizacao">
                <span class="k">{{ 'estoque.rastreio.field.local' | translate }}</span>
                <span class="v">{{ lt.item.localizacao }}</span>
              </div>
              <div class="kv" *ngIf="lt.item.osConsumoNumero">
                <span class="k">{{ 'estoque.rastreio.field.osConsumo' | translate }}</span>
                <span class="v">#{{ lt.item.osConsumoNumero }}</span>
              </div>
            </div>
          </ng-template>
        </p-card>

        <section class="timeline-section">
          <h2>{{ 'estoque.rastreio.sectionTimeline' | translate }} ({{ lt.totalEventos }})</h2>
          <p *ngIf="!lt.eventos?.length" class="timeline-empty">{{ 'estoque.rastreio.timeline.empty' | translate }}</p>
          <p-timeline *ngIf="lt.eventos?.length" [value]="lt.eventos" align="left">
            <ng-template pTemplate="marker" let-ev>
              <span class="timeline-marker" [attr.data-tipo]="ev.tipo">{{ tipoIcon(ev.tipo) }}</span>
            </ng-template>
            <ng-template pTemplate="content" let-ev>
              <div class="timeline-card">
                <div class="timeline-card__head">
                  <p-tag [value]="getTipoLabel(ev.tipo)" [severity]="tipoSeverity(ev.tipo)"></p-tag>
                  <span class="date">{{ ev.dataHora }}</span>
                </div>
                <p *ngIf="ev.quantidade">
                  <strong>{{ 'estoque.rastreio.timeline.qty' | translate }}:</strong> {{ ev.quantidade }}
                  <span *ngIf="ev.quantidadePosterior"> → {{ ev.quantidadePosterior }}</span>
                </p>
                <p *ngIf="ev.osNumero">
                  <strong>{{ 'estoque.rastreio.timeline.os' | translate }}:</strong> #{{ ev.osNumero }}
                </p>
                <p *ngIf="ev.usuarioNome">
                  <strong>{{ 'estoque.rastreio.timeline.user' | translate }}:</strong> {{ ev.usuarioNome }}
                </p>
                <p *ngIf="ev.motivo" class="motivo">
                  <strong>{{ 'estoque.rastreio.timeline.motivo' | translate }}:</strong> {{ ev.motivo }}
                </p>
              </div>
            </ng-template>
          </p-timeline>
        </section>
      </ng-container>
    </div>
  `
})
export class RastreioPecaComponent implements OnInit {
  private estoque = inject(EstoqueService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private i18n = inject(TranslationService);

  codigoBusca = '';
  linhaTempo: ItemLinhaTempo | null = null;
  loading = false;
  loadingPdf = false;

  ngOnInit(): void {
    const codigoRoute = this.route.snapshot.paramMap.get('codigo');
    const codigoQuery = this.route.snapshot.queryParamMap.get('codigo');
    const inicial = codigoRoute ?? codigoQuery;
    if (inicial) {
      this.codigoBusca = decodeURIComponent(inicial);
      this.carregar();
    }
  }

  carregar(): void {
    const codigo = this.codigoBusca?.trim();
    if (!codigo) {
      return;
    }
    this.loading = true;
    this.linhaTempo = null;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { codigo },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
    this.estoque.linhaTempoPorCodigo(codigo).subscribe({
      next: (data) => {
        this.linhaTempo = data;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        const status = err?.status;
        const key =
          status === 404 ? 'estoque.rastreio.toast.notFound' : 'estoque.rastreio.toast.loadFail';
        this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', key);
      }
    });
  }

  exportarPdf(): void {
    const codigo = this.codigoBusca?.trim();
    if (!codigo) {
      return;
    }
    this.loadingPdf = true;
    this.estoque.downloadLinhaTempoPdf(codigo, this.i18n.getCurrentLanguage()).subscribe({
      next: (blob) => {
        this.loadingPdf = false;
        const rastreio = this.linhaTempo?.item?.codigoRastreio ?? codigo;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Rastreio_${rastreio.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.loadingPdf = false;
        this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'estoque.rastreio.toast.pdfFail');
      }
    });
  }

  getStatusLabel(status?: string): string {
    if (!status) return '';
    return this.i18n.translateCatalog('estoque.itens.status', status, status);
  }

  getTipoLabel(tipo?: string): string {
    if (!tipo) return '';
    return this.i18n.translateCatalog('movimentacao.tipo', tipo, tipo);
  }

  tipoSeverity(tipo: string | undefined): 'success' | 'warning' | 'danger' | 'info' | undefined {
    if (!tipo) {
      return 'info';
    }
    if (tipo === 'ENTRADA' || tipo === 'DEVOLUCAO') {
      return 'success';
    }
    if (tipo === 'SAIDA' || tipo === 'DESCARTE') {
      return 'warning';
    }
    return 'info';
  }

  tipoIcon(tipo: string | undefined): string {
    if (tipo === 'SAIDA') {
      return '↓';
    }
    if (tipo === 'ENTRADA') {
      return '↑';
    }
    return '•';
  }
}
