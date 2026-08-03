import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  inject
} from '@angular/core';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { ColorPickerModule } from 'primeng/colorpicker';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { StudioAssetCacheService } from './studio-asset-cache.service';
import { TranslatePipe } from '../core/translate.pipe';
import { TranslationService } from '../core/translation.service';
import { AeroStudioIdentity, AeroStudioService, AeroStudioStockImage } from '../core/aero-studio.service';
import {
  STUDIO_PX_PER_MM,
  StudioCanvasAnimation,
  StudioCanvasDocument,
  StudioCanvasElement,
  StudioCanvasFilter,
  newElementId,
  studioMmToPx,
  studioPxToMm
} from './models/studio-canvas.model';
import {
  STUDIO_ANIMATION_KEYFRAMES,
  studioAnimationCss,
  studioFilterCss
} from './studio-canvas.effects';
import { isLetterheadProtectedElementId } from './studio-letterhead.seed';

type DragMode =
  | 'move'
  | 'resize-se'
  | 'resize-e'
  | 'resize-s'
  | 'resize-nw'
  | 'resize-n'
  | 'resize-ne'
  | 'resize-sw'
  | 'resize-w';

interface SizePreset {
  labelKey: string;
  widthMm: number;
  heightMm: number;
}

interface LabeledOption<T> {
  label: string;
  value: T;
}

