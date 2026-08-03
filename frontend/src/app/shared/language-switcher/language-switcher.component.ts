import { Component, Input, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { TooltipModule } from 'primeng/tooltip';
import { AppearancePreferencesService } from '../../core/appearance-preferences.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { TranslationService } from '../../core/translation.service';
import {
  SUPPORTED_UI_LANGUAGES,
  SupportedUiLocale,
  UiLanguageOption
} from '../../core/supported-ui-languages';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule, TooltipModule, TranslatePipe],
  template: `
    <div
      class="lang-switcher"
      [class.lang-switcher--compact]="variant === 'compact'"
      [class.lang-switcher--panel]="variant === 'panel'"
      role="group"
      [attr.aria-label]="'language.switcher.aria' | translate">
      <button
        *ngFor="let opt of supportedLanguages"
        type="button"
        class="lang-flag"
        [class.lang-flag--active]="currentLocale === opt.locale"
        [attr.aria-pressed]="currentLocale === opt.locale"
        [attr.aria-label]="opt.nameKey | translate"
        [pTooltip]="opt.nameKey | translate"
        tooltipPosition="top"
        appendTo="body"
        [fitContent]="true"
        (click)="select(opt)">
        <span class="lang-flag__inner" aria-hidden="true">
          <img
            class="lang-flag__img"
            [src]="opt.flagSrc"
            width="24"
            height="18"
            alt=""
            aria-hidden="true"
            decoding="async" />
          <span class="lang-flag__code">{{ opt.code }}</span>
          <span class="lang-flag__check" *ngIf="currentLocale === opt.locale" title="" aria-hidden="true">
            <i class="pi pi-check"></i>
          </span>
        </span>
      </button>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `],
  styleUrls: ['./language-switcher.component.scss']
})
export class LanguageSwitcherComponent implements OnInit, OnDestroy {
  @Input() variant: 'compact' | 'panel' = 'compact';

  private readonly appearance = inject(AppearancePreferencesService);
  private readonly translation = inject(TranslationService);
  private readonly cdr = inject(ChangeDetectorRef);

  private langSub?: Subscription;

  readonly supportedLanguages: readonly UiLanguageOption[] = SUPPORTED_UI_LANGUAGES;

  /** Idioma efetivo na UI — atualizado por subscription para refletir mudanças sem depender só do pai. */
  currentLocale: SupportedUiLocale = 'pt-BR';

  ngOnInit(): void {
    this.syncLocale();
    this.langSub = this.translation.getCurrentLanguage$().subscribe(() => {
      this.syncLocale();
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }

  private syncLocale(): void {
    const lang = this.translation.getCurrentLanguage();
    this.currentLocale = (
      this.supportedLanguages.some((l) => l.locale === lang) ? lang : 'pt-BR'
    ) as SupportedUiLocale;
  }

  select(opt: UiLanguageOption): void {
    if (opt.locale === this.currentLocale) {
      return;
    }
    this.appearance.setLanguage(opt.locale);
  }
}
