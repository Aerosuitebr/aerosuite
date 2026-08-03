import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';

export interface SistemaAtualizacaoStatus {
  id?: number;
  versaoDisponivel?: string;
  versaoAtual?: string;
  status?: string;
  aprovadoPor?: number;
  dataAprovacao?: string;
  dataInicio?: string;
  dataConclusao?: string;
  contadorRegressivo?: number;
  mensagem?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AtualizacaoProgress {
  updateId: string;
  status: string;
  contadorRegressivo: number | null;
  mensagem: string;
  versaoDisponivel: string;
  versaoAtual: string;
  aprovadoPor: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class SistemaAtualizacaoService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private base = `${environment.apiUrl}/sistema-atualizacao`;
  
  private statusSubject = new BehaviorSubject<SistemaAtualizacaoStatus | null>(null);
  public status$: Observable<SistemaAtualizacaoStatus | null> = this.statusSubject.asObservable();
  
  private eventSource: EventSource | null = null;
  private progressSubject = new BehaviorSubject<AtualizacaoProgress | null>(null);
  public progress$: Observable<AtualizacaoProgress | null> = this.progressSubject.asObservable();
  private reconnectTimeout: any = null;
  private isConnecting = false;

  constructor() {
    // Conectar ao SSE e buscar status inicial
    setTimeout(() => {
      this.connect();
      this.getStatus().subscribe();
    }, 1000);
  }

  getStatus(): Observable<SistemaAtualizacaoStatus> {
    const url = `${this.base}/status`;
    
    return this.http.get<SistemaAtualizacaoStatus>(url).pipe(
      tap({
        next: (status) => {
          
          if (status && (status as any).status !== 'ATUALIZADO') {
            this.statusSubject.next(status);
          } else {
            // Mesmo quando status é ATUALIZADO, manter o objeto com versaoAtual
            this.statusSubject.next(status);
          }
        },
        error: (error) => {
          console.error('SistemaAtualizacaoService: erro ao buscar status:', error);
        }
      })
    );
  }

  aprovarAtualizacao(id: number): Observable<SistemaAtualizacaoStatus> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser.id) {
      throw new Error('SISTEMA_ATUALIZACAO_NOT_AUTHENTICATED');
    }
    
    return this.http.post<SistemaAtualizacaoStatus>(`${this.base}/${id}/aprovar`, {
      usuarioId: currentUser.id
    });
  }

  cancelarAtualizacao(id: number, motivo?: string): Observable<any> {
    const body: { motivo?: string } = {};
    if (motivo) {
      body.motivo = motivo;
    }
    return this.http.post(`${this.base}/${id}/cancelar`, body);
  }

  verificarAtualizacao(): Observable<any> {
    const url = `${this.base}/verificar`;
    
    return this.http.post(url, {}).pipe(
      tap({
        next: (response) => {
        },
        error: (error) => {
          console.error('SistemaAtualizacaoService: request error:', error);
        }
      })
    );
  }

  private connect() {
    if (this.isConnecting || (this.eventSource && this.eventSource.readyState !== EventSource.CLOSED)) {
      return;
    }

    this.isConnecting = true;
    
    try {
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }

      const url = `${environment.apiUrl}/sistema-atualizacao/events`;
      
      this.eventSource = new EventSource(url);
      
      this.eventSource.addEventListener('atualizacao', (event: MessageEvent) => {
        try {
          const progress: AtualizacaoProgress = JSON.parse(event.data);
          this.progressSubject.next(progress);
          
          // Atualizar status também
          this.getStatus().subscribe(status => {
            this.statusSubject.next(status);
          });
        } catch (error) {
          console.error('[SistemaAtualizacao] Failed to parse progress:', error, event.data);
        }
      });

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.updateId && data.status) {
            const progress: AtualizacaoProgress = data;
            this.progressSubject.next(progress);
          }
        } catch (error) {
          console.error('[SistemaAtualizacao] Failed to parse message:', error);
        }
      };
      
      this.eventSource.onerror = (error) => {
        console.error('[SistemaAtualizacao] SSE connection error:', error);
        this.isConnecting = false;
        
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
      console.error('[SistemaAtualizacao] Failed to create SSE connection:', error);
      this.isConnecting = false;
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }
      this.reconnectTimeout = setTimeout(() => this.connect(), 5000);
    }
  }

  getCurrentProgress(): AtualizacaoProgress | null {
    return this.progressSubject.value;
  }

  getCurrentStatus(): SistemaAtualizacaoStatus | null {
    return this.statusSubject.value;
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