@Component({
  standalone: true,
  selector: 'app-aero-studio-canvas-editor',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    InputTextareaModule,
    InputNumberModule,
    DropdownModule,
    ColorPickerModule,
    CheckboxModule,
    DividerModule,
    TranslatePipe
  ],
  template: `
    <style>{{ animationKeyframes }}</style>
    <div class="editor-shell" [class.line-selected]="selected?.type === 'line'" [class.letterhead-mode]="letterheadMode">
      <aside class="toolbar" *ngIf="!letterheadMode" [attr.aria-label]="'studio.editor.toolbar' | translate">
        <p class="toolbar-title">{{ 'studio.editor.tools' | translate }}</p>
        <button pButton type="button" class="p-button-sm p-button-outlined" icon="pi pi-align-left"
                [label]="'studio.editor.addText' | translate" (click)="addText()"></button>
        <button pButton type="button" class="p-button-sm p-button-outlined" icon="pi pi-stop"
                [label]="'studio.editor.addShape' | translate" (click)="addShape('rect')"></button>
        <button pButton type="button" class="p-button-sm p-button-outlined" icon="pi pi-circle"
                [label]="'studio.editor.addCircle' | translate" (click)="addShape('circle')"></button>
        <button pButton type="button" class="p-button-sm p-button-outlined" icon="pi pi-minus"
                [label]="'studio.editor.addLine' | translate" (click)="addLine()"></button>
        <button pButton type="button" class="p-button-sm p-button-outlined" icon="pi pi-star"
                [label]="'studio.editor.addIcon' | translate" (click)="addIcon()"></button>
        <button pButton type="button" class="p-button-sm p-button-outlined" icon="pi pi-image"
                [label]="'studio.editor.addLogo' | translate" (click)="addLogo()" [disabled]="!identity?.logoUrl"></button>
        <button pButton type="button" class="p-button-sm p-button-outlined" icon="pi pi-qrcode"
                [label]="'studio.editor.addQr' | translate" (click)="addQr()"></button>
        <label class="upload-btn p-button-sm p-button-outlined">
          <i class="pi pi-upload"></i> {{ 'studio.editor.uploadImage' | translate }}
          <input type="file" accept="image/*" hidden (change)="onUploadImage($event)" />
        </label>
        <p-divider></p-divider>
        <label class="field-label">{{ 'studio.editor.stock' | translate }}</label>
        <input pInputText [(ngModel)]="stockQuery" (keyup.enter)="searchStock()" class="w-full" />
        <button pButton type="button" class="p-button-sm" icon="pi pi-search"
                [label]="'studio.editor.stockSearch' | translate" (click)="searchStock()"></button>
        <div class="stock-grid" *ngIf="stockResults.length">
          <button type="button" class="stock-thumb" *ngFor="let s of stockResults" (click)="addStockImage(s)">
            <img [src]="s.thumbUrl" [alt]="s.id" />
          </button>
        </div>
        <p-divider></p-divider>
        <button pButton type="button" class="p-button-sm p-button-outlined" icon="pi pi-arrow-up"
                [label]="'studio.editor.layerUp' | translate" (click)="layerUp()" [disabled]="!selected"></button>
        <button pButton type="button" class="p-button-sm p-button-outlined" icon="pi pi-arrow-down"
                [label]="'studio.editor.layerDown' | translate" (click)="layerDown()" [disabled]="!selected"></button>
        <button pButton type="button" class="p-button-sm p-button-danger p-button-outlined" icon="pi pi-trash"
                [label]="'studio.editor.delete' | translate" (click)="deleteSelected()" [disabled]="!selected"></button>
        <p-divider></p-divider>
        <label class="field-label">{{ 'studio.editor.canvasSize' | translate }}</label>
        <p-dropdown [options]="sizePresetOptions" [(ngModel)]="selectedPreset" optionLabel="label"
                    (onChange)="applySizePreset()" [placeholder]="'studio.editor.canvasSize' | translate"></p-dropdown>
      </aside>

      <div class="canvas-area">
        <div class="canvas-toolbar" *ngIf="!letterheadMode">
          <label class="field-label">{{ 'studio.editor.background' | translate }}</label>
          <p-colorPicker [(ngModel)]="doc.backgroundColor" (ngModelChange)="emitChange()" appendTo="body"></p-colorPicker>
        </div>
        <p class="hint" *ngIf="!letterheadMode">{{ hintMessageKey | translate }}</p>
        <p class="hint letterhead-hint" *ngIf="letterheadMode">{{ 'studio.letterhead.canvas.hint' | translate }}</p>
        <button *ngIf="letterheadMode && canDeleteSelection" pButton type="button"
                class="p-button-sm p-button-danger p-button-outlined lh-delete-btn" icon="pi pi-trash"
                [label]="'studio.letterhead.deleteSelection' | translate"
                (click)="deleteSelected()"></button>
        <div class="canvas-viewport">
        <div
          #canvasEl
          class="canvas"
          [style.width.px]="canvasWidthPx"
          [style.height.px]="canvasHeightPx"
          [style.background]="doc.backgroundColor"
          (pointerdown)="onCanvasPointerDown($event)">
          <div
            *ngFor="let el of sortedElements; trackBy: trackEl"
            class="element"
            [class.selected]="el.id === selectedId"
            [class.is-line]="el.type === 'line'"
            [ngStyle]="elementStyle(el)"
            (pointerdown)="onElementPointerDown($event, el)">
            <ng-container [ngSwitch]="el.type">
              <div *ngSwitchCase="'text'" class="el-text" [style.fontSize.pt]="el.fontSizePt || 11"
                   [style.fontWeight]="el.fontWeight || 'normal'" [style.color]="el.color || '#111'"
                   [style.textAlign]="el.textAlign || 'left'">{{ el.text }}</div>
              <div *ngSwitchCase="'shape'" class="el-shape" [ngClass]="shapeClass(el)" [ngStyle]="shapeStyle(el)"></div>
              <div *ngSwitchCase="'circle'" class="el-shape is-circle" [ngStyle]="shapeStyle(el)"></div>
              <div *ngSwitchCase="'line'" class="el-line" [ngStyle]="lineStyle(el)"></div>
              <div *ngSwitchCase="'icon'" class="el-icon"><i [class]="iconClasses(el)"></i></div>
              <div *ngSwitchCase="'logo'" class="el-image">
                <img *ngIf="identity?.logoUrl" [src]="identity.logoUrl" alt="" />
                <span *ngIf="!identity?.logoUrl" class="placeholder">{{ 'studio.editor.logoMissing' | translate }}</span>
              </div>
              <div *ngSwitchCase="'qr'" class="el-image el-qr">
                <img *ngIf="qrPreviewSrc" [src]="qrPreviewSrc" alt="" class="qr-img" />
                <span *ngIf="!qrPreviewSrc" class="placeholder">{{ 'studio.editor.qrOff' | translate }}</span>
              </div>
              <div *ngSwitchCase="'image'" class="el-image">
                <img *ngIf="el.imageUrl" [src]="assetCache.resolve(el.imageUrl) | async" alt="" />
              </div>
            </ng-container>
            <ng-container *ngIf="el.id === selectedId">
              <div *ngIf="el.type !== 'line'" class="sel-box" aria-hidden="true"></div>
              <ng-container *ngIf="el.type !== 'line'">
                <span class="resize-handle handle-nw" (pointerdown)="onResizePointerDown($event, el, 'resize-nw')"></span>
                <span class="resize-handle handle-n" (pointerdown)="onResizePointerDown($event, el, 'resize-n')"></span>
                <span class="resize-handle handle-ne" (pointerdown)="onResizePointerDown($event, el, 'resize-ne')"></span>
                <span class="resize-handle handle-e" (pointerdown)="onResizePointerDown($event, el, 'resize-e')"></span>
                <span class="resize-handle handle-se" (pointerdown)="onResizePointerDown($event, el, 'resize-se')"></span>
                <span class="resize-handle handle-s" (pointerdown)="onResizePointerDown($event, el, 'resize-s')"></span>
                <span class="resize-handle handle-sw" (pointerdown)="onResizePointerDown($event, el, 'resize-sw')"></span>
                <span class="resize-handle handle-w" (pointerdown)="onResizePointerDown($event, el, 'resize-w')"></span>
              </ng-container>
              <span *ngIf="el.type === 'line'" class="resize-handle handle-e"
                    (pointerdown)="onResizePointerDown($event, el, 'resize-e')"></span>
              <span *ngIf="el.type === 'line'" class="resize-handle handle-s"
                    (pointerdown)="onResizePointerDown($event, el, 'resize-s')"></span>
            </ng-container>
          </div>
        </div>
        </div>
        <p class="size-label">{{ doc.widthMm }} × {{ doc.heightMm }} mm</p>
      </div>

      <aside class="props" *ngIf="!letterheadMode && selected as sel">
        <p class="toolbar-title">{{ 'studio.editor.properties' | translate }}</p>
        <label class="field-label">{{ 'studio.editor.filter' | translate }}</label>
        <p-dropdown [options]="filterOptions" [(ngModel)]="sel.filter" optionLabel="label" optionValue="value"
                    (onChange)="emitChange()"></p-dropdown>
        <label class="field-label">{{ 'studio.editor.animation' | translate }}</label>
        <p-dropdown [options]="animationOptions" [(ngModel)]="sel.animation" optionLabel="label" optionValue="value"
                    (onChange)="emitChange()"></p-dropdown>
        <label class="field-label">{{ 'studio.editor.animDuration' | translate }}</label>
        <p-inputNumber [(ngModel)]="sel.animationDurationSec" [min]="0.2" [max]="20" [step]="0.1"
                       (ngModelChange)="emitChange()"></p-inputNumber>
        <label class="field-label">{{ 'studio.editor.posSize' | translate }}</label>
        <div class="grid-2">
          <p-inputNumber [(ngModel)]="sel.x" [min]="0" [maxFractionDigits]="1" (ngModelChange)="onSelGeometryChange(sel)"></p-inputNumber>
          <p-inputNumber [(ngModel)]="sel.y" [min]="0" [maxFractionDigits]="1" (ngModelChange)="onSelGeometryChange(sel)"></p-inputNumber>
          <p-inputNumber [(ngModel)]="sel.width" [min]="sel.type === 'line' ? 3 : 1" [maxFractionDigits]="1" (ngModelChange)="onSelGeometryChange(sel)"></p-inputNumber>
          <p-inputNumber [(ngModel)]="sel.height" [min]="sel.type === 'line' ? 0.4 : 1" [maxFractionDigits]="1" (ngModelChange)="onSelGeometryChange(sel)"></p-inputNumber>
        </div>
        <p class="field-hint" *ngIf="sel.type === 'line'">{{ 'studio.editor.lineSizeHint' | translate }}</p>
        <div class="checks" *ngIf="sel.type !== 'line'">
          <p-checkbox [(ngModel)]="lockAspectRatio" [binary]="true" inputId="lockAspect"></p-checkbox>
          <label for="lockAspect">{{ 'studio.editor.lockAspect' | translate }}</label>
        </div>
        <ng-container *ngIf="sel.type === 'qr'">
          <p class="field-hint">{{ 'studio.editor.qrHelp' | translate }}</p>
          <p class="field-hint qr-url" *ngIf="identity?.portalQrUrl">{{ identity.portalQrUrl }}</p>
        </ng-container>
        <ng-container *ngIf="sel.type === 'text'">
          <label class="field-label">{{ 'studio.editor.text' | translate }}</label>
          <textarea pInputTextarea [(ngModel)]="sel.text" rows="3" class="w-full" (ngModelChange)="emitChange()"></textarea>
          <label class="field-label">{{ 'studio.field.primary' | translate }}</label>
          <p-colorPicker [(ngModel)]="sel.color" (ngModelChange)="emitChange()" appendTo="body"></p-colorPicker>
          <label class="field-label">{{ 'studio.editor.fontSize' | translate }}</label>
          <p-inputNumber [(ngModel)]="sel.fontSizePt" [min]="6" [max]="96" (ngModelChange)="emitChange()"></p-inputNumber>
        </ng-container>
        <ng-container *ngIf="sel.type === 'shape' || sel.type === 'circle'">
          <label class="field-label">{{ 'studio.editor.fill' | translate }}</label>
          <p-colorPicker [(ngModel)]="sel.fill" (ngModelChange)="emitChange()" appendTo="body"></p-colorPicker>
        </ng-container>
        <ng-container *ngIf="sel.type === 'line'">
          <label class="field-label">{{ 'studio.editor.lineColor' | translate }}</label>
          <p-colorPicker [(ngModel)]="sel.strokeColor" (ngModelChange)="emitChange()" appendTo="body"></p-colorPicker>
        </ng-container>
        <ng-container *ngIf="sel.type === 'icon'">
          <label class="field-label">{{ 'studio.editor.icon' | translate }}</label>
          <p-dropdown [options]="iconOptions" [(ngModel)]="sel.iconClass" optionLabel="label" optionValue="value"
                      (onChange)="emitChange()"></p-dropdown>
        </ng-container>
      </aside>
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex: 1;
        min-height: 0;
        min-width: 0;
        overflow: hidden;
      }
      .editor-shell {
        display: grid;
        grid-template-columns: minmax(200px, 220px) minmax(0, 1fr) minmax(200px, 260px);
        gap: 0.75rem;
        flex: 1;
        min-height: 0;
        min-width: 0;
        width: 100%;
        overflow: hidden;
      }
      .editor-shell.letterhead-mode {
        grid-template-columns: 1fr;
        height: 100%;
        gap: 0;
      }
      .editor-shell.letterhead-mode .canvas-area {
        height: 100%;
      }
      .editor-shell.letterhead-mode .canvas-viewport {
        background: #f1f5f9;
        border: none;
        border-radius: 0;
        padding: 0;
      }
      .editor-shell.letterhead-mode .canvas {
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
      }
      .letterhead-hint {
        margin: 0 0 0.35rem;
        padding: 0 0.25rem;
      }
      .lh-delete-btn {
        align-self: center;
        margin-bottom: 0.35rem;
        flex-shrink: 0;
      }
      @media (max-width: 1100px) {
        .editor-shell {
          grid-template-columns: 1fr;
          grid-template-rows: auto 1fr auto;
          overflow: auto;
        }
        .toolbar, .props { max-height: 220px; overflow: auto; }
      }
      .toolbar, .props {
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
        padding: 0.75rem;
        border: 1px solid var(--surface-border);
        border-radius: 10px;
        background: var(--surface-card);
        min-height: 0;
        overflow-x: hidden;
        overflow-y: auto;
      }
      .toolbar-title { font-weight: 600; margin: 0 0 0.25rem; font-size: 0.9rem; }
      .field-label { font-size: 0.8rem; color: var(--text-color-secondary); margin-top: 0.25rem; }
      .field-hint { font-size: 0.72rem; color: var(--text-color-secondary); margin: 0.15rem 0 0; line-height: 1.3; }
      .upload-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        justify-content: center;
        cursor: pointer;
        padding: 0.4rem 0.6rem;
        border-radius: 6px;
      }
      .stock-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.35rem; max-height: 140px; overflow: auto; }
      .stock-thumb { padding: 0; border: 1px solid var(--surface-border); border-radius: 4px; overflow: hidden; cursor: pointer; background: #fff; }
      .stock-thumb img { width: 100%; height: 48px; object-fit: cover; display: block; }
      .canvas-area {
        display: flex;
        flex-direction: column;
        min-height: 0;
        min-width: 0;
        overflow: hidden;
      }
      .hint {
        font-size: 0.8rem;
        color: var(--text-color-secondary);
        margin: 0 0 0.35rem;
        flex-shrink: 0;
        text-align: center;
      }
      .canvas-viewport {
        flex: 1;
        min-height: 0;
        overflow: auto;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem;
        background: repeating-conic-gradient(#e2e8f0 0% 25%, #f1f5f9 0% 50%) 50% / 16px 16px;
        border-radius: 10px;
        border: 1px solid var(--surface-border);
      }
      .canvas {
        position: relative;
        flex-shrink: 0;
        border: 1px solid #94a3b8;
        box-shadow: 0 4px 24px rgba(15, 23, 42, 0.12);
        touch-action: none;
        user-select: none;
      }
      .element {
        position: absolute;
        border: 1px solid transparent;
        cursor: move;
        box-sizing: border-box;
      }
      .element.is-line {
        display: flex;
        align-items: center;
        justify-content: stretch;
      }
      .element.selected { border-color: var(--primary-color); outline: 1px dashed var(--primary-color); }
      .el-text {
        width: 100%;
        height: 100%;
        overflow: hidden;
        padding: 2px;
        white-space: pre-wrap;
        word-break: break-word;
      }
      .el-shape { width: 100%; height: 100%; border-radius: 2px; box-sizing: border-box; }
      .el-shape.is-circle { border-radius: 50%; }
      .el-line {
        width: 100%;
        flex-shrink: 0;
        border-radius: 1px;
      }
      .el-icon { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
      .el-image {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      .el-image img { max-width: 100%; max-height: 100%; object-fit: contain; }
      .el-qr {
        flex-direction: column;
        gap: 2px;
        font-size: 0.7rem;
        color: var(--text-color-secondary);
        background: #f8fafc;
      }
      .el-qr .qr-img { width: 100%; height: 100%; object-fit: contain; }
      .placeholder { font-size: 0.65rem; color: var(--text-color-secondary); text-align: center; padding: 4px; }
      .canvas-toolbar {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-shrink: 0;
        padding: 0.35rem 0.5rem;
        background: var(--surface-card);
        border: 1px solid var(--surface-border);
        border-radius: 8px;
        margin-bottom: 0.35rem;
      }
      .canvas-toolbar .field-label { margin: 0; }
      .checks { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
      .qr-url { word-break: break-all; font-size: 0.68rem; opacity: 0.85; }
      .sel-box {
        position: absolute;
        inset: -3px;
        border: 1px dashed var(--primary-color);
        pointer-events: none;
        z-index: 1;
      }
      .resize-handle {
        position: absolute;
        width: 11px;
        height: 11px;
        background: var(--primary-color);
        border: 2px solid #fff;
        border-radius: 50%;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
        z-index: 2;
      }
      .handle-nw { left: -6px; top: -6px; cursor: nw-resize; }
      .handle-n { left: 50%; top: -6px; transform: translateX(-50%); cursor: n-resize; }
      .handle-ne { right: -6px; top: -6px; cursor: ne-resize; }
      .handle-e { right: -6px; top: 50%; transform: translateY(-50%); cursor: e-resize; }
      .handle-se { right: -6px; bottom: -6px; cursor: se-resize; }
      .handle-s { bottom: -6px; left: 50%; transform: translateX(-50%); cursor: s-resize; }
      .handle-sw { left: -6px; bottom: -6px; cursor: sw-resize; }
      .handle-w { left: -6px; top: 50%; transform: translateY(-50%); cursor: w-resize; }
      .size-label {
        text-align: center;
        font-size: 0.75rem;
        color: var(--text-color-secondary);
        margin-top: 0.35rem;
        flex-shrink: 0;
      }
      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.35rem; }
      .w-full { width: 100%; }
    `
  ]
})
export class AeroStudioCanvasEditorComponent implements OnInit, OnChanges {
  private i18n = inject(TranslationService);
  private studioApi = inject(AeroStudioService);
  readonly assetCache = inject(StudioAssetCacheService);
  private toast = inject(MessageService);

