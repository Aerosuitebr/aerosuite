import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TranslatePipe } from '../core/translate.pipe';
import { TranslationService } from '../core/translation.service';
import {
  DossieAuditoriaResumo,
  DossieAuditoriaService,
  PacoteAuditoriaResumo
} from '../core/dossie-auditoria.service';
import {
  ConformidadeRetencaoService,
  RetencaoConfig,
  RetencaoInventario
} from '../core/conformidade-retencao.service';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';

@Component({
  standalone: true,
  selector: 'app-dossie-auditoria',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputNumberModule,
    InputTextModule,
    ToastModule,
    TranslatePipe,
    PageHeroComponent
  ],
  providers: [MessageService],
  styleUrls: ['./dossie-auditoria.component.scss'],
  template: `
    <p-toast></p-toast>
    <div class="dossie-shell">
      <app-page-hero
        variant="navy"
        titleKey="dossie.title"
        subtitleKey="dossie.subtitle"
        titleIcon="pi-file-pdf">
      </app-page-hero>

      <section class="page-controls">
        <div class="dossie-toolbar">
          <div class="toolbar-left">
            <div class="os-field">
              <label class="form-label" for="dossie-os-numero">{{ 'dossie.osNumber' | translate }}</label>
              <div class="os-input-wrap">
                <p-inputNumber
                  inputId="dossie-os-numero"
                  [(ngModel)]="numeroOs"
                  [useGrouping]="false"
                  [placeholder]="'dossie.osNumberPh' | translate"
                  styleClass="w-full">
                </p-inputNumber>
              </div>
            </div>
            <button
              pButton
              type="button"
              icon="pi pi-eye"
              class="p-button-outlined toolbar-preview-btn"
              [label]="'dossie.btnPreview' | translate"
              (click)="preview()"
              [loading]="loadingResumo"
              [disabled]="!osNumeroValido"></button>
          </div>
          <button
            pButton
            type="button"
            icon="pi pi-download"
            class="p-button-outlined toolbar-export-btn"
            [label]="'dossie.btnExport' | translate"
            (click)="exportPdf()"
            [loading]="loadingPdf"
            [disabled]="!osNumeroValido"></button>
        </div>
      </section>

      <main class="dossie-body">
        <div class="page-empty" *ngIf="!resumo && !loadingResumo">
          <i class="pi pi-inbox"></i>
          <p>{{ 'dossie.emptyHint' | translate }}</p>
        </div>

        <section class="resumo-panel" *ngIf="resumo" aria-live="polite">
          <h3>
            <i class="pi pi-list"></i>
            {{ 'dossie.resumoTitle' | translate }} #{{ resumo.numeroOs }}
          </h3>
          <ul class="stats-grid">
            <li class="stat-item">
              <span class="stat-label">{{ 'dossie.resumo.anexos' | translate }}</span>
              <span class="stat-value">{{ resumo.totalAnexos }}</span>
            </li>
            <li class="stat-item">
              <span class="stat-label">{{ 'dossie.resumo.estoque' | translate }}</span>
              <span class="stat-value">{{ resumo.totalMovimentosEstoque }}</span>
            </li>
            <li class="stat-item">
              <span class="stat-label">{{ 'dossie.resumo.auditoriaOs' | translate }}</span>
              <span class="stat-value">{{ resumo.totalAuditoriaOs }}</span>
            </li>
            <li class="stat-item">
              <span class="stat-label">{{ 'dossie.resumo.acessoExterno' | translate }}</span>
              <span class="stat-value">{{ resumo.totalAcessoExterno }}</span>
            </li>
            <li class="stat-item">
              <span class="stat-label">{{ 'dossie.resumo.acessoInterno' | translate }}</span>
              <span class="stat-value">{{ resumo.totalAcessoInterno }}</span>
            </li>
          </ul>
        </section>

        <section class="pacote-panel">
          <h3><i class="pi pi-box"></i> {{ 'dossie.pacote.title' | translate }}</h3>
          <p class="pacote-sub">{{ 'dossie.pacote.subtitle' | translate }}</p>
          <p class="pacote-sgq-hint"><i class="pi pi-info-circle"></i> {{ 'dossie.pacote.sgqHint' | translate }}</p>
          <div class="pacote-form">
            <div class="pacote-field">
              <label for="dossie-pacote-data-inicio">{{ 'dossie.pacote.dataInicio' | translate }}</label>
              <input pInputText id="dossie-pacote-data-inicio" type="date" [(ngModel)]="dataInicio" />
            </div>
            <div class="pacote-field">
              <label for="dossie-pacote-data-fim">{{ 'dossie.pacote.dataFim' | translate }}</label>
              <input pInputText id="dossie-pacote-data-fim" type="date" [(ngModel)]="dataFim" />
            </div>
            <div class="pacote-field">
              <label for="dossie-pacote-limite">{{ 'dossie.pacote.limite' | translate }}</label>
              <p-inputNumber
                inputId="dossie-pacote-limite"
                [(ngModel)]="limitePacote"
                [min]="1"
                [max]="100"
                [useGrouping]="false"></p-inputNumber>
            </div>
            <div class="pacote-field wide">
              <label for="dossie-pacote-numeros">{{ 'dossie.pacote.numeros' | translate }}</label>
              <input pInputText id="dossie-pacote-numeros" [(ngModel)]="numerosOsCsv" />
            </div>
            <div class="pacote-actions">
              <button
                pButton
                type="button"
                icon="pi pi-eye"
                class="p-button-outlined"
                [label]="'dossie.pacote.btnPreview' | translate"
                (click)="previewPacote()"
                [loading]="loadingPacoteResumo"></button>
              <button
                pButton
                type="button"
                icon="pi pi-download"
                class="p-button-warning"
                [label]="'dossie.pacote.btnZip' | translate"
                (click)="exportPacote()"
                [loading]="loadingPacoteZip"></button>
            </div>
          </div>
          <p *ngIf="pacoteResumo" class="pacote-count">
            {{
              'dossie.pacote.previewCount'
                | translate: { count: '' + pacoteResumo.totalOsIncluidas, max: '' + pacoteResumo.limiteMaximo }
            }}
          </p>
          <ul *ngIf="pacoteResumo?.ordens?.length" class="pacote-ordens">
            <li *ngFor="let o of pacoteResumo.ordens">
              {{
                'dossie.pacote.previewLine'
                  | translate
                    : {
                        numero: '' + o.numeroOs,
                        cliente: o.clienteNome || '—',
                        anexos: '' + (o.totalAnexos ?? 0),
                        crs: o.crsEmitido ? ('dossie.pacote.previewCrsSuffix' | translate) : ''
                      }
              }}
            </li>
          </ul>
        </section>

        <section class="pacote-panel retencao-panel">
          <h3><i class="pi pi-database"></i> {{ 'conformidade.retencao.title' | translate }}</h3>
          <p class="pacote-sub">{{ 'conformidade.retencao.subtitle' | translate }}</p>

          <div class="retencao-policy" *ngIf="retencaoConfig">
            <div class="pacote-field">
              <label for="dossie-retencao-anos">{{ 'conformidade.retencao.anos' | translate }}</label>
              <p-inputNumber
                inputId="dossie-retencao-anos"
                [(ngModel)]="anosRetencao"
                [min]="retencaoConfig.minAnos"
                [max]="retencaoConfig.maxAnos"
                [useGrouping]="false"></p-inputNumber>
            </div>
            <div class="pacote-field">
              <span class="form-label" id="dossie-retencao-limite-label">{{ 'conformidade.retencao.limite' | translate }}</span>
              <span class="limite-val" aria-labelledby="dossie-retencao-limite-label">{{ retencaoConfig.dataLimiteRetencao }}</span>
            </div>
            <button
              pButton
              type="button"
              icon="pi pi-save"
              class="p-button-outlined"
              [label]="'conformidade.retencao.btn.salvar' | translate"
              [loading]="salvandoRetencao"
              (click)="salvarRetencao()"></button>
          </div>

          <ul class="stats-grid" *ngIf="retencaoInventario">
            <li class="stat-item">
              <span class="stat-label">{{ 'conformidade.retencao.stats.fechadas' | translate }}</span>
              <span class="stat-value">{{ retencaoInventario.totalOsFechadas }}</span>
            </li>
            <li class="stat-item">
              <span class="stat-label">{{ 'conformidade.retencao.stats.dentro' | translate }}</span>
              <span class="stat-value">{{ retencaoInventario.totalDentroRetencao }}</span>
            </li>
            <li class="stat-item">
              <span class="stat-label">{{ 'conformidade.retencao.stats.fora' | translate }}</span>
              <span class="stat-value warn">{{ retencaoInventario.totalForaRetencao }}</span>
            </li>
            <li class="stat-item">
              <span class="stat-label">{{ 'conformidade.retencao.stats.abertas' | translate }}</span>
              <span class="stat-value">{{ retencaoInventario.totalOsAbertas }}</span>
            </li>
          </ul>

          <h4 *ngIf="retencaoInventario?.amostraForaRetencao?.length">{{ 'conformidade.retencao.amostra' | translate }}</h4>
          <ul *ngIf="retencaoInventario?.amostraForaRetencao?.length" class="pacote-ordens">
            <li *ngFor="let o of retencaoInventario!.amostraForaRetencao">
              {{
                'conformidade.retencao.line'
                  | translate
                    : {
                        numero: '' + o.numeroOs,
                        fechamento: o.dataFechamento || '—',
                        cliente: o.clienteNome || '—'
                      }
              }}
            </li>
          </ul>

          <p class="pacote-sub export-hint">{{ 'conformidade.retencao.export.hint' | translate }}</p>
          <div class="pacote-form">
            <div class="pacote-field">
              <label for="dossie-retencao-export-inicio">{{ 'conformidade.retencao.export.dataInicio' | translate }}</label>
              <input pInputText id="dossie-retencao-export-inicio" type="date" [(ngModel)]="retencaoDataInicio" />
            </div>
            <div class="pacote-field">
              <label for="dossie-retencao-export-fim">{{ 'conformidade.retencao.export.dataFim' | translate }}</label>
              <input pInputText id="dossie-retencao-export-fim" type="date" [(ngModel)]="retencaoDataFim" />
            </div>
            <div class="pacote-field">
              <label for="dossie-retencao-export-limite">{{ 'conformidade.retencao.export.limite' | translate }}</label>
              <p-inputNumber
                inputId="dossie-retencao-export-limite"
                [(ngModel)]="retencaoLimite"
                [min]="1"
                [max]="100"
                [useGrouping]="false"></p-inputNumber>
            </div>
            <div class="pacote-actions">
              <button
                pButton
                type="button"
                icon="pi pi-download"
                class="p-button-secondary"
                [label]="'conformidade.retencao.btn.exportar' | translate"
                [loading]="loadingRetencaoZip"
                (click)="exportarArquivoMorto()"></button>
            </div>
          </div>
        </section>
      </main>
    </div>
  `
})
export class DossieAuditoriaComponent implements OnInit {
  private svc = inject(DossieAuditoriaService);
  private retencaoSvc = inject(ConformidadeRetencaoService);
  private i18n = inject(TranslationService);
  private toast = inject(MessageService);

