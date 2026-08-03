import { Component, OnInit, OnDestroy, inject, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SidebarModule } from 'primeng/sidebar';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { MenuModule } from 'primeng/menu';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { Subject, takeUntil } from 'rxjs';
import { UsuarioExternoService, FuncionalidadeExterna, UsuarioExterno } from '../../core/usuario-externo.service';
import { DeviceDetectionService } from '../../core/device-detection.service';
import { BrandingService } from '../../core/branding.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { UiLabelPipe } from '../../core/ui-label.pipe';
import { LanguageSwitcherComponent } from '../../shared/language-switcher/language-switcher.component';
import { BrandStackComponent } from '../../shared/brand-stack/brand-stack.component';
import { RouteLoadingBarComponent } from '../../shared/route-loading-bar/route-loading-bar.component';

@Component({
  standalone: true,
  selector: 'app-externo-layout',
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    ButtonModule,
    SidebarModule,
    AvatarModule,
    TooltipModule,
    MenuModule,
    OverlayPanelModule,
    TranslatePipe,
    UiLabelPipe,
    LanguageSwitcherComponent,
    BrandStackComponent,
    RouteLoadingBarComponent
  ],
  template: `
    <div class="externo-container" 
         [class.sidebar-collapsed]="sidebarCollapsed"
         [class.mobile]="deviceService.isMobile()"
         [class.tablet]="deviceService.isTablet()">
      
      <!-- Mobile Menu Button -->
      <button 
        *ngIf="deviceService.isMobile()"
        pButton 
        icon="pi pi-bars" 
        class="mobile-menu-btn"
        (click)="toggleMobileMenu()"
        [pTooltip]="'externo.menu' | translate"
        tooltipPosition="bottom">
      </button>

      <!-- Mobile Overlay -->
      <div *ngIf="deviceService.isMobile() && mobileMenuOpen" 
           class="mobile-overlay"
           (click)="closeMobileMenu()">
      </div>

      <!-- Sidebar -->
      <aside class="sidebar" 
             [class.collapsed]="sidebarCollapsed && !deviceService.isMobile()"
             [class.mobile-open]="mobileMenuOpen && deviceService.isMobile()">
        <div class="sidebar-content">
          <!-- Header -->
          <div
            class="sidebar-header"
            [class.sidebar-header--collapsed]="sidebarCollapsed && !deviceService.isMobile()">
            <div class="sidebar-header__top">
              <div class="sidebar-header__brand" *ngIf="showExpandedSidebarBrand">
                <app-brand-stack surface="dark" size="sidebar" [showWordmark]="true"></app-brand-stack>
                <p class="sidebar-header__subtitle">{{ 'externo.portalSubtitle' | translate }}</p>
              </div>
              <div class="sidebar-header__brand sidebar-header__brand--rail" *ngIf="showRailSidebarBrand">
                <app-brand-stack surface="dark" size="collapsed" [showWordmark]="false"></app-brand-stack>
              </div>
              <button
                *ngIf="!deviceService.isMobile()"
                pButton
                type="button"
                [icon]="sidebarCollapsed ? 'pi pi-angle-right' : 'pi pi-angle-left'"
                class="p-button-text sidebar-toggle sidebar-header__toggle"
                [attr.aria-label]="(sidebarCollapsed ? 'externo.layout.expandSidebar' : 'externo.layout.collapseSidebar') | translate"
                (click)="toggleSidebar()">
              </button>
              <button
                *ngIf="deviceService.isMobile()"
                pButton
                type="button"
                icon="pi pi-times"
                class="p-button-text sidebar-toggle mobile-close sidebar-header__toggle"
                [attr.aria-label]="'externo.layout.closeMenu' | translate"
                (click)="closeMobileMenu()">
              </button>
            </div>
          </div>

          <!-- User Section -->
          <div class="user-section">
            <div class="user-info" *ngIf="!sidebarCollapsed">
              <p-avatar 
                [label]="getInitials()" 
                size="normal" 
                shape="circle"
                styleClass="user-avatar">
              </p-avatar>
              <div class="user-details">
                <span class="user-name">{{ currentUser?.nome || ('externo.client' | translate) }}</span>
                <span class="user-company">{{ currentUser?.empresa || '' }}</span>
              </div>
            </div>
            <div class="user-collapsed" *ngIf="sidebarCollapsed">
              <p-avatar 
                [label]="getInitials()" 
                size="normal" 
                shape="circle"
                [pTooltip]="currentUser?.nome || ('externo.client' | translate)"
                tooltipPosition="right">
              </p-avatar>
            </div>
          </div>

          <!-- Navigation -->
          <nav class="sidebar-nav">
            <ul class="nav-list">
              <li class="nav-item" *ngFor="let func of funcionalidades">
                <a 
                  [routerLink]="getExternalRoute(func.rota)"
                  routerLinkActive="active"
                  [routerLinkActiveOptions]="{exact: func.codigo === 'home-externa'}"
                  class="nav-link"
                  [pTooltip]="(sidebarCollapsed && !deviceService.isMobile()) ? func.nome : ''"
                  tooltipPosition="right"
                  (click)="deviceService.isMobile() && closeMobileMenu()">
                  <i [class]="func.icone || 'pi pi-circle'"></i>
                  <span *ngIf="!sidebarCollapsed || deviceService.isMobile()">{{ func.nome }}</span>
                </a>
              </li>
            </ul>
          </nav>

          <!-- Logout Button -->
          <div class="sidebar-footer">
            <button 
              pButton 
              type="button"
              [icon]="sidebarCollapsed ? 'pi pi-sign-out' : ''"
              [label]="sidebarCollapsed ? '' : ('layout.logout' | translate)"
              class="p-button-text logout-btn"
              [pTooltip]="(sidebarCollapsed && !deviceService.isMobile()) ? ('layout.logout' | translate) : ''"
              tooltipPosition="right"
              (click)="logout(); deviceService.isMobile() && closeMobileMenu()">
              <i *ngIf="!sidebarCollapsed" class="pi pi-sign-out" style="margin-right: 8px;"></i>
            </button>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <app-route-loading-bar></app-route-loading-bar>
        <header class="main-topbar">
          <div class="main-topbar__actions">
            <button
              pButton
              type="button"
              icon="pi pi-globe"
              class="p-button-text p-button-rounded main-topbar__lang-btn"
              (click)="langPanel.toggle($event)"
              [attr.aria-label]="'language.switcher.aria' | translate"
              [pTooltip]="'language.switcher.aria' | translate"
              tooltipPosition="bottom">
            </button>
            <p-overlayPanel #langPanel [dismissable]="true" styleClass="externo-lang-panel">
              <app-language-switcher variant="panel"></app-language-switcher>
            </p-overlayPanel>
          </div>
        </header>
        <div class="content-wrapper">
          <router-outlet></router-outlet>
        </div>
        
        <!-- Footer -->
        <footer class="externo-footer">
          <p>© {{ currentYear }} {{ branding.config().copyrightEntity }} — {{ '' | uiLabel:'tagline' }} | {{ 'externo.portalSubtitle' | translate }}</p>
        </footer>
      </main>
    </div>
  `,
  styleUrls: ['./externo-layout.component.scss']
})
export class ExternoLayoutComponent implements OnInit, OnDestroy {
  @HostBinding('class') get deviceClass() {
    return this.deviceService.getDeviceClass();
  }

