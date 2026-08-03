import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ItemEstoquePublicPeek {
  codigoRastreio: string;
  partNumber: string;
  serialNumber?: string;
  descricao?: string;
  unidade?: string;
  status?: string;
  fornecedorNome?: string;
  fornecedorPais?: string;
  invoiceNumero?: string;
  loteCodigo?: string;
  localizacao?: string;
  prateleira?: string;
  gaveta?: string;
  certificadoConformidade?: string;
  dataFabricacao?: string;
  dataValidade?: string;
  shelfLifeMeses?: number;
}

@Injectable({ providedIn: 'root' })
export class EstoquePublicService {
  private http = inject(HttpClient);

  consultarItem(tenantCodigo: string, codigo: string): Observable<ItemEstoquePublicPeek> {
    const apiUrl = environment.getApiUrl ? environment.getApiUrl() : environment.apiUrl;
    const params = new HttpParams()
      .set('tenant', tenantCodigo.trim().toLowerCase())
      .set('codigo', codigo.trim());
    return this.http.get<ItemEstoquePublicPeek>(`${apiUrl}/public/estoque/item`, { params });
  }
}
