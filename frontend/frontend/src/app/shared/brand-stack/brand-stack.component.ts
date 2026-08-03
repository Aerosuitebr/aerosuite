import { Component, Input, inject } from '@angular/core';

import { CommonModule } from '@angular/common';

import { BrandingService } from '../../core/branding.service';

import { bustStaticAssetUrl } from '../../../environments/asset-cache-bust';



/** Logo (icone) + wordmark empilhados — padrao unico de marca no produto. */

export type BrandStackSurface = 'light' | 'dark';

export type BrandStackSize =
  | 'hero'
  | 'home'
  | 'home-hero'
  | 'sidebar'
  | 'sidebar-mark'
  | 'footer'
  | 'footer-inline'
  | 'collapsed'
  | 'chat'
  | 'auth';



const PRODUCT_LOGO_COLOR = 'assets/Aero_Colorido.png';

const PRODUCT_LOGO_CHROME = 'assets/Aero_Claro.png';

const PRODUCT_WORDMARK = 'assets/LOGO_LETRA.png';

const PRODUCT_WORDMARK_LIGHT = 'assets/LOGO_LETRA_LIGHT.png';



@Component({

  selector: 'app-brand-stack',

  standalone: true,

  imports: [CommonModule],

  template: `

    <div

      class="brand-stack"

      [class.brand-stack--light]="surface === 'light'"

      [class.brand-stack--dark]="surface === 'dark'"

      [class.brand-stack--hero]="size === 'hero'"

      [class.brand-stack--home]="size === 'home'"

      [class.brand-stack--home-hero]="size === 'home-hero'"

      [class.brand-stack--sidebar]="size === 'sidebar'"

      [class.brand-stack--sidebar-mark]="size === 'sidebar-mark'"

      [class.brand-stack--sidebar-mark-compact]="size === 'sidebar-mark' && compact"

      [class.brand-stack--footer]="size === 'footer'"

      [class.brand-stack--footer-inline]="size === 'footer-inline'"

      [class.brand-stack--collapsed]="size === 'collapsed'"

      [class.brand-stack--chat]="size === 'chat'"

      [class.brand-stack--auth]="size === 'auth'"

      [class.brand-stack--combined]="usesCombinedColorLogo"

      [class.brand-stack--chrome-icon]="usesChromeIconLogo"

    >

      <div class="brand-stack__logo-slot" *ngIf="showLogo">

        <img

          [src]="logoSrc"

          [attr.alt]="showWordmark && !hidesProductWordmark ? '' : alt"

          class="brand-stack__logo"

          decoding="async"

          [attr.loading]="size === 'sidebar' ? 'eager' : null"

        />

      </div>

      <ng-container *ngIf="showWordmark && size !== 'collapsed' && !hidesProductWordmark">

        <div *ngIf="useTextWordmark" class="brand-stack__wordmark-text" [attr.aria-label]="alt">

          <span class="brand-stack__wordmark-aero">{{ wordmarkLead }}</span>

          <span class="brand-stack__wordmark-sep" aria-hidden="true"></span>

          <span class="brand-stack__wordmark-suite" *ngIf="wordmarkTail">{{ wordmarkTail }}</span>

        </div>

        <img

          *ngIf="!useTextWordmark"

          [src]="wordmarkSrc"

          [attr.alt]="alt"

          class="brand-stack__wordmark"

          decoding="async"

        />

      </ng-container>

    </div>

  `,

  styleUrls: ['./brand-stack.component.scss'],

})

export class BrandStackComponent {

  @Input() surface: BrandStackSurface = 'light';

  @Input() size: BrandStackSize = 'hero';

  @Input() showLogo = true;

  @Input() showWordmark = true;

  /** Exibe wordmark mesmo em superfícies escuras com ícone chrome (ex.: rodapé do shell ops). */
  @Input() forceWordmark = false;

  @Input() compact = false;



  protected branding = inject(BrandingService);



