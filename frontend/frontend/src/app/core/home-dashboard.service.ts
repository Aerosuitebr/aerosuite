import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, timeout } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { SUPPRESS_FORBIDDEN_TOAST } from '../auth/http-context-tokens';

export interface HomeDashboardMetrics {
  products: number;
  fabricantes: number;
  ordensServico: number;
  usuarios: number;
}

const EMPTY: HomeDashboardMetrics = {
  products: 0,
  fabricantes: 0,
  ordensServico: 0,
  usuarios: 0,
};

@Injectable({ providedIn: 'root' })
export class HomeDashboardService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/dashboard/home-metrics`;

  /** Uma requisição leve; timeout evita KPIs presos em spinner. */
  loadMetrics(opts?: { suppressForbiddenToast?: boolean }): Observable<HomeDashboardMetrics> {
    const context = opts?.suppressForbiddenToast
      ? new HttpContext().set(SUPPRESS_FORBIDDEN_TOAST, true)
      : undefined;
    return this.http
      .get<HomeDashboardMetrics>(this.base, context ? { context } : {})
      .pipe(
        timeout(12_000),
        catchError(() => of({ ...EMPTY }))
      );
  }
}
