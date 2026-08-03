import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { TimelineModule } from 'primeng/timeline';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { EstoqueService, ItemEstoque, MovimentacaoEstoque } from '../../core/estoque.service';
import { TranslationService } from '../../core/translation.service';
import { PageHelpComponent } from '../../shared/page-help/page-help.component';
import { PageHeroComponent } from '../../shared/page-hero/page-hero.component';
import { TranslatePipe } from '../../core/translate.pipe';
import { firstValueFrom } from 'rxjs';
import { getDefaultAppLogoUrlAbsolute } from '../../shared/constants/logo.constant';
import { buildEtiquetaPadrao100x45Document } from '../shared/etiqueta-padrao-100x45';
import {
  buildEtiquetaCompletaDocument,
  buildEtiquetaCompactaDocument,
  buildEtiquetaMediaDocument,
  buildEtiquetaMinimaDocument,
  buildEtiquetaPrintContext,
  EtiquetaPrintContext,
  openEtiquetaHtmlPrint
} from '../shared/etiqueta-print.util';
import { EtiquetaPrintService } from '../shared/etiqueta-print.service';
import { normalizeEstoqueScanInput, resolveEtiquetaQrPayload } from '../shared/etiqueta-qr.util';
import { EstoqueQrOriginService } from '../shared/estoque-qr-origin.service';
import { ThermalPrintMode } from '../../core/print/thermal-print-preferences.service';
import { BrandingService } from '../../core/branding.service';
import { AuthService } from '../../auth/auth.service';
import { toastKey } from '../../core/toast-i18n.util';

interface OpcaoEtiqueta {
  id: string;
  larguraMm: number;
  alturaMm: number;
  previewWidth: number;
  previewHeight: number;
  temQr: boolean;
  temBarcode: boolean;
  temDetalhes: boolean;
}

