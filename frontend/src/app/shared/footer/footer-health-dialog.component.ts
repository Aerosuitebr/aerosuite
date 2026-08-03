import { Component, EventEmitter, Input, Output, OnChanges, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { TranslatePipe } from '../../core/translate.pipe';
import { TranslationService } from '../../core/translation.service';
import {
  AppHealthService,
  AppHealthSnapshot,
  HealthServiceRow,
  HealthSummary,
} from '../../core/app-health.service';
import { BrandingService } from '../../core/branding.service';
import { LocaleCurrencyService } from '../../core/locale/locale-currency.service';

@Component({
  selector: 'app-footer-health-dialog',
  standalone: true,
  imports: [CommonModule, DialogModule, TranslatePipe],
  template: `
    <p-dialog
      [visible]="visible"
      (visibleChange)="onVisibleChange($event)"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [closable]="!autoClose"
      [showHeader]="false"
      styleClass="footer-health-dialog"
      [style]="{ width: 'min(560px, 96vw)' }"
      (onHide)="visibleChange.emit(false)">
      <div class="footer-health-dialog__shell">
        <header class="footer-health-dialog__hero">
          <div class="footer-health-dialog__hero-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </div>
          <div class="footer-health-dialog__hero-text">
            <h2 class="footer-health-dialog__title">{{ titleKey | translate }}</h2>
            <p class="footer-health-dialog__subtitle">{{ subtitleLabel }}</p>
          </div>
          <button
            *ngIf="!autoClose"
            type="button"
            class="footer-health-dialog__hero-close"
            [attr.aria-label]="'footer.health.close' | translate"
            (click)="close()">
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div class="footer-health-dialog__stats" role="group" [attr.aria-label]="'footer.health.statsAria' | translate">
          <div class="footer-health-dialog__stat footer-health-dialog__stat--ok">
            <span class="footer-health-dialog__stat-value">{{ summary.operational }}</span>
            <span class="footer-health-dialog__stat-label">{{ 'footer.health.stat.operational' | translate }}</span>
          </div>
          <div class="footer-health-dialog__stat footer-health-dialog__stat--bad">
            <span class="footer-health-dialog__stat-value">{{ summary.problematic }}</span>
            <span class="footer-health-dialog__stat-label">{{ 'footer.health.stat.problematic' | translate }}</span>
          </div>
          <div class="footer-health-dialog__stat">
            <span class="footer-health-dialog__stat-value">{{ summary.total }}</span>
            <span class="footer-health-dialog__stat-label">{{ 'footer.health.stat.total' | translate }}</span>
          </div>
        </div>

        <div class="footer-health-dialog__table-wrap">
          <table class="footer-health-dialog__table">
            <thead>
              <tr>
                <th scope="col">{{ 'footer.health.table.service' | translate }}</th>
                <th scope="col">{{ 'footer.health.table.category' | translate }}</th>
                <th scope="col">{{ 'footer.health.table.status' | translate }}</th>
                <th scope="col">{{ 'footer.health.table.impact' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of displayRows" class="footer-health-dialog__row">
                <td class="footer-health-dialog__cell-service">
                  <span class="footer-health-dialog__service-dot" [class.footer-health-dialog__service-dot--down]="row.status === 'DOWN'"></span>
                  {{ row.labelKey | translate }}
                </td>
                <td class="footer-health-dialog__cell-muted">{{ row.categoryKey | translate }}</td>
                <td>
                  <span
                    class="footer-health-dialog__badge"
                    [class.footer-health-dialog__badge--up]="row.status === 'UP'"
                    [class.footer-health-dialog__badge--down]="row.status === 'DOWN'"
                    [class.footer-health-dialog__badge--unknown]="row.status === 'UNKNOWN'">
                    {{ statusLabel(row) | translate }}
                  </span>
                </td>
                <td class="footer-health-dialog__cell-impact">{{ row.impactKey | translate }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p class="footer-health-dialog__meta" *ngIf="lastCheckLabel">{{ lastCheckLabel }}</p>

        <footer class="footer-health-dialog__foot">
          <p class="footer-health-dialog__support">
            <span>{{ 'footer.health.contactSupport' | translate }}</span>
            <a *ngIf="supportEmail" class="footer-health-dialog__support-link" [href]="'mailto:' + supportEmail">
              {{ supportEmail }}
            </a>
          </p>
          <p *ngIf="autoClose && autoCloseSecondsLeft > 0" class="footer-health-dialog__autoclose">
            {{ autoCloseHintLabel }}
          </p>
          <button *ngIf="!autoClose" type="button" class="footer-health-dialog__close" (click)="close()">
            {{ 'footer.health.close' | translate }}
          </button>
        </footer>

        <div *ngIf="autoClose" class="footer-health-dialog__progress" aria-hidden="true">
          <div class="footer-health-dialog__progress-bar" [style.width.%]="autoCloseProgress"></div>
        </div>
      </div>
    </p-dialog>
  `,
  styleUrls: ['./footer-health-dialog.component.scss'],
})
export class FooterHealthDialogComponent implements OnChanges, OnDestroy {
  @Input() visible = false;
  @Input() snapshot!: AppHealthSnapshot;
  @Input() autoClose = false;
  @Input() autoCloseMs = 3000;
  @Input() showAllServices = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  summary: HealthSummary = {
    total: 0,
    operational: 0,
    problematic: 0,
    unverified: 0,
    rows: [],
    problematicRows: [],
  };

  autoCloseSecondsLeft = 0;
  autoCloseProgress = 100;

  private branding = inject(BrandingService);
  private localeCurrency = inject(LocaleCurrencyService);
  private i18n = inject(TranslationService);
  private healthService = inject(AppHealthService);
  private autoCloseTimer?: ReturnType<typeof setInterval>;
  private autoCloseEndTimer?: ReturnType<typeof setTimeout>;
  private autoCloseStartedAt = 0;

  get supportEmail(): string {
    return (this.branding.config().supportEmail || '').trim();
  }

  get titleKey(): string {
    return this.summary.problematic > 0
      ? 'footer.health.dialogBriefTitle'
      : 'footer.health.dialogTitle';
  }

  get subtitleLabel(): string {
    if (this.summary.problematic > 0) {
      return this.i18n.translate('footer.health.dialogBriefSubtitle', {
        count: String(this.summary.problematic),
      });
    }
    return this.i18n.translate('footer.health.dialogAllOperational');
  }

  get displayRows(): HealthServiceRow[] {
    if (this.showAllServices) {
      return this.summary.rows;
    }
    return this.summary.problematicRows;
  }

  get lastCheckLabel(): string {
    const at = this.snapshot?.checkedAt;
    if (!at) {
      return '';
    }
    const time = at.toLocaleString(this.localeCurrency.getIntlLocale(), {
      dateStyle: 'short',
      timeStyle: 'short',
    });
    return this.i18n.translate('footer.health.lastCheck', { time });
  }

  get autoCloseHintLabel(): string {
    return this.i18n.translate('footer.health.autoCloseHint', {
      seconds: String(this.autoCloseSecondsLeft),
    });
  }

  ngOnChanges(): void {
    this.summary = this.healthService.buildSummary(this.snapshot);
    if (this.visible && this.autoClose) {
      this.startAutoClose();
    } else {
      this.clearAutoClose();
    }
  }

  ngOnDestroy(): void {
    this.clearAutoClose();
  }

  statusLabel(row: HealthServiceRow): string {
    return this.healthService.statusLabelKey(row, this.snapshot);
  }

  onVisibleChange(visible: boolean): void {
    if (!visible) {
      this.clearAutoClose();
    }
    this.visibleChange.emit(visible);
  }

  close(): void {
    this.clearAutoClose();
    this.visibleChange.emit(false);
  }

  private startAutoClose(): void {
    this.clearAutoClose();
    this.autoCloseStartedAt = Date.now();
    this.autoCloseSecondsLeft = Math.ceil(this.autoCloseMs / 1000);
    this.autoCloseProgress = 100;

    this.autoCloseTimer = setInterval(() => {
      const elapsed = Date.now() - this.autoCloseStartedAt;
      const remaining = Math.max(0, this.autoCloseMs - elapsed);
      this.autoCloseSecondsLeft = Math.ceil(remaining / 1000);
      this.autoCloseProgress = Math.max(0, (remaining / this.autoCloseMs) * 100);
    }, 50);

    this.autoCloseEndTimer = setTimeout(() => {
      this.close();
    }, this.autoCloseMs);
  }

  private clearAutoClose(): void {
    if (this.autoCloseTimer) {
      clearInterval(this.autoCloseTimer);
      this.autoCloseTimer = undefined;
    }
    if (this.autoCloseEndTimer) {
      clearTimeout(this.autoCloseEndTimer);
      this.autoCloseEndTimer = undefined;
    }
  }
}
