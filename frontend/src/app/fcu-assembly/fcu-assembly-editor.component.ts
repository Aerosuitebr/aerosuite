import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewEncapsulation
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  trigger,
  state,
  style,
  transition,
  animate
} from '@angular/animations';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';
import { FcuAssemblyService } from '../core/fcu-assembly.service';
import { MessageService } from 'primeng/api';
import {
  FcuAssemblyDoc,
  AssemblySection,
  AssemblyStep,
  StepKind
} from '../types/fcu-assembly-types';

// PrimeNG
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { CardModule } from 'primeng/card';
import { PanelModule } from 'primeng/panel';
import { AccordionModule } from 'primeng/accordion';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ButtonModule } from 'primeng/button';
import { ChipsModule } from 'primeng/chips';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ProgressBarModule } from 'primeng/progressbar';
import { BlockUIModule } from 'primeng/blockui';
import { FileUploadModule } from 'primeng/fileupload';
import { TooltipModule } from 'primeng/tooltip';
import { TranslatePipe } from '../core/translate.pipe';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';
import { TranslationService } from '../core/translation.service';
import { toastKey } from '../core/toast-i18n.util';
import * as mammoth from 'mammoth';
import { FCU_WORD_IMPORT_STYLE_MAP } from '../core/domain/fcu-word-import-styles.data';
import { FCU_ASSEMBLY_DEFAULT_COMPANY } from '../core/domain/branding-defaults.data';
import {
  FCU_ASSEMBLY_LOCAL_LEXICON,
  applyAssemblyLabelFixes,
  inferAssemblyStepKind
} from '../core/domain/fcu-assembly-local-lexicon.data';

@Component({
  selector: 'app-fcu-assembly-editor',
  standalone: true,
  templateUrl: './fcu-assembly-editor.component.html',
  styleUrls: ['./fcu-assembly-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('fadeInOut', [
      state('in', style({ opacity: 1, transform: 'scale(1)' })),
      state('out', style({ opacity: 0, transform: 'scale(0.8)' })),
      transition('out => in', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('300ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition('in => out', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.8)' }))
      ])
    ]),
    trigger('progressAnimation', [
      state('start', style({ width: '0%' })),
      state('end', style({ width: '100%' })),
      transition('start => end', [
        animate('2000ms ease-in-out', style({ width: '100%' }))
      ])
    ])
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ToastModule,
    DialogModule,
    DropdownModule,
    CardModule,
    PanelModule,
    AccordionModule,
    InputTextModule,
    InputTextareaModule,
    ButtonModule,
    ChipsModule,
    ProgressSpinnerModule,
    ProgressBarModule,
    BlockUIModule,
    FileUploadModule,
    TooltipModule,
    TranslatePipe,
    PageHeroComponent
  ],
})
export class FcuAssemblyEditorComponent implements OnInit {
  fb = inject(FormBuilder);
  api = inject(FcuAssemblyService);
  messageService = inject(MessageService);
  cdr = inject(ChangeDetectorRef);
  translationService = inject(TranslationService);

  form!: FormGroup;
  activeSectionIndex = 0;
  lastSavedAt: string | null = null;
  lastId: number | null = null;
  preview = signal(false);

  // Documentos salvos
  savedDocuments: any[] = [];
  selectedDocumentId: number | null = null;

  // Tradução
  translating = false;
  translationCancelled = false; // Flag para cancelamento
  showLanguageDialog = false;
  showNoContentDialog = false;
  selectedLanguage: string | null = null;
  
  // Animação moderna de tradução
  translationProgress = 0;
  currentTranslationStep = 0;
  translationSteps: Array<{
    id: number;
    name: string;
    description: string;
    icon: string;
    completed: boolean;
    active: boolean;
  }> = [];

  // Editor de Texto Modal
  showTextEditor = false;
  editorContent = '';
  editorTitle = '';
  currentFormControl: any = null;
  progressAnimationState = 'start';

  private readonly languageCodes = ['pt', 'en', 'es', 'fr', 'de'] as const;

  get languageOptions() {
    return this.languageCodes.map((code) => ({
      value: code,
      label: this.translationService.translate(`assembly.lang.${code}`)
    }));
  }

  get kindOptions() {
    return [
      { label: this.translationService.translate('assembly.kind.step'), value: 'step' },
      { label: this.translationService.translate('assembly.kind.note'), value: 'note' },
      { label: this.translationService.translate('assembly.kind.caution'), value: 'caution' },
      { label: this.translationService.translate('assembly.kind.warning'), value: 'warning' },
      { label: this.translationService.translate('assembly.kind.table'), value: 'table' },
      { label: this.translationService.translate('assembly.kind.figure'), value: 'figure' }
    ];
  }

  private _sectionsLength = 0;
  get sectionsLength(): number {
    return this._sectionsLength;
  }

  private _currentSectionSteps: FormArray<FormGroup<any>> | null = null;
  get currentSectionSteps(): FormArray<FormGroup<any>> | null {
    if (!this._currentSectionSteps && this.sections().length > 0) {
      this._currentSectionSteps = this.steps(this.activeSectionIndex);
    }
    return this._currentSectionSteps;
  }

  // cache para cabeçalhos
  private stepHeaderCache = new Map<string, string>();

  ngOnInit(): void {
    this.rebuildTranslationSteps();
    this.form = this.fb.group({
      company: this.fc(''),
      certificate: this.fc(''),
      title: this.fc(''),
      pn: this.fc(''),
      sn: this.fc(''),
      model: this.fc(''),
      date: this.fc(''),
      os: this.fc(''),
      client: this.fc(''),
      manual: this.fc(''),
      revision: this.fc(''),
      revisionDate: this.fc(''),
      ata: this.fc(''),
      pages: this.fb.control<number | null>(null),
      observations: this.fc(''),
      sections: this.fb.array<FormGroup<any>>([])
    });

    this._sectionsLength = this.sections().length;
    // Só definir currentSectionSteps se houver seções
    if (this.sections().length > 0) {
    this._currentSectionSteps = this.steps(this.activeSectionIndex);
    } else {
      this._currentSectionSteps = null;
    }
    this.cdr.markForCheck();
    
    // Carregar documentos salvos
    this.loadSavedDocuments();
  }

  // ===== Helpers de formulário =====
  fc<T = string>(value: T | null = null, required = false) {
    return new FormControl<T | null>(value, required ? Validators.required : []);
  }

  sections(): FormArray<FormGroup<any>> {
    return this.form.get('sections') as FormArray<FormGroup<any>>;
  }

  steps(sectionIndex: number): FormArray<FormGroup<any>> | null {
    if (this.sections().length === 0 || sectionIndex < 0 || sectionIndex >= this.sections().length) {
      return null;
    }
    return this.sections().at(sectionIndex).get('steps') as FormArray<FormGroup<any>>;
  }

