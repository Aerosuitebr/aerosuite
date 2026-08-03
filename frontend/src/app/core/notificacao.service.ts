import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable, Subscription, interval } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

export interface Notificacao {
  id?: number;
  usuarioId?: number;
  tipo?: string;
  titulo?: string;
  mensagem?: string;
  link?: string;
  referenciaTipo?: string;
  referenciaId?: number;
  lida?: boolean;
  dataCriacao?: string;
  dataLeitura?: string;
  isActive?: boolean;
}

export interface NotificacaoResponse {
  items: Notificacao[];
  naoLidas: number;
}

@Injectable({ providedIn: 'root' })
export class NotificacaoService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/notificacoes`;
  
  private _contadorNaoLidas = new BehaviorSubject<number>(0);
  private pollingSubscription?: Subscription;
  private pollingUsuarioId: number | null = null;
  contadorNaoLidas$ = this._contadorNaoLidas.asObservable();
  
  private _notificacoes = new BehaviorSubject<Notificacao[]>([]);
  notificacoes$ = this._notificacoes.asObservable();

  /**
   * Busca notificações do usuário
   */
  listar(usuarioId: number, apenasNaoLidas: boolean = false): Observable<NotificacaoResponse> {
    let params = new HttpParams().set('usuarioId', usuarioId.toString());
    if (apenasNaoLidas) {
      params = params.set('apenasNaoLidas', 'true');
    }
    return this.http.get<NotificacaoResponse>(this.base, { params });
  }

  /**
   * Conta notificações não lidas
   */
  contarNaoLidas(usuarioId: number): Observable<number> {
    return this.http.get<{ count: number }>(`${this.base}/count`, {
      params: { usuarioId: usuarioId.toString() }
    }).pipe(map(r => r.count));
  }

  /**
   * Marca uma notificação como lida
   */
  marcarComoLida(id: number): Observable<any> {
    return this.http.put(`${this.base}/${id}/lida`, {});
  }

  /**
   * Marca todas as notificações como lidas
   */
  marcarTodasComoLidas(usuarioId: number): Observable<any> {
    return this.http.put(`${this.base}/marcar-todas-lidas`, {}, {
      params: { usuarioId: usuarioId.toString() }
    });
  }

  /**
   * Deleta uma notificação
   */
  deletar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  /**
   * Atualiza o contador de notificações não lidas
   */
  atualizarContador(usuarioId: number): void {
    this.contarNaoLidas(usuarioId).subscribe(count => {
      this._contadorNaoLidas.next(count);
    });
  }

  /**
   * Carrega notificações e atualiza o state
   */
  carregarNotificacoes(usuarioId: number): void {
    this.listar(usuarioId, true).subscribe(response => {
      this._notificacoes.next(response.items);
      this._contadorNaoLidas.next(response.naoLidas);
    });
  }

  /**
   * Inicia polling para verificar novas notificações (a cada 30 segundos)
   */
  iniciarPolling(usuarioId: number): void {
    if (this.pollingUsuarioId === usuarioId && this.pollingSubscription && !this.pollingSubscription.closed) {
      return;
    }
    this.pollingSubscription?.unsubscribe();
    this.pollingUsuarioId = usuarioId;
    this.pollingSubscription = interval(30000).pipe(
      switchMap(() => this.contarNaoLidas(usuarioId))
    ).subscribe(count => {
      const anterior = this._contadorNaoLidas.value;
      this._contadorNaoLidas.next(count);
      
      // Se há mais notificações que antes, recarregar a lista
      if (count > anterior) {
        this.carregarNotificacoes(usuarioId);
      }
    });
  }

  /**
   * Retorna o ícone baseado no tipo de notificação
   */
  getIcone(tipo: string): string {
    switch (tipo) {
      case 'TICKET_ABERTO': return 'pi-plus-circle';
      case 'TICKET_RESPOSTA': return 'pi-reply';
      case 'TICKET_RESOLVIDO': return 'pi-check-circle';
      case 'TICKET_AGUARDANDO': return 'pi-clock';
      case 'TICKET_ATRIBUIDO': return 'pi-user';
      case 'TICKET_STATUS': return 'pi-sync';
      case 'TICKET_FECHADO': return 'pi-lock';
      case 'OS_CAPACIDADE_FILA': return 'pi-th-large';
      default: return 'pi-bell';
    }
  }

  /**
   * Retorna a cor baseada no tipo de notificação
   */
  getCor(tipo: string): string {
    switch (tipo) {
      case 'TICKET_ABERTO': return '#0ea5e9';
      case 'TICKET_RESPOSTA': return '#8b5cf6';
      case 'TICKET_RESOLVIDO': return '#22c55e';
      case 'TICKET_AGUARDANDO': return '#f59e0b';
      case 'TICKET_ATRIBUIDO': return '#6366f1';
      case 'TICKET_STATUS': return '#0284c7';
      case 'TICKET_FECHADO': return '#64748b';
      case 'OS_CAPACIDADE_FILA': return '#0ea5e9';
      default: return '#64748b';
    }
  }
}
