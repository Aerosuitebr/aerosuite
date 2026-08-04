import { ChangeDetectorRef, Component, inject, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SidebarModule } from 'primeng/sidebar';
import { MenuModule } from 'primeng/menu';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { DialogModule } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { MenuItem } from 'primeng/api';
import { Subject, takeUntil, merge, interval, of } from 'rxjs';
import { filter, switchMap, catchError, startWith, map, distinctUntilChanged, timeout } from 'rxjs/operators';
import { FooterComponent } from '../shared/footer/footer.component';
import { BrandStackComponent } from '../shared/brand-stack/brand-stack.component';
import { BackupProgressNotificationComponent } from '../shared/backup-progress-notification/backup-progress-notification.component';
import { NotificationBellComponent } from '../shared/notification-bell/notification-bell.component';
import { ChatIconComponent } from '../shared/chat-icon/chat-icon.component';
import { ChatNotificationComponent } from '../shared/chat-notification/chat-notification.component';
import { ContextualOnboardingBannerComponent } from '../shared/contextual-onboarding-banner/contextual-onboarding-banner.component';
import { MenuService, MenuSection } from '../core/menu.service';
import { Funcionalidade } from '../core/funcionalidade.service';
import { AuthService, User } from '../auth/auth.service';
import { DEFAULT_USUARIO_AVATAR, usuarioAvatarInitials } from '../core/usuario-foto.util';
import { SessionIdleService } from '../core/session-idle.service';
import { FotoUploadResponse, parseFotoUploadFilename, UsuarioFotoService } from '../core/usuario-foto.service';
import { passesPermissaoRota } from '../auth/permissao.util';
import { HttpClient, HttpEventType, HttpResponse } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { environment } from '../../environments/environment';
import { DeviceDetectionService } from '../core/device-detection.service';
import { ChatService } from '../core/chat.service';
import { OsDeficitTrocaNotificacaoService, OsTrocaDeficitNotificacao } from '../core/os-deficit-troca-notificacao.service';
import { BrandingService } from '../core/branding.service';
import { TranslationService } from '../core/translation.service';
import { extractApiErrorMessage } from '../core/backend-i18n-message.util';
import { TranslatePipe } from '../core/translate.pipe';
import { LanguageSwitcherComponent } from '../shared/language-switcher/language-switcher.component';
import { LgpdAceiteDialogComponent } from '../p1/lgpd-aceite-dialog.component';
import { UsuarioFotoHoverComponent } from '../shared/usuario-foto-hover/usuario-foto-hover.component';
import { ThermalPrintSetupDialogComponent } from '../core/print/thermal-print-setup-dialog.component';
import { RouteLoadingBarComponent } from '../shared/route-loading-bar/route-loading-bar.component';
import { PlatformOpsEligibilityService } from '../platform-ops/platform-ops-eligibility.service';
import { PlatformOpsAuthService } from '../platform-ops/platform-ops-auth.service';
import { LocaleCurrencyService } from '../core/locale/locale-currency.service';

