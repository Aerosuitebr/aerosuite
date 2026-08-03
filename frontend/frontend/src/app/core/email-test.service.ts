import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface EmailTestResult {
  sucesso?: boolean;
  mensagem?: string;
  erro?: string;
  email?: string;
  instrucoes?: string;
  analise?: { tipo?: string; possiveisCausas?: string };
}

@Injectable({ providedIn: 'root' })
export class EmailTestService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/email/test`;

  enviarTeste(email: string): Observable<EmailTestResult> {
    return this.http.post<EmailTestResult>(this.base, { email });
  }
}