  @Input({ required: true }) doc!: StudioCanvasDocument;
  @Input() identity: AeroStudioIdentity | null = null;
  @Input() primaryColor = '#0ea5e9';
  @Input() includeQrPortal = true;
  @Input() letterheadMode = false;

  @Output() docChange = new EventEmitter<StudioCanvasDocument>();

  @ViewChild('canvasEl') canvasRef?: ElementRef<HTMLElement>;

  readonly studioMmToPx = studioMmToPx;
  readonly animationKeyframes = STUDIO_ANIMATION_KEYFRAMES;

  selectedId: string | null = null;
  selectedPreset: { label: string; value: SizePreset } | null = null;
  sizePresetOptions: { label: string; value: SizePreset }[] = [];
  stockQuery = 'aviation';
  stockResults: AeroStudioStockImage[] = [];
  lockAspectRatio = false;
  filterOptions: LabeledOption<StudioCanvasFilter>[] = [];
  animationOptions: LabeledOption<StudioCanvasAnimation>[] = [];
  iconOptions: LabeledOption<string>[] = [];

  private dragMode: DragMode | null = null;
  private dragElId: string | null = null;
  private dragStartX = 0;
  private dragStartY = 0;
  private elStartX = 0;
  private elStartY = 0;
  private elStartW = 0;
  private elStartH = 0;
  private resizeAspect = 1;

