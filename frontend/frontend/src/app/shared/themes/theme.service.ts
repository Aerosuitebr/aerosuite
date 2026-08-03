import { Injectable, inject } from '@angular/core';
import { AppearancePreferencesService } from '../../core/appearance-preferences.service';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private darkClass = 'dark-theme';
  private initialized = false;
  private appearanceService = inject(AppearancePreferencesService);

  /** Força o modo escuro */
  enableDark(): void {
    document.body.classList.add(this.darkClass);
    this.appearanceService.setTheme('dark');
  }

  /** Força o modo claro */
  disableDark(): void {
    document.body.classList.remove(this.darkClass);
    this.appearanceService.setTheme('light');
  }

  /** Alterna manualmente */
  toggleTheme(): void {
    if (document.body.classList.contains(this.darkClass)) {
      this.disableDark();
    } else {
      this.enableDark();
    }
  }

  /** Carrega o tema salvo — padrão: claro */
  loadSavedTheme(): void {
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    const preferences = this.appearanceService.getPreferences();
    const theme = preferences.theme;

    this.appearanceService.setTheme(theme);
  }
}
