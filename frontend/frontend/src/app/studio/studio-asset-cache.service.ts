import { inject, Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, shareReplay, tap } from 'rxjs';
import { environment } from '../../environments/environment';

/** Carrega assets do Studio via HTTP (JWT) e expõe object URLs para uso em img. */
@Injectable({ providedIn: 'root' })
export class StudioAssetCacheService implements OnDestroy {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/studio`;
  private cache = new Map<string, string>();
  private inflight = new Map<string, Observable<string>>();

  resolve(pathOrUrl: string | undefined | null): Observable<string> {
    if (!pathOrUrl) {
      return of('');
    }
    if (pathOrUrl.startsWith('http') || pathOrUrl.startsWith('data:') || pathOrUrl.startsWith('blob:')) {
      return of(pathOrUrl);
    }
    const key = pathOrUrl.replace(/\\/g, '/');
    const hit = this.cache.get(key);
    if (hit) {
      return of(hit);
    }
    const pending = this.inflight.get(key);
    if (pending) {
      return pending;
    }
    const url = `${this.base}/assets?path=${encodeURIComponent(key)}`;
    const req = this.http.get(url, { responseType: 'blob' }).pipe(
      map(blob => {
        const objectUrl = URL.createObjectURL(blob);
        this.cache.set(key, objectUrl);
        return objectUrl;
      }),
      tap({
        error: () => this.inflight.delete(key),
        complete: () => this.inflight.delete(key)
      }),
      catchError(() => of('')),
      shareReplay(1)
    );
    this.inflight.set(key, req);
    return req;
  }

  preload(path: string): void {
    this.resolve(path).subscribe({ error: () => undefined });
  }

  ngOnDestroy(): void {
    for (const url of this.cache.values()) {
      URL.revokeObjectURL(url);
    }
    this.cache.clear();
    this.inflight.clear();
  }
}