@Component({
  selector: 'app-consulta-qr',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    CardModule,
    TagModule,
    TooltipModule,
    ToastModule,
    DividerModule,
    TimelineModule,
    DialogModule,
    PageHelpComponent,
    PageHeroComponent,
    TranslatePipe
  ],
  template: `
    <p-toast></p-toast>
    
    <div class="as-page consulta-container">
      <app-page-hero
        variant="sky"
        titleKey="estoque.consultaQr.title"
        subtitleKey="estoque.consultaQr.subtitle"
        titleIcon="pi-qrcode"
        [hasActions]="true">
        <div actions class="header-actions">
          <app-page-help></app-page-help>
        </div>
      </app-page-hero>

      <!-- Área de Busca -->
      <div class="search-section">
        <div class="search-box">
          <div class="search-icon">
            <i class="pi pi-qrcode"></i>
          </div>
          <div class="search-content">
            <label for="codigoRastreio">{{ 'estoque.consultaQr.labelCode' | translate }}</label>
            <div class="search-input-wrapper">
              <input 
                #codigoInput
                pInputText 
                id="codigoRastreio"
                [(ngModel)]="codigoBusca"
                [placeholder]="'estoque.consultaQr.placeholderCode' | translate"
                (keyup.enter)="buscar()"
                [autofocus]="true"
                class="search-input">
              <button pButton icon="pi pi-search" 
                      [label]="'estoque.consultaQr.search' | translate" 
                      (click)="buscar()"
                      [loading]="buscando"
                      class="p-button-primary">
              </button>
              <button pButton icon="pi pi-refresh" 
                      [pTooltip]="'estoque.consultaQr.clearTooltip' | translate"
                      (click)="limpar()"
                      class="p-button-outlined p-button-secondary">
              </button>
            </div>
            <div class="search-tips">
              <span class="tip">
                <i class="pi pi-qrcode"></i>
                {{ 'estoque.consultaQr.tip.trace' | translate }}
              </span>
              <span class="tip">
                <i class="pi pi-barcode"></i>
                {{ 'estoque.consultaQr.tip.barcode' | translate }}
              </span>
              <span class="tip">
                <i class="pi pi-tag"></i>
                {{ 'estoque.consultaQr.tip.serial' | translate }}
              </span>
              <span class="tip">
                <i class="pi pi-file"></i>
                {{ 'estoque.consultaQr.tip.invoice' | translate }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Lista de Múltiplos Itens (quando busca por P/N retorna vários) -->
      <div class="multiple-items-section" *ngIf="itensEncontrados.length > 1">
        <div class="multiple-header">
          <i class="pi pi-list"></i>
          <h3>{{ 'estoque.consultaQr.multiple.header' | translate:{ count: itensEncontrados.length } }}</h3>
        </div>
        <div class="items-list">
          <div *ngFor="let item of itensEncontrados" 
               class="item-card"
               [class.selected]="itemEncontrado?.id === item.id"
               (click)="selecionarItem(item)">
            <div class="item-status">
              <p-tag [value]="getStatusLabel(item.status)" [severity]="getStatusSeverity(item.status)" size="small"></p-tag>
            </div>
            <div class="item-info">
              <span class="item-codigo">{{ item.codigoRastreio }}</span>
              <span class="item-pn">{{ 'estoque.consultaQr.prefixPn' | translate }} {{ item.partNumber }}</span>
              <span class="item-sn" *ngIf="item.serialNumber">{{ 'estoque.consultaQr.prefixSn' | translate }} {{ item.serialNumber }}</span>
            </div>
            <div class="item-localizacao">
              <i class="pi pi-map-marker"></i>
              {{ item.localizacao || ('estoque.consultaQr.noLocation' | translate) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Resultado da Consulta -->
      <div class="result-section" *ngIf="itemEncontrado">
        <div class="result-header">
          <div class="result-title">
            <i class="pi pi-check-circle success-icon"></i>
            <h2>{{ 'estoque.consultaQr.found.title' | translate }}</h2>
          </div>
          <p-tag [value]="getStatusLabel(itemEncontrado.status)" 
                 [severity]="getStatusSeverity(itemEncontrado.status)">
          </p-tag>
        </div>

        <div class="result-grid">
          <!-- Card Principal - Identificação -->
          <div class="result-card main-card">
            <div class="card-header">
              <i class="pi pi-box"></i>
              <h3>{{ 'estoque.consultaQr.section.identification' | translate }}</h3>
            </div>
            <div class="card-content">
              <div class="info-row highlight">
                <label>{{ 'estoque.consultaQr.label.traceCode' | translate }}</label>
                <span class="codigo-rastreio">{{ itemEncontrado.codigoRastreio }}</span>
              </div>
              <div class="info-row">
                <label>{{ 'estoque.consultaQr.label.partNumber' | translate }}</label>
                <span class="pn">{{ itemEncontrado.partNumber }}</span>
              </div>
              <div class="info-row" *ngIf="itemEncontrado.serialNumber">
                <label>{{ 'estoque.consultaQr.label.serialNumber' | translate }}</label>
                <span>{{ itemEncontrado.serialNumber }}</span>
              </div>
              <div class="info-row" *ngIf="itemEncontrado.descricao">
                <label>{{ 'estoque.consultaQr.label.description' | translate }}</label>
                <span>{{ itemEncontrado.descricao }}</span>
              </div>
              <div class="info-row">
                <label>{{ 'estoque.consultaQr.label.quantity' | translate }}</label>
                <span>{{ itemEncontrado.quantidade }} {{ itemEncontrado.unidade || 'UN' }}</span>
              </div>
            </div>
          </div>

          <!-- Card Rastreabilidade -->
          <div class="result-card">
            <div class="card-header">
              <i class="pi pi-map-marker"></i>
              <h3>{{ 'estoque.consultaQr.section.traceability' | translate }}</h3>
            </div>
            <div class="card-content">
              <div class="info-row">
                <label>{{ 'estoque.consultaQr.label.supplier' | translate }}</label>
                <span>{{ itemEncontrado.fornecedorNome || '-' }}</span>
              </div>
              <div class="info-row">
                <label>{{ 'estoque.consultaQr.label.supplierCode' | translate }}</label>
                <span>{{ itemEncontrado.fornecedorCodigo || '-' }}</span>
              </div>
              <div class="info-row">
                <label>{{ 'estoque.consultaQr.label.originCountry' | translate }}</label>
                <span class="pais">
                  <i class="pi pi-globe"></i>
                  {{ itemEncontrado.fornecedorPais || ('estoque.consultaQr.notInformed' | translate) }}
                </span>
              </div>
              <div class="info-row">
                <label>{{ 'estoque.consultaQr.label.invoice' | translate }}</label>
                <span>{{ itemEncontrado.invoiceNumero || '-' }}</span>
              </div>
              <div class="info-row">
                <label>{{ 'estoque.consultaQr.label.batch' | translate }}</label>
                <span>{{ itemEncontrado.loteCodigo || '-' }}</span>
              </div>
            </div>
          </div>

          <!-- Card Localização -->
          <div class="result-card">
            <div class="card-header">
              <i class="pi pi-warehouse"></i>
              <h3>{{ 'estoque.consultaQr.section.location' | translate }}</h3>
            </div>
            <div class="card-content">
              <div class="info-row">
                <label>{{ 'estoque.consultaQr.label.location' | translate }}</label>
                <span>{{ itemEncontrado.localizacao || ('estoque.consultaQr.undefined' | translate) }}</span>
              </div>
              <div class="info-row" *ngIf="itemEncontrado.prateleira">
                <label>{{ 'estoque.consultaQr.label.shelf' | translate }}</label>
                <span>{{ itemEncontrado.prateleira }}</span>
              </div>
              <div class="info-row" *ngIf="itemEncontrado.gaveta">
                <label>{{ 'estoque.consultaQr.label.drawer' | translate }}</label>
                <span>{{ itemEncontrado.gaveta }}</span>
              </div>
            </div>
          </div>

          <!-- Card Valores -->
          <div class="result-card">
            <div class="card-header">
              <i class="pi pi-dollar"></i>
              <h3>{{ 'estoque.consultaQr.section.values' | translate }}</h3>
            </div>
            <div class="card-content">
              <div class="info-row" *ngIf="itemEncontrado.valorUnitarioUsd">
                <label>{{ 'estoque.consultaQr.label.usd' | translate }}</label>
                <span class="valor">$ {{ itemEncontrado.valorUnitarioUsd | number:'1.2-2' }}</span>
              </div>
              <div class="info-row" *ngIf="itemEncontrado.valorUnitarioBrl">
                <label>{{ 'estoque.consultaQr.label.brl' | translate }}</label>
                <span class="valor">R$ {{ itemEncontrado.valorUnitarioBrl | number:'1.2-2' }}</span>
              </div>
            </div>
          </div>

          <!-- Card Certificação -->
          <div class="result-card" *ngIf="itemEncontrado.certificadoConformidade || itemEncontrado.dataValidade">
            <div class="card-header">
              <i class="pi pi-verified"></i>
              <h3>{{ 'estoque.consultaQr.section.certification' | translate }}</h3>
            </div>
            <div class="card-content">
              <div class="info-row" *ngIf="itemEncontrado.certificadoConformidade">
                <label>{{ 'estoque.consultaQr.label.certificate' | translate }}</label>
                <span>{{ itemEncontrado.certificadoConformidade }}</span>
              </div>
              <div class="info-row" *ngIf="itemEncontrado.dataFabricacao">
                <label>{{ 'estoque.consultaQr.label.manufactureDate' | translate }}</label>
                <span>{{ itemEncontrado.dataFabricacao | date:'dd/MM/yyyy' }}</span>
              </div>
              <div class="info-row" *ngIf="itemEncontrado.dataValidade">
                <label>{{ 'estoque.consultaQr.label.expiry' | translate }}</label>
                <span [class.vencido]="isVencido(itemEncontrado.dataValidade)">
                  {{ itemEncontrado.dataValidade | date:'dd/MM/yyyy' }}
                  <i class="pi pi-exclamation-triangle" *ngIf="isVencido(itemEncontrado.dataValidade)"></i>
                </span>
              </div>
              <div class="info-row" *ngIf="itemEncontrado.shelfLifeMeses">
                <label>{{ 'estoque.consultaQr.label.shelfLife' | translate }}</label>
                <span>{{ itemEncontrado.shelfLifeMeses }} {{ 'estoque.consultaQr.months' | translate }}</span>
              </div>
            </div>
          </div>

          <!-- Card Consumo (se consumido) -->
          <div class="result-card consumido-card" *ngIf="itemEncontrado.status === 'CONSUMIDO'">
            <div class="card-header">
              <i class="pi pi-check-circle"></i>
              <h3>{{ 'estoque.consultaQr.section.consumed' | translate }}</h3>
            </div>
            <div class="card-content">
              <div class="info-row">
                <label>{{ 'estoque.consultaQr.label.workOrder' | translate }}</label>
                <span class="os-link">{{ itemEncontrado.osId }}</span>
              </div>
              <div class="info-row">
                <label>{{ 'estoque.consultaQr.label.consumptionDate' | translate }}</label>
                <span>{{ itemEncontrado.dataConsumo | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Ações -->
        <div class="actions-section">
          <button pButton [label]="'estoque.consultaQr.printLabel' | translate" icon="pi pi-print" 
                  class="p-button-outlined"
                  (click)="abrirSeletorEtiqueta()">
          </button>
          <button pButton [label]="'estoque.consultaQr.viewHistory' | translate" icon="pi pi-history" 
                  class="p-button-text"
                  (click)="carregarHistorico()">
          </button>
          <span class="historico-flag" *ngIf="historicoExtendido">
            {{ 'estoque.consultaQr.history.extendedBadge' | translate:{ limit: historicoLimite } }}
          </span>
          <button
            pButton
            [label]="'estoque.rastreio.linkFromQr' | translate"
            icon="pi pi-shield"
            class="p-button-warning p-button-outlined"
            (click)="abrirRastreioCompleto()"></button>
        </div>
      </div>

      <!-- Modal Seletor de Etiqueta -->
      <p-dialog styleClass="as-hero-dialog etiqueta-dialog" [(visible)]="showEtiquetaDialog" 
                [header]="'estoque.consultaQr.dialog.labelSize' | translate" 
                [modal]="true"
                [style]="{width: '700px'}"
               >
        <div class="etiqueta-selector">
          <p class="selector-intro">
            <i class="pi pi-info-circle"></i>
            {{ 'estoque.consultaQr.dialog.labelIntro' | translate }}
          </p>
          
          <div class="etiqueta-options">
            <div *ngFor="let opt of opcoesEtiqueta" 
                 class="etiqueta-option"
                 [class.selected]="etiquetaSelecionada === opt.id"
                 (click)="etiquetaSelecionada = opt.id">
              <div class="option-preview" [style.width.px]="opt.previewWidth" [style.height.px]="opt.previewHeight">
                <div class="preview-content">
                  <span class="preview-qr" *ngIf="opt.temQr">QR</span>
                  <span class="preview-barcode" *ngIf="opt.temBarcode">|||</span>
                </div>
              </div>
              <div class="option-info">
                <h4>{{ ('estoque.consultaQr.labelOpt.' + opt.id + '.nome') | translate }}</h4>
                <span class="option-size">{{ ('estoque.consultaQr.labelOpt.' + opt.id + '.tamanho') | translate }}</span>
                <p class="option-desc">{{ ('estoque.consultaQr.labelOpt.' + opt.id + '.desc') | translate }}</p>
                <div class="option-features">
                  <span *ngIf="opt.temQr" class="feature"><i class="pi pi-qrcode"></i> {{ 'estoque.consultaQr.feature.qr' | translate }}</span>
                  <span *ngIf="opt.temBarcode" class="feature"><i class="pi pi-barcode"></i> {{ 'estoque.consultaQr.feature.barcode' | translate }}</span>
                  <span *ngIf="opt.temDetalhes" class="feature"><i class="pi pi-list"></i> {{ 'estoque.consultaQr.feature.details' | translate }}</span>
                </div>
              </div>
              <div class="option-check" *ngIf="etiquetaSelecionada === opt.id">
                <i class="pi pi-check-circle"></i>
              </div>
            </div>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button pButton [label]="'estoque.consultaQr.cancel' | translate" class="p-button-text" (click)="showEtiquetaDialog = false"></button>
          <button pButton [label]="'estoque.consultaQr.print' | translate" icon="pi pi-print" (click)="imprimirEtiquetaSelecionada('browser')"></button>
          <button pButton [label]="'estoque.etiqueta.print.menuThermal' | translate" icon="pi pi-print" class="p-button-outlined"
                  (click)="imprimirEtiquetaSelecionada('thermal')"></button>
        </ng-template>
      </p-dialog>

      <!-- Mensagem quando não encontrado -->
      <div class="not-found-section" *ngIf="naoEncontrado">
        <div class="not-found-icon">
          <i class="pi pi-exclamation-triangle"></i>
        </div>
        <h2>{{ 'estoque.consultaQr.notFound.title' | translate }}</h2>
        <p>{{ 'estoque.consultaQr.notFound.body' | translate }} <strong>{{ ultimoCodigo }}</strong></p>
        <p class="hint">{{ 'estoque.consultaQr.notFound.hint' | translate }}</p>
      </div>

      <!-- Dialog de Histórico -->
      <p-dialog styleClass="as-hero-dialog historico-dialog" [(visible)]="showHistoricoDialog" 
                [header]="'estoque.consultaQr.history.title' | translate" 
                [modal]="true"
                [style]="{width: historicoExtendido ? 'min(860px, 96vw)' : 'min(700px, 96vw)'}"
               >
        <div class="historico-content" *ngIf="movimentacoes.length > 0">
          <p-timeline [value]="movimentacoes" align="left">
            <ng-template pTemplate="content" let-mov>
              <div class="timeline-item">
                <div class="timeline-header">
                  <p-tag [value]="getMovimentacaoLabel(mov.tipoMovimentacao)" [severity]="getMovimentacaoSeverity(mov.tipoMovimentacao)"></p-tag>
                  <span class="timeline-date">{{ mov.dataMovimentacao | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
                <div class="timeline-body">
                  <p class="motivo">{{ mov.motivo || ('estoque.consultaQr.history.noDescription' | translate) }}</p>
                  <p class="usuario" *ngIf="mov.usuarioNome"><i class="pi pi-user"></i> {{ mov.usuarioNome }}</p>
                  <p class="quantidade" *ngIf="mov.quantidade">
                    {{ 'estoque.consultaQr.history.quantity' | translate }} {{ mov.quantidade }}
                  </p>
                  <p class="os-ref" *ngIf="historicoExtendido && mov.osId">
                    {{ 'estoque.consultaQr.history.osRef' | translate }} {{ mov.osId }}
                  </p>
                  <p class="loc-ref" *ngIf="historicoExtendido && (mov.localizacaoOrigem || mov.localizacaoDestino)">
                    {{ 'estoque.consultaQr.history.location' | translate }}
                    {{ mov.localizacaoOrigem || '—' }} → {{ mov.localizacaoDestino || '—' }}
                  </p>
                  <p class="obs-ref" *ngIf="historicoExtendido && mov.observacoes">{{ mov.observacoes }}</p>
                </div>
              </div>
            </ng-template>
          </p-timeline>
        </div>
        <div class="historico-empty" *ngIf="movimentacoes.length === 0 && !carregandoHistorico">
          <i class="pi pi-inbox"></i>
          <p>{{ 'estoque.consultaQr.history.empty' | translate }}</p>
        </div>
      </p-dialog>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; box-sizing: border-box; }
    .consulta-container {
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
      padding: 0;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
      
      .header-left {
        h1 {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 28px;
          color: #1e293b;
          margin: 0 0 8px;
          
          i {
            color: #0ea5e9;
          }
        }
        
        p {
          color: #64748b;
          margin: 0;
        }
      }
    }

    .search-section {
      margin-bottom: 32px;
    }

    .search-box {
      display: flex;
      gap: 24px;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border: 2px solid #e2e8f0;
      border-radius: 16px;
      padding: 32px;
      
      .search-icon {
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        
        i {
          font-size: 40px;
          color: white;
        }
      }
      
      .search-content {
        flex: 1;
        
        label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 12px;
        }
        
        .search-input-wrapper {
          display: flex;
          gap: 12px;
          
          .search-input {
            flex: 1;
            height: 50px;
            font-size: 16px;
            border-radius: 10px;
          }
        }
        
        .search-tips {
          display: flex;
          gap: 24px;
          margin-top: 16px;
          flex-wrap: wrap;
          
          .tip {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            color: #64748b;
            background: #f1f5f9;
            padding: 6px 12px;
            border-radius: 20px;
            
            i {
              color: #0ea5e9;
              font-size: 14px;
            }
          }
        }
      }
    }

    .multiple-items-section {
      background: #fffbeb;
      border: 1px solid #fbbf24;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
      
      .multiple-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 16px;
        
        i {
          color: #f59e0b;
          font-size: 20px;
        }
        
        h3 {
          margin: 0;
          color: #92400e;
          font-size: 16px;
        }
      }
      
      .items-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 12px;
      }
      
      .item-card {
        background: white;
        border: 2px solid #e2e8f0;
        border-radius: 10px;
        padding: 16px;
        cursor: pointer;
        transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
        
        &:hover {
          border-color: #0ea5e9;
          box-shadow: 0 4px 12px rgba(14, 165, 233, 0.15);
        }
        
        &.selected {
          border-color: #0ea5e9;
          background: #f0f9ff;
        }
        
        .item-status {
          margin-bottom: 8px;
        }
        
        .item-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 8px;
          
          .item-codigo {
            font-family: monospace;
            font-size: 12px;
            color: #0ea5e9;
            font-weight: 600;
          }
          
          .item-pn {
            font-weight: 600;
            color: #1e293b;
          }
          
          .item-sn {
            font-size: 13px;
            color: #64748b;
          }
        }
        
        .item-localizacao {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #64748b;
          
          i {
            color: #f59e0b;
          }
        }
      }
    }

    .result-section {
      .result-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        
        .result-title {
          display: flex;
          align-items: center;
          gap: 12px;
          
          .success-icon {
            font-size: 32px;
            color: #22c55e;
          }
          
          h2 {
            margin: 0;
            color: #1e293b;
          }
        }
      }
    }

    .result-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .result-card {
      background: white;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      
      .card-header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 16px 20px;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
        
        i {
          font-size: 18px;
          color: #0ea5e9;
        }
        
        h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #334155;
        }
      }
      
      .card-content {
        padding: 20px;
      }
      
      .info-row {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-bottom: 16px;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        label {
          font-size: 12px;
          font-weight: 500;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        span {
          font-size: 14px;
          color: #1e293b;
        }
        
        &.highlight {
          background: #f0f9ff;
          padding: 12px;
          border-radius: 8px;
          margin: -12px -12px 16px;
          
          .codigo-rastreio {
            font-family: 'Courier New', monospace;
            font-size: 16px;
            font-weight: 700;
            color: #0ea5e9;
          }
        }
        
        .pn {
          font-weight: 600;
          font-size: 16px;
        }
        
        .valor {
          font-weight: 600;
          color: #059669;
        }
        
        .pais {
          display: flex;
          align-items: center;
          gap: 6px;
          
          i {
            color: #0ea5e9;
          }
        }
        
        .vencido {
          color: #dc2626;
          font-weight: 600;
          
          i {
            margin-left: 6px;
          }
        }
        
        .os-link {
          color: #0ea5e9;
          font-weight: 600;
        }
      }
      
      &.main-card {
        grid-column: span 2;
      }
      
      &.consumido-card {
        border-color: #fbbf24;
        
        .card-header {
          background: #fef3c7;
          border-color: #fbbf24;
          
          i {
            color: #f59e0b;
          }
        }
      }
    }

    .historico-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      background: white;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      
      h3 {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 0;
        color: #334155;
        
        i {
          color: #0ea5e9;
        }
      }
    }

    .not-found-section {
      text-align: center;
      padding: 64px;
      background: #fef2f2;
      border: 2px dashed #fca5a5;
      border-radius: 16px;
      
      .not-found-icon {
        i {
          font-size: 64px;
          color: #f87171;
        }
      }
      
      h2 {
        margin: 24px 0 12px;
        color: #dc2626;
      }
      
      p {
        color: #64748b;
        margin: 0;
        
        strong {
          color: #1e293b;
        }
      }
      
      .hint {
        margin-top: 16px;
        font-size: 14px;
      }
    }

    .timeline-item {
      .timeline-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
        
        .timeline-date {
          font-size: 12px;
          color: #64748b;
        }
      }
      
      .timeline-body {
        .motivo {
          margin: 0 0 8px;
          color: #334155;
        }
        
        .usuario {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #64748b;
          margin: 0;
          
          i {
            font-size: 12px;
          }
        }
        
        .quantidade {
          font-size: 13px;
          color: #475569;
          margin: 4px 0 0;
        }
      }
    }

    .historico-empty {
      text-align: center;
      padding: 48px;
      color: #64748b;
      
      i {
        font-size: 48px;
        display: block;
        margin-bottom: 16px;
      }
    }

    .actions-section {
      display: flex;
      justify-content: center;
      gap: 16px;
      padding: 20px;
      background: #f8fafc;
      border-radius: 12px;
      margin-top: 24px;
    }

    /* Seletor de Etiqueta */
    .etiqueta-selector {
      .selector-intro {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #64748b;
        font-size: 14px;
        margin-bottom: 20px;
        padding: 12px;
        background: #f0f9ff;
        border-radius: 8px;
        
        i { color: #0ea5e9; }
      }
    }

    .etiqueta-options {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .etiqueta-option {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 16px;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      cursor: pointer;
      transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
      
      &:hover {
        border-color: #0ea5e9;
        background: #f8fafc;
      }
      
      &.selected {
        border-color: #0ea5e9;
        background: #f0f9ff;
      }
      
      .option-preview {
        background: white;
        border: 1px solid #cbd5e1;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        
        .preview-content {
          display: flex;
          gap: 4px;
          align-items: center;
          font-size: 10px;
          color: #64748b;
          
          .preview-qr {
            width: 20px;
            height: 20px;
            background: #1e293b;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 8px;
            border-radius: 2px;
          }
          
          .preview-barcode {
            font-family: monospace;
            font-weight: bold;
            letter-spacing: -1px;
          }
        }
      }
      
      .option-info {
        flex: 1;
        
        h4 {
          margin: 0 0 4px;
          font-size: 16px;
          color: #1e293b;
        }
        
        .option-size {
          font-size: 13px;
          color: #0ea5e9;
          font-weight: 600;
        }
        
        .option-desc {
          margin: 8px 0;
          font-size: 13px;
          color: #64748b;
        }
        
        .option-features {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          
          .feature {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 11px;
            color: #475569;
            background: #f1f5f9;
            padding: 4px 8px;
            border-radius: 4px;
            
            i { font-size: 12px; color: #0ea5e9; }
          }
        }
      }
      
      .option-check {
        i {
          font-size: 24px;
          color: #0ea5e9;
        }
      }
    }

    @media (max-width: 768px) {
      .search-box {
        flex-direction: column;
        align-items: center;
        text-align: center;
        
        .search-content {
          width: 100%;
          
          .search-input-wrapper {
            flex-direction: column;
          }
        }
      }
      
      .result-card.main-card {
        grid-column: span 1;
      }
    }
  `]
})
export class ConsultaQrComponent implements OnInit, OnDestroy {
  @ViewChild('codigoInput') codigoInput!: ElementRef;
  
