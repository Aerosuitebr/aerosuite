import { AfterViewInit, ApplicationRef, ComponentRef, Directive, ElementRef, EnvironmentInjector, NgZone, OnDestroy, Renderer2, createComponent, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { TranslationService } from '../../core/translation.service';
import { MENU_ROUTE_ENTRIES } from '../../core/menu-route-entries';
import { PLATFORM_OPS_NAV } from '../../platform-ops/platform-ops-nav.config';
import { PageHeroComponent } from '../page-hero/page-hero.component';

/** Aplica o contrato de página em todos os layouts, sem duplicar os banners existentes. */
@Directive({ selector: 'router-outlet[systemPageLayout]', standalone: true })
export class SystemPageLayoutDirective implements AfterViewInit, OnDestroy {
  private outlet = inject(RouterOutlet);
  private element = inject(ElementRef<HTMLElement>);
  private renderer = inject(Renderer2);
  private environment = inject(EnvironmentInjector);
  private app = inject(ApplicationRef);
  private zone = inject(NgZone);
  private auth = inject(AuthService);
  private i18n = inject(TranslationService);
  private router = inject(Router);
  private subscriptions = new Subscription();
  private observer?: MutationObserver;
  private banner?: ComponentRef<PageHeroComponent>;
  private host?: HTMLElement;
  private timer?: ReturnType<typeof setTimeout>;
  private hiddenTitle?: HTMLElement;

  ngAfterViewInit(): void {
    this.subscriptions.add(this.outlet.activateEvents.subscribe(() => this.schedule()));
    this.subscriptions.add(this.outlet.deactivateEvents.subscribe(() => this.reset()));
    this.subscriptions.add(this.i18n.getCurrentLanguage$().subscribe(() => this.schedule()));
    this.schedule();
  }

  private schedule(): void {
    clearTimeout(this.timer);
    this.zone.runOutsideAngular(() => {
      this.timer = setTimeout(() => this.refresh(), 0);
    });
  }

  private refresh(): void {
    const host = this.element.nativeElement.nextElementSibling as HTMLElement | null;
    if (!this.outlet.isActivated || !host || host.tagName === 'ROUTER-OUTLET') return;
    // Os layouts têm seus próprios outlets; apenas suas páginas recebem o tratamento.
    if (['APP-LAYOUT', 'APP-ESTOQUE-LAYOUT', 'APP-SUPORTE-LAYOUT', 'APP-EXTERNO-LAYOUT', 'APP-PLATFORM-OPS-SHELL'].includes(host.tagName)) return;
    if (host !== this.host) {
      this.reset();
      this.host = host;
      this.renderer.addClass(host, 'system-page-route');
      this.observer = new MutationObserver(() => this.schedule());
      this.observer.observe(host, { childList: true, subtree: true, characterData: true });
    }
    const surface = Array.from(host.children).find(el => ['DIV','MAIN','SECTION','FORM'].includes(el.tagName));
    if (surface) this.renderer.addClass(surface, 'system-page-surface');
    const excluded = (el: Element) => !!el.closest('.system-generated-banner, .p-dialog, [role="dialog"], .p-overlaypanel');
    const shared = Array.from(host.querySelectorAll('app-page-hero')).find(el => !excluded(el));
    const native = Array.from(host.querySelectorAll('header, .page-header, .fx-hero, .st-top, .hero, .chat-header'))
      .find(el => !excluded(el) && !!el.querySelector('h1, h2'));
    if (shared || native) {
      this.removeBanner();
      const header = shared?.querySelector('header') || native;
      if (header) this.renderer.addClass(header, 'system-page-banner');
      return;
    }
    const heading = Array.from(host.querySelectorAll<HTMLElement>('h1')).find(el => !excluded(el));
    const title = heading?.textContent?.trim() || this.routeTitle(host);
    if (!this.banner) {
      const node = this.renderer.createElement('app-page-hero');
      this.renderer.addClass(node, 'system-generated-banner');
      this.renderer.insertBefore(host, node, host.firstChild);
      this.banner = createComponent(PageHeroComponent, { hostElement: node, environmentInjector: this.environment });
      this.app.attachView(this.banner.hostView);
      this.banner.setInput('variant', 'navy');
    }
    if (this.banner.instance.title !== title) this.banner.setInput('title', title);
    this.banner.changeDetectorRef.detectChanges();
    if (heading) {
      this.hiddenTitle = heading;
      this.renderer.addClass(heading, 'system-page-original-title');
    }
  }

  private routeTitle(host: HTMLElement): string {
    const path = this.router.url.split('?')[0].split('#')[0];
    const platform = PLATFORM_OPS_NAV.find(item => item.route === path);
    if (platform) return this.i18n.translate(platform.labelKey);
    const menu = this.auth.getCurrentUser()?.menuFuncionalidades || [];
    const entry = [...menu].filter(item => !!item.rota && (item.rota === path || (item.rota !== '/' && path.startsWith(item.rota + '/'))))
      .sort((a,b) => b.rota!.length - a.rota!.length)[0];
    if (entry) return this.i18n.translateMenuFunc(entry.codigo, entry.nome);
    const extra = MENU_ROUTE_ENTRIES.find(item => item.route === path);
    if (extra) return this.i18n.translateMenuFunc(extra.code, extra.name);
    return host.querySelector('h2')?.textContent?.trim() || 'Aero Suite';
  }

  private removeBanner(): void {
    if (this.banner) {
      const node = this.banner.location.nativeElement;
      this.app.detachView(this.banner.hostView);
      this.banner.destroy();
      node.remove();
      this.banner = undefined;
    }
    if (this.hiddenTitle) this.renderer.removeClass(this.hiddenTitle, 'system-page-original-title');
    this.hiddenTitle = undefined;
  }

  private reset(): void {
    this.observer?.disconnect();
    this.observer = undefined;
    this.removeBanner();
    this.host = undefined;
  }

  ngOnDestroy(): void {
    clearTimeout(this.timer);
    this.subscriptions.unsubscribe();
    this.reset();
  }
}
