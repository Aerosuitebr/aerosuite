import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TenantWhatsAppConnection, WhatsAppQrCode } from '../../core/whatsapp-api.service';

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
  listRfqs(query = ''): Observable<PartsRfqResult[]> { return this.http.get<PartsRfqResult[]>('/api/parts-finder/rfqs', { params: query ? { q: query } : {} }); }
  downloadRfqPdf(id: number): Observable<Blob> { return this.http.get(`/api/parts-finder/rfqs/${id}/pdf`, { responseType: 'blob' }); }
  sendRfqEmail(id: number, request: { destination: string; subject?: string; message?: string }): Observable<{ success: boolean }> { return this.http.post<{ success: boolean }>(`/api/parts-finder/rfqs/${id}/send-email`, request); }
  sendRfqWhatsApp(id: number, request: { destination: string; message?: string }): Observable<{ success: boolean; disconnected: boolean }> { return this.http.post<{ success: boolean; disconnected: boolean }>(`/api/parts-finder/rfqs/${id}/send-whatsapp`, request); }
  whatsappStatus(): Observable<TenantWhatsAppConnection> { return this.http.get<TenantWhatsAppConnection>('/api/parts-finder/rfqs/whatsapp/status'); }
  activateWhatsapp(): Observable<TenantWhatsAppConnection> { return this.http.post<TenantWhatsAppConnection>('/api/parts-finder/rfqs/whatsapp/activate', {}); }
  whatsappQrCode(): Observable<WhatsAppQrCode> { return this.http.get<WhatsAppQrCode>('/api/parts-finder/rfqs/whatsapp/qrcode'); }
}
