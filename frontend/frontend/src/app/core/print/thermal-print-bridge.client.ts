import { Injectable } from '@angular/core';

export const THERMAL_PRINT_BRIDGE_BASE = 'http://127.0.0.1:19428';
const HEALTH_TIMEOUT_MS = 1500;
const PRINT_TIMEOUT_MS = 8000;

export interface ThermalPrintBridgeHealth {
  ok: boolean;
  version?: string;
  printer?: string;
}

@Injectable({ providedIn: 'root' })
export class ThermalPrintBridgeClient {
  async isAvailable(): Promise<boolean> {
    try {
      const health = await this.getHealth();
      return health.ok === true;
    } catch {
      return false;
    }
  }

  async getHealth(): Promise<ThermalPrintBridgeHealth> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
    try {
      const res = await fetch(`${THERMAL_PRINT_BRIDGE_BASE}/health`, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store'
      });
      if (!res.ok) throw new Error(`health ${res.status}`);
      return (await res.json()) as ThermalPrintBridgeHealth;
    } finally {
      clearTimeout(timer);
    }
  }

  async listPrinters(): Promise<string[]> {
    const res = await fetch(`${THERMAL_PRINT_BRIDGE_BASE}/printers`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`printers ${res.status}`);
    const data = (await res.json()) as { printers?: string[] };
    return data.printers ?? [];
  }

  async printRaw(content: string, printerName?: string): Promise<void> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PRINT_TIMEOUT_MS);
    try {
      const res = await fetch(`${THERMAL_PRINT_BRIDGE_BASE}/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          content,
          printer: printerName?.trim() || undefined
        })
      });
      if (!res.ok) {
        let detail = '';
        try {
          const err = (await res.json()) as { error?: string };
          detail = err.error ?? '';
        } catch {
          /* ignore */
        }
        throw new Error(detail || `print ${res.status}`);
      }
    } finally {
      clearTimeout(timer);
    }
  }
}
