import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { UsuarioExternoService, DocumentoExterno, OSExternaDetalhada } from '../../core/usuario-externo.service';
import { environment } from '../../../environments/environment';
import { TranslatePipe } from '../../core/translate.pipe';
import { TranslationService } from '../../core/translation.service';
import { formatUiDateTime } from '../../core/locale/locale-intl.util';
import { extractApiErrorMessage } from '../../core/backend-i18n-message.util';
import { toastKey } from '../../core/toast-i18n.util';

@Component({
  standalone: true,
  selector: 'app-externo-os-detail',
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    CardModule,
    TagModule,
    DividerModule,
    ProgressSpinnerModule,
    TooltipModule,
    DialogModule,
    ToastModule,
    TranslatePipe
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <div class="os-detail-container">
      <!-- Back Button -->
      <div class="back-nav">
        <button pButton icon="pi pi-arrow-left" [label]="'externo.osDetail.btnBack' | translate"
                class="p-button-text" routerLink="/externo/os"></button>
      </div>

      <!-- Loading -->
      <div class="loading-container" *ngIf="loading">
        <p-progressSpinner></p-progressSpinner>
        <p>{{ 'externo.osDetail.loading' | translate }}</p>
      </div>

      <!-- Error -->
      <div class="error-container" *ngIf="error">
        <i class="pi pi-exclamation-triangle error-icon"></i>
        <h3>{{ 'externo.osDetail.errorTitle' | translate }}</h3>
        <p>{{ error }}</p>
        <button pButton [label]="'externo.osDetail.btnRetry' | translate" (click)="loadOS()"></button>
      </div>

      <!-- OS Detail -->
      <div class="os-detail" *ngIf="!loading && !error && os">
        <!-- Header -->
        <div class="detail-header">
          <div class="header-info">
            <h1>{{ osDetailTitle }}</h1>
            <p-tag [value]="getStatusLabel(os.status)" [severity]="getStatusSeverity(os.status)" class="status-tag"></p-tag>
          </div>
          <div class="header-actions">
            <span class="read-only-badge">
              <i class="pi pi-eye"></i>
              {{ 'externo.osDetail.readOnlyBadge' | translate }}
            </span>
          </div>
        </div>

        <!-- Timeline -->
        <div class="timeline-section">
          <h2>
            <i class="pi pi-history"></i>
            {{ 'externo.osDetail.timeline.title' | translate }}
          </h2>
          <div class="timeline">
            <div class="timeline-step" [class.done]="!!os.dtAbertura" [class.active]="!!os.dtAbertura && !os.dataConclusaoServ">
              <div class="timeline-marker"></div>
              <div class="timeline-content">
                <strong>{{ 'externo.osDetail.timeline.open' | translate }}</strong>
                <span>{{ os.dtAbertura ? formatDate(os.dtAbertura) : ('externo.osDetail.timeline.pending' | translate) }}</span>
              </div>
            </div>
            <div class="timeline-step" [class.done]="!!os.dataConclusaoServ" [class.active]="!!os.dataConclusaoServ && !os.dataFechamento">
              <div class="timeline-marker"></div>
              <div class="timeline-content">
                <strong>{{ 'externo.osDetail.timeline.conclusion' | translate }}</strong>
                <span>{{ os.dataConclusaoServ ? formatDate(os.dataConclusaoServ) : ('externo.osDetail.timeline.pending' | translate) }}</span>
              </div>
            </div>
            <div class="timeline-step" [class.done]="!!os.dataFechamento" [class.active]="!!os.dataFechamento">
              <div class="timeline-marker"></div>
              <div class="timeline-content">
                <strong>{{ 'externo.osDetail.timeline.close' | translate }}</strong>
                <span>{{ os.dataFechamento ? formatDate(os.dataFechamento) : ('externo.osDetail.timeline.pending' | translate) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="proposta-origin" *ngIf="os.propostaId">
          <h2>
            <i class="pi pi-file"></i>
            {{ 'externo.osDetail.propostaOrigin.title' | translate }}
          </h2>
          <button pButton type="button" icon="pi pi-external-link" class="p-button-outlined"
                  [label]="propostaOriginLabel"
                  [routerLink]="['/externo/propostas', os.propostaId]"></button>
        </div>

        <!-- Info Cards -->
        <div class="info-grid">
          <!-- Cliente Info -->
          <div class="info-card">
            <div class="info-card-header">
              <i class="pi pi-user"></i>
              <h3>{{ 'externo.osDetail.section.client' | translate }}</h3>
            </div>
            <div class="info-card-body">
              <div class="info-item">
                <label>{{ 'externo.osDetail.field.clientName' | translate }}</label>
                <span>{{ os.clienteNome || '-' }}</span>
              </div>
            </div>
          </div>

          <!-- Produto Info -->
          <div class="info-card">
            <div class="info-card-header">
              <i class="pi pi-box"></i>
              <h3>{{ 'externo.osDetail.section.product' | translate }}</h3>
            </div>
            <div class="info-card-body">
              <div class="info-item">
                <label>{{ 'externo.osDetail.field.partNumber' | translate }}</label>
                <span>{{ os.partNumber || '-' }}</span>
              </div>
              <div class="info-item">
                <label>{{ 'externo.osDetail.field.serialNumber' | translate }}</label>
                <span>{{ os.serialNumber || '-' }}</span>
              </div>
              <div class="info-item">
                <label>{{ 'externo.osDetail.field.manufacturer' | translate }}</label>
                <span>{{ os.fabricanteNome || '-' }}</span>
              </div>
              <div class="info-item">
                <label>{{ 'externo.osDetail.field.fcuModel' | translate }}</label>
                <span>{{ os.modeloFcu || '-' }}</span>
              </div>
            </div>
          </div>

          <!-- Serviço Info -->
          <div class="info-card">
            <div class="info-card-header">
              <i class="pi pi-cog"></i>
              <h3>{{ 'externo.osDetail.section.service' | translate }}</h3>
            </div>
            <div class="info-card-body">
              <div class="info-item">
                <label>{{ 'externo.osDetail.field.serviceType' | translate }}</label>
                <span>{{ os.tipoServico || '-' }}</span>
              </div>
              <div class="info-item">
                <label>{{ 'externo.osDetail.field.tsn' | translate }}</label>
                <span>{{ os.tsn || '-' }}</span>
              </div>
              <div class="info-item">
                <label>{{ 'externo.osDetail.field.tso' | translate }}</label>
                <span>{{ os.tso || '-' }}</span>
              </div>
            </div>
          </div>

          <!-- Datas -->
          <div class="info-card">
            <div class="info-card-header">
              <i class="pi pi-calendar"></i>
              <h3>{{ 'externo.osDetail.section.dates' | translate }}</h3>
            </div>
            <div class="info-card-body">
              <div class="info-item">
                <label>{{ 'externo.osDetail.field.openDate' | translate }}</label>
                <span>{{ formatDate(os.dtAbertura) }}</span>
              </div>
              <div class="info-item" *ngIf="os.dataConclusaoServ">
                <label>{{ 'externo.osDetail.field.conclusionDate' | translate }}</label>
                <span>{{ formatDate(os.dataConclusaoServ) }}</span>
              </div>
              <div class="info-item" *ngIf="os.dataFechamento">
                <label>{{ 'externo.osDetail.field.closeDate' | translate }}</label>
                <span>{{ formatDate(os.dataFechamento) }}</span>
              </div>
            </div>
          </div>

          <!-- Manual Info -->
          <div class="info-card" *ngIf="os.ataManual || os.numRevisao || os.dataRevManual">
            <div class="info-card-header">
              <i class="pi pi-book"></i>
              <h3>{{ 'externo.osDetail.section.manual' | translate }}</h3>
            </div>
            <div class="info-card-body">
              <div class="info-item" *ngIf="os.ataManual">
                <label>{{ 'externo.osDetail.field.ataManual' | translate }}</label>
                <span>{{ os.ataManual }}</span>
              </div>
              <div class="info-item" *ngIf="os.numRevisao">
                <label>{{ 'externo.osDetail.field.revNumber' | translate }}</label>
                <span>{{ os.numRevisao }}</span>
              </div>
              <div class="info-item" *ngIf="os.dataRevManual">
                <label>{{ 'externo.osDetail.field.revDate' | translate }}</label>
                <span>{{ formatDate(os.dataRevManual) }}</span>
              </div>
            </div>
          </div>

          <!-- ADS/DAS Info -->
          <div class="info-card" *ngIf="os.adsDas || os.tituloAds || os.tituloAfins">
            <div class="info-card-header">
              <i class="pi pi-file"></i>
              <h3>{{ 'externo.osDetail.section.ads' | translate }}</h3>
            </div>
            <div class="info-card-body">
              <div class="info-item full-width" *ngIf="os.adsDas">
                <label>{{ 'externo.osDetail.field.adsDas' | translate }}</label>
                <span>{{ os.adsDas }}</span>
              </div>
              <div class="info-item" *ngIf="os.tituloAds">
                <label>{{ 'externo.osDetail.field.adsTitle' | translate }}</label>
                <span>{{ os.tituloAds }}</span>
              </div>
              <div class="info-item" *ngIf="os.tituloAfins">
                <label>{{ 'externo.osDetail.field.relatedTitle' | translate }}</label>
                <span>{{ os.tituloAfins }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Observações -->
        <div class="observations-section" *ngIf="os.obsConclusaoServ || os.boletinsServAfins">
          <h2>
            <i class="pi pi-comment"></i>
            {{ 'externo.osDetail.section.observations' | translate }}
          </h2>
          
          <div class="obs-card" *ngIf="os.obsConclusaoServ">
            <h4>{{ 'externo.osDetail.obs.conclusion' | translate }}</h4>
            <p>{{ os.obsConclusaoServ }}</p>
          </div>
          
          <div class="obs-card" *ngIf="os.boletinsServAfins">
            <h4>{{ 'externo.osDetail.obs.bulletins' | translate }}</h4>
            <p>{{ os.boletinsServAfins }}</p>
          </div>
        </div>

        <!-- Documentos -->
        <div class="documents-section" *ngIf="os.documentos && os.documentos.length > 0">
          <h2>
            <i class="pi pi-folder-open"></i>
            {{ 'externo.osDetail.documents.title' | translate:{ count: os.documentos.length + '' } }}
          </h2>
          
          <div class="docs-list">
            <div class="doc-item" *ngFor="let doc of os.documentos" [class.doc-avulso]="doc.isAvulso">
              <div class="doc-icon" [ngClass]="getFileIconClass(doc.tipoArquivo)">
                <i [class]="getFileIcon(doc.tipoArquivo)"></i>
              </div>
              <div class="doc-info">
                <div class="doc-name-row">
                  <span class="doc-name">{{ doc.nomeArquivo }}</span>
                  <span class="avulso-badge" *ngIf="doc.isAvulso"
                        [pTooltip]="'externo.osDetail.doc.avulsoTooltip' | translate"
                        tooltipPosition="top">
                    <i class="pi pi-paperclip"></i>
                    <span class="badge-text">{{ 'externo.osDetail.doc.avulsoBadge' | translate }}</span>
                  </span>
                </div>
                <span class="doc-desc" *ngIf="doc.descricao">{{ doc.descricao }}</span>
              </div>
              <div class="doc-actions">
                <button pButton icon="pi pi-download" 
                        class="p-button-text p-button-sm doc-action-btn"
                        *ngIf="doc.podeDownload"
                        [pTooltip]="'externo.osDetail.doc.download' | translate"
                        (click)="downloadDocumento(doc); $event.stopPropagation()">
                </button>
                <button pButton icon="pi pi-eye" 
                        class="p-button-text p-button-sm doc-action-btn"
                        [pTooltip]="'externo.osDetail.doc.view' | translate"
                        (click)="visualizarDocumento(doc); $event.stopPropagation()">
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Sem documentos -->
        <div class="no-documents" *ngIf="!os.documentos || os.documentos.length === 0">
          <i class="pi pi-folder-open"></i>
          <p>{{ 'externo.osDetail.documents.empty' | translate }}</p>
        </div>
      </div>
    </div>

    <!-- Dialog de Visualização de Documento -->
    <p-dialog styleClass="as-hero-dialog doc-viewer-dialog" [(visible)]="showDocViewer" 
              [header]="docViewerTitle"
              [modal]="true"
              [style]="{width: '90vw', height: '90vh'}"
              [contentStyle]="{height: 'calc(90vh - 60px)', padding: '0'}"
              [maximizable]="true"
              [draggable]="false"
              (onHide)="onDocViewerClose()"
             >
      <div class="doc-viewer-content" style="height: 100%;">
        <iframe *ngIf="docViewerUrl" 
                [src]="docViewerUrl" 
                class="doc-iframe"
                style="width: 100%; height: 100%; border: none;"
                (error)="onIframeError($event)"
                (load)="onIframeLoad($event)">
        </iframe>
        <div class="doc-viewer-loading" *ngIf="!docViewerUrl">
          <p-progressSpinner strokeWidth="3"></p-progressSpinner>
          <span>{{ 'externo.osDetail.docViewer.loading' | translate }}</span>
        </div>
      </div>
    </p-dialog>
  `,
  styles: [`
    .os-detail-container {
      padding: 20px;
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
      
      @media (max-width: 768px) {
        padding: 12px;
      }
      
      @media (max-width: 480px) {
        padding: 8px;
      }
    }

    .back-nav {
      margin-bottom: 20px;
      
      @media (max-width: 768px) {
        margin-bottom: 16px;
      }
      
      @media (max-width: 480px) {
        margin-bottom: 12px;
      }
      
      button {
        @media (max-width: 480px) {
          padding: 8px 12px !important;
          font-size: 13px !important;
        }
      }
    }

    .loading-container,
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 20px;
      text-align: center;
      min-height: 300px;
      
      @media (max-width: 768px) {
        padding: 60px 16px;
        min-height: 250px;
      }
      
      @media (max-width: 480px) {
        padding: 40px 12px;
        min-height: 200px;
      }
    }

    .error-icon {
      font-size: 64px;
      color: #ef4444;
      margin-bottom: 16px;
      
      @media (max-width: 768px) {
        font-size: 48px;
        margin-bottom: 12px;
      }
      
      @media (max-width: 480px) {
        font-size: 40px;
        margin-bottom: 10px;
      }
    }

    .error-container h3 {
      color: #334155;
      margin: 0 0 8px;
      font-size: 18px;
      
      @media (max-width: 768px) {
        font-size: 16px;
        margin-bottom: 6px;
      }
      
      @media (max-width: 480px) {
        font-size: 15px;
        margin-bottom: 4px;
      }
    }

    .error-container p {
      color: #64748b;
      margin: 0 0 24px;
      font-size: 14px;
      
      @media (max-width: 768px) {
        font-size: 13px;
        margin-bottom: 16px;
      }
      
      @media (max-width: 480px) {
        font-size: 12px;
        margin-bottom: 12px;
        line-height: 1.5;
      }
    }

    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      padding: 24px;
      background: #fff;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      gap: 16px;
      flex-wrap: wrap;
      
      @media (max-width: 768px) {
        padding: 16px;
        margin-bottom: 20px;
        border-radius: 12px;
        flex-direction: column;
        align-items: flex-start;
      }
      
      @media (max-width: 480px) {
        padding: 12px;
        margin-bottom: 16px;
        border-radius: 10px;
      }
    }

    .header-info h1 {
      font-size: 28px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 12px;
      word-wrap: break-word;
      overflow-wrap: break-word;
      
      @media (max-width: 768px) {
        font-size: 22px;
        margin-bottom: 10px;
      }
      
      @media (max-width: 480px) {
        font-size: 20px;
        margin-bottom: 8px;
        line-height: 1.3;
      }
    }

    .status-tag {
      font-size: 14px;
    }

    .read-only-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #f1f5f9;
      color: #64748b;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;

      i {
        font-size: 16px;
      }
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
      
      @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 16px;
        margin-bottom: 20px;
      }
      
      @media (max-width: 480px) {
        gap: 12px;
        margin-bottom: 16px;
      }
    }

    .info-card {
      background: #fff;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      width: 100%;
      box-sizing: border-box;
      
      @media (max-width: 768px) {
        border-radius: 12px;
      }
      
      @media (max-width: 480px) {
        border-radius: 10px;
      }
    }

    .info-card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      flex-wrap: wrap;
      
      @media (max-width: 768px) {
        padding: 14px 16px;
      }
      
      @media (max-width: 480px) {
        padding: 12px;
        gap: 8px;
      }

      i {
        font-size: 20px;
        color: #0ea5e9;
        flex-shrink: 0;
        
        @media (max-width: 480px) {
          font-size: 18px;
        }
      }

      h3 {
        font-size: 16px;
        font-weight: 600;
        color: #0f172a;
        margin: 0;
        word-wrap: break-word;
        overflow-wrap: break-word;
        
        @media (max-width: 768px) {
          font-size: 15px;
        }
        
        @media (max-width: 480px) {
          font-size: 14px;
          line-height: 1.3;
        }
      }
    }

    .info-card-body {
      padding: 20px;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      
      @media (max-width: 768px) {
        padding: 16px;
        gap: 14px;
      }
      
      @media (max-width: 480px) {
        grid-template-columns: 1fr;
        padding: 12px;
        gap: 12px;
      }
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
      overflow: hidden;

      &.full-width {
        grid-column: span 2;
        
        @media (max-width: 480px) {
          grid-column: span 1;
        }
      }

      label {
        font-size: 12px;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        
        @media (max-width: 480px) {
          font-size: 11px;
        }
      }

      span {
        font-size: 15px;
        color: #334155;
        font-weight: 500;
        word-wrap: break-word;
        overflow-wrap: break-word;
        line-height: 1.4;
        
        @media (max-width: 768px) {
          font-size: 14px;
        }
        
        @media (max-width: 480px) {
          font-size: 13px;
          line-height: 1.5;
        }
      }
    }

    .observations-section,
    .documents-section {
      background: #fff;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      padding: 24px;
      margin-bottom: 20px;
      width: 100%;
      box-sizing: border-box;
      
      @media (max-width: 768px) {
        padding: 16px;
        margin-bottom: 16px;
        border-radius: 12px;
      }
      
      @media (max-width: 480px) {
        padding: 12px;
        margin-bottom: 12px;
        border-radius: 10px;
      }

      h2 {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 18px;
        font-weight: 600;
        color: #0f172a;
        margin: 0 0 20px;
        flex-wrap: wrap;
        
        @media (max-width: 768px) {
          font-size: 16px;
          margin-bottom: 16px;
          gap: 10px;
        }
        
        @media (max-width: 480px) {
          font-size: 15px;
          margin-bottom: 12px;
          gap: 8px;
        }

        i {
          color: #0ea5e9;
          flex-shrink: 0;
          
          @media (max-width: 480px) {
            font-size: 16px;
          }
        }
      }
    }

    .obs-card {
      background: #f8fafc;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
      width: 100%;
      box-sizing: border-box;

      &:last-child {
        margin-bottom: 0;
      }
      
      @media (max-width: 768px) {
        padding: 16px;
        border-radius: 10px;
        margin-bottom: 12px;
      }
      
      @media (max-width: 480px) {
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 10px;
      }

      h4 {
        font-size: 14px;
        font-weight: 600;
        color: #334155;
        margin: 0 0 8px;
        word-wrap: break-word;
        overflow-wrap: break-word;
        
        @media (max-width: 768px) {
          font-size: 13px;
          margin-bottom: 6px;
        }
        
        @media (max-width: 480px) {
          font-size: 12px;
          margin-bottom: 4px;
          line-height: 1.3;
        }
      }

      p {
        font-size: 14px;
        color: #64748b;
        margin: 0;
        line-height: 1.6;
        white-space: pre-wrap;
        word-wrap: break-word;
        overflow-wrap: break-word;
        
        @media (max-width: 768px) {
          font-size: 13px;
          line-height: 1.5;
        }
        
        @media (max-width: 480px) {
          font-size: 12px;
          line-height: 1.4;
        }
      }
    }

    .docs-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;
      
      @media (max-width: 480px) {
        gap: 10px;
      }
    }

    .doc-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: #f8fafc;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
      width: 100%;
      box-sizing: border-box;
      overflow: hidden;
      
      @media (max-width: 768px) {
        padding: 14px;
        gap: 12px;
        border-radius: 10px;
      }
      
      @media (max-width: 480px) {
        padding: 12px;
        gap: 10px;
        border-radius: 8px;
        flex-wrap: wrap;
      }

      &:hover {
        border-color: #0ea5e9;
        box-shadow: 0 4px 12px rgba(14, 165, 233, 0.1);
        
        @media (max-width: 768px) {
          box-shadow: none;
        }
        
        @media (max-width: 480px) {
          border-color: #0ea5e9;
        }
      }
      
      &:active {
        @media (max-width: 768px) {
          transform: scale(0.98);
        }
      }
    }
    
    .doc-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
      
      @media (max-width: 480px) {
        width: 100%;
        justify-content: flex-end;
        order: 2;
        gap: 12px;
        padding-top: 8px;
        border-top: 1px solid #e2e8f0;
        margin-top: 8px;
      }
    }
    
    .doc-action-btn {
      @media (max-width: 480px) {
        padding: 10px 16px !important;
        min-width: 100px;
      }
    }

    .doc-icon {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      
      @media (max-width: 768px) {
        width: 44px;
        height: 44px;
        border-radius: 8px;
      }
      
      @media (max-width: 480px) {
        width: 40px;
        height: 40px;
        border-radius: 6px;
      }

      &.pdf {
        background: rgba(239, 68, 68, 0.1);
        i { color: #ef4444; }
      }
      &.doc, &.docx {
        background: rgba(59, 130, 246, 0.1);
        i { color: #3b82f6; }
      }
      &.xls, &.xlsx {
        background: rgba(34, 197, 94, 0.1);
        i { color: #22c55e; }
      }
      &.img {
        background: rgba(168, 85, 247, 0.1);
        i { color: #a855f7; }
      }
      &.default {
        background: rgba(14, 165, 233, 0.1);
        i { color: #0ea5e9; }
      }

      i {
        font-size: 24px;
      }
    }

    .doc-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
      overflow: hidden;
      
      @media (max-width: 480px) {
        width: 100%;
        order: 1;
      }
    }

    .doc-name-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      width: 100%;
      
      @media (max-width: 480px) {
        gap: 6px;
      }
    }

    .doc-name {
      font-size: 14px;
      font-weight: 600;
      color: #334155;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
      min-width: 0;
      
      @media (max-width: 768px) {
        font-size: 13px;
        white-space: normal;
        word-wrap: break-word;
        overflow-wrap: break-word;
        line-height: 1.4;
      }
      
      @media (max-width: 480px) {
        font-size: 12px;
        line-height: 1.3;
        width: 100%;
      }
    }

    .avulso-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      font-size: 11px;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
      flex-shrink: 0;
      white-space: nowrap;
      transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
      
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
      }
      
      i {
        font-size: 12px;
        font-weight: bold;
      }
      
      .badge-text {
        letter-spacing: 0.2px;
      }
    }

    .doc-item.doc-avulso {
      border-left: 3px solid #3b82f6;
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, #f8fafc 100%);
    }

    .doc-desc {
      font-size: 13px;
      color: #64748b;
      word-wrap: break-word;
      overflow-wrap: break-word;
      
      @media (max-width: 768px) {
        font-size: 12px;
        line-height: 1.4;
      }
      
      @media (max-width: 480px) {
        font-size: 11px;
        line-height: 1.3;
      }
    }

    .no-documents {
      text-align: center;
      padding: 40px 20px;
      background: #fff;
      border-radius: 16px;
      border: 2px dashed #e2e8f0;
      color: #94a3b8;
      width: 100%;
      box-sizing: border-box;
      
      @media (max-width: 768px) {
        padding: 30px 16px;
        border-radius: 12px;
      }
      
      @media (max-width: 480px) {
        padding: 20px 12px;
        border-radius: 10px;
      }

      i {
        font-size: 48px;
        margin-bottom: 12px;
        display: block;
        
        @media (max-width: 768px) {
          font-size: 40px;
          margin-bottom: 10px;
        }
        
        @media (max-width: 480px) {
          font-size: 36px;
          margin-bottom: 8px;
        }
      }

      p {
        margin: 0;
        font-size: 14px;
        word-wrap: break-word;
        overflow-wrap: break-word;
        padding: 0 10px;
        
        @media (max-width: 768px) {
          font-size: 13px;
          line-height: 1.5;
        }
        
        @media (max-width: 480px) {
          font-size: 12px;
          line-height: 1.4;
          padding: 0 5px;
        }
      }
    }

    /* Document Viewer Dialog */
    :host ::ng-deep .doc-viewer-dialog {
      .p-dialog-content {
        padding: 0;
        height: 100%;
        
        @media (max-width: 768px) {
          height: calc(100vh - 60px);
        }
      }
      
      .p-dialog {
        @media (max-width: 768px) {
          width: 95vw !important;
          height: 95vh !important;
          max-height: 95vh !important;
        }
        
        @media (max-width: 480px) {
          width: 100vw !important;
          height: 100vh !important;
          max-height: 100vh !important;
          margin: 0 !important;
        }
      }
      
      .p-dialog-header {
        @media (max-width: 480px) {
          padding: 12px !important;
          font-size: 14px !important;
        }
      }
    }

    .doc-viewer-content {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      
      @media (max-width: 768px) {
        min-height: 300px;
      }
      
      @media (max-width: 480px) {
        min-height: 250px;
      }
    }

    .doc-iframe {
      width: 100%;
      height: 100%;
      border: none;
      min-height: 400px;
      
      @media (max-width: 768px) {
        min-height: 300px;
      }
      
      @media (max-width: 480px) {
        min-height: 250px;
      }
    }

    .doc-viewer-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      color: #64748b;
      
      @media (max-width: 768px) {
        gap: 12px;
      }
      
      @media (max-width: 480px) {
        gap: 10px;
        
        span {
          font-size: 13px;
        }
      }
    }

    .timeline-section,
    .proposta-origin {
      background: #fff;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      padding: 24px;
      margin-bottom: 20px;

      h2 {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 18px;
        font-weight: 600;
        color: #0f172a;
        margin: 0 0 20px;

        i {
          color: #0ea5e9;
        }
      }
    }

    .timeline {
      display: flex;
      flex-direction: column;
      gap: 0;
      padding-left: 8px;
    }

    .timeline-step {
      display: flex;
      gap: 16px;
      position: relative;
      padding-bottom: 24px;

      &:last-child {
        padding-bottom: 0;
      }

      &:not(:last-child)::before {
        content: '';
        position: absolute;
        left: 11px;
        top: 24px;
        bottom: 0;
        width: 2px;
        background: #e2e8f0;
      }

      &.done:not(:last-child)::before {
        background: #0ea5e9;
      }
    }

    .timeline-marker {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid #cbd5e1;
      background: #fff;
      flex-shrink: 0;
      margin-top: 2px;
      z-index: 1;
    }

    .timeline-step.done .timeline-marker {
      border-color: #0ea5e9;
      background: #0ea5e9;
      box-shadow: inset 0 0 0 4px #fff;
    }

    .timeline-step.active .timeline-marker {
      border-color: #0369a1;
      background: #0369a1;
    }

    .timeline-content {
      display: flex;
      flex-direction: column;
      gap: 4px;

      strong {
        font-size: 14px;
        color: #334155;
      }

      span {
        font-size: 13px;
        color: #64748b;
      }
    }
  `]
})
export class ExternoOSDetailComponent implements OnInit {
  private usuarioExternoService = inject(UsuarioExternoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private messageService = inject(MessageService);
  private i18n = inject(TranslationService);

  os: OSExternaDetalhada | null = null;
  loading = true;
  error = '';

  get propostaOriginLabel(): string {
    const numero = this.os?.propostaNumero?.trim() || String(this.os?.propostaId ?? '');
    return this.i18n.translate('externo.osDetail.propostaOrigin.link', { numero });
  }

  // Document viewer
  showDocViewer = false;
  docViewerUrl: SafeResourceUrl | null = null;
  docViewerTitle = '';

  get osDetailTitle(): string {
    if (!this.os?.id) return '';
    return this.i18n.translate('externo.osDetail.title', { id: String(this.os.id) });
  }

  ngOnInit() {
    this.loadOS();
  }

  loadOS() {
    const osId = this.route.snapshot.params['id'];
    
    if (!osId) {
      this.error = this.i18n.translate('externo.osDetail.error.noOsId');
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = '';

    this.usuarioExternoService.getOSDetalhada(+osId).subscribe({
      next: (os) => {
        this.os = os;
        this.loading = false;
      },
      error: (err) => {
        console.error('ExternoOSDetailComponent - failed to load work order:', err);
        console.error('ExternoOSDetailComponent - Status:', err?.status);
        console.error('ExternoOSDetailComponent - Mensagem:', err?.error?.message);
        
        if (err?.status === 403) {
          this.error = this.i18n.translate('externo.osDetail.error.forbidden');
        } else if (err?.status === 404) {
          this.error = this.i18n.translate('externo.osDetail.error.notFound');
        } else {
          this.error = extractApiErrorMessage(err, this.i18n, 'externo.osDetail.error.loadOs');
        }
        this.loading = false;
      }
    });
  }

  visualizarDocumento(doc: DocumentoExterno) {
    
    if (!doc.osFileId) {
      console.error('Documento sem osFileId:', doc);
      toastKey(this.messageService, this.i18n, 'error', 'externo.osDetail.errorTitle', 'externo.osDetail.error.noFileRef');
      return;
    }

    this.docViewerTitle = doc.nomeArquivo || '';
    this.docViewerUrl = null; // Reset
    this.showDocViewer = true;
    
    // Obter token de autenticação
    const token = this.usuarioExternoService.getToken();
    
    // Usar getDynamicApiUrl para garantir URL correta
    const apiUrl = environment.getApiUrl ? environment.getApiUrl() : environment.apiUrl;
    
    // Garantir que apiUrl não termina com barra
    const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    
    // Construir URL com token na query string (iframes não enviam headers Authorization facilmente)
    let url = `${baseUrl}/os-files/${doc.osFileId}/download`;
    if (token) {
      url += `?token=${encodeURIComponent(token)}`;
    }
    
    
    // Aguardar um tick para o dialog abrir antes de carregar o iframe
    setTimeout(() => {
      try {
        this.docViewerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      } catch (error) {
        console.error('Failed to sanitize URL:', error);
        toastKey(this.messageService, this.i18n, 'error', 'externo.osDetail.errorTitle', 'externo.osDetail.error.loadDoc');
        this.showDocViewer = false;
      }
    }, 300);
  }

  downloadDocumento(doc: DocumentoExterno) {
    
    if (!doc.osFileId) {
      console.error('Documento sem osFileId:', doc);
      toastKey(this.messageService, this.i18n, 'error', 'externo.osDetail.errorTitle', 'externo.osDetail.error.noFileRef');
      return;
    }

    const apiUrl = environment.getApiUrl ? environment.getApiUrl() : environment.apiUrl;
    const url = `${apiUrl}/os-files/${doc.osFileId}/download`;
    window.open(url, '_blank');
  }

  onDocViewerClose() {
    this.docViewerUrl = null;
    this.showDocViewer = false;
  }

  onIframeError(event: any) {
    console.error('Failed to load iframe:', event);
    toastKey(this.messageService, this.i18n, 'error', 'externo.osDetail.errorTitle', 'externo.osDetail.error.loadDocConnection');
    this.showDocViewer = false;
  }

  onIframeLoad(event: any) {
  }

  getFileIcon(ext: string | undefined): string {
    const extension = ext?.toLowerCase();
    switch (extension) {
      case 'pdf': return 'pi pi-file-pdf';
      case 'doc':
      case 'docx': return 'pi pi-file-word';
      case 'xls':
      case 'xlsx': return 'pi pi-file-excel';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return 'pi pi-image';
      default: return 'pi pi-file';
    }
  }

  getFileIconClass(ext: string | undefined): string {
    const extension = ext?.toLowerCase();
    switch (extension) {
      case 'pdf': return 'pdf';
      case 'doc':
      case 'docx': return 'doc';
      case 'xls':
      case 'xlsx': return 'xls';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return 'img';
      default: return 'default';
    }
  }

  getStatusLabel(status: string | undefined): string {
    if (!status) return '-';
    const slug = status
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
    const key = `externo.os.status.${slug}`;
    const translated = this.i18n.translate(key);
    return translated !== key ? translated : status;
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    const normalized = (status ?? '')
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase();
    switch (normalized) {
      case 'aberta': return 'info';
      case 'concluida': return 'success';
      case 'fechada': return 'secondary';
      default: return 'warn';
    }
  }

  formatDate(date: string | undefined): string {
    if (!date) return '-';
    try {
      return formatUiDateTime(this.i18n.getCurrentLanguage(), date, 'date');
    } catch {
      return date;
    }
  }
}
