import { Component, OnDestroy, OnInit, inject } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { RouterModule } from '@angular/router';

import { TabViewModule } from 'primeng/tabview';

import { ButtonModule } from 'primeng/button';

import { CheckboxModule } from 'primeng/checkbox';

import { DropdownModule } from 'primeng/dropdown';

import { InputTextareaModule } from 'primeng/inputtextarea';

import { ProgressBarModule } from 'primeng/progressbar';

import { AccordionModule } from 'primeng/accordion';

import { ToastModule } from 'primeng/toast';

import { MessageService } from 'primeng/api';

import {

  GoLiveMigracaoService,

  GoLiveChecklistItem,

  GoLiveTemplateInfo,

  GoLiveImportKind,

  GoLiveImportResult

} from '../core/go-live-migracao.service';

import { TranslatePipe } from '../core/translate.pipe';

import { TranslationService } from '../core/translation.service';

import { PageHeroComponent } from '../shared/page-hero/page-hero.component';



type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';



@Component({

  standalone: true,

  selector: 'app-go-live-migracao',

  imports: [

    CommonModule,

    FormsModule,

    RouterModule,

    TabViewModule,

    ButtonModule,

    CheckboxModule,

    DropdownModule,

    InputTextareaModule,

    ProgressBarModule,

    AccordionModule,

    ToastModule,

    TranslatePipe,

    PageHeroComponent

  ],

  providers: [MessageService],

  template: `

    <p-toast></p-toast>

    <div class="as-page list-container go-live-page">

      <app-page-hero

        variant="navy"

        titleKey="goLive.title"

        subtitleKey="goLive.subtitle"

        titleIcon="pi-upload"

        [hasActions]="false">

      </app-page-hero>



      <p-tabView>

        <p-tabPanel [header]="'goLive.tab.checklist' | translate">

          <p class="intro">{{ 'goLive.checklist.intro' | translate }}</p>



          <div class="checklist-progress-card" *ngIf="checklist.length">

            <div class="checklist-progress-head">

              <span class="checklist-progress-label">

                {{ 'goLive.checklist.progress' | translate:{ pct: progressPercent + '' } }}

              </span>

              <span class="auto-save-status auto-save-status--saving" *ngIf="autoSaveStatus === 'saving'">

                <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>

                {{ 'goLive.checklist.autoSaveSaving' | translate }}

              </span>

              <span class="auto-save-status auto-save-status--saved" *ngIf="autoSaveStatus === 'saved'">

                <i class="pi pi-check" aria-hidden="true"></i>

                {{ 'goLive.checklist.autoSaveSaved' | translate }}

              </span>

              <span class="auto-save-status auto-save-status--error" *ngIf="autoSaveStatus === 'error'">

                <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>

                {{ 'goLive.checklist.autoSaveError' | translate }}

              </span>

            </div>

            <p-progressBar [value]="progressPercent" [showValue]="false"></p-progressBar>

          </div>



          <p-accordion

            styleClass="go-live-weeks-accordion"

            [(activeIndex)]="weekAccordionIndex">

            <p-accordionTab *ngFor="let week of weeks">

              <ng-template pTemplate="header">

                <div class="week-acc-head">

                  <span class="week-acc-title">{{ 'goLive.checklist.week' | translate:{ n: week + '' } }}</span>

                  <span class="week-acc-badge" [class.week-acc-badge--done]="weekProgress(week).done === weekProgress(week).total">

                    {{ 'goLive.checklist.weekProgress' | translate:{

                      done: weekProgress(week).done + '',

                      total: weekProgress(week).total + ''

                    } }}

                  </span>

                </div>

              </ng-template>

              <ul class="checklist-items">

                <li *ngFor="let item of itemsByWeek(week)" [class.checklist-item--done]="item.concluido">

                  <p-checkbox

                    [(ngModel)]="item.concluido"

                    [binary]="true"

                    [inputId]="item.itemKey || item.i18nKey"

                    (ngModelChange)="onChecklistItemChange()"></p-checkbox>

                  <label

                    [for]="item.itemKey || item.i18nKey"

                    [class.checklist-label--done]="item.concluido">{{ item.i18nKey | translate }}</label>

                  <a *ngIf="item.routeLink" [routerLink]="item.routeLink" class="checklist-link">{{ 'goLive.checklist.openLink' | translate }}</a>

                </li>

              </ul>

            </p-accordionTab>

          </p-accordion>

        </p-tabPanel>



        <p-tabPanel [header]="'goLive.tab.templates' | translate">

          <div class="template-list">

            <div class="template-card" *ngFor="let t of templates">

              <h4>{{ t.i18nKey | translate }}</h4>

              <p class="file">{{ t.fileName }}</p>

              <button pButton type="button" icon="pi pi-download" class="p-button-outlined"

                      [label]="'goLive.template.download' | translate"

                      (click)="download(t.id)"></button>

            </div>

          </div>

        </p-tabPanel>



        <p-tabPanel [header]="'goLive.tab.import' | translate">

          <div class="import-form">

            <label>{{ 'goLive.import.type' | translate }}</label>

            <p-dropdown [options]="importKinds" [(ngModel)]="importKind" optionLabel="label" optionValue="value"

                        styleClass="w-full"></p-dropdown>

            <label>{{ 'goLive.import.paste' | translate }}</label>

            <input type="file" accept=".csv,.txt" (change)="onFile($event)" />

            <textarea pInputTextarea [(ngModel)]="csvText" rows="8" class="w-full"></textarea>

            <div class="dry-run">

              <p-checkbox [(ngModel)]="dryRun" [binary]="true" inputId="dryRun"></p-checkbox>

              <label for="dryRun">{{ 'goLive.import.dryRun' | translate }}</label>

            </div>

            <button pButton type="button" icon="pi pi-check" [label]="'goLive.import.btnPreview' | translate"

                    (click)="runImport()" [loading]="importing" [disabled]="!csvText.trim()"></button>

          </div>

          <div class="result" *ngIf="lastResult">

            <p><strong>{{ 'goLive.import.result' | translate:{

              criados: lastResult.criados + '',

              ignorados: lastResult.ignorados + '',

              erros: lastResult.erros + '',

              total: lastResult.totalLinhas + ''

            } }}</strong>

              <span *ngIf="lastResult.dryRun"> — {{ 'goLive.import.dryRunBadge' | translate }}</span>

            </p>

            <ul class="linhas">

              <li *ngFor="let l of lastResult.linhas">

                {{ 'goLive.import.linha' | translate:{ n: l.linha + '', status: l.status, msg: l.mensagem } }}

              </li>

            </ul>

          </div>

        </p-tabPanel>

      </p-tabView>

    </div>

  `,

  styles: [`

    :host {
      display: block;
      flex: 1;
      min-height: 0;
      width: 100%;
    }

    .go-live-page {
      width: 100%;
      max-width: none;
      margin: 0;
      box-sizing: border-box;
      padding-bottom: 1.5rem;
    }

    :host ::ng-deep .go-live-page > .p-tabview {
      width: 100%;
    }

    :host ::ng-deep .go-live-page .p-tabview-panels {
      width: 100%;
      padding-top: 0.75rem;
    }

    .intro { margin-bottom: 1rem; color: #475569; line-height: 1.5; max-width: 72rem; }

    .checklist-progress-card {

      margin-bottom: 1rem;

      padding: 0.85rem 1rem;

      border: 1px solid var(--surface-border, #e2e8f0);

      border-radius: 10px;

      background: var(--surface-card, #fff);

    }

    .checklist-progress-head {

      display: flex;

      flex-wrap: wrap;

      align-items: center;

      justify-content: space-between;

      gap: 0.5rem 1rem;

      margin-bottom: 0.55rem;

    }

    .checklist-progress-label {

      font-size: 0.9375rem;

      font-weight: 700;

      color: #0f172a;

    }

    .auto-save-status {

      display: inline-flex;

      align-items: center;

      gap: 0.35rem;

      font-size: 0.8rem;

      font-weight: 500;

    }

    .auto-save-status--saving { color: #64748b; }

    .auto-save-status--saved { color: #15803d; }

    .auto-save-status--error { color: #b45309; }

    :host ::ng-deep .checklist-progress-card .p-progressbar {

      height: 0.55rem;

      border-radius: 999px;

    }

    :host ::ng-deep .checklist-progress-card .p-progressbar-value {

      background: linear-gradient(90deg, #2563eb, #16a34a);

    }

    :host ::ng-deep .go-live-weeks-accordion {

      display: flex;

      flex-direction: column;

      gap: 0.65rem;

    }

    :host ::ng-deep .go-live-weeks-accordion .p-accordion-tab {

      border: 1px solid var(--surface-border, #e2e8f0);

      border-radius: 10px;

      overflow: hidden;

      margin-bottom: 0;

    }

    :host ::ng-deep .go-live-weeks-accordion .p-accordion-header-link {

      padding: 0.75rem 1rem;

      border: none;

      background: var(--surface-ground, #f8fafc);

    }

    :host ::ng-deep .go-live-weeks-accordion .p-accordion-content {

      padding: 0.75rem 1rem 1rem;

      border: none;

    }

    .week-acc-head {

      display: flex;

      align-items: center;

      justify-content: space-between;

      gap: 0.75rem;

      width: 100%;

    }

    .week-acc-title {

      font-size: 0.9375rem;

      font-weight: 700;

      color: #0f172a;

    }

    .week-acc-badge {

      font-size: 0.75rem;

      font-weight: 600;

      padding: 0.15rem 0.55rem;

      border-radius: 999px;

      background: #fef3c7;

      color: #92400e;

      white-space: nowrap;

    }

    .week-acc-badge--done {

      background: #dcfce7;

      color: #166534;

    }

    .checklist-items {

      margin: 0;

      padding: 0;

      list-style: none;

    }

    .checklist-items li {

      display: flex;

      flex-wrap: wrap;

      align-items: center;

      gap: 0.5rem;

      margin-bottom: 0.55rem;

      font-size: 0.9rem;

      padding: 0.35rem 0.25rem;

      border-radius: 6px;

      transition: opacity 0.15s ease;

    }

    .checklist-items li:last-child { margin-bottom: 0; }

    .checklist-item--done {

      opacity: 0.72;

    }

    .checklist-items label {

      flex: 1;

      min-width: 0;

      line-height: 1.4;

      cursor: pointer;

    }

    .checklist-label--done {

      color: #64748b;

      text-decoration: line-through;

      text-decoration-color: rgba(100, 116, 139, 0.55);

    }

    .checklist-link { font-size: 0.8rem; margin-left: auto; color: #0369a1; }

    .template-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1rem;
      width: 100%;
    }

    .template-card { border: 1px solid var(--surface-border); border-radius: 8px; padding: 1rem; }

    .template-card .file { font-size: 0.85rem; color: #475569; }

    .import-form { display: flex; flex-direction: column; gap: 0.75rem; width: 100%; max-width: none; }

    .import-form textarea { font-family: monospace; font-size: 0.85rem; }

    .dry-run { display: flex; align-items: center; gap: 0.5rem; }

    .result { margin-top: 1.5rem; padding: 1rem; background: var(--surface-100); border-radius: 8px; }

    .linhas { max-height: 240px; overflow: auto; font-size: 0.85rem; padding-left: 1.2rem; }

  `]

})

