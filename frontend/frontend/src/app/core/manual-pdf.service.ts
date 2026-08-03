import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError, from, switchMap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export type ManualPdfErrorCode = 'notFound' | 'forbidden' | 'unauthorized' | 'server';

export class ManualPdfLoadError extends Error {
  constructor(readonly code: ManualPdfErrorCode) {
    super(code);
    this.name = 'ManualPdfLoadError';
  }
}

/**
 * Carrega PDFs de /api/manuals com Bearer (interceptor).
 * Iframes não enviam JWT — usar blob URL no iframe.
 */
@Injectable({ providedIn: 'root' })
export class ManualPdfService {
  private readonly http = inject(HttpClient);

  private apiBase(): string {
    const apiUrl = environment.getApiUrl ? environment.getApiUrl() : environment.apiUrl;
    return apiUrl.replace(/\/$/, '');
  }

  fetchBlobUrl(filename: string): Observable<string> {
    const safe = filename.replace(/[^a-zA-Z0-9_.\-]/g, '');
    return this.http
      .get(`${this.apiBase()}/manuals/${safe}`, {
        responseType: 'blob',
        observe: 'response',
      })
      .pipe(
        switchMap((res) => from(this.blobUrlFromResponse(res))),
        catchError((err: unknown) => this.toLoadError$(err))
      );
  }

  private async blobUrlFromResponse(res: { body: Blob | null; headers: { get(name: string): string | null } }): Promise<string> {
    const blob = res.body;
    if (!blob || blob.size === 0) {
      throw new ManualPdfLoadError('notFound');
    }

    const type = (blob.type || res.headers.get('Content-Type') || '').toLowerCase();
    if (type.includes('json') || type.includes('text/plain')) {
      throw new ManualPdfLoadError(await this.codeFromErrorBody(blob));
    }

    if (!type.includes('pdf')) {
      const head = await blob.slice(0, 8).text();
      if (!head.startsWith('%PDF')) {
        throw new ManualPdfLoadError(await this.codeFromErrorBody(blob));
      }
    }

    const pdfBlob =
      blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' });
    return URL.createObjectURL(pdfBlob);
  }

  private async codeFromErrorBody(blob: Blob): Promise<ManualPdfErrorCode> {
    try {
      const text = (await blob.text()).trim().toLowerCase();
      if (text.includes('nao encontrado') || text.includes('not found')) {
        return 'notFound';
      }
      if (text.includes('permiss') || text.includes('forbidden') || text.includes('familia')) {
        return 'forbidden';
      }
      if (text.includes('autenticado') || text.includes('authenticated')) {
        return 'unauthorized';
      }
      try {
        const json = JSON.parse(text) as { message?: string };
        const msg = (json.message || '').toLowerCase();
        if (msg.includes('nao encontrado') || msg.includes('not found')) {
          return 'notFound';
        }
        if (msg.includes('permiss') || msg.includes('forbidden')) {
          return 'forbidden';
        }
        if (msg.includes('autenticado')) {
          return 'unauthorized';
        }
      } catch {
        /* not json */
      }
    } catch {
      /* ignore */
    }
    return 'server';
  }

  private toLoadError$(err: unknown): Observable<never> {
    if (err instanceof ManualPdfLoadError) {
      return throwError(() => err);
    }
    if (err instanceof HttpErrorResponse) {
      if (err.status === 404) {
        return throwError(() => new ManualPdfLoadError('notFound'));
      }
      if (err.status === 401) {
        return throwError(() => new ManualPdfLoadError('unauthorized'));
      }
      if (err.status === 403) {
        return throwError(() => new ManualPdfLoadError('forbidden'));
      }
      if (err.error instanceof Blob) {
        return from(this.codeFromErrorBody(err.error)).pipe(
          switchMap((code) => throwError(() => new ManualPdfLoadError(code)))
        );
      }
      return throwError(() => new ManualPdfLoadError('server'));
    }
    return throwError(() => new ManualPdfLoadError('server'));
  }
}