  protected deviceService = inject(DeviceDetectionService);
  protected branding = inject(BrandingService);
  private usuarioExternoService = inject(UsuarioExternoService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  currentUser: UsuarioExterno | null = null;
  funcionalidades: FuncionalidadeExterna[] = [];
  sidebarCollapsed = false;
  mobileMenuOpen = false;
  currentYear = new Date().getFullYear();

  get showExpandedSidebarBrand(): boolean {
    if (this.deviceService.isMobile()) {
      return true;
    }
    if (this.deviceService.isTablet()) {
      return false;
    }
    return !this.sidebarCollapsed;
  }

  get showRailSidebarBrand(): boolean {
    if (this.deviceService.isMobile()) {
      return false;
    }
    if (this.deviceService.isTablet()) {
      return true;
    }
    return this.sidebarCollapsed;
  }

  ngOnInit() {
    void this.branding.load({
      tenantCodigo: this.usuarioExternoService.getStoredTenantCodigo(),
    });

    this.currentUser = this.usuarioExternoService.getCurrentUser();
    this.funcionalidades = this.usuarioExternoService.getFuncionalidades();

    // Subscribe to user changes
    this.usuarioExternoService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });

    // Load sidebar state (apenas para desktop)
    if (!this.deviceService.isMobile()) {
      const savedState = localStorage.getItem('externoSidebarCollapsed');
      if (savedState !== null) {
        this.sidebarCollapsed = JSON.parse(savedState);
      }
    } else {
      // Em mobile, sempre fechado por padrão
      this.sidebarCollapsed = false;
      this.mobileMenuOpen = false;
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleSidebar() {
    if (this.deviceService.isMobile()) {
      this.mobileMenuOpen = !this.mobileMenuOpen;
    } else {
      this.sidebarCollapsed = !this.sidebarCollapsed;
      localStorage.setItem('externoSidebarCollapsed', JSON.stringify(this.sidebarCollapsed));
    }
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }

  getInitials(): string {
    if (!this.currentUser?.nome) return 'C';
    const names = this.currentUser.nome.split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[names.length - 1][0];
    }
    return names[0][0];
  }

  logout() {
    this.usuarioExternoService.logout();
    this.router.navigate(['/externo/login']);
  }

  // ⚠️ SEGURANÇA: Garantir que rotas externas sempre usem /externo/ prefix
  getExternalRoute(rota: string | undefined): string {
    if (!rota) return '/externo/home';
    
    // Se já começa com /externo/, retornar como está
    if (rota.startsWith('/externo/')) {
      return rota;
    }
    
    // Se começa com /, mas não com /externo, adicionar /externo prefix
    if (rota.startsWith('/')) {
      // Mapear rotas internas para rotas externas
      const routeMap: { [key: string]: string } = {
        '/home': '/externo/home',
        '/os': '/externo/os',
        '/documentos': '/externo/documentos',
        '/perfil': '/externo/perfil',
        '/propostas': '/externo/propostas'
      };
      
      // Se está no mapeamento, usar a rota externa correspondente
      if (routeMap[rota]) {
        return routeMap[rota];
      }
      
      // Se não está no mapeamento, adicionar /externo prefix
      return `/externo${rota}`;
    }
    
    // Se não começa com /, adicionar /externo/
    return `/externo/${rota}`;
  }
}
