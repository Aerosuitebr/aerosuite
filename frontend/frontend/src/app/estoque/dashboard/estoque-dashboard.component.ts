import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { Subscription } from 'rxjs';
import { EstoqueService, MovimentacaoEstoque } from '../../core/estoque.service';
import { TranslationService } from '../../core/translation.service';
import { TranslatePipe } from '../../core/translate.pipe';

interface DashboardCard {
  title: string;
  value: number | string;
  icon: string;
  color: string;
  route?: string;
  subtitle?: string;
}

@Component({
  selector: 'app-estoque-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
    ChartModule,
    TagModule,
    SkeletonModule,
    TranslatePipe
  ],
  template: `
    <div class="dashboard-container">
      <!-- Título -->
      <div class="dashboard-header">
        <h1>
          <i class="pi pi-chart-bar"></i>
          {{ 'estoque.dashboard.title' | translate }}
        </h1>
        <p>{{ 'estoque.dashboard.subtitle' | translate }}</p>
      </div>

      <!-- Cards de Resumo -->
      <div class="cards-grid">
        <div *ngFor="let card of cards" 
             class="dashboard-card"
             [style.borderColor]="card.color"
             [routerLink]="card.route">
          <div class="card-icon" [style.backgroundColor]="card.color + '20'" [style.color]="card.color">
            <i [class]="card.icon"></i>
          </div>
          <div class="card-content">
            <span class="card-value">{{ card.value }}</span>
            <span class="card-title">{{ card.title }}</span>
            <span class="card-subtitle" *ngIf="card.subtitle">{{ card.subtitle }}</span>
          </div>
        </div>
      </div>

      <!-- Ações Rápidas -->
      <div class="quick-actions">
        <h2>
          <i class="pi pi-bolt"></i>
          {{ 'estoque.dashboard.quickActions' | translate }}
        </h2>
        <div class="actions-grid">
          <button pButton 
                  [label]="'estoque.dashboard.action.scanQr' | translate" 
                  icon="pi pi-qrcode"
                  class="action-btn qr-btn"
                  routerLink="/estoque/consulta-qr">
          </button>
          <button pButton 
                  [label]="'estoque.dashboard.action.newEntry' | translate" 
                  icon="pi pi-sign-in"
                  class="action-btn entrada-btn"
                  routerLink="/estoque/entrada">
          </button>
          <button pButton 
                  [label]="'estoque.dashboard.action.newInvoice' | translate" 
                  icon="pi pi-file-import"
                  class="action-btn invoice-btn"
                  routerLink="/estoque/invoices">
          </button>
          <button pButton 
                  [label]="'estoque.dashboard.action.newSupplier' | translate" 
                  icon="pi pi-truck"
                  class="action-btn fornecedor-btn"
                  routerLink="/estoque/fornecedores">
          </button>
        </div>
      </div>

      <!-- Grid de Seções -->
      <div class="sections-grid">
        <!-- Últimas Movimentações -->
        <div class="section-card">
          <div class="section-header">
            <h3>
              <i class="pi pi-history"></i>
              {{ 'estoque.dashboard.recentMov' | translate }}
            </h3>
            <button pButton [label]="'estoque.dashboard.viewAll' | translate" icon="pi pi-arrow-right" iconPos="right"
                    class="p-button-text p-button-sm"
                    routerLink="/estoque/movimentacoes">
            </button>
          </div>
          <div class="section-content">
            <div class="movimentacao-list" *ngIf="ultimasMovimentacoes.length > 0">
              <div *ngFor="let mov of ultimasMovimentacoes" class="movimentacao-item">
                <div class="mov-icon" [class]="'tipo-' + mov.tipoMovimentacao?.toLowerCase()">
                  <i [class]="getMovimentacaoIcon(mov.tipoMovimentacao)"></i>
                </div>
                <div class="mov-info">
                  <span class="mov-pn">{{ mov.itemPartNumber }}</span>
                  <span class="mov-desc">{{ mov.motivo || mov.tipoMovimentacao }}</span>
                </div>
                <div class="mov-meta">
                  <span class="mov-date">{{ mov.dataMovimentacao | date:'dd/MM HH:mm' }}</span>
                  <p-tag [value]="getMovLabel(mov.tipoMovimentacao)" [severity]="getMovSeverity(mov.tipoMovimentacao)" size="small"></p-tag>
                </div>
              </div>
            </div>
            <div class="empty-state" *ngIf="ultimasMovimentacoes.length === 0 && !loading">
              <i class="pi pi-inbox"></i>
              <p>{{ 'estoque.dashboard.emptyMov' | translate }}</p>
            </div>
          </div>
        </div>

        <!-- Itens com Baixo Estoque / Vencendo -->
        <div class="section-card">
          <div class="section-header">
            <h3>
              <i class="pi pi-exclamation-triangle"></i>
              {{ 'estoque.dashboard.alerts' | translate }}
            </h3>
          </div>
          <div class="section-content">
            <div class="alert-list">
              <div class="alert-item warning" *ngIf="itensVencendo > 0">
                <i class="pi pi-calendar-times"></i>
                <span>{{ 'estoque.dashboard.alert.expiring' | translate:{ count: '' + itensVencendo } }}</span>
              </div>
              <div class="alert-item info" *ngIf="itensBloqueados > 0">
                <i class="pi pi-lock"></i>
                <span>{{ 'estoque.dashboard.alert.blocked' | translate:{ count: '' + itensBloqueados } }}</span>
              </div>
              <div class="alert-item success" *ngIf="itensVencendo === 0 && itensBloqueados === 0">
                <i class="pi pi-check-circle"></i>
                <span>{{ 'estoque.dashboard.alert.none' | translate }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Instruções -->
      <div class="instructions-card">
        <h3>
          <i class="pi pi-info-circle"></i>
          {{ 'estoque.dashboard.instructions.title' | translate }}
        </h3>
        <div class="instructions-grid">
          <div class="instruction-step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h4>{{ 'estoque.dashboard.step1.title' | translate }}</h4>
              <p>{{ 'estoque.dashboard.step1.desc' | translate }}</p>
            </div>
          </div>
          <div class="instruction-step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h4>{{ 'estoque.dashboard.step2.title' | translate }}</h4>
              <p>{{ 'estoque.dashboard.step2.desc' | translate }}</p>
            </div>
          </div>
          <div class="instruction-step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h4>{{ 'estoque.dashboard.step3.title' | translate }}</h4>
              <p>{{ 'estoque.dashboard.step3.desc' | translate }}</p>
            </div>
          </div>
          <div class="instruction-step">
            <div class="step-number">4</div>
            <div class="step-content">
              <h4>{{ 'estoque.dashboard.step4.title' | translate }}</h4>
              <p>{{ 'estoque.dashboard.step4.desc' | translate }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; box-sizing: border-box; }
    .dashboard-container {
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
    }

    .dashboard-header {
      margin-bottom: 32px;
      
      h1 {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 28px;
        color: #1e293b;
        margin: 0 0 8px;
        
        i {
          color: #f59e0b;
        }
      }
      
      p {
        color: #64748b;
        margin: 0;
      }
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .dashboard-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      border-left: 4px solid;
      cursor: pointer;
      transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
      
      .card-icon {
        width: 56px;
        height: 56px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        
        i {
          font-size: 24px;
        }
      }
      
      .card-content {
        display: flex;
        flex-direction: column;
        
        .card-value {
          font-size: 28px;
          font-weight: 700;
          color: #1e293b;
        }
        
        .card-title {
          font-size: 13px;
          color: #64748b;
        }
        
        .card-subtitle {
          font-size: 11px;
          color: #94a3b8;
        }
      }
    }

    .quick-actions {
      margin-bottom: 32px;
      
      h2 {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 18px;
        color: #1e293b;
        margin: 0 0 16px;
        
        i {
          color: #f59e0b;
        }
      }
      
      .actions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
      }
      
      .action-btn {
        height: 60px;
        font-size: 14px;
        justify-content: flex-start;
        padding: 0 20px;
        
        &.qr-btn {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          border-color: #f59e0b;
        }
        
        &.entrada-btn {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          border-color: #22c55e;
        }
        
        &.invoice-btn {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          border-color: #3b82f6;
        }
        
        &.fornecedor-btn {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          border-color: #8b5cf6;
        }
      }
    }

    .sections-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .section-card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid #e2e8f0;
        
        h3 {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0;
          font-size: 16px;
          color: #1e293b;
          
          i {
            color: #f59e0b;
          }
        }
      }
      
      .section-content {
        padding: 20px;
        min-height: 200px;
      }
    }

    .movimentacao-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .movimentacao-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f8fafc;
      border-radius: 8px;
      
      .mov-icon {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        
        &.tipo-entrada {
          background: #dcfce7;
          color: #22c55e;
        }
        
        &.tipo-saida {
          background: #fee2e2;
          color: #ef4444;
        }
        
        &.tipo-transferencia {
          background: #dbeafe;
          color: #3b82f6;
        }
      }
      
      .mov-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        
        .mov-pn {
          font-weight: 600;
          color: #1e293b;
        }
        
        .mov-desc {
          font-size: 12px;
          color: #64748b;
        }
      }
      
      .mov-meta {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
        
        .mov-date {
          font-size: 11px;
          color: #94a3b8;
        }
      }
    }

    .alert-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .alert-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border-radius: 8px;
      
      i {
        font-size: 20px;
      }
      
      &.warning {
        background: #fef3c7;
        color: #92400e;
      }
      
      &.info {
        background: #dbeafe;
        color: #1e40af;
      }
      
      &.success {
        background: #dcfce7;
        color: #166534;
      }
    }

    .instructions-card {
      background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
      border-radius: 12px;
      padding: 24px;
      color: white;
      
      h3 {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 0 0 20px;
        font-size: 18px;
        
        i {
          color: #f59e0b;
        }
      }
      
      .instructions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
      }
      
      .instruction-step {
        display: flex;
        gap: 16px;
        
        .step-number {
          width: 36px;
          height: 36px;
          background: #f59e0b;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          flex-shrink: 0;
        }
        
        .step-content {
          h4 {
            margin: 0 0 4px;
            font-size: 14px;
            color: #e2e8f0;
          }
          
          p {
            margin: 0;
            font-size: 12px;
            color: #94a3b8;
          }
        }
      }
    }

    .empty-state {
      text-align: center;
      padding: 40px;
      color: #64748b;
      
      i {
        font-size: 40px;
        display: block;
        margin-bottom: 12px;
      }
    }

    @media (max-width: 768px) {
      .sections-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class EstoqueDashboardComponent implements OnInit, OnDestroy {
  private estoqueService = inject(EstoqueService);
  private i18n = inject(TranslationService);
  private langSub?: Subscription;

  loading = true;
  
  cards: DashboardCard[] = [];

  ultimasMovimentacoes: MovimentacaoEstoque[] = [];
  itensVencendo = 0;
  itensBloqueados = 0;

  ngOnInit() {
    this.rebuildCards();
    this.langSub = this.i18n.getCurrentLanguage$().subscribe(() => this.rebuildCards());
    this.carregarDados();
  }

  ngOnDestroy() {
    this.langSub?.unsubscribe();
  }

  private rebuildCards(): void {
    const v0 = this.cards[0]?.value ?? 0;
    const v1 = this.cards[1]?.value ?? 0;
    const v2 = this.cards[2]?.value ?? 0;
    const v3 = this.cards[3]?.value ?? 0;
    this.cards = [
      {
        title: this.i18n.translate('estoque.dashboard.card.items'),
        value: v0,
        icon: 'pi pi-box',
        color: '#22c55e',
        route: '/estoque/itens',
        subtitle: this.i18n.translate('estoque.dashboard.card.itemsSub')
      },
      {
        title: this.i18n.translate('estoque.dashboard.card.invoices'),
        value: v1,
        icon: 'pi pi-file-import',
        color: '#3b82f6',
        route: '/estoque/invoices'
      },
      {
        title: this.i18n.translate('estoque.dashboard.card.suppliers'),
        value: v2,
        icon: 'pi pi-truck',
        color: '#8b5cf6',
        route: '/estoque/fornecedores'
      },
      {
        title: this.i18n.translate('estoque.dashboard.card.movToday'),
        value: v3,
        icon: 'pi pi-history',
        color: '#f59e0b',
        route: '/estoque/movimentacoes'
      }
    ];
  }

  getMovLabel(tipo?: string): string {
    if (!tipo) return '';
    return this.i18n.translateCatalog('movimentacao.tipo', tipo, tipo);
  }

  carregarDados() {
    this.loading = true;
    
    // Carregar itens em estoque
    this.estoqueService.listarItensEstoque({ size: 1, status: 'DISPONIVEL' }).subscribe({
      next: (result) => {
        this.cards[0].value = result.totalElements ?? result.content?.length ?? 0;
      },
      error: () => {}
    });

    // Carregar últimas movimentações
    this.estoqueService.listarMovimentacoes({ size: 5 }).subscribe({
      next: (result) => {
        this.ultimasMovimentacoes = result.content;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });

    // Carregar fornecedores
    this.estoqueService.listarFornecedores({ size: 1 }).subscribe({
      next: (result) => {
        this.cards[2].value = result.totalElements ?? result.content?.length ?? 0;
      },
      error: () => {}
    });

    // Carregar invoices
    this.estoqueService.listarInvoices({ size: 1 }).subscribe({
      next: (result) => {
        this.cards[1].value = result.content?.length || 0;
      },
      error: () => {}
    });
  }

  getMovimentacaoIcon(tipo?: string): string {
    const icons: { [key: string]: string } = {
      'ENTRADA': 'pi pi-sign-in',
      'SAIDA': 'pi pi-sign-out',
      'TRANSFERENCIA': 'pi pi-arrows-h',
      'AJUSTE': 'pi pi-sliders-h',
      'DEVOLUCAO': 'pi pi-undo',
      'DESCARTE': 'pi pi-trash'
    };
    return icons[tipo || ''] || 'pi pi-circle';
  }

  getMovSeverity(tipo?: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    const severities: { [key: string]: 'success' | 'info' | 'warning' | 'danger' | 'secondary' } = {
      'ENTRADA': 'success',
      'SAIDA': 'danger',
      'TRANSFERENCIA': 'info',
      'AJUSTE': 'warning',
      'DEVOLUCAO': 'info',
      'DESCARTE': 'danger'
    };
    return severities[tipo || ''] || 'secondary';
  }
}
