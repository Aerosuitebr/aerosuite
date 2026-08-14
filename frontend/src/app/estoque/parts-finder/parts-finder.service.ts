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
  supplierAslStatus?: string;
  country?: string;
  certification?: string;
  source: string;
  location?: string;
  lastUpdatedAt?: string;
}

export interface PartsFinderResponse { results: PartsFinderResult[]; total: number; }

@Injectable({ providedIn: 'root' })
export class PartsFinderService {
  private http = inject(HttpClient);
  search(partNumber: string, quantity?: number): Observable<PartsFinderResponse> {
    return this.http.post<PartsFinderResponse>('/api/parts-finder/search', { partNumber, quantity });
  }
}