  makeSection(id = '', title = ''): FormGroup<any> {
    return this.fb.group({
      id: this.fc(id, true),
      title: this.fc(title, true),
      steps: this.fb.array<FormGroup<any>>([this.makeStep()])
    });
  }

  makeStep(kind: StepKind = 'step', code = '', title = '', text = '', refs: string[] = [], imageData = '', imageType = '') {
    return this.fb.group({
      kind: this.fc<StepKind>(kind, true),
      code: this.fc(code),
      title: this.fc(title),
      text: this.fc(text, true),
      refs: this.fb.control<string[]>(refs),
      imageData: this.fc(imageData),
      imageType: this.fc(imageType)
    });
  }

  trackBySection(index: number, section: any): any {
    return section.value?.id || index;
  }

  trackByStep(index: number, step: any): any {
    return step.value?.code || index;
  }

  private clearCaches() {
    this._currentSectionSteps = null;
    this.stepHeaderCache.clear();
  }

  getStepRefs(step: any): string[] {
    const refs = step.get('refs')?.value;
    return refs && Array.isArray(refs) ? refs : [];
  }

  getStepText(step: any): string {
    const text = step.get('text')?.value;
    return text || '';
  }

  getFormObservations(): string {
    return this.form.value?.observations || '';
  }

  addSection() {
    this.sections().push(
      this.makeSection(
        'sec-' + (this.sections().length + 1),
        this.translationService.translate('assembly.section.newTitle')
      )
    );
    this.activeSectionIndex = this.sections().length - 1;
    this._sectionsLength = this.sections().length;
    this._currentSectionSteps = this.steps(this.activeSectionIndex);
    this.clearCaches();
    this.cdr.markForCheck();
  }

  addStep() {
    const stepsArray = this.steps(this.activeSectionIndex);
    if (stepsArray) {
      stepsArray.push(this.makeStep());
    this.clearCaches();
    this.cdr.markForCheck();
    }
  }

  removeStep(i: number) {
    const stepsArray = this.steps(this.activeSectionIndex);
    if (stepsArray) {
      stepsArray.removeAt(i);
    this.clearCaches();
    this.cdr.markForCheck();
    }
  }

  moveStepUp(i: number) {
    if (i <= 0) return;
    const arr = this.steps(this.activeSectionIndex);
    if (arr) {
    const ctrl = arr.at(i);
    arr.removeAt(i);
    arr.insert(i - 1, ctrl);
    this.clearCaches();
    this.cdr.markForCheck();
    }
  }

  moveStepDown(i: number) {
    const arr = this.steps(this.activeSectionIndex);
    if (arr && i < arr.length - 1) {
    const ctrl = arr.at(i);
    arr.removeAt(i);
    arr.insert(i + 1, ctrl);
    this.clearCaches();
    this.cdr.markForCheck();
    }
  }

  stepHeader(val: AssemblyStep, i: number): string {
    const cacheKey = `${val?.kind || 'step'}-${val?.code || ''}-${val?.title || ''}-${i}`;
    if (this.stepHeaderCache.has(cacheKey)) {
      return this.stepHeaderCache.get(cacheKey)!;
    }
    const tag = this.translationService.translate(`assembly.stepKind.${val?.kind || 'step'}`);
    const code = val?.code ? ` ${val.code}` : '';
    const title = val?.title ? ` — ${val.title}` : '';
    const result = `${tag}${code}${title}`;
    this.stepHeaderCache.set(cacheKey, result);
    return result;
  }

  togglePreview() {
    const newPreviewState = !this.preview();
    this.preview.update(() => newPreviewState);
    this.cdr.markForCheck();
    toastKey(
      this.messageService,
      this.translationService,
      'info',
      newPreviewState ? 'assembly.toast.previewModeTitle' : 'assembly.toast.editModeTitle',
      newPreviewState ? 'assembly.toast.previewModeDetail' : 'assembly.toast.editModeDetail',
      undefined,
      3000
    );
  }

  // ===================== Tradução =====================
  
  // Método para cancelar tradução
  cancelTranslation() {
    if (this.translating) {
      this.translationCancelled = true;
      this.translating = false;
      this.resetTranslationAnimation();
      toastKey(this.messageService, this.translationService, 'warn', 'assembly.toast.translationCancelledTitle', 'assembly.toast.translationCancelledDetail', undefined, 3000);
      this.cdr.markForCheck();
    }
  }
  