  get alt(): string {

    return this.branding.config().commercialName;

  }



  /** Login: `Aero_Colorido.png` (emblema + wordmark num único PNG). */

  get usesCombinedColorLogo(): boolean {

    return (

      (this.size === 'auth')

      && this.isProductDefaultLogo(this.branding.config().logoUrl)

    );

  }



  /** Sidebar, rodapé, chat e dashboard: `Aero_Claro.png`, sem wordmark separado. */

  get usesChromeIconLogo(): boolean {

    if (!this.isProductDefaultLogo(this.branding.config().logoUrl)) {

      return false;

    }

    return (

      this.isDarkChrome

      || this.size === 'home'

      || this.size === 'home-hero'

      || (this.size === 'hero' && this.surface === 'dark')

    );

  }



  get hidesProductWordmark(): boolean {

    if (this.forceWordmark) {

      return false;

    }

    return this.usesCombinedColorLogo || this.usesChromeIconLogo;

  }



  /** Sidebar/rodapé/chat: fundo escuro da aplicação. */

  private get isDarkChrome(): boolean {

    return (

      this.surface === 'dark'

      && (

        this.size === 'sidebar'

        || this.size === 'sidebar-mark'

        || this.size === 'footer'

        || this.size === 'footer-inline'

        || this.size === 'chat'

        || this.size === 'collapsed'

      )

    );

  }



  /** Home/login: PNG oficial (Aero | Suite). Sidebar/rodapé: PNG light. */

  get useTextWordmark(): boolean {

    return false;

  }



  get wordmarkLead(): string {

    const name = this.branding.config().commercialName.trim();

    const space = name.indexOf(' ');

    return space > 0 ? name.slice(0, space) : name;

  }



  get wordmarkTail(): string {

    const name = this.branding.config().commercialName.trim();

    const space = name.indexOf(' ');

    return space > 0 ? name.slice(space + 1) : '';

  }



  get logoSrc(): string {

    const tenantLogo = this.branding.config().logoUrl;

    if (!this.isProductDefaultLogo(tenantLogo)) {

      return tenantLogo;

    }

    if (this.usesChromeIconLogo) {

      return bustStaticAssetUrl(PRODUCT_LOGO_CHROME);

    }

    if (this.usesCombinedColorLogo) {

      return bustStaticAssetUrl(PRODUCT_LOGO_COLOR);

    }

    return tenantLogo;

  }



  get wordmarkSrc(): string {

    const cfg = this.branding.config();

    if (this.isDarkChrome || this.surface === 'dark') {

      if (this.isProductDefaultWordmark(cfg.wordmarkLightUrl) || this.isProductDefaultWordmark(cfg.wordmarkUrl)) {

        return bustStaticAssetUrl(PRODUCT_WORDMARK_LIGHT);

      }

      return cfg.wordmarkLightUrl || cfg.wordmarkUrl;

    }

    if (this.isProductDefaultWordmark(cfg.wordmarkUrl)) {

      return bustStaticAssetUrl(PRODUCT_WORDMARK);

    }

    return cfg.wordmarkUrl;

  }



  private isProductDefaultLogo(url: string): boolean {

    if (!url?.trim()) {

      return true;

    }

    const u = url.toLowerCase();

    return (

      u.includes('logo_aero.png')

      || u.includes('aero_suite_logo.png')

      || u.includes('aerosuite.png')

      || u.includes('logo_side.png')

      || u.includes('aero_colorido.png')

      || u.includes('aero_claro.png')

      || u.includes('/api/public/empresa-asset/logo')

    );

  }



  private isProductDefaultWordmark(url: string): boolean {

    if (!url?.trim()) {

      return true;

    }

    const u = url.toLowerCase();

    return (

      u.includes('logo_letra.png')

      || u.includes('logo_letra_light')

      || u.includes('/api/public/empresa-asset/wordmark')

    );

  }

}


