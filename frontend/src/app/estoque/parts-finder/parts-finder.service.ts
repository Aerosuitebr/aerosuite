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
export interface PartsRfqItem extends PartsFinderResult { requestedQuantity: number; lineTotal?: number; }
export interface PartsRfqRequest { title: string; aog: boolean; notes?: string; items: Array<PartsFinderResult & { quantity: number }>; }
export interface PartsRfqResult { id: number; number: string; status: string; title: string; aog: boolean; items: Array<PartsFinderResult & { quantity: number; lineTotal?: number }>; totalsByCurrency: Record<string, number>; createdAt: string; }
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
  createRfq(request: PartsRfqRequest): Observable<PartsRfqResult> {
    return this.http.post<PartsRfqResult>('/api/parts-finder/rfqs', request);
  }
}