  async translateAll() {
    
    if (this.translating) {
      return;
    }
    
    // Resetar flag de cancelamento
    this.translationCancelled = false;

    if (!this.selectedLanguage) {
      toastKey(this.messageService, this.translationService, 'warn', 'assembly.toast.languageNotSelectedTitle', 'assembly.toast.languageNotSelectedDetail');
      this.showLanguageDialog = true;
      return;
    }

    // Verificar se há conteúdo para traduzir
    const title = this.form.get('title')?.value || '';
    const obs = this.form.get('observations')?.value || '';
    const sectionsFA = this.sections();
    
    // Verificar se há seções com conteúdo
    let hasContent = false;
    if (title.trim() || obs.trim()) {
      hasContent = true;
    }
    
    // Verificar seções e passos
    for (let i = 0; i < sectionsFA.controls.length; i++) {
      const sectionCtrl = sectionsFA.controls[i];
      const sectionTitle = sectionCtrl.get('title')?.value || '';
      
      if (sectionTitle.trim()) {
        hasContent = true;
        break;
      }
      
      const stepsFA = sectionCtrl.get('steps') as FormArray<FormGroup<any>>;
      for (let j = 0; j < stepsFA.controls.length; j++) {
        const stepCtrl = stepsFA.controls[j];
        const stTitle = stepCtrl.get('title')?.value || '';
        const stText = stepCtrl.get('text')?.value || '';
        
        if (stTitle.trim() || stText.trim()) {
          hasContent = true;
          break;
        }
      }
      
      if (hasContent) break;
    }
    
    if (!hasContent) {
      this.showNoContentDialog = true;
      this.cdr.markForCheck();
      return;
    }


    // Inicializar animação
    this.initializeTranslationAnimation();

    this.translating = true;
    toastKey(this.messageService, this.translationService, 'info', 'assembly.toast.translatingTitle', 'assembly.toast.translatingDetail', undefined, 4000);

    try {
      // Otimização: Reduzir delays para acelerar o processo
      const baseDelay = 200; // Delay reduzido de 900ms para 200ms
      const minDelay = 100; // Delay mínimo para itens pequenos
      
      // Passo 1: Analisando documento
      await this.updateTranslationStep(0, this.translationService.translate('assembly.translation.progress.analyzingDoc'));
      await this.delay(baseDelay);
      if (this.translationCancelled) return;

      // Passo 2: Detectando idioma
      await this.updateTranslationStep(1, this.translationService.translate('assembly.translation.progress.detectingLang'));
      const srcLang = await this.guessSourceLanguageForDoc();
      const sourceLang = srcLang === this.selectedLanguage ? 'en' : srcLang; // fallback comum p/ manuais
      await this.delay(minDelay);
      if (this.translationCancelled) return;

      // Passo 3: Traduzindo metadados (em paralelo para otimizar)
      await this.updateTranslationStep(2, this.translationService.translate('assembly.translation.progress.translatingMeta'));
      const title = this.form.get('title')?.value || '';
      const obs = this.form.get('observations')?.value || '';

      // Otimização: Traduzir título e observações em paralelo
      const translationPromises: Promise<void>[] = [];
      
      if (title && !this.translationCancelled) {
        translationPromises.push(
          this.translateText(title, this.selectedLanguage, sourceLang).then(t => {
            if (!this.translationCancelled && this.isValidTranslation(t, title)) {
              this.form.get('title')?.setValue(this.postFixLabels(t));
            }
          })
        );
      }
      
      if (obs && !this.translationCancelled) {
        translationPromises.push(
          this.translateText(obs, this.selectedLanguage, sourceLang).then(t => {
            if (!this.translationCancelled && this.isValidTranslation(t, obs)) {
              this.form.get('observations')?.setValue(this.postFixLabels(t));
            }
          })
        );
      }
      
      await Promise.all(translationPromises);
      if (this.translationCancelled) return;
      await this.delay(minDelay);

      // Passo 4: Processando seções (otimizado com menos delays)
      await this.updateTranslationStep(3, this.translationService.translate('assembly.translation.progress.translatingSections'));
      const sectionsFA = this.sections();
      
      // Otimização: Delay reduzido significativamente
      const dynamicDelay = minDelay; // Usar delay mínimo ao invés de calcular dinamicamente
      
      for (let i = 0; i < sectionsFA.controls.length; i++) {
        if (this.translationCancelled) return;
        
        const sectionCtrl = sectionsFA.controls[i];
        const sectionTitle = sectionCtrl.get('title')?.value || '';
        
        if (sectionTitle && !this.translationCancelled) {
          const translated = await this.translateText(sectionTitle, this.selectedLanguage, sourceLang);
          if (this.translationCancelled) return;
          if (this.isValidTranslation(translated, sectionTitle)) {
            sectionCtrl.get('title')?.setValue(this.postFixLabels(translated));
          }
        }

        const stepsFA = sectionCtrl.get('steps') as FormArray<FormGroup<any>>;
        
        // Otimização: Traduzir títulos e textos em paralelo quando possível
        for (let j = 0; j < stepsFA.controls.length; j++) {
          if (this.translationCancelled) return;
          
          const stepCtrl = stepsFA.controls[j];
          const stTitle = stepCtrl.get('title')?.value || '';
          const stText = stepCtrl.get('text')?.value || '';

          // Traduzir título e texto em paralelo para otimizar
          const stepPromises: Promise<void>[] = [];
          
          if (stTitle && !this.translationCancelled) {
            stepPromises.push(
              this.translateText(stTitle, this.selectedLanguage, sourceLang).then(tt => {
                if (!this.translationCancelled && this.isValidTranslation(tt, stTitle)) {
                  stepCtrl.get('title')?.setValue(this.postFixLabels(tt));
                }
              })
            );
          }

          if (stText && !this.translationCancelled) {
            stepPromises.push(
              this.translateBlockSmart(stText, this.selectedLanguage!, sourceLang).then(tx => {
                if (!this.translationCancelled && this.isValidTranslation(tx, stText)) {
                  stepCtrl.get('text')?.setValue(this.postFixLabels(tx));
                }
              })
            );
          }
          
          await Promise.all(stepPromises);
          if (this.translationCancelled) return;
        }
      }

      // Passo 5: Convertendo passos
      await this.updateTranslationStep(4, this.translationService.translate('assembly.translation.progress.translatingSteps'));
      await this.delay(minDelay);
      if (this.translationCancelled) return;

      // Passo 6: Finalizando tradução
      await this.updateTranslationStep(5, this.translationService.translate('assembly.translation.progress.finalizing'));
      await this.delay(minDelay);
      if (this.translationCancelled) return;

      toastKey(this.messageService, this.translationService, 'success', 'assembly.toast.translationDoneTitle', 'assembly.toast.translationDoneDetail', {
        language: String(this.getLanguageName(this.selectedLanguage))
      }, 4000);
        this.cdr.markForCheck();
    } catch (err) {
        console.error('❌ Failed to translate:', err);
      toastKey(this.messageService, this.translationService, 'warn', 'assembly.toast.partialTranslationTitle', 'assembly.toast.partialTranslationDetail', undefined, 6000);
    } finally {
      if (!this.translationCancelled) {
        this.translating = false;
        this.resetTranslationAnimation();
      }
      this.translationCancelled = false; // Resetar flag
      }
  }

  private rebuildTranslationSteps(): void {
    const icons = ['pi pi-search', 'pi pi-globe', 'pi pi-file-text', 'pi pi-list', 'pi pi-cog', 'pi pi-check'];
    this.translationSteps = [1, 2, 3, 4, 5, 6].map((id, index) => ({
      id,
      name: this.translationService.translate(`assembly.translation.step${id}.name`),
      description: this.translationService.translate(`assembly.translation.step${id}.desc`),
      icon: icons[index] ?? 'pi pi-circle',
      completed: false,
      active: false
    }));
  }

  // ===================== Métodos de Animação de Tradução =====================
  
  private initializeTranslationAnimation() {
    this.translationProgress = 0;
    this.currentTranslationStep = 0;
    this.translationCancelled = false; // Resetar flag ao iniciar
    this.translationSteps.forEach(step => {
      step.completed = false;
      step.active = false;
    });
    this.cdr.markForCheck();
  }

  private async updateTranslationStep(stepIndex: number, description: string) {
    // Marcar passo anterior como completo
    if (stepIndex > 0) {
      this.translationSteps[stepIndex - 1].completed = true;
      this.translationSteps[stepIndex - 1].active = false;
    }

    // Ativar passo atual
    this.translationSteps[stepIndex].active = true;
    this.translationSteps[stepIndex].description = description;
    
    // Atualizar progresso
    this.translationProgress = Math.round(((stepIndex + 1) / this.translationSteps.length) * 100);
    this.currentTranslationStep = stepIndex + 1;
    
    this.cdr.markForCheck();
  }

