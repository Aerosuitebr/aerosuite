import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl, SafeHtml } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { PPTXViewer } from 'pptxviewjs';
import { AccordionModule } from 'primeng/accordion';
import { DialogModule } from 'primeng/dialog';
import { BibliotecaService, CategoriaItemBiblioteca, ArquivoBiblioteca, ChildrenBiblioteca } from '../core/biblioteca.service';
import { TranslatePipe } from '../core/translate.pipe';
import { TranslationService } from '../core/translation.service';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';
import { ListDataStatesComponent } from '../shared/list-data-states/list-data-states.component';

@Component({
  selector: 'app-biblioteca',
  standalone: true,
  imports: [CommonModule, AccordionModule, DialogModule, TranslatePipe, PageHeroComponent, ListDataStatesComponent],
  template: `
    <div class="as-page biblioteca-page" [attr.data-ui-lang]="uiLang">
      <app-page-hero
        variant="slate"
        titleKey="biblioteca.title"
        subtitleKey="biblioteca.subtitle"
        titleIcon="pi-book" />

      @if (erroKey || erroRaw) {
        <div class="erro-wrap">
          <i class="pi pi-exclamation-triangle"></i>
          <p>
            @if (erroKey) {
              {{ erroKey | translate:erroParams }}
            } @else {
              {{ erroRaw }}
            }
          </p>
        </div>
      } @else {
        <app-list-data-states
          [loading]="loading"
          [itemCount]="bibliotecaItemCount"
          [skeletonRows]="4"
          [skeletonCols]="4"
          emptyIcon="pi-folder-open"
          emptyTitleKey="biblioteca.empty"
          emptyDescriptionKey="biblioteca.emptyHint">
          <p emptyAction class="biblioteca-empty-path">
            <code>{{ infoPath || '...' }}</code>
          </p>
          @if (arquivosRaiz?.length) {
            <div class="livros-grid raiz">
              @for (arq of arquivosRaiz; track arq.path) {
                <div class="livro-card" (click)="abrirArquivo(arq)" role="button" tabindex="0" (keydown.enter)="abrirArquivo(arq)">
                  <div class="livro-capa" [class]="'tipo-' + getTipo(arq.nome)">
                    <i [class]="getIcone(arq.nome)"></i>
                  </div>
                  <div class="livro-titulo">{{ arq.nome }}</div>
                  @if (isDocAntigo(arq.nome)) {
                    <div class="livro-dica">{{ 'biblioteca.docxOnly' | translate }}</div>
                  }
                </div>
              }
            </div>
          }
          <div class="categorias-grid">
            @for (cat of categoriasRaiz; track cat.path) {
              <div class="accordion-col">
                <p-accordion [multiple]="true" styleClass="biblioteca-accordion" (activeIndexChange)="onAccordionOpen($event, cat.path)">
                  <p-accordionTab [value]="cat.path">
                    <ng-template pTemplate="header">
                      <span class="cat-header">
                        <i class="pi pi-folder"></i>
                        {{ cat.nome }}
                      </span>
                    </ng-template>
                    <ng-container *ngTemplateOutlet="conteudoPorPath; context: { path: cat.path }"></ng-container>
                  </p-accordionTab>
                </p-accordion>
              </div>
            }
          </div>
        </app-list-data-states>
      }
    </div>

    <ng-template #conteudoPorPath let-path="path">
      @if (getLoaded(path); as data) {
        @if (data.categorias?.length) {
          <p-accordion [multiple]="true" styleClass="nested-accordion" (activeIndexChange)="onNestedOpen(path, $event, data.categorias)">
            @for (sub of data.categorias; track sub.path) {
              <p-accordionTab [value]="sub.path">
                <ng-template pTemplate="header">
                  <span class="sub-header"><i class="pi pi-folder"></i> {{ sub.nome }}</span>
                </ng-template>
                <ng-container *ngTemplateOutlet="conteudoPorPath; context: { path: sub.path }"></ng-container>
              </p-accordionTab>
            }
          </p-accordion>
        }
        @if (data.arquivos?.length) {
          <div class="livros-grid">
            @for (arq of data.arquivos; track arq.path) {
              <div class="livro-card" (click)="abrirArquivo(arq)" role="button" tabindex="0" (keydown.enter)="abrirArquivo(arq)">
                <div class="livro-capa" [class]="'tipo-' + getTipo(arq.nome)">
                  <i [class]="getIcone(arq.nome)"></i>
                </div>
                <div class="livro-titulo">{{ arq.nome }}</div>
                @if (isDocAntigo(arq.nome)) {
                  <div class="livro-dica">{{ 'biblioteca.docxOnly' | translate }}</div>
                }
              </div>
            }
          </div>
        }
        @if (!data.categorias?.length && !data.arquivos?.length) {
          <p class="vazio-pasta">{{ 'biblioteca.emptyFolder' | translate }}</p>
        }
      } @else if (loadingPath === path) {
        <div class="loading-pasta">
          <i class="pi pi-spin pi-spinner"></i>
          <span>{{ 'biblioteca.loadingFolder' | translate }}</span>
        </div>
      }
    </ng-template>

    <p-dialog styleClass="as-hero-dialog dialog-conteudo" [(visible)]="dialogVisivel" [header]="arquivoSelecionado?.nome" [modal]="true"
      [style]="dialogStyle" [contentStyle]="dialogContentStyle"
      (onHide)="fecharDialog()" [closable]="true">
      @if (arquivoSelecionado) {
        @if (conteudoCarregando) {
          <div class="conteudo-loading">
            <i class="pi pi-spin pi-spinner" style="font-size: 2rem;"></i>
            <p>{{ 'biblioteca.openingPreview' | translate }}</p>
          </div>
        } @else if (conteudoErroKey || conteudoErroRaw) {
          <div class="conteudo-erro">
            <i class="pi pi-exclamation-triangle"></i>
            <p>
              @if (conteudoErroKey) {
                {{ conteudoErroKey | translate:conteudoErroParams }}
              } @else {
                {{ conteudoErroRaw }}
              }
            </p>
          </div>
        } @else if (conteudoHtmlSafe !== null) {
          <div [class]="getTipo(arquivoSelecionado!.nome) === 'word' ? 'conteudo-word' : 'conteudo-excel'" [innerHTML]="conteudoHtmlSafe"></div>
        } @else if (slideBlob) {
          <div class="conteudo-slide-wrap">
            <canvas #slideCanvas class="conteudo-slide-canvas" width="960" height="540"></canvas>
            @if (pptxViewer) {
              <div class="conteudo-slide-nav">
                <button type="button" class="slide-nav-btn" (click)="pptxAnterior()" [disabled]="!pptxPodeAnterior"><i class="pi pi-chevron-left"></i> {{ 'biblioteca.slide.prev' | translate }}</button>
                <span class="conteudo-slide-status">{{ pptxSlideAtual }} / {{ pptxTotalSlides }}</span>
                <button type="button" class="slide-nav-btn" (click)="pptxProximo()" [disabled]="!pptxPodeProximo">{{ 'biblioteca.slide.next' | translate }} <i class="pi pi-chevron-right"></i></button>
              </div>
            }
          </div>
        } @else if (conteudoUrl && conteudoUrlSafe) {
          @if (getTipo(arquivoSelecionado.nome) === 'pdf') {
            <iframe [src]="conteudoUrlSafe" class="conteudo-iframe" title="{{ arquivoSelecionado.nome }}"></iframe>
          } @else if (getTipo(arquivoSelecionado.nome) === 'image') {
            <img [src]="conteudoUrlSafe" [alt]="arquivoSelecionado.nome" class="conteudo-img">
          } @else {
            <iframe [src]="conteudoUrlSafe" class="conteudo-iframe" title="{{ arquivoSelecionado.nome }}"></iframe>
          }
        }
      }
    </p-dialog>
  `,
  styles: [`
    .biblioteca-page {
      min-height: 100%;
      padding: 0;
      background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
    }
    .erro-wrap {
      text-align: center;
      padding: 3rem 1rem;
      color: #dc2626;
    }
    .biblioteca-empty-path {
      margin: 0.5rem 0 0;
      font-size: 0.85rem;
      color: #64748b;
    }
    .biblioteca-empty-path code {
      background: #f1f5f9;
      padding: 0.15rem 0.35rem;
      border-radius: 4px;
      font-size: 0.8rem;
    }
    .categorias-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.25rem;
      align-items: start;
    }
    .accordion-col {
      min-width: 0;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }
    :host ::ng-deep .biblioteca-accordion .p-accordion-header-link {
      padding: 0.875rem 1rem;
      font-weight: 600;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    :host ::ng-deep .biblioteca-accordion .p-accordion-content {
      padding: 1rem;
      background: #fff;
      border-bottom: 1px solid #e2e8f0;
    }
    .cat-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .cat-header i { color: #0ea5e9; }
    :host ::ng-deep .nested-accordion .p-accordion-header-link {
      padding: 0.5rem 0.75rem;
      font-size: 0.9rem;
    }
    .sub-header {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .sub-header i { color: #64748b; font-size: 0.85rem; }
    .categoria-body { padding: 0.25rem 0; }
    .livros-grid.raiz { margin-bottom: 1.25rem; }
    .loading-pasta, .vazio-pasta {
      padding: 0.75rem;
      color: #64748b;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .vazio-pasta { margin: 0; }
    .livros-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
      gap: 0.75rem;
      padding: 0.5rem 0;
    }
    .livro-card {
      cursor: pointer;
      text-align: center;
      border-radius: 10px;
      overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;
      background: #fff;
      border: 1px solid #e2e8f0;
    }
    .livro-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.08);
      border-color: #cbd5e1;
    }
    .livro-capa {
      aspect-ratio: 3/4;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      color: #fff;
    }
    .livro-capa.tipo-pdf { background: linear-gradient(145deg, #b91c1c 0%, #7f1d1d 100%); }
    .livro-capa.tipo-word { background: linear-gradient(145deg, #1e40af 0%, #1e3a8a 100%); }
    .livro-capa.tipo-excel { background: linear-gradient(145deg, #15803d 0%, #14532d 100%); }
    .livro-capa.tipo-slide { background: linear-gradient(145deg, #c2410c 0%, #9a3412 100%); }
    .livro-capa.tipo-image { background: linear-gradient(145deg, #0369a1 0%, #0c4a6e 100%); }
    .livro-capa.tipo-text { background: linear-gradient(145deg, #15803d 0%, #14532d 100%); }
    .livro-capa.tipo-other { background: linear-gradient(145deg, #475569 0%, #334155 100%); }
    .livro-titulo {
      padding: 0.45rem 0.3rem;
      font-size: 0.7rem;
      font-weight: 600;
      color: #334155;
      line-height: 1.2;
      word-break: break-word;
    }
    .livro-dica {
      font-size: 0.6rem;
      color: #64748b;
      padding: 0 0.3rem 0.4rem;
      line-height: 1.1;
    }
    .conteudo-iframe {
      width: 100%;
      height: 100%;
      min-height: 70vh;
      border: none;
    }
    .conteudo-img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 0 auto;
    }
    .conteudo-loading, .conteudo-erro {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 2rem;
      color: #64748b;
      min-height: 200px;
    }
    .conteudo-erro { color: #dc2626; }
    .conteudo-word {
      padding: 1rem;
      min-height: 300px;
      max-width: 100%;
      overflow: auto;
      font-family: inherit;
      line-height: 1.5;
      color: #334155;
    }
    .conteudo-word :deep(h1) { font-size: 1.5rem; margin: 0.75rem 0 0.5rem; }
    .conteudo-word :deep(h2) { font-size: 1.25rem; margin: 0.5rem 0; }
    .conteudo-word :deep(p) { margin: 0.5rem 0; }
    .conteudo-word :deep(table) { border-collapse: collapse; width: 100%; margin: 0.5rem 0; }
    .conteudo-word :deep(th), .conteudo-word :deep(td) { border: 1px solid #e2e8f0; padding: 0.35rem 0.5rem; text-align: left; }
    .conteudo-excel {
      padding: 1rem;
      max-width: 100%;
      overflow: auto;
      font-size: 0.9rem;
    }
    .conteudo-excel :deep(table) { border-collapse: collapse; width: 100%; margin: 0.5rem 0; }
    .conteudo-excel :deep(th), .conteudo-excel :deep(td) { border: 1px solid #cbd5e1; padding: 0.4rem 0.6rem; text-align: left; }
    .conteudo-excel :deep(tr:nth-child(even)) { background: #f8fafc; }
    .conteudo-slide-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem;
      min-width: 0;
      width: 100%;
    }
    .conteudo-slide-canvas {
      display: block;
      width: 100%;
      min-width: 640px;
      max-width: 960px;
      height: auto;
      aspect-ratio: 16 / 9;
      background: #1e293b;
      border-radius: 8px;
    }
    .conteudo-slide-nav {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .slide-nav-btn {
      padding: 0.4rem 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background: #fff;
      cursor: pointer;
      font-size: 0.9rem;
    }
    .slide-nav-btn:hover:not(:disabled) { background: #f1f5f9; }
    .slide-nav-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .conteudo-slide-status { font-size: 0.9rem; color: #64748b; min-width: 4rem; text-align: center; }
  `]
})
export class BibliotecaComponent implements OnInit, OnDestroy {
  private bibliotecaService = inject(BibliotecaService);
  private sanitizer = inject(DomSanitizer);
  private cdr = inject(ChangeDetectorRef);
  private readonly i18n = inject(TranslationService);
  private langSub?: Subscription;

