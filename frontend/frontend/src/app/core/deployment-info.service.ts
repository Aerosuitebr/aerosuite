import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface DeploymentInfo {
  environmentName: string;
  kind: string;
  showBanner: boolean;
}

@Injectable({ providedIn: 'root' })
export class DeploymentInfoService {
  private http = inject(HttpClient);
  private cache$?: Observable<DeploymentInfo | null>;

  getInfo(): Observable<DeploymentInfo | null> {
    if (!this.cache$) {
      const apiUrl = environment.getApiUrl?.() ?? environment.apiUrl;
      this.cache$ = this.http.get<DeploymentInfo>(`${apiUrl}/public/deployment`).pipe(
        map(res => this.normalize(res)),
        catchError(() => of(this.fallbackFromHostname())),
        map(info => (info?.showBanner ? info : null)),
        shareReplay(1)
      );
    }
    return this.cache$;
  }

  private normalize(raw: DeploymentInfo | null | undefined): DeploymentInfo | null {
    if (!raw) {
      return this.fallbackFromHostname();
    }
    const environmentName = (raw.environmentName ?? '').trim();
    const kind = (raw.kind ?? '').trim().toLowerCase();
    const showBanner = raw.showBanner || !!environmentName || kind === 'production' || kind === 'homolog';
    if (!showBanner) {
      return null;
    }
    return { environmentName, kind, showBanner: true };
  }

  private fallbackFromHostname(): DeploymentInfo | null {
    const host = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
    if (host === 'prod.aerosuite.com.br') {
      return { environmentName: 'Aero Suite PROD', kind: 'production', showBanner: true };
    }
    if (host === 'app.aerosuite.com.br') {
      return { environmentName: 'Aero Suite HML', kind: 'homolog', showBanner: true };
    }
    return null;
  }
}
