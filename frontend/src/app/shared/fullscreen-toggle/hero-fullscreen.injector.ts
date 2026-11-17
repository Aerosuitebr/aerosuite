import {
  ApplicationRef,
  ComponentRef,
  EnvironmentInjector,
  Injectable,
  createComponent,
  inject
} from '@angular/core';
import { FullscreenToggleComponent } from './fullscreen-toggle.component';

const HERO_SELECTOR = [
  '.page-header.fx-hero',
  'header.page-header.fx-hero',
  '.page-header',
  'header.fx-hero',
  '.fx-hero',
  'header.hero',
  '.list-hero',
  '.dash-hero',
  '.form-hero',
  '.detail-hero',
  '.cco-hero',
  'header.aj-hero',
  '.aj-hero',
  '.pn-hero',
  '.created-hero',
  '.audit-timeline__hero',
  '.sheet-hero'
].join(', ');

const ACTIONS_SELECTOR = [
  '.header-actions',
  '.fx-hero-actions',
  '.hero-actions',
  '.hero-controls',
  '.list-hero__actions',
  '.dash-hero__actions',
  '.detail-hero__actions',
  '.pn-hero-right',
  '.sheet-hero-top'
].join(', ');

const DARK_HINT = /(fx-hero|\bhero\b|list-hero|dash-hero|form-hero|detail-hero|cco-hero|aj-hero|pn-hero|created-hero|audit-timeline__hero|sheet-hero)/i;

/**
 * Injeta o botão de tela cheia em todos os heroes/cabeçalhos da tela atual.
 */
@Injectable({ providedIn: 'root' })
export class HeroFullscreenInjector {
  private readonly appRef = inject(ApplicationRef);
  private readonly env = inject(EnvironmentInjector);
  private refs: ComponentRef<FullscreenToggleComponent>[] = [];
  private scheduled: ReturnType<typeof setTimeout> | null = null;
  private observer: MutationObserver | null = null;

  /** Agenda injeção após navegação / renderização assíncrona. */
  schedule(root: ParentNode = document.body, delays: number[] = [50, 250, 800]) {
    if (this.scheduled) {
      clearTimeout(this.scheduled);
      this.scheduled = null;
    }
    delays.forEach((ms, i) => {
      setTimeout(() => this.refresh(root), ms);
      if (i === delays.length - 1) {
        this.watchBriefly(root);
      }
    });
  }

  refresh(root: ParentNode = document.body) {
    this.pruneDetached();
    const heroes = Array.from(root.querySelectorAll(HERO_SELECTOR)) as HTMLElement[];
    // Evita duplicar em ancestrais/descendentes (ex.: .fx-hero dentro de .page-header)
    const filtered = heroes.filter(h => !heroes.some(o => o !== h && o.contains(h)));
    for (const hero of filtered) {
      this.ensureOnHero(hero);
    }
  }

  private pruneDetached() {
    this.refs = this.refs.filter(ref => {
      const el = ref.location.nativeElement as HTMLElement;
      if (el.isConnected) {
        return true;
      }
      try {
        this.appRef.detachView(ref.hostView);
        ref.destroy();
      } catch { /* ignore */ }
      return false;
    });
  }

  destroyAll() {
    for (const ref of this.refs) {
      try {
        this.appRef.detachView(ref.hostView);
        ref.destroy();
      } catch { /* ignore */ }
    }
    this.refs = [];
    document.querySelectorAll('.hero-fullscreen-host[data-fs-injected="1"]').forEach(el => el.remove());
  }

  private ensureOnHero(hero: HTMLElement) {
    if (hero.querySelector('[data-fullscreen-toggle]')) {
      return;
    }
    // Já existe controle local de tela cheia (ex.: estação de fluxo / ferramentaria legado)
    const localFs = Array.from(hero.querySelectorAll('button, a')).some(el => {
      const label = `${el.getAttribute('aria-label') || ''} ${el.getAttribute('title') || ''}`.toLowerCase();
      return label.includes('tela cheia') || label.includes('fullscreen');
    });
    if (localFs) {
      return;
    }

    let host = hero.querySelector(ACTIONS_SELECTOR) as HTMLElement | null;
    if (!host) {
      host = document.createElement('div');
      host.className = 'hero-fullscreen-host hero-fullscreen-host--floating';
      host.setAttribute('data-fs-injected', '1');
      if (getComputedStyle(hero).position === 'static') {
        hero.style.position = 'relative';
      }
      hero.appendChild(host);
    } else if (host.querySelector('[data-fullscreen-toggle]')) {
      return;
    } else {
      host.style.display = host.style.display || 'flex';
      host.style.alignItems = host.style.alignItems || 'center';
      host.style.gap = host.style.gap || '8px';
    }

    const tone: 'dark' | 'light' = this.resolveTone(hero);
    const ref = createComponent(FullscreenToggleComponent, {
      environmentInjector: this.env
    });
    ref.instance.tone = tone;
    host.appendChild(ref.location.nativeElement);
    this.appRef.attachView(ref.hostView);
    ref.changeDetectorRef.detectChanges();
    this.refs.push(ref);
  }

  private resolveTone(hero: HTMLElement): 'dark' | 'light' {
    const cls = hero.className || '';
    if (DARK_HINT.test(cls)) {
      return 'dark';
    }
    // page-header padrão (OS, listagens) é claro
    if (/\bpage-header\b/.test(cls) && !/\bfx-hero\b/.test(cls)) {
      return 'light';
    }
    return 'dark';
  }

  private watchBriefly(root: ParentNode) {
    this.observer?.disconnect();
    this.observer = new MutationObserver(() => {
      this.refresh(root);
    });
    const el = root instanceof Document ? root.body : (root as HTMLElement);
    if (!el) return;
    this.observer.observe(el, { childList: true, subtree: true });
    setTimeout(() => {
      this.observer?.disconnect();
      this.observer = null;
    }, 2500);
  }
}