  /** Força reavaliação de templates (ex.: cabeçalhos PrimeNG) ao mudar idioma */
  uiLang = this.i18n.getCurrentLanguage();

  categoriasRaiz: CategoriaItemBiblioteca[] = [];
  arquivosRaiz: ArquivoBiblioteca[] = [];
  /** Cache por path: ao expandir uma pasta, carregamos e guardamos aqui */
  loadedChildren = new Map<string, ChildrenBiblioteca>();
  loading = true;
  loadingPath: string | null = null;
  infoPath = '';

  dialogVisivel = false;
  arquivoSelecionado: ArquivoBiblioteca | null = null;
  /** URL do blob para iframe/img (sempre inline, nunca download) */
  conteudoUrl: string | null = null;
  /** Versão sanitizada da URL (cacheada para não piscar o iframe a cada change detection) */
  conteudoUrlSafe: SafeResourceUrl | null = null;
  /** Conteúdo HTML para .doc/.docx e planilhas (visualização inline) */
  conteudoHtmlSafe: SafeHtml | null = null;
  /** Blob do .pptx para o viewer de slides */
  slideBlob: Blob | null = null;
  /** Instância do viewer de PowerPoint (pptxviewjs) */
  pptxViewer: PPTXViewer | null = null;
  pptxSlideAtual = 0;
  pptxTotalSlides = 0;
  pptxPodeAnterior = false;
  pptxPodeProximo = false;
  /** Blob URL a ser revogada ao fechar o dialog */
  private blobUrlParaRevogar: string | null = null;
  conteudoCarregando = false;
  /** Mensagem de erro do diálogo: chave i18n (preferencial) */
  conteudoErroKey: string | null = null;
  conteudoErroParams?: Record<string, string>;
  /** Mensagem vinda da API ou texto não catalogado */
  conteudoErroRaw = '';