  numeroOs: number | null = null;
  resumo: DossieAuditoriaResumo | null = null;
  loadingResumo = false;
  loadingPdf = false;

  dataInicio = '';
  dataFim = '';
  limitePacote = 30;
  numerosOsCsv = '';
  pacoteResumo: PacoteAuditoriaResumo | null = null;
  loadingPacoteResumo = false;
  loadingPacoteZip = false;

  retencaoConfig: RetencaoConfig | null = null;
  retencaoInventario: RetencaoInventario | null = null;
  anosRetencao = 5;
  salvandoRetencao = false;
  loadingRetencaoZip = false;
  retencaoDataInicio = '';
  retencaoDataFim = '';
  retencaoLimite = 30;

  get osNumeroValido(): boolean {
    return this.numeroOs != null && this.numeroOs > 0;
  }

  ngOnInit(): void {
    this.carregarRetencao();
  }

  carregarRetencao(): void {
    this.retencaoSvc.getConfig().subscribe({
      next: cfg => {
        this.retencaoConfig = cfg;
        this.anosRetencao = cfg.anosRetencao;
      }
    });
    this.retencaoSvc.inventario().subscribe({
      next: inv => {
        this.retencaoInventario = inv;
      }
    });
  }

  salvarRetencao(): void {
    this.salvandoRetencao = true;
    this.retencaoSvc.saveConfig(this.anosRetencao).subscribe({
      next: cfg => {
        this.retencaoConfig = cfg;
        this.salvandoRetencao = false;
        this.toast.add({ severity: 'success', summary: this.i18n.translate('conformidade.retencao.toast.salvo') });
        this.retencaoSvc.inventario().subscribe(inv => (this.retencaoInventario = inv));
      },
      error: (err: { error?: unknown }) => {
        this.salvandoRetencao = false;
        this.toast.add({
          severity: 'error',
          summary: this.i18n.translateApiError(err?.error, 'conformidade.retencao.err.salvar')
        });
      }
    });
  }