export class GoLiveMigracaoComponent implements OnInit, OnDestroy {

  private svc = inject(GoLiveMigracaoService);

  private i18n = inject(TranslationService);

  private toast = inject(MessageService);

  private saveDebounce?: ReturnType<typeof setTimeout>;

  private savedFadeTimer?: ReturnType<typeof setTimeout>;



  checklist: GoLiveChecklistItem[] = [];

  templates: GoLiveTemplateInfo[] = [];

  csvText = '';

  dryRun = true;

  importing = false;

  importKind: GoLiveImportKind = 'clientes-proposta';

  lastResult: GoLiveImportResult | null = null;

  autoSaveStatus: AutoSaveStatus = 'idle';

  weekAccordionIndex = 0;



  importKinds: { label: string; value: GoLiveImportKind }[] = [];



  get weeks(): number[] {

    return [...new Set(this.checklist.map(c => c.week))].sort((a, b) => a - b);

  }



  get progressPercent(): number {

    if (!this.checklist.length) return 0;

    const done = this.checklist.filter(c => c.concluido).length;

    return Math.round((done / this.checklist.length) * 100);

  }



  ngOnInit(): void {

    this.importKinds = [

      { label: this.i18n.translate('goLive.import.clientes'), value: 'clientes-proposta' },

      { label: this.i18n.translate('goLive.import.fcu'), value: 'fcu' },

      { label: this.i18n.translate('goLive.import.externos'), value: 'usuarios-externos' },

      { label: this.i18n.translate('goLive.import.fornecedores'), value: 'fornecedores' },

      { label: this.i18n.translate('goLive.import.treinamentos'), value: 'treinamentos' },

      { label: this.i18n.translate('goLive.import.documentosSgq'), value: 'documentos-sgq' },

      { label: this.i18n.translate('goLive.import.calibracao'), value: 'calibracao' },

      { label: this.i18n.translate('goLive.import.naoConformidades'), value: 'nao-conformidades' }

    ];

    this.svc.checklist().subscribe(c => {

      this.checklist = c ?? [];

      this.syncWeekAccordion();

    });

    this.svc.templates().subscribe(t => (this.templates = t ?? []));

  }



