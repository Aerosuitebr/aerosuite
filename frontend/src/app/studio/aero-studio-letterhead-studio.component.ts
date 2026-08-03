import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ColorPickerModule } from 'primeng/colorpicker';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Subscription } from 'rxjs';
import {
  AeroStudioIdentity,
  AeroStudioRenderRequest,
  AeroStudioService,
  AeroStudioTemplate
} from '../core/aero-studio.service';
import { SistemaEmpresaService } from '../core/sistema-empresa.service';
import { TranslatePipe } from '../core/translate.pipe';
import { TranslationService } from '../core/translation.service';
import { LETTERHEAD_PRESETS, type LetterheadPresetId } from './studio-letterhead-presets';
import { LetterheadFormModel } from './studio-letterhead.seed';

export type { LetterheadFormModel };

@Component({
  standalone: true,
  selector: 'app-aero-studio-letterhead-studio',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CheckboxModule,
    InputTextModule,
    InputTextareaModule,
    ColorPickerModule,
    ProgressSpinnerModule,
    TranslatePipe
  ],
  template: `
    <div class="lh-studio" *ngIf="model">
      <aside class="lh-config" [attr.aria-label]="'studio.letterhead.configAria' | translate">
        <div class="lh-config-scroll">
          <p class="lh-lead">{{ 'studio.letterhead.lead' | translate }}</p>
          <p class="lh-warn" *ngIf="identity && !identity.onboardingCompleto">
            {{ 'studio.identity.warn' | translate }}
          </p>

          <section class="lh-card lh-presets-card">
            <header class="lh-card-head">
              <i class="pi pi-th-large" aria-hidden="true"></i>
              <h2>{{ 'studio.letterhead.section.presets' | translate }}</h2>
            </header>
            <p class="lh-hint">{{ 'studio.letterhead.presets.hint' | translate }}</p>
            <div class="lh-preset-grid">
              <button type="button" class="lh-preset-card" *ngFor="let pr of presets"
                      [class.selected]="model.presetId === pr.id"
                      (click)="selectPreset(pr.id)">
                <span class="lh-preset-thumb" [ngClass]="pr.thumbClass" aria-hidden="true"></span>
                <span class="lh-preset-name">{{ pr.i18nKey | translate }}</span>
              </button>
            </div>
          </section>

          <section class="lh-card">
            <header class="lh-card-head">
              <i class="pi pi-building" aria-hidden="true"></i>
              <h2>{{ 'studio.letterhead.section.company' | translate }}</h2>
            </header>
            <div class="lh-field-grid">
              <label class="lh-field span-2">
                <span>{{ 'studio.field.displayName' | translate }}</span>
                <input pInputText class="lh-input" [(ngModel)]="model.displayName" (ngModelChange)="onModelChange()" />
              </label>
              <label class="lh-field span-2">
                <span>{{ 'studio.field.tagline' | translate }}</span>
                <input pInputText class="lh-input" [(ngModel)]="model.tagline" (ngModelChange)="onModelChange()" />
              </label>
              <label class="lh-field">
                <span>{{ 'studio.field.email' | translate }}</span>
                <input pInputText type="email" class="lh-input" [(ngModel)]="model.supportEmail" (ngModelChange)="onModelChange()" />
              </label>
              <label class="lh-field">
                <span>{{ 'studio.field.phone' | translate }}</span>
                <input pInputText class="lh-input" [(ngModel)]="model.telefone" (ngModelChange)="onModelChange()" />
              </label>
              <label class="lh-field">
                <span>{{ 'studio.field.site' | translate }}</span>
                <input pInputText class="lh-input" [(ngModel)]="model.siteUrl" (ngModelChange)="onModelChange()" />
              </label>
              <label class="lh-field span-2">
                <span>{{ 'studio.field.address' | translate }}</span>
                <textarea pInputTextarea class="lh-input lh-textarea" rows="2" [(ngModel)]="model.endereco"
                          (ngModelChange)="onModelChange()"></textarea>
              </label>
            </div>
          </section>

          <section class="lh-card">
            <header class="lh-card-head">
              <i class="pi pi-palette" aria-hidden="true"></i>
              <h2>{{ 'studio.letterhead.section.brand' | translate }}</h2>
            </header>
            <div class="lh-color-row">
              <div class="lh-color-block">
                <span class="lh-color-label">{{ 'studio.letterhead.color.primary' | translate }}</span>
                <p class="lh-color-hint">{{ 'studio.letterhead.color.primaryHint' | translate }}</p>
                <div class="lh-color-control">
                  <span class="lh-swatch" [style.background]="normalizeHex(model.primaryColor)"></span>
                  <p-colorPicker [(ngModel)]="model.primaryColor" (ngModelChange)="onModelChange()"></p-colorPicker>
                </div>
              </div>
              <div class="lh-color-block">
                <span class="lh-color-label">{{ 'studio.letterhead.color.secondary' | translate }}</span>
                <p class="lh-color-hint">{{ 'studio.letterhead.color.secondaryHint' | translate }}</p>
                <div class="lh-color-control">
                  <span class="lh-swatch" [style.background]="normalizeHex(model.secondaryColor)"></span>
                  <p-colorPicker [(ngModel)]="model.secondaryColor" (ngModelChange)="onModelChange()"></p-colorPicker>
                </div>
              </div>
            </div>
            <div class="lh-stroke-demo" aria-hidden="true">
              <span class="stroke-top" [style.background]="normalizeHex(model.primaryColor)"></span>
              <span class="stroke-bottom" [style.background]="normalizeHex(model.secondaryColor)"></span>
            </div>
            <div class="lh-options">
              <label class="lh-check">
                <p-checkbox [(ngModel)]="model.includeCropMarks" [binary]="true" inputId="lhCrop"
                            (ngModelChange)="onModelChange()"></p-checkbox>
                <span>{{ 'studio.opt.cropMarks' | translate }}</span>
              </label>
              <label class="lh-check">
                <p-checkbox [(ngModel)]="model.includeQrPortal" [binary]="true" inputId="lhQr"
                            (ngModelChange)="onModelChange()"></p-checkbox>
                <span>{{ 'studio.opt.qr' | translate }}</span>
              </label>
            </div>
            <p class="lh-hint">{{ 'studio.opt.qrHelp' | translate }}</p>
          </section>

          <section class="lh-card lh-logo-card">
            <header class="lh-card-head">
              <i class="pi pi-image" aria-hidden="true"></i>
              <h2>{{ 'studio.letterhead.section.logo' | translate }}</h2>
            </header>
            <p class="lh-hint">{{ 'studio.letterhead.logo.hint' | translate }}</p>
            <div class="lh-logo-panel">
              <div class="lh-logo-frame">
                <img *ngIf="logoSrc" [src]="logoSrc" [alt]="'studio.letterhead.logo.alt' | translate" />
                <span *ngIf="!logoSrc" class="lh-logo-empty">
                  <i class="pi pi-image" aria-hidden="true"></i>
                  {{ 'studio.letterhead.logo.empty' | translate }}
                </span>
              </div>
              <div class="lh-logo-actions">
                <button pButton type="button" class="p-button-outlined lh-upload-btn" icon="pi pi-upload"
                        [label]="'studio.letterhead.logo.upload' | translate"
                        (click)="logoInput.click()" [loading]="uploadingLogo"></button>
                <input #logoInput type="file" class="lh-file-hidden" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                       (change)="onLogoSelected($event)" />
                <p class="lh-logo-spec">{{ 'studio.letterhead.logo.spec' | translate }}</p>
              </div>
            </div>
          </section>
        </div>

        <footer class="lh-config-footer">
          <button pButton type="button" class="p-button-outlined" icon="pi pi-arrow-left"
                  [label]="'studio.btn.back' | translate" (click)="back.emit()"></button>
          <button pButton type="button" icon="pi pi-arrow-right" iconPos="right"
                  [label]="'studio.btn.next' | translate" (click)="continue.emit()"></button>
        </footer>
      </aside>

      <main class="lh-preview-pane">
        <header class="lh-preview-head">
          <div>
            <h2>{{ 'studio.letterhead.preview.title' | translate }}</h2>
            <p>{{ 'studio.letterhead.preview.sub' | translate }}</p>
          </div>
          <div class="lh-preview-head-actions">
            <div class="lh-zoom-bar" role="toolbar" [attr.aria-label]="'studio.letterhead.zoom.aria' | translate">
              <button pButton type="button" class="p-button-text lh-zoom-btn" icon="pi pi-search-minus"
                      (click)="zoomOut()" [disabled]="previewZoom <= zoomMin"
                      [attr.aria-label]="'studio.letterhead.zoom.out' | translate"></button>
              <span class="lh-zoom-pct">{{ zoomPercentLabel }}</span>
              <button pButton type="button" class="p-button-text lh-zoom-btn" icon="pi pi-search-plus"
                      (click)="zoomIn()" [disabled]="previewZoom >= zoomMax"
                      [attr.aria-label]="'studio.letterhead.zoom.in' | translate"></button>
            </div>
            <span class="lh-format-badge" *ngIf="template">
              {{ 'studio.size' | translate:{ w: template.widthMm + '', h: template.heightMm + '', b: template.bleedMm + '' } }}
            </span>
          </div>
        </header>
        <div class="lh-preview-stage">
          <div class="lh-preview-loading" *ngIf="previewLoading">
            <p-progressSpinner strokeWidth="3" [style]="{ width: '40px', height: '40px' }"></p-progressSpinner>
            <span>{{ 'studio.letterhead.preview.loading' | translate }}</span>
          </div>
          <div class="lh-preview-scroller" *ngIf="previewUrl && !previewLoading">
            <figure class="lh-preview-figure" [style.transform]="previewTransform">
              <img [src]="previewUrl" [alt]="'studio.preview.title' | translate" />
            </figure>
          </div>
          <div class="lh-preview-empty" *ngIf="!previewUrl && !previewLoading">
            <i class="pi pi-file" aria-hidden="true"></i>
            <p>{{ 'studio.letterhead.preview.wait' | translate }}</p>
          </div>
        </div>
        <p class="lh-preview-disclaimer">{{ 'studio.rgbDisclaimer' | translate }}</p>
      </main>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        flex: 1;
        min-height: 0;
      }
      .lh-studio {
        display: grid;
        grid-template-columns: minmax(320px, 420px) 1fr;
        gap: 0;
        flex: 1;
        min-height: 0;
        height: 100%;
      }
      .lh-config {
        display: flex;
        flex-direction: column;
        min-height: 0;
        border-right: 1px solid rgba(148, 163, 184, 0.12);
        background: linear-gradient(180deg, rgba(15, 23, 42, 0.92) 0%, rgba(15, 23, 42, 0.78) 100%);
      }
      .lh-config-scroll {
        flex: 1;
        overflow: auto;
        padding: 1.25rem 1.35rem 1rem;
        scrollbar-gutter: stable;
      }
      .lh-lead {
        margin: 0 0 0.75rem;
        font-size: 0.88rem;
        line-height: 1.45;
        color: #94a3b8;
      }
      .lh-warn {
        margin: 0 0 1rem;
        padding: 0.55rem 0.75rem;
        border-radius: 8px;
        background: rgba(245, 158, 11, 0.12);
        border: 1px solid rgba(245, 158, 11, 0.35);
        color: #fcd34d;
        font-size: 0.82rem;
      }
      .lh-card {
        margin-bottom: 1rem;
        padding: 1rem 1.05rem 1.05rem;
        border-radius: 14px;
        border: 1px solid rgba(148, 163, 184, 0.14);
        background: rgba(255, 255, 255, 0.03);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
      }
      .lh-card-head {
        display: flex;
        align-items: center;
        gap: 0.55rem;
        margin-bottom: 0.85rem;
      }
      .lh-card-head i {
        color: #38bdf8;
        font-size: 1rem;
      }
      .lh-card-head h2 {
        margin: 0;
        font-size: 0.78rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #e2e8f0;
      }
      .lh-preset-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.55rem;
      }
      .lh-preset-card {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 0.4rem;
        padding: 0.5rem;
        border-radius: 10px;
        border: 1px solid rgba(148, 163, 184, 0.2);
        background: rgba(0, 0, 0, 0.2);
        cursor: pointer;
        text-align: left;
        color: #e2e8f0;
        transition: border-color 0.15s, box-shadow 0.15s;
      }
      .lh-preset-card:hover {
        border-color: rgba(56, 189, 248, 0.45);
      }
      .lh-preset-card.selected {
        border-color: #38bdf8;
        box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.35);
      }
      .lh-preset-thumb {
        display: block;
        height: 52px;
        border-radius: 6px;
        border: 1px solid rgba(255, 255, 255, 0.12);
      }
      .lh-preset-name {
        font-size: 0.72rem;
        font-weight: 600;
        line-height: 1.25;
      }
      .thumb-corp {
        background: linear-gradient(135deg, #f97316 0%, #fff 40%, #1e293b 100%);
      }
      .thumb-mod {
        background: linear-gradient(135deg, #1d4ed8 0%, #fff 50%, #93c5fd 100%);
      }
      .thumb-wv {
        background: linear-gradient(180deg, #0ea5e9 0%, #fff 45%, #0369a1 100%);
      }
      .thumb-inst {
        background: linear-gradient(90deg, #fff 0%, #fff 55%, #334155 100%);
      }
      .thumb-min {
        background: #fff;
        box-shadow: inset 0 0 0 4px #111;
      }
      .lh-field-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.65rem 0.75rem;
      }
      .lh-field {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        min-width: 0;
      }
      .lh-field.span-2 {
        grid-column: 1 / -1;
      }
      .lh-field > span {
        font-size: 0.72rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: #94a3b8;
      }
      .lh-input {
        width: 100%;
      }
      .lh-textarea {
        resize: vertical;
        min-height: 2.5rem;
      }
      .lh-color-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
      }
      .lh-color-block {
        padding: 0.65rem 0.7rem;
        border-radius: 10px;
        background: rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(148, 163, 184, 0.1);
      }
      .lh-color-label {
        display: block;
        font-size: 0.78rem;
        font-weight: 600;
        color: #f1f5f9;
      }
      .lh-color-hint {
        margin: 0.2rem 0 0.55rem;
        font-size: 0.72rem;
        line-height: 1.35;
        color: #64748b;
      }
      .lh-color-control {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .lh-swatch {
        width: 28px;
        height: 28px;
        border-radius: 8px;
        border: 2px solid rgba(255, 255, 255, 0.25);
        flex-shrink: 0;
      }
      .lh-stroke-demo {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-bottom: 0.85rem;
        padding: 0.5rem;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.04);
      }
      .lh-stroke-demo span {
        height: 3px;
        border-radius: 2px;
      }
      .stroke-top {
        width: 100%;
      }
      .stroke-bottom {
        width: 72%;
        align-self: flex-start;
      }
      .lh-options {
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
      }
      .lh-check {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        font-size: 0.86rem;
        color: #cbd5e1;
        cursor: pointer;
      }
      .lh-hint {
        margin: 0.5rem 0 0;
        font-size: 0.75rem;
        line-height: 1.4;
        color: #64748b;
      }
      .lh-logo-panel {
        display: grid;
        grid-template-columns: 120px 1fr;
        gap: 1rem;
        align-items: start;
        margin-top: 0.65rem;
      }
      .lh-logo-frame {
        aspect-ratio: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem;
        border-radius: 12px;
        border: 1px dashed rgba(148, 163, 184, 0.35);
        background: rgba(255, 255, 255, 0.04);
      }
      .lh-logo-frame img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
      .lh-logo-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.35rem;
        text-align: center;
        font-size: 0.72rem;
        color: #64748b;
      }
      .lh-logo-empty i {
        font-size: 1.25rem;
        opacity: 0.6;
      }
      .lh-logo-actions {
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
        min-width: 0;
      }
      .lh-upload-btn {
        align-self: flex-start;
      }
      .lh-logo-spec {
        margin: 0;
        font-size: 0.72rem;
        line-height: 1.45;
        color: #64748b;
      }
      .lh-file-hidden {
        position: absolute;
        width: 0;
        height: 0;
        opacity: 0;
        pointer-events: none;
      }
      .lh-config-footer {
        display: flex;
        justify-content: space-between;
        gap: 0.5rem;
        padding: 0.85rem 1.35rem;
        border-top: 1px solid rgba(148, 163, 184, 0.12);
        background: rgba(15, 23, 42, 0.95);
        flex-shrink: 0;
      }
      .lh-preview-pane {
        display: flex;
        flex-direction: column;
        min-height: 0;
        padding: 1.25rem 1.5rem 1rem;
        background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(56, 189, 248, 0.08), transparent 55%),
          linear-gradient(180deg, #0f172a 0%, #0c1018 100%);
      }
      .lh-preview-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
        margin-bottom: 1rem;
        flex-shrink: 0;
      }
      .lh-preview-head-actions {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.5rem;
        flex-shrink: 0;
      }
      .lh-zoom-bar {
        display: inline-flex;
        align-items: center;
        gap: 0.15rem;
        padding: 0.2rem 0.35rem;
        border-radius: 10px;
        border: 1px solid rgba(148, 163, 184, 0.2);
        background: rgba(15, 23, 42, 0.65);
      }
      .lh-zoom-btn {
        width: 2.1rem;
        height: 2.1rem;
        color: #e2e8f0 !important;
      }
      .lh-zoom-btn:disabled {
        opacity: 0.35;
      }
      .lh-zoom-pct {
        min-width: 2.75rem;
        text-align: center;
        font-size: 0.78rem;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        color: #94a3b8;
      }
      .lh-preview-head h2 {
        margin: 0 0 0.25rem;
        font-size: 1.05rem;
        font-weight: 700;
        color: #f8fafc;
      }
      .lh-preview-head p {
        margin: 0;
        font-size: 0.82rem;
        color: #94a3b8;
      }
      .lh-format-badge {
        flex-shrink: 0;
        padding: 0.35rem 0.65rem;
        border-radius: 999px;
        font-size: 0.7rem;
        font-weight: 600;
        letter-spacing: 0.03em;
        color: #7dd3fc;
        background: rgba(14, 165, 233, 0.12);
        border: 1px solid rgba(56, 189, 248, 0.25);
      }
      .lh-preview-stage {
        position: relative;
        flex: 1;
        min-height: 280px;
        display: flex;
        align-items: stretch;
        justify-content: center;
        padding: 0;
        border-radius: 16px;
        border: 1px solid rgba(148, 163, 184, 0.12);
        background: rgba(0, 0, 0, 0.25);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
        overflow: hidden;
      }
      .lh-preview-scroller {
        flex: 1;
        width: 100%;
        overflow: auto;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding: 1.25rem;
      }
      .lh-preview-loading,
      .lh-preview-empty {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        color: #94a3b8;
        font-size: 0.88rem;
        text-align: center;
        z-index: 1;
      }
      .lh-preview-empty i {
        font-size: 2rem;
        opacity: 0.4;
      }
      .lh-preview-figure {
        margin: 0;
        width: 100%;
        max-width: min(520px, 100%);
        display: flex;
        justify-content: center;
        transform-origin: top center;
        transition: transform 0.12s ease-out;
        will-change: transform;
      }
      .lh-preview-figure img {
        width: 100%;
        height: auto;
        max-height: none;
        object-fit: contain;
        border-radius: 6px;
        box-shadow: 0 24px 48px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.06);
        background: #fff;
        display: block;
      }
      .lh-preview-disclaimer {
        margin: 0.75rem 0 0;
        flex-shrink: 0;
        font-size: 0.75rem;
        color: #64748b;
        text-align: center;
      }
      @media (max-width: 1100px) {
        .lh-studio {
          grid-template-columns: 1fr;
          grid-template-rows: auto 1fr;
        }
        .lh-config {
          border-right: none;
          border-bottom: 1px solid rgba(148, 163, 184, 0.12);
          max-height: 48vh;
        }
        .lh-preview-figure img {
          max-height: 50vh;
        }
      }
    `
  ]
})
export class AeroStudioLetterheadStudioComponent implements OnInit, OnChanges, OnDestroy {
  private studio = inject(AeroStudioService);
  private empresa = inject(SistemaEmpresaService);
  private i18n = inject(TranslationService);
  private toast = inject(MessageService);

