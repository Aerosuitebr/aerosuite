import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CarouselModule } from 'primeng/carousel';
import { TooltipModule } from 'primeng/tooltip';
import { UsuarioExternoService, UsuarioExterno, OSExternaResumo, PropostaExternaResumo } from '../../core/usuario-externo.service';
import { BrandingService } from '../../core/branding.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { UiLabelPipe } from '../../core/ui-label.pipe';
import { TranslationService } from '../../core/translation.service';
import { formatUiDateTime } from '../../core/locale/locale-intl.util';
import { BrandStackComponent } from '../../shared/brand-stack/brand-stack.component';
import { PhoneBrPipe } from '../../core/phone-br.pipe';
import { phoneTelHref } from '../../core/br-input.util';

@Component({
  standalone: true,
  selector: 'app-externo-home',
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    CardModule,
    CarouselModule,
    TooltipModule,
    TranslatePipe,
    UiLabelPipe,
    BrandStackComponent,
    PhoneBrPipe,
  ],
  template: `
    <div class="externo-home">
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <app-brand-stack surface="dark" size="hero" />
          <p class="hero-subtitle">{{ '' | uiLabel:'tagline' | uppercase }}</p>
          <p class="hero-tagline">{{ 'externo.home.heroTagline' | translate }}</p>
        </div>
        <div class="hero-pattern"></div>
      </section>

      <!-- Welcome Section -->
      <section class="welcome-section">
        <div class="welcome-card">
          <div class="welcome-icon">
            <i class="pi pi-user-plus"></i>
          </div>
          <div class="welcome-content">
            <h2>{{ welcomeTitle }}</h2>
            <p *ngIf="currentUser?.empresa">{{ currentUser.empresa }}</p>
            <p class="welcome-message">{{ 'externo.home.portalHint' | translate }}</p>
          </div>
        </div>
      </section>

      <!-- Stats Section -->
      <section class="stats-section" *ngIf="hasAccess">
        <a *ngIf="hasAccessToOS"
           class="stat-card blue stat-card--link"
           routerLink="/externo/os"
           [attr.aria-label]="'externo.home.stat.osBtn' | translate">
          <div class="stat-card__layout">
            <div class="stat-icon">
              <i class="pi pi-file-edit"></i>
            </div>
            <div class="stat-details">
              <div class="stat-value">{{ totalOS }}</div>
              <div class="stat-label">{{ 'externo.home.stat.osLabel' | translate }}</div>
              <span class="stat-hint">{{ 'externo.home.stat.osBtn' | translate }}</span>
            </div>
          </div>
        </a>

        <a *ngIf="hasAccessToDocs"
           class="stat-card green stat-card--link"
           routerLink="/externo/documentos"
           [attr.aria-label]="'externo.home.stat.docsBtn' | translate">
          <div class="stat-card__layout">
            <div class="stat-icon">
              <i class="pi pi-folder-open"></i>
            </div>
            <div class="stat-details">
              <div class="stat-value">{{ totalDocumentos }}</div>
              <div class="stat-label">{{ 'externo.home.stat.docsLabel' | translate }}</div>
              <span class="stat-hint">{{ 'externo.home.stat.docsBtn' | translate }}</span>
            </div>
          </div>
        </a>

        <a *ngIf="hasAccessToPropostas"
           class="stat-card orange stat-card--link"
           routerLink="/externo/propostas"
           [attr.aria-label]="'externo.home.stat.propostasBtn' | translate">
          <div class="stat-card__layout">
            <div class="stat-icon">
              <i class="pi pi-file"></i>
            </div>
            <div class="stat-details">
              <div class="stat-value">{{ totalPropostas }}</div>
              <div class="stat-label">{{ 'externo.home.stat.propostasLabel' | translate }}</div>
              <span class="stat-hint">{{ 'externo.home.stat.propostasBtn' | translate }}</span>
            </div>
          </div>
        </a>
      </section>

      <!-- Services Showcase -->
      <section class="services-section">
        <h2 class="section-title">
          <span class="title-icon"><i class="pi pi-cog"></i></span>
          {{ 'externo.home.services.title' | translate }}
        </h2>
        
        <div class="services-grid">
          <div class="service-card">
            <div class="service-icon">
              <i class="pi pi-wrench"></i>
            </div>
            <h3>{{ 'externo.home.service.revisao.t' | translate }}</h3>
            <p>{{ 'externo.home.service.revisao.d' | translate }}</p>
          </div>
          
          <div class="service-card">
            <div class="service-icon">
              <i class="pi pi-cog"></i>
            </div>
            <h3>{{ 'externo.home.service.reparo.t' | translate }}</h3>
            <p>{{ 'externo.home.service.reparo.d' | translate }}</p>
          </div>
          
          <div class="service-card">
            <div class="service-icon">
              <i class="pi pi-search"></i>
            </div>
            <h3>{{ 'externo.home.service.inspecao.t' | translate }}</h3>
            <p>{{ 'externo.home.service.inspecao.d' | translate }}</p>
          </div>
          
          <div class="service-card">
            <div class="service-icon">
              <i class="pi pi-check-circle"></i>
            </div>
            <h3>{{ 'externo.home.service.teste.t' | translate }}</h3>
            <p>{{ 'externo.home.service.teste.d' | translate }}</p>
          </div>
          
          <div class="service-card">
            <div class="service-icon">
              <i class="pi pi-shield"></i>
            </div>
            <h3>{{ 'externo.home.service.garantia.t' | translate }}</h3>
            <p>{{ 'externo.home.service.garantia.d' | translate }}</p>
          </div>
          
          <div class="service-card">
            <div class="service-icon">
              <i class="pi pi-calendar"></i>
            </div>
            <h3>{{ 'externo.home.service.preventiva.t' | translate }}</h3>
            <p>{{ 'externo.home.service.preventiva.d' | translate }}</p>
          </div>
        </div>
      </section>

      <!-- Image Gallery Section -->
      <section class="gallery-section">
        <h2 class="section-title">
          <span class="title-icon"><i class="pi pi-images"></i></span>
          {{ 'externo.home.gallery.title' | translate }}
        </h2>
        
        <div class="gallery-grid">
          <div class="gallery-item">
            <div class="gallery-image gallery-image--fcu">
              <img src="assets/Aero_Claro.png" alt="" loading="lazy" decoding="async" />
              <div class="gallery-overlay">
                <span>{{ 'externo.home.gallery.fcucap' | translate }}</span>
              </div>
            </div>
          </div>
          <div class="gallery-item">
            <div class="gallery-image aviation-bg">
              <i class="pi pi-send gallery-visual-icon" aria-hidden="true"></i>
              <div class="gallery-overlay">
                <span>{{ 'externo.home.gallery.compCap' | translate }}</span>
              </div>
            </div>
          </div>
          <div class="gallery-item">
            <div class="gallery-image workshop-bg">
              <i class="pi pi-wrench gallery-visual-icon" aria-hidden="true"></i>
              <div class="gallery-overlay">
                <span>{{ 'externo.home.gallery.teamCap' | translate }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Recent Proposals Section -->
      <section class="recent-section" *ngIf="recentPendingPropostas.length > 0 && hasAccessToPropostas">
        <h2 class="section-title">
          <span class="title-icon"><i class="pi pi-inbox"></i></span>
          {{ 'externo.home.recentPropostas.title' | translate }}
        </h2>

        <div class="recent-list">
          <div class="recent-item" *ngFor="let prop of recentPendingPropostas">
            <div class="recent-status status-pending">
              {{ getPropostaStatusLabel(prop.status) }}
            </div>
            <div class="recent-info">
              <span class="recent-number">{{ prop.numeroProposta || ('#' + prop.id) }}</span>
              <span class="recent-type">{{ prop.produtoNome || prop.produtoPn || ('externo.home.recent.serviceFallback' | translate) }}</span>
            </div>
            <div class="recent-date">
              {{ formatDate(prop.dataProposta) }}
            </div>
            <button pButton icon="pi pi-eye"
                    class="p-button-text p-button-rounded p-button-sm"
                    [pTooltip]="'externo.home.recent.tooltipDetail' | translate"
                    [routerLink]="['/externo/propostas', prop.id]"></button>
          </div>
        </div>

        <div class="see-all-link">
          <a routerLink="/externo/propostas">{{ 'externo.home.recentPropostas.seeAll' | translate }}</a>
        </div>
      </section>

      <!-- Recent OS Section -->
      <section class="recent-section" *ngIf="recentOS.length > 0 && hasAccessToOS">
        <h2 class="section-title">
          <span class="title-icon"><i class="pi pi-history"></i></span>
          {{ 'externo.home.recent.title' | translate }}
        </h2>
        
        <div class="recent-list">
          <div class="recent-item" *ngFor="let os of recentOS">
            <div class="recent-status" [class]="getStatusClass(os.status)">
              {{ os.status ? os.status : ('externo.home.recent.statusAberta' | translate) }}
            </div>
            <div class="recent-info">
              <span class="recent-number">OS #{{ (os.idOs && os.idOs > 0) ? os.idOs : (os.id ? os.id : '-') }}</span>
              <span class="recent-type">{{ (os.clienteNome ? os.clienteNome + (os.tipoServico ? ' - ' : '') : '') + (os.tipoServico || ('externo.home.recent.serviceFallback' | translate)) }}</span>
            </div>
            <div class="recent-date">
              {{ formatDate(os.dtAbertura) }}
            </div>
            <button pButton icon="pi pi-eye" 
                    class="p-button-text p-button-rounded p-button-sm"
                    [pTooltip]="'externo.home.recent.tooltipDetail' | translate"
                    [routerLink]="['/externo/os', os.id]"></button>
          </div>
        </div>
        
        <div class="see-all-link">
          <a routerLink="/externo/os">{{ 'externo.home.recent.seeAll' | translate }}</a>
        </div>
      </section>

      <!-- Contact Section -->
      <section class="contact-section" *ngIf="hasContactInfo">
        <div class="contact-card">
          <h2>{{ 'externo.home.help.title' | translate }}</h2>
          <p>{{ 'externo.home.help.subtitle' | translate }}</p>
          <div class="contact-info">
            <a *ngIf="supportEmail"
               class="contact-item contact-item--link"
               [href]="'mailto:' + supportEmail">
              <i class="pi pi-envelope"></i>
              <span>{{ supportEmail }}</span>
            </a>
            <a *ngIf="supportPhone"
               class="contact-item contact-item--link"
               [href]="supportPhoneHref">
              <i class="pi pi-phone"></i>
              <span>{{ supportPhone | phoneBr }}</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  `,
  styleUrls: ['./externo-home.component.scss']
})
export class ExternoHomeComponent implements OnInit {
  protected branding = inject(BrandingService);
  private usuarioExternoService = inject(UsuarioExternoService);
  private i18n = inject(TranslationService);

