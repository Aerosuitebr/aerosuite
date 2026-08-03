import { Injectable, signal, computed, effect } from '@angular/core';
import { fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

@Injectable({
  providedIn: 'root'
})
export class DeviceDetectionService {
  private readonly MOBILE_BREAKPOINT = 768;
  private readonly TABLET_BREAKPOINT = 1024;

  // Signal para armazenar o tamanho atual da tela
  private windowWidth = signal<number>(this.getWindowWidth());
  
  // Signal computado para o tipo de dispositivo
  deviceType = computed<DeviceType>(() => {
    const width = this.windowWidth();
    if (width < this.MOBILE_BREAKPOINT) {
      return 'mobile';
    } else if (width < this.TABLET_BREAKPOINT) {
      return 'tablet';
    }
    return 'desktop';
  });

  // Signals computados para verificações específicas
  isMobile = computed(() => this.deviceType() === 'mobile');
  isTablet = computed(() => this.deviceType() === 'tablet');
  isDesktop = computed(() => this.deviceType() === 'desktop');
  isMobileOrTablet = computed(() => this.isMobile() || this.isTablet());

  constructor() {
    // Se estiver em um ambiente de navegador
    if (typeof window !== 'undefined') {
      // Criar observable para mudanças no tamanho da janela
      fromEvent(window, 'resize')
        .pipe(debounceTime(150)) // Debounce para performance
        .subscribe(() => {
          this.windowWidth.set(this.getWindowWidth());
        });

      // Também escutar orientação em dispositivos móveis
      fromEvent(window, 'orientationchange')
        .pipe(debounceTime(200))
        .subscribe(() => {
          setTimeout(() => {
            this.windowWidth.set(this.getWindowWidth());
          }, 100);
        });
    }
  }

  private getWindowWidth(): number {
    if (typeof window === 'undefined') {
      return 1024; // Default para SSR
    }
    return window.innerWidth;
  }

  // Método auxiliar para obter classe CSS baseada no dispositivo
  getDeviceClass(): string {
    const device = this.deviceType();
    return `device-${device}`;
  }

  // Método para verificar se é touch device
  isTouchDevice(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    return 'ontouchstart' in window || 
           navigator.maxTouchPoints > 0 || 
           (navigator as any).msMaxTouchPoints > 0;
  }

  // Método para obter breakpoint atual
  getCurrentBreakpoint(): string {
    const width = this.windowWidth();
    if (width < this.MOBILE_BREAKPOINT) return 'mobile';
    if (width < this.TABLET_BREAKPOINT) return 'tablet';
    return 'desktop';
  }

  // Método para verificar se está em uma orientação específica
  isLandscape(): boolean {
    if (typeof window === 'undefined') {
      return true;
    }
    return window.innerWidth > window.innerHeight;
  }

  isPortrait(): boolean {
    return !this.isLandscape();
  }
}

