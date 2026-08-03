import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../core/translate.pipe';

export type PageHeroVariant = 'sky' | 'navy' | 'gold' | 'slate';

@Component({
  selector: 'app-page-hero',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <header class="as-page-hero" [class]="'as-page-hero--' + variant" role="banner">
      <div class="as-page-hero__inner">
        <div class="as-page-hero__copy">
          @if (kickerKey || kicker) {
            <span class="as-page-hero__kicker">
              @if (icon) {
                <i class="pi" [ngClass]="icon" aria-hidden="true"></i>
              }
              @if (kickerKey) {
                {{ kickerKey | translate }}
              } @else {
                {{ kicker }}
              }
            </span>
          }
          <h1 class="as-page-hero__title">
            @if (titleIcon) {
              <i class="pi" [ngClass]="titleIcon" aria-hidden="true"></i>
            }
            @if (titleKey) {
              {{ titleKey | translate }}
            } @else {
              {{ title }}
            }
          </h1>
          @if (subtitleKey || subtitle) {
            <p class="as-page-hero__subtitle">
              @if (subtitleKey) {
                {{ subtitleKey | translate }}
              } @else {
                {{ subtitle }}
              }
            </p>
          }
        </div>
        @if (hasActions) {
          <div class="as-page-hero__actions">
            <ng-content select="[actions]"></ng-content>
          </div>
        }
      </div>
    </header>
  `,
  styleUrls: ['./page-hero.component.scss']
})
export class PageHeroComponent {
  @Input() variant: PageHeroVariant = 'sky';
  @Input() kicker?: string;
  @Input() kickerKey?: string;
  @Input() title = '';
  @Input() titleKey?: string;
  @Input() subtitle?: string;
  @Input() subtitleKey?: string;
  @Input() icon?: string;
  @Input() titleIcon?: string;
  @Input() hasActions = false;
}