  currentUser: UsuarioExterno | null = null;

  get welcomeTitle(): string {
    const name =
      this.currentUser?.nome?.trim() || this.i18n.translate('externo.home.welcomeFallback');
    return this.i18n.translate('externo.home.welcome', { name });
  }
  recentOS: OSExternaResumo[] = [];
  recentPendingPropostas: PropostaExternaResumo[] = [];
  totalOS = 0;
  totalDocumentos = 0;
  totalPropostas = 0;
  hasAccess = false;
  hasAccessToOS = false;
  hasAccessToDocs = false;
  hasAccessToPropostas = false;

  get supportEmail(): string {
    return this.branding.config().supportEmail?.trim() ?? '';
  }

  get supportPhone(): string {
    return this.branding.config().supportPhone?.trim() ?? '';
  }

  get hasContactInfo(): boolean {
    return !!(this.supportEmail || this.supportPhone);
  }

  get supportPhoneHref(): string {
    return phoneTelHref(this.supportPhone);
  }

  ngOnInit() {
    void this.branding.load({
      tenantCodigo: this.usuarioExternoService.getStoredTenantCodigo(),
    });

    this.currentUser = this.usuarioExternoService.getCurrentUser();
    this.hasAccessToOS = this.usuarioExternoService.hasAccessTo('os-externa');
    this.hasAccessToDocs = this.usuarioExternoService.hasAccessTo('documentos-externos');
    this.hasAccessToPropostas = this.usuarioExternoService.hasAccessTo('propostas-externa');
    this.hasAccess = this.hasAccessToOS || this.hasAccessToDocs || this.hasAccessToPropostas;

    if (this.hasAccessToOS) {
      this.loadRecentOS();
    }

    if (this.hasAccessToDocs) {
      this.loadDocumentsCount();
    }

    if (this.hasAccessToPropostas) {
      this.loadPropostas();
    }
  }