  exportarArquivoMorto(): void {
    this.loadingRetencaoZip = true;
    this.retencaoSvc
      .downloadArquivoMorto({
        dataInicio: this.retencaoDataInicio || undefined,
        dataFim: this.retencaoDataFim || undefined,
        limite: this.retencaoLimite ?? 30
      })
      .subscribe({
        next: blob => {
          this.retencaoSvc.triggerZipDownload(blob);
          this.loadingRetencaoZip = false;
          this.toast.add({ severity: 'success', summary: this.i18n.translate('conformidade.retencao.toast.zip') });
        },
        error: (err: { error?: unknown }) => {
          this.loadingRetencaoZip = false;
          this.toast.add({
            severity: 'error',
            summary: this.i18n.translateApiError(err?.error, 'conformidade.retencao.err.zip')
          });
        }
      });
  }

  preview(): void {
    if (!this.numeroOs) {
      this.toast.add({ severity: 'warn', summary: this.i18n.translate('dossie.err.osRequired') });
      return;
    }
    this.loadingResumo = true;
    this.svc.resumoByNumero(this.numeroOs).subscribe({
      next: r => {
        this.resumo = r;
        this.loadingResumo = false;
      },
      error: err => {
        this.loadingResumo = false;
        this.resumo = null;
        const status = err?.status;
        this.toast.add({
          severity: 'error',
          summary: this.i18n.translate(status === 404 ? 'dossie.err.notFound' : 'dossie.err.export')
        });
      }
    });
  }

