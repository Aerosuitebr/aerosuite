import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { UsuarioExternoService, DocumentoExterno } from '../../core/usuario-externo.service';
import { environment } from '../../../environments/environment';
import { TranslatePipe } from '../../core/translate.pipe';
import { TranslationService } from '../../core/translation.service';
import { formatUiDateTime } from '../../core/locale/locale-intl.util';
import { PageHeroComponent } from '../../shared/page-hero/page-hero.component';
import { ListDataStatesComponent } from '../../shared/list-data-states/list-data-states.component';

@Component({
  standalone: true,
  selector: 'app-externo-documentos',
  imports: [
    CommonModule,
    ButtonModule,
    ProgressSpinnerModule,
    TooltipModule,
    DialogModule,
    TranslatePipe,
    PageHeroComponent,
    ListDataStatesComponent
  ],
  template: `
    <div class="as-page documentos-container">
      <app-page-hero
        variant="slate"
        titleKey="externo.documentos.title"
        subtitleKey="externo.documentos.subtitle"
        titleIcon="pi-folder-open" />

      <app-list-data-states
        [loading]="loading"
        [itemCount]="documentos.length"
        [skeletonRows]="5"
        [skeletonCols]="4"
        emptyIcon="pi-folder"
        emptyTitleKey="externo.documentos.empty.title"
        emptyDescriptionKey="externo.documentos.empty.subtitle">
        <div class="docs-grid">
          <div class="doc-card" *ngFor="let doc of documentos" [class.doc-avulso]="doc.isAvulso">
          <div class="doc-icon" [ngClass]="getIconClass(doc.nomeArquivo)">
            <i [class]="getFileIcon(doc.nomeArquivo)"></i>
          </div>
          <div class="doc-info">
            <div class="doc-header">
              <h3 class="doc-name">{{ doc.nomeArquivo }}</h3>
              <span class="avulso-badge" *ngIf="doc.isAvulso"
                    [pTooltip]="'externo.documentos.badge.avulsoTooltip' | translate"
                    tooltipPosition="top">
                <i class="pi pi-paperclip"></i>
                <span class="badge-text">{{ 'externo.documentos.badge.avulso' | translate }}</span>
              </span>
            </div>
            <p class="doc-desc" *ngIf="doc.descricao">{{ doc.descricao }}</p>
            <div class="doc-meta">
              <span *ngIf="doc.dataConcessao">
                <i class="pi pi-calendar"></i>
                {{ formatDate(doc.dataConcessao) }}
              </span>
              <span *ngIf="doc.visualizacoes > 0">
                <i class="pi pi-eye"></i>
                {{ 'externo.documentos.views' | translate:{ count: doc.visualizacoes + '' } }}
              </span>
            </div>
          </div>
          <div class="doc-actions">
            <button pButton icon="pi pi-eye" 
                    class="p-button-text p-button-rounded"
                    [pTooltip]="'externo.documentos.tooltip.view' | translate"
                    (click)="viewDocument(doc)">
            </button>
            <button pButton icon="pi pi-download" 
                    class="p-button-text p-button-rounded"
                    [pTooltip]="'externo.documentos.tooltip.download' | translate"
                    *ngIf="doc.podeDownload"
                    (click)="downloadDocument(doc)">
            </button>
          </div>
        </div>
        </div>
      </app-list-data-states>
    </div>

    <!-- Dialog de Visualização de Documento -->
    <p-dialog styleClass="as-hero-dialog doc-viewer-dialog responsive-dialog" [(visible)]="showDocViewer" 
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
                style="width: 100%; height: 100%; border: none;">
        </iframe>
        <div class="doc-viewer-loading" *ngIf="!docViewerUrl">
          <p-progressSpinner strokeWidth="3"></p-progressSpinner>
          <span>{{ 'externo.documentos.viewer.loading' | translate }}</span>
        </div>
      </div>
    </p-dialog>
  `,
  styles: [`
    .documentos-container {
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

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      flex-wrap: wrap;
      gap: 16px;
      
      @media (max-width: 768px) {
        margin-bottom: 20px;
        flex-direction: column;
        align-items: flex-start;
      }
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 16px;
      flex: 1;
      min-width: 0;
      
      @media (max-width: 480px) {
        gap: 12px;
        width: 100%;
      }
    }

    .header-icon {
      font-size: 36px;
      color: #22c55e;
      background: rgba(34, 197, 94, 0.1);
      padding: 16px;
      border-radius: 12px;
      flex-shrink: 0;
      
      @media (max-width: 768px) {
        font-size: 28px;
        padding: 12px;
        border-radius: 10px;
      }
      
      @media (max-width: 480px) {
        font-size: 24px;
        padding: 10px;
      }
    }

    .header-title h1 {
      font-size: 24px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      word-wrap: break-word;
      overflow-wrap: break-word;
      
      @media (max-width: 768px) {
        font-size: 20px;
      }
      
      @media (max-width: 480px) {
        font-size: 18px;
        line-height: 1.3;
      }
    }

    .header-title p {
      font-size: 14px;
      color: #64748b;
      margin: 4px 0 0;
      
      @media (max-width: 768px) {
        font-size: 13px;
      }
      
      @media (max-width: 480px) {
        font-size: 12px;
      }
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 20px;
      color: #64748b;
      gap: 16px;
      min-height: 300px;
      
      @media (max-width: 768px) {
        padding: 60px 16px;
        min-height: 250px;
        gap: 12px;
      }
      
      @media (max-width: 480px) {
        padding: 40px 12px;
        min-height: 200px;
        gap: 10px;
      }
      
      p {
        font-size: 14px;
        
        @media (max-width: 480px) {
          font-size: 13px;
        }
      }
    }

    .empty-state {
      text-align: center;
      padding: 80px 20px;
      background: #fff;
      border-radius: 16px;
      border: 2px dashed #e2e8f0;
      width: 100%;
      box-sizing: border-box;
      
      @media (max-width: 768px) {
        padding: 60px 16px;
        border-radius: 12px;
      }
      
      @media (max-width: 480px) {
        padding: 40px 12px;
        border-radius: 10px;
      }
    }

    .empty-icon {
      font-size: 64px;
      color: #94a3b8;
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

    .empty-state h3 {
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

    .empty-state p {
      color: #64748b;
      margin: 0;
      font-size: 14px;
      
      @media (max-width: 768px) {
        font-size: 13px;
      }
      
      @media (max-width: 480px) {
        font-size: 12px;
        line-height: 1.5;
      }
    }

    .docs-grid {
      display: grid;
      gap: 16px;
      
      @media (max-width: 768px) {
        gap: 14px;
      }
      
      @media (max-width: 480px) {
        gap: 12px;
      }
    }

    .doc-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: #fff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
      width: 100%;
      box-sizing: border-box;
      overflow: hidden;
      
      @media (max-width: 768px) {
        padding: 16px;
        gap: 14px;
        border-radius: 10px;
      }
      
      @media (max-width: 480px) {
        padding: 12px;
        gap: 12px;
        border-radius: 8px;
        flex-wrap: wrap;
      }

      &:hover {
        border-color: #22c55e;
        box-shadow: 0 4px 16px rgba(34, 197, 94, 0.15);
        
        @media (max-width: 768px) {
          box-shadow: none;
        }
        
        @media (max-width: 480px) {
          border-color: #22c55e;
        }
      }
      
      &:active {
        @media (max-width: 768px) {
          transform: scale(0.98);
        }
      }
    }

    .doc-icon {
      width: 56px;
      height: 56px;
      background: rgba(34, 197, 94, 0.1);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      
      @media (max-width: 768px) {
        width: 48px;
        height: 48px;
        border-radius: 10px;
      }
      
      @media (max-width: 480px) {
        width: 44px;
        height: 44px;
        border-radius: 8px;
      }

      i {
        font-size: 28px;
        color: #22c55e;
        
        @media (max-width: 768px) {
          font-size: 24px;
        }
        
        @media (max-width: 480px) {
          font-size: 20px;
        }
      }
    }

    .doc-info {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      
      @media (max-width: 480px) {
        width: 100%;
        order: 1;
      }
    }

    .doc-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 4px;
      flex-wrap: wrap;
      width: 100%;
      
      @media (max-width: 480px) {
        gap: 8px;
        margin-bottom: 6px;
      }
    }

    .doc-name {
      font-size: 16px;
      font-weight: 600;
      color: #0f172a;
      margin: 0;
      word-wrap: break-word;
      overflow-wrap: break-word;
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.4;
      
      @media (max-width: 768px) {
        font-size: 15px;
      }
      
      @media (max-width: 480px) {
        font-size: 14px;
        line-height: 1.3;
        width: 100%;
        white-space: normal;
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

    .doc-card.doc-avulso {
      border-left: 3px solid #3b82f6;
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(255, 255, 255, 1) 100%);
    }

    .doc-desc {
      font-size: 14px;
      color: #64748b;
      margin: 0 0 8px;
    }

    .doc-meta {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;

      span {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #94a3b8;

        i {
          font-size: 12px;
        }
      }
    }

    .doc-actions {
      display: flex;
      gap: 8px;
    }

    /* Icon colors */
    .doc-icon.pdf-icon {
      background: rgba(239, 68, 68, 0.1);
      i { color: #ef4444; }
    }
    .doc-icon.doc-icon {
      background: rgba(59, 130, 246, 0.1);
      i { color: #3b82f6; }
    }
    .doc-icon.xls-icon {
      background: rgba(34, 197, 94, 0.1);
      i { color: #22c55e; }
    }
    .doc-icon.img-icon {
      background: rgba(168, 85, 247, 0.1);
      i { color: #a855f7; }
    }
    .doc-icon.default-icon {
      background: rgba(100, 116, 139, 0.1);
      i { color: #64748b; }
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
  `]
})
export class ExternoDocumentosComponent implements OnInit {
  private usuarioExternoService = inject(UsuarioExternoService);
  private sanitizer = inject(DomSanitizer);
  private i18n = inject(TranslationService);