  private estoqueService = inject(EstoqueService);
  private messageService = inject(MessageService);
  private etiquetaPrint = inject(EtiquetaPrintService);
  private i18n = inject(TranslationService);
  private branding = inject(BrandingService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private qrOrigin = inject(EstoqueQrOriginService);

  private printCtx(): EtiquetaPrintContext {
    return buildEtiquetaPrintContext(this.i18n, this.branding, this.appLogoDataUri);
  }

  codigoBusca = '';
  buscando = false;
  itemEncontrado: ItemEstoque | null = null;
  itensEncontrados: ItemEstoque[] = [];
  naoEncontrado = false;
  ultimoCodigo = '';
  
  showHistoricoDialog = false;
  movimentacoes: MovimentacaoEstoque[] = [];
  readonly appLogoDataUri = getDefaultAppLogoUrlAbsolute();
  carregandoHistorico = false;
  historicoExtendido = false;
  historicoLimite = 50;

  // Seletor de Etiquetas
  showEtiquetaDialog = false;
  etiquetaSelecionada = 'padrao';
  
  opcoesEtiqueta: OpcaoEtiqueta[] = [
    {
      id: 'completa',
      larguraMm: 100,
      alturaMm: 80,
      previewWidth: 100,
      previewHeight: 80,
      temQr: true,
      temBarcode: true,
      temDetalhes: true
    },
    {
      id: 'padrao',
      larguraMm: 100,
      alturaMm: 45,
      previewWidth: 100,
      previewHeight: 45,
      temQr: true,
      temBarcode: true,
      temDetalhes: false
    },
    {
      id: 'media',
      larguraMm: 80,
      alturaMm: 40,
      previewWidth: 80,
      previewHeight: 40,
      temQr: true,
      temBarcode: false,
      temDetalhes: false
    },
    {
      id: 'compacta',
      larguraMm: 60,
      alturaMm: 40,
      previewWidth: 60,
      previewHeight: 40,
      temQr: true,
      temBarcode: false,
      temDetalhes: false
    },
    {
      id: 'minima',
      larguraMm: 40,
      alturaMm: 30,
      previewWidth: 40,
      previewHeight: 30,
      temQr: true,
      temBarcode: false,
      temDetalhes: false
    }
  ];

  ngOnInit() {
    this.estoqueService.consultaQrRegras().subscribe({
      next: (r) => {
        this.historicoExtendido = !!r.historicoExtendido;
        this.historicoLimite = r.historicoLimite || 50;
      },
      error: () => {}
    });

    const codQuery = this.route.snapshot.queryParamMap.get('cod');
    if (codQuery?.trim()) {
      this.codigoBusca = decodeURIComponent(codQuery.trim());
      this.buscar();
    }
    setTimeout(() => {
      this.codigoInput?.nativeElement?.focus();
    }, 100);
  }

  private tenantForQr(): string {
    return this.auth.getStoredTenantCodigo();
  }

  ngOnDestroy() {
  }

  buscar() {
    if (!this.codigoBusca.trim()) {
      toastKey(this.messageService, this.i18n, 'warn', 'estoque.consultaQr.toast.warnSummary', 'estoque.consultaQr.toast.warnEmpty');
      return;
    }

    this.buscando = true;
    this.naoEncontrado = false;
    this.itemEncontrado = null;
    this.itensEncontrados = [];
    const codigo = normalizeEstoqueScanInput(this.codigoBusca);
    this.codigoBusca = codigo;
    this.ultimoCodigo = codigo;

    // O backend agora busca por qualquer código (rastreio, PN ou SN)
    this.estoqueService.consultarPorCodigo(codigo).subscribe({
      next: (item) => {
        this.buscando = false;
        this.itemEncontrado = item;
        this.itensEncontrados = [item];
        
        // Se parece ser um Part Number, buscar se há mais itens
        if (!this.codigoBusca.toUpperCase().startsWith('BLW-')) {
          this.buscarMaisPorPartNumber(item.partNumber);
        }
        this.buscarMaisPorInvoiceSeAplicavel(item);

        toastKey(this.messageService, this.i18n, 'success', 'estoque.consultaQr.toast.foundSummary', 'estoque.consultaQr.toast.foundDetail', {
          pn: item.partNumber
        });
      },
      error: (err) => {
        this.buscando = false;
        this.naoEncontrado = true;
        console.error('Failed to fetch item:', err);
      }
    });
  }

  buscarMaisPorPartNumber(partNumber?: string) {
    if (!partNumber) return;
    
    this.estoqueService.buscarPorPartNumber(partNumber).subscribe({
      next: (result) => {
        if (result.content && result.content.length > 1) {
          this.itensEncontrados = result.content;
        }
      },
      error: () => {
        // Ignora erro, mantém item único encontrado
      }
    });
  }

  /** Se o termo bate com a invoice (e não é match exato de P/N, S/N ou rastreio), lista todos os itens da mesma invoice. */
  private buscarMaisPorInvoiceSeAplicavel(item: ItemEstoque): void {
    const q = this.codigoBusca.trim();
    if (!q || q.length < 2 || !item.invoiceId || !item.invoiceNumero) return;
    const ql = q.toLowerCase();
    const pnEq = item.partNumber?.toLowerCase() === ql;
    const snEq = item.serialNumber?.toLowerCase() === ql;
    const crEq = item.codigoRastreio?.toLowerCase() === ql;
    if (pnEq || snEq || crEq) return;
    if (!item.invoiceNumero.toLowerCase().includes(ql)) return;

    this.estoqueService.listarItensEstoque({ page: 0, size: 500, invoiceId: item.invoiceId }).subscribe({
      next: (result) => {
        if (result.content && result.content.length > 1) {
          this.itensEncontrados = result.content;
        }
      },
      error: () => {}
    });
  }

  selecionarItem(item: ItemEstoque) {
    // Busca detalhes completos do item
    this.estoqueService.buscarItemEstoque(item.id!).subscribe({
      next: (detalhe) => {
        this.itemEncontrado = detalhe;
      },
      error: () => {
        this.itemEncontrado = item;
      }
    });
  }

  limpar() {
    this.codigoBusca = '';
    this.itemEncontrado = null;
    this.itensEncontrados = [];
    this.naoEncontrado = false;
    this.codigoInput?.nativeElement?.focus();
  }

  getStatusLabel(status?: string): string {
    if (!status) return '';
    return this.i18n.translateCatalog('estoque.itens.status', status, status);
  }

  getStatusSeverity(status?: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    const severities: { [key: string]: 'success' | 'info' | 'warning' | 'danger' | 'secondary' } = {
      'DISPONIVEL': 'success',
      'RESERVADO': 'info',
      'EM_USO': 'warning',
      'CONSUMIDO': 'secondary',
      'DEVOLVIDO': 'info',
      'DESCARTADO': 'danger',
      'BLOQUEADO': 'danger',
      'QUARENTENA': 'warning'
    };
    return severities[status || ''] || 'secondary';
  }

  getMovimentacaoLabel(tipo?: string): string {
    if (!tipo) return '';
    return this.i18n.translateCatalog('movimentacao.tipo', tipo, tipo);
  }

  getMovimentacaoSeverity(tipo?: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    const severities: { [key: string]: 'success' | 'info' | 'warning' | 'danger' | 'secondary' } = {
      'ENTRADA': 'success',
      'SAIDA': 'danger',
      'TRANSFERENCIA': 'info',
      'AJUSTE': 'warning',
      'DEVOLUCAO': 'info',
      'DESCARTE': 'danger',
      'QUARENTENA': 'warning',
      'LIBERACAO_QUARENTENA': 'success'
    };
    return severities[tipo || ''] || 'secondary';
  }

  isVencido(dataValidade?: string): boolean {
    if (!dataValidade) return false;
    return new Date(dataValidade) < new Date();
  }

  getQrCodeUrl(): string {
    if (!this.itemEncontrado?.id) return '';
    return this.estoqueService.getQrCodeUrl(this.itemEncontrado.id, 200);
  }

  abrirRastreioCompleto(): void {
    const codigo =
      this.itemEncontrado?.codigoRastreio?.trim() ||
      this.itemEncontrado?.serialNumber?.trim() ||
      this.itemEncontrado?.partNumber?.trim();
    if (!codigo) {
      return;
    }
    void this.router.navigate(['/estoque/rastreio'], { queryParams: { codigo } });
  }

  carregarHistorico() {
    if (!this.itemEncontrado?.id) return;
    
    this.carregandoHistorico = true;
    this.showHistoricoDialog = true;
    
    this.estoqueService.listarMovimentacoes({ itemId: this.itemEncontrado.id, size: this.historicoLimite }).subscribe({
      next: (result) => {
        this.movimentacoes = result.content;
        this.carregandoHistorico = false;
      },
      error: (err) => {
        this.carregandoHistorico = false;
        console.error('Failed to load history:', err);
      }
    });
  }

  abrirSeletorEtiqueta() {
    this.showEtiquetaDialog = true;
  }

  imprimirEtiquetaSelecionada(channel: ThermalPrintMode | 'browser' | 'thermal' = 'browser') {
    this.showEtiquetaDialog = false;
    this.imprimirEtiqueta(this.etiquetaSelecionada, channel);
  }

  async imprimirEtiqueta(tipo: string = 'padrao', channel: ThermalPrintMode | 'browser' | 'thermal' = 'browser') {
    if (!this.itemEncontrado) return;
    
    const item = this.itemEncontrado;
    const codigoRastreio = item.codigoRastreio || '';
    const partNumber = item.partNumber || '';
    const qrPx = tipo === 'padrao' ? 200 : 220;
    const qrCodeDataUrl = await this.getQrCodeDataUrl(item.id, qrPx);
    const scanOrigin = await this.qrOrigin.resolveOrigin();

    if (tipo === 'padrao') {
      const html = this.gerarEtiquetaPadrao(item, codigoRastreio, partNumber, qrCodeDataUrl);
      const ctx = this.printCtx();
      const L = ctx.labels;
      try {
        if (channel === 'browser') {
          this.etiquetaPrint.printPadraoBrowser(html);
          return;
        }
        await this.etiquetaPrint.printPadrao100x60(
          {
            headerLine: ctx.commercialName,
            codigoRastreio,
            partNumber,
            serialNumber: item.serialNumber,
            linhaExtra: item.localizacao ? `📍 ${item.localizacao}` : null,
            qrPayload: resolveEtiquetaQrPayload(item, this.tenantForQr(), scanOrigin),
            prefixPn: L.prefixPn,
            prefixSn: L.prefixSn
          },
          () => {
            const popupOk = openEtiquetaHtmlPrint(html);
            this.etiquetaPrint.notifyBrowserFallbackOpened(popupOk);
          },
          channel
        );
      } catch {
        /* toast já exibido */
      }
      return;
    }

    let html = '';
    
    switch (tipo) {
      case 'completa':
        html = this.gerarEtiquetaCompleta(item, codigoRastreio, partNumber, qrCodeDataUrl);
        break;
      case 'media':
        html = this.gerarEtiquetaMedia(item, codigoRastreio, partNumber, qrCodeDataUrl);
        break;
      case 'compacta':
        html = this.gerarEtiquetaCompacta(item, codigoRastreio, partNumber, qrCodeDataUrl);
        break;
      case 'minima':
        html = this.gerarEtiquetaMinima(item, codigoRastreio, partNumber, qrCodeDataUrl);
        break;
      default:
        html = this.gerarEtiquetaPadrao(item, codigoRastreio, partNumber, qrCodeDataUrl);
    }
    
    const popupOk = openEtiquetaHtmlPrint(html);
    if (!popupOk) {
      this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'estoque.etiqueta.print.popupBlocked');
    }
  }