@Component({
  standalone: true,
  selector: 'app-layout',
  imports: [
    CommonModule,
    FormsModule,
    RouterOutlet, 
    RouterLink, 
    ButtonModule, 
    SidebarModule, 
    MenuModule, 
    AvatarModule, 
    BadgeModule, 
    TooltipModule,
    OverlayPanelModule,
    DialogModule,
    ProgressBarModule,
    ToastModule,
    TranslatePipe,
    LanguageSwitcherComponent,
    LgpdAceiteDialogComponent,
    FooterComponent,
    BackupProgressNotificationComponent,
    NotificationBellComponent,
    ChatIconComponent,
    ChatNotificationComponent,
    ContextualOnboardingBannerComponent,
    UsuarioFotoHoverComponent,
    ThermalPrintSetupDialogComponent,
    RouteLoadingBarComponent,
    BrandStackComponent
  ],
  template: `
    <p-dialog
      styleClass="as-hero-dialog" [(visible)]="showTrocaDeficitDialog"
      [modal]="true"
      [closable]="false"
      [draggable]="false"
      [resizable]="false"
      [dismissableMask]="false"
      [styleClass]="trocaOsDialogStyleClass"
      [style]="{ width: trocaModalKind === 'SOLICITACAO' ? 'min(640px, 96vw)' : 'min(560px, 96vw)' }"
      [header]="trocaOsDialogHeader">
      <div
        class="troca-deficit-global-body"
        *ngIf="activeTrocaDeficit && trocaModalKind === 'DEFICIT' && trocaDeficitLinhas.length">
        <p class="troca-deficit-global-lead">
          <i class="pi pi-exclamation-triangle troca-deficit-global-warn"></i>
          {{ 'layout.troca.deficit.lead' | translate }}
        </p>
        <div class="troca-deficit-global-os">
          <div><span class="lbl">{{ 'layout.troca.label.os' | translate }}</span> <strong class="os-emphasis">{{ activeTrocaDeficit.osExibicao || formatTrocaDeficitOs(activeTrocaDeficit) }}</strong></div>
          <div *ngIf="activeTrocaDeficit.clienteNome"><span class="lbl">{{ 'layout.troca.label.cliente' | translate }}</span> {{ activeTrocaDeficit.clienteNome }}</div>
        </div>
        <p class="troca-deficit-global-sub">{{ 'layout.troca.deficit.productsTitle' | translate }}</p>
        <div class="troca-deficit-global-table-wrap">
          <table class="troca-deficit-global-table">
            <thead>
              <tr>
                <th>{{ 'layout.troca.th.produto' | translate }}</th>
                <th>{{ 'layout.troca.th.pn' | translate }}</th>
                <th>{{ 'layout.troca.th.solicitado' | translate }}</th>
                <th>{{ 'layout.troca.th.disponivel' | translate }}</th>
                <th>{{ 'layout.troca.th.deficit' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let lin of trocaDeficitLinhas">
                <td>{{ lin.nome }}</td>
                <td>{{ lin.pn }}</td>
                <td class="num">{{ lin.solicitado }}</td>
                <td class="num">{{ lin.disponivel }}</td>
                <td class="num deficit">{{ lin.deficit }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="troca-deficit-global-foot">
          {{ 'layout.troca.deficit.confirmFoot' | translate }}
        </p>
      </div>

      <div
        class="troca-solicitacao-te-body"
        *ngIf="activeTrocaDeficit && trocaModalKind === 'SOLICITACAO' && trocaSolicitacaoLinhas.length">
        <div class="troca-solicitacao-te-ribbon">
          <span class="troca-solicitacao-te-pulse"></span>
          <span class="troca-solicitacao-te-ribbon-text">{{ 'layout.troca.solicitacao.ribbon' | translate }}</span>
        </div>
        <div class="troca-solicitacao-te-hero">
          <div class="troca-solicitacao-te-icon-wrap">
            <i class="pi pi-bolt troca-solicitacao-te-icon"></i>
          </div>
          <h2 class="troca-solicitacao-te-title">{{ 'layout.troca.solicitacao.title' | translate }}</h2>
          <p class="troca-solicitacao-te-sub">
            {{ 'layout.troca.solicitacao.sub' | translate }}
          </p>
        </div>
        <div class="troca-solicitacao-te-os-card">
          <div class="troca-solicitacao-te-os-row">
            <span class="lbl">{{ 'layout.troca.label.os' | translate }}</span>
            <strong class="os-tag">{{ activeTrocaDeficit.osExibicao || formatTrocaDeficitOs(activeTrocaDeficit) }}</strong>
          </div>
          <div class="troca-solicitacao-te-os-row" *ngIf="activeTrocaDeficit.clienteNome">
            <span class="lbl">{{ 'layout.troca.label.cliente' | translate }}</span>
            <span>{{ activeTrocaDeficit.clienteNome }}</span>
          </div>
        </div>
        <p class="troca-solicitacao-te-list-title">{{ 'layout.troca.solicitacao.listTitle' | translate }}</p>
        <div class="troca-solicitacao-te-table-wrap">
          <table class="troca-solicitacao-te-table">
            <thead>
              <tr>
                <th>{{ 'layout.troca.th.produto' | translate }}</th>
                <th>{{ 'layout.troca.th.pn' | translate }}</th>
                <th>{{ 'layout.troca.th.qtd' | translate }}</th>
                <th>{{ 'layout.troca.th.status' | translate }}</th>
                <th>{{ 'layout.troca.th.descricao' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let lin of trocaSolicitacaoLinhas">
                <td>{{ lin.nome || '—' }}</td>
                <td><strong>{{ lin.pn || '—' }}</strong></td>
                <td class="num">{{ lin.quantidade }}</td>
                <td class="status">{{ formatStatusPagamento(lin.statusPagamento) }}</td>
                <td class="desc">{{ lin.descricao || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="troca-solicitacao-te-foot">
          {{ 'layout.troca.solicitacao.foot' | translate }}
        </p>
      </div>

      <ng-template pTemplate="footer">
        <button
          pButton
          type="button"
          [label]="(trocaModalKind === 'SOLICITACAO' ? ('layout.troca.btn.supply' | translate) : ('layout.troca.btn.ack' | translate))"
          icon="pi pi-check"
          [class]="trocaModalKind === 'SOLICITACAO' ? 'p-button-primary troca-solicitacao-te-cta' : 'p-button-primary'"
          [loading]="trocaDeficitMarcandoCiente"
          [disabled]="trocaDeficitMarcandoCiente || !activeTrocaDeficit"
          (click)="confirmarCienteDeficitTroca()"></button>
      </ng-template>
    </p-dialog>

    <div class="app-container" 
         [class.sidebar-collapsed]="sidebarCollapsed"
         [class.compact-nav]="isCompactNav()"
         [class.mobile-nav-lock]="isCompactNav() && mobileMenuOpen"
         [class.mobile]="deviceService.isMobile()"
         [class.tablet]="deviceService.isTablet()">
      
      <!-- Mobile Menu Button -->
      <button 
        *ngIf="isCompactNav()"
        pButton 
        icon="pi pi-bars" 
        class="mobile-menu-btn"
        (click)="toggleMobileMenu()"
        [pTooltip]="'layout.menu' | translate"
        tooltipPosition="bottom">
      </button>

      <!-- Mobile Overlay -->
      <div *ngIf="isCompactNav() && mobileMenuOpen" 
           class="mobile-overlay"
           (click)="closeMobileMenu()">
      </div>

      <!-- Collapsible Sidebar -->
      <aside class="sidebar sidebar--flight-deck"
             [class.collapsed]="sidebarCollapsed && !isCompactNav()"
             [class.mobile-open]="mobileMenuOpen && isCompactNav()">
        <div class="sidebar-aviation-layer" aria-hidden="true">
          <div class="sidebar-hud-grid"></div>
          <div class="sidebar-horizon-glow"></div>
          <div class="sidebar-radar-sweep"></div>
        </div>
        <div class="sidebar-content">
          <div class="sidebar-brand-mark" *ngIf="!sidebarCollapsed || isCompactNav()">
            <a
              routerLink="/"
              routerLinkActive="sidebar-brand-mark__link--active"
              [routerLinkActiveOptions]="{ exact: true }"
              class="sidebar-brand-mark__link"
              [attr.aria-label]="branding.config().commercialName"
              (click)="navigateToRoute($event, { nome: 'Home', rota: '/' })">
              <app-brand-stack surface="dark" size="sidebar-mark" [showWordmark]="false" />
              <span class="sidebar-brand-mark__text">
                <span class="sidebar-brand-mark__name">{{ branding.config().commercialName }}</span>
                <span class="sidebar-brand-mark__tag">{{ 'layout.nav.dashboardTooltip' | translate }}</span>
              </span>
            </a>
          </div>

          <div class="sidebar-brand-mark sidebar-brand-mark--rail" *ngIf="sidebarCollapsed && !isCompactNav()">
            <a
              routerLink="/"
              routerLinkActive="sidebar-brand-mark__link--active"
              [routerLinkActiveOptions]="{ exact: true }"
              class="sidebar-brand-mark__link sidebar-brand-mark__link--rail"
              [pTooltip]="branding.config().commercialName"
              tooltipPosition="right"
              [attr.aria-label]="branding.config().commercialName"
              (click)="navigateToRoute($event, { nome: 'Home', rota: '/' })">
              <app-brand-stack surface="dark" size="sidebar-mark" [showWordmark]="false" [compact]="true" />
            </a>
          </div>

          <div class="sidebar-langs" *ngIf="!sidebarCollapsed || isCompactNav()">
            <app-language-switcher variant="panel"></app-language-switcher>
          </div>

          <!-- Chat, notificações e recolher menu -->
          <div
            class="sidebar-action-bar"
            [class.sidebar-action-bar--collapsed]="sidebarCollapsed && !isCompactNav()">
            <div class="sidebar-action-bar__cluster" *ngIf="!sidebarCollapsed || isCompactNav()">
              <app-chat-icon *ngIf="mostraIconeChat"></app-chat-icon>
              <app-notification-bell></app-notification-bell>
            </div>
            <button
              *ngIf="!isCompactNav()"
              pButton
              type="button"
              [icon]="sidebarCollapsed ? 'pi pi-angle-right' : 'pi pi-angle-left'"
              class="p-button-text sidebar-toggle sidebar-action-bar__toggle"
              (click)="toggleSidebar()"
              [pTooltip]="(sidebarCollapsed ? 'layout.expandSidebar' : 'layout.collapseSidebar') | translate"
              [attr.aria-label]="(sidebarCollapsed ? 'layout.expandSidebar' : 'layout.collapseSidebar') | translate"
              tooltipPosition="right"
              appendTo="body">
            </button>
            <button
              *ngIf="isCompactNav()"
              pButton
              type="button"
              icon="pi pi-times"
              class="p-button-text sidebar-toggle sidebar-action-bar__toggle mobile-close"
              (click)="closeMobileMenu()"
              [attr.aria-label]="'layout.closeMenu' | translate">
            </button>
          </div>

          <!-- User Profile Section -->
          <div class="user-profile-section">
            <div class="user-profile-header" *ngIf="!sidebarCollapsed">
              <app-usuario-foto-hover
                [imageUrl]="getPhotoUrl()"
                [displayName]="currentUser?.nome || ''"
                size="normal"
                variant="sidebar"
                [clickable]="true"
                (avatarClick)="userMenu.toggle($event)">
              </app-usuario-foto-hover>
              <div class="user-info">
                <span class="user-name">{{ currentUser?.nome || ('layout.user' | translate) }}</span>
                <span class="user-role">{{ userRoleLabel }}</span>
              </div>
              <button 
                pButton 
                type="button" 
                icon="pi pi-sign-out" 
                class="p-button-text logout-btn"
                [pTooltip]="'layout.logout' | translate"
                [attr.aria-label]="'layout.logout' | translate"
                tooltipPosition="bottom"
                (click)="logout()">
              </button>
            </div>
            <div class="user-avatar-only" *ngIf="sidebarCollapsed">
              <app-usuario-foto-hover
                [imageUrl]="getPhotoUrl()"
                [displayName]="currentUser?.nome || ''"
                size="normal"
                variant="sidebar"
                [clickable]="true"
                [tooltip]="userTooltip"
                tooltipPosition="right"
                (avatarClick)="userMenu.toggle($event)">
              </app-usuario-foto-hover>
            </div>
            
            <!-- User Menu Dropdown -->
            <p-overlayPanel #userMenu [dismissable]="true" [showCloseIcon]="false">
              <div class="user-menu">
                <div class="user-menu-header">
                  <p-avatar 
                    [image]="getUserAvatarImage()"
                    [label]="getUserAvatarLabel()"
                    size="large"
                    shape="circle"
                    [ariaLabel]="'layout.photo.avatarAlt' | translate">
                  </p-avatar>
                  <div class="user-menu-info">
                    <h4>{{ currentUser?.nome || ('layout.user' | translate) }}</h4>
                    <p>{{ userRoleLabel }}</p>
                  </div>
                </div>
                
                <div class="user-menu-actions">
                  <button 
                    pButton 
                    type="button" 
                    [label]="'layout.profile' | translate" 
                    icon="pi pi-user"
                    class="p-button-text w-full justify-start"
                    (click)="goToProfile(); userMenu.hide()">
                  </button>

                  <div class="user-menu-lang">
                    <span class="user-menu-lang__label">{{ 'layout.interfaceLanguage' | translate }}</span>
                    <app-language-switcher variant="compact"></app-language-switcher>
                  </div>

                  <button
                    pButton
                    type="button"
                    [label]="'layout.billing' | translate"
                    icon="pi pi-credit-card"
                    class="p-button-text w-full justify-start"
                    (click)="goToBilling(); userMenu.hide()">
                  </button>

                  <button
                    pButton
                    type="button"
                    [label]="'layout.privacyData' | translate"
                    icon="pi pi-shield"
                    class="p-button-text w-full justify-start"
                    (click)="goToPrivacyData(); userMenu.hide()">
                  </button>
                  
                  <button 
                    pButton 
                    type="button" 
                    [label]="'layout.changePhoto' | translate" 
                    icon="pi pi-camera"
                    class="p-button-text w-full justify-start"
                    (click)="showPhotoDialog = true; userMenu.hide()">
                  </button>
                  
                  <button 
                    pButton 
                    type="button" 
                    [label]="'layout.logout' | translate" 
                    icon="pi pi-sign-out"
                    class="p-button-text w-full justify-start"
                    (click)="logout(); userMenu.hide()">
                  </button>
                </div>
              </div>
            </p-overlayPanel>
          </div>

          <!-- Navigation Menu — flight deck -->
          <nav class="sidebar-nav sidebar-nav--flight-deck" [attr.aria-label]="'layout.menu' | translate">
            <div class="nav-deck-toolbar" *ngIf="!sidebarCollapsed || isCompactNav()">
              <div class="nav-deck-toolbar-head">
                <span class="nav-deck-kicker"><i class="pi pi-compass"></i> {{ 'layout.navFlightDeck' | translate }}</span>
                <span class="nav-deck-hint">{{ 'layout.navFlightDeckHint' | translate }}</span>
              </div>
              <label class="nav-deck-search" for="nav-deck-search-input">
                <i class="pi pi-search" aria-hidden="true"></i>
                <input
                  id="nav-deck-search-input"
                  type="text"
                  [(ngModel)]="menuSearchQuery"
                  (ngModelChange)="onMenuSearchChange()"
                  [placeholder]="'layout.navSearch' | translate"
                  autocomplete="off"
                  spellcheck="false" />
                <button
                  *ngIf="menuSearchQuery"
                  type="button"
                  class="nav-deck-search-clear"
                  (click)="clearMenuSearch()"
                  [attr.aria-label]="'layout.navSearchClear' | translate">
                  <i class="pi pi-times"></i>
                </button>
              </label>
            </div>

            <div class="nav-deck-scroll">
            <div
              class="nav-section-card"
              *ngFor="let secao of menuSectionsFiltradas; trackBy: trackBySecaoId; let si = index"
              [ngClass]="[
                getSecaoAccentClass(secao.id),
                sidebarCollapsed && !isCompactNav() ? 'nav-section-card--collapsed' : ''
              ]"
              [style.--nav-stagger]="si">
              <button
                type="button"
                class="nav-section-flight-header"
                *ngIf="!sidebarCollapsed || isCompactNav()"
                (click)="toggleSecao(secao.id)"
                [attr.aria-expanded]="isSecaoExpanded(secao.id)">
                <span class="nav-section-icon-badge" aria-hidden="true">
                  <i [class]="secao.icone || 'pi pi-folder'"></i>
                </span>
                <span class="nav-section-flight-copy">
                  <span class="nav-section-flight-title">{{ i18n.translateMenuSecao(secao.titulo) }}</span>
                  <span class="nav-section-flight-meta">
                    {{ (secao.funcionalidades.length === 1 ? 'layout.navModuleCountOne' : 'layout.navModuleCount')
                      | translate: { count: '' + secao.funcionalidades.length } }}
                  </span>
                </span>
                <span class="nav-section-flight-chevron" [class.is-open]="isSecaoExpanded(secao.id)">
                  <i class="pi pi-chevron-down"></i>
                </span>
              </button>

              <button
                type="button"
                class="nav-section-rail-btn"
                *ngIf="sidebarCollapsed && !isCompactNav()"
                [pTooltip]="i18n.translateMenuSecao(secao.titulo)"
                [attr.aria-label]="i18n.translateMenuSecao(secao.titulo)"
                tooltipPosition="right"
                (click)="toggleSecao(secao.id)">
                <span class="nav-section-icon-badge" aria-hidden="true">
                  <i [class]="secao.icone || 'pi pi-folder'"></i>
                </span>
              </button>

              <ul
                class="nav-flight-list"
                [class.is-expanded]="isSecaoExpanded(secao.id)"
                *ngIf="isSecaoExpanded(secao.id) || (sidebarCollapsed && !isCompactNav())">
                <li
                  class="nav-flight-item"
                  *ngFor="let funcionalidade of secao.funcionalidades; trackBy: trackByFuncionalidadeId; let fi = index"
                  [style.--item-stagger]="fi">
                  <a
                    [routerLink]="getRouterLink(funcionalidade)"
                    routerLinkActive="active"
                    [routerLinkActiveOptions]="{ exact: funcionalidade.tipo === 'secao' }"
                    class="nav-flight-link"
                    [pTooltip]="sidebarCollapsed && !isCompactNav() ? i18n.translateMenuFunc(funcionalidade.codigo, funcionalidade.nome) : ''"
                    tooltipPosition="right"
                    (click)="navigateToRoute($event, funcionalidade); isCompactNav() && closeMobileMenu()">
                    <span class="nav-link-active-rail" aria-hidden="true"></span>
                    <span class="nav-link-icon-shell">
                      <i [class]="funcionalidade.icone || 'pi pi-circle'"></i>
                    </span>
                    <span class="nav-flight-link-label" *ngIf="!sidebarCollapsed || isCompactNav()">
                      {{ i18n.translateMenuFunc(funcionalidade.codigo, funcionalidade.nome) }}
                    </span>
                    <p-badge
                      *ngIf="funcionalidade.tipo === 'submenu' && (!sidebarCollapsed || isCompactNav())"
                      value="+"
                      severity="info"
                      size="small">
                    </p-badge>
                  </a>
                </li>
              </ul>
            </div>

            <section
              class="nav-platform-ops"
              *ngIf="platformOpsEligible && (!sidebarCollapsed || isCompactNav())"
              [attr.aria-label]="'platformOps.layout.menuTitle' | translate">
              <div class="nav-platform-ops-head">
                <span class="nav-platform-ops-kicker">
                  <i class="pi pi-eye" aria-hidden="true"></i>
                  {{ 'platformOps.layout.menuTitle' | translate }}
                </span>
                <span class="nav-platform-ops-hint">{{ 'platformOps.layout.menuHint' | translate }}</span>
              </div>
              <a
                class="nav-platform-ops-link"
                [routerLink]="platformOpsEntryLink"
                routerLinkActive="active"
                (click)="isCompactNav() && closeMobileMenu()">
                <i class="pi pi-lock" aria-hidden="true"></i>
                <span>{{ 'platformOps.layout.menuCta' | translate }}</span>
              </a>
            </section>

            <p class="nav-deck-empty" *ngIf="!menuLoading && menuSearchQuery && menuSectionsFiltradas.length === 0">
              {{ 'layout.navNoResults' | translate }}
            </p>

            <!-- Fallback: Menu Estático (caso o dinâmico falhe) -->
            <div class="nav-section" *ngIf="menuSections.length === 0 && !menuLoading">
              <h3 class="nav-section-title" *ngIf="!sidebarCollapsed">{{ 'layout.navPrincipal' | translate }}</h3>
              <ul class="nav-list">
                <li class="nav-item" *ngFor="let item of navItemsFiltrados">
                  <a 
                    [routerLink]="item.routerLink"
                    routerLinkActive="active"
                    [routerLinkActiveOptions]="{exact: item.exact}"
                    class="nav-link"
                    [pTooltip]="sidebarCollapsed ? ((item.tooltip || item.label) | translate) : ''"
                    tooltipPosition="right"
                    (click)="navigateToRoute($event, {nome: item.label, rota: item.routerLink})">
                    <i [class]="item.icon"></i>
                    <span *ngIf="!sidebarCollapsed">{{ item.label | translate }}</span>
                    <p-badge 
                      *ngIf="item.badge && !sidebarCollapsed" 
                      [value]="item.badge" 
                      severity="danger" 
                      size="small">
                    </p-badge>
                  </a>
                </li>
              </ul>
            </div>

            <!-- Loading State -->
            <div class="nav-section" *ngIf="menuLoading">
              <div class="nav-loading" *ngIf="!sidebarCollapsed">
                <i class="pi pi-spin pi-spinner"></i>
                <span>{{ 'layout.navLoading' | translate }}</span>
              </div>
              <div class="nav-loading-collapsed" *ngIf="sidebarCollapsed" [pTooltip]="'layout.navLoading' | translate" tooltipPosition="right">
                <i class="pi pi-spin pi-spinner"></i>
              </div>
            </div>
            </div>
          </nav>


        </div>
      </aside>

      <!-- Main Content Area -->
      <a class="as-skip-link" href="#main-content">{{ 'ui.skipToContent' | translate }}</a>
      <main class="app-main" id="main-content" [class.app-main--immersive]="mainContentImmersive">
        <!-- Fundo decorativo: apenas na home (evita “fantasma” em páginas internas) -->
        <div class="sky-background" *ngIf="mainContentImmersive" aria-hidden="true">
          <div class="sky-background-deco"></div>
        </div>
        
        <div class="main-content" [class.main-content--immersive]="mainContentImmersive">
          <app-route-loading-bar></app-route-loading-bar>
          <app-contextual-onboarding-banner></app-contextual-onboarding-banner>
          <router-outlet></router-outlet>
        </div>
        <app-footer></app-footer>
      </main>
    </div>

    <app-lgpd-aceite-dialog [visible]="showLgpdAceite" (accepted)="onLgpdAccepted()"></app-lgpd-aceite-dialog>

    <app-thermal-print-setup-dialog></app-thermal-print-setup-dialog>

    <!-- Backup Progress Notification (Global) -->
    <app-backup-progress-notification></app-backup-progress-notification>
    
    <!-- Chat Notification (Global) - Notificações de novas mensagens -->
    <!-- Chat: mesmo critério do ícone (evita polling/toasts sem permissão). -->
    <app-chat-notification *ngIf="mostraIconeChat"></app-chat-notification>
    
    <!-- Update Notification (Global) -->
    <!-- Componente de notificação de atualização DESABILITADO -->
    <!-- <app-update-notification></app-update-notification> -->

    <!-- Photo Upload Dialog -->
    <p-dialog 
      styleClass="as-hero-dialog" [header]="'layout.photo.header' | translate" 
      [(visible)]="showPhotoDialog" 
      [modal]="true" 
      [style]="{width: '460px'}"
      [closable]="true"
      (onHide)="handlePhotoDialogHide()">
      
      <div class="photo-upload-dialog">
        <div class="current-photo-preview">
          <p-avatar 
            [image]="getUserAvatarImage()"
            [label]="getUserAvatarLabel()"
            size="xlarge"
            shape="circle">
          </p-avatar>
          <span class="current-photo-label">{{ selectedPhotoPreview ? ('layout.photo.previewNew' | translate) : ('layout.photo.current' | translate) }}</span>
        </div>
        
        <div 
          class="photo-dropzone"
          [class.drag-over]="photoDragOver"
          [class.uploading]="uploadingPhoto"
          (click)="triggerPhotoInput()"
          (dragover)="onPhotoDragOver($event)"
          (dragleave)="onPhotoDragLeave($event)"
          (drop)="onPhotoDrop($event)">
          
          <ng-container *ngIf="selectedPhotoPreview; else dropzonePlaceholder">
            <img 
              [src]="selectedPhotoPreview" 
              [attr.alt]="'layout.photo.previewAlt' | translate" 
              class="dropzone-preview">
            <button 
              pButton 
              type="button" 
              icon="pi pi-times" 
              class="p-button-rounded p-button-text remove-photo-btn"
              (click)="clearSelectedPhoto($event)"
              [disabled]="uploadingPhoto"
              [pTooltip]="'layout.photo.removeSelection' | translate"
              [attr.aria-label]="'layout.photo.removeSelection' | translate"
              tooltipPosition="top">
            </button>
          </ng-container>
          
          <ng-template #dropzonePlaceholder>
            <i class="pi pi-cloud-upload"></i>
            <p class="dropzone-title">{{ 'layout.photo.dropTitle' | translate }}</p>
            <p class="dropzone-subtitle">{{ 'layout.photo.dropSubtitle' | translate }}</p>
            <span class="dropzone-hint">{{ 'layout.photo.hint' | translate }}</span>
          </ng-template>
        </div>
        
        <input 
          #photoInput
          type="file" 
          accept="image/*"
          (change)="onPhotoSelected($event)"
          hidden>

        <div class="selected-photo-info" *ngIf="selectedPhotoFile">
          <div class="file-name">
            <i class="pi pi-image"></i>
            <span>{{ selectedPhotoFile.name }}</span>
          </div>
          <span class="file-size">{{ (selectedPhotoFile.size / 1024) | number:'1.0-0' }} KB</span>
        </div>

        <div class="upload-progress" *ngIf="uploadingPhoto">
          <p-progressBar [value]="uploadProgress"></p-progressBar>
          <span>{{ uploadProgress | number:'1.0-0' }}%</span>
        </div>
      </div>
      
      <ng-template pTemplate="footer">
        <div class="photo-dialog-footer">
          <button 
            pButton 
            type="button" 
            [label]="'layout.photo.close' | translate" 
            icon="pi pi-times" 
            class="p-button-text"
            (click)="showPhotoDialog = false"
            [disabled]="uploadingPhoto">
          </button>
          <span class="footer-spacer"></span>
          <button 
            pButton 
            type="button" 
            [label]="'layout.photo.save' | translate" 
            icon="pi pi-check" 
            class="p-button-primary"
            (click)="uploadSelectedPhoto()"
            [disabled]="!selectedPhotoFile || uploadingPhoto">
          </button>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styleUrls: ['./app-layout.component.scss', './app-layout-nav-flight.scss', './app-layout-mobile.scss']
})
export class AppLayoutComponent implements OnInit, AfterViewInit, OnDestroy {
  @HostBinding('class') get deviceClass() {
    return this.deviceService.getDeviceClass();
  }

  router = inject(Router);
  private authService = inject(AuthService);
  private platformOpsEligibility = inject(PlatformOpsEligibilityService);
  private platformOpsAuth = inject(PlatformOpsAuthService);
  private usuarioFotoService = inject(UsuarioFotoService);
  private cdr = inject(ChangeDetectorRef);
  private menuService = inject(MenuService);
  private http = inject(HttpClient);
  private messageService = inject(MessageService);
  protected i18n = inject(TranslationService);
  protected deviceService = inject(DeviceDetectionService);
  protected branding = inject(BrandingService);
  private localeCurrency = inject(LocaleCurrencyService);

  private chatService = inject(ChatService);
  private deficitTrocaNotifService = inject(OsDeficitTrocaNotificacaoService);
  private sessionIdle = inject(SessionIdleService);
  private destroy$ = new Subject<void>();
  @ViewChild('photoInput') photoInput?: ElementRef<HTMLInputElement>;
  
  // Flag para garantir que os serviços estejam inicializados
  private servicesInitialized = false;
  
  sidebarCollapsed = false;
  mobileMenuOpen = false;
  /** Home (`/`): fundo aeronáutico; demais rotas: área de trabalho opaca. */
  mainContentImmersive = true;
  currentUser: User | null = null;
  avatarImageUrl = DEFAULT_USUARIO_AVATAR;

  get userRoleLabel(): string {
    const u = this.currentUser;
    const role = this.i18n.translatePerfil(u?.perfil?.codigo, u?.perfil?.nome, u?.role);
    return role || this.i18n.translate('layout.user');
  }

  get userTooltip(): string {
    const name = this.currentUser?.nome || this.i18n.translate('layout.user');
    return `${name} - ${this.userRoleLabel}`;
  }

  showLgpdAceite = false;

  showPhotoDialog = false;
  photoDragOver = false;
  selectedPhotoFile: File | null = null;
  selectedPhotoPreview: string | null = null;
  private selectedPhotoPreviewUrl: string | null = null;
  uploadingPhoto = false;
  uploadProgress = 0;

  /** Modal global: déficit de estoque ou nova Solicitação de Troca Eventual (Suprimento, Comercial, Admin, Diretor). */
  showTrocaDeficitDialog = false;
  trocaDeficitMarcandoCiente = false;
  trocaDeficitQueue: OsTrocaDeficitNotificacao[] = [];
  activeTrocaDeficit: OsTrocaDeficitNotificacao | null = null;
  /** DEFICIT */
  trocaModalKind: 'DEFICIT' | 'SOLICITACAO' = 'DEFICIT';
  trocaDeficitLinhas: Array<{
    nome: string;
    pn: string;
    solicitado: number;
    disponivel: number;
    deficit: number;
  }> = [];
  /** SOLICITACAO_TROCA */
  trocaSolicitacaoLinhas: Array<{ nome: string; pn: string; quantidade: number; descricao?: string; statusPagamento?: string }> = [];
  private deficitPollIniciado = false;

  get trocaOsDialogStyleClass(): string {
    return this.trocaModalKind === 'SOLICITACAO' ? 'troca-solicitacao-te-global-dialog' : 'troca-deficit-global-dialog';
  }

  get trocaOsDialogHeader(): string {
    return this.trocaModalKind === 'SOLICITACAO'
      ? this.i18n.translate('layout.troca.header.solicitacao')
      : this.i18n.translate('layout.troca.header.deficit');
  }

  get mostraIconeChat(): boolean {
    const u = this.currentUser ?? this.authService.getCurrentUser();
    return passesPermissaoRota(u, { funcionalidadesAny: ['chat'] });
  }

  /** Fallback estático: esconde entradas sem código alinhado às rotas. */
  get navItemsFiltrados(): MenuItem[] {
    const u = this.currentUser ?? this.authService.getCurrentUser();
    return this.navItems.filter((item) => {
      const link = item.routerLink as string | undefined;
      if (link == null || link === '/' || link === '') {
        return false;
      }
      if (link === '/configuracoes') {
        return passesPermissaoRota(u, { funcionalidadesAny: ['CONFIGURACOES'] });
      }
      return true;
    });
  }

  get platformOpsEntryLink(): string {
    return this.platformOpsAuth.isAuthenticated() ? '/plataforma' : '/plataforma/acesso';
  }

  private refreshPlatformOpsEligibility(): void {
    if (!this.authService.getCurrentUser()) {
      this.platformOpsEligible = false;
      this.platformOpsEligibility.invalidate();
      return;
    }
    this.platformOpsEligibility
      .checkEligibility()
      .pipe(takeUntil(this.destroy$))
      .subscribe(eligible => {
        this.platformOpsEligible = eligible;
        this.cdr.markForCheck();
      });
  }

  // Menu dinâmico
  menuSections: MenuSection[] = [];
  menuSectionsFiltradas: MenuSection[] = [];
  menuSearchQuery = '';
  menuLoading = false;
  platformOpsEligible = false;
  secoesExpanded = new Map<string, boolean>();
  
         navItems: MenuItem[] = [
           {
             label: 'layout.nav.settings',
             icon: 'pi pi-cog',
             routerLink: '/configuracoes',
             exact: false,
             tooltip: 'layout.nav.settingsTooltip'
           }
         ];

         editorMontagemItems: MenuItem[] = [
           {
             label: 'menu.func.EDITOR_DOCUMENTOS',
             icon: 'pi pi-cog',
            routerLink: '/fcu-assembly',
            tooltip: 'menu.func.EDITOR_DOCUMENTOS'
           }
         ];

         cadastroItems: MenuItem[] = [
           {
             label: 'menu.func.PRODUTOS',
             icon: 'pi pi-box',
             routerLink: '/products',
             tooltip: 'menu.func.PRODUTOS'
           },
           {
             label: 'menu.func.FABRICANTES',
             icon: 'pi pi-building',
             routerLink: '/fabricantes',
             tooltip: 'menu.func.FABRICANTES'
           },
           {
             label: 'menu.func.TIPOS_SERVICO',
             icon: 'pi pi-cog',
             routerLink: '/tipos-servico',
             tooltip: 'menu.func.TIPOS_SERVICO'
           },
          {
            label: 'menu.func.FCU',
            icon: 'pi pi-microchip',
            routerLink: '/fcu',
            tooltip: 'menu.func.FCU'
          },
           {
             label: 'menu.func.ORDEM_SERVICO',
             icon: 'pi pi-file-edit',
             routerLink: '/os',
             tooltip: 'menu.func.ORDEM_SERVICO'
           },
           {
             label: 'menu.func.HANGAR_JOB_CARD',
             icon: 'pi pi-mobile',
             routerLink: '/hangar',
             tooltip: 'menu.func.HANGAR_JOB_CARD'
           },
           {
             label: 'menu.func.AD_SB_ALERTAS',
             icon: 'pi pi-exclamation-triangle',
             routerLink: '/aero/diretrizes',
             tooltip: 'menu.func.AD_SB_ALERTAS'
           },
           {
             label: 'menu.func.USUARIOS',
             icon: 'pi pi-users',
             routerLink: '/usuarios',
             tooltip: 'menu.func.USUARIOS',
             badge: '2'
           },
           {
             label: 'menu.func.ASSOCIACAO_FCU',
             icon: 'pi pi-link',
            routerLink: '/associacao-fcu',
            tooltip: 'menu.func.ASSOCIACAO_FCU'
           }
         ];

         sistemaItems: MenuItem[] = [
           {
             label: 'menu.func.CONFIGURACOES',
             icon: 'pi pi-cog',
             routerLink: '/configuracoes',
             tooltip: 'menu.func.CONFIGURACOES'
           }
         ];

         controleAcessoItems: MenuItem[] = [
           {
             label: 'menu.func.GERENCIAR_PERMISSOES',
             icon: 'pi pi-shield',
             routerLink: '/controle-acesso',
             tooltip: 'menu.func.GERENCIAR_PERMISSOES'
           },
           {
             label: 'menu.func.FUNCIONALIDADES',
             icon: 'pi pi-list',
             routerLink: '/funcionalidades',
             tooltip: 'menu.func.FUNCIONALIDADES'
           },
           {
             label: 'menu.func.PERFIS',
             icon: 'pi pi-id-card',
             routerLink: '/perfis',
             tooltip: 'menu.func.PERFIS'
           }
         ];

  ngOnInit() {
    // Load sidebar state from localStorage
    // Load sidebar state (apenas para desktop)
    if (!this.deviceService.isMobileOrTablet()) {
      const savedState = localStorage.getItem('sidebarCollapsed');
      if (savedState !== null) {
        this.sidebarCollapsed = JSON.parse(savedState);
      }
    } else {
      // Em mobile, sempre fechado por padrão
      this.sidebarCollapsed = false;
      this.mobileMenuOpen = false;
    }
    
    this.i18n
      .getCurrentLanguage$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.menuSections.length > 0) {
          this.menuSections = this.menuService.ordenarSecoesMenu(this.menuSections);
          this.recomputeMenuFiltrado();
          this.cdr.markForCheck();
        }
      });
    
    // Inicializar serviços no ngOnInit para garantir que estejam disponíveis
    this.initializeServices();
    this.localeCurrency.refreshRates().pipe(takeUntil(this.destroy$)).subscribe();

    this.syncMainContentImmersive();
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.syncMainContentImmersive();
        this.expandCurrentRouteSection();
        this.closeMobileMenu();
      });
  }

  /** Mantém wallpaper/céu só na rota inicial; páginas internas usam fundo sólido. */
  private syncMainContentImmersive(): void {
    const path = (this.router.url.split('?')[0].split('#')[0] || '/').replace(/\/+$/, '') || '/';
    this.mainContentImmersive = path === '/';
  }

  ngAfterViewInit() {
    // Menu é carregado em initializeServices (currentUser$); evita pedido duplicado aqui.
  }
  
  onLgpdAccepted(): void {
    this.showLgpdAceite = false;
    const u = this.authService.getCurrentUser();
    if (u) {
      u.lgpdAceitePendente = false;
      localStorage.setItem('aerosuite_user', JSON.stringify(u));
    }
  }

  private initializeServices() {
    if (this.servicesInitialized) {
      return;
    }

    try {
      this.currentUser = this.authService.getCurrentUser();
      this.showLgpdAceite = this.currentUser?.lgpdAceitePendente === true;
      this.injectPendenciasTrocasMenuIfAllowed();
      this.syncAvatarFromUser();

      if (this.currentUser) {
        this.tryLoadMenu(this.shouldForceMenuRefresh());
        this.refreshPlatformOpsEligibility();
      }

      this.authService
        .hydrateSessionFromServer()
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.currentUser = this.authService.getCurrentUser();
          this.showLgpdAceite = this.currentUser?.lgpdAceitePendente === true;
          this.injectPendenciasTrocasMenuIfAllowed();
          this.syncAvatarFromUser();
          this.refreshPlatformOpsEligibility();
          this.cdr.markForCheck();
        });

      this.authService.currentUser$
        .pipe(
          distinctUntilChanged((a, b) => this.sameUserSession(a, b)),
          takeUntil(this.destroy$)
        )
        .subscribe((user) => {
          this.currentUser = user;
          this.showLgpdAceite = user?.lgpdAceitePendente === true;
          this.injectPendenciasTrocasMenuIfAllowed();
          if (!user) {
            this.menuSections = [];
            this.platformOpsEligible = false;
            this.platformOpsEligibility.invalidate();
            this.recomputeMenuFiltrado();
            return;
          }
          this.tryLoadMenu(this.shouldForceMenuRefresh());
          this.refreshPlatformOpsEligibility();
          this.syncAvatarFromUser();
          this.cdr.markForCheck();
        });

      this.servicesInitialized = true;
    } catch (error) {
      console.error('Failed to initialize services:', error);
      this.servicesInitialized = true;
    }
    this.sessionIdle.startMonitoring();
    this.iniciarPollingNotificacoesDeficitTroca();
  }

  /** Pendentes de “ciente” para perfis autorizados; modal em qualquer rota após login. */
  private iniciarPollingNotificacoesDeficitTroca(): void {
    if (this.deficitPollIniciado) {
      return;
    }
    this.deficitPollIniciado = true;
    merge(
      this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)),
      interval(90000).pipe(startWith(0))
    )
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => {
          if (!this.authService.isAuthenticated() || !this.authService.podeReceberNotificacaoDeficitTrocasOs()) {
            return of([] as OsTrocaDeficitNotificacao[]);
          }
          return this.deficitTrocaNotifService.listarPendentes().pipe(catchError(() => of([])));
        })
      )
      .subscribe((list) => this.onPendentesDeficitTroca(list));
  }

  private onPendentesDeficitTroca(list: OsTrocaDeficitNotificacao[]): void {
    const ids = new Set((list || []).map((x) => Number(x.id)));
    this.trocaDeficitQueue = this.trocaDeficitQueue.filter((q) => ids.has(Number(q.id)));
    for (const n of list || []) {
      if (!this.trocaDeficitQueue.some((q) => Number(q.id) === Number(n.id))) {
        this.trocaDeficitQueue.push(n);
      }
    }
    this.trocaDeficitQueue.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
    this.tentarAbrirModalDeficitTroca();
  }

  private tentarAbrirModalDeficitTroca(): void {
    if (this.showTrocaDeficitDialog || this.trocaDeficitMarcandoCiente) {
      return;
    }
    const next = this.trocaDeficitQueue[0];
    if (!next) {
      return;
    }
    this.activeTrocaDeficit = next;
    const ok = this.prepararConteudoModalTrocaOs(next);
    if (!ok) {
      this.activeTrocaDeficit = null;
      this.trocaDeficitQueue = this.trocaDeficitQueue.filter((q) => Number(q.id) !== Number(next.id));
      this.tentarAbrirModalDeficitTroca();
      return;
    }
    this.showTrocaDeficitDialog = true;
  }

  /** Monta linhas do modal conforme kind (déficit de estoque vs nova solicitação com produtos). */
  formatStatusPagamento(code: string | undefined | null): string {
    const c = (code || 'PENDENTE').trim().toUpperCase();
    const key =
      c === 'PAGO' ? 'layout.troca.status.paid'
      : c === 'RECUSADO' ? 'layout.troca.status.refused'
      : 'layout.troca.status.pending';
    return this.i18n.translate(key);
  }

  private prepararConteudoModalTrocaOs(n: OsTrocaDeficitNotificacao): boolean {
    const k = (n.kind || 'DEFICIT').trim().toUpperCase();
    this.trocaModalKind = k === 'SOLICITACAO_TROCA' ? 'SOLICITACAO' : 'DEFICIT';
    try {
      const arr = JSON.parse(n.detalheJson || '[]') as unknown[];
      if (!Array.isArray(arr) || arr.length === 0) {
        this.trocaDeficitLinhas = [];
        this.trocaSolicitacaoLinhas = [];
        return false;
      }
      if (this.trocaModalKind === 'SOLICITACAO') {
        this.trocaSolicitacaoLinhas = arr.map((row) => {
          const x = row as Record<string, unknown>;
          return {
            nome: String(x['nome'] ?? ''),
            pn: String(x['pn'] ?? ''),
            quantidade: Number(x['quantidade'] ?? 1),
            descricao: x['descricao'] != null ? String(x['descricao']) : undefined,
            statusPagamento: x['statusPagamento'] != null ? String(x['statusPagamento']) : 'PENDENTE'
          };
        });
        this.trocaDeficitLinhas = [];
        return this.trocaSolicitacaoLinhas.length > 0;
      }
      this.trocaDeficitLinhas = arr as Array<{
        nome: string;
        pn: string;
        solicitado: number;
        disponivel: number;
        deficit: number;
      }>;
      this.trocaSolicitacaoLinhas = [];
      return this.trocaDeficitLinhas.length > 0;
    } catch {
      this.trocaDeficitLinhas = [];
      this.trocaSolicitacaoLinhas = [];
      return false;
    }
  }

  formatTrocaDeficitOs(n: OsTrocaDeficitNotificacao | null): string {
    if (!n) {
      return '';
    }
    if (n.idOs != null && n.idOs !== 0) {
      return String(n.idOs);
    }
    return n.osId != null ? `#${n.osId}` : '';
  }

  confirmarCienteDeficitTroca(): void {
    if (!this.activeTrocaDeficit || this.trocaDeficitMarcandoCiente) {
      return;
    }
    this.trocaDeficitMarcandoCiente = true;
    const idNotif = Number(this.activeTrocaDeficit.id);
    this.deficitTrocaNotifService.marcarCiente(idNotif).subscribe({
      next: () => {
        this.trocaDeficitMarcandoCiente = false;
        this.showTrocaDeficitDialog = false;
        this.activeTrocaDeficit = null;
        this.trocaDeficitLinhas = [];
        this.trocaSolicitacaoLinhas = [];
        this.trocaDeficitQueue = this.trocaDeficitQueue.filter((q) => Number(q.id) !== idNotif);
        this.deficitTrocaNotifService.listarPendentes().subscribe({
          next: (list) => {
            const filtrado = (list || []).filter((n) => Number(n.id) !== idNotif);
            this.onPendentesDeficitTroca(filtrado);
          },
          error: () => this.tentarAbrirModalDeficitTroca()
        });
      },
      error: () => {
        this.trocaDeficitMarcandoCiente = false;
        this.i18n.addToast(this.messageService, 'error', 'layout.toast.error', 'layout.toast.ackFail');
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('mobile-nav-open');
      document.body.classList.remove('mobile-nav-open');
    }
    this.revokeSelectedPhotoPreview();
  }

  private sameUserSession(a: User | null, b: User | null): boolean {
    if (a?.id !== b?.id) {
      return false;
    }
    if ((a?.fotoPerfil ?? '') !== (b?.fotoPerfil ?? '')) {
      return false;
    }
    const ac = [...(a?.funcionalidadeCodigos ?? [])].sort().join('|');
    const bc = [...(b?.funcionalidadeCodigos ?? [])].sort().join('|');
    return ac === bc;
  }

  onMenuSearchChange(): void {
    this.recomputeMenuFiltrado();
    this.cdr.markForCheck();
  }

  private recomputeMenuFiltrado(): void {
    const q = this.menuSearchQuery.trim().toLowerCase();
    if (!q) {
      this.menuSectionsFiltradas = this.menuSections;
      return;
    }
    this.menuSectionsFiltradas = this.menuSections
      .map(secao => ({
        ...secao,
        funcionalidades: secao.funcionalidades.filter(f => this.funcionalidadeMatchesSearch(f, secao))
      }))
      .filter(secao => secao.funcionalidades.length > 0);
  }

  /** Drawer navigation on phones and tablets (< 1024px). */
  protected isCompactNav(): boolean {
    return this.deviceService.isMobileOrTablet();
  }

  toggleSidebar() {
    if (this.deviceService.isMobileOrTablet()) {
      this.mobileMenuOpen = !this.mobileMenuOpen;
      this.syncBodyScrollLock();
    } else {
      this.sidebarCollapsed = !this.sidebarCollapsed;
      // Save state to localStorage
      localStorage.setItem('sidebarCollapsed', JSON.stringify(this.sidebarCollapsed));
    }
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    this.syncBodyScrollLock();
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
    this.syncBodyScrollLock();
  }

  /** Impede scroll da página atrás do drawer no mobile. */
  private syncBodyScrollLock(): void {
    if (typeof document === 'undefined') {
      return;
    }
    const lock = this.isCompactNav() && this.mobileMenuOpen;
    document.documentElement.classList.toggle('mobile-nav-open', lock);
    document.body.classList.toggle('mobile-nav-open', lock);
  }

  logout() {
    this.authService.logout();
  }

  private injectPendenciasTrocasMenuIfAllowed() {
    const link = '/os/pendentes-pagamento-trocas';
    const existingIdx = this.cadastroItems.findIndex((i) => i.routerLink === link);
    if (!this.authService.podeMarcarPagoTrocasOs()) {
      if (existingIdx >= 0) {
        this.cadastroItems.splice(existingIdx, 1);
      }
      return;
    }
    if (existingIdx >= 0) {
      return;
    }
    const idx = this.cadastroItems.findIndex((i) => i.routerLink === '/os');
    if (idx < 0) {
      return;
    }
    this.cadastroItems.splice(idx + 1, 0, {
      label: 'layout.nav.osPendenciasTrocas',
      icon: 'pi pi-exclamation-circle',
      routerLink: link,
      tooltip: 'layout.nav.osPendenciasTrocasTooltip'
    });
  }

  /** Só força novo pedido ao backend se a sessão ainda não trouxe códigos de funcionalidade. */
  private shouldForceMenuRefresh(): boolean {
    const codes = this.authService.getCurrentUser()?.funcionalidadeCodigos;
    return !codes?.length;
  }

  private tryLoadMenu(forceRefresh = false): void {
    if (!this.menuService || !this.currentUser) {
      return;
    }
    if (this.menuSections.length > 0 && !forceRefresh) {
      return;
    }
    if (!forceRefresh) {
      const loginMenu = this.currentUser.menuFuncionalidades;
      if (loginMenu?.length) {
        this.menuService.applyLoginMenu(loginMenu);
      }
      const primed = this.menuService.primeMenuFromSessionStorage();
      if (primed?.length) {
        this.applyMenuSections(primed);
        return;
      }
    }
    this.carregarMenuDinamico(forceRefresh);
  }

  private applyMenuSections(secoes: MenuSection[]): void {
    this.menuSections = secoes;
    secoes.forEach((secao) => {
      if (!this.secoesExpanded.has(secao.id)) {
        this.secoesExpanded.set(secao.id, false);
      }
    });
    this.expandCurrentRouteSection();
    this.menuLoading = false;
    this.recomputeMenuFiltrado();
    this.cdr.markForCheck();
  }

  /**
   * Carrega o menu dinâmico baseado nas funcionalidades do usuário
   */
  private carregarMenuDinamico(forceRefresh = false) {
    if (!this.menuService) {
      this.menuLoading = false;
      this.menuSections = [];
      this.recomputeMenuFiltrado();
      return;
    }

    const showSpinner = this.menuSections.length === 0;
    if (showSpinner) {
      this.menuLoading = true;
    }

    this.menuService
      .carregarMenuDinamico(forceRefresh)
      .pipe(
        timeout(15_000),
        catchError(() => of([] as MenuSection[])),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (secoes) => this.applyMenuSections(secoes),
        error: () => {
          this.menuLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  /**
   * Verifica se uma seção está expandida
   */
  clearMenuSearch(): void {
    this.menuSearchQuery = '';
    this.recomputeMenuFiltrado();
    this.cdr.markForCheck();
  }

  getSecaoAccentClass(secaoId: string): string {
    const slug = (secaoId || 'default').toLowerCase().replace(/[^a-z0-9_-]/g, '');
    return `nav-section-card--${slug || 'default'}`;
  }

  private funcionalidadeMatchesSearch(f: Funcionalidade, secao: MenuSection): boolean {
    const q = this.menuSearchQuery.trim().toLowerCase();
    if (!q) {
      return true;
    }
    const label = this.i18n.translateMenuFunc(f.codigo, f.nome).toLowerCase();
    const secaoLabel = this.i18n.translateMenuSecao(secao.titulo).toLowerCase();
    const codigo = (f.codigo || '').toLowerCase();
    return label.includes(q) || secaoLabel.includes(q) || codigo.includes(q);
  }

  isSecaoExpanded(secaoId: string): boolean {
    if (this.menuSearchQuery.trim()) {
      return true;
    }
    return this.secoesExpanded.get(secaoId) ?? false;
  }

  /**
   * Alterna o estado de expansão de uma seção
   */
  toggleSecao(secaoId: string): void {
    const currentState = this.secoesExpanded.get(secaoId) ?? false;
    this.secoesExpanded.set(secaoId, !currentState);
  }

  /** Mantém o módulo ativo visível sem reabrir toda a navegação. */
  private expandCurrentRouteSection(): void {
    const currentPath = this.normalizeMenuRoute(this.router.url);
    const activeSection = this.menuSections.find((secao) =>
      secao.funcionalidades.some((funcionalidade) => {
        const routerLink = this.getRouterLink(funcionalidade);
        if (!routerLink) {
          return false;
        }
        const route = this.normalizeMenuRoute(routerLink);
        return route === '/'
          ? currentPath === route
          : currentPath === route || currentPath.startsWith(`${route}/`);
      })
    );

    if (activeSection) {
      this.secoesExpanded.set(activeSection.id, true);
      this.cdr.markForCheck();
    }
  }

  private normalizeMenuRoute(route: string): string {
    const path = (route || '/').split('?')[0].split('#')[0].trim();
    const withLeadingSlash = path.startsWith('/') ? path : `/${path}`;
    return withLeadingSlash.replace(/\/+$/, '') || '/';
  }

  /**
   * TrackBy function para seções do menu
   */
  trackBySecaoId(index: number, secao: MenuSection): string {
    return secao.id;
  }

  /**
   * TrackBy function para funcionalidades do menu
   */
  trackByFuncionalidadeId(index: number, funcionalidade: Funcionalidade): number {
    return funcionalidade.id;
  }

  /**
   * Obtém a rota correta para uma funcionalidade
   */
  getRouterLink(funcionalidade: Funcionalidade): string {
    
    // Se a funcionalidade for "Configurações", garantir que use a rota correta
    const nomeLower = funcionalidade.nome?.toLowerCase() || '';
    const codigoLower = funcionalidade.codigo?.toLowerCase() || '';
    const rotaLower = funcionalidade.rota?.toLowerCase() || '';
    
    // Settings route: match by code/path only (names vary by locale).
    if (
        codigoLower === 'configuracoes' ||
        rotaLower === '/configuracoes' || rotaLower.includes('configuracoes')) {
      return '/configuracoes';
    }
    
    // Caso contrário, usar a rota definida ou construir a partir do código
    if (funcionalidade.rota && funcionalidade.rota.trim() !== '') {
      // Garantir que a rota comece com /
      const rota = funcionalidade.rota.trim();
      const finalRoute = rota.startsWith('/') ? rota : '/' + rota;
      return finalRoute;
    }
    
    // Garantir que o código comece com /
    const codigo = (funcionalidade.codigo || '').trim();
    if (codigo === '') {
      console.warn('⚠️ Permission missing route or code:', funcionalidade);
      // Não retornar '/' como fallback - isso causa redirecionamento para home
      // Em vez disso, retornar uma rota vazia para evitar navegação incorreta
      return '';
    }
    
    const finalRoute = codigo.startsWith('/') ? codigo : '/' + codigo;
    return finalRoute;
  }

  /**
   * Navega para uma rota específica
   * Força navegação programática para garantir que funcione
   */
  navigateToRoute(event: Event, funcionalidade: Funcionalidade | any) {
    // Prevenir comportamento padrão do link
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Verificação ANTES de obter a rota - se for configurações, forçar rota correta
    const nomeLower = (funcionalidade.nome || '').toLowerCase();
    const codigoLower = (funcionalidade.codigo || '').toLowerCase();
    const isConfiguracoes =
      codigoLower === 'configuracoes' ||
      (funcionalidade.rota || '').toLowerCase().includes('configuracoes');
    
    let route: string;
    
    // Se for configurações, forçar rota correta
    if (isConfiguracoes) {
      route = '/configuracoes';
    } else {
      // Se for um objeto simples (menu estático), usar a rota diretamente
      if (funcionalidade.rota) {
        route = funcionalidade.rota;
      } else {
        route = this.getRouterLink(funcionalidade);
      }
    }
    
    // Se não houver rota válida, não fazer nada
    if (!route || route === '#' || route === '') {
      console.error('❌ Invalid route for permission:', funcionalidade);
      console.error('❌ Detalhes da funcionalidade:', JSON.stringify(funcionalidade, null, 2));
      return;
    }
    
    // Normalizar a rota (remover barras duplas, garantir que comece com /)
    route = route.replace(/\/+/g, '/');
    if (!route.startsWith('/')) {
      route = '/' + route;
    }
    
    
    // Verificar se já estamos na rota atual
    const currentUrl = this.router.url.split('?')[0]; // Remover query params
    const normalizedCurrentUrl = currentUrl.replace(/\/$/, ''); // Remover barra final
    const normalizedRoute = route.replace(/\/$/, ''); // Remover barra final
    
    if (normalizedCurrentUrl === normalizedRoute) {
      return;
    }
    
    // Navegar usando o router
    try {
      this.router.navigate([route], { 
        skipLocationChange: false 
      }).then(
        (success) => {
          if (success !== false) {
          } else {
            console.error('❌ Navigation returned false for:', route);
            // Tentar novamente após um delay
            setTimeout(() => {
              this.router.navigate([route]).catch(err => {
                console.error('❌ Failed to navigate to', route, ':', err);
                // Último recurso: usar window.location
                window.location.href = route;
              });
            }, 200);
          }
        }
      ).catch(err => {
        console.error('❌ Failed to navigate to', route, ':', err);
        console.error('Detalhes do erro:', JSON.stringify(err, null, 2));
        // Tentar usar window.location como último recurso
        try {
          window.location.href = route;
        } catch (e) {
          console.error('❌ Navigation failed completely:', e);
        }
      });
    } catch (error) {
      console.error('❌ Failed to attempt navigation:', error);
      // Último recurso: usar window.location
      try {
        window.location.href = route;
      } catch (e) {
        console.error('❌ Navigation failed completely:', e);
      }
    }
  }

  goToProfile() {
    this.router.navigate(['/perfil']);
  }

  goToBilling() {
    this.router.navigate(['/billing']);
  }

  goToPrivacyData() {
    this.router.navigate(['/privacidade-dados']);
  }

  handlePhotoDialogHide() {
    this.showPhotoDialog = false;
    this.clearSelectedPhoto();
  }

  getPhotoUrl(): string {
    if (this.selectedPhotoPreview) {
      return this.selectedPhotoPreview;
    }
    return this.avatarImageUrl;
  }

  hasUserProfilePhoto(): boolean {
    const url = this.getPhotoUrl();
    return !!url && url !== DEFAULT_USUARIO_AVATAR;
  }

  getUserAvatarImage(): string | undefined {
    return this.hasUserProfilePhoto() ? this.getPhotoUrl() : undefined;
  }

  getUserAvatarLabel(): string {
    return this.hasUserProfilePhoto() ? '' : usuarioAvatarInitials(this.currentUser?.nome);
  }

  private syncAvatarFromUser(bustCache = false): void {
    if (this.selectedPhotoPreview) {
      return;
    }
    const fotoPerfil = this.currentUser?.fotoPerfil ?? this.authService.getCurrentUser()?.fotoPerfil;
    this.usuarioFotoService.loadAvatarUrl(fotoPerfil, { bustCache }).subscribe((url) => {
      this.avatarImageUrl = url;
      this.cdr.markForCheck();
    });
  }

  private refreshAvatarImage(bustCache = false): void {
    this.syncAvatarFromUser(bustCache);
  }

  private applyUploadedFotoUrl(
    fotoPerfil: string | null | undefined,
    uploadResponse?: { fotoPerfil?: string; fotoUrl?: string } | null,
    localPreview?: string | null,
    onComplete?: () => void
  ): void {
    if (!this.currentUser) {
      onComplete?.();
      return;
    }
    const preview = localPreview ?? this.selectedPhotoPreview;
    this.usuarioFotoService
      .completeProfilePhotoUpload(
        this.currentUser,
        uploadResponse ?? { fotoPerfil: fotoPerfil ?? undefined, fotoUrl: fotoPerfil ?? undefined },
        preview
      )
      .subscribe({
        next: (url) => {
          this.avatarImageUrl = url;
          this.cdr.markForCheck();
        },
        complete: () => onComplete?.(),
        error: () => onComplete?.(),
      });
  }

  triggerPhotoInput() {
    if (this.uploadingPhoto) return;
    this.photoInput?.nativeElement?.click();
  }

  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input?.files;
    if (files && files.length > 0) {
      this.prepareSelectedPhoto(files[0]);
    }
    if (input) {
      input.value = '';
    }
  }

  onPhotoDragOver(event: DragEvent) {
    event.preventDefault();
    if (!this.uploadingPhoto) {
      this.photoDragOver = true;
    }
  }

  onPhotoDragLeave(event: DragEvent) {
    event.preventDefault();
    this.photoDragOver = false;
  }

  onPhotoDrop(event: DragEvent) {
    event.preventDefault();
    this.photoDragOver = false;
    if (this.uploadingPhoto) return;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.prepareSelectedPhoto(files[0]);
    }
  }

  private prepareSelectedPhoto(file: File) {
    const validationErrorKey = this.validatePhotoFile(file);
    if (validationErrorKey) {
      if (validationErrorKey === 'layout.photo.error.tooLarge') {
        this.i18n.addToast(this.messageService, 'warn', 'layout.toast.invalidFile', validationErrorKey, {
          sizeMb: (file.size / (1024 * 1024)).toFixed(1)
        });
      } else {
        this.i18n.addToast(this.messageService, 'warn', 'layout.toast.invalidFile', validationErrorKey);
      }
      return;
    }

    this.clearSelectedPhoto();
    this.selectedPhotoFile = file;
    this.selectedPhotoPreviewUrl = URL.createObjectURL(file);
    this.selectedPhotoPreview = this.selectedPhotoPreviewUrl;
  }

  private validatePhotoFile(file: File): string | null {
    if (!file.type.startsWith('image/')) {
      return 'layout.photo.error.notImage';
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return 'layout.photo.error.tooLarge';
    }
    return null;
  }

  clearSelectedPhoto(event?: Event) {
    event?.stopPropagation();
    if (this.uploadingPhoto) return;
    this.revokeSelectedPhotoPreview();
    this.selectedPhotoFile = null;
    this.selectedPhotoPreview = null;
    this.photoDragOver = false;
    this.uploadProgress = 0;
    if (this.photoInput?.nativeElement) {
      this.photoInput.nativeElement.value = '';
    }
  }

  private revokeSelectedPhotoPreview() {
    if (this.selectedPhotoPreviewUrl) {
      URL.revokeObjectURL(this.selectedPhotoPreviewUrl);
      this.selectedPhotoPreviewUrl = null;
    }
  }

  uploadSelectedPhoto() {
    if (!this.selectedPhotoFile) {
      this.i18n.addToast(this.messageService, 'warn', 'layout.toast.warn', 'layout.toast.selectPhotoFirst');
      return;
    }

    if (!this.currentUser?.id) {
      this.i18n.addToast(this.messageService, 'error', 'layout.toast.error', 'layout.toast.userUnknown');
      return;
    }

    this.uploadingPhoto = true;
    this.uploadProgress = 0;

    this.usuarioFotoService.uploadProfilePhotoWithProgress(this.selectedPhotoFile).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress = Math.round(100 * (event.loaded / event.total));
        } else if (event.type === HttpEventType.Response) {
          const httpResponse = event as HttpResponse<FotoUploadResponse>;
          const response = httpResponse.body;
          this.i18n.addToast(this.messageService, 'success', 'layout.toast.success', 'layout.toast.photoOk');

          const preview = this.selectedPhotoPreview;
          const finish = () => {
            this.uploadingPhoto = false;
            this.showPhotoDialog = false;
            this.clearSelectedPhoto();
          };

          if (this.currentUser) {
            const filename = parseFotoUploadFilename(response ?? undefined);
            if (filename || response) {
              this.applyUploadedFotoUrl(filename, response, preview, finish);
            } else {
              this.reloadUserData();
              finish();
            }
          } else {
            finish();
          }
        }
      },
      error: (error) => {
        console.error('Failed to upload:', error);
        this.uploadingPhoto = false;
        this.uploadProgress = 0;
        
        let errorMessage = this.i18n.translate('layout.toast.uploadGeneric');

        if (error.error && typeof error.error === 'string' && error.error.trim().startsWith('<!DOCTYPE')) {
          errorMessage = this.i18n.translate('layout.toast.serverHtml');
        } else {
          errorMessage = extractApiErrorMessage(error, this.i18n, 'layout.toast.uploadGeneric');
        }
        
        // Verificar status HTTP específicos
        if (error.status === 404) {
          errorMessage = this.i18n.translate('layout.toast.endpoint404');
        } else if (error.status === 0) {
          errorMessage = this.i18n.translate('layout.toast.noConnection');
        } else if (error.status === 413) {
          errorMessage = this.i18n.translate('layout.toast.fileTooLarge');
        }
        
        this.i18n.addToastLiteralDetail(this.messageService, 'error', 'layout.toast.error', errorMessage);
      }
    });
  }

  private reloadUserData() {
    this.authService.refreshCurrentUserFromServer().subscribe({
      next: (userData) => {
        if (userData?.fotoPerfil && this.currentUser) {
          this.applyUploadedFotoUrl(userData.fotoPerfil);
        }
      },
      error: (error) => {
        console.error('Failed to reload user data:', error);
      },
    });
  }
}