  /** Erro ao carregar a página da biblioteca */
  erroKey: string | null = null;
  erroParams?: Record<string, string>;
  erroRaw = '';

  @ViewChild('slideCanvas') slideCanvasRef?: ElementRef<HTMLCanvasElement>;

  /** Dialog maior para slides (canvas 960x540) */
  get dialogStyle(): { width: string; maxWidth: string } {
    const isSlide = this.arquivoSelecionado && this.getTipo(this.arquivoSelecionado.nome) === 'slide';
    return isSlide
      ? { width: '96vw', maxWidth: '1200px' }
      : { width: '90vw', maxWidth: '900px' };
  }
  get dialogContentStyle(): { height: string; overflow: string } {
    const isSlide = this.arquivoSelecionado && this.getTipo(this.arquivoSelecionado.nome) === 'slide';
    return { height: isSlide ? '85vh' : '80vh', overflow: 'auto' };
  }

  get bibliotecaItemCount(): number {
    return (this.categoriasRaiz?.length ?? 0) + (this.arquivosRaiz?.length ?? 0);
  }

  getLoaded(path: string): ChildrenBiblioteca | null {
    return this.loadedChildren.get(path) ?? null;
  }

  private clearPageErro(): void {
    this.erroKey = null;
    this.erroParams = undefined;
    this.erroRaw = '';
  }

