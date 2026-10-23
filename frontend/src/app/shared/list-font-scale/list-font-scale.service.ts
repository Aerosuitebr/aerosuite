import { Injectable, signal } from '@angular/core';

/**
 * Escala de fonte das listas (resultados de tabela).
 * Preferência persistida por navegador.
 */
@Injectable({ providedIn: 'root' })
export class ListFontScaleService {
  private readonly STORAGE_KEY = 'aerosuite_list_font_scale';
  /** Fatores relativos ao tamanho padrão da lista. */
  readonly steps = [1, 1.125, 1.25, 1.375, 1.5, 1.75] as const;

  private readonly scaleSignal = signal(this.readInitial());
  readonly scale = this.scaleSignal.asReadonly();

  get scaleValue(): number {
    return this.scaleSignal();
  }

  get percentLabel(): string {
    return `${Math.round(this.scaleValue * 100)}%`;
  }

  canDecrease(): boolean {
    return this.currentIndex() > 0;
  }

  canIncrease(): boolean {
    return this.currentIndex() < this.steps.length - 1;
  }

  decrease(): void {
    const i = this.currentIndex();
    if (i > 0) {
      this.setScale(this.steps[i - 1]);
    }
  }

  increase(): void {
    const i = this.currentIndex();
    if (i < this.steps.length - 1) {
      this.setScale(this.steps[i + 1]);
    }
  }

  reset(): void {
    this.setScale(1);
  }

  private currentIndex(): number {
    const v = this.scaleValue;
    let best = 0;
    let bestDiff = Number.POSITIVE_INFINITY;
    this.steps.forEach((step, idx) => {
      const d = Math.abs(step - v);
      if (d < bestDiff) {
        bestDiff = d;
        best = idx;
      }
    });
    return best;
  }

  private setScale(value: number): void {
    this.scaleSignal.set(value);
    try {
      localStorage.setItem(this.STORAGE_KEY, String(value));
    } catch {
      /* ignore quota / private mode */
    }
  }

  private readInitial(): number {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw == null) {
        return 1;
      }
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 0.75 || n > 2.5) {
        return 1;
      }
      return n;
    } catch {
      return 1;
    }
  }
}