  private loadRecentOS() {
    this.usuarioExternoService.getMinhasOS().subscribe({
      next: (os) => {
        // Ordenar por data de abertura (mais recentes primeiro)
        const sortedOS = [...os].sort((a, b) => {
          const dateA = a.dtAbertura ? new Date(a.dtAbertura).getTime() : 0;
          const dateB = b.dtAbertura ? new Date(b.dtAbertura).getTime() : 0;
          return dateB - dateA; // Ordem decrescente (mais recente primeiro)
        });
        
        this.totalOS = sortedOS.length;
        // Pegar as 5 mais recentes
        this.recentOS = sortedOS.slice(0, 5);
      },
      error: (err) => {
        console.error('Failed to load work order:', err);
        this.totalOS = 0;
        this.recentOS = [];
      }
    });
  }

  private loadDocumentsCount() {
    this.usuarioExternoService.getMeusDocumentos().subscribe({
      next: (docs) => {
        this.totalDocumentos = docs.length;
      },
      error: (err) => {
        console.error('Failed to load documents:', err);
      }
    });
  }

  private loadPropostas() {
    this.usuarioExternoService.getMinhasPropostas().subscribe({
      next: (propostas) => {
        this.totalPropostas = propostas.length;
        const pending = propostas
          .filter((p) => (p.status ?? '').toUpperCase() === 'ENVIADA')
          .sort((a, b) => {
            const dateA = a.dataProposta ? new Date(a.dataProposta).getTime() : 0;
            const dateB = b.dataProposta ? new Date(b.dataProposta).getTime() : 0;
            return dateB - dateA;
          });
        this.recentPendingPropostas = pending.slice(0, 5);
      },
      error: (err) => {
        console.error('Failed to load proposals:', err);
        this.totalPropostas = 0;
        this.recentPendingPropostas = [];
      }
    });
  }

  getPropostaStatusLabel(status: string | undefined): string {
    if (!status) return '-';
    const key = `externo.propostas.status.${status.toUpperCase()}`;
    const translated = this.i18n.translate(key);
    return translated !== key ? translated : status;
  }

  getStatusClass(status: string): string {
    const normalized = (status ?? '')
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase();
    switch (normalized) {
      case 'aberta': return 'status-open';
      case 'concluida': return 'status-completed';
      case 'fechada': return 'status-closed';
      default: return 'status-default';
    }
  }

  formatDate(date: string | undefined | null): string {
    if (!date) return '-';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return '-';
      return formatUiDateTime(this.i18n.getCurrentLanguage(), dateObj, 'date');
    } catch {
      return '-';
    }
  }
}
