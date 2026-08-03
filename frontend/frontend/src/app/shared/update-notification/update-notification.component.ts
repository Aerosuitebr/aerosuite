import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { SistemaAtualizacaoService, AtualizacaoProgress } from '../../core/sistema-atualizacao.service';
import { AuthService } from '../../auth/auth.service';
import { Subject, takeUntil } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TranslationService } from '../../core/translation.service';
import { extractApiErrorMessage } from '../../core/backend-i18n-message.util';
import { toastKey } from '../../core/toast-i18n.util';
import { translateBackendI18nMessage } from '../../core/backend-i18n-message.util';
import { TranslatePipe } from '../../core/translate.pipe';

@Component({
  selector: 'app-update-notification',
  standalone: true,
  imports: [CommonModule, ButtonModule, DialogModule, ProgressBarModule, ToastModule, TranslatePipe],
  animations: [
    trigger('slideInUp', [
      transition(':enter', [
        style({ transform: 'translateY(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateY(100%)', opacity: 0 }))
      ])
    ])
  ],
  template: `
    <p-toast></p-toast>
    
    <!-- Notificação de Atualização Disponível - DESABILITADA -->
    <div *ngIf="false && showAvailableNotification" class="update-notification-container" [@slideInUp]>
      <div class="update-notification-card available">
        <div class="update-notification-header">
          <div class="update-title-section">
            <h3 class="update-title">
              <i class="pi pi-download"></i>
              {{ 'update.notification.available.title' | translate }}
            </h3>
            <p class="update-message">{{ availableMessage }}</p>
          </div>
          <button 
            pButton 
            type="button" 
            icon="pi pi-times" 
            class="p-button-text p-button-rounded close-btn"
            (click)="dismissAvailableNotification()">
          </button>
        </div>
        <div class="update-actions" *ngIf="canApprove">
          <button 
            pButton 
            type="button" 
            [label]="'update.notification.available.approve' | translate" 
            icon="pi pi-check"
            class="p-button-success"
            (click)="aprovarAtualizacao()"
            [loading]="aproving">
          </button>
          <button 
            pButton 
            type="button" 
            [label]="'common.actions.cancel' | translate" 
            icon="pi pi-times"
            class="p-button-text"
            (click)="dismissAvailableNotification()">
          </button>
        </div>
      </div>
    </div>

    <!-- Notificação de Contador Regressivo - DESABILITADA -->
    <div *ngIf="false && showCountdownNotification" class="update-notification-container" [@slideInUp]>
      <div class="update-notification-card countdown" [class.warning]="countdownSeconds <= 60">
        <div class="update-notification-header">
          <div class="update-title-section">
            <h3 class="update-title">
              <i class="pi" [class.pi-clock]="countdownSeconds > 0" [class.pi-exclamation-triangle]="countdownSeconds <= 60"></i>
              {{ 'update.notification.countdown.title' | translate }}
            </h3>
            <p class="update-message">{{ countdownMessage }}</p>
          </div>
        </div>
        <div class="countdown-display" *ngIf="countdownSeconds > 0">
          <div class="countdown-time">
            <span class="time-value">{{ formatTime(countdownSeconds) }}</span>
            <span class="time-label">{{ 'update.notification.countdown.remaining' | translate }}</span>
          </div>
          <p-progressBar 
            [value]="(countdownSeconds / 300) * 100" 
            [showValue]="false"
            [style]="{'height': '4px'}">
          </p-progressBar>
        </div>
        <div class="update-warning" *ngIf="countdownSeconds <= 60">
          <i class="pi pi-exclamation-triangle"></i>
          <span>{{ 'update.notification.countdown.warning' | translate }}</span>
        </div>
      </div>
    </div>

    <!-- Notificação de Atualização em Andamento - DESABILITADA -->
    <div *ngIf="false && showInProgressNotification" class="update-notification-container" [@slideInUp]>
      <div class="update-notification-card in-progress">
        <div class="update-notification-header">
          <div class="update-title-section">
            <h3 class="update-title">
              <i class="pi pi-spin pi-spinner"></i>
              {{ 'update.notification.inProgress.title' | translate }}
            </h3>
          </div>
        </div>
        <p-progressBar mode="indeterminate" [style]="{'height': '4px'}"></p-progressBar>
      </div>
    </div>

    <!-- Notificação de Conclusão - DESABILITADA -->
    <div *ngIf="false && showCompletedNotification" class="update-notification-container" [@slideInUp]>
      <div class="update-notification-card completed">
        <div class="update-notification-header">
          <div class="update-title-section">
            <h3 class="update-title">
              <i class="pi pi-check-circle"></i>
              {{ 'update.notification.completed.title' | translate }}
            </h3>
            <p class="update-message">{{ completedMessage }}</p>
          </div>
          <button 
            pButton 
            type="button" 
            icon="pi pi-times" 
            class="p-button-text p-button-rounded close-btn"
            (click)="dismissCompletedNotification()">
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./update-notification.component.scss']
})
export class UpdateNotificationComponent implements OnInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();
  private updateService = inject(SistemaAtualizacaoService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private i18n = inject(TranslationService);
  
  showAvailableNotification = false;
  showCountdownNotification = false;
  showInProgressNotification = false;
  showCompletedNotification = false;
  
  availableMessage = '';
  countdownMessage = '';
  inProgressMessage = '';
  completedMessage = '';
  countdownSeconds = 0;
  aproving = false;
  
  canApprove = false;
  currentUpdateId: number | null = null;

  ngOnInit() {
    // Desativado: reativar em app-layout quando o fluxo de atualização em produção estiver homologado.
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private handleUpdateProgress(progress: AtualizacaoProgress) {
    this.currentUpdateId = parseInt(progress.updateId);
    
    switch (progress.status) {
      case 'DISPONIVEL':
        this.showAvailableNotification = true;
        this.availableMessage = progress.mensagem
          ? translateBackendI18nMessage(this.i18n, progress.mensagem)
          : this.i18n.translate('update.notification.default.available');
        this.cdr.markForCheck();
        break;
        
      case 'APROVADA':
        this.showAvailableNotification = false;
        this.showCountdownNotification = true;
        this.countdownSeconds = progress.contadorRegressivo || 0;
        this.countdownMessage = progress.mensagem
          ? translateBackendI18nMessage(this.i18n, progress.mensagem)
          : this.i18n.translate('update.notification.default.countdown');
        this.updateCountdown();
        this.cdr.markForCheck();
        break;
        
      case 'EM_ANDAMENTO':
        this.showCountdownNotification = false;
        this.showInProgressNotification = true;
        this.inProgressMessage = progress.mensagem
          ? translateBackendI18nMessage(this.i18n, progress.mensagem)
          : this.i18n.translate('update.notification.default.inProgress');
        this.cdr.markForCheck();
        break;
        
      case 'CONCLUIDA':
        this.showInProgressNotification = false;
        this.showCompletedNotification = true;
        this.completedMessage = progress.mensagem
          ? translateBackendI18nMessage(this.i18n, progress.mensagem)
          : this.i18n.translate('update.notification.default.completed');
        this.i18n.addToastLiteralDetail(this.messageService, 'success', 'update.notification.toast.completedTitle', this.completedMessage);
        this.cdr.markForCheck();
        break;
        
      case 'CANCELADA':
        this.showAvailableNotification = false;
        this.showCountdownNotification = false;
        this.showInProgressNotification = false;
        this.i18n.addToastLiteralDetail(
          this.messageService,
          'info',
          'update.notification.toast.cancelledTitle',
          (progress.mensagem
            ? translateBackendI18nMessage(this.i18n, progress.mensagem)
            : this.i18n.translate('update.notification.toast.cancelledDetail'))
        );
        this.cdr.markForCheck();
        break;
    }
  }

  private handleStatus(status: any) {
    if (status.status === 'DISPONIVEL' && this.canApprove) {
      this.showAvailableNotification = true;
      this.availableMessage = status.mensagem
        ? translateBackendI18nMessage(this.i18n, status.mensagem)
        : this.i18n.translate('update.notification.default.available');
    }
  }

  private updateCountdown() {
    const interval = setInterval(() => {
      if (this.countdownSeconds > 0) {
        this.countdownSeconds--;
        this.countdownMessage = this.i18n.translate('config.update.backend.countdownSaveWork', {
          n: String(this.countdownSeconds)
        });
        this.cdr.markForCheck();
      } else {
        clearInterval(interval);
      }
    }, 1000);
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  aprovarAtualizacao() {
    if (!this.currentUpdateId) {
      return;
    }
    
    this.aproving = true;
    this.updateService.aprovarAtualizacao(this.currentUpdateId).subscribe({
      next: () => {
        toastKey(
          this.messageService,
          this.i18n,
          'success',
          'update.notification.toast.approvedTitle',
          'update.notification.toast.approvedDetail'
        );
        this.showAvailableNotification = false;
        this.aproving = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to approve update:', error);
        const detail =
          error?.message === 'SISTEMA_ATUALIZACAO_NOT_AUTHENTICATED'
            ? this.i18n.translate('config.update.toast.userNotAuthenticated')
            : extractApiErrorMessage(error, this.i18n, 'update.notification.toast.approveErrorDetail');
        this.i18n.addToastLiteralDetail(this.messageService, 'error', 'common.toast.error', detail);
        this.aproving = false;
        this.cdr.markForCheck();
      }
    });
  }

  dismissAvailableNotification() {
    this.showAvailableNotification = false;
    this.cdr.markForCheck();
  }

  dismissCompletedNotification() {
    this.showCompletedNotification = false;
    this.cdr.markForCheck();
  }
}

