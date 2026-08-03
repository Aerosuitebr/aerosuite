import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { BadgeModule } from 'primeng/badge';
import { MenuModule } from 'primeng/menu';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { passesPermissaoRota } from '../../auth/permissao.util';
import { MenuItem, MessageService } from 'primeng/api';
import { ManualPdfLoadError, ManualPdfService } from '../../core/manual-pdf.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { TranslationService } from '../../core/translation.service';
import { BrandingService } from '../../core/branding.service';
import { ThermalPrintSetupService } from '../../core/print/thermal-print-setup.service';
import { ThermalPrintSetupDialogComponent } from '../../core/print/thermal-print-setup-dialog.component';
import { ToastModule } from 'primeng/toast';
import { RouteLoadingBarComponent } from '../../shared/route-loading-bar/route-loading-bar.component';

interface NavMenuItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
  description?: string;
}

@Component({
  selector: 'app-estoque-layout',
  standalone: true,
  styleUrls: ['./estoque-page-hero-overrides.scss'],
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    TooltipModule,
    RippleModule,
    BadgeModule,
    MenuModule,
    DialogModule,
    ProgressSpinnerModule,
    TranslatePipe,
    ToastModule,
    ThermalPrintSetupDialogComponent,
    RouteLoadingBarComponent
  ],
  template: `
    <p-toast position="top-right"></p-toast>
    <app-thermal-print-setup-dialog></app-thermal-print-setup-dialog>
    <div class="estoque-layout">
      <!-- Header do Módulo Estoque -->
      <header class="estoque-header">
        <div class="header-left">
          <div class="module-brand">
            <div class="brand-icon">
              <i class="pi pi-box"></i>
            </div>
            <div class="brand-text">
              <h1>{{ 'estoque.layout.title' | translate }}</h1>
              <span>{{ 'estoque.layout.subtitle' | translate }}</span>
            </div>
          </div>
        </div>
        
        <div class="header-center">
          <div class="quick-search" (click)="irParaConsultaQr()">
            <i class="pi pi-qrcode"></i>
            <span>{{ 'estoque.layout.scanQr' | translate }}</span>
            <kbd>{{ 'estoque.layout.f2' | translate }}</kbd>
          </div>
        </div>
        
        <div class="header-right">
          <button pButton
                  icon="pi pi-arrow-left"
                  [label]="'estoque.layout.backSystem' | translate"
                  class="p-button-outlined return-btn"
                  (click)="voltarSistema()"
                  [pTooltip]="'estoque.layout.backTooltip' | translate"
                  [attr.aria-label]="'estoque.layout.backSystem' | translate">
          </button>
          <div class="header-actions-scroll">
            <div class="user-info">
              <span class="user-name">{{ userName }}</span>
              <span class="user-role">{{ 'estoque.layout.operator' | translate }}</span>
            </div>
            <button pButton
                    icon="pi pi-print"
                    [label]="'estoque.layout.thermalPrint' | translate"
                    class="p-button-outlined thermal-print-btn"
                    (click)="abrirImpressaoTermica()"
                    [pTooltip]="'estoque.layout.thermalPrintTooltip' | translate">
            </button>
            <button pButton
                    icon="pi pi-book"
                    [label]="'estoque.layout.manuals' | translate"
                    class="p-button-outlined manuais-btn"
                    (click)="menuManuais.toggle($event)"
                    [pTooltip]="'estoque.layout.manualsTooltip' | translate">
            </button>
            <p-menu #menuManuais [model]="manuaisItems" [popup]="true" appendTo="body" styleClass="estoque-manuais-menu"></p-menu>
          </div>
        </div>
      </header>

      <!-- Dialog do manual (PDF) -->
      <p-dialog styleClass="as-hero-dialog manual-pdf-dialog" [(visible)]="showManualDialog" [header]="manualDialogTitle" [style]="{ width: '90vw', maxWidth: '1000px' }"
                [modal]="true" [draggable]="false" [resizable]="true" (onHide)="fecharManualDialog()">
        <div class="manual-loading" *ngIf="manualLoading">
          <p-progressSpinner strokeWidth="3"></p-progressSpinner>
          <span>{{ 'estoque.manual.loading' | translate }}</span>
        </div>
        <iframe *ngIf="manualPdfSafeUrl && !manualLoading" [src]="manualPdfSafeUrl" class="manual-iframe" [attr.title]="'estoque.layout.manualPdfTitle' | translate"></iframe>
      </p-dialog>

      <!-- Navegação Principal -->
      <nav class="estoque-nav">
        <div class="nav-items">
          <a *ngFor="let item of menuItemsVisiveis" 
             [routerLink]="item.route"
             routerLinkActive="active"
             class="nav-item"
             pRipple>
            <div class="nav-icon">
              <i [class]="item.icon"></i>
              <span class="badge" *ngIf="item.badge">{{ item.badge }}</span>
            </div>
            <div class="nav-text">
              <span class="nav-label">{{ item.label | translate }}</span>
              <span class="nav-description">{{ item.description | translate }}</span>
            </div>
          </a>
        </div>
      </nav>

      <!-- Conteúdo Principal -->
      <main class="estoque-content">
        <app-route-loading-bar></app-route-loading-bar>
        <router-outlet></router-outlet>
      </main>

      <!-- Footer do Módulo -->
      <footer class="estoque-footer">
        <div class="footer-left">
          <span class="module-version">{{ 'estoque.layout.footerVersion' | translate }}</span>
        </div>
        <div class="footer-center">
          <span class="help-text">
            <i class="pi pi-info-circle"></i>
            {{ 'estoque.layout.footerHint' | translate }}
          </span>
        </div>
        <div class="footer-right">
          <span class="company">{{ branding.config().copyrightEntity }}</span>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .estoque-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: #0f172a;
    }

    /* ========== HEADER ========== */
    .estoque-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      height: 70px;
      background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
      border-bottom: 2px solid #f59e0b;
      position: relative;
      z-index: 200;
      flex-shrink: 0;
      
      .header-left {
        .module-brand {
          display: flex;
          align-items: center;
          gap: 16px;
          
          .brand-icon {
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            
            i {
              font-size: 24px;
              color: white;
            }
          }
          
          .brand-text {
            h1 {
              margin: 0;
              font-size: 22px;
              font-weight: 700;
              color: #f59e0b;
              letter-spacing: 3px;
            }
            
            span {
              font-size: 11px;
              color: #cbd5e1;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
          }
        }
      }
      
      .header-center {
        .quick-search {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 24px;
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.3);
          border-radius: 50px;
          cursor: pointer;
          transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
          
          &:hover {
            background: rgba(245, 158, 11, 0.2);
            border-color: #f59e0b;
          }
          
          i {
            font-size: 20px;
            color: #f59e0b;
          }
          
          span {
            color: #e2e8f0;
            font-weight: 500;
          }
          
          kbd {
            background: #334155;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            color: #cbd5e1;
            border: 1px solid #475569;
          }
        }
      }
      
      .header-right {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
        flex: 1;
        justify-content: flex-end;

        .return-btn {
          flex-shrink: 0;
        }

        .header-actions-scroll {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }
        
        .user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          
          .user-name {
            color: #e2e8f0;
            font-weight: 500;
          }
          
          .user-role {
            font-size: 11px;
            color: #cbd5e1;
          }
        }
        
      }

      /* Botões do header: texto e ícones brancos (padrão do módulo) */
      ::ng-deep .p-button.p-button-outlined.return-btn,
      ::ng-deep .p-button.p-button-outlined.thermal-print-btn,
      ::ng-deep .p-button.p-button-outlined.manuais-btn {
        color: #fff !important;
        border-color: rgba(255, 255, 255, 0.45) !important;
        background: rgba(255, 255, 255, 0.08) !important;
        white-space: nowrap;
        flex-shrink: 0;

        .p-button-label,
        .p-button-icon {
          color: #fff !important;
        }

        &:enabled:hover,
        &:not(:disabled):hover {
          color: #fff !important;
          background: rgba(255, 255, 255, 0.16) !important;
          border-color: rgba(255, 255, 255, 0.7) !important;

          .p-button-label,
          .p-button-icon {
            color: #fff !important;
          }
        }
      }

      ::ng-deep .return-btn {
        font-weight: 600;
      }
    }

    /* ========== DIALOG MANUAL PDF ========== */
    ::ng-deep .manual-pdf-dialog .p-dialog-content {
      padding: 0;
      overflow: hidden;
    }
    .manual-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      min-height: 400px;
      color: #64748b;
      font-size: 0.9rem;
    }
    .manual-iframe {
      width: 100%;
      height: 75vh;
      min-height: 400px;
      border: none;
      display: block;
    }

    /* ========== NAVEGAÇÃO ========== */
    .estoque-nav {
      background: #1e293b;
      border-bottom: 1px solid #334155;
      position: relative;
      z-index: 150;
      flex-shrink: 0;
      
      .nav-items {
        display: flex;
        flex-wrap: nowrap;
        padding: 0 24px;
        gap: 4px;
        overflow-x: auto;
        overflow-y: hidden;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior-x: contain;
        touch-action: pan-x;
        
        &::-webkit-scrollbar {
          height: 4px;
        }
        
        &::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 2px;
        }
      }
      
      .nav-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 20px;
        color: #cbd5e1;
        text-decoration: none;
        border-bottom: 3px solid transparent;
        transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
        white-space: nowrap;
        flex: 0 0 auto;
        flex-shrink: 0;
        
        &:hover {
          background: rgba(245, 158, 11, 0.08);
          color: #fff;

          .nav-icon i,
          .nav-label {
            color: #fff;
          }
        }
        
        &.active {
          color: #fff;
          border-bottom-color: #f59e0b;
          background: rgba(245, 158, 11, 0.15);
          
          .nav-icon i {
            color: #fff;
          }

          .nav-label {
            color: #fff;
          }
        }
        
        .nav-icon {
          position: relative;
          
          i {
            font-size: 20px;
            color: rgba(255, 255, 255, 0.88);
          }
          
          .badge {
            position: absolute;
            top: -8px;
            right: -8px;
            background: #ef4444;
            color: white;
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 10px;
            font-weight: 600;
          }
        }
        
        .nav-text {
          display: flex;
          flex-direction: column;
          
          .nav-label {
            font-weight: 500;
            font-size: 14px;
            color: rgba(255, 255, 255, 0.92);
          }
          
          .nav-description {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.72);
          }
        }
      }
    }

    /* ========== CONTEÚDO ========== */
    .estoque-content {
      position: relative;
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      width: 100%;
      padding: 16px 20px 20px;
      background: #f1f5f9;
      overflow-x: clip;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      box-sizing: border-box;
    }

    .estoque-content > :not(router-outlet):not(app-route-loading-bar) {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      width: 100%;
    }

    /* ========== FOOTER ========== */
    .estoque-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 24px;
      background: #1e293b;
      border-top: 1px solid #334155;
      
      .footer-left {
        .module-version {
          font-size: 12px;
          color: #cbd5e1;
        }
      }
      
      .footer-center {
        .help-text {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #cbd5e1;
          
          i {
            color: #f59e0b;
          }
        }
      }
      
      .footer-right {
        .company {
          font-size: 12px;
          font-weight: 600;
          color: #f59e0b;
          letter-spacing: 1px;
        }
      }
    }

    /* ========== RESPONSIVO ========== */
    @media (max-width: 1024px) {
      .estoque-header {
        flex-wrap: wrap;
        align-items: center;
        padding: 10px 12px;
        gap: 10px;
        min-height: 0;
        height: auto;

        .header-left {
          flex: 0 0 auto;
        }

        .header-center {
          display: none;
        }

        .header-right {
          flex: 1 1 100%;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 10px;
          justify-content: flex-start;

          .return-btn {
            flex: 0 0 auto;
            max-width: 42%;
          }

          .header-actions-scroll {
            flex: 1 1 auto;
            min-width: 0;
            display: flex;
            align-items: center;
            gap: 8px;
            overflow-x: auto;
            overflow-y: hidden;
            -webkit-overflow-scrolling: touch;
            overscroll-behavior-x: contain;
            touch-action: pan-x;
            padding-bottom: 2px;
            justify-content: flex-start;

            &::-webkit-scrollbar {
              height: 4px;
            }

            &::-webkit-scrollbar-thumb {
              background: rgba(255, 255, 255, 0.35);
              border-radius: 2px;
            }

            ::ng-deep .p-button {
              flex-shrink: 0;
            }
          }
        }
      }
      
      .estoque-nav .nav-item .nav-text {
        display: none !important;
      }

      .estoque-nav .nav-item {
        min-width: 48px;
        padding: 10px 12px;
        gap: 0;
        justify-content: center;
      }
    }

    @media (max-width: 768px) {
      .estoque-header {
        padding: 10px 12px;
        
        .header-left .module-brand {
          gap: 10px;

          .brand-icon {
            width: 40px;
            height: 40px;

            i {
              font-size: 20px;
            }
          }

          .brand-text {
            display: none;
          }
        }
        
        .header-right {
          gap: 8px;

          .return-btn {
            max-width: none;
          }

          .user-info {
            display: none;
          }

          .header-actions-scroll {
            gap: 8px;
          }
        }
      }
      
      .estoque-nav .nav-items {
        padding: 0 12px;
      }

      .estoque-header ::ng-deep .return-btn .p-button-label {
        font-size: 0.8125rem;
      }
    }

    @media (max-width: 480px) {
      .estoque-header {
        .header-right {
          flex-wrap: wrap;
          row-gap: 8px;

          .return-btn {
            flex: 0 0 auto;
          }

          .header-actions-scroll {
            flex: 1 1 100%;
            width: 100%;
          }
        }

        ::ng-deep .return-btn .p-button-label {
          display: none;
        }
      }
      
      .estoque-content {
        padding: 16px;
      }
      
      .estoque-footer {
        .footer-center {
          display: none;
        }
      }
    }
  `]
})
export class EstoqueLayoutComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private authService = inject(AuthService);
  private sanitizer = inject(DomSanitizer);
  private i18n = inject(TranslationService);
  protected branding = inject(BrandingService);
  private thermalPrintSetup = inject(ThermalPrintSetupService);
  private manualPdfService = inject(ManualPdfService);
  private messageService = inject(MessageService);

  private langSub?: Subscription;
  private manualBlobUrl: string | null = null;

  userName = '';
  showManualDialog = false;
  manualDialogTitle = '';
  manualPdfSafeUrl: SafeResourceUrl | null = null;
  manualLoading = false;

  /** Lista de manuais no dropdown (arquivos na pasta manuals/). */
  manuaisItems: MenuItem[] = [];

  menuItems: NavMenuItem[] = [
    {
      label: 'estoque.nav.dashboard',
      icon: 'pi pi-chart-bar',
      route: '/estoque/dashboard',
      description: 'estoque.nav.dashboard.desc'
    },
    {
      label: 'estoque.nav.consultaQr',
      icon: 'pi pi-qrcode',
      route: '/estoque/consulta-qr',
      description: 'estoque.nav.consultaQr.desc'
    },
    {
      label: 'estoque.nav.rastreio',
      icon: 'pi pi-history',
      route: '/estoque/rastreio',
      description: 'estoque.nav.rastreio.desc'
    },
    {
      label: 'estoque.nav.entrada',
      icon: 'pi pi-sign-in',
      route: '/estoque/entrada',
      description: 'estoque.nav.entrada.desc'
    },
    {
      label: 'estoque.nav.itens',
      icon: 'pi pi-list',
      route: '/estoque/itens',
      description: 'estoque.nav.itens.desc'
    },
    {
      label: 'estoque.nav.quarentena',
      icon: 'pi pi-shield',
      route: '/estoque/quarentena',
      description: 'estoque.nav.quarentena.desc'
    },
    {
      label: 'estoque.nav.saidas',
      icon: 'pi pi-arrow-circle-right',
      route: '/estoque/saidas',
      description: 'estoque.nav.saidas.desc'
    },
    {
      label: 'estoque.nav.minLote',
      icon: 'pi pi-upload',
      route: '/estoque/estoque-minimo-lote',
      description: 'estoque.nav.minLote.desc'
    },
    {
      label: 'estoque.nav.invoices',
      icon: 'pi pi-file-import',
      route: '/estoque/invoices',
      description: 'estoque.nav.invoices.desc'
    },
    {
      label: 'estoque.nav.fornecedores',
      icon: 'pi pi-truck',
      route: '/estoque/fornecedores',
      description: 'estoque.nav.fornecedores.desc'
    },
    {
      label: 'estoque.nav.lotes',
      icon: 'pi pi-th-large',
      route: '/estoque/lotes',
      description: 'estoque.nav.lotes.desc'
    },
    {
      label: 'estoque.nav.movimentacoes',
      icon: 'pi pi-history',
      route: '/estoque/movimentacoes',
      description: 'estoque.nav.movimentacoes.desc'
    },
    {
      label: 'estoque.nav.kitFcu',
      icon: 'pi pi-compass',
      route: '/estoque/rastreio-saidas-automaticas',
      description: 'estoque.nav.kitFcu.desc'
    }
  ];

  get menuItemsVisiveis(): NavMenuItem[] {
    const u = this.authService.getCurrentUser();
    if (!passesPermissaoRota(u, { funcionalidadesPrefix: ['ESTOQUE'] })) {
      return [];
    }
    return this.menuItems;
  }

  ngOnInit() {
    void this.branding.load();

    const user = this.authService.getCurrentUser();
    this.userName = user?.nome || user?.email || this.i18n.translate('profile.userFallback');

    this.rebuildManuaisItems();
    this.langSub = this.i18n.getCurrentLanguage$().subscribe(() => this.rebuildManuaisItems());

    // Listener para atalho F2
    document.addEventListener('keydown', this.handleKeydown.bind(this));
  }

  ngOnDestroy() {
    this.langSub?.unsubscribe();
    document.removeEventListener('keydown', this.handleKeydown.bind(this));
  }

  private rebuildManuaisItems(): void {
    this.manuaisItems = [
      {
        label: this.i18n.translate('estoque.manual.min'),
        icon: 'pi pi-file-pdf',
        command: () => this.abrirManual('estoque.manual.min', 'Estoque_minimo_Manual.pdf')
      },
      {
        label: this.i18n.translate('estoque.manual.equal'),
        icon: 'pi pi-file-pdf',
        command: () => this.abrirManual('estoque.manual.equal', 'EQUALIZACAO_ESTOQUE_FISICO_SISTEMA.pdf')
      }
    ];
  }

  handleKeydown(event: KeyboardEvent) {
    if (event.key === 'F2') {
      event.preventDefault();
      this.irParaConsultaQr();
    }
  }

  irParaConsultaQr() {
    this.router.navigate(['/estoque/consulta-qr']);
  }

  abrirImpressaoTermica(): void {
    this.thermalPrintSetup.open('manual');
  }

  voltarSistema() {
    this.router.navigate(['/']);
  }

  abrirManual(titleKey: string, filename: string) {
    this.fecharManualDialog();
    this.manualDialogTitle = this.i18n.translate(titleKey);
    this.showManualDialog = true;
    this.manualLoading = true;

    this.manualPdfService.fetchBlobUrl(filename).subscribe({
      next: blobUrl => {
        this.manualBlobUrl = blobUrl;
        this.manualPdfSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl);
        this.manualLoading = false;
      },
      error: (err: unknown) => {
        this.manualLoading = false;
        const key =
          err instanceof ManualPdfLoadError
            ? ({
                notFound: 'estoque.manual.notFound',
                forbidden: 'estoque.manual.forbidden',
                unauthorized: 'estoque.manual.unauthorized',
                server: 'estoque.manual.loadError',
              }[err.code] ?? 'estoque.manual.loadError')
            : 'estoque.manual.loadError';
        this.i18n.addToast(this.messageService, 'error', 'common.toast.error', key);
      },
    });
  }

  fecharManualDialog(): void {
    if (this.manualBlobUrl) {
      URL.revokeObjectURL(this.manualBlobUrl);
      this.manualBlobUrl = null;
    }
    this.manualPdfSafeUrl = null;
    this.manualLoading = false;
  }
}