  // ============ ETIQUETA COMPLETA 100x80mm ============
  gerarEtiquetaCompleta(item: ItemEstoque, codigoRastreio: string, partNumber: string, qrCodeUrl: string): string {
    return buildEtiquetaCompletaDocument(this.printCtx(), item, codigoRastreio, partNumber, qrCodeUrl);
  }

  /** Etiqueta padrão física: 100 mm × 60 mm */
  gerarEtiquetaPadrao(item: ItemEstoque, codigoRastreio: string, partNumber: string, qrCodeUrl: string): string {
    const ctx = this.printCtx();
    const L = ctx.labels;
    return buildEtiquetaPadrao100x45Document({
      appLogoDataUri: ctx.logoDataUri,
      commercialName: ctx.commercialName,
      codigoRastreio,
      partNumber,
      qrCodeDataUrl: qrCodeUrl,
      serialNumber: item.serialNumber,
      linhaExtra: item.localizacao ? `📍 ${item.localizacao}` : null,
      prefixPn: L.prefixPn,
      prefixSn: L.prefixSn,
      noQr: L.noQr,
      titleStandard: L.titleStandard
    });
  }

  // ============ ETIQUETA MÉDIA 80x40mm ============
  gerarEtiquetaMedia(item: ItemEstoque, codigoRastreio: string, partNumber: string, qrCodeUrl: string): string {
    return buildEtiquetaMediaDocument(this.printCtx(), item, codigoRastreio, partNumber, qrCodeUrl);
  }

  // ============ ETIQUETA COMPACTA 60x40mm ============
  gerarEtiquetaCompacta(item: ItemEstoque, codigoRastreio: string, partNumber: string, qrCodeUrl: string): string {
    return buildEtiquetaCompactaDocument(this.printCtx(), codigoRastreio, partNumber, qrCodeUrl);
  }

  // ============ ETIQUETA MÍNIMA 40x30mm ============
  gerarEtiquetaMinima(item: ItemEstoque, codigoRastreio: string, partNumber: string, qrCodeUrl: string): string {
    return buildEtiquetaMinimaDocument(this.printCtx(), codigoRastreio, partNumber, qrCodeUrl);
  }

  private async getQrCodeDataUrl(itemId?: number, tamanho: number = 220): Promise<string> {
    if (!itemId) return '';
    try {
      return await firstValueFrom(this.estoqueService.loadQrCodeDataUrl(itemId, tamanho));
    } catch {
      this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'estoque.etiqueta.print.qrLoadFailed');
      return '';
    }
  }
}
