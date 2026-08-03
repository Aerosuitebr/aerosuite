import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FormsModule } from '@angular/forms';
import {
  ThermalPrintMode,
  ThermalPrintPreferencesService
} from './thermal-print-preferences.service';
import { TranslatePipe } from '../translate.pipe';
import { TranslationService } from '../translation.service';
import { ThermalPrintSetupService } from './thermal-print-setup.service';
import { ThermalPrintBridgeClient } from './thermal-print-bridge.client';
import { downloadThermalPrintBridgeZip } from './thermal-print-download.util';

type VerifyState = 'idle' | 'checking' | 'ok' | 'fail';

@Component({
  selector: 'app-thermal-print-setup-dialog',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    TagModule,
    DividerModule,
    ProgressSpinnerModule,
    SelectButtonModule,
    FormsModule,
    TranslatePipe
  ],
  template: `
    <p-dialog
      styleClass="as-hero-dialog thermal-print-setup-dialog" [visible]="setup.visible()"
      (visibleChange)="setup.onVisibleChange($event)"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: 'min(920px, 96vw)' }"
     
      [closable]="true"
      [header]="'thermalPrint.setup.title' | translate">
      <div class="tps-root">
        <section class="tps-hero">
          <div class="tps-hero-icon" aria-hidden="true">
            <i class="pi pi-print"></i>
          </div>
          <div class="tps-hero-text">
            <p class="tps-lead">{{ 'thermalPrint.setup.subtitle' | translate }}</p>
            <p class="tps-alert" *ngIf="setup.reason() === 'print-failed'">
              <i class="pi pi-info-circle"></i>
              {{ 'thermalPrint.setup.triggeredByPrint' | translate }}
            </p>
            <p class="tps-alert tps-alert--https" *ngIf="isHttps">
              <i class="pi pi-shield"></i>
              {{ 'thermalPrint.setup.httpsHint' | translate }}
            </p>
          </div>
        </section>

        <section class="tps-section">
          <h3>{{ 'thermalPrint.setup.why.title' | translate }}</h3>
          <p class="tps-muted">{{ 'thermalPrint.setup.why.lead' | translate }}</p>

          <div class="tps-diagram" role="img" [attr.aria-label]="'thermalPrint.setup.why.title' | translate">
            <div class="tps-node tps-node--browser">
              <i class="pi pi-globe"></i>
              <span>{{ 'thermalPrint.setup.diagram.browser' | translate }}</span>
              <small>Aero Suite</small>
            </div>
            <div class="tps-arrow tps-arrow--down">
              <span class="tps-arrow-label">{{ 'thermalPrint.setup.diagram.https' | translate }}</span>
              <i class="pi pi-arrow-right"></i>
            </div>
            <div class="tps-node tps-node--server">
              <i class="pi pi-server"></i>
              <span>{{ 'thermalPrint.setup.diagram.server' | translate }}</span>
              <small class="tps-blocked">{{ 'thermalPrint.setup.diagram.blocked' | translate }}</small>
            </div>
            <div class="tps-bridge-row">
              <div class="tps-arrow tps-arrow--return">
                <span class="tps-arrow-label">{{ 'thermalPrint.setup.diagram.local' | translate }}</span>
                <i class="pi pi-arrow-left"></i>
              </div>
              <div class="tps-node tps-node--bridge">
                <i class="pi pi-desktop"></i>
                <span>{{ 'thermalPrint.setup.diagram.bridge' | translate }}</span>
                <small>127.0.0.1:19428</small>
              </div>
              <div class="tps-arrow tps-arrow--out">
                <span class="tps-arrow-label">{{ 'thermalPrint.setup.diagram.raw' | translate }}</span>
                <i class="pi pi-arrow-right"></i>
              </div>
              <div class="tps-node tps-node--printer">
                <i class="pi pi-print"></i>
                <span>{{ 'thermalPrint.setup.diagram.printer' | translate }}</span>
                <small>PPLB</small>
              </div>
            </div>
          </div>

          <div class="tps-cards">
            <article class="tps-card">
              <header><i class="pi pi-server"></i> {{ 'thermalPrint.setup.why.javaTitle' | translate }}</header>
              <p>{{ 'thermalPrint.setup.why.javaBody' | translate }}</p>
            </article>
            <article class="tps-card">
              <header><i class="pi pi-globe"></i> {{ 'thermalPrint.setup.why.browserTitle' | translate }}</header>
              <p>{{ 'thermalPrint.setup.why.browserBody' | translate }}</p>
            </article>
            <article class="tps-card tps-card--accent">
              <header><i class="pi pi-check-circle"></i> {{ 'thermalPrint.setup.why.bridgeTitle' | translate }}</header>
              <p>{{ 'thermalPrint.setup.why.bridgeBody' | translate }}</p>
            </article>
          </div>
        </section>

        <p-divider></p-divider>

        <section class="tps-section tps-prefs">
          <h3>{{ 'thermalPrint.setup.prefs.title' | translate }}</h3>
          <p-selectButton
            [options]="printModeOptions"
            [(ngModel)]="printMode"
            optionLabel="label"
            optionValue="value"
            (ngModelChange)="onPrintModeChange($event)">
          </p-selectButton>
          <p class="tps-hint">{{ 'thermalPrint.setup.prefs.hint' | translate }}</p>
        </section>

        <p-divider></p-divider>

        <section class="tps-section">
          <h3>{{ 'thermalPrint.setup.steps.title' | translate }}</h3>
          <ol class="tps-steps">
            <li>
              <span class="tps-step-num">1</span>
              <div>
                <strong>{{ 'thermalPrint.setup.step1.title' | translate }}</strong>
                <p>{{ 'thermalPrint.setup.step1.detail' | translate }}</p>
              </div>
            </li>
            <li>
              <span class="tps-step-num">2</span>
              <div>
                <strong>{{ 'thermalPrint.setup.step2.title' | translate }}</strong>
                <p>{{ 'thermalPrint.setup.step2.detail' | translate }}</p>
              </div>
            </li>
            <li>
              <span class="tps-step-num">3</span>
              <div>
                <strong>{{ 'thermalPrint.setup.step3.title' | translate }}</strong>
                <p>{{ 'thermalPrint.setup.step3.detail' | translate }}</p>
              </div>
            </li>
            <li>
              <span class="tps-step-num">4</span>
              <div>
                <strong>{{ 'thermalPrint.setup.step4.title' | translate }}</strong>
                <p>{{ 'thermalPrint.setup.step4.detail' | translate }}</p>
              </div>
            </li>
          </ol>
        </section>

        <div class="tps-actions">
          <div class="tps-download-block">
            <button
              pButton
              type="button"
              icon="pi pi-download"
              class="p-button-lg tps-btn-download"
              [label]="'thermalPrint.setup.download' | translate"
              (click)="onDownload()">
            </button>
            <p class="tps-hint">{{ 'thermalPrint.setup.downloadHint' | translate }}</p>
          </div>
          <div class="tps-verify-block">
            <button
              pButton
              type="button"
              icon="pi pi-refresh"
              class="p-button-outlined"
              [label]="'thermalPrint.setup.verify' | translate"
              [loading]="verifyState() === 'checking'"
              (click)="onVerify()">
            </button>
            <div class="tps-status" *ngIf="verifyState() !== 'idle'">
              <p-progressSpinner *ngIf="verifyState() === 'checking'" [style]="{ width: '22px', height: '22px' }" strokeWidth="4"></p-progressSpinner>
              <p-tag *ngIf="verifyState() === 'ok'" severity="success" [value]="'thermalPrint.setup.verifyOk' | translate"></p-tag>
              <p-tag *ngIf="verifyState() === 'fail'" severity="danger" [value]="'thermalPrint.setup.verifyFail' | translate"></p-tag>
            </div>
          </div>
        </div>

        <p class="tps-footnote">
          <i class="pi pi-windows"></i> {{ 'thermalPrint.setup.noteWindows' | translate }}
        </p>
      </div>

      <ng-template pTemplate="footer">
        <button
          pButton
          type="button"
          class="p-button-text"
          [label]="'thermalPrint.setup.close' | translate"
          (click)="setup.close()">
        </button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    :host ::ng-deep .thermal-print-setup-dialog .p-dialog-content {
      padding-top: 0;
    }
    .tps-root {
      font-size: 0.95rem;
      line-height: 1.55;
      color: var(--text-color, #1e293b);
    }
    .tps-hero {
      display: flex;
      gap: 1.25rem;
      align-items: flex-start;
      padding: 1rem 1.25rem;
      margin: 0 0 1.25rem;
      border-radius: 12px;
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(99, 102, 241, 0.08) 50%, rgba(14, 165, 233, 0.06) 100%);
      border: 1px solid rgba(59, 130, 246, 0.2);
    }
    .tps-hero-icon {
      flex-shrink: 0;
      width: 56px;
      height: 56px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(145deg, #3b82f6, #6366f1);
      color: #fff;
      font-size: 1.5rem;
      box-shadow: 0 8px 20px rgba(59, 130, 246, 0.35);
    }
    .tps-lead {
      margin: 0 0 0.5rem;
      font-size: 1.02rem;
      font-weight: 500;
    }
    .tps-alert {
      margin: 0.5rem 0 0;
      padding: 0.65rem 0.85rem;
      border-radius: 8px;
      background: rgba(245, 158, 11, 0.12);
      border: 1px solid rgba(245, 158, 11, 0.35);
      color: #92400e;
      display: flex;
      gap: 0.5rem;
      align-items: flex-start;
      font-size: 0.9rem;
    }
    .tps-alert--https {
      background: rgba(59, 130, 246, 0.1);
      border-color: rgba(59, 130, 246, 0.35);
      color: #1e40af;
    }
    .tps-section h3 {
      margin: 0 0 0.65rem;
      font-size: 1.1rem;
      font-weight: 600;
    }
    .tps-prefs :host ::ng-deep .p-selectbutton {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
    }
    .tps-prefs :host ::ng-deep .p-selectbutton .p-button {
      font-size: 0.85rem;
    }
    .tps-muted {
      margin: 0 0 1rem;
      color: var(--text-color-secondary, #64748b);
    }
    .tps-diagram {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 0.5rem 0.75rem;
      padding: 1.25rem 1rem;
      margin-bottom: 1.25rem;
      border-radius: 12px;
      background: var(--surface-ground, #f8fafc);
      border: 1px dashed var(--surface-border, #e2e8f0);
    }
    .tps-bridge-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 0.5rem 0.75rem;
      width: 100%;
    }
    .tps-node {
      min-width: 120px;
      padding: 0.75rem 1rem;
      border-radius: 10px;
      text-align: center;
      background: var(--surface-card, #fff);
      border: 1px solid var(--surface-border, #e2e8f0);
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
    }
    .tps-node i {
      display: block;
      font-size: 1.35rem;
      margin-bottom: 0.35rem;
      color: #3b82f6;
    }
    .tps-node span {
      display: block;
      font-weight: 600;
      font-size: 0.85rem;
    }
    .tps-node small {
      display: block;
      margin-top: 0.2rem;
      font-size: 0.72rem;
      color: var(--text-color-secondary, #64748b);
    }
    .tps-node--bridge {
      border-color: #6366f1;
      background: linear-gradient(180deg, #fff 0%, rgba(99, 102, 241, 0.06) 100%);
    }
    .tps-node--bridge i { color: #6366f1; }
    .tps-node--printer i { color: #0ea5e9; }
    .tps-blocked {
      color: #dc2626 !important;
      font-weight: 500;
    }
    .tps-arrow {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.15rem;
      color: var(--text-color-secondary, #94a3b8);
      font-size: 0.7rem;
    }
    .tps-arrow i { font-size: 1rem; }
    .tps-arrow-label {
      max-width: 90px;
      text-align: center;
      line-height: 1.2;
    }
    .tps-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 0.85rem;
    }
    .tps-card {
      padding: 0.85rem 1rem;
      border-radius: 10px;
      background: var(--surface-card, #fff);
      border: 1px solid var(--surface-border, #e2e8f0);
    }
    .tps-card header {
      font-weight: 600;
      font-size: 0.88rem;
      margin-bottom: 0.45rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .tps-card header i { color: #64748b; }
    .tps-card p {
      margin: 0;
      font-size: 0.82rem;
      color: var(--text-color-secondary, #64748b);
    }
    .tps-card--accent {
      border-color: rgba(99, 102, 241, 0.45);
      background: linear-gradient(180deg, #fff 0%, rgba(99, 102, 241, 0.05) 100%);
    }
    .tps-card--accent header i { color: #6366f1; }
    .tps-steps {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 0.85rem;
    }
    .tps-steps li {
      display: flex;
      gap: 0.85rem;
      align-items: flex-start;
    }
    .tps-step-num {
      flex-shrink: 0;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #3b82f6;
      color: #fff;
      font-weight: 700;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .tps-steps strong {
      display: block;
      margin-bottom: 0.2rem;
    }
    .tps-steps p {
      margin: 0;
      font-size: 0.88rem;
      color: var(--text-color-secondary, #64748b);
    }
    .tps-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      align-items: flex-start;
      margin-top: 1.25rem;
      padding: 1.25rem;
      border-radius: 12px;
      background: var(--surface-section, #f1f5f9);
    }
    .tps-download-block {
      flex: 1;
      min-width: 240px;
    }
    :host ::ng-deep .tps-btn-download {
      width: 100%;
      max-width: 360px;
    }
    .tps-hint {
      margin: 0.5rem 0 0;
      font-size: 0.8rem;
      color: var(--text-color-secondary, #64748b);
    }
    .tps-verify-block {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      min-width: 200px;
    }
    .tps-status :host ::ng-deep .p-tag {
      max-width: 280px;
      white-space: normal;
      line-height: 1.35;
    }
    .tps-footnote {
      margin: 1rem 0 0;
      font-size: 0.8rem;
      color: var(--text-color-secondary, #64748b);
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    @media (max-width: 640px) {
      .tps-hero { flex-direction: column; }
      .tps-actions { flex-direction: column; }
    }
  `]
})
export class ThermalPrintSetupDialogComponent {
  protected setup = inject(ThermalPrintSetupService);
  private bridge = inject(ThermalPrintBridgeClient);
  private prefs = inject(ThermalPrintPreferencesService);
  protected i18n = inject(TranslationService);

  readonly isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  verifyState = signal<VerifyState>('idle');
  printMode: ThermalPrintMode = this.prefs.getMode();

  get printModeOptions(): { label: string; value: ThermalPrintMode }[] {
    return [
      { label: this.i18n.translate('thermalPrint.setup.prefs.browser'), value: 'browser' },
      { label: this.i18n.translate('thermalPrint.setup.prefs.auto'), value: 'auto' },
      { label: this.i18n.translate('thermalPrint.setup.prefs.thermal'), value: 'thermal' }
    ];
  }

  onPrintModeChange(mode: ThermalPrintMode): void {
    this.printMode = mode;
    this.prefs.setMode(mode);
  }

  onDownload(): void {
    downloadThermalPrintBridgeZip();
  }

  async onVerify(): Promise<void> {
    this.verifyState.set('checking');
    try {
      const health = await this.bridge.getHealth();
      this.verifyState.set(health.ok ? 'ok' : 'fail');
    } catch {
      this.verifyState.set('fail');
    }
  }
}