  private setPageErroFromFetch(err: unknown): void {
    const e = err as {
      error?: { error?: string; message?: string } | string;
      message?: string;
      status?: number;
    };
    const body = e.error;
    const fromObject =
      typeof body === 'object' && body != null
        ? (body as { error?: string; message?: string }).error ||
          (body as { error?: string; message?: string }).message
        : undefined;
    const fromString = typeof body === 'string' ? body : undefined;
    const msg = (fromObject || e.message || '').trim();
    const isHtml = typeof fromString === 'string' && fromString.trim().startsWith('<');
    this.clearPageErro();
    if (isHtml || e.status === 404) {
      this.erroKey = 'biblioteca.error.endpoint404';
    } else if (msg) {
      this.erroRaw = msg;
    } else {
      this.erroKey = 'biblioteca.error.loadStructure';
    }
  }

  private clearConteudoErro(): void {
    this.conteudoErroKey = null;
    this.conteudoErroParams = undefined;
    this.conteudoErroRaw = '';
  }

  private setConteudoErroKey(key: string, params?: Record<string, string>): void {
    this.conteudoErroKey = key;
    this.conteudoErroParams = params;
    this.conteudoErroRaw = '';
  }

  private setConteudoErroRaw(raw: string): void {
    this.conteudoErroKey = null;
    this.conteudoErroParams = undefined;
    this.conteudoErroRaw = raw;
  }

