import { inject, Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { StudioCanvasDocument } from './models/studio-canvas.model';

export interface StudioCollabState {
  revision: number;
  userName: string;
  document: StudioCanvasDocument;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class StudioCollabService implements OnDestroy {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/studio`;
  private eventSource: EventSource | null = null;
  private localRevision = 0;

  ngOnDestroy(): void {
    this.disconnect();
  }

  connect(sessionId: string, onRemote: (state: StudioCollabState) => void): void {
    this.disconnect();
    const url = `${this.base}/collab/${encodeURIComponent(sessionId)}/stream`;
    this.eventSource = new EventSource(url);
    this.eventSource.addEventListener('collab', ev => {
      try {
        const state = JSON.parse((ev as MessageEvent).data) as StudioCollabState;
        if (state.revision > this.localRevision) {
          this.localRevision = state.revision;
          onRemote(state);
        }
      } catch {
        // ignore malformed
      }
    });
  }

  disconnect(): void {
    this.eventSource?.close();
    this.eventSource = null;
  }

  publish(sessionId: string, userName: string, document: StudioCanvasDocument): Observable<StudioCollabState> {
    this.localRevision += 1;
    return this.http.put<StudioCollabState>(`${this.base}/collab/${encodeURIComponent(sessionId)}`, {
      revision: this.localRevision,
      userName,
      document: {
        version: document.version,
        widthMm: document.widthMm,
        heightMm: document.heightMm,
        bleedMm: document.bleedMm,
        backgroundColor: document.backgroundColor,
        elements: document.elements
      }
    });
  }
}