  ngOnInit(): void {
    this.buildOptions();
    this.searchStock();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['doc'] || !this.sizePresetOptions.length) {
      this.buildSizePresets();
    }
  }

  get canvasWidthPx(): number {
    return studioMmToPx(this.doc?.widthMm ?? 90);
  }

  get canvasHeightPx(): number {
    return studioMmToPx(this.doc?.heightMm ?? 50);
  }

  get sortedElements(): StudioCanvasElement[] {
    return [...(this.doc?.elements ?? [])].sort((a, b) => a.zIndex - b.zIndex);
  }

  get selected(): StudioCanvasElement | null {
    if (!this.selectedId || !this.doc) return null;
    return this.doc.elements.find(e => e.id === this.selectedId) ?? null;
  }

  get hintMessageKey(): string {
    return this.selected?.type === 'line' ? 'studio.editor.hintLine' : 'studio.editor.hint';
  }

  get canDeleteSelection(): boolean {
    if (!this.selectedId) return false;
    if (this.letterheadMode && isLetterheadProtectedElementId(this.selectedId)) {
      return false;
    }
    return true;
  }

  get qrPreviewSrc(): string {
    if (!this.includeQrPortal) {
      return '';
    }
    return this.identity?.portalQrPreviewDataUri || '';
  }

  trackEl(_: number, el: StudioCanvasElement): string {
    return el.id;
  }

  elementStyle(el: StudioCanvasElement): Record<string, string | number | null> {
    const filter = studioFilterCss(el.filter);
    const anim = studioAnimationCss(el);
    const style: Record<string, string | number | null> = {
      left: `${studioMmToPx(el.x)}px`,
      top: `${studioMmToPx(el.y)}px`,
      width: `${studioMmToPx(el.width)}px`,
      height: `${studioMmToPx(el.height)}px`,
      zIndex: el.zIndex
    };
    if (el.rotation) {
      style['transform'] = `rotate(${el.rotation}deg)`;
    }
    if (filter) {
      style['filter'] = filter;
    }
    if (anim) {
      style['animation'] = anim;
    }
    return style;
  }

  shapeClass(el: StudioCanvasElement): string {
    return el.shapeKind === 'circle' ? 'is-circle' : '';
  }

  shapeStyle(el: StudioCanvasElement): Record<string, string> {
    return {
      background: el.fill || '#e2e8f0',
      border: `${el.strokeWidthMm ?? 0.4}mm solid ${el.strokeColor || '#64748b'}`
    };
  }

  lineStyle(el: StudioCanvasElement): Record<string, string> {
    const strokeMm = el.strokeWidthMm ?? Math.max(0.4, el.height);
    return {
      width: '100%',
      height: `${strokeMm}mm`,
      background: el.strokeColor || el.fill || '#334155',
      borderRadius: '1px'
    };
  }

  iconClasses(el: StudioCanvasElement): string {
    const c = el.iconClass?.startsWith('pi-') ? el.iconClass : 'pi-star';
    return `pi ${c}`;
  }

  emitChange(): void {
    this.commitDoc();
  }

  private commitDoc(): void {
    if (!this.doc) return;
    this.docChange.emit({
      ...this.doc,
      elements: this.doc.elements.map(e => ({ ...e }))
    });
  }

  searchStock(): void {
    this.studioApi.searchStock(this.stockQuery).subscribe(r => (this.stockResults = r ?? []));
  }

  onUploadImage(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.studioApi.uploadImage(file).subscribe({
      next: res => {
        if (res?.path) {
          this.assetCache.preload(res.path);
          this.pushElement({
            id: newElementId(),
            type: 'image',
            x: 8,
            y: 8,
            width: 50,
            height: 35,
            zIndex: this.nextZ(),
            imageUrl: res.path
          });
          this.toast.add({
            severity: 'success',
            summary: this.i18n.translate('studio.editor.uploadOk')
          });
        }
        input.value = '';
      },
      error: () => {
        input.value = '';
        this.toast.add({
          severity: 'error',
          summary: this.i18n.translate('studio.editor.uploadFail')
        });
      }
    });
  }

  addStockImage(stock: AeroStudioStockImage): void {
    this.pushElement({
      id: newElementId(),
      type: 'image',
      x: 5,
      y: 5,
      width: 60,
      height: 40,
      zIndex: this.nextZ(),
      imageUrl: stock.fullUrl
    });
  }

  addText(): void {
    this.pushElement({
      id: newElementId(),
      type: 'text',
      x: 5,
      y: 5,
      width: 40,
      height: 12,
      zIndex: this.nextZ(),
      text: this.i18n.translate('studio.editor.defaultText'),
      fontSizePt: 11,
      color: '#111111',
      textAlign: 'left',
      filter: 'none',
      animation: 'none'
    });
  }

  /** Expõe adição de texto para o estúdio de papel timbrado. */
  addTextElement(): void {
    this.addText();
  }

  addShape(kind: 'rect' | 'circle'): void {
    this.pushElement({
      id: newElementId(),
      type: kind === 'circle' ? 'circle' : 'shape',
      shapeKind: kind,
      x: 5,
      y: 5,
      width: kind === 'circle' ? 20 : 30,
      height: kind === 'circle' ? 20 : 15,
      zIndex: this.nextZ(),
      fill: this.primaryColor,
      filter: 'none',
      animation: 'none'
    });
  }

  addLine(): void {
    const thickness = 1.2;
    this.pushElement({
      id: newElementId(),
      type: 'line',
      x: 5,
      y: 20,
      width: 50,
      height: thickness,
      zIndex: this.nextZ(),
      strokeColor: '#334155',
      strokeWidthMm: thickness,
      animation: 'none'
    });
  }

  addIcon(): void {
    this.pushElement({
      id: newElementId(),
      type: 'icon',
      x: 5,
      y: 5,
      width: 12,
      height: 12,
      zIndex: this.nextZ(),
      iconClass: 'pi-plane',
      color: this.primaryColor,
      fontSizePt: 22,
      animation: 'none'
    });
  }

  addLogo(): void {
    this.pushElement({
      id: newElementId(),
      type: 'logo',
      x: 5,
      y: 5,
      width: 28,
      height: 12,
      zIndex: this.nextZ()
    });
  }

  addQr(): void {
    this.pushElement({
      id: newElementId(),
      type: 'qr',
      x: this.doc.widthMm - 24,
      y: this.doc.heightMm - 24,
      width: 18,
      height: 18,
      zIndex: this.nextZ()
    });
  }

  deleteSelected(): void {
    if (!this.selectedId) return;
    if (this.letterheadMode && isLetterheadProtectedElementId(this.selectedId)) {
      this.toast.add({
        severity: 'warn',
        summary: this.i18n.translate('studio.letterhead.deleteProtected')
      });
      return;
    }
    this.doc.elements = this.doc.elements.filter(e => e.id !== this.selectedId);
    this.selectedId = null;
    this.emitChange();
  }

  layerUp(): void {
    this.reorderLayer(1);
  }

  layerDown(): void {
    this.reorderLayer(-1);
  }

  private reorderLayer(direction: 1 | -1): void {
    const el = this.selected;
    if (!el || !this.doc?.elements?.length) return;
    const sorted = [...this.doc.elements].sort((a, b) => a.zIndex - b.zIndex);
    const idx = sorted.findIndex(e => e.id === el.id);
    const targetIdx = idx + direction;
    if (idx < 0 || targetIdx < 0 || targetIdx >= sorted.length) return;
    const swap = sorted[targetIdx];
    const tmpZ = el.zIndex;
    el.zIndex = swap.zIndex;
    swap.zIndex = tmpZ;
    this.doc.elements = sorted;
    this.commitDoc();
  }

  applySizePreset(): void {
    const p = this.selectedPreset?.value;
    if (!p) return;
    this.doc.widthMm = p.widthMm;
    this.doc.heightMm = p.heightMm;
    this.emitChange();
  }

  onCanvasPointerDown(ev: PointerEvent): void {
    if (ev.target === this.canvasRef?.nativeElement) {
      this.selectedId = null;
    }
  }

  onElementPointerDown(ev: PointerEvent, el: StudioCanvasElement): void {
    ev.stopPropagation();
    this.selectedId = el.id;
    this.dragMode = 'move';
    this.dragElId = el.id;
    this.dragStartX = ev.clientX;
    this.dragStartY = ev.clientY;
    this.elStartX = el.x;
    this.elStartY = el.y;
    (ev.currentTarget as HTMLElement).setPointerCapture?.(ev.pointerId);
  }

  onResizePointerDown(ev: PointerEvent, el: StudioCanvasElement, mode: DragMode): void {
    ev.stopPropagation();
    this.selectedId = el.id;
    this.dragMode = mode;
    this.dragElId = el.id;
    this.dragStartX = ev.clientX;
    this.dragStartY = ev.clientY;
    this.elStartX = el.x;
    this.elStartY = el.y;
    this.elStartW = el.width;
    this.elStartH = el.height;
    this.resizeAspect = el.width / Math.max(el.height, 0.01);
    (ev.target as HTMLElement).setPointerCapture?.(ev.pointerId);
  }

  @HostListener('document:pointermove', ['$event'])
  onDocumentPointerMove(ev: PointerEvent): void {
    if (!this.dragMode || !this.dragElId) return;
    const el = this.doc.elements.find(e => e.id === this.dragElId);
    if (!el) return;

    const dx = studioPxToMm(ev.clientX - this.dragStartX);
    const dy = studioPxToMm(ev.clientY - this.dragStartY);

    if (this.dragMode === 'move') {
      el.x = this.elStartX + dx;
      el.y = this.elStartY + dy;
    } else {
      this.applyResize(el, this.dragMode, dx, dy);
    }
    if (el.type === 'line') {
      el.strokeWidthMm = Math.max(0.4, el.height);
    }
    this.clampElement(el);
  }

  private applyResize(el: StudioCanvasElement, mode: DragMode, dx: number, dy: number): void {
    const lock = this.lockAspectRatio && el.type !== 'line';
    const aspect = this.resizeAspect;

    if (mode === 'resize-se') {
      let w = this.elStartW + dx;
      let h = this.elStartH + dy;
      if (lock) {
        if (Math.abs(dx) >= Math.abs(dy)) {
          h = w / aspect;
        } else {
          w = h * aspect;
        }
      }
      el.width = w;
      el.height = h;
      return;
    }
    if (mode === 'resize-e') {
      el.width = this.elStartW + dx;
      return;
    }
    if (mode === 'resize-s') {
      el.height = this.elStartH + dy;
      return;
    }
    if (mode === 'resize-w') {
      el.width = this.elStartW - dx;
      el.x = this.elStartX + dx;
      return;
    }
    if (mode === 'resize-n') {
      el.height = this.elStartH - dy;
      el.y = this.elStartY + dy;
      return;
    }
    if (mode === 'resize-ne') {
      let w = this.elStartW + dx;
      let h = this.elStartH - dy;
      el.y = this.elStartY + dy;
      if (lock) {
        h = w / aspect;
        el.y = this.elStartY + this.elStartH - h;
      }
      el.width = w;
      el.height = h;
      return;
    }
    if (mode === 'resize-nw') {
      let w = this.elStartW - dx;
      let h = this.elStartH - dy;
      el.x = this.elStartX + dx;
      el.y = this.elStartY + dy;
      if (lock) {
        h = w / aspect;
        el.y = this.elStartY + this.elStartH - h;
      }
      el.width = w;
      el.height = h;
      return;
    }
    if (mode === 'resize-sw') {
      let w = this.elStartW - dx;
      let h = this.elStartH + dy;
      el.x = this.elStartX + dx;
      if (lock) {
        h = w / aspect;
      }
      el.width = w;
      el.height = h;
    }
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(ev: KeyboardEvent): void {
    if (ev.key !== 'Delete' && ev.key !== 'Backspace') return;
    if (!this.selectedId || !this.canDeleteSelection) return;
    const t = ev.target as HTMLElement | null;
    if (t) {
      const tag = t.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable) {
        return;
      }
    }
    ev.preventDefault();
    this.deleteSelected();
  }

  @HostListener('document:pointerup')
  onDocumentPointerUp(): void {
    if (this.dragMode) {
      this.commitDoc();
    }
    this.dragMode = null;
    this.dragElId = null;
  }

  onSelGeometryChange(sel: StudioCanvasElement): void {
    if (sel.type === 'line') {
      sel.strokeWidthMm = sel.height;
    }
    this.clampElement(sel);
    this.commitDoc();
  }

  private clampElement(el: StudioCanvasElement): void {
    const maxW = this.doc.widthMm;
    const maxH = this.doc.heightMm;
    const minW = el.type === 'line' ? 3 : 2;
    const minH = el.type === 'line' ? 0.4 : 2;
    el.width = Math.max(minW, Math.min(el.width, maxW));
    el.height = Math.max(minH, Math.min(el.height, maxH));
    el.x = Math.max(0, Math.min(el.x, maxW - el.width));
    el.y = Math.max(0, Math.min(el.y, maxH - el.height));
    if (el.x + el.width > maxW) {
      el.width = maxW - el.x;
    }
    if (el.y + el.height > maxH) {
      el.height = maxH - el.y;
    }
    if (el.type === 'line') {
      el.strokeWidthMm = el.height;
    }
  }

  private pushElement(el: StudioCanvasElement): void {
    this.doc.elements = [...this.doc.elements, el];
    this.selectedId = el.id;
    this.emitChange();
  }

  private nextZ(): number {
    const max = this.doc.elements.reduce((m, e) => Math.max(m, e.zIndex), 0);
    return max + 1;
  }

  private buildSizePresets(): void {
    const presets: SizePreset[] = [
      { labelKey: 'studio.editor.sizeCard', widthMm: 90, heightMm: 50 },
      { labelKey: 'studio.editor.sizeA4', widthMm: 210, heightMm: 297 },
      { labelKey: 'studio.editor.sizeBanner', widthMm: 2000, heightMm: 800 },
      { labelKey: 'studio.editor.sizeInstagramPost', widthMm: 270, heightMm: 270 },
      { labelKey: 'studio.editor.sizeInstagramStory', widthMm: 270, heightMm: 480 },
      { labelKey: 'studio.editor.sizeLinkedInPost', widthMm: 300, heightMm: 300 },
      { labelKey: 'studio.editor.sizeLinkedInCover', widthMm: 396, heightMm: 99 }
    ];
    this.sizePresetOptions = presets.map(p => ({
      label: this.i18n.translate(p.labelKey),
      value: p
    }));
  }

  private buildOptions(): void {
    const f = (k: string, v: StudioCanvasFilter): LabeledOption<StudioCanvasFilter> => ({
      label: this.i18n.translate(k),
      value: v
    });
    this.filterOptions = [
      f('studio.editor.filterNone', 'none'),
      f('studio.editor.filterGrayscale', 'grayscale'),
      f('studio.editor.filterSepia', 'sepia'),
      f('studio.editor.filterBrightness', 'brightness'),
      f('studio.editor.filterContrast', 'contrast'),
      f('studio.editor.filterBlur', 'blur'),
      f('studio.editor.filterVivid', 'vivid')
    ];
    const a = (k: string, v: StudioCanvasAnimation): LabeledOption<StudioCanvasAnimation> => ({
      label: this.i18n.translate(k),
      value: v
    });
    this.animationOptions = [
      a('studio.editor.animNone', 'none'),
      a('studio.editor.animFade', 'fadeIn'),
      a('studio.editor.animSlide', 'slideIn'),
      a('studio.editor.animPulse', 'pulse'),
      a('studio.editor.animBounce', 'bounce')
    ];
    this.iconOptions = [
      { label: '✈', value: 'pi-plane' },
      { label: '★', value: 'pi-star' },
      { label: '☎', value: 'pi-phone' },
      { label: '✉', value: 'pi-envelope' },
      { label: '🔧', value: 'pi-wrench' }
    ];
  }
}
