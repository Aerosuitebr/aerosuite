import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { TranslatePipe } from '../../core/translate.pipe';

export type HeroDialogVariant = 'navy' | 'sky' | 'gold' | 'slate';

@Component({
  selector: 'app-hero-dialog',
  standalone: true,
  imports: [CommonModule, DialogModule, TranslatePipe],
  template: `
    <p-dialog
      [(visible)]="visible"
      [modal]="modal"
      [closable]="closable"
      [dismissableMask]="dismissableMask"
      [draggable]="false"
      [resizable]="false"
      [style]="resolvedStyle"
      [contentStyle]="contentStyle"
      styleClass="as-hero-dialog"
      (onHide)="onHide()">
      <ng-template pTemplate="header">
        <div class="as-dialog-hero" [ngClass]="heroClass">
          <span *ngIf="kickerKey" class="as-dialog-hero__kicker">{{ kickerKey | translate }}</span>
          <h2 class="as-dialog-hero__title">
            <i *ngIf="icon" [class]="'pi ' + icon" aria-hidden="true"></i>
            <ng-container *ngIf="titleKey; else titleSlot">{{ titleKey | translate }}</ng-container>
            <ng-template #titleSlot><ng-content select="[dialogTitle]"></ng-content></ng-template>
          </h2>
          <p *ngIf="subtitleKey" class="as-dialog-hero__subtitle">{{ subtitleKey | translate }}</p>
        </div>
      </ng-template>

      <div class="as-dialog-body">
        <ng-content></ng-content>
      </div>

      <ng-template pTemplate="footer">
        <div class="as-dialog-footer" *ngIf="showFooter">
          <ng-content select="[dialogFooter]"></ng-content>
        </div>
      </ng-template>
    </p-dialog>
  `
})
export class HeroDialogComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() modal = true;
  @Input() closable = true;
  @Input() dismissableMask = false;
  @Input() showFooter = true;
  @Input() compact = false;
  @Input() variant: HeroDialogVariant = 'navy';
  @Input() icon = '';
  @Input() titleKey = '';
  @Input() subtitleKey = '';
  @Input() kickerKey = '';
  @Input() width = 'min(640px, 96vw)';
  @Input() maxWidth = '';
  @Input() contentStyle: Record<string, string> | null = null;

  get heroClass(): Record<string, boolean> {
    return {
      'as-dialog-hero--compact': this.compact,
      [`as-dialog-hero--${this.variant}`]: this.variant !== 'navy'
    };
  }

  get resolvedStyle(): Record<string, string> {
    const style: Record<string, string> = { width: this.width };
    if (this.maxWidth) {
      style['maxWidth'] = this.maxWidth;
    }
    return style;
  }

  onHide(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