  documentos: DocumentoExterno[] = [];
  loading = true;

  // Document viewer
  showDocViewer = false;
  docViewerUrl: SafeResourceUrl | null = null;
  docViewerTitle = '';

  ngOnInit() {
    this.loadDocumentos();
  }

  loadDocumentos() {
    this.loading = true;
    this.usuarioExternoService.getMeusDocumentos().subscribe({
      next: (docs) => {
        this.documentos = docs;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load documents:', err);
        this.loading = false;
      }
    });
  }

  getFileIcon(filename: string): string {
    const ext = filename?.split('.').pop()?.toLowerCase();
    switch (ext) {
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

  getIconClass(filename: string): string {
    const ext = filename?.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'pdf-icon';
      case 'doc':
      case 'docx': return 'doc-icon';
      case 'xls':
      case 'xlsx': return 'xls-icon';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return 'img-icon';
      default: return 'default-icon';
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

  viewDocument(doc: DocumentoExterno) {
    
    if (!doc.osFileId) {
      console.error('Documento sem osFileId:', doc);
      alert(this.i18n.translate('externo.documentos.error.noFileRef'));
      return;
    }

    this.docViewerTitle = doc.nomeArquivo || this.i18n.translate('externo.documentos.viewer.defaultTitle');
    this.docViewerUrl = null;
    this.showDocViewer = true;
    
    const apiUrl = environment.getApiUrl ? environment.getApiUrl() : environment.apiUrl;
    const url = `${apiUrl}/os-files/${doc.osFileId}/download`;
    
    setTimeout(() => {
      this.docViewerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }, 100);
  }

  downloadDocument(doc: DocumentoExterno) {
    
    if (!doc.osFileId) {
      console.error('Documento sem osFileId:', doc);
      alert(this.i18n.translate('externo.documentos.error.noFileRef'));
      return;
    }

    const apiUrl = environment.getApiUrl ? environment.getApiUrl() : environment.apiUrl;
    const url = `${apiUrl}/os-files/${doc.osFileId}/download`;
    window.open(url, '_blank');
  }

  onDocViewerClose() {
    this.docViewerUrl = null;
  }
}
