import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TimelineModule } from 'primeng/timeline';
import { CardModule } from 'primeng/card';
import { OSAuditoriaService, OSAuditoria } from '../../core/os-auditoria.service';
import { TranslationService } from '../../core/translation.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { formatUiDateTime } from '../../core/locale/locale-intl.util';

@Component({
  selector: 'app-os-auditoria',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    TableModule,
    TagModule,
    ButtonModule,
    InputTextModule,
    CalendarModule,
    DropdownModule,
    TooltipModule,
    ProgressSpinnerModule,
    TimelineModule,
    CardModule,
    TranslatePipe
  ],
  template: `
    <p-dialog 
      styleClass="as-hero-dialog auditoria-dialog" [(visible)]="visible" 
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '95vw', maxWidth: '1200px', maxHeight: '90vh' }"
     
      (onHide)="onClose()">
      
      <ng-template pTemplate="header">
        <div class="dialog-header">
          <i class="pi pi-history header-icon"></i>
          <div class="header-content">
            <h2>{{ 'os.auditoria.embed.title' | translate }}</h2>
            <p *ngIf="numeroOs">{{ 'os.auditoria.embed.osLabel' | translate:{ num: numeroOs } }}</p>
          </div>
        </div>
      </ng-template>

      <div class="auditoria-content">
        <!-- Loading -->
        <div class="loading-container" *ngIf="loading">
          <p-progressSpinner strokeWidth="3" animationDuration=".5s"></p-progressSpinner>
          <p>{{ 'os.auditoria.embed.loading' | translate }}</p>
        </div>

        <!-- Timeline de Auditoria -->
        <div class="timeline-container" *ngIf="!loading && auditorias.length > 0">
          <p-timeline [value]="auditorias" align="alternate" styleClass="auditoria-timeline">
            <ng-template pTemplate="content" let-item>
              <p-card styleClass="auditoria-card">
                <ng-template pTemplate="header">
                  <div class="card-header">
                    <p-tag 
                      [value]="item.acaoDescricao" 
                      [severity]="getSeverity(item.acao)"
                      [icon]="getIcon(item.acao)">
                    </p-tag>
                    <span class="data-hora">{{ formatDate(item.dataHora) }}</span>
                  </div>
                </ng-template>
                
                <div class="card-body">
                  <!-- Informações do usuário -->
                  <div class="user-info">
                    <i class="pi pi-user"></i>
                    <span>{{ item.usuarioNome || ('os.auditoria.list.userSystem' | translate) }}</span>
                    <span class="ip" *ngIf="item.ipOrigem">({{ item.ipOrigem }})</span>
                  </div>

                  <!-- Detalhes da alteração -->
                  <div class="alteracao-details" *ngIf="item.acao === 'ALTERACAO'">
                    <div class="campo-alterado">
                      <strong>{{ 'os.auditoria.embed.field' | translate }}</strong> {{ item.campoAlteradoLabel || item.campoAlterado }}
                    </div>
                    <div class="valores-container">
                      <div class="valor valor-anterior">
                        <label>{{ 'os.auditoria.embed.before' | translate }}</label>
                        <span class="valor-text">{{ item.valorAnterior || ('os.auditoria.list.jsonEmpty' | translate) }}</span>
                      </div>
                      <i class="pi pi-arrow-right arrow-icon"></i>
                      <div class="valor valor-novo">
                        <label>{{ 'os.auditoria.embed.after' | translate }}</label>
                        <span class="valor-text">{{ item.valorNovo || ('os.auditoria.list.jsonEmpty' | translate) }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Mensagem para criação/exclusão -->
                  <div class="acao-message" *ngIf="item.acao === 'CRIACAO'">
                    <i class="pi pi-check-circle success-icon"></i>
                    <span>{{ 'os.auditoria.embed.msgCreated' | translate }}</span>
                  </div>
                  <div class="acao-message" *ngIf="item.acao === 'EXCLUSAO'">
                    <i class="pi pi-times-circle danger-icon"></i>
                    <span>{{ 'os.auditoria.embed.msgInactivated' | translate }}</span>
                  </div>
                  <div class="acao-message" *ngIf="item.acao === 'RESTAURACAO'">
                    <i class="pi pi-refresh warning-icon"></i>
                    <span>{{ 'os.auditoria.embed.msgRestored' | translate }}</span>
                  </div>
                </div>
              </p-card>
            </ng-template>
            
            <ng-template pTemplate="opposite" let-item>
              <small class="opposite-date">{{ formatDateShort(item.dataHora) }}</small>
            </ng-template>
          </p-timeline>
        </div>

        <!-- Estado vazio -->
        <div class="empty-state" *ngIf="!loading && auditorias.length === 0">
          <i class="pi pi-inbox"></i>
          <h3>{{ 'os.auditoria.embed.emptyTitle' | translate }}</h3>
          <p>{{ 'os.auditoria.embed.emptySubtitle' | translate }}</p>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <div class="dialog-footer">
          <span class="total-registros" *ngIf="auditorias.length > 0">
            {{ 'os.auditoria.embed.totalRecords' | translate:{ count: String(auditorias.length) } }}
          </span>
          <button pButton [label]="'os.auditoria.embed.btnClose' | translate" icon="pi pi-times" (click)="visible = false"></button>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    :host ::ng-deep .auditoria-dialog {
      .p-dialog-header {
        background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
        color: white;
        border-radius: 12px 12px 0 0;
        padding: 1.25rem 1.5rem;
      }
      
      .p-dialog-content {
        padding: 0;
      }
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      
      .header-icon {
        font-size: 1.75rem;
        opacity: 0.9;
      }
      
      .header-content {
        h2 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
        }
        p {
          margin: 0.25rem 0 0;
          font-size: 0.875rem;
          opacity: 0.9;
        }
      }
    }

    .auditoria-content {
      padding: 1.5rem;
      max-height: 60vh;
      overflow-y: auto;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      gap: 1rem;
      
      p {
        color: #64748b;
        margin: 0;
      }
    }

    .timeline-container {
      :host ::ng-deep .auditoria-timeline {
        .p-timeline-event-content {
          width: 100%;
        }
      }
    }

    :host ::ng-deep .auditoria-card {
      .p-card {
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        
        &:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        }
      }
      
      .p-card-header {
        padding: 0.75rem 1rem;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
      }
      
      .p-card-body {
        padding: 1rem;
      }
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .data-hora {
        font-size: 0.75rem;
        color: #64748b;
      }
    }

    .card-body {
      .user-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
        font-size: 0.875rem;
        color: #475569;
        
        i {
          color: #94a3b8;
        }
        
        .ip {
          font-size: 0.75rem;
          color: #94a3b8;
        }
      }
    }

    .alteracao-details {
      background: #f8fafc;
      border-radius: 8px;
      padding: 0.75rem;
      
      .campo-alterado {
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
        color: #334155;
      }
      
      .valores-container {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
        
        .valor {
          flex: 1;
          min-width: 120px;
          padding: 0.5rem;
          border-radius: 6px;
          
          label {
            display: block;
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.25rem;
          }
          
          .valor-text {
            font-size: 0.875rem;
            word-break: break-word;
          }
        }
        
        .valor-anterior {
          background: #fef2f2;
          
          label { color: #991b1b; }
          .valor-text { color: #dc2626; }
        }
        
        .valor-novo {
          background: #f0fdf4;
          
          label { color: #166534; }
          .valor-text { color: #16a34a; }
        }
        
        .arrow-icon {
          color: #94a3b8;
          font-size: 1rem;
        }
      }
    }

    .acao-message {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      
      .success-icon { color: #16a34a; }
      .danger-icon { color: #dc2626; }
      .warning-icon { color: #f59e0b; }
    }

    .opposite-date {
      color: #94a3b8;
      font-size: 0.75rem;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      text-align: center;
      
      i {
        font-size: 3rem;
        color: #cbd5e1;
        margin-bottom: 1rem;
      }
      
      h3 {
        margin: 0 0 0.5rem;
        color: #334155;
        font-size: 1.125rem;
      }
      
      p {
        margin: 0;
        color: #64748b;
        font-size: 0.875rem;
      }
    }

    .dialog-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .total-registros {
        font-size: 0.875rem;
        color: #64748b;
      }
    }
  `]
})
export class OSAuditoriaComponent implements OnInit {
  /** Exposto para os parâmetros das traduções no template Angular. */
  protected readonly String = String;