  ngOnDestroy(): void {

    if (this.saveDebounce) clearTimeout(this.saveDebounce);

    if (this.savedFadeTimer) clearTimeout(this.savedFadeTimer);

  }



  itemsByWeek(week: number): GoLiveChecklistItem[] {

    return this.checklist.filter(c => c.week === week).sort((a, b) => a.order - b.order);

  }



  weekProgress(week: number): { done: number; total: number } {

    const items = this.itemsByWeek(week);

    return {

      done: items.filter(i => i.concluido).length,

      total: items.length

    };

  }



  get currentWeek(): number {

    for (const week of this.weeks) {

      if (this.itemsByWeek(week).some(item => !item.concluido)) {

        return week;

      }

    }

    return this.weeks[this.weeks.length - 1] ?? 1;

  }



  private syncWeekAccordion(): void {

    const idx = this.weeks.indexOf(this.currentWeek);

    this.weekAccordionIndex = idx >= 0 ? idx : 0;

  }



  onChecklistItemChange(): void {

    if (this.saveDebounce) clearTimeout(this.saveDebounce);

    this.autoSaveStatus = 'saving';

    this.saveDebounce = setTimeout(() => this.salvarChecklist(true), 500);

  }



  download(id: string): void {

    this.svc.downloadTemplate(id).subscribe({

      next: blob => {

        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');

        a.href = url;

        a.download = `${id}.csv`;

        a.click();

        URL.revokeObjectURL(url);

      }

    });

  }



