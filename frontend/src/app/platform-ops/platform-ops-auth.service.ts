import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PlatformOpsSession {
  token: string;
  expiresAtEpochMs: number;
  email?: string;
  nome?: string;
  mfaValidatedAtEpochMs?: number;
  mfaRevalidateMinutes?: number;
}

export interface MfaSetupResponse {
  secret?: string;
  otpAuthUri?: string;
  enabled?: boolean;
}

const STORAGE_TOKEN = 'aerosuite_platform_ops_token';
const STORAGE_EXPIRES = 'aerosuite_platform_ops_expires';
const STORAGE_EMAIL = 'aerosuite_platform_ops_email';
const STORAGE_MFA_AT = 'aerosuite_platform_ops_mfa_at';
const STORAGE_MFA_REVALIDATE_MIN = 'aerosuite_platform_ops_mfa_revalidate_min';

@Injectable({ providedIn: 'root' })
export class PlatformOpsAuthService {
  private http = inject(HttpClient);

  /** Disparado quando APIs retornam MFA expirado ou o timer local detecta expiração. */
  readonly mfaStale$ = new Subject<void>();

  /** Disparado após login, elevação ou revalidação MFA bem-sucedida. */
  readonly sessionElevated$ = new Subject<void>();

  private apiBase(): string {
    return environment.getApiUrl ? environment.getApiUrl() : environment.apiUrl;
  }

  login(body: { email: string; password: string; totpCode?: string }): Observable<PlatformOpsSession> {
    return this.http
      .post<PlatformOpsSession>(`${this.apiBase()}/platform-ops/login`, body)
      .pipe(tap(session => this.persist(session)));
  }

  elevate(body: { password: string; totpCode?: string }): Observable<PlatformOpsSession> {
    return this.http
      .post<PlatformOpsSession>(`${this.apiBase()}/platform-ops/elevate`, body)
      .pipe(tap(session => this.persist(session)));
  }

  revalidateMfa(totpCode: string): Observable<PlatformOpsSession> {
    return this.http
      .post<PlatformOpsSession>(`${this.apiBase()}/platform-ops/revalidate-mfa`, { totpCode })
      .pipe(tap(session => this.persist(session)));
  }

  beginMfaEnrollment(setupToken: string): Observable<MfaSetupResponse> {
    return this.http.post<MfaSetupResponse>(`${this.apiBase()}/platform-ops/mfa/setup`, null, {
      headers: { Authorization: `Bearer ${setupToken}` }
    });
  }

  confirmMfaEnrollment(setupToken: string, totpCode: string): Observable<PlatformOpsSession> {
    return this.http
      .post<PlatformOpsSession>(
        `${this.apiBase()}/platform-ops/mfa/confirm`,
        { totpCode },
        { headers: { Authorization: `Bearer ${setupToken}` } }
      )
      .pipe(tap(session => this.persist(session)));
  }

  getToken(): string | null {
    const token = sessionStorage.getItem(STORAGE_TOKEN);
    if (!token || this.isSessionExpired()) {
      return null;
    }
    return token;
  }

  getEmail(): string | null {
    return sessionStorage.getItem(STORAGE_EMAIL);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isMfaStale(): boolean {
    if (!this.isAuthenticated()) {
      return false;
    }
    const mfaAt = Number(sessionStorage.getItem(STORAGE_MFA_AT));
    const mins = Number(sessionStorage.getItem(STORAGE_MFA_REVALIDATE_MIN)) || 30;
    if (!Number.isFinite(mfaAt) || mfaAt <= 0) {
      return true;
    }
    return Date.now() - mfaAt > mins * 60 * 1000;
  }

  getMfaRevalidateMinutes(): number {
    const mins = Number(sessionStorage.getItem(STORAGE_MFA_REVALIDATE_MIN));
    return Number.isFinite(mins) && mins > 0 ? mins : 30;
  }

  notifyMfaStale(): void {
    this.mfaStale$.next();
  }

  logout(): void {
    sessionStorage.removeItem(STORAGE_TOKEN);
    sessionStorage.removeItem(STORAGE_EXPIRES);
    sessionStorage.removeItem(STORAGE_EMAIL);
    sessionStorage.removeItem(STORAGE_MFA_AT);
    sessionStorage.removeItem(STORAGE_MFA_REVALIDATE_MIN);
  }

  private persist(session: PlatformOpsSession): void {
    if (!session?.token) {
      return;
    }
    sessionStorage.setItem(STORAGE_TOKEN, session.token);
    sessionStorage.setItem(STORAGE_EXPIRES, String(session.expiresAtEpochMs ?? 0));
    if (session.email) {
      sessionStorage.setItem(STORAGE_EMAIL, session.email);
    }
    const mfaAt = session.mfaValidatedAtEpochMs ?? Date.now();
    sessionStorage.setItem(STORAGE_MFA_AT, String(mfaAt));
    if (session.mfaRevalidateMinutes) {
      sessionStorage.setItem(STORAGE_MFA_REVALIDATE_MIN, String(session.mfaRevalidateMinutes));
    }
    this.sessionElevated$.next();
  }

  private isSessionExpired(): boolean {
    const raw = sessionStorage.getItem(STORAGE_EXPIRES);
    if (!raw) {
      return true;
    }
    const exp = Number(raw);
    return !Number.isFinite(exp) || exp <= Date.now();
  }
}
