import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  DEFAULT_USUARIO_AVATAR,
  extractUsuarioFotoFilename,
  isEphemeralUsuarioFotoUrl,
  resolveUsuarioFotoUrl,
} from './usuario-foto.util';
import { AuthService, User } from '../auth/auth.service';

export interface FotoUploadResponse {
  message?: string;
  fotoPerfil?: string;
  fotoUrl?: string;
}

export function parseFotoUploadFilename(response: FotoUploadResponse | null | undefined): string | null {
  const raw = response?.fotoUrl || response?.fotoPerfil;
  if (!raw || String(raw).startsWith('data:')) {
    return null;
  }
  return extractUsuarioFotoFilename(String(raw)) ?? String(raw).split('/').pop()?.split('?')[0] ?? null;
}

export interface LoadAvatarOptions {
  bustCache?: boolean;
}

@Injectable({ providedIn: 'root' })
export class UsuarioFotoService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private cachedBlobUrl: string | null = null;

  /**
   * Carrega a foto do utilizador autenticado via {@code GET /auth/me/foto} (Bearer).
   * Não depende só do nome em localStorage — o servidor resolve disco/BD.
   */
  loadCurrentUserAvatarUrl(options?: LoadAvatarOptions): Observable<string> {
    const apiUrl = environment.getApiUrl ? environment.getApiUrl() : environment.apiUrl;
    const bust = options?.bustCache ? `?t=${Date.now()}` : '';
    return this.http.get(`${apiUrl}/auth/me/foto${bust}`, { responseType: 'blob' }).pipe(
      map((blob) => this.blobToDisplayUrl(blob)),
      catchError(() => of(DEFAULT_USUARIO_AVATAR))
    );
  }

  loadAvatarUrl(fotoPerfil: string | null | undefined, options?: LoadAvatarOptions): Observable<string> {
    if (this.authService.isAuthenticated()) {
      return this.loadCurrentUserAvatarUrl(options).pipe(
        catchError(() => this.loadAvatarUrlFromPublicPath(fotoPerfil, options))
      );
    }
    return this.loadAvatarUrlFromPublicPath(fotoPerfil, options);
  }

  private loadAvatarUrlFromPublicPath(
    fotoPerfil: string | null | undefined,
    options?: LoadAvatarOptions
  ): Observable<string> {
    const publicUrl = this.resolveDisplayUrl(fotoPerfil, options?.bustCache);
    if (publicUrl !== DEFAULT_USUARIO_AVATAR) {
      return of(publicUrl);
    }
    return of(DEFAULT_USUARIO_AVATAR);
  }

  resolveDisplayUrl(fotoPerfil: string | null | undefined, bustCache = false): string {
    if (isEphemeralUsuarioFotoUrl(fotoPerfil)) {
      return DEFAULT_USUARIO_AVATAR;
    }

    const raw = fotoPerfil?.trim();
    if (!raw) {
      return DEFAULT_USUARIO_AVATAR;
    }

    const apiPath = resolveUsuarioFotoUrl(fotoPerfil);
    if (!apiPath) {
      return DEFAULT_USUARIO_AVATAR;
    }

    if (apiPath.startsWith('http://') || apiPath.startsWith('https://')) {
      if (
        apiPath.includes('usuario-foto') ||
        apiPath.includes('usuarios/foto') ||
        apiPath.includes('uploads/')
      ) {
        const filename = this.extractFilenameFromUrl(apiPath);
        if (filename) {
          return this.resolveDisplayUrl(filename, bustCache);
        }
      }
      return apiPath;
    }

    const base = apiPath.split('?')[0];
    return bustCache ? `${base}?t=${Date.now()}` : base;
  }

  applyUploadToUser(
    user: User,
    response: FotoUploadResponse | null | undefined,
    localPreviewUrl?: string | null
  ): Observable<string> {
    const filename = parseFotoUploadFilename(response);
    if (filename) {
      user.fotoPerfil = filename;
    }
    this.invalidateBlobCache();
    return this.loadCurrentUserAvatarUrl({ bustCache: true }).pipe(
      map((url) => (url !== DEFAULT_USUARIO_AVATAR ? url : localPreviewUrl ?? url)),
      catchError(() => of(localPreviewUrl ?? DEFAULT_USUARIO_AVATAR))
    );
  }

  completeProfilePhotoUpload(
    user: User,
    response: FotoUploadResponse | null | undefined,
    localPreviewUrl?: string | null
  ): Observable<string> {
    const filename = parseFotoUploadFilename(response);
    if (filename) {
      user.fotoPerfil = filename;
    }
    this.invalidateBlobCache();
    return this.authService.refreshCurrentUserFromServer().pipe(
      switchMap((refreshed) => {
        const synced = refreshed ?? user;
        if (synced.fotoPerfil) {
          user.fotoPerfil = synced.fotoPerfil;
        }
        return this.loadCurrentUserAvatarUrl({ bustCache: true });
      }),
      map((url) => (url !== DEFAULT_USUARIO_AVATAR ? url : localPreviewUrl ?? url)),
      catchError(() => this.applyUploadToUser(user, response, localPreviewUrl))
    );
  }

  invalidate(): void {
    this.invalidateBlobCache();
  }

  invalidateAll(): void {
    this.invalidateBlobCache();
  }

  uploadProfilePhoto(file: File): Observable<FotoUploadResponse> {
    const formData = new FormData();
    formData.append('imagem', file, file.name);
    const apiUrl = environment.getApiUrl ? environment.getApiUrl() : environment.apiUrl;
    return this.http.post<FotoUploadResponse>(`${apiUrl}/auth/me/foto`, formData);
  }

  uploadProfilePhotoWithProgress(file: File): Observable<HttpEvent<FotoUploadResponse>> {
    const formData = new FormData();
    formData.append('imagem', file, file.name);
    const apiUrl = environment.getApiUrl ? environment.getApiUrl() : environment.apiUrl;
    return this.http.post<FotoUploadResponse>(`${apiUrl}/auth/me/foto`, formData, {
      reportProgress: true,
      observe: 'events',
    });
  }

  private blobToDisplayUrl(blob: Blob | null | undefined): string {
    if (!blob || blob.size === 0 || (blob.type && !blob.type.startsWith('image/'))) {
      return DEFAULT_USUARIO_AVATAR;
    }
    this.invalidateBlobCache();
    const objectUrl = URL.createObjectURL(blob);
    this.cachedBlobUrl = objectUrl;
    return objectUrl;
  }

  private invalidateBlobCache(): void {
    if (this.cachedBlobUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(this.cachedBlobUrl);
    }
    this.cachedBlobUrl = null;
  }

  private extractFilenameFromUrl(url: string): string {
    const path = url.split('?')[0];
    const parts = path.split('/');
    return parts[parts.length - 1] || '';
  }
}
