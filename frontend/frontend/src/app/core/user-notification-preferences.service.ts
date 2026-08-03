import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type TicketEmailModo = 'INSTANT' | 'DIGEST_DAILY' | 'OFF';

export interface UsuarioNotificacaoPreferencias {
  ticketEmailModo: TicketEmailModo;
}

@Injectable({ providedIn: 'root' })
export class UserNotificationPreferencesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/usuario-preferences/notificacoes`;

  get(): Observable<UsuarioNotificacaoPreferencias> {
    return this.http.get<UsuarioNotificacaoPreferencias>(this.base);
  }

  save(ticketEmailModo: TicketEmailModo): Observable<void> {
    return this.http.put<void>(this.base, { ticketEmailModo });
  }
}
