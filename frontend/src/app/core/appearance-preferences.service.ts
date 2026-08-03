import { ApplicationRef, Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type InterfaceDensity = 'compact' | 'normal' | 'spacious';
export type FontSize = 'small' | 'medium' | 'large';

export interface AppearancePreferences {
  theme: ThemeMode;
  language: string;
  density: InterfaceDensity;
  fontSize: FontSize;
  animationsEnabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AppearancePreferencesService {
  private readonly appRef = inject(ApplicationRef);
  private readonly http = inject(HttpClient);
  private readonly STORAGE_KEY = 'appearance_preferences';
  private readonly TOKEN_KEY = 'aerosuite_token';

  private defaultPreferences: AppearancePreferences = {
    theme: 'light',
    language: 'pt-BR',
    density: 'normal',
    fontSize: 'medium',
    animationsEnabled: true
  };

  private preferencesSubject = new BehaviorSubject<AppearancePreferences>(
    this.loadPreferences()
  );

  public preferences$: Observable<AppearancePreferences> =
    this.preferencesSubject.asObservable();

  constructor() {
    setTimeout(() => {
      const prefs = this.preferencesSubject.value;
      this.applyPreferences(prefs);
      this.syncIdiomaToServer(prefs.language);
    }, 0);
  }

  /** Remove resíduos da experiência antiga de “skins” (link dinâmico, data-skin, classes). */
  private clearLegacySkinDom(): void {
    /* mantém #primeng-theme-link — gerenciado por applyPrimeNgTheme */
    const html = document.documentElement;
    html.removeAttribute('data-skin');
    html.classList.remove('skin-light', 'skin-dark');
  }

  private applyPrimeNgTheme(resolved: 'light' | 'dark'): void {
    const href =
      resolved === 'dark'
        ? 'assets/themes/lara-dark-indigo/theme.css'
        : 'assets/themes/lara-light-indigo/theme.css';
    let link = document.getElementById('primeng-theme-link') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = 'primeng-theme-link';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    if (link.getAttribute('href') !== href) {
      link.href = href;
    }
  }

  private loadPreferences(): AppearancePreferences {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, unknown>;
        let migrated = false;
        if (typeof parsed.skinId === 'string') {
          const sid = parsed.skinId.toLowerCase();
          const isDark =
            sid.includes('dark') ||
            sid === 'viva-dark' ||
            sid.endsWith('-dark');
          parsed.theme = isDark ? 'dark' : 'light';
          delete parsed.skinId;
          migrated = true;
        }
        const preferences = {
          ...this.defaultPreferences,
          ...parsed
        } as AppearancePreferences;

        if (migrated) {
          this.savePreferences(preferences);
        }

        return preferences;
      }
    } catch (error) {
      console.error('Failed to load appearance preferences:', error);
    }
    return { ...this.defaultPreferences };
  }

  private savePreferences(preferences: AppearancePreferences): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save appearance preferences:', error);
    }
  }

  private applyPreferences(preferences: AppearancePreferences): void {
    this.clearLegacySkinDom();
    this.applyTheme(preferences.theme);
    this.applyDensity(preferences.density);
    this.applyFontSize(preferences.fontSize);
    this.applyAnimations(preferences.animationsEnabled);
    document.documentElement.lang = preferences.language;
  }

  private applyTheme(theme: ThemeMode): void {
    const body = document.body;
    const html = document.documentElement;

    body.classList.remove('dark-theme', 'light-theme');
    html.removeAttribute('data-theme');

    let resolved: 'light' | 'dark' = theme === 'dark' ? 'dark' : 'light';

    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      resolved = prefersDark ? 'dark' : 'light';

      if (!this.systemThemeListener) {
        this.systemThemeListener = window.matchMedia('(prefers-color-scheme: dark)');
        this.systemThemeListener.addEventListener('change', this.onSystemThemeChange);
      }
    } else if (this.systemThemeListener) {
      this.systemThemeListener.removeEventListener('change', this.onSystemThemeChange);
      this.systemThemeListener = null;
    }

    html.setAttribute('data-theme', resolved);
    body.classList.add(resolved === 'dark' ? 'dark-theme' : 'light-theme');
    this.applyPrimeNgTheme(resolved);

    void html.offsetHeight;
  }

  private systemThemeListener: MediaQueryList | null = null;
  private readonly onSystemThemeChange = (e: MediaQueryListEvent): void => {
    const prefs = this.preferencesSubject.value;
    if (prefs.theme !== 'auto') {
      return;
    }
    const newTheme = e.matches ? 'dark' : 'light';
    const html = document.documentElement;
    const body = document.body;
    html.setAttribute('data-theme', newTheme);
    body.classList.remove('dark-theme', 'light-theme');
    body.classList.add(newTheme === 'dark' ? 'dark-theme' : 'light-theme');
    this.applyPrimeNgTheme(newTheme);
  };

  private applyDensity(density: InterfaceDensity): void {
    const html = document.documentElement;
    html.removeAttribute('data-density');
    html.setAttribute('data-density', density);
  }

  private applyFontSize(fontSize: FontSize): void {
    const html = document.documentElement;
    html.removeAttribute('data-font-size');
    html.setAttribute('data-font-size', fontSize);
  }

  private applyAnimations(enabled: boolean): void {
    const html = document.documentElement;
    if (enabled) {
      html.removeAttribute('data-reduce-motion');
    } else {
      html.setAttribute('data-reduce-motion', 'true');
    }
  }

  getPreferences(): AppearancePreferences {
    return { ...this.preferencesSubject.value };
  }

  setTheme(theme: ThemeMode): void {
    const current = this.preferencesSubject.value;
    const updated = { ...current, theme };
    this.preferencesSubject.next(updated);
    this.savePreferences(updated);
    this.clearLegacySkinDom();
    this.applyTheme(theme);
  }

  setLanguage(language: string): void {
    const current = this.preferencesSubject.value;
    const updated = { ...current, language };
    this.preferencesSubject.next(updated);
    this.savePreferences(updated);
    document.documentElement.lang = language;
    this.syncIdiomaToServer(language);
    queueMicrotask(() => this.appRef.tick());
  }

  private syncIdiomaToServer(language: string): void {
    if (typeof localStorage === 'undefined' || !localStorage.getItem(this.TOKEN_KEY)) {
      return;
    }
    const apiUrl = typeof environment.getApiUrl === 'function' ? environment.getApiUrl() : environment.apiUrl;
    this.http
      .put(`${apiUrl}/usuario-preferences/idioma`, { idioma: language })
      .subscribe({ error: () => undefined });
  }

  setDensity(density: InterfaceDensity): void {
    const current = this.preferencesSubject.value;
    const updated = { ...current, density };
    this.preferencesSubject.next(updated);
    this.savePreferences(updated);
    this.applyDensity(density);
  }

  setFontSize(fontSize: FontSize): void {
    const current = this.preferencesSubject.value;
    const updated = { ...current, fontSize };
    this.preferencesSubject.next(updated);
    this.savePreferences(updated);
    this.applyFontSize(fontSize);
  }

  setAnimationsEnabled(enabled: boolean): void {
    const current = this.preferencesSubject.value;
    const updated = { ...current, animationsEnabled: enabled };
    this.preferencesSubject.next(updated);
    this.savePreferences(updated);
    this.applyAnimations(enabled);
  }

  updatePreferences(preferences: Partial<AppearancePreferences>): void {
    const current = this.preferencesSubject.value;
    const updated = { ...current, ...preferences };
    this.preferencesSubject.next(updated);
    this.savePreferences(updated);
    this.applyPreferences(updated);
  }

  resetToDefaults(): void {
    this.preferencesSubject.next({ ...this.defaultPreferences });
    this.savePreferences(this.defaultPreferences);
    this.applyPreferences(this.defaultPreferences);
  }
}
