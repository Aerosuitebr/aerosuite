import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslationService } from './translation.service';
import { PAGE_HELP_DEFINITIONS } from './page-help-definitions';
import type { HelpContentDef } from './page-help-definitions';

export interface HelpContent {
  title: string;
  sections: HelpSection[];
}

export interface HelpSection {
  title: string;
  content: string[];
  icon?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PageHelpService {
  private readonly router = inject(Router);
  private readonly i18n = inject(TranslationService);
  private readonly helpByRoute = new Map<string, HelpContentDef>(
    PAGE_HELP_DEFINITIONS.map(d => [d.route, d])
  );

  getHelpContent(route: string): HelpContent | null {
    const def = this.resolveDefinition(route);
    return def ? this.resolveContent(def) : null;
  }

  getCurrentRouteHelp(): HelpContent | null {
    try {
      const currentRoute = this.router.url.split('?')[0];
      return this.getHelpContent(currentRoute);
    } catch (error) {
      console.warn('Failed to get help for current route:', error);
      return null;
    }
  }

  private resolveDefinition(route: string): HelpContentDef | null {
    if (this.helpByRoute.has(route)) {
      return this.helpByRoute.get(route)!;
    }
    for (const [key, value] of this.helpByRoute.entries()) {
      if (route.startsWith(key)) {
        return value;
      }
    }
    return null;
  }

  private resolveContent(def: HelpContentDef): HelpContent {
    return {
      title: this.i18n.translate(def.titleKey),
      sections: def.sections.map(section => ({
        icon: section.icon,
        title: this.i18n.translate(section.titleKey),
        content: section.contentKeys.map(key => this.i18n.translate(key))
      }))
    };
  }
}
