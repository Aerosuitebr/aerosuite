import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';

import { CommonModule } from '@angular/common';

import { Subscription } from 'rxjs';

import { BrandingService } from '../../core/branding.service';

import { TranslatePipe } from '../../core/translate.pipe';

import { BrandStackComponent } from '../brand-stack/brand-stack.component';

import { LocaleCurrencyService } from '../../core/locale/locale-currency.service';

import { TranslationService } from '../../core/translation.service';

import { AppHealthService, HealthSummary } from '../../core/app-health.service';

import { FooterHealthDialogComponent } from './footer-health-dialog.component';



const HEALTH_RETRY_ATTEMPTS = 2;

const HEALTH_RETRY_DELAY_MS = 2_000;

const HEALTH_BRIEF_MODAL_MS = 3_000;



@Component({

  selector: 'app-footer',

  standalone: true,

  imports: [CommonModule, TranslatePipe, BrandStackComponent, FooterHealthDialogComponent],

  template: `

    <footer class="app-footer">

      <div class="app-footer-accent" aria-hidden="true"></div>

      <div class="app-footer-inner">

        <div class="app-footer-row">

          <div class="app-footer-date" aria-live="polite">

            <span class="app-footer-date-dot" aria-hidden="true"></span>

            <time class="app-footer-date-text" [attr.datetime]="dateTimeIso">{{ liveDate }}</time>

            <span class="app-footer-date-sep" aria-hidden="true">·</span>

            <time class="app-footer-time-text">{{ liveTime }}</time>

          </div>

          <div class="app-footer-brand">

            <app-brand-stack surface="dark" size="footer-inline" />

            <button

              type="button"

              class="app-footer-status"

              role="status"

              [class.app-footer-status--checking]="healthState === 'checking'"

              [class.app-footer-status--degraded]="healthState === 'degraded'"

              [class.app-footer-status--clickable]="healthSummary.problematic > 0"

              [attr.aria-label]="healthSummary.problematic > 0 ? ('footer.health.statusClickHint' | translate) : null"

              [disabled]="healthSummary.problematic === 0 && healthState !== 'checking'"

              (click)="openHealthDialogManual()">

              <span class="app-footer-status-dot"></span>

              <span class="app-footer-status-text">{{ statusLabel }}</span>

            </button>

          </div>

        </div>

        <p class="app-footer-meta">© {{ currentYear }} · {{ 'footer.meta' | translate }}</p>

      </div>

    </footer>



    <app-footer-health-dialog

      [visible]="healthDialogVisible"

      [snapshot]="health.snapshot()"

      [autoClose]="healthDialogAutoClose"

      [autoCloseMs]="HEALTH_BRIEF_MODAL_MS"

      [showAllServices]="healthDialogShowAll"

      (visibleChange)="onHealthDialogVisibleChange($event)" />

  `,

  styleUrls: ['./footer.component.scss'],

})

export class FooterComponent implements OnInit, OnDestroy {

  readonly HEALTH_BRIEF_MODAL_MS = HEALTH_BRIEF_MODAL_MS;



  currentYear = new Date().getFullYear();

  liveDate = '';

  liveTime = '';

  dateTimeIso = '';

  protected branding = inject(BrandingService);

  protected health = inject(AppHealthService);

  healthState = this.health.state();

  healthSummary: HealthSummary = this.health.buildSummary(this.health.snapshot());

  statusLabel = '';

  healthDialogVisible = false;

  healthDialogAutoClose = false;

  healthDialogShowAll = false;

  private briefModalShownThisSession = false;

  private localeCurrency = inject(LocaleCurrencyService);

  private i18n = inject(TranslationService);

  private cdr = inject(ChangeDetectorRef);

  private langSub?: Subscription;

  private profileSub?: Subscription;

  private dateTimer?: ReturnType<typeof setInterval>;

  private healthTimer?: ReturnType<typeof setInterval>;



