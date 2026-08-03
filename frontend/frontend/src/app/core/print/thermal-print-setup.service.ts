import { Injectable, signal } from '@angular/core';

export type ThermalPrintSetupReason = 'manual' | 'print-failed';

@Injectable({ providedIn: 'root' })
export class ThermalPrintSetupService {
  readonly visible = signal(false);
  readonly reason = signal<ThermalPrintSetupReason>('manual');

  open(reason: ThermalPrintSetupReason = 'manual'): void {
    this.reason.set(reason);
    this.visible.set(true);
  }

  close(): void {
    this.visible.set(false);
  }

  onVisibleChange(visible: boolean): void {
    this.visible.set(visible);
  }
}
