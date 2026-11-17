import { Component, HostListener, Input, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';

/**
 * Botão de tela cheia para heroes / cabeçalhos de página.
 * Uso: <app-fullscreen-toggle [tone]="'dark' | 'light'"></app-fullscreen-toggle>
 */
@Component({
  selector: 'app-fullscreen-toggle',
  standalone: true,
  imports: [CommonModule, TooltipModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <button
      type="button"
      class="fs-toggle"
      [class.fs-toggle--dark]="tone !== 'light'"
      [class.fs-toggle--light]="tone === 'light'"
      [class.is-active]="ativo"
      data-fullscreen-toggle="1"
      (click)="alternar()"
      [attr.aria-label]="ativo ? 'Sair da tela cheia' : 'Tela cheia'"
      [attr.aria-pressed]="ativo"
      [pTooltip]="ativo ? 'Sair da tela cheia' : 'Tela cheia'"
      tooltipPosition="bottom">
      <i class="pi" [ngClass]="ativo ? 'pi-window-minimize' : 'pi-window-maximize'" aria-hidden="true"></i>
    </button>
  `,
  styles: [`
    .fs-toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      padding: 0;
      border-radius: 10px;
      border: 1px solid transparent;
      cursor: pointer;
      flex-shrink: 0;
      transition: background .15s ease, border-color .15s ease, color .15s ease, transform .15s ease;
    }
    .fs-toggle i { font-size: 15px; line-height: 1; margin: 0; }
    .fs-toggle:focus-visible {
      outline: 3px solid #38bdf8;
      outline-offset: 2px;
    }
    .fs-toggle--dark {
      color: #f8fafc;
      background: #ffffff14;
      border-color: #ffffff29;
    }
    .fs-toggle--dark:hover {
      background: #ffffff26;
    }
    .fs-toggle--light {
      color: #334155;
      background: #f1f5f9;
      border-color: #e2e8f0;
    }
    .fs-toggle--light:hover {
      background: #e2e8f0;
      color: #0f172a;
    }
    .fs-toggle.is-active {
      background: #0284c7;
      border-color: #38bdf8;
      color: #fff;
    }
    .hero-fullscreen-host {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-left: auto;
      flex-shrink: 0;
    }
    .hero-fullscreen-host--floating {
      position: absolute;
      top: 16px;
      right: 16px;
      z-index: 6;
      margin-left: 0;
    }
  `]
})
export class FullscreenToggleComponent implements OnDestroy {
  /** dark = heróis escuros (ferramentaria/fluxo/NRC); light = page-header claro */
  @Input() tone: 'dark' | 'light' = 'dark';

  ativo = !!document.fullscreenElement;

  @HostListener('document:fullscreenchange')
  onFullscreenChange() {
    this.ativo = !!document.fullscreenElement;
  }

  async alternar() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        this.ativo = true;
      } else {
        await document.exitFullscreen();
        this.ativo = false;
      }
    } catch {
      // Navegador bloqueou (política de gesto / iframe) — silencioso
    }
  }

  ngOnDestroy() {
    // estado global do documento; nada a limpar
  }
}
