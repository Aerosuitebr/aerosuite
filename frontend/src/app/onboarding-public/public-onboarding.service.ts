import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PublicOnboardingForm {
  organizacaoNome: string;
  organizacaoCodigo: string;
  alreadySubmitted: boolean;
  submittedAt?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  legalName?: string;
  legalDocument?: string;
  adminEmail?: string;
  supportEmail?: string;
  billingContactName?: string;
  billingContactEmail?: string;
}

export interface PublicOnboardingSubmit {
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  legalName?: string;
  legalDocument?: string;
  adminEmail?: string;
  supportEmail?: string;
  billingContactName?: string;
  billingContactEmail?: string;
}

@Injectable({ providedIn: 'root' })
export class PublicOnboardingService {
  private http = inject(HttpClient);

  private apiBase(): string {
    return environment.apiUrl ?? '/api';
  }

  getForm(token: string): Observable<PublicOnboardingForm> {
    return this.http.get<PublicOnboardingForm>(`${this.apiBase()}/public/onboarding/${encodeURIComponent(token)}`);
  }

  submit(token: string, body: PublicOnboardingSubmit): Observable<void> {
    return this.http.post<void>(`${this.apiBase()}/public/onboarding/${encodeURIComponent(token)}`, body);
  }
}
