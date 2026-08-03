import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { UsuarioExternoService, OSExternaResumo } from '../../core/usuario-externo.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { TranslationService } from '../../core/translation.service';
import { formatUiDateTime } from '../../core/locale/locale-intl.util';
import { PageHeroComponent } from '../../shared/page-hero/page-hero.component';
import { ListDataStatesComponent } from '../../shared/list-data-states/list-data-states.component';

@Component({
  standalone: true,
  selector: 'app-externo-os-list',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TableModule,
    TagModule,
    TooltipModule,
    TranslatePipe,
    PageHeroComponent,
    ListDataStatesComponent
  ],
  template: `
    <div class="as-page os-list-container">
      <app-page-hero
        variant="slate"
        titleKey="externo.osList.title"
        subtitleKey="externo.osList.subtitle"
        titleIcon="pi-file-edit" />

      <app-list-data-states
        [loading]="loading"
        [itemCount]="osList.length"
        [skeletonRows]="4"
        [skeletonCols]="4"
        emptyTitleKey="externo.osList.empty.title"
        emptyDescriptionKey="externo.osList.empty.subtitle">
        <div class="search-bar" *ngIf="osList.length > 5">
          <span class="p-input-icon-left">
            <i class="pi pi-search"></i>
            <input type="text" pInputText [(ngModel)]="searchTerm"
                   [placeholder]="'externo.osList.searchPlaceholder' | translate"
                   (input)="filterOS()">
          </span>
          <span class="results-count">
            {{ 'externo.osList.resultsCount' | translate:{ shown: filteredOsList.length + '', total: osList.length + '' } }}
          </span>
        </div>

        <div class="os-cards">
        <div class="os-card" *ngFor="let os of filteredOsList" (click)="viewOS(os)">
          <div class="os-card-header">
            <span class="os-number">OS {{ os.id }}</span>
            <p-tag [value]="getStatusLabel(os.status)" [severity]="getStatusSeverity(os.status)"></p-tag>
          </div>
          
          <div class="os-card-body">
            <div class="os-info-row">
              <span class="info-label">{{ 'externo.osList.col.client' | translate }}</span>
              <span class="info-value">{{ os.clienteNome || '-' }}</span>
            </div>
            <div class="os-info-row">
              <span class="info-label">{{ 'externo.osList.col.partNumber' | translate }}</span>
              <span class="info-value">{{ os.partNumber || '-' }}</span>
            </div>
            <div class="os-info-row">
              <span class="info-label">{{ 'externo.osList.col.serialNumber' | translate }}</span>
              <span class="info-value">{{ os.serialNumber || '-' }}</span>
            </div>
            <div class="os-info-row">
              <span class="info-label">{{ 'externo.osList.col.serviceType' | translate }}</span>
              <span class="info-value">{{ os.tipoServico || '-' }}</span>
            </div>
            <div class="os-info-row">
              <span class="info-label">{{ 'externo.osList.col.manufacturer' | translate }}</span>
              <span class="info-value">{{ os.fabricanteNome || '-' }}</span>
            </div>
          </div>
          
          <div class="os-card-footer">
            <div class="os-dates">
              <span class="date-item">
                <i class="pi pi-calendar"></i>
                {{ 'externo.osList.col.openedAt' | translate }} {{ formatDate(os.dtAbertura) }}
              </span>
              <span class="date-item" *ngIf="os.dataFechamento">
                <i class="pi pi-check-circle"></i>
                {{ 'externo.osList.col.closedAt' | translate }} {{ formatDate(os.dataFechamento) }}
              </span>
            </div>
            <button pButton icon="pi pi-eye" 
                    [label]="'externo.osList.btnView' | translate" 
                    class="p-button-outlined p-button-sm"
                    (click)="viewOS(os); $event.stopPropagation()">
            </button>
          </div>
        </div>
      </div>

      </app-list-data-states>
    </div>
  `,
  styles: [`
    .os-list-container {
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
      color: #0ea5e9;
      background: rgba(14, 165, 233, 0.1);
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

    .search-bar {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
      
      @media (max-width: 768px) {
        margin-bottom: 16px;
        gap: 12px;
        flex-direction: column;
        width: 100%;
      }

      .p-input-icon-left {
        flex: 1;
        min-width: 300px;
        
        @media (max-width: 768px) {
          min-width: 0;
          width: 100%;
        }

        input {
          width: 100%;
          height: 44px;
          border-radius: 10px;
          
          @media (max-width: 768px) {
            height: 40px;
            font-size: 14px;
          }
          
          @media (max-width: 480px) {
            height: 38px;
            font-size: 13px;
          }
        }
      }

      .results-count {
        color: #64748b;
        font-size: 14px;
        white-space: nowrap;
        
        @media (max-width: 768px) {
          font-size: 13px;
          width: 100%;
          text-align: center;
        }
        
        @media (max-width: 480px) {
          font-size: 12px;
        }
      }
    }

    .os-cards {
      display: grid;
      gap: 20px;
      
      @media (max-width: 768px) {
        gap: 16px;
      }
      
      @media (max-width: 480px) {
        gap: 12px;
      }
    }

    .os-card {
      background: #fff;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      padding: 24px;
      cursor: pointer;
      transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
      width: 100%;
      box-sizing: border-box;
      overflow: hidden;

      &:hover {
        border-color: #0ea5e9;
        box-shadow: 0 8px 24px rgba(14, 165, 233, 0.15);
        transform: translateY(-2px);
      }
      
      @media (max-width: 768px) {
        padding: 16px;
        border-radius: 12px;
        
        &:hover {
          transform: none;
        }
        
        &:active {
          transform: scale(0.98);
        }
      }
      
      @media (max-width: 480px) {
        padding: 12px;
        border-radius: 10px;
      }
    }

    .os-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #f1f5f9;
      gap: 12px;
      flex-wrap: wrap;
      
      @media (max-width: 768px) {
        margin-bottom: 16px;
        padding-bottom: 12px;
      }
      
      @media (max-width: 480px) {
        margin-bottom: 12px;
        padding-bottom: 10px;
        flex-direction: column;
        align-items: flex-start;
      }
    }

    .os-number {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      word-wrap: break-word;
      overflow-wrap: break-word;
      
      @media (max-width: 768px) {
        font-size: 18px;
      }
      
      @media (max-width: 480px) {
        font-size: 16px;
      }
    }

    .os-card-body {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
      
      @media (max-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        margin-bottom: 16px;
      }
      
      @media (max-width: 480px) {
        grid-template-columns: 1fr;
        gap: 10px;
        margin-bottom: 12px;
      }
    }

    .os-info-row {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
      overflow: hidden;
    }

    .info-label {
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

    .info-value {
      font-size: 14px;
      color: #334155;
      font-weight: 500;
      word-wrap: break-word;
      overflow-wrap: break-word;
      
      @media (max-width: 480px) {
        font-size: 13px;
        line-height: 1.4;
      }
    }

    .os-card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 16px;
      border-top: 1px solid #f1f5f9;
      gap: 16px;
      flex-wrap: wrap;
      
      @media (max-width: 768px) {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }
      
      @media (max-width: 480px) {
        padding-top: 12px;
        gap: 10px;
      }
      
      button {
        @media (max-width: 768px) {
          width: 100%;
        }
      }
    }

    .os-dates {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
      flex: 1;
      
      @media (max-width: 768px) {
        gap: 12px;
        width: 100%;
      }
      
      @media (max-width: 480px) {
        gap: 8px;
        flex-direction: column;
      }
    }

    .date-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #64748b;
      white-space: nowrap;
      
      @media (max-width: 480px) {
        font-size: 12px;
        white-space: normal;
        word-wrap: break-word;
        flex-wrap: wrap;
      }

      i {
        font-size: 14px;
        flex-shrink: 0;
        
        @media (max-width: 480px) {
          font-size: 13px;
        }
      }
    }
  `]
})
export class ExternoOSListComponent implements OnInit {
  private usuarioExternoService = inject(UsuarioExternoService);
  private router = inject(Router);
  private i18n = inject(TranslationService);

  osList: OSExternaResumo[] = [];
  filteredOsList: OSExternaResumo[] = [];
  searchTerm = '';
  loading = true;

  ngOnInit() {
    this.loadOS();
  }

  loadOS() {
    this.loading = true;
    this.usuarioExternoService.getMinhasOS().subscribe({
      next: (os) => {
        this.osList = os;
        this.filteredOsList = os;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load work order:', err);
        this.loading = false;
      }
    });
  }

  filterOS() {
    const term = this.searchTerm.toLowerCase();
    this.filteredOsList = this.osList.filter(os => 
      os.idOs.toString().includes(term) ||
      os.clienteNome?.toLowerCase().includes(term) ||
      os.partNumber?.toLowerCase().includes(term) ||
      os.serialNumber?.toLowerCase().includes(term) ||
      os.tipoServico?.toLowerCase().includes(term)
    );
  }

  viewOS(os: OSExternaResumo) {
    this.router.navigate(['/externo/os', os.id]);
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