  @Input() idOs!: number;
  @Input() numeroOs?: number;
  
  visible = false;
  loading = false;
  auditorias: OSAuditoria[] = [];

  private auditoriaService = inject(OSAuditoriaService);
  private i18n = inject(TranslationService);

  ngOnInit() {}

  /**
   * Abre o dialog e carrega os dados
   */
  open(idOs: number, numeroOs?: number) {
    this.idOs = idOs;
    this.numeroOs = numeroOs;
    this.visible = true;
    this.carregarHistorico();
  }

  /**
   * Carrega o histórico de auditoria
   */
  carregarHistorico() {
    if (!this.idOs) return;
    
    this.loading = true;
    this.auditoriaService.buscarPorOs(this.idOs).subscribe({
      next: (data) => {
        this.auditorias = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load history:', err);
        this.auditorias = [];
        this.loading = false;
      }
    });
  }

  /**
   * Retorna a severidade do badge
   */
  getSeverity(acao: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (acao) {
      case 'CRIACAO': return 'success';
      case 'ALTERACAO': return 'info';
      case 'EXCLUSAO': return 'danger';
      case 'RESTAURACAO': return 'warn';
      default: return 'secondary';
    }
  }

  /**
   * Retorna o ícone da ação
   */
  getIcon(acao: string): string {
    switch (acao) {
      case 'CRIACAO': return 'pi pi-plus-circle';
      case 'ALTERACAO': return 'pi pi-pencil';
      case 'EXCLUSAO': return 'pi pi-trash';
      case 'RESTAURACAO': return 'pi pi-refresh';
      default: return 'pi pi-info-circle';
    }
  }

  /**
   * Formata a data completa
   */
  formatDate(dateStr: string): string {
    return formatUiDateTime(this.i18n.getCurrentLanguage(), dateStr, 'dateTime');
  }

  formatDateShort(dateStr: string): string {
    return formatUiDateTime(this.i18n.getCurrentLanguage(), dateStr, 'dateTimeShort');
  }

  /**
   * Callback ao fechar
   */
  onClose() {
    this.auditorias = [];
  }
}