  ngOnInit(): void {

    this.updateDate();

    this.updateStatusLabel();

    void this.bootstrapHealth();

    this.healthTimer = setInterval(() => void this.refreshHealth(true), 60_000);

    this.dateTimer = setInterval(() => this.updateDate(), 1000);

    this.langSub = this.i18n.getCurrentLanguage$().subscribe(() => {

      this.updateDate();

      this.updateStatusLabel();

      this.cdr.markForCheck();

    });

    this.profileSub = this.localeCurrency.profile$.subscribe(() => {

      this.updateDate();

      this.cdr.markForCheck();

    });

  }



  ngOnDestroy(): void {

    this.langSub?.unsubscribe();

    this.profileSub?.unsubscribe();

    if (this.dateTimer) {

      clearInterval(this.dateTimer);

    }

    if (this.healthTimer) {

      clearInterval(this.healthTimer);

    }

  }



  openHealthDialogManual(): void {

    if (this.healthSummary.problematic === 0) {

      return;

    }

    void this.refreshHealth(false).then(() => {

      this.healthDialogAutoClose = false;

      this.healthDialogShowAll = true;

      this.healthDialogVisible = true;

      this.cdr.markForCheck();

    });

  }



  onHealthDialogVisibleChange(visible: boolean): void {

    this.healthDialogVisible = visible;

    if (!visible) {

      this.healthDialogAutoClose = false;

      this.healthDialogShowAll = false;

    }

    if (visible && !this.healthDialogAutoClose) {

      void this.refreshHealth(false);

    }

  }



  private async bootstrapHealth(): Promise<void> {

    for (let attempt = 0; attempt < HEALTH_RETRY_ATTEMPTS; attempt++) {

      await this.refreshHealth(false);

      if (this.healthState === 'online') {

        return;

      }

      if (attempt < HEALTH_RETRY_ATTEMPTS - 1) {

        await this.sleep(HEALTH_RETRY_DELAY_MS);

      }

    }

    this.maybeShowBriefProblemModal();

    this.cdr.markForCheck();

  }



  private async refreshHealth(autoOpenOnDegrade: boolean): Promise<void> {

    const prevProblematic = this.healthSummary.problematic;

    await this.health.refresh();

    this.healthState = this.health.state();

    this.healthSummary = this.health.buildSummary(this.health.snapshot());

    this.updateStatusLabel();



    if (this.healthSummary.problematic === 0) {

      this.healthDialogVisible = false;

    } else if (

      autoOpenOnDegrade &&

      this.healthSummary.problematic > 0 &&

      prevProblematic === 0 &&

      !this.briefModalShownThisSession

    ) {

      this.showBriefProblemModal();

    }

    this.cdr.markForCheck();

  }



  private maybeShowBriefProblemModal(): void {

    if (this.healthSummary.problematic > 0 && !this.briefModalShownThisSession) {

      this.showBriefProblemModal();

    }

  }



  private showBriefProblemModal(): void {

    this.briefModalShownThisSession = true;

    this.healthDialogAutoClose = true;

    this.healthDialogShowAll = false;

    this.healthDialogVisible = true;

  }



  private updateStatusLabel(): void {

    if (this.healthState === 'checking') {

      this.statusLabel = this.i18n.translate('footer.health.servicesChecking');

      return;

    }

    this.statusLabel = this.i18n.translate('footer.health.servicesLoaded', {

      operational: String(this.healthSummary.operational),

      total: String(this.healthSummary.total),

    });

  }



  private sleep(ms: number): Promise<void> {

    return new Promise((resolve) => setTimeout(resolve, ms));

  }



  private updateDate(): void {

    const now = new Date();

    const snap = this.localeCurrency.getLiveClockSnapshot(now);

    this.liveDate = snap.date;

    this.liveTime = now.toLocaleTimeString(this.localeCurrency.getIntlLocale(), {

      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,

      hour: '2-digit',

      minute: '2-digit',

    });

    this.dateTimeIso = now.toISOString();

  }

}


