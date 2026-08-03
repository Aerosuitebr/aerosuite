import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { OverlayPanelModule, OverlayPanel } from 'primeng/overlaypanel';
import { TooltipModule } from 'primeng/tooltip';
import { Subscription } from 'rxjs';
import { NotificacaoService, Notificacao } from '../../core/notificacao.service';
import { AuthService } from '../../auth/auth.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { TranslationService } from '../../core/translation.service';
import { formatUiDateTime } from '../../core/locale/locale-intl.util';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    BadgeModule,
    OverlayPanelModule,
    TooltipModule,
    TranslatePipe
  ],
  template: `
    <div class="notification-bell-container">
      <button 
        pButton 
        type="button" 
        icon="pi pi-bell" 
        class="p-button-text notification-btn"
        [class.has-notifications]="contador > 0"
        (click)="op.toggle($event)"
        [pTooltip]="'notifications.bell.tooltip' | translate"
        [attr.aria-label]="'notifications.bell.tooltip' | translate"
        tooltipPosition="bottom">
      </button>
      <span class="badge" *ngIf="contador > 0">{{ contador > 9 ? '9+' : contador }}</span>
    </div>

    <p-overlayPanel #op [dismissable]="true" [showCloseIcon]="false" styleClass="notification-panel">
      <div class="notification-header">
        <h4>{{ 'notifications.bell.title' | translate }}</h4>
        <button 
          *ngIf="notificacoes.length > 0"
          pButton 
          type="button" 
          [label]="'notifications.bell.markAllRead' | translate" 
          class="p-button-text p-button-sm"
          (click)="marcarTodasComoLidas()">
        </button>
      </div>

      <div class="notification-list" *ngIf="notificacoes.length > 0">
        <div 
          class="notification-item" 
          *ngFor="let notif of notificacoes"
          [class.unread]="!notif.lida"
          (click)="abrirNotificacao(notif, op)">
          <div class="notification-icon" [style.background]="getCorFundo(notif.tipo || '')">
            <i class="pi" [ngClass]="getIcone(notif.tipo || '')"></i>
          </div>
          <div class="notification-content">
            <span class="notification-title">{{ notif.titulo }}</span>
            <p class="notification-message">{{ notif.mensagem }}</p>
            <span class="notification-time">{{ getTempoRelativo(notif.dataCriacao || '') }}</span>
          </div>
        </div>
      </div>

      <div class="notification-empty" *ngIf="notificacoes.length === 0">
        <i class="pi pi-bell-slash"></i>
        <p>{{ 'notifications.bell.empty' | translate }}</p>
      </div>

      <div class="notification-footer" *ngIf="notificacoes.length > 0">
        <a (click)="verTodas(op)">{{ 'notifications.bell.viewAll' | translate }}</a>
      </div>
    </p-overlayPanel>
  `,
  styles: [`
    .notification-bell-container {
      position: relative;
      display: inline-flex;
    }

    .notification-btn {
      color: #64748b !important;
      width: 40px;
      height: 40px;

      &:hover {
        background: #f1f5f9 !important;
        color: #0f172a !important;
      }

      &.has-notifications {
        color: #0ea5e9 !important;
      }
    }

    .badge {
      position: absolute;
      top: 2px;
      right: 2px;
      background: #ef4444;
      color: white;
      font-size: 10px;
      font-weight: 600;
      min-width: 18px;
      height: 18px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
    }

    :host ::ng-deep .notification-panel {
      width: 360px;
      padding: 0 !important;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);

      .p-overlaypanel-content {
        padding: 0;
      }
    }

    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid #f1f5f9;

      h4 {
        margin: 0;
        font-size: 0.9375rem;
        font-weight: 600;
        color: #0f172a;
      }
    }

    .notification-list {
      max-height: 360px;
      overflow-y: auto;
    }

    .notification-item {
      display: flex;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      cursor: pointer;
      transition: background 0.2s ease;
      border-bottom: 1px solid #f8fafc;

      &:hover {
        background: #f8fafc;
      }

      &.unread {
        background: #f0f9ff;

        &:hover {
          background: #e0f2fe;
        }

        .notification-title {
          font-weight: 600;
        }
      }
    }

    .notification-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      i {
        font-size: 1rem;
        color: white;
      }
    }

    .notification-content {
      flex: 1;
      min-width: 0;
    }

    .notification-title {
      display: block;
      font-size: 0.8125rem;
      color: #0f172a;
      margin-bottom: 0.25rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .notification-message {
      margin: 0;
      font-size: 0.75rem;
      color: #64748b;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .notification-time {
      display: block;
      font-size: 0.6875rem;
      color: #94a3b8;
      margin-top: 0.375rem;
    }

    .notification-empty {
      padding: 2rem;
      text-align: center;

      i {
        font-size: 2rem;
        color: #cbd5e1;
        margin-bottom: 0.5rem;
      }

      p {
        margin: 0;
        font-size: 0.8125rem;
        color: #94a3b8;
      }
    }

    .notification-footer {
      padding: 0.75rem 1rem;
      text-align: center;
      border-top: 1px solid #f1f5f9;

      a {
        font-size: 0.8125rem;
        color: #0ea5e9;
        cursor: pointer;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  `]
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private notificacaoService = inject(NotificacaoService);
  private authService = inject(AuthService);
  private i18n = inject(TranslationService);

  notificacoes: Notificacao[] = [];
  contador = 0;
  
  private subscriptions: Subscription[] = [];
  private usuarioId: number | null = null;

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user?.id) {
      this.usuarioId = user.id;
      
      // Subscrever ao contador
      this.subscriptions.push(
        this.notificacaoService.contadorNaoLidas$.subscribe(count => {
          this.contador = count;
        })
      );
      
      // Subscrever às notificações
      this.subscriptions.push(
        this.notificacaoService.notificacoes$.subscribe(notifs => {
          this.notificacoes = notifs.slice(0, 10); // Mostrar apenas as 10 mais recentes
        })
      );
      
      // Carregar notificações iniciais
      this.notificacaoService.carregarNotificacoes(this.usuarioId);
      
      // Iniciar polling
      this.notificacaoService.iniciarPolling(this.usuarioId);
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  abrirNotificacao(notif: Notificacao, op: OverlayPanel) {
    if (!notif.lida && notif.id) {
      this.notificacaoService.marcarComoLida(notif.id).subscribe(() => {
        if (this.usuarioId) {
          this.notificacaoService.carregarNotificacoes(this.usuarioId);
        }
      });
    }
    
    op.hide();
    
    if (notif.link) {
      this.router.navigateByUrl(notif.link);
    }
  }

  marcarTodasComoLidas() {
    if (this.usuarioId) {
      this.notificacaoService.marcarTodasComoLidas(this.usuarioId).subscribe(() => {
        this.notificacaoService.carregarNotificacoes(this.usuarioId!);
      });
    }
  }

  verTodas(op: OverlayPanel) {
    op.hide();
    this.router.navigate(['/suporte']);
  }

  getIcone(tipo: string): string {
    return this.notificacaoService.getIcone(tipo);
  }

  getCorFundo(tipo: string): string {
    return this.notificacaoService.getCor(tipo);
  }

  getTempoRelativo(data: string): string {
    if (!data) return '';
    
    const agora = new Date();
    const dataNotif = new Date(data);
    const diff = agora.getTime() - dataNotif.getTime();
    
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);
    
    if (minutos < 1) return this.i18n.translate('notifications.relative.now');
    if (minutos < 60) return this.i18n.translate('notifications.relative.minutes', { n: String(minutos) });
    if (horas < 24) return this.i18n.translate('notifications.relative.hours', { n: String(horas) });
    if (dias < 7) return this.i18n.translate('notifications.relative.days', { n: String(dias) });
    
    return formatUiDateTime(this.i18n.getCurrentLanguage(), dataNotif, 'date');
  }
}
