import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { ButtonModule } from 'primeng/button';
import { BackupProgressService } from '../../core/backup-progress.service';
import { TranslationService } from '../../core/translation.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-backup-progress-notification',
  standalone: true,
  imports: [CommonModule, ButtonModule],
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
    <div *ngIf="state && state.show" class="backup-notification-container" [@slideInUp]>
      <div class="backup-notification-card" [class.success]="state.status === 'success'" [class.error]="state.status === 'error'">
        <div class="backup-notification-header">
          <div class="backup-title-section">
            <h3 class="backup-title">{{ progressTitle }}</h3>
            <p class="backup-message" *ngIf="state.status === 'running'">{{ runningMessage }}</p>
          </div>
          <button 
            *ngIf="state.status !== 'running'"
            pButton 
            type="button" 
            icon="pi pi-times" 
            class="p-button-text p-button-rounded close-btn"
            (click)="hideNotification()">
          </button>
        </div>
        
        <!-- Novo Estilo de Progresso - Barra Linear com Indicadores -->
        <div class="progress-container" *ngIf="state.status === 'running'">
          <div class="progress-info-row">
            <div class="progress-time">
              <span class="time-value">{{ getRemainingSeconds() }}</span>
              <span class="time-label">{{ secondsLabel }}</span>
            </div>
            <div class="progress-percentage">{{ Math.round(state?.progress || 0) }}%</div>
          </div>
          <div class="progress-bar-wrapper">
            <div class="progress-bar-track">
              <div 
                class="progress-bar-fill" 
                [style.width.%]="state?.progress || 0"
                [style.background]="'linear-gradient(90deg, ' + getProgressColor('running') + ' 0%, ' + getProgressColor('running') + ' 100%)'">
              </div>
            </div>
          </div>
        </div>
        
        <!-- Ícones de Status -->
        <div class="status-icon-container" *ngIf="state.status !== 'running'">
          <div class="status-icon" [class.success]="state.status === 'success'" [class.error]="state.status === 'error'">
            <i class="pi" [class.pi-check-circle]="state.status === 'success'" [class.pi-times-circle]="state.status === 'error'"></i>
          </div>
        </div>
        
        <!-- Mensagem de sucesso ou erro (apenas no final) -->
        <div *ngIf="state.status === 'success'" class="backup-success-animation">
          <i class="pi pi-check-circle"></i>
          <span>{{ state.message || successMessage }}</span>
        </div>
        
        <div *ngIf="state.status === 'error'" class="backup-error-animation">
          <i class="pi pi-times-circle"></i>
          <span>{{ state.message || errorMessage }}</span>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./backup-progress-notification.component.scss']
})
export class BackupProgressNotificationComponent implements OnInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  private i18n = inject(TranslationService);
  private destroy$ = new Subject<void>();
  private progressService: BackupProgressService | null = inject(BackupProgressService, { optional: true }) || null;
  
  state = {
    show: false,
    backupId: null as string | null,
    progress: 0,
    status: 'running' as 'running' | 'success' | 'error',
    message: ''
  };

  get progressTitle(): string {
    return this.i18n.translate('backup.progress.title');
  }

  get runningMessage(): string {
    return this.state.message || this.i18n.translate('backup.progress.running');
  }

  get successMessage(): string {
    return this.i18n.translate('backup.progress.success');
  }

  get errorMessage(): string {
    return this.i18n.translate('backup.progress.runError');
  }

  get secondsLabel(): string {
    return this.i18n.translate('backup.progress.secondsShort');
  }

  // Métodos getter para acesso seguro no template
  getProgressColor(status: 'running' | 'success' | 'error'): string {
    if (!this.progressService) {
      return '#0ea5e9';
    }
    try {
      return this.progressService.getProgressColor(status);
    } catch (error) {
      console.error('Failed to get progress color:', error);
      return '#0ea5e9';
    }
  }

  getClockCircumference(): number {
    if (!this.progressService) {
      return 339.292;
    }
    try {
      return this.progressService.clockCircumference;
    } catch (error) {
      console.error('Failed to get clock circumference:', error);
      return 339.292;
    }
  }

  getClockStrokeDashoffset(progress: number): number {
    if (!this.progressService) {
      return 339.292;
    }
    try {
      return this.progressService.clockStrokeDashoffset(progress);
    } catch (error) {
      console.error('Failed to calculate clock offset:', error);
      return 339.292;
    }
  }

  getRemainingSeconds(): number {
    try {
      const progress = this.state?.progress || 0;
      return Math.max(0, Math.ceil((100 - progress) * 30 / 100));
    } catch (error) {
      console.error('Failed to calculate remaining seconds:', error);
      return 0;
    }
  }

  // Expor Math para uso no template
  Math = Math;

  ngOnInit() {
    try {
      if (!this.progressService) {
        // Componente funcionará sem o serviço, apenas não mostrará notificações
        return;
      }
      
      this.progressService.state$
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (state) => {
            try {
              if (state) {
                this.state = { ...state };
                this.cdr.markForCheck();
              }
            } catch (error) {
              console.error('Failed to update backup state:', error);
            }
          },
          error: (error) => {
            console.error('Failed to subscribe to backup state:', error);
          }
        });
    } catch (error) {
      console.error('Failed to initialize backup notification component:', error);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  hideNotification() {
    if (this.progressService) {
      this.progressService.hideNotification();
    }
  }
}

