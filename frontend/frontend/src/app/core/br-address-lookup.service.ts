import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { digitsOnly } from './br-input.util';

export interface CepLookupResult {
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  complemento?: string;
}

export interface CnpjLookupResult {
  razaoSocial: string;
  nomeFantasia?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  telefone?: string;
  email?: string;
}

@Injectable({ providedIn: 'root' })
export class BrAddressLookupService {
  private readonly http = inject(HttpClient);

  lookupCep(cep: string): Observable<CepLookupResult | null> {
    const digits = digitsOnly(cep);
    if (digits.length !== 8) {
      return of(null);
    }
    return this.http.get<CepLookupResult>(`/api/br/cep/${digits}`).pipe(
      catchError(() => of(null))
    );
  }

  lookupCnpj(cnpj: string): Observable<CnpjLookupResult | null> {
    const digits = digitsOnly(cnpj);
    if (digits.length !== 14) {
      return of(null);
    }
    return this.http.get<CnpjLookupResult>(`/api/br/cnpj/${digits}`).pipe(
      catchError(() => of(null))
    );
  }
}
