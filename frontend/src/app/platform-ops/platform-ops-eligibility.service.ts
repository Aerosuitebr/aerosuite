import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, catchError, shareReplay, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PlatformOpsEligibility {
  eligible: boolean;
}

@Injectable({ providedIn: 'root' })
export class PlatformOpsEligibilityService {
  private http = inject(HttpClient);
  private cached$?: Observable<boolean>;
  private lastValue: boolean | null = null;

  private apiBase(): string {
    return environment.getApiUrl ? environment.getApiUrl() : environment.apiUrl;
  }

  /** Elegível conforme allowlist `PLATFORM_OPS_EMAILS` no servidor. */
  checkEligibility(force = false): Observable<boolean> {
    if (!force && this.cached$) {
      return this.cached$;
    }
    this.cached$ = this.http
      .get<PlatformOpsEligibility>(`${this.apiBase()}/platform-ops/eligibility`)
      .pipe(
        map(res => !!res?.eligible),
        tap(v => (this.lastValue = v)),
        catchError(() => {
          this.lastValue = false;
          return of(false);
        }),
        shareReplay({ bufferSize: 1, refCount: true })
      );
    return this.cached$;
  }

  get snapshot(): boolean {
    return this.lastValue === true;
  }

  invalidate(): void {
    this.cached$ = undefined;
    this.lastValue = null;
  }
}
