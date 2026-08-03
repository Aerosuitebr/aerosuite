import { Injectable, inject, Optional } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { BackupConfigService } from './backup-config.service';
import { MessageService } from 'primeng/api';
import { TranslationService } from './translation.service';
import { toastKey } from './toast-i18n.util';

export interface BackupProgressState {
  show: boolean;
  backupId: string | null;
  progress: number; // 0-100
  status: 'running' | 'success' | 'error';
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class BackupProgressService {
  private backupService = inject(BackupConfigService);
  private i18n = inject(TranslationService);
  private messageService: MessageService | null = null;
  
  constructor(@Optional() messageService?: MessageService) {
    // MessageService agora está disponível globalmente, mas manter verificação de segurança
    this.messageService = messageService || null;
  }
  
  private stateSubject = new BehaviorSubject<BackupProgressState>({
    show: false,
    backupId: null,
    progress: 0,
    status: 'running',
    message: this.i18n.translate('backup.progress.running')
  });
  
  public state$: Observable<BackupProgressState> = this.stateSubject.asObservable();
  
  private progressInterval: any = null;
  private statusInterval: any = null;

  // Perímetro do círculo do relógio (raio 54)
  get clockCircumference(): number {
    return 2 * Math.PI * 54; // ≈ 339.292
  }

  // Calcula o offset do stroke para animação do relógio
  clockStrokeDashoffset(progress: number): number {
    const p = Math.max(0, Math.min(100, progress));
    const circumference = this.clockCircumference;
    const offset = circumference - (p / 100 * circumference);
    return Math.max(0, Math.min(circumference, offset));
  }

  // Retorna a cor do progresso baseado no status
  getProgressColor(status: 'running' | 'success' | 'error'): string {
    if (status === 'success') {
      return '#10b981';
    } else if (status === 'error') {
      return '#ef4444';
    } else {
      return '#0ea5e9'; // Azul durante o progresso
    }
  }

  getCurrentState(): BackupProgressState {
    return this.stateSubject.value;
  }

  startBackupAnimation(backupId: string) {
    // Limpar intervalos anteriores se existirem
    this.stopBackupAnimation();
    
    const initialState: BackupProgressState = {
      show: true,
      backupId: backupId,
      progress: 0,
      status: 'running',
      message: this.i18n.translate('backup.progress.running')
    };
    
    this.stateSubject.next(initialState);
    
    // Simular progresso durante 30 segundos
    const duration = 30000; // 30 segundos
    const interval = 50; // Atualizar a cada 50ms para animação mais suave
    
    let elapsed = 0;
    this.progressInterval = setInterval(() => {
      elapsed += interval;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      
      const currentState = this.stateSubject.value;
      this.stateSubject.next({
        ...currentState,
        progress: newProgress
      });
      
      if (elapsed >= duration) {
        clearInterval(this.progressInterval);
        this.progressInterval = null;
        // Verificar status final do backup após 30 segundos
        this.checkBackupStatusFinal(backupId);
      }
    }, interval);
  }

  private checkBackupStatusFinal(backupId: string) {
    this.backupService.getBackupStatus(backupId).subscribe({
      next: (status) => {
        const currentState = this.stateSubject.value;
        let newStatus: 'running' | 'success' | 'error' = 'error';
        let message = this.i18n.translate('backup.progress.runError');
        
        if (status.status === 'success') {
          newStatus = 'success';
          message = this.i18n.translate('backup.progress.success');
        } else if (status.status === 'failed') {
          newStatus = 'error';
          message = status.errorMessage || this.i18n.translate('backup.progress.runError');
        } else {
          // Se ainda estiver rodando, considerar como erro após 30 segundos
          newStatus = 'error';
          message = this.i18n.translate('backup.progress.timeout');
        }
        
        this.stateSubject.next({
          ...currentState,
          status: newStatus,
          progress: 100,
          message: message
        });
        
        // Mostrar mensagem toast (se MessageService estiver disponível)
        if (this.messageService) {
          this.i18n.addToastLiteralDetail(
            this.messageService,
            newStatus === 'success' ? 'success' : 'error',
            newStatus === 'success' ? 'common.toast.success' : 'common.toast.error',
            message
          );
        }
        
        // Aguardar um pouco para mostrar a mensagem final antes de fechar
        setTimeout(() => {
          this.stopBackupAnimation();
        }, 3000); // Aguardar 3 segundos para mostrar a mensagem final
      },
      error: (error) => {
        console.error('Failed to check backup status:', error);
        const currentState = this.stateSubject.value;
        this.stateSubject.next({
          ...currentState,
          status: 'error',
          progress: 100,
          message: this.i18n.translate('backup.progress.checkStatusError')
        });
        
        // Mostrar mensagem toast de erro (se MessageService estiver disponível)
        if (this.messageService) {
          toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'backup.progress.checkStatusError');
        }
        
        setTimeout(() => {
          this.stopBackupAnimation();
        }, 3000);
      }
    });
  }

  stopBackupAnimation() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
    
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
      this.statusInterval = null;
    }
    
    const currentState = this.stateSubject.value;
    this.stateSubject.next({
      ...currentState,
      show: false,
      backupId: null,
      progress: 0
    });
  }

  hideNotification() {
    this.stopBackupAnimation();
  }
}

