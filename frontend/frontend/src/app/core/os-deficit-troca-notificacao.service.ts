import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface OsTrocaDeficitNotificacao {
  id: number;
  osId: number;
  idOs: number | null;
  /** DEFICIT | SOLICITACAO_TROCA */
  kind?: string | null;
  /** BEL-{id}/{ano} — igual à listagem de OS */
  osExibicao?: string | null;
  clienteNome?: string | null;
  detalheJson: string;
  createdAt?: string | null;
}

@Injectable({ providedIn: 'root' })
export class OsDeficitTrocaNotificacaoService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/notificacoes/trocas-deficit`;

  listarPendentes(): Observable<OsTrocaDeficitNotificacao[]> {
    return this.http.get<OsTrocaDeficitNotificacao[]>(`${this.base}/pendentes`).pipe(
      map((list) =>
        (list || []).map((raw) => {
          const r = raw as OsTrocaDeficitNotificacao & Record<string, unknown>;
          return {
            ...raw,
            idOs: (r.idOs ?? r['id_os']) as number | null,
            osId: (r.osId ?? r['os_id']) as number,
            kind: (r.kind ?? r['kind']) as string | null | undefined,
            osExibicao: (r.osExibicao ?? r['os_exibicao']) as string | null | undefined,
            detalheJson: String(r.detalheJson ?? r['detalhe_json'] ?? ''),
            clienteNome: (r.clienteNome ?? r['cliente_nome']) as string | null | undefined,
            createdAt: (r.createdAt ?? r['created_at']) as string | null | undefined
          };
        })
      )
    );
  }

  marcarCiente(id: number): Observable<void> {
    return this.http
      .post(`${this.base}/${encodeURIComponent(String(id))}/ciente`, {}, {
        observe: 'response',
        responseType: 'text'
      })
      .pipe(map(() => undefined));
  }
}