  readonly presets = LETTERHEAD_PRESETS;

  @Input({ required: true }) model!: LetterheadFormModel;
  @Input() identity: AeroStudioIdentity | null = null;
  @Input({ required: true }) template!: AeroStudioTemplate;
  @Input({ required: true }) buildRequest!: () => AeroStudioRenderRequest;

  @Output() modelChange = new EventEmitter<LetterheadFormModel>();
  @Output() identityRefresh = new EventEmitter<void>();
  @Output() previewUrlChange = new EventEmitter<string | null>();
  @Output() back = new EventEmitter<void>();
  @Output() continue = new EventEmitter<void>();

  @ViewChild('logoInput') logoInput?: ElementRef<HTMLInputElement>;

  previewUrl: string | null = null;
  previewLoading = false;
  uploadingLogo = false;
  logoSrc: string | null = null;
  previewZoom = 1;
  readonly zoomMin = 0.5;
  readonly zoomMax = 2.5;
  readonly zoomStep = 0.1;

  private previewTimer: ReturnType<typeof setTimeout> | null = null;
  private previewSub?: Subscription;

  ngOnInit(): void {
    this.syncLogoSrc();
    this.schedulePreview(true);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['identity']) {
      this.syncLogoSrc();
      this.schedulePreview();
    }
  }

  ngOnDestroy(): void {
    if (this.previewTimer) clearTimeout(this.previewTimer);
    this.previewSub?.unsubscribe();
    this.studio.revokePreviewUrl(this.previewUrl);
  }

  selectPreset(id: LetterheadPresetId): void {
    if (this.model.presetId === id) return;
    this.model = { ...this.model, presetId: id };
    this.onModelChange();
  }

  onModelChange(): void {
    this.modelChange.emit({ ...this.model });
    this.schedulePreview();
  }

  normalizeHex(c: string): string {
    if (!c) return '#0ea5e9';
    return c.startsWith('#') ? c : `#${c}`;
  }

  get zoomPercentLabel(): string {
    return `${Math.round(this.previewZoom * 100)}%`;
  }

  get previewTransform(): string {
    return `scale(${this.previewZoom})`;
  }

  zoomIn(): void {
    this.previewZoom = Math.min(
      this.zoomMax,
      Math.round((this.previewZoom + this.zoomStep) * 10) / 10
    );
  }

  zoomOut(): void {
    this.previewZoom = Math.max(
      this.zoomMin,
      Math.round((this.previewZoom - this.zoomStep) * 10) / 10
    );
  }

  onLogoSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const okType =
      /^image\/(png|jpeg|webp)$/i.test(file.type) || /\.(png|jpe?g|webp)$/i.test(file.name);
    if (!okType) {
      this.toast.add({
        severity: 'warn',
        summary: this.i18n.translate('studio.letterhead.logo.invalidType')
      });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.toast.add({
        severity: 'warn',
        summary: this.i18n.translate('studio.letterhead.logo.tooLarge')
      });
      return;
    }
    this.uploadingLogo = true;
    this.empresa.uploadLogo(file).subscribe({
      next: res => {
        this.uploadingLogo = false;
        if (res?.url) {
          this.logoSrc = res.url;
        }
        this.identityRefresh.emit();
        this.toast.add({
          severity: 'success',
          summary: this.i18n.translate('studio.letterhead.logo.uploaded')
        });
        this.schedulePreview(true);
      },
      error: () => {
        this.uploadingLogo = false;
        this.toast.add({
          severity: 'error',
          summary: this.i18n.translate('studio.letterhead.logo.uploadFailed')
        });
      }
    });
  }

  private syncLogoSrc(): void {
    this.logoSrc = this.identity?.logoUrl?.trim() || null;
  }

  private schedulePreview(immediate = false): void {
    if (this.previewTimer) clearTimeout(this.previewTimer);
    const delay = immediate ? 0 : 450;
    this.previewTimer = setTimeout(() => this.loadPreview(), delay);
  }

  private loadPreview(): void {
    this.previewSub?.unsubscribe();
    this.previewLoading = true;
    this.previewSub = this.studio.preview(this.buildRequest()).subscribe({
      next: blob => {
        this.studio.revokePreviewUrl(this.previewUrl);
        this.previewUrl = this.studio.previewUrlFromBlob(blob);
        this.previewLoading = false;
        this.previewUrlChange.emit(this.previewUrl);
      },
      error: () => {
        this.previewLoading = false;
        this.toast.add({
          severity: 'error',
          summary: this.i18n.translate('studio.err.preview')
        });
      }
    });
  }
}