  private resetTranslationAnimation() {
    this.translationProgress = 0;
    this.currentTranslationStep = 0;
    this.translationSteps.forEach(step => {
      step.completed = false;
      step.active = false;
    });
    this.cdr.markForCheck();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Traduz texto preservando separadores de tabela e quebras de linha.
   * Divide em linhas; para linhas com '|', divide em células e traduz cada célula relevante.
   */
  private async translateBlockSmart(text: string, targetLang: string, sourceLang: string): Promise<string> {
    if (!text?.trim()) return text;
    if (this.translationCancelled) return text; // Verificar cancelamento

    const lines = text.split(/\r?\n/);
    const out: string[] = [];

    for (const line of lines) {
      if (this.translationCancelled) break; // Verificar cancelamento a cada linha
      
      if (!line.trim()) {
        out.push(line);
        continue;
      }

      if (line.includes('|')) {
        const cells = line.split('|');
        const transCells: string[] = [];
        for (let cell of cells) {
          if (this.translationCancelled) break; // Verificar cancelamento
          const trimmed = cell.trim();
          if (this.shouldTranslateCell(trimmed)) {
            const translated = await this.translateText(trimmed, targetLang, sourceLang);
            if (this.translationCancelled) break; // Verificar após tradução
            transCells.push(this.postFixLabels(translated));
          } else {
            transCells.push(cell); // mantém espaços/format.
          }
        }
        // reconstroi mantendo o mesmo espaçamento entre pipes
        out.push(transCells.join('|'));
      } else {
        // linha normal
        const translated = await this.translateText(line, targetLang, sourceLang);
        if (this.translationCancelled) break; // Verificar após tradução
        out.push(this.postFixLabels(translated));
      }
    }

    return out.join('\n');
  }

  /** Heurística para evitar traduzir códigos/valores puros. */
  private shouldTranslateCell(s: string): boolean {
    if (!s) return false;
    // contém alguma letra?
    const hasLetter = /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(s);
    if (!hasLetter) return false;
    // ignora códigos padrão tipo P/N, ATA, S/N isolados
    const mostlyCodes = /^(P\/N|S\/N|ATA|REV|REV\.?|REF\.?|FIG\.?|IPL|O\/S|DP\-F2|AEROSUITE|ANAC)\b/i.test(s);
    return !mostlyCodes;
  }

  /**
   * Tradução com opção de forçar o idioma de origem.
   */
  async translateText(text: string, targetLang: string, sourceLang: string = 'auto'): Promise<string> {
    
    if (!text || text.trim().length === 0) {
      return text;
    }

    // Endpoints alternativos mais confiáveis
    const endpoints = [
      {
        name: 'MyMemory API',
        url: 'https://api.mymemory.translated.net/get',
        method: 'GET',
        buildUrl: (text: string, source: string, target: string) => {
          const params = new URLSearchParams({
            q: text,
            langpair: `${source}|${target}`,
            format: 'json'
          });
          return `https://api.mymemory.translated.net/get?${params}`;
        },
        extractResponse: (data: any) => data.responseData?.translatedText || data.matches?.[0]?.translation
      },
      {
        name: 'Google Translate (via proxy)',
        url: 'https://translate.googleapis.com/translate_a/single',
        method: 'GET',
        buildUrl: (text: string, source: string, target: string) => {
          const params = new URLSearchParams({
            client: 'gtx',
            sl: source === 'auto' ? 'en' : source,
            tl: target,
            dt: 't',
            q: text
          });
          return `https://translate.googleapis.com/translate_a/single?${params}`;
        },
        extractResponse: (data: any) => data?.[0]?.map((item: any) => item[0]).join('')
      },
      {
        name: 'LibreTranslate DE',
        url: 'https://libretranslate.de/translate',
        method: 'POST',
        buildUrl: () => 'https://libretranslate.de/translate',
        extractResponse: (data: any) => data.translatedText
      }
    ];

    for (let i = 0; i < endpoints.length; i++) {
      const endpoint = endpoints[i];
      
      try {
        let response: Response;
        
        if (endpoint.method === 'GET') {
          const fullUrl = endpoint.buildUrl(text, sourceLang, targetLang);
          response = await fetch(fullUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
          });
        } else {
          response = await fetch(endpoint.url, {
        method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
              q: text.trim(),
              source: sourceLang,
              target: targetLang,
              format: 'text'
            })
          });
        }


        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        const translatedText = endpoint.extractResponse(data);
        
        // Validação rigorosa da resposta
        if (this.isValidTranslation(translatedText, text)) {
          return translatedText;
        } else {
        }
    } catch (e) {
        console.warn(`❌ Failure in ${endpoint.name}:`, e);
        if (i === endpoints.length - 1) {
          console.error('💥 Todos os endpoints falharam');
        }
      }
    }

    // Se todos falharem, tenta tradução local básica
    const localTranslation = this.getLocalTranslation(text, targetLang);
    if (localTranslation !== text && this.isValidTranslation(localTranslation, text)) {
      return localTranslation;
    }

      return text;
    }

  /** Valida se a resposta da API é uma tradução válida. */
  private isValidTranslation(translatedText: any, originalText: string): boolean {
    // Verifica se a resposta existe e é uma string
    if (!translatedText || typeof translatedText !== 'string') {
      return false;
    }

    const translated = translatedText.trim();
    
    // Verifica se não está vazia
    if (translated.length === 0) {
      return false;
    }

    // Verifica se não é igual ao texto original
    if (translated === originalText.trim()) {
      return false;
    }

    // Verifica se não contém mensagens de erro comuns
    const errorPatterns = [
      /invalid source language/i,
      /langpair=/i,
      /example:/i,
      /rfc3066/i,
      /languages supported/i,
      /no content/i,
      /error/i,
      /failed/i,
      /exception/i,
      /unknown/i
    ];

    for (const pattern of errorPatterns) {
      if (pattern.test(translated)) {
        return false;
      }
    }

    // Verifica se tem pelo menos algumas palavras traduzidas (não apenas códigos)
    const wordCount = translated.split(/\s+/).length;
    if (wordCount < 2 && translated.length < 10) {
      return false;
    }

    return true;
  }

  private getLocalTranslation(text: string, targetLang: string): string {
    if (targetLang !== 'pt') return text;

    let translatedText = text;
    Object.entries(FCU_ASSEMBLY_LOCAL_LEXICON).forEach(([english, portuguese]) => {
      const regex = new RegExp(`\\b${english}\\b`, 'gi');
      translatedText = translatedText.replace(regex, portuguese);
    });

    return translatedText;
  }

  /** Normaliza rótulos após a tradução (mantém padrão do manual). */
  private postFixLabels(s: string): string {
    return applyAssemblyLabelFixes(s);
  }

  /** Amostra partes do documento e detecta o idioma predominante. */
  private async guessSourceLanguageForDoc(): Promise<string> {
    try {
      const parts: string[] = [];
      const title = this.form.get('title')?.value || '';
      if (title) parts.push(title);

      const sectionsFA = this.sections();
      for (const section of sectionsFA.controls.slice(0, 2)) {
        const secTitle = section.get('title')?.value || '';
        if (secTitle) parts.push(secTitle);

        const stepsFA = section.get('steps') as FormArray<FormGroup<any>>;
        for (const step of stepsFA.controls.slice(0, 3)) {
          const t = step.get('text')?.value || '';
          if (t) parts.push(t);
        }
      }

      const sample = parts.join('\n').slice(0, 2000);
      const lang = await this.detectLanguage(sample);
      return lang || 'en';
    } catch {
      return 'en';
    }
  }

  getLanguageName(langCode: string): string {
    const language = this.languageOptions.find(lang => lang.value === langCode);
    return language ? language.label : langCode.toUpperCase();
  }

  // ===================== Salvamento =====================
  async save() {
    if (this.form.invalid) {
      toastKey(this.messageService, this.translationService, 'warn', 'assembly.toast.invalidFormTitle', 'assembly.toast.invalidFormDetail', undefined, 4000);
      return;
    }

    const payload: FcuAssemblyDoc = this.form.getRawValue() as any;
    

    if (!payload.title || !payload.sections || payload.sections.length === 0) {
      toastKey(this.messageService, this.translationService, 'warn', 'assembly.toast.emptyDocumentTitle', 'assembly.toast.emptyDocumentDetail', undefined, 4000);
      return;
    }

    toastKey(this.messageService, this.translationService, 'info', 'assembly.toast.savingTitle', 'assembly.toast.savingDetail', undefined, 3000);

    try {
      // Salvar diretamente sem detecção de idioma para evitar problemas
      if (this.lastId) {
        await firstValueFrom(this.api.update(this.lastId, payload));
        toastKey(this.messageService, this.translationService, 'success', 'assembly.toast.updatedTitle', 'assembly.toast.updatedDetail', undefined, 4000);
      } else {
        const id: any = await firstValueFrom(this.api.create(payload));
        this.lastId = typeof id === 'number' ? id : parseInt(id, 10);
        toastKey(this.messageService, this.translationService, 'success', 'assembly.toast.createdTitle', 'assembly.toast.createdDetail', undefined, 4000);
      }

      this.lastSavedAt = new Date().toLocaleString();

      // Recarregar lista de documentos após salvar
      await this.loadSavedDocuments();

    } catch (error: any) {
      console.error('Failed to save document:', error);
      console.error('Detailed error:', {
        message: error?.message,
        status: error?.status,
        statusText: error?.statusText,
        url: error?.url,
        error: error?.error
      });
      
      let errorMessage = this.translationService.translate('assembly.error.saveGeneric');

      if (error?.status === 400) {
        errorMessage = this.translationService.translate('assembly.error.saveInvalidData');
      } else if (error?.status === 500) {
        errorMessage = this.translationService.translate('assembly.error.saveServerError');
      } else if (error?.status === 0) {
        errorMessage = this.translationService.translate('assembly.error.saveConnection');
      }
      
      toastKey(this.messageService, this.translationService, 'error', 'assembly.toast.saveErrorTitle', 'assembly.toast.saveErrorDetail', {
        error: String(errorMessage)
      }, 5000);
    }
  }

  async detectLanguage(text: string): Promise<string> {
    
    const endpoints = [
      'https://libretranslate.de/detect',
      'https://translate.astian.org/detect',
      'https://libretranslate.com/detect'
    ];
    
    for (let i = 0; i < endpoints.length; i++) {
      const url = endpoints[i];
      
      try {
        const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text })
      });
        
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        
      const data = await res.json();
        
        const detectedLang = data[0]?.language || 'unknown';
        return detectedLang;
      } catch (e) {
        console.warn(`❌ Detection failed on endpoint ${url}:`, e);
        if (i === endpoints.length - 1) {
          console.error('💥 All detection endpoints failed');
        }
      }
    }
    
    return 'unknown';
  }

  goBack() {
    // Se estiver na pré-visualização, volta para o editor
    if (this.preview()) {
      this.preview.set(false);
      this.cdr.markForCheck();
    } else {
      // Se estiver no editor, volta para a página anterior
    history.back();
    }
  }

  // ===================== Editor de Texto Modal =====================
  openStepTextEditor(formControl: unknown): void {
    this.openTextEditor(formControl, this.translationService.translate('assembly.editor.stepText'));
  }

  openObservationsEditor(): void {
    this.openTextEditor(this.form.get('observations'), this.translationService.translate('assembly.editor.obsText'));
  }

  openTextEditor(formControl: any, title: string) {
    this.currentFormControl = formControl;
    this.editorTitle = title;
    this.showTextEditor = true;
    
    // Aguardar o modal abrir e então definir o conteúdo
    setTimeout(() => {
      const editorElement = document.querySelector('.rich-text-editor') as HTMLElement;
      if (editorElement) {
        // Converter texto para HTML preservando quebras de linha
        const htmlContent = this.convertTextToHtml(formControl.value || '');
        editorElement.innerHTML = htmlContent;
        this.editorContent = htmlContent;
        
        // Focar no editor
        editorElement.focus();
      }
    }, 100);
  }

  private convertTextToHtml(text: string): string {
    // Converter quebras de linha de texto para HTML
    return text.replace(/\n/g, '<br>');
  }

  closeTextEditor() {
    this.showTextEditor = false;
    this.editorContent = '';
    this.editorTitle = '';
    this.currentFormControl = null;
  }

  saveTextEditor() {
    if (this.currentFormControl) {
      // Converter HTML para texto com quebras de linha preservadas
      const textContent = this.convertHtmlToText(this.editorContent);
      this.currentFormControl.setValue(textContent);
      this.cdr.markForCheck();
    }
    this.closeTextEditor();
  }

  private convertHtmlToText(html: string): string {
    // Criar um elemento temporário para converter HTML para texto
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Converter quebras de linha HTML para quebras de linha de texto
    return temp.textContent || temp.innerText || '';
  }

  formatText(command: string) {
    document.execCommand(command, false);
  }

  onEditorInput(event: any) {
    // Apenas atualizar o conteúdo sem interferir no cursor
    this.editorContent = event.target.innerHTML || '';
  }

  onEditorPaste(event: ClipboardEvent) {
    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain') || '';
    document.execCommand('insertText', false, text);
  }

  getCharacterCount(): number {
    return this.editorContent.length;
  }

  // ===================== Importação (.docx) =====================
  importWord() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.docx';
    input.style.display = 'none';

    input.onchange = (event: any) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!/\.docx$/i.test(file.name)) {
        toastKey(this.messageService, this.translationService, 'warn', 'assembly.toast.unsupportedFormatTitle', 'assembly.toast.unsupportedFormatDetail');
        return;
      }

      this.processWordFile(file);
    };

    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  }

  private async processWordFile(file: File) {
    toastKey(this.messageService, this.translationService, 'info', 'assembly.toast.processingFileTitle', 'assembly.toast.processingFileDetail', {
      file: String(file.name)
    }, 3000);

    try {
      const arrayBuffer = await file.arrayBuffer();

      const styleMap = [...FCU_WORD_IMPORT_STYLE_MAP];

      const result = await mammoth.convertToHtml({ arrayBuffer }, { styleMap });

      const html: string = result?.value || '';
      const warnings = (result?.messages || []).filter((m: any) => m.type === 'warning');

      const importedDoc = this.fromHtmlToDocModel(html);
      this.applyImportedDoc(importedDoc);

      if (warnings.length) {
        toastKey(this.messageService, this.translationService, 'warn', 'assembly.toast.importWarningsTitle', 'assembly.toast.importWarningsDetail', {
          count: String(warnings.length)
        }, 5000);
      }

      toastKey(this.messageService, this.translationService, 'success', 'assembly.toast.importDoneTitle', 'assembly.toast.importDoneDetail', {
        file: String(file.name)
      }, 4000);
    } catch (error: any) {
      console.error('Failed to process Word file:', error);
      toastKey(this.messageService, this.translationService, 'error', 'assembly.toast.importErrorTitle', 'assembly.toast.importErrorDetail', {
        error: String(error?.message || this.translationService.translate('assembly.toast.importErrorDefault'))
      }, 5000);
    }
  }

  // ===================== Exportação =====================
  exportPdf() {
    toastKey(this.messageService, this.translationService, 'info', 'assembly.toast.generatingPdfTitle', 'assembly.toast.generatingPdfDetail', undefined, 3000);

    try {
      setTimeout(() => {
        const documentData = this.form.getRawValue();
        const defaultTitle = this.translationService.translate('assembly.export.defaultDocumentTitle');
        const title = documentData.title || defaultTitle;
        const fileName = `${title}_${new Date().toISOString().split('T')[0]}.pdf`;
        this.downloadFile(fileName, 'application/pdf', title);
      }, 2000);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      toastKey(this.messageService, this.translationService, 'error', 'assembly.toast.exportErrorTitle', 'assembly.toast.exportErrorDetail', undefined, 5000);
    }
  }

  private sanitizePdfText(text: string): string {
    return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }

  private downloadFile(fileName: string, mimeType: string, pdfTitle: string) {
    const pdfLabel = this.sanitizePdfText(pdfTitle);
    const content = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(${pdfLabel}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
297
%%EOF`;

    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);

    toastKey(this.messageService, this.translationService, 'success', 'assembly.toast.pdfExportedTitle', 'assembly.toast.pdfExportSuccess', undefined, 4000);
  }

  // ===================== HTML -> Modelo =====================
  private fromHtmlToDocModel(html: string): FcuAssemblyDoc {
    const dom = new DOMParser().parseFromString(html, 'text/html');

    const sections: AssemblySection[] = [];
    let current: AssemblySection | null = null;
    let stepCode = 1;

    const ensureSection = (title = this.translationService.translate('assembly.section.importedFromWord')): AssemblySection => {
      if (!current) {
        current = {
          id: this.slug(title),
          title,
          steps: []
        };
        sections.push(current);
        stepCode = 1;
      }
      return current;
    };

    const nodes = Array.from(dom.body.childNodes);

    for (const node of nodes) {
      if (!(node instanceof Element)) continue;

      const tag = node.tagName.toUpperCase();

      if (tag === 'H2') {
        const t =
          (node.textContent || '').trim() ||
          this.translationService.translate('assembly.import.defaultSectionTitle');
        current = {
          id: this.slug(t),
          title: t,
          steps: []
        };
        sections.push(current);
        stepCode = 1;
        continue;
      }

      if (/^H[3-6]$/.test(tag) || tag === 'P') {
        const text = (node.textContent || '').trim();
        if (!text) continue;

        const kind = this.inferKind(text, node);
        const title = this.extractTitle(text);
        const code = kind === 'step' ? String(stepCode++) : '';

        const sec = ensureSection();
        sec.steps.push({
          kind,
          code,
          title,
          text,
          refs: this.extractRefs(text)
        });
        continue;
      }

      if (tag === 'TABLE') {
        const sec = ensureSection();
        sec.steps.push({
          kind: 'table',
          code: '',
          title: 'Tabela',
          text: this.tableToText(node as HTMLTableElement),
          refs: []
        });
        continue;
      }

      if (tag === 'IMG' || node.querySelector('img')) {
        const img = tag === 'IMG'
            ? (node as HTMLImageElement)
            : (node.querySelector('img') as HTMLImageElement | null);
        const figureFallback = this.translationService.translate('assembly.stepKind.figure');
        const alt = (img?.alt || figureFallback).trim();

        const sec = ensureSection();
        sec.steps.push({
          kind: 'figure',
          code: '',
          title: alt || figureFallback,
          text: '',
          refs: []
        });
        continue;
      }
    }

    // Extrair informações do cabeçalho do documento
    const headerInfo = this.extractHeaderInfo(dom);
    
    const title =
      headerInfo.title ||
      this.form.get('title')?.value ||
      this.translationService.translate('assembly.export.defaultDocumentTitle');
    const company = headerInfo.company || this.form.get('company')?.value || FCU_ASSEMBLY_DEFAULT_COMPANY;

    return { 
      ...headerInfo,
      title, 
      company, 
      sections 
    };
  }

  private extractHeaderInfo(dom: Document): Partial<FcuAssemblyDoc> {
    const headerInfo: Partial<FcuAssemblyDoc> = {};

    // procurar em todas as tabelas das 3 primeiras páginas do doc
    const tables = Array.from(dom.querySelectorAll('table')).slice(0, 3);
    for (const tbl of tables) {
      const rows = Array.from(tbl.querySelectorAll('tr'));
      for (const row of rows) {
        const cells = Array.from(row.querySelectorAll('td,th'));
        if (cells.length < 1) continue;

        // Junta texto de todas as células (casos mesclados)
        const rowText = cells.map(c => c.textContent?.trim() || '').join(' | ').toLowerCase();

        this.mapHeaderLine(rowText, headerInfo);
      }
    }

    // Fallback: parágrafos iniciais
    Array.from(dom.querySelectorAll('p')).slice(0, 15).forEach(p => {
      const text = (p.textContent || '').trim().toLowerCase();
      this.mapHeaderLine(text, headerInfo);
    });

    return headerInfo;
  }

  /** Mapeia uma linha de texto de cabeçalho para o campo correspondente */
  /** Mapeia uma linha de texto de cabeçalho para o campo correspondente */
  private mapHeaderLine(text: string, out: Partial<FcuAssemblyDoc>) {
    const normalized = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").toLowerCase();
    const original = text.replace(/\s+/g, " ").trim();

    const rx = (re: RegExp) => {
      const match = normalized.match(re);
      if (!match) return undefined;

      // Reaplica no texto original para preservar capitalização
      const originalMatch = original.match(re);
      return originalMatch?.[1]?.trim();
    };

    out.company ??= rx(/empresa[:\-]?\s*(.+)/i);
    out.certificate ??= rx(/certificado[:\-]?\s*(.+)/i);
    out.title ??= rx(/t[ií]tulo[:\-]?\s*(.+)/i);

    // P/N e S/N juntos ou separados
    if (!out.pn || !out.sn) {
      const pnSn = normalized.match(/p\/?n[:\-]?\s*([a-z0-9\/\-]+)[^\w]+s\/?n[:\-]?\s*([a-z0-9\/\-]*)/i);
      if (pnSn) {
        const originalPnSn = original.match(/p\/?n[:\-]?\s*([a-z0-9\/\-]+)[^\w]+s\/?n[:\-]?\s*([a-z0-9\/\-]*)/i);
        if (originalPnSn) {
          out.pn ??= originalPnSn[1];
          if (originalPnSn[2]) out.sn ??= originalPnSn[2];
        }
      } else {
        out.pn ??= rx(/p\/?n[:\-]?\s*([a-z0-9\/\-]+)/i);
        const snOnly = normalized.match(/s\/?n[:\-]?\s*([a-z0-9\/\-]*)/i);
        if (snOnly && snOnly[1]) {
          const originalSn = original.match(/s\/?n[:\-]?\s*([a-z0-9\/\-]*)/i);
          if (originalSn && originalSn[1]) out.sn ??= originalSn[1];
        }
      }
    }

    out.model ??= rx(/model[o]?:?\s*([a-z0-9\-]+)/i);
    out.date ??= rx(/\b(?:data|date)[:\-]?\s*([0-9]{1,2}[\/\.\-][0-9]{1,2}[\/\.\-][0-9]{2,4}|[a-z]{3,9}\.?\s*\d{1,2},?\s*\d{4})/i);
    out.revisionDate ??= rx(/data\s+rev(?:is[aã]o)?[:\-]?\s*([0-9./\-]+|[a-z]{3,9}\.?\s*\d{1,2},?\s*\d{4})/i);

    // O/S com proteção contra falso positivo em "serviços"
    out.os ??= rx(/(?:^|\|)\s*o\/?s[:\-]?\s*([a-z0-9\-]{2,})\b/i);

    out.client ??= rx(/client[e]?:?\s*([a-z0-9\s]+)/i);

    // Manual + Revisão em linha composta
    if (!out.manual || !out.revision) {
      const manualLine = normalized.match(/manual[^:]*[:\-]?\s*([^|]*)\|?\s*rev\.?\s*([0-9.]+)/i);
      if (manualLine) {
        const originalManualLine = original.match(/manual[^:]*[:\-]?\s*([^|]*)\|?\s*rev\.?\s*([0-9.]+)/i);
        if (originalManualLine) {
          out.manual ??= originalManualLine[1].replace(/[*:]/g, "").trim();
          out.revision ??= originalManualLine[2].trim();
        }
      } else {
        out.manual ??= rx(/manual[:\-]?\s*(.+)/i);
        out.revision ??= rx(/rev(?:is[aã]o)?[:\-]?\s*([a-z0-9.]+)/i);
      }
    }

    out.ata ??= rx(/ata[:\-]?\s*([0-9.\-]+)/i);
    out.pages ??= parseInt(rx(/pag(?:ina|\.?)[:\-]?\s*(?:\d+\s*de\s*)?(\d+)/i) || "");
    out.observations ??= rx(/observacoes?[:\-]?\s*(.+)/i);
  }

  private extractFromText(text: string, headerInfo: Partial<FcuAssemblyDoc>): void {
    if (!text) return;

    const normalize = (t: string) =>
        t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim().toLowerCase();

    const clean = normalize(text);

    // Empresa
    if (!headerInfo.company) {
      const company = clean.match(/empresa[:\-]?\s*([a-z0-9\s]+)/i) || clean.match(/aerosuite\s+controls\s+servicos\s+aeronauticos/i);
      if (company) headerInfo.company = company[1]?.trim() || FCU_ASSEMBLY_DEFAULT_COMPANY;
    }

    // Certificado
    if (!headerInfo.certificate) {
      const cert = clean.match(/certificado[:\-]?\s*([a-z0-9\-\/]+)/i);
      if (cert) headerInfo.certificate = cert[1].trim();
    }

    // Título
    if (!headerInfo.title) {
      const title = clean.match(/titulo[:\-]?\s*(.+)/i);
      if (title) headerInfo.title = title[1].trim();
    }

    // P/N e S/N
    if (!headerInfo.pn || !headerInfo.sn) {
      const pnSnLine = clean.match(/p\/?n[:\-]?\s*([a-z0-9\/\-]+)[^\w]+s\/?n[:\-]?\s*([a-z0-9\/\-]*)/i);
      if (pnSnLine) {
        headerInfo.pn ??= pnSnLine[1];
        if (pnSnLine[2]) headerInfo.sn ??= pnSnLine[2];
      } else {
        const pnOnly = clean.match(/p\/?n[:\-]?\s*([a-z0-9\/\-]+)/i);
        const snOnly = clean.match(/s\/?n[:\-]?\s*([a-z0-9\/\-]*)/i);
        if (pnOnly) headerInfo.pn ??= pnOnly[1];
        if (snOnly && snOnly[1]) headerInfo.sn ??= snOnly[1];
      }
    }

    // Modelo
    if (!headerInfo.model) {
      const model = clean.match(/model[o]?:?\s*([a-z0-9\-]+)/i);
      if (model) headerInfo.model = model[1].trim();
    }

    // Data
    if (!headerInfo.date) {
      const date = clean.match(/\b(?:data|date)[:\-]?\s*([0-9]{1,2}[\/\.\-][0-9]{1,2}[\/\.\-][0-9]{2,4}|[a-z]{3,9}\.?\s*\d{1,2},?\s*\d{4})/i);
      if (date) headerInfo.date = date[1].trim();
    }

    // O/S
    if (!headerInfo.os) {
      const os = clean.match(/o\/?s[:\-]?\s*([a-z0-9\-]+)/i);
      if (os) headerInfo.os = os[1].trim();
    }

    // Cliente
    if (!headerInfo.client) {
      const client = clean.match(/client[e]?:?\s*([a-z0-9\s]+)/i);
      if (client && client[1]) headerInfo.client = client[1].trim();
    }

    // Manual + Revisão + Data Revisão
    if (!headerInfo.manual || !headerInfo.revision || !headerInfo.revisionDate) {
      const manualLine = clean.match(/manual[^:]*[:\-]?\s*([^|]*)\|?\s*rev\.?\s*([0-9.]+)\s*\|?\s*date[:\-]?\s*([a-z0-9.,\s]+)/i);
      if (manualLine) {
        if (!headerInfo.manual && manualLine[1]) headerInfo.manual = manualLine[1].replace(/[*:]/g, "").trim();
        if (!headerInfo.revision && manualLine[2]) headerInfo.revision = manualLine[2].trim();
        if (!headerInfo.revisionDate && manualLine[3]) headerInfo.revisionDate = manualLine[3].trim();
      }
    }

    // ATA
    if (!headerInfo.ata) {
      const ata = clean.match(/ata[:\-]?\s*([0-9.\-]+)/i);
      if (ata) headerInfo.ata = ata[1].trim();
    }

    // Páginas
    if (!headerInfo.pages) {
      const pages = clean.match(/pag(?:ina|\.?)[:\-]?\s*(?:\d+\s*de\s*)?(\d+)/i);
      if (pages) headerInfo.pages = parseInt(pages[1]);
    }

    // Observações
    if (!headerInfo.observations) {
      const obs = clean.match(/observacoes?[:\-]?\s*(.+)/i);
      if (obs) headerInfo.observations = obs[1].trim();
    }
  }



  private applyImportedDoc(doc: FcuAssemblyDoc) {
    this.form.patchValue({
      company: doc.company || this.form.get('company')?.value,
      certificate: doc.certificate || this.form.get('certificate')?.value,
      title: doc.title || this.form.get('title')?.value,
      pn: doc.pn || this.form.get('pn')?.value,
      sn: doc.sn || this.form.get('sn')?.value,
      model: doc.model || this.form.get('model')?.value,
      date: doc.date || this.form.get('date')?.value,
      os: doc.os || this.form.get('os')?.value,
      client: doc.client || this.form.get('client')?.value,
      manual: doc.manual || this.form.get('manual')?.value,
      revision: doc.revision || this.form.get('revision')?.value,
      revisionDate: doc.revisionDate || this.form.get('revisionDate')?.value,
      ata: doc.ata || this.form.get('ata')?.value,
      pages: doc.pages || this.form.get('pages')?.value,
      observations: doc.observations || this.form.get('observations')?.value
    });

    const sectionsFA = this.sections();
    sectionsFA.clear();

    for (const sec of doc.sections) {
      const secFG = this.makeSection(sec.id, sec.title);
      const stepsFA = secFG.get('steps') as FormArray<FormGroup<any>>;
      stepsFA.clear();

      for (const st of sec.steps) {
        stepsFA.push(this.makeStep(
            st.kind as StepKind,
            st.code || '',
            st.title || '',
            st.text || '',
            st.refs || []
        ));
      }

      sectionsFA.push(secFG);
    }

    this._sectionsLength = this.sections().length;
    this.activeSectionIndex = 0;
    this.clearCaches();
    this.cdr.markForCheck();
  }

  private inferKind(text: string, el: Element): StepKind {
    return inferAssemblyStepKind(text, el.tagName);
  }

  private extractTitle(text: string): string {
    const cleaned = text.replace(/^\s*\d+(\.|:|\))\s+/, '').trim();
    return cleaned.length > 120 ? cleaned.slice(0, 117) + '...' : cleaned;
  }

  private extractRefs(text: string): string[] {
    const refs = text.match(/\bREF[-_][A-Z0-9]+\b/gi) || [];
    return Array.from(new Set(refs));
  }

  private tableToText(tbl: HTMLTableElement): string {
    const rows = Array.from(tbl.querySelectorAll('tr'));
    const lines = rows.map(tr => {
      const cells = Array.from(tr.querySelectorAll('th,td')).map(td => (td.textContent || '').trim());
      return cells.join(' | ');
    });
    return lines.join('\n');
  }

  private slug(s: string): string {
    return (s || '')
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
  }

  // ===== 🔹 Gerenciamento de Documentos Salvos =====

  /**
   * Carrega a lista de documentos salvos para popular o select
   */
  async loadSavedDocuments(): Promise<void> {
    try {
      const documents = await firstValueFrom(this.api.list());
      this.savedDocuments = Array.isArray(documents) ? documents : [];
      
      // Se não há documentos, definir placeholder
      if (this.savedDocuments.length === 0) {
        this.savedDocuments = [];
      }
      
    } catch (error) {
      console.error('Failed to load saved documents:', error);
      this.savedDocuments = [];
    }
  }

  /**
   * Carrega um documento específico pelo ID
   */
  async loadDocument(documentId: number): Promise<void> {
    if (!documentId) {
      return;
    }

    try {
      toastKey(this.messageService, this.translationService, 'info', 'assembly.toast.loadingDocumentTitle', 'assembly.toast.loadingDocumentDetail', undefined, 3000);

      const document = await firstValueFrom(this.api.get(documentId)) as FcuAssemblyDoc;
      
      if (document) {
        // Preencher o formulário com os dados do documento
        this.form.patchValue({
          company: document.company,
          certificate: document.certificate,
          title: document.title,
          pn: document.pn,
          sn: document.sn,
          model: document.model,
          date: document.date,
          os: document.os,
          client: document.client,
          manual: document.manual,
          revision: document.revision,
          revisionDate: document.revisionDate,
          ata: document.ata,
          pages: document.pages,
          observations: document.observations
        });

        // Limpar seções existentes
        const sectionsArray = this.form.get('sections') as FormArray;
        sectionsArray.clear();

        // Adicionar seções do documento carregado
        if (document.sections && document.sections.length > 0) {
          document.sections.forEach((section: any) => {
            const sectionGroup = this.makeSection(section.id, section.title);
            const stepsArray = sectionGroup.get('steps') as FormArray;
            stepsArray.clear();

            if (section.steps && section.steps.length > 0) {
              section.steps.forEach((step: any) => {
                const stepGroup = this.makeStep(
                  step.kind as StepKind, 
                  step.code, 
                  step.title, 
                  step.text, 
                  step.refs,
                  step.imageData || '',
                  step.imageType || ''
                );
                stepsArray.push(stepGroup);
              });
            }

            sectionsArray.push(sectionGroup);
          });
        }

        // Atualizar índices e referências
        this._sectionsLength = sectionsArray.length;
        this._currentSectionSteps = this.steps(this.activeSectionIndex);
        this.lastId = documentId;
        this.selectedDocumentId = documentId;

        toastKey(this.messageService, this.translationService, 'success', 'assembly.toast.documentLoadedTitle', 'assembly.toast.documentLoadedDetail', {
          title: String((document as any).title || '')
        }, 4000);

        this.cdr.markForCheck();
      }
    } catch (error) {
      console.error('Failed to load document:', error);
      toastKey(this.messageService, this.translationService, 'error', 'assembly.toast.loadErrorTitle', 'assembly.toast.loadErrorDetail', undefined, 5000);
    }
  }
}
