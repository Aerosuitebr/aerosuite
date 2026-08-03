import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TranslationService } from './translation.service';
import type { StudioCanvasDocument } from '../studio/models/studio-canvas.model';

export interface AeroStudioTemplate {
  id: string;
  i18nKey: string;
  categoryI18nKey: string;
  widthMm: number;
  heightMm: number;
  bleedMm: number;
  supportsCropMarks: boolean;
  supportsPngPreview?: boolean;
  asyncRecommended?: boolean;
  supportsEditor?: boolean;
}

export interface AeroStudioIdentity {
  onboardingCompleto: boolean;
  displayName: string;
  tagline: string;
  supportEmail: string;
  telefone: string;
  siteUrl: string;
  logoUrl: string;
  enderecoFormatado: string;
  tenantCodigo: string;
  portalQrUrl: string;
  portalQrPreviewDataUri?: string;
  servicosTop: string[];
  primaryColorDefault: string;
  secondaryColorDefault: string;
}

export interface AeroStudioRenderRequest {
  templateId: string;
  locale?: string;
  includeCropMarks?: boolean;
  includeQrPortal?: boolean;
  packageZip?: boolean;
  includePngInZip?: boolean;
  async?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
  taglineOverride?: string;
  servicesText?: string;
  displayNameOverride?: string;
  supportEmailOverride?: string;
  telefoneOverride?: string;
  siteUrlOverride?: string;
  enderecoOverride?: string;
  letterheadPresetId?: string;
  customLayout?: StudioCanvasDocument;
  animationCaptureSec?: number;
  includeAnimatedExport?: boolean;
}

export interface AeroStudioStockImage {
  id: string;
  tags: string[];
  thumbUrl: string;
  fullUrl: string;
}

export interface AeroStudioJob {
  id: number;
  templateId: string;
  status: string;
  fileName: string;
  mediaType: string;
  hasPreview: boolean;
  errorMessage?: string;
  createdAt: string;
}

export interface AeroStudioJobStarted {
  jobId: number;
  status: string;
  async: boolean;
}

@Injectable({ providedIn: 'root' })
export class AeroStudioService {
  private http = inject(HttpClient);
  private i18n = inject(TranslationService);
  private base = `${environment.apiUrl}/studio`;

  templates(): Observable<AeroStudioTemplate[]> {
    return this.http.get<AeroStudioTemplate[]>(`${this.base}/templates`);
  }

  context(): Observable<AeroStudioIdentity> {
    return this.http.get<AeroStudioIdentity>(`${this.base}/context`);
  }

  history(): Observable<AeroStudioJob[]> {
    return this.http.get<AeroStudioJob[]>(`${this.base}/history`);
  }

  getJob(id: number): Observable<AeroStudioJob> {
    return this.http.get<AeroStudioJob>(`${this.base}/jobs/${id}`);
  }

  preview(body: AeroStudioRenderRequest): Observable<Blob> {
    return this.http.post(`${this.base}/preview`, this.withLocale(body), { responseType: 'blob' });
  }

  previewFrame(body: AeroStudioRenderRequest, animationCaptureSec: number): Observable<Blob> {
    return this.http.post(`${this.base}/preview`, this.withLocale({ ...body, animationCaptureSec }), {
      responseType: 'blob'
    });
  }

  searchStock(query: string, limit = 12): Observable<AeroStudioStockImage[]> {
    return this.http.get<AeroStudioStockImage[]>(`${this.base}/stock`, {
      params: { q: query ?? '', limit: String(limit) }
    });
  }

  uploadImage(file: File): Observable<{ path: string }> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<{ path: string }>(`${this.base}/upload`, fd);
  }

  resolveAssetUrl(path: string): string {
    if (!path || path.startsWith('http')) {
      return path;
    }
    return `${this.base}/assets?path=${encodeURIComponent(path)}`;
  }

  previewUrlFromBlob(blob: Blob): string {
    return URL.createObjectURL(blob);
  }

  revokePreviewUrl(url: string | null): void {
    if (url) {
      URL.revokeObjectURL(url);
    }
  }

  render(body: AeroStudioRenderRequest): Observable<HttpResponse<Blob>> {
    return this.http.post(`${this.base}/render`, this.withLocale(body), {
      observe: 'response',
      responseType: 'blob'
    });
  }

  downloadJob(id: number): Observable<Blob> {
    return this.http.get(`${this.base}/jobs/${id}/download`, { responseType: 'blob' });
  }

  jobPreview(id: number): Observable<Blob> {
    return this.http.get(`${this.base}/jobs/${id}/preview`, { responseType: 'blob' });
  }

  isAsyncTemplate(
    templateId: string,
    templates: AeroStudioTemplate[],
    customLayout?: StudioCanvasDocument
  ): boolean {
    if (customLayout) {
      const area = customLayout.widthMm * customLayout.heightMm;
      if (area >= 400_000 || customLayout.widthMm >= 1500 || customLayout.heightMm >= 1500) {
        return true;
      }
    }
    const t = templates.find(x => x.id === templateId);
    return t?.asyncRecommended === true;
  }

  static readonly TEMPLATE_CUSTOM = 'custom-canvas';
  static readonly TEMPLATE_LETTERHEAD = 'papel-timbrado';

  triggerDownload(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  private withLocale(body: AeroStudioRenderRequest): AeroStudioRenderRequest {
    return { ...body, locale: body.locale ?? this.i18n.getCurrentLanguage() };
  }
}
