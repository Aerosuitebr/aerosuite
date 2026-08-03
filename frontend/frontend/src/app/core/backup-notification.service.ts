import { Injectable, inject } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface BackupProgress {
  backupId: string;
  status: 'running' | 'success' | 'error';
  progress: number; // 0-100
  message: string;
  errorMessage?: string;
  backupDate?: string;
  backupPath?: string;
}

@Injectable({ providedIn: 'root' })
export class BackupNotificationService {
  private eventSource: EventSource | null = null;
  private progressSubject = new BehaviorSubject<BackupProgress | null>(null);
  public progress$ = this.progressSubject.asObservable();
  private reconnectTimeout: any = null;
  private isConnecting = false;

  constructor() {
    // Aguardar um pouco antes de conectar para garantir que o app está pronto
    setTimeout(() => this.connect(), 1000);
  }

  private connect() {
    if (this.isConnecting || (this.eventSource && this.eventSource.readyState !== EventSource.CLOSED)) {
      return;
    }

    this.isConnecting = true;
    
    try {
      // Fechar conexão anterior se existir
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }

      const url = `${environment.apiUrl}/backup-config/progress-stream`;
      
      this.eventSource = new EventSource(url);
      
      this.eventSource.addEventListener('progress', (event: MessageEvent) => {
        try {
          const progress: BackupProgress = JSON.parse(event.data);
          this.progressSubject.next(progress);
        } catch (error) {
          console.error('[BackupNotification] Failed to parse backup progress:', error, event.data);
        }
      });

      this.eventSource.addEventListener('connected', (event: MessageEvent) => {
        this.isConnecting = false;
      });
      
      // Fallback para eventos sem tipo específico
      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Se tiver campos de progresso, tratar como progresso
          if (data.backupId && data.status) {
            const progress: BackupProgress = data;
            this.progressSubject.next(progress);
          }
        } catch (error) {
          console.error('[BackupNotification] Failed to parse message:', error);
        }
      };
      
      this.eventSource.onerror = (error) => {
        console.error('[BackupNotification] SSE connection error:', error);
        console.error('[BackupNotification] Connection state:', this.eventSource?.readyState);
        this.isConnecting = false;
        
        // Tentar reconectar após 5 segundos se a conexão foi fechada
        if (this.eventSource?.readyState === EventSource.CLOSED) {
          if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
          }
          this.reconnectTimeout = setTimeout(() => {
            this.connect();
          }, 5000);
        }
      };
      
      this.eventSource.onopen = () => {
        this.isConnecting = false;
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
      };
    } catch (error) {
      console.error('[BackupNotification] Failed to create SSE connection:', error);
      this.isConnecting = false;
      // Tentar reconectar após 5 segundos
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }
      this.reconnectTimeout = setTimeout(() => this.connect(), 5000);
    }
  }

  getCurrentProgress(): BackupProgress | null {
    return this.progressSubject.value;
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

