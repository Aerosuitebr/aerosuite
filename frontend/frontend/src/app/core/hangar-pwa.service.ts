import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HangarPwaService {
  private registered = false;

  registerIfSupported(): void {
    if (this.registered || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }
    if (!environment.production) {
      return;
    }
    this.registered = true;
    navigator.serviceWorker
      .register('/hangar-sw.js', { scope: '/' })
      .catch(() => {
        this.registered = false;
      });
  }
}
