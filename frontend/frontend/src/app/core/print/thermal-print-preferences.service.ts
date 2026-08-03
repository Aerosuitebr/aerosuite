import { Injectable } from '@angular/core';

export type ThermalPrintMode = 'auto' | 'thermal' | 'browser';

const STORAGE_MODE = 'aerosuite.thermalPrint.mode';
const STORAGE_PRINTER = 'aerosuite.thermalPrint.printerName';

@Injectable({ providedIn: 'root' })
export class ThermalPrintPreferencesService {
  getMode(): ThermalPrintMode {
    const raw = localStorage.getItem(STORAGE_MODE);
    if (raw === 'thermal' || raw === 'browser' || raw === 'auto') return raw;
    return 'browser';
  }

  setMode(mode: ThermalPrintMode): void {
    localStorage.setItem(STORAGE_MODE, mode);
  }

  getPrinterName(): string {
    return localStorage.getItem(STORAGE_PRINTER) ?? 'ELGIN L42PRO FULL';
  }

  setPrinterName(name: string): void {
    localStorage.setItem(STORAGE_PRINTER, (name ?? '').trim());
  }
}
