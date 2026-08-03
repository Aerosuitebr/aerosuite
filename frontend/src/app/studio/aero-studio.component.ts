import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService, MenuItem } from 'primeng/api';
import { ColorPickerModule } from 'primeng/colorpicker';
import { HttpResponse } from '@angular/common/http';
import { Subscription, switchMap, timer } from 'rxjs';
import {
  AeroStudioIdentity,
  AeroStudioJob,
  AeroStudioJobStarted,
  AeroStudioRenderRequest,
  AeroStudioService,
  AeroStudioTemplate
} from '../core/aero-studio.service';
import { TranslatePipe } from '../core/translate.pipe';
import { TranslationService } from '../core/translation.service';
import { AeroStudioCanvasEditorComponent } from './aero-studio-canvas-editor.component';
import { AeroStudioLetterheadStudioComponent } from './aero-studio-letterhead-studio.component';
import { LetterheadFormModel } from './studio-letterhead.seed';
import { DEFAULT_LETTERHEAD_PRESET } from './studio-letterhead-presets';
import { StudioCanvasDocument } from './models/studio-canvas.model';
import { emptyCanvasDoc, seedCanvasFromIdentity } from './studio-canvas.seed';
import { StudioCollabService } from './studio-collab.service';
import { newCollabSessionId } from './models/studio-canvas.model';
@Component({
  standalone: true,
  selector: 'app-aero-studio',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CheckboxModule,
    InputTextModule,
    InputTextareaModule,
    ToastModule,
    ColorPickerModule,
    ProgressSpinnerModule,
    TranslatePipe,
    AeroStudioCanvasEditorComponent,
    AeroStudioLetterheadStudioComponent
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <div class="studio-shell"
         [class.studio-shell--editor]="step === 1 && editorMode"
         [class.studio-shell--letterhead]="step === 1 && isLetterheadTemplate">
      <header class="studio-hero"
              [class.studio-hero--compact]="step === 1 && (editorMode || isLetterheadTemplate)">
        <div class="hero-art" aria-hidden="true">
          <div class="hero-mesh"></div>
          <span class="art-splash sp1"></span>
          <span class="art-splash sp2"></span>
          <span class="art-splash sp3"></span>
          <span class="art-swatch sw1"></span>
          <span class="art-swatch sw2"></span>
          <span class="art-swatch sw3"></span>
          <span class="art-swatch sw4"></span>
          <span class="art-swatch sw5"></span>
          <span class="art-brush brush1"></span>
          <span class="art-brush brush2"></span>
          <span class="art-palette"></span>
          <span class="art-drip"></span>
        </div>
        <div class="hero-content">
          <p class="hero-eyebrow">{{ 'studio.title' | translate }}</p>
          <h1><i class="pi pi-palette"></i> {{ step === 0 ? ('studio.pickTemplate' | translate) : ('studio.hero.tagline' | translate) }}</h1>
          <p class="hero-sub" *ngIf="step === 0">{{ 'studio.pickTemplateSub' | translate }}</p>
          <p class="hero-sub" *ngIf="step !== 0">{{ 'studio.subtitle' | translate }}</p>
        </div>
      </header>

      <nav class="studio-tabs" [attr.aria-label]="'studio.step.template' | translate">
        <button type="button" class="studio-tab" *ngFor="let s of stepItems; let i = index"
                [class.active]="step === i" [class.done]="step > i" [disabled]="i > step" (click)="goToStep(i)">
          <span class="tab-num">{{ i + 1 }}</span>
          <span class="tab-label">{{ s.label }}</span>
        </button>
      </nav>

      <main class="studio-main">

      <section *ngIf="step === 0" class="step-palette">
        <div class="palette-stage">
          <button type="button" class="palette-well" *ngFor="let t of templates"
                  [class.selected]="selectedTemplateId === t.id" [attr.data-template]="t.id"
                  (click)="selectedTemplateId = t.id">
            <div class="well-paint" [attr.data-template]="t.id">
              <i class="well-icon" [ngClass]="templateIcon(t)"></i>
            </div>
            <div class="well-info">
              <strong class="well-title">{{ t.i18nKey | translate }}</strong>
              <span class="well-cat">{{ t.categoryI18nKey | translate }}</span>
              <span class="well-size">{{ 'studio.size' | translate:{ w: t.widthMm + '', h: t.heightMm + '', b: t.bleedMm + '' } }}</span>
              <span class="well-badge" *ngIf="t.supportsEditor">{{ 'studio.editor.badge' | translate }}</span>
              <span class="well-badge async" *ngIf="t.asyncRecommended">{{ 'studio.async.hint' | translate }}</span>
            </div>
            <span class="well-selected-tag" *ngIf="selectedTemplateId === t.id">{{ 'studio.palette.selected' | translate }}</span>
          </button>
        </div>
        <aside class="history-rail">
          <h3>{{ 'studio.history.title' | translate }}</h3>
          <p *ngIf="!history.length" class="hint">{{ 'studio.history.empty' | translate }}</p>
          <ul class="history-list" *ngIf="history.length">
            <li *ngFor="let h of history | slice:0:6">
              <span class="hist-meta">{{ h.templateId }} · {{ statusLabel(h.status) }}</span>
              <span class="hist-actions">
                <button *ngIf="h.hasPreview" pButton type="button" class="p-button-text p-button-sm" icon="pi pi-eye"
                        (click)="openHistoryPreview(h)"></button>
                <button pButton type="button" class="p-button-text p-button-sm" icon="pi pi-download"
                        (click)="downloadHistory(h)" [disabled]="h.status !== 'COMPLETED'"></button>
              </span>
            </li>
          </ul>
        </aside>
        <footer class="step-footer">
          <button pButton type="button" class="p-button-lg btn-next" [label]="'studio.btn.next' | translate"
                  icon="pi pi-arrow-right" iconPos="right"
                  (click)="nextFromTemplate()" [disabled]="!selectedTemplateId"></button>
        </footer>
      </section>

      <section *ngIf="step === 1 && editorMode" class="editor-workspace">
        <div class="editor-toolbar-bar">
          <p class="editor-intro">{{ 'studio.editor.intro' | translate }}</p>
          <div class="checks editor-checks">
            <p-checkbox [(ngModel)]="includeCropMarks" [binary]="true" inputId="cropEd"></p-checkbox>
            <label for="cropEd">{{ 'studio.opt.cropMarks' | translate }}</label>
            <p-checkbox [(ngModel)]="includeQrPortal" [binary]="true" inputId="qrEd"></p-checkbox>
            <label for="qrEd">{{ 'studio.opt.qr' | translate }}</label>
          </div>
          <p class="qr-opt-hint">{{ 'studio.opt.qrHelp' | translate }}</p>
        </div>
        <app-aero-studio-canvas-editor
          *ngIf="canvasDoc"
          class="editor-canvas-host"
          [doc]="canvasDoc"
          [identity]="identity"
          [primaryColor]="primaryColor"
          [includeQrPortal]="includeQrPortal"
          (docChange)="onCanvasDocChange($event)">
        </app-aero-studio-canvas-editor>
        <footer class="editor-footer nav">
          <button pButton type="button" class="p-button-outlined" [label]="'studio.btn.back' | translate" icon="pi pi-arrow-left"
                  (click)="backFromEditor()"></button>
          <button pButton type="button" [label]="'studio.btn.next' | translate" icon="pi pi-arrow-right" iconPos="right"
                  (click)="goPreviewStep()"></button>
        </footer>
      </section>

      <section *ngIf="step === 1 && isLetterheadTemplate && letterheadModel" class="letterhead-step-wrap">
        <app-aero-studio-letterhead-studio
          [model]="letterheadModel"
          [identity]="identity"
          [template]="selectedTemplate()!"
          [buildRequest]="buildRequestBound"
          (modelChange)="onLetterheadModelChange($event)"
          (previewUrlChange)="onLetterheadPreviewUrl($event)"
          (identityRefresh)="reloadIdentity()"
          (back)="step = 0"
          (continue)="goPreviewStep()">
        </app-aero-studio-letterhead-studio>
      </section>

      <section *ngIf="step === 1 && !editorMode && !isLetterheadTemplate" class="step-panel step-identity">
        <h3>{{ 'studio.identity.title' | translate }}</h3>
        <p class="warn" *ngIf="identity && !identity.onboardingCompleto">{{ 'studio.identity.warn' | translate }}</p>
        <div class="identity-grid" *ngIf="identity">
          <label>{{ 'studio.field.tagline' | translate }}</label>
          <input pInputText [(ngModel)]="taglineOverride" class="w-full" />
          <label>{{ 'studio.field.services' | translate }}</label>
          <textarea pInputTextarea [(ngModel)]="servicesText" rows="4" class="w-full"></textarea>
          <label>{{ 'studio.field.primary' | translate }}</label>
          <p-colorPicker [(ngModel)]="primaryColor"></p-colorPicker>
          <label>{{ 'studio.field.secondary' | translate }}</label>
          <p-colorPicker [(ngModel)]="secondaryColor"></p-colorPicker>
          <div class="checks">
            <p-checkbox [(ngModel)]="includeCropMarks" [binary]="true" inputId="crop"></p-checkbox>
            <label for="crop">{{ 'studio.opt.cropMarks' | translate }}</label>
          </div>
          <div class="checks">
            <p-checkbox [(ngModel)]="includeQrPortal" [binary]="true" inputId="qr"></p-checkbox>
            <label for="qr">{{ 'studio.opt.qr' | translate }}</label>
          </div>
          <p class="hint qr-opt-hint">{{ 'studio.opt.qrHelp' | translate }}</p>
          <ul class="summary">
            <li><strong>{{ 'studio.field.displayName' | translate }}:</strong> {{ identity.displayName }}</li>
            <li><strong>{{ 'studio.field.email' | translate }}:</strong> {{ identity.supportEmail }}</li>
            <li><strong>{{ 'studio.field.phone' | translate }}:</strong> {{ identity.telefone }}</li>
            <li><strong>{{ 'studio.field.address' | translate }}:</strong> {{ identity.enderecoFormatado }}</li>
          </ul>
        </div>
        <div class="nav">
          <button pButton type="button" class="p-button-outlined" [label]="'studio.btn.back' | translate" icon="pi pi-arrow-left"
                  (click)="step = 0"></button>
          <button pButton type="button" class="p-button-outlined" icon="pi pi-pencil"
                  [label]="'studio.btn.openEditor' | translate"
                  (click)="openEditorFromIdentity()"></button>
          <button pButton type="button" [label]="'studio.btn.next' | translate" icon="pi pi-arrow-right" iconPos="right"
                  (click)="goPreviewStep()"></button>
        </div>
      </section>

      <section *ngIf="step === 2" class="step-panel step-export">
        <h3>{{ 'studio.step.preview' | translate }}</h3>
        <p class="disclaimer">{{ 'studio.rgbDisclaimer' | translate }}</p>
        <p class="warn" *ngIf="isAsync">{{ 'studio.async.hint' | translate }}</p>

        <div class="preview-block">
          <button pButton type="button" class="p-button-outlined" icon="pi pi-eye"
                  [label]="'studio.btn.preview' | translate"
                  (click)="loadPreview()" [loading]="loadingPreview"></button>
          <p class="hint">{{ 'studio.preview.hint' | translate }}</p>
          <img *ngIf="previewUrl" [src]="previewUrl" [alt]="'studio.preview.title' | translate" class="preview-img" />
        </div>

        <div class="checks">
          <p-checkbox [(ngModel)]="packageZip" [binary]="true" inputId="zip"></p-checkbox>
          <label for="zip">{{ 'studio.opt.zip' | translate }}</label>
        </div>
        <div class="checks" *ngIf="packageZip">
          <p-checkbox [(ngModel)]="includePngInZip" [binary]="true" inputId="pngzip"></p-checkbox>
          <label for="pngzip">{{ 'studio.opt.pngInZip' | translate }}</label>
        </div>
        <div class="checks" *ngIf="editorMode && packageZip">
          <p-checkbox [(ngModel)]="includeAnimatedExport" [binary]="true" inputId="animzip"></p-checkbox>
          <label for="animzip">{{ 'studio.opt.animatedExport' | translate }}</label>
        </div>
        <p class="hint" *ngIf="editorMode && collabActive">{{ 'studio.collab.active' | translate }}</p>

        <div class="async-status" *ngIf="polling">
          <p-progressSpinner strokeWidth="4" [style]="{ width: '32px', height: '32px' }"></p-progressSpinner>
          <span>{{ 'studio.async.progress' | translate:{ status: asyncStatusLabel } }}</span>
        </div>

        <div class="nav">
          <button pButton type="button" class="p-button-outlined" [label]="'studio.btn.back' | translate" icon="pi pi-arrow-left"
                  (click)="step = 1" [disabled]="polling"></button>
          <button pButton type="button" icon="pi pi-file-pdf" [label]="'studio.btn.pdf' | translate"
                  (click)="download(false)" [loading]="loading" [disabled]="packageZip || polling"></button>
          <button pButton type="button" icon="pi pi-download" class="p-button-outlined"
                  [label]="'studio.btn.zip' | translate"
                  (click)="download(true)" [loading]="loading" [disabled]="polling"></button>
        </div>
      </section>
      </main>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        margin: -1rem -1.25rem 0;
        width: calc(100% + 2.5rem);
        max-width: none;
      }
      .studio-shell {
        display: flex;
        flex-direction: column;
        min-height: calc(100vh - 72px);
        background: #0c1018;
        color: #e2e8f0;
      }
      .studio-shell--editor,
      .studio-shell--letterhead {
        min-height: calc(100vh - 72px);
        height: calc(100vh - 72px);
        overflow: hidden;
      }
      .letterhead-step-wrap {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
        overflow: hidden;
      }
      .studio-shell--letterhead .studio-main {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        margin: 0;
        padding: 0;
      }
      .studio-shell--letterhead .studio-tabs {
        flex-shrink: 0;
      }
      .studio-hero {
        position: relative;
        padding: 2rem 2.5rem 2.25rem;
        background: linear-gradient(118deg, #0a0e1a 0%, #1e1b4b 28%, #831843 55%, #c2410c 82%, #f59e0b 100%);
        color: #fff;
        overflow: hidden;
        flex-shrink: 0;
      }
      .studio-hero--compact { padding: 1rem 1.5rem 1.1rem; }
      .studio-hero--compact h1 { font-size: 1.2rem; }
      .studio-hero--compact .hero-sub, .studio-hero--compact .hero-eyebrow { display: none; }
      .hero-mesh {
        position: absolute;
        inset: 0;
        background:
          radial-gradient(ellipse 70% 90% at 15% 20%, rgba(244, 114, 182, 0.45), transparent 55%),
          radial-gradient(ellipse 60% 80% at 85% 30%, rgba(56, 189, 248, 0.4), transparent 50%),
          radial-gradient(ellipse 50% 60% at 50% 100%, rgba(251, 191, 36, 0.25), transparent 45%);
        opacity: 0.9;
      }
      .art-splash {
        position: absolute;
        border-radius: 50%;
        filter: blur(1px);
        opacity: 0.35;
      }
      .sp1 { width: 180px; height: 140px; background: #ec4899; top: -30px; right: 15%; transform: rotate(-12deg); }
      .sp2 { width: 120px; height: 100px; background: #3b82f6; bottom: -20px; left: 35%; }
      .sp3 { width: 90px; height: 70px; background: #fbbf24; top: 40%; left: 5%; }
      .art-drip {
        position: absolute;
        left: 42%;
        top: 0;
        width: 8px;
        height: 55%;
        background: linear-gradient(180deg, rgba(236, 72, 153, 0.6), transparent);
        border-radius: 0 0 8px 8px;
      }
      .hero-art {
        position: absolute;
        inset: 0;
        pointer-events: none;
        opacity: 0.7;
      }
      .sw5 { background: #a78bfa; top: 42%; right: 38%; width: 28px; height: 28px; }
      .art-swatch {
        position: absolute;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        border: 3px solid rgba(255, 255, 255, 0.35);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
      }
      .sw1 { background: #f472b6; top: 12%; left: 8%; }
      .sw2 { background: #38bdf8; top: 55%; left: 18%; width: 36px; height: 36px; }
      .sw3 { background: #fbbf24; top: 20%; right: 22%; width: 56px; height: 56px; }
      .sw4 { background: #4ade80; bottom: 8%; right: 12%; width: 40px; height: 40px; }
      .art-brush {
        position: absolute;
        width: 120px;
        height: 14px;
        border-radius: 8px;
        background: linear-gradient(90deg, #78350f, #d97706);
        transform: rotate(-25deg);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
      }
      .brush1 { top: 28%; right: 8%; }
      .brush2 { bottom: 18%; left: 28%; width: 90px; transform: rotate(18deg); opacity: 0.7; }
      .art-palette {
        position: absolute;
        right: 6%;
        bottom: 10%;
        width: 72px;
        height: 52px;
        border-radius: 50% 50% 45% 45%;
        background: #fef3c7;
        border: 3px solid #fff;
        box-shadow: inset -8px -6px 0 #fcd34d, 0 6px 16px rgba(0, 0, 0, 0.2);
      }
      .art-palette::before {
        content: '';
        position: absolute;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #dc2626;
        top: 10px;
        left: 12px;
        box-shadow: 18px 4px 0 #2563eb, 36px 0 0 #16a34a, 10px 22px 0 #7c3aed;
      }
      .hero-content { position: relative; z-index: 1; max-width: 820px; }
      .hero-eyebrow {
        margin: 0 0 0.35rem;
        font-size: 0.72rem;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        opacity: 0.85;
        font-weight: 600;
      }
      .studio-hero h1 {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        margin: 0 0 0.5rem;
        font-size: clamp(1.5rem, 3vw, 2.1rem);
        font-weight: 700;
        line-height: 1.15;
        text-shadow: 0 2px 24px rgba(0, 0, 0, 0.4);
      }
      .hero-sub { margin: 0; opacity: 0.9; font-size: 1rem; line-height: 1.45; max-width: 36rem; }
      .studio-tabs {
        display: flex;
        gap: 0;
        padding: 0 1.25rem;
        background: rgba(15, 23, 42, 0.95);
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        flex-shrink: 0;
        backdrop-filter: blur(8px);
      }
      .studio-tab {
        flex: 1;
        max-width: 280px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.55rem;
        padding: 0.95rem 1.25rem;
        border: none;
        background: transparent;
        cursor: pointer;
        position: relative;
        color: #94a3b8;
        font-size: 0.88rem;
        font-weight: 500;
        transition: color 0.2s, background 0.2s;
      }
      .studio-tab:disabled { cursor: default; opacity: 0.45; }
      .studio-tab:not(:disabled):hover { color: #e2e8f0; background: rgba(255, 255, 255, 0.04); }
      .studio-tab::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 12%;
        right: 12%;
        height: 3px;
        border-radius: 3px 3px 0 0;
        background: transparent;
      }
      .studio-tab.active { color: #fff; font-weight: 600; background: rgba(14, 165, 233, 0.12); }
      .studio-tab.active::after { background: linear-gradient(90deg, #38bdf8, #a78bfa); }
      .studio-tab.done { color: #6ee7b7; }
      .studio-tab.done .tab-num { background: #059669; border-color: #059669; }
      .tab-num {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 2px solid rgba(255, 255, 255, 0.2);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.78rem;
        font-weight: 700;
      }
      .studio-tab.active .tab-num {
        border-color: #38bdf8;
        background: linear-gradient(135deg, #0ea5e9, #8b5cf6);
        color: #fff;
      }
      .studio-main {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .step-palette {
        flex: 1;
        display: grid;
        grid-template-columns: 1fr minmax(220px, 280px);
        grid-template-rows: 1fr auto;
        gap: 0;
        min-height: 0;
        padding: 1.25rem 1.5rem 1rem;
      }
      .palette-stage {
        grid-column: 1;
        grid-row: 1;
        display: flex;
        flex-wrap: wrap;
        align-content: center;
        justify-content: center;
        align-items: flex-end;
        gap: 1.5rem 1.75rem;
        padding: 2rem 1.5rem 2.5rem;
        background:
          radial-gradient(ellipse 90% 70% at 50% 100%, rgba(255, 255, 255, 0.06), transparent 60%),
          linear-gradient(165deg, #151b28 0%, #0d1117 100%);
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.07);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 20px 50px rgba(0, 0, 0, 0.35);
        overflow: auto;
      }
      .palette-well {
        position: relative;
        width: clamp(150px, 14vw, 190px);
        padding: 0;
        border: none;
        background: transparent;
        cursor: pointer;
        text-align: center;
        transition: transform 0.28s cubic-bezier(0.34, 1.4, 0.64, 1);
      }
      .palette-well:hover { transform: translateY(-6px) scale(1.02); }
      .palette-well.selected { transform: translateY(-10px) scale(1.04); }
      .well-paint {
        height: clamp(110px, 16vh, 150px);
        margin: 0 auto 0.65rem;
        border-radius: 48% 48% 42% 42% / 58% 58% 42% 42%;
        border: 3px solid rgba(255, 255, 255, 0.28);
        box-shadow:
          inset 0 -16px 28px rgba(0, 0, 0, 0.35),
          0 14px 32px rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: box-shadow 0.25s, border-color 0.25s;
      }
      .palette-well.selected .well-paint {
        border-color: #fff;
        box-shadow:
          0 0 0 3px rgba(56, 189, 248, 0.9),
          inset 0 -12px 24px rgba(0, 0, 0, 0.3),
          0 18px 40px rgba(14, 165, 233, 0.35);
      }
      .well-paint[data-template='custom-canvas'] {
        background: linear-gradient(145deg, #f472b6 0%, #8b5cf6 45%, #38bdf8 100%);
      }
      .well-paint[data-template='cartao-visita'] {
        background: linear-gradient(160deg, #fb7185, #e11d48);
      }
      .well-paint[data-template='papel-timbrado'] {
        background: linear-gradient(160deg, #38bdf8, #1d4ed8);
      }
      .well-paint[data-template='folder-1dobra'] {
        background: linear-gradient(160deg, #4ade80, #15803d);
      }
      .well-paint[data-template='banner-hangar'] {
        background: linear-gradient(160deg, #fbbf24, #ea580c 55%, #7c3aed);
      }
      .well-icon {
        font-size: 1.75rem;
        color: rgba(255, 255, 255, 0.92);
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
      }
      .well-info { color: #e2e8f0; }
      .well-title { display: block; font-size: 0.92rem; font-weight: 600; margin-bottom: 0.2rem; }
      .well-cat, .well-size { display: block; font-size: 0.72rem; color: #94a3b8; line-height: 1.35; }
      .well-badge {
        display: inline-block;
        margin-top: 0.35rem;
        padding: 0.12rem 0.45rem;
        border-radius: 999px;
        font-size: 0.65rem;
        background: rgba(56, 189, 248, 0.2);
        color: #7dd3fc;
      }
      .well-badge.async { background: rgba(251, 191, 36, 0.2); color: #fcd34d; }
      .well-selected-tag {
        position: absolute;
        top: -0.5rem;
        left: 50%;
        transform: translateX(-50%);
        padding: 0.15rem 0.55rem;
        border-radius: 999px;
        font-size: 0.62rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        background: #0ea5e9;
        color: #fff;
        box-shadow: 0 4px 12px rgba(14, 165, 233, 0.5);
      }
      .history-rail {
        grid-column: 2;
        grid-row: 1 / 3;
        margin-left: 1rem;
        padding: 1rem 1.1rem;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 14px;
        overflow: auto;
        align-self: stretch;
      }
      .history-rail h3 { margin: 0 0 0.75rem; font-size: 0.9rem; color: #f1f5f9; }
      .step-footer {
        grid-column: 1;
        grid-row: 2;
        display: flex;
        justify-content: flex-end;
        padding-top: 0.75rem;
      }
      .btn-next { min-width: 200px; }
      .step-panel {
        flex: 1;
        overflow: auto;
        margin: 1rem 1.5rem 1.5rem;
        padding: 1.5rem 1.75rem;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        color: #e2e8f0;
      }
      .step-panel h3 { margin: 0 0 1rem; color: #f8fafc; }
      @media (max-width: 960px) {
        .step-palette { grid-template-columns: 1fr; grid-template-rows: auto auto auto; }
        .history-rail { grid-column: 1; grid-row: 3; margin: 1rem 0 0; margin-left: 0; }
        .step-footer { grid-row: 2; justify-content: center; }
      }
      .editor-workspace {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
        padding: 0.65rem 0.75rem 0.75rem;
        overflow: hidden;
      }
      .editor-toolbar-bar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem 1rem;
        padding: 0.35rem 0.25rem 0.5rem;
        flex-shrink: 0;
      }
      .editor-intro { margin: 0; font-size: 0.85rem; color: var(--text-color-secondary); }
      .editor-canvas-host {
        flex: 1;
        min-height: 0;
        display: flex;
      }
      .editor-footer {
        flex-shrink: 0;
        padding-top: 0.5rem;
        border-top: 1px solid var(--surface-border);
        margin-top: 0.35rem;
      }
      .editor-checks { flex-wrap: wrap; margin: 0; }
      .qr-opt-hint { margin: 0.35rem 0 0; font-size: 0.8rem; line-height: 1.35; max-width: 52rem; color: #94a3b8; }
      .identity-grid { display: flex; flex-direction: column; gap: 0.75rem; margin: 1rem 0; }
      .checks { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.35rem; }
      .summary { margin: 0.5rem 0 0; padding-left: 1.2rem; font-size: 0.9rem; }
      .warn, .disclaimer, .hint { color: #94a3b8; font-size: 0.9rem; }
      .step-panel .w-full { width: 100%; }
      .preview-block { margin: 1rem 0; }
      .preview-img { max-width: 100%; margin-top: 0.75rem; border: 1px solid var(--surface-border); border-radius: 6px; }
      .async-status { display: flex; align-items: center; gap: 0.75rem; margin: 1rem 0; }
      .nav { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 1rem; }
      .history-list { list-style: none; padding: 0; margin: 0; }
      .history-list li { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 0.5rem 0; border-bottom: 1px solid var(--surface-border); font-size: 0.9rem; }
      .hist-actions { display: flex; gap: 0.5rem; align-items: center; flex-shrink: 0; }
    `
  ]
})
export class AeroStudioComponent implements OnInit, OnDestroy {
  private svc = inject(AeroStudioService);
  private collab = inject(StudioCollabService);
  private i18n = inject(TranslationService);
  private toast = inject(MessageService);

  step = 0;
  stepItems: MenuItem[] = [];
  templates: AeroStudioTemplate[] = [];
  selectedTemplateId = '';
  identity: AeroStudioIdentity | null = null;
  letterheadModel: LetterheadFormModel | null = null;
  taglineOverride = '';
  servicesText = '';
  primaryColor = '#0ea5e9';
  secondaryColor = '#1e293b';
  includeCropMarks = false;
  includeQrPortal = true;
  packageZip = false;
  includePngInZip = true;
  loading = false;
  loadingPreview = false;
  previewUrl: string | null = null;
  history: AeroStudioJob[] = [];
  polling = false;
  asyncStatusLabel = '';
  editorMode = false;
  canvasDoc: StudioCanvasDocument | null = null;
  includeAnimatedExport = true;
  collabActive = false;
  private collabSessionId: string | null = null;
  private collabPublishTimer: ReturnType<typeof setTimeout> | null = null;
  private applyingRemoteCollab = false;
  private pollSub?: Subscription;

  get isAsync(): boolean {
    return this.svc.isAsyncTemplate(this.selectedTemplateId, this.templates, this.canvasDoc ?? undefined);
  }

  get isLetterheadTemplate(): boolean {
    return this.selectedTemplateId === AeroStudioService.TEMPLATE_LETTERHEAD;
  }

  readonly buildRequestBound = (): AeroStudioRenderRequest => this.buildRequest();

  ngOnInit(): void {
    this.refreshStepLabels();
    this.svc.templates().subscribe(t => (this.templates = t ?? []));
    this.svc.context().subscribe(ctx => {
      this.identity = ctx;
      this.taglineOverride = ctx?.tagline ?? '';
      this.servicesText = (ctx?.servicosTop ?? []).join('\n');
      this.primaryColor = ctx?.primaryColorDefault ?? '#0ea5e9';
      this.secondaryColor = ctx?.secondaryColorDefault ?? '#1e293b';
      if (this.isLetterheadTemplate && this.step === 1 && !this.letterheadModel) {
        this.letterheadModel = this.letterheadModelFromIdentity(ctx);
      }
    });
    this.loadHistory();
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
    this.svc.revokePreviewUrl(this.previewUrl);
    this.collab.disconnect();
    if (this.collabPublishTimer) {
      clearTimeout(this.collabPublishTimer);
    }
  }

  loadHistory(): void {
    this.svc.history().subscribe(h => (this.history = h ?? []));
  }

  nextFromTemplate(): void {
    if (!this.selectedTemplateId) {
      this.toast.add({ severity: 'warn', summary: this.i18n.translate('studio.err.template') });
      return;
    }
    if (this.selectedTemplateId === AeroStudioService.TEMPLATE_CUSTOM) {
      this.enterEditorMode(emptyCanvasDoc(this.selectedTemplate()!));
    } else {
      this.editorMode = false;
      this.canvasDoc = null;
    }
    if (this.isLetterheadTemplate) {
      this.letterheadModel = this.letterheadModelFromIdentity(this.identity);
    } else {
      this.letterheadModel = null;
    }
    this.step = 1;
    this.refreshStepLabels();
  }

  reloadIdentity(): void {
    this.svc.context().subscribe(ctx => {
      this.identity = ctx;
    });
  }

  onLetterheadModelChange(model: LetterheadFormModel): void {
    this.letterheadModel = model;
    this.taglineOverride = model.tagline;
    this.primaryColor = model.primaryColor;
    this.secondaryColor = model.secondaryColor;
    this.includeCropMarks = model.includeCropMarks;
    this.includeQrPortal = model.includeQrPortal;
  }

  onLetterheadPreviewUrl(url: string | null): void {
    this.svc.revokePreviewUrl(this.previewUrl);
    this.previewUrl = url;
  }

  private letterheadModelFromIdentity(ctx: AeroStudioIdentity | null): LetterheadFormModel {
    return {
      presetId: DEFAULT_LETTERHEAD_PRESET,
      displayName: ctx?.displayName ?? '',
      tagline: ctx?.tagline ?? '',
      supportEmail: ctx?.supportEmail ?? '',
      telefone: ctx?.telefone ?? '',
      siteUrl: ctx?.siteUrl ?? '',
      endereco: ctx?.enderecoFormatado ?? '',
      primaryColor: ctx?.primaryColorDefault ?? this.primaryColor,
      secondaryColor: ctx?.secondaryColorDefault ?? this.secondaryColor,
      includeCropMarks: this.includeCropMarks,
      includeQrPortal: this.includeQrPortal
    };
  }

  openEditorFromIdentity(): void {
    const tpl = this.selectedTemplate();
    if (!tpl || !this.identity) return;
    this.enterEditorMode(
      seedCanvasFromIdentity(
        this.identity,
        tpl,
        this.primaryColor,
        this.secondaryColor,
        this.taglineOverride,
        this.servicesText,
        this.includeQrPortal
      )
    );
    this.step = 1;
  }

  backFromEditor(): void {
    this.collab.disconnect();
    this.collabActive = false;
    if (this.selectedTemplateId === AeroStudioService.TEMPLATE_CUSTOM) {
      this.editorMode = false;
      this.canvasDoc = null;
      this.collabSessionId = null;
      this.step = 0;
    } else {
      this.editorMode = false;
      this.canvasDoc = null;
      this.collabSessionId = null;
    }
  }

  onCanvasDocChange(doc: StudioCanvasDocument): void {
    this.canvasDoc = { ...doc, elements: doc.elements.map(e => ({ ...e })) };
    this.svc.revokePreviewUrl(this.previewUrl);
    this.previewUrl = null;
    if (!this.applyingRemoteCollab) {
      this.scheduleCollabPublish();
    }
  }

  goPreviewStep(): void {
    if (this.editorMode && this.canvasDoc && !this.canvasDoc.elements.length) {
      this.toast.add({ severity: 'warn', summary: this.i18n.translate('studio.editor.empty') });
      return;
    }
    this.step = 2;
    this.svc.revokePreviewUrl(this.previewUrl);
    this.previewUrl = null;
    this.loadPreview();
    this.refreshStepLabels();
  }

  buildRequest(): AeroStudioRenderRequest {
    const req: AeroStudioRenderRequest = {
      templateId: this.selectedTemplateId,
      includeCropMarks: this.includeCropMarks,
      includeQrPortal: this.includeQrPortal,
      packageZip: false,
      includePngInZip: this.includePngInZip,
      primaryColor: this.primaryColor,
      secondaryColor: this.secondaryColor,
      taglineOverride: this.taglineOverride,
      servicesText: this.servicesText
    };
    if (this.isLetterheadTemplate && this.letterheadModel) {
      const m = this.letterheadModel;
      req.letterheadPresetId = m.presetId;
      req.displayNameOverride = m.displayName;
      req.supportEmailOverride = m.supportEmail;
      req.telefoneOverride = m.telefone;
      req.siteUrlOverride = m.siteUrl;
      req.enderecoOverride = m.endereco;
      req.taglineOverride = m.tagline;
      req.primaryColor = m.primaryColor;
      req.secondaryColor = m.secondaryColor;
      req.includeCropMarks = m.includeCropMarks;
      req.includeQrPortal = m.includeQrPortal;
    }
    if (this.editorMode && this.canvasDoc) {
      req.customLayout = this.canvasDoc;
      if (this.includeAnimatedExport) {
        req.includeAnimatedExport = true;
      }
    }
    return req;
  }

  private enterEditorMode(doc: StudioCanvasDocument): void {
    this.editorMode = true;
    if (!doc.collabSessionId) {
      doc.collabSessionId = newCollabSessionId();
    }
    this.collabSessionId = doc.collabSessionId;
    this.canvasDoc = doc;
    this.startCollab();
    this.refreshStepLabels();
  }

  private startCollab(): void {
    if (!this.collabSessionId) return;
    this.collab.disconnect();
    this.collab.connect(this.collabSessionId, state => {
      if (!state?.document) return;
      this.applyingRemoteCollab = true;
      this.canvasDoc = {
        ...state.document,
        version: 1,
        collabSessionId: this.collabSessionId ?? undefined
      };
      this.applyingRemoteCollab = false;
      this.collabActive = true;
    });
    this.scheduleCollabPublish();
  }

  private scheduleCollabPublish(): void {
    if (!this.collabSessionId || !this.canvasDoc || this.applyingRemoteCollab) return;
    if (this.collabPublishTimer) {
      clearTimeout(this.collabPublishTimer);
    }
    this.collabPublishTimer = setTimeout(() => {
      const name = this.identity?.displayName?.trim() || 'editor';
      this.collab.publish(this.collabSessionId!, name, this.canvasDoc!).subscribe({
        next: () => (this.collabActive = true),
        error: () => (this.collabActive = false)
      });
    }, 400);
  }

  private selectedTemplate(): AeroStudioTemplate | undefined {
    return this.templates.find(t => t.id === this.selectedTemplateId);
  }

  private refreshStepLabels(): void {
    let step1Label = this.i18n.translate('studio.step.identity');
    if (this.editorMode) {
      step1Label = this.i18n.translate('studio.step.editor');
    } else if (this.isLetterheadTemplate) {
      step1Label = this.i18n.translate('studio.step.letterhead');
    }
    this.stepItems = [
      { label: this.i18n.translate('studio.step.template') },
      { label: step1Label },
      { label: this.i18n.translate('studio.step.preview') }
    ];
  }

  loadPreview(): void {
    if (!this.selectedTemplateId) return;
    this.loadingPreview = true;
    this.svc.preview(this.buildRequest()).subscribe({
      next: blob => {
        this.svc.revokePreviewUrl(this.previewUrl);
        this.previewUrl = this.svc.previewUrlFromBlob(blob);
        this.loadingPreview = false;
        this.toast.add({ severity: 'success', summary: this.i18n.translate('studio.ok.preview') });
      },
      error: () => {
        this.loadingPreview = false;
        this.toast.add({ severity: 'error', summary: this.i18n.translate('studio.err.preview') });
      }
    });
  }

  download(zip: boolean): void {
    if (!this.selectedTemplateId) {
      this.toast.add({ severity: 'warn', summary: this.i18n.translate('studio.err.template') });
      return;
    }
    const body: AeroStudioRenderRequest = {
      ...this.buildRequest(),
      packageZip: zip || this.packageZip,
      async: this.isAsync
    };
    this.loading = true;
    this.svc.render(body).subscribe({
      next: async res => {
        this.loading = false;
        if (res.status === 202) {
          await this.handleAsyncAccepted(res);
          return;
        }
        if (res.body) {
          const ext = body.packageZip ? 'zip' : 'pdf';
          this.svc.triggerDownload(res.body, `AeroStudio_${this.selectedTemplateId}.${ext}`);
          this.toast.add({ severity: 'success', summary: this.i18n.translate('studio.ok.render') });
          this.loadHistory();
        }
      },
      error: () => {
        this.loading = false;
        this.toast.add({ severity: 'error', summary: this.i18n.translate('studio.err.render') });
      }
    });
  }

  private async handleAsyncAccepted(res: HttpResponse<Blob>): Promise<void> {
    try {
      const text = res.body ? await res.body.text() : '';
      const started = JSON.parse(text) as AeroStudioJobStarted;
      this.startPolling(started.jobId);
    } catch {
      this.toast.add({ severity: 'error', summary: this.i18n.translate('studio.err.render') });
    }
  }

  private startPolling(jobId: number): void {
    this.pollSub?.unsubscribe();
    this.polling = true;
    this.asyncStatusLabel = this.statusLabel('PENDING');
    this.pollSub = timer(0, 2500)
      .pipe(switchMap(() => this.svc.getJob(jobId)))
      .subscribe({
        next: job => {
          this.asyncStatusLabel = this.statusLabel(job.status);
          if (job.status === 'COMPLETED') {
            this.polling = false;
            this.pollSub?.unsubscribe();
            this.downloadHistory(job);
            this.loadHistory();
          } else if (job.status === 'FAILED') {
            this.polling = false;
            this.pollSub?.unsubscribe();
            this.toast.add({
              severity: 'error',
              summary: job.errorMessage || this.i18n.translate('studio.err.render')
            });
          }
        },
        error: () => {
          this.polling = false;
          this.pollSub?.unsubscribe();
          this.toast.add({ severity: 'error', summary: this.i18n.translate('studio.err.render') });
        }
      });
  }

  downloadHistory(job: AeroStudioJob): void {
    this.svc.downloadJob(job.id).subscribe({
      next: blob => {
        this.svc.triggerDownload(blob, job.fileName || `AeroStudio_${job.templateId}.pdf`);
        this.toast.add({ severity: 'success', summary: this.i18n.translate('studio.ok.render') });
      },
      error: () => this.toast.add({ severity: 'error', summary: this.i18n.translate('studio.err.render') })
    });
  }

  openHistoryPreview(job: AeroStudioJob): void {
    this.svc.jobPreview(job.id).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener');
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      },
      error: () => this.toast.add({ severity: 'error', summary: this.i18n.translate('studio.err.preview') })
    });
  }

  statusLabel(status: string): string {
    const key = `studio.status.${status}`;
    const t = this.i18n.translate(key);
    return t === key ? status : t;
  }

  goToStep(i: number): void {
    if (i > this.step) return;
    if (this.step === 1 && this.editorMode && i === 0) {
      this.backFromEditor();
      return;
    }
    if (i === 1 && this.step === 0 && this.selectedTemplateId) {
      this.nextFromTemplate();
      return;
    }
    this.step = i;
    if (i === 0) {
      this.editorMode = false;
    }
    this.refreshStepLabels();
  }

  templateIcon(t: AeroStudioTemplate): string {
    switch (t.id) {
      case 'custom-canvas':
        return 'pi pi-palette';
      case 'cartao-visita':
        return 'pi pi-id-card';
      case 'papel-timbrado':
        return 'pi pi-file';
      case 'folder-1dobra':
        return 'pi pi-copy';
      case 'banner-hangar':
        return 'pi pi-image';
      default:
        return 'pi pi-print';
    }
  }
}
