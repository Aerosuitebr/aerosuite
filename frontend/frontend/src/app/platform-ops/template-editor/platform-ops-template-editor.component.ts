import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { InputSwitchModule } from 'primeng/inputswitch';
import { TranslatePipe } from '../../core/translate.pipe';
import { TranslationService } from '../../core/translation.service';
import { bustStaticAssetUrl } from '../../../environments/asset-cache-bust';
import {
  DEFAULT_HERO,
  DEFAULT_HERO_HEADLINE,
  DEFAULT_PREVIEW_VARS,
  HERO_CROP_ZOOM_MAX,
  HERO_CROP_ZOOM_MIN,
  HERO_TARGET_HEIGHT,
  HERO_TARGET_WIDTH,
  TemplateContentBlock,
  TemplateHeroConfig,
  TemplateVariableKey,
  TEMPLATE_VARIABLE_KEYS,
  buildHeroPreviewHtml,
  buildPreviewBodyHtml,
  composeBodyFromBlocks,
  composeBodyWithHero,
  computeSmartCropSettings,
  computeHeroPanLayout,
  applyHeroPanDelta,
  heroCropObjectPosition,
  interpolateTemplate,
  normalizeHeroConfig,
  parseBodyToBlocks,
  parseBodyWithHero,
  readHeroSourceFromFile,
  readHeroImageSize,
  renderHeroCrop
} from './template-editor.util';

type ActiveField = 'headline' | 'block';

@Component({
  selector: 'app-platform-ops-template-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule, InputSwitchModule, TranslatePipe],
  templateUrl: './platform-ops-template-editor.component.html',
  styleUrls: ['./platform-ops-template-editor.component.scss']
})
export class PlatformOpsTemplateEditorComponent implements OnInit, OnChanges {
  private i18n = inject(TranslationService);
  private sanitizer = inject(DomSanitizer);

  @ViewChild('heroFileInput') heroFileInput?: ElementRef<HTMLInputElement>;

  @Input() nameLabel = '';
  @Output() nameLabelChange = new EventEmitter<string>();

  @Input() subjectTemplate = '';
  @Output() subjectTemplateChange = new EventEmitter<string>();

  @Input() bodyTemplate = '';
  @Output() bodyTemplateChange = new EventEmitter<string>();

  @Input() plainText = false;
  @Input() previewVars: Record<string, string> = DEFAULT_PREVIEW_VARS;

  readonly variableKeys = TEMPLATE_VARIABLE_KEYS;
  readonly brandLogoUrl =
    typeof window !== 'undefined'
      ? bustStaticAssetUrl(`${window.location.origin}/assets/Aero_Claro.png`)
      : bustStaticAssetUrl('/assets/Aero_Claro.png');
  readonly heroTargetWidth = HERO_TARGET_WIDTH;
  readonly heroTargetHeight = HERO_TARGET_HEIGHT;
  readonly heroCropZoomMin = HERO_CROP_ZOOM_MIN;
  readonly heroCropZoomMax = HERO_CROP_ZOOM_MAX;

  hero: TemplateHeroConfig = { ...DEFAULT_HERO };
  blocks: TemplateContentBlock[] = [{ type: 'paragraph', text: '' }];
  activeBlockIndex = 0;
  activeField: ActiveField = 'block';
  heroDragOver = false;
  heroUploading = false;
  heroUploadError = '';
  heroSourceWidth = 0;
  heroSourceHeight = 0;
  heroPanning = false;
  private heroPanPointerId = -1;
  private heroPanStartX = 0;
  private heroPanStartY = 0;
  private heroPanStartFocusX = 50;
  private heroPanStartFocusY = 50;
  private heroPanFrameEl: HTMLElement | null = null;
  private cropRenderToken = 0;
  private cropDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  private syncingFromBody = false;