  ngOnInit() {
    this.uiLang = this.i18n.getCurrentLanguage();
    this.langSub = this.i18n.getCurrentLanguage$().subscribe((lang) => {
      this.uiLang = lang;
      this.cdr.detectChanges();
    });

    this.bibliotecaService.getInfo().subscribe({
      next: (info: { path?: string; exists?: boolean; isDirectory?: boolean }) => {
        this.infoPath = info.path ?? '';
      }
    });
    this.bibliotecaService.getChildren('').subscribe({
      next: (res) => {
        this.clearPageErro();
        this.categoriasRaiz = res.categorias ?? [];
        this.arquivosRaiz = res.arquivos ?? [];
        this.loadedChildren.set('', res);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.setPageErroFromFetch(err);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  /** Quando o usuário abre um accordion da raiz, carrega os filhos daquela categoria */
  onAccordionOpen(index: number | number[], catPath: string) {
    const i = Array.isArray(index) ? index[0] : index;
    if (i == null || i < 0) return;
    if (this.loadedChildren.has(catPath)) return;
    this.loadingPath = catPath;
    this.cdr.markForCheck();
    this.bibliotecaService.getChildren(catPath).subscribe({
      next: (res) => {
        this.loadedChildren.set(catPath, res);
        this.loadingPath = null;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadedChildren.set(catPath, { categorias: [], arquivos: [] });
        this.loadingPath = null;
        this.cdr.markForCheck();
      }
    });
  }

  /** Quando o usuário abre um sub-accordion, carrega os filhos daquela subpasta */
  onNestedOpen(parentPath: string, index: number | number[], categorias: CategoriaItemBiblioteca[]) {
    const i = Array.isArray(index) ? index[0] : index;
    if (i == null || i < 0 || !categorias?.[i]) return;
    const subPath = categorias[i].path;
    if (this.loadedChildren.has(subPath)) return;
    this.loadingPath = subPath;
    this.cdr.markForCheck();
    this.bibliotecaService.getChildren(subPath).subscribe({
      next: (res) => {
        this.loadedChildren.set(subPath, res);
        this.loadingPath = null;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadedChildren.set(subPath, { categorias: [], arquivos: [] });
        this.loadingPath = null;
        this.cdr.markForCheck();
      }
    });
  }

  abrirArquivo(arq: ArquivoBiblioteca) {
    if (this.conteudoCarregando) return;
    this.revogarBlobUrl();
    this.arquivoSelecionado = arq;
    this.conteudoUrl = null;
    this.conteudoUrlSafe = null;
    this.conteudoHtmlSafe = null;
    this.slideBlob = null;
    this.destroyPptxViewer();
    this.clearConteudoErro();
    this.conteudoCarregando = true;
    this.dialogVisivel = true;
    this.cdr.markForCheck();

    if (this.getTipo(arq.nome) === 'word' && this.isDocAntigo(arq.nome)) {
      this.conteudoCarregando = false;
      this.setConteudoErroKey('biblioteca.error.docxOnlyPreview');
      this.cdr.markForCheck();
      return;
    }

    this.bibliotecaService.getConteudoBlob(arq.path).subscribe({
      next: (blob) => {
        const tipo = this.getTipo(arq.nome);
        if (tipo === 'word') {
          const ext = (arq.nome.split('.').pop() || '').toLowerCase();
          if (blob.type && blob.type.indexOf('text/html') >= 0) {
            this.conteudoCarregando = false;
            this.setConteudoErroKey('biblioteca.error.serverHtmlInsteadOfFile');
            this.cdr.detectChanges();
            return;
          }
          blob.arrayBuffer().then((buf) => {
            mammoth.convertToHtml({ arrayBuffer: buf })
              .then((result: { value: string }) => {
                const emptyPara = '<p>' + this.i18n.translate('biblioteca.word.emptyDoc') + '</p>';
                const html = result.value || emptyPara;
                this.conteudoHtmlSafe = this.sanitizer.bypassSecurityTrustHtml(html);
                this.conteudoCarregando = false;
                this.clearConteudoErro();
                this.cdr.detectChanges();
              })
              .catch((err: unknown) => {
                this.conteudoCarregando = false;
                const detail =
                  err instanceof Error ? err.message : this.i18n.translate('biblioteca.error.unknownReason');
                if (ext === 'doc') {
                  this.setConteudoErroKey('biblioteca.error.docxOnlyPreview');
                } else {
                  this.setConteudoErroKey('biblioteca.error.wordConvertFailed', { detail });
                }
                this.cdr.detectChanges();
              });
          }).catch(() => {
            this.conteudoCarregando = false;
            this.setConteudoErroKey('biblioteca.error.readFile');
            this.cdr.detectChanges();
          });
          return;
        }
        if (tipo === 'excel') {
          blob.arrayBuffer().then((buf) => {
            try {
              const wb = XLSX.read(buf, { type: 'array' });
              const firstSheetName = wb.SheetNames?.[0];
              if (!firstSheetName) {
                this.conteudoCarregando = false;
                this.setConteudoErroKey('biblioteca.error.spreadsheetEmpty');
                this.cdr.markForCheck();
                return;
              }
              const ws = wb.Sheets[firstSheetName];
              const html = XLSX.utils.sheet_to_html(ws, { id: 'planilha-biblioteca' });
              this.conteudoHtmlSafe = this.sanitizer.bypassSecurityTrustHtml(html);
              this.conteudoCarregando = false;
              this.clearConteudoErro();
              this.cdr.markForCheck();
            } catch {
              this.conteudoCarregando = false;
              this.setConteudoErroKey('biblioteca.error.spreadsheetOpenFailed');
              this.cdr.markForCheck();
            }
          }).catch(() => {
            this.conteudoCarregando = false;
            this.setConteudoErroKey('biblioteca.error.readFile');
            this.cdr.markForCheck();
          });
          return;
        }
        if (tipo === 'slide') {
          this.slideBlob = blob;
          this.conteudoCarregando = false;
          this.clearConteudoErro();
          this.cdr.markForCheck();
          setTimeout(() => this.initPptxViewer(), 200);
          return;
        }
        const url = URL.createObjectURL(blob);
        this.blobUrlParaRevogar = url;
        this.conteudoUrl = url;
        this.conteudoUrlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        this.conteudoCarregando = false;
        this.clearConteudoErro();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.conteudoCarregando = false;
        const e = err as { status?: number; error?: { error?: string; message?: string }; message?: string };
        if (e.status === 401) {
          this.setConteudoErroKey('biblioteca.error.loginRequired');
        } else {
          const apiMsg = e.error?.error || e.error?.message || e.message;
          if (apiMsg && String(apiMsg).trim()) {
            this.setConteudoErroRaw(String(apiMsg).trim());
          } else {
            this.setConteudoErroKey('biblioteca.error.loadFileFailed');
          }
        }
        this.cdr.markForCheck();
      }
    });
  }

  private revogarBlobUrl() {
    if (this.blobUrlParaRevogar) {
      URL.revokeObjectURL(this.blobUrlParaRevogar);
      this.blobUrlParaRevogar = null;
    }
  }

  fecharDialog() {
    this.revogarBlobUrl();
    this.destroyPptxViewer();
    this.slideBlob = null;
    this.dialogVisivel = false;
    this.arquivoSelecionado = null;
    this.conteudoUrl = null;
    this.conteudoUrlSafe = null;
    this.conteudoHtmlSafe = null;
    this.conteudoCarregando = false;
    this.clearConteudoErro();
    this.cdr.markForCheck();
  }

  private initPptxViewer() {
    const canvas = this.slideCanvasRef?.nativeElement;
    if (!canvas || !this.slideBlob) return;
    this.destroyPptxViewer();
    try {
      this.pptxViewer = new PPTXViewer({ canvas });
      this.slideBlob.arrayBuffer().then((ab) => {
        return this.pptxViewer!.loadFile(ab);
      }).then(() => {
        return this.pptxViewer!.render();
      }).then(() => {
        this.pptxTotalSlides = this.pptxViewer?.getSlideCount() ?? 0;
        this.pptxSlideAtual = (this.pptxViewer?.getCurrentSlideIndex() ?? 0) + 1;
        this.pptxPodeAnterior = this.pptxSlideAtual > 1;
        this.pptxPodeProximo = this.pptxSlideAtual < this.pptxTotalSlides;
        this.cdr.markForCheck();
      }).catch(() => {
        this.setConteudoErroKey('biblioteca.error.presentationDisplay');
        this.cdr.markForCheck();
      });
    } catch {
      this.setConteudoErroKey('biblioteca.error.slideViewerInit');
      this.cdr.markForCheck();
    }
  }

  private destroyPptxViewer() {
    this.pptxViewer = null;
    this.pptxSlideAtual = 0;
    this.pptxTotalSlides = 0;
    this.pptxPodeAnterior = false;
    this.pptxPodeProximo = false;
  }

  pptxAnterior() {
    this.pptxViewer?.previousSlide().then(() => this.pptxViewer?.render()).then(() => {
      this.pptxSlideAtual = (this.pptxViewer?.getCurrentSlideIndex() ?? 0) + 1;
      this.pptxPodeAnterior = this.pptxSlideAtual > 1;
      this.pptxPodeProximo = this.pptxSlideAtual < this.pptxTotalSlides;
      this.cdr.markForCheck();
    });
  }

  pptxProximo() {
    this.pptxViewer?.nextSlide().then(() => this.pptxViewer?.render()).then(() => {
      this.pptxSlideAtual = (this.pptxViewer?.getCurrentSlideIndex() ?? 0) + 1;
      this.pptxPodeAnterior = this.pptxSlideAtual > 1;
      this.pptxPodeProximo = this.pptxSlideAtual < this.pptxTotalSlides;
      this.cdr.markForCheck();
    });
  }

  /** True apenas para .doc (formato antigo), não para .docx */
  isDocAntigo(nome: string): boolean {
    const n = nome.toLowerCase();
    return n.endsWith('.doc') && !n.endsWith('.docx');
  }

  getTipo(nome: string): string {
    const ext = (nome.split('.').pop() || '').toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (['doc', 'docx'].includes(ext)) return 'word';
    if (['xls', 'xlsx'].includes(ext)) return 'excel';
    if (['ppt', 'pptx'].includes(ext)) return 'slide';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
    if (['txt', 'html', 'htm', 'json', 'xml'].includes(ext)) return 'text';
    return 'other';
  }

  getIcone(nome: string): string {
    const t = this.getTipo(nome);
    if (t === 'pdf') return 'pi pi-file-pdf';
    if (t === 'word') return 'pi pi-file-word';
    if (t === 'excel') return 'pi pi-file-excel';
    if (t === 'slide') return 'pi pi-presentation';
    if (t === 'image') return 'pi pi-image';
    if (t === 'text') return 'pi pi-file';
    return 'pi pi-file';
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }
}
