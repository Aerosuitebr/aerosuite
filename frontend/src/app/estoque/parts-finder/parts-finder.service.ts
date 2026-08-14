import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PartsFinderResult {
  inventoryItemId?: number;
  partNumber: string;
  description?: string;
  condition?: string;
  quantity?: number;
  currency?: string;
  unitPrice?: number;
  supplier?: string;
  supplierEmail?: string;
  supplierAslStatus?: string;
  country?: string;
  certification?: string;
  source: string;
  location?: string;
  aogAvailable?: boolean;
  estimatedLeadTimeHours?: number;
  lastUpdatedAt?: string;
}

export interface PartsFinderResponse { results: PartsFinderResult[]; total: number; }
export interface PartsFinderSearchRequest {
  partNumber: string;
  quantity?: number;
  condition?: string;
  country?: string;
  certification?: string;
  aog: boolean;
}

@Injectable({ providedIn: 'root' })
export class PartsFinderService {
  private http = inject(HttpClient);
  search(request: PartsFinderSearchRequest): Observable<PartsFinderResponse> {
    return this.http.post<PartsFinderResponse>('/api/parts-finder/search', request);
  }
}