  exportPdf(): void {
    if (!this.numeroOs) {
      this.toast.add({ severity: 'warn', summary: this.i18n.translate('dossie.err.osRequired') });
      return;
    }
    this.loadingPdf = true;
    this.svc.downloadPdfByNumero(this.numeroOs).subscribe({
      next: blob => {
        this.svc.triggerDownload(blob, this.numeroOs!);
        this.loadingPdf = false;
        this.toast.add({ severity: 'success', summary: this.i18n.translate('dossie.ok.export') });
        if (!this.resumo) {
          this.preview();
        }
      },
      error: err => {
        this.loadingPdf = false;
        this.toast.add({
          severity: 'error',
          summary: this.i18n.translate(err?.status === 404 ? 'dossie.err.notFound' : 'dossie.err.export')
        });
      }
    });
  }

  private pacoteParams() {
    return {
      dataInicio: this.dataInicio || undefined,
      dataFim: this.dataFim || undefined,
      limite: this.limitePacote ?? 30,
      numerosOs: this.numerosOsCsv.trim() || undefined
    };
  }

  previewPacote(): void {
    this.loadingPacoteResumo = true;
    this.svc.pacoteResumo(this.pacoteParams()).subscribe({
      next: r => {
        this.pacoteResumo = r;
        this.loadingPacoteResumo = false;
      },
      error: () => {
        this.loadingPacoteResumo = false;
        this.pacoteResumo = null;
        this.toast.add({ severity: 'error', summary: this.i18n.translate('dossie.pacote.err.zip') });
      }
    });
  }

  exportPacote(): void {
    this.loadingPacoteZip = true;
    this.svc.downloadPacoteZip(this.pacoteParams()).subscribe({
      next: blob => {
        this.svc.triggerZipDownload(blob);
        this.loadingPacoteZip = false;
        this.toast.add({ severity: 'success', summary: this.i18n.translate('dossie.pacote.ok.zip') });
        if (!this.pacoteResumo) {
          this.previewPacote();
        }
      },
      error: () => {
        this.loadingPacoteZip = false;
        this.toast.add({ severity: 'error', summary: this.i18n.translate('dossie.pacote.err.zip') });
      }
    });
  }
}