  onFile(ev: Event): void {

    const input = ev.target as HTMLInputElement;

    const file = input.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {

      this.csvText = String(reader.result ?? '');

    };

    reader.readAsText(file, 'UTF-8');

  }



  salvarChecklist(silent = false): void {

    const itens = this.checklist

      .filter(c => c.itemKey)

      .map(c => ({ itemKey: c.itemKey!, concluido: !!c.concluido }));

    this.svc.salvarChecklist(itens).subscribe({

      next: rows => {

        this.checklist = rows ?? [];

        this.syncWeekAccordion();

        this.autoSaveStatus = 'saved';

        if (this.savedFadeTimer) clearTimeout(this.savedFadeTimer);

        this.savedFadeTimer = setTimeout(() => {

          if (this.autoSaveStatus === 'saved') {

            this.autoSaveStatus = 'idle';

          }

        }, 3500);

        if (!silent) {

          this.toast.add({ severity: 'success', summary: this.i18n.translate('goLive.checklist.saved') });

        }

      },

      error: err => {

        this.autoSaveStatus = 'error';

        if (!silent) {

          this.toast.add({

            severity: 'error',

            summary: this.i18n.translateApiError(err?.error, 'goLive.checklist.saveErr')

          });

        }

      }

    });

  }



  runImport(): void {

    this.importing = true;

    this.svc.import(this.importKind, { csv: this.csvText, dryRun: this.dryRun }).subscribe({

      next: res => {

        this.lastResult = res;

        this.importing = false;

        this.toast.add({

          severity: res.erros > 0 ? 'warn' : 'success',

          summary: this.i18n.translate(res.erros > 0 ? 'goLive.import.err' : 'goLive.import.ok')

        });

      },

      error: () => {

        this.importing = false;

        this.toast.add({ severity: 'error', summary: this.i18n.translate('goLive.import.err') });

      }

    });

  }

}