  ngOnInit(): void {
    this.syncFromBody(this.bodyTemplate);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['bodyTemplate'] && !changes['bodyTemplate'].firstChange) {
      this.syncFromBody(this.bodyTemplate);
    }
  }

  variableLabel(key: TemplateVariableKey): string {
    return this.i18n.translate(`platformOps.onboarding.var.${key}`);
  }

  onNameChange(value: string): void {
    this.nameLabel = value;
    this.nameLabelChange.emit(value);
  }

  onSubjectChange(value: string): void {
    this.subjectTemplate = value;
    this.subjectTemplateChange.emit(value);
  }

  onHeroToggle(enabled: boolean): void {
    this.hero.enabled = enabled;
    if (enabled && !this.hero.headline.trim()) {
      this.hero.headline = DEFAULT_HERO_HEADLINE;
    }
    this.emitBodyChange();
  }

  onHeroLayoutChange(layout: 'classic' | 'overlay'): void {
    this.hero.layout = layout;
    this.emitBodyChange();
  }

  onHeroHeadlineChange(): void {
    this.emitBodyChange();
  }

  setActiveField(field: ActiveField): void {
    this.activeField = field;
  }

  openHeroFilePicker(): void {
    this.heroFileInput?.nativeElement.click();
  }

  onHeroFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      this.heroUploadError = this.i18n.translate('platformOps.onboarding.wizard.heroInvalidType');
      return;
    }
    this.heroUploadError = '';
    this.heroUploading = true;
    readHeroSourceFromFile(file)
      .then(({ dataUrl, width, height }) => {
        const crop = computeSmartCropSettings(width, height);
        this.hero.sourceImageDataUrl = dataUrl;
        this.heroSourceWidth = width;
        this.heroSourceHeight = height;
        this.hero.cropZoom = crop.cropZoom ?? 1;
        this.hero.cropFocusX = crop.cropFocusX ?? 50;
        this.hero.cropFocusY = crop.cropFocusY ?? 50;
        return this.applyHeroCrop(true);
      })
      .catch(() => {
        this.heroUploadError = this.i18n.translate('platformOps.onboarding.wizard.heroUploadFailed');
      })
      .finally(() => {
        this.heroUploading = false;
      });
  }

  onHeroDragOver(event: DragEvent): void {
    event.preventDefault();
    this.heroDragOver = true;
  }

  onHeroDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.heroDragOver = false;
  }

  onHeroDrop(event: DragEvent): void {
    event.preventDefault();
    this.heroDragOver = false;
    const file = event.dataTransfer?.files?.[0];
    if (!file) {
      return;
    }
    const fakeEvent = { target: { files: [file], value: '' } } as unknown as Event;
    this.onHeroFileSelected(fakeEvent);
  }

  removeHeroImage(): void {
    this.hero.imageDataUrl = null;
    this.hero.sourceImageDataUrl = null;
    this.heroSourceWidth = 0;
    this.heroSourceHeight = 0;
    this.hero.cropZoom = 1;
    this.hero.cropFocusX = 50;
    this.hero.cropFocusY = 50;
    this.emitBodyChange();
  }

  onDropzoneClick(_event: Event): void {
    if (this.hero.sourceImageDataUrl) {
      return;
    }
    this.openHeroFilePicker();
  }

  onHeroPanStart(event: PointerEvent): void {
    if (!this.hero.sourceImageDataUrl || this.heroUploading || this.heroSourceWidth <= 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const frame = event.currentTarget as HTMLElement;
    this.heroPanFrameEl = frame;
    this.heroPanning = true;
    this.heroPanPointerId = event.pointerId;
    this.heroPanStartX = event.clientX;
    this.heroPanStartY = event.clientY;
    this.heroPanStartFocusX = this.hero.cropFocusX ?? 50;
    this.heroPanStartFocusY = this.hero.cropFocusY ?? 50;
    frame.setPointerCapture(event.pointerId);
  }

  onHeroPanMove(event: PointerEvent): void {
    if (!this.heroPanning || event.pointerId !== this.heroPanPointerId || !this.heroPanFrameEl) {
      return;
    }
    event.preventDefault();
    const rect = this.heroPanFrameEl.getBoundingClientRect();
    const delta = applyHeroPanDelta(
      this.heroSourceWidth,
      this.heroSourceHeight,
      this.hero.cropZoom ?? 1,
      this.heroPanStartFocusX,
      this.heroPanStartFocusY,
      event.clientX - this.heroPanStartX,
      event.clientY - this.heroPanStartY,
      rect.width,
      rect.height
    );
    this.hero.cropFocusX = Math.round(delta.focusX);
    this.hero.cropFocusY = Math.round(delta.focusY);
    this.scheduleHeroCrop(false);
  }

  onHeroPanEnd(event: PointerEvent): void {
    if (!this.heroPanning || event.pointerId !== this.heroPanPointerId) {
      return;
    }
    this.heroPanning = false;
    this.heroPanPointerId = -1;
    this.heroPanFrameEl?.releasePointerCapture(event.pointerId);
    this.heroPanFrameEl = null;
    void this.applyHeroCrop(true);
  }

  heroPanImageStyle(): Record<string, string> {
    if (!this.hero.sourceImageDataUrl || this.heroSourceWidth <= 0) {
      return {};
    }
    const layout = computeHeroPanLayout(
      this.heroSourceWidth,
      this.heroSourceHeight,
      this.hero.cropZoom ?? 1,
      this.hero.cropFocusX ?? 50,
      this.hero.cropFocusY ?? 50
    );
    return {
      left: `${layout.leftPct}%`,
      top: `${layout.topPct}%`,
      width: `${layout.widthPct}%`,
      height: `${layout.heightPct}%`
    };
  }

  canHeroPan(): boolean {
    return !!this.hero.sourceImageDataUrl && this.heroSourceWidth > 0;
  }

  onHeroCropChange(): void {
    this.scheduleHeroCrop(false);
  }

  private scheduleHeroCrop(emit: boolean): void {
    if (this.cropDebounceTimer) {
      clearTimeout(this.cropDebounceTimer);
    }
    if (emit) {
      void this.applyHeroCrop(true);
      return;
    }
    this.cropDebounceTimer = setTimeout(() => {
      this.cropDebounceTimer = null;
      void this.applyHeroCrop(true);
    }, 150);
  }

  heroPreviewPosition(): string {
    return heroCropObjectPosition(this.hero);
  }

  heroCropZoomLabel(): string {
    return `${Math.round((this.hero.cropZoom ?? 1) * 100)}%`;
  }

  private applyHeroCrop(emit = true): Promise<void> {
    const source = this.hero.sourceImageDataUrl;
    if (!source) {
      if (emit) {
        this.emitBodyChange();
      }
      return Promise.resolve();
    }
    const token = ++this.cropRenderToken;
    this.heroUploading = true;
    return renderHeroCrop(
      source,
      this.hero.cropZoom ?? 1,
      this.hero.cropFocusX ?? 50,
      this.hero.cropFocusY ?? 50
    )
      .then(dataUrl => {
        if (token !== this.cropRenderToken) {
          return;
        }
        this.hero.imageDataUrl = dataUrl;
        if (emit) {
          this.emitBodyChange();
        }
      })
      .catch(() => {
        if (token === this.cropRenderToken) {
          this.heroUploadError = this.i18n.translate('platformOps.onboarding.wizard.heroUploadFailed');
        }
      })
      .finally(() => {
        if (token === this.cropRenderToken) {
          this.heroUploading = false;
        }
      });
  }

  onBlockChange(): void {
    this.emitBodyChange();
  }

  emitBodyChange(): void {
    if (this.syncingFromBody) {
      return;
    }
    const contentHtml = composeBodyFromBlocks(this.blocks, this.plainText);
    this.bodyTemplate = composeBodyWithHero(this.hero, contentHtml);
    this.bodyTemplateChange.emit(this.bodyTemplate);
  }

  addParagraph(): void {
    this.blocks = [...this.blocks, { type: 'paragraph', text: '' }];
    this.activeBlockIndex = this.blocks.length - 1;
    this.activeField = 'block';
    this.onBlockChange();
  }

  addBulletList(): void {
    this.blocks = [...this.blocks, { type: 'bullets', items: [''] }];
    this.activeBlockIndex = this.blocks.length - 1;
    this.activeField = 'block';
    this.onBlockChange();
  }

  removeBlock(index: number): void {
    if (this.blocks.length <= 1) {
      this.blocks = [{ type: 'paragraph', text: '' }];
      this.activeBlockIndex = 0;
      this.onBlockChange();
      return;
    }
    this.blocks = this.blocks.filter((_, i) => i !== index);
    this.activeBlockIndex = Math.min(this.activeBlockIndex, this.blocks.length - 1);
    this.onBlockChange();
  }

  addBulletItem(blockIndex: number): void {
    const block = this.blocks[blockIndex];
    if (block?.type !== 'bullets') {
      return;
    }
    block.items = [...(block.items ?? []), ''];
    this.onBlockChange();
  }

  removeBulletItem(blockIndex: number, itemIndex: number): void {
    const block = this.blocks[blockIndex];
    if (block?.type !== 'bullets' || !block.items?.length) {
      return;
    }
    block.items = block.items.filter((_, i) => i !== itemIndex);
    if (!block.items.length) {
      block.items = [''];
    }
    this.onBlockChange();
  }

  setActiveBlock(index: number): void {
    this.activeBlockIndex = index;
    this.activeField = 'block';
  }

  injectVariable(key: TemplateVariableKey): void {
    const token = `{{${key}}}`;
    if (this.activeField === 'headline' && this.hero.enabled) {
      const current = this.hero.headline ?? '';
      this.hero.headline = `${current}${current && !current.endsWith(' ') ? ' ' : ''}${token}`;
      this.emitBodyChange();
      return;
    }
    const block = this.blocks[this.activeBlockIndex];
    if (!block) {
      return;
    }
    if (block.type === 'paragraph') {
      block.text = `${block.text ?? ''}${block.text?.endsWith(' ') || !block.text ? '' : ' '}${token}`;
    } else if (block.type === 'bullets' && block.items?.length) {
      const last = block.items.length - 1;
      block.items[last] = `${block.items[last] ?? ''}${block.items[last]?.endsWith(' ') ? '' : ' '}${token}`;
    }
    this.onBlockChange();
  }

  previewSubject(): string {
    return interpolateTemplate(this.subjectTemplate, this.resolvedPreviewVars());
  }

  previewHeroSafeHtml(): SafeHtml {
    const html = buildHeroPreviewHtml(this.hero, this.resolvedPreviewVars());
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  previewBodySafeHtml(): SafeHtml {
    const html = buildPreviewBodyHtml(this.blocks, this.resolvedPreviewVars());
    return this.sanitizer.bypassSecurityTrustHtml(html || '<p class="preview-empty">&nbsp;</p>');
  }

  previewPlainText(): string {
    return interpolateTemplate(composeBodyFromBlocks(this.blocks, true), this.resolvedPreviewVars());
  }

  trackBlock(index: number): number {
    return index;
  }

  trackItem(index: number): number {
    return index;
  }

  private resolvedPreviewVars(): Record<string, string> {
    return { ...DEFAULT_PREVIEW_VARS, ...this.previewVars };
  }

  private syncFromBody(value: string): void {
    this.syncingFromBody = true;
    const parsed = parseBodyWithHero(value ?? '');
    this.hero = normalizeHeroConfig(parsed.hero);
    if (this.hero.imageDataUrl && !this.hero.sourceImageDataUrl) {
      this.hero.sourceImageDataUrl = this.hero.imageDataUrl;
    }
    this.blocks = parseBodyToBlocks(parsed.contentHtml);
    if (!this.blocks.length) {
      this.blocks = [{ type: 'paragraph', text: '' }];
    }
    this.activeBlockIndex = 0;
    this.activeField = 'block';
    this.syncingFromBody = false;
    this.loadHeroSourceDimensions();
    this.refreshHeroBake();
  }

  private loadHeroSourceDimensions(): void {
    const source = this.hero.sourceImageDataUrl;
    if (!source) {
      this.heroSourceWidth = 0;
      this.heroSourceHeight = 0;
      return;
    }
    void readHeroImageSize(source).then(({ width, height }) => {
      this.heroSourceWidth = width;
      this.heroSourceHeight = height;
    });
  }

  private refreshHeroBake(): void {
    if (this.plainText || !this.hero.enabled || !this.hero.sourceImageDataUrl) {
      return;
    }
    void this.applyHeroCrop(true);
  }
}
