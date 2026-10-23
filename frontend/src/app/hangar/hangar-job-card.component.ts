import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { TranslatePipe } from '../core/translate.pipe';
import { TranslationService } from '../core/translation.service';
import { translateApiMessage } from '../core/backend-i18n-message.util';
import { ProgressBarModule } from 'primeng/progressbar';
import { JobCard, JobCardFase, JobCardListItem, JobCardService } from '../core/job-card.service';
import { HangarOfflineCacheService } from '../core/hangar-offline-cache.service';
import { HangarOfflineSyncService } from '../core/hangar-offline-sync.service';
import { OSFileService } from '../core/os-file.service';

@Component({
  selector: 'app-hangar-job-card',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    InputTextareaModule,
    InputNumberModule,
    TabViewModule,
    TagModule,
    ProgressBarModule,
    ToastModule,
    MessageModule,
    TranslatePipe
  ],
  providers: [MessageService],
  styleUrls: ['./hangar-job-card.component.scss'],
  template: `
    <p-toast></p-toast>
    <div class="hangar-shell">
      <p-message
        *ngIf="!offlineCache.isOnline() || offlinePending > 0"
        severity="warn"
        [text]="offlineBannerText"
        styleClass="w-full mb-2"></p-message>
      <header class="hangar-header">
        <div>
          <h1><i class="pi pi-mobile"></i> {{ 'hangar.title' | translate }}</h1>
          <p>{{ 'hangar.subtitle' | translate }}</p>
          <small class="pwa-hint">{{ 'hangar.offline.pwaHint' | translate }}</small>
        </div>
        <div class="header-actions">
          <button
            *ngIf="offlinePending > 0 && offlineCache.isOnline()"
            pButton
            type="button"
            icon="pi pi-sync"
            class="p-button-outlined p-button-sm"
            [label]="'hangar.offline.syncNow' | translate"
            [loading]="syncing"
            (click)="sincronizarAgora()"></button>
          <button
            *ngIf="osId"
            pButton
            type="button"
            icon="pi pi-arrow-left"
            class="p-button-text"
            [label]="'hangar.back' | translate"
            (click)="voltarLista()"></button>
        </div>
      </header>

      <ng-container *ngIf="!osId">
        <div class="search-sticky">
          <div class="search-bar">
            <span class="p-input-icon-left w-full">
              <i class="pi pi-search"></i>
              <input
                pInputText
                class="w-full"
                [(ngModel)]="search"
                (keyup.enter)="carregarLista()"
                [placeholder]="'hangar.search' | translate" />
            </span>
            <button
              pButton
              icon="pi pi-search"
              type="button"
              [attr.aria-label]="'hangar.search' | translate"
              (click)="carregarLista()"
              [loading]="loadingLista"></button>
          </div>
          <p class="list-summary" *ngIf="!loadingLista && itens.length > 0">
            {{ 'hangar.list.count' | translate:{ count: String(itens.length) } }}
          </p>
        </div>

        <p *ngIf="!loadingLista && itens.length === 0" class="empty">{{ 'hangar.empty' | translate }}</p>

        <div class="kanban-board" *ngIf="itens.length > 0">
          <section class="kanban-col" *ngFor="let fase of fases">
            <header class="kanban-col__head">
              <span class="kanban-col__title">{{ fase.labelKey | translate }}</span>
              <span class="kanban-col__count">{{ itensPorFase(fase.code).length }}</span>
            </header>
            <ul class="kanban-col__cards">
              <li
                class="job-card"
                *ngFor="let item of itensPorFase(fase.code)"
                (click)="abrirOs(item)"
                (keydown.enter)="abrirOs(item)"
                tabindex="0"
                role="button"
                [attr.aria-label]="'hangar.card.line' | translate:{ numero: String(item.numeroOs), cliente: item.clienteNome || '—' }">
                <div class="job-card__head">
                  <div class="job-card__ids">
                    <span class="job-card__os">OS {{ item.numeroOs }}</span>
                    <span class="job-card__ref">{{ 'hangar.card.internalId' | translate:{ id: String(item.osId) } }}</span>
                  </div>
                  <p-tag
                    [value]="faseLabelKey(item) | translate"
                    [severity]="faseSeverity(item.faseJob)"
                    styleClass="job-card__tag"></p-tag>
                </div>
                <p class="job-card__cliente">{{ item.clienteNome || '—' }}</p>
                <div class="job-card__meta">
                  <span class="job-card__chip job-card__chip--aircraft" *ngIf="item.marcasMatricula">
                    <i class="pi pi-send" aria-hidden="true"></i>
                    <span>{{ 'hangar.card.registration' | translate }}: <strong>{{ item.marcasMatricula }}</strong></span>
                  </span>
                  <span class="job-card__chip" *ngIf="item.tipoServico">{{ item.tipoServico }}</span>
                  <span class="job-card__chip" *ngIf="item.partNumber">PN {{ item.partNumber }}</span>
                  <span class="job-card__chip" *ngIf="item.serialNumber">SN {{ item.serialNumber }}</span>
                </div>
                <div class="job-card__progress" *ngIf="item.progressPct != null">
                  <div class="job-card__progress-head">
                    <span>{{ 'hangar.card.progress' | translate }}</span>
                    <span>{{ item.progressPct }}%</span>
                  </div>
                  <p-progressBar [value]="item.progressPct" [showValue]="false"></p-progressBar>
                </div>
                <footer class="job-card__foot" *ngIf="item.dtAbertura">
                  <small>{{ 'hangar.card.opened' | translate:{ date: formatDataAbertura(item.dtAbertura) } }}</small>
                  <small *ngIf="item.crsEmitido" class="job-card__crs">CRS</small>
                </footer>
              </li>
            </ul>
          </section>
        </div>
      </ng-container>

      <ng-container *ngIf="osId && card">
        <p-message
          *ngIf="card.alertaCrsSegregacao && !card.crsEmitido"
          severity="warn"
          [text]="'hangar.crsSegregacao.aviso' | translate"
          styleClass="w-full mb-2"></p-message>
        <p-message
          *ngFor="let alerta of card.alertasConformidade"
          severity="warn"
          [text]="alertaTexto(alerta)"
          styleClass="w-full mb-2"></p-message>

        <div class="os-summary">
          <h2>OS {{ card.numeroOs }}</h2>
          <p>{{ card.clienteNome }}</p>
          <p-tag *ngIf="card.crsEmitido" severity="success" value="CRS"></p-tag>
          <div class="meta">
            <span *ngIf="card.partNumber">PN {{ card.partNumber }}</span>
            <span *ngIf="card.serialNumber">SN {{ card.serialNumber }}</span>
            <span *ngIf="card.tipoServico">{{ card.tipoServico }}</span>
          </div>
        </div>

        <p-tabView>
          <p-tabPanel [header]="'hangar.tab.execucao' | translate">
            <div class="form-grid">
              <div class="field">
                <label>{{ 'hangar.field.inicio' | translate }}</label>
                <textarea pInputTextarea rows="2" [(ngModel)]="execInicio"></textarea>
              </div>
              <div class="field">
                <label>{{ 'hangar.field.fim' | translate }}</label>
                <textarea pInputTextarea rows="2" [(ngModel)]="execFim"></textarea>
              </div>
              <div class="field">
                <label>{{ 'hangar.field.obsIni' | translate }}</label>
                <textarea pInputTextarea rows="2" [(ngModel)]="execObsIni"></textarea>
              </div>
              <div class="field">
                <label>{{ 'hangar.field.obsFim' | translate }}</label>
                <textarea pInputTextarea rows="2" [(ngModel)]="execObsFim"></textarea>
              </div>
              <button
                pButton
                [label]="'hangar.btn.salvarExecucao' | translate"
                icon="pi pi-save"
                [loading]="salvandoExec"
                (click)="salvarExecucao()"></button>
            </div>
          </p-tabPanel>

          <p-tabPanel [header]="'hangar.tab.horas' | translate">
            <p class="total-horas">
              {{ 'hangar.horas.total' | translate }}: <strong>{{ card.totalHoras ?? 0 }}</strong>
            </p>
            <ul class="apont-list" *ngIf="card.apontamentos?.length">
              <li *ngFor="let a of card.apontamentos">
                {{ a.trabalhoEm }} — {{ a.horas }}h
                <span *ngIf="a.descricao"> · {{ a.descricao }}</span>
                <span *ngIf="a.ferramentaIdentificador"> · {{ 'hangar.horas.ferramenta' | translate }}: {{ a.ferramentaIdentificador }}</span>
                <small *ngIf="a.usuarioNome"> ({{ a.usuarioNome }})</small>
              </li>
            </ul>
            <div class="form-grid">
              <div class="field">
                <label>{{ 'hangar.horas.data' | translate }}</label>
                <input pInputText type="date" [(ngModel)]="horasData" />
              </div>
              <div class="field">
                <label>{{ 'hangar.horas.qtd' | translate }}</label>
                <p-inputNumber [(ngModel)]="horasQtd" [min]="0.25" [max]="24" [step]="0.25" [useGrouping]="false"></p-inputNumber>
              </div>
              <div class="field wide">
                <label>{{ 'hangar.horas.desc' | translate }}</label>
                <input pInputText [(ngModel)]="horasDesc" />
              </div>
              <div class="field wide">
                <label>{{ 'hangar.horas.ferramenta' | translate }}</label>
                <input pInputText [(ngModel)]="horasFerramenta" [placeholder]="'hangar.horas.ferramentaPh' | translate" maxlength="80" />
              </div>
              <button
                pButton
                [label]="'hangar.btn.addHoras' | translate"
                icon="pi pi-clock"
                [loading]="salvandoHoras"
                (click)="registrarHoras()"></button>
            </div>
          </p-tabPanel>

          <p-tabPanel [header]="'hangar.tab.fotos' | translate">
            <p class="hint">{{ 'hangar.fotos.hint' | translate }}</p>
            <input type="file" accept="image/*" capture="environment" (change)="onFotoSelected($event)" />
            <button
              pButton
              class="p-button-outlined"
              icon="pi pi-camera"
              [label]="'hangar.btn.foto' | translate"
              [loading]="enviandoFoto"
              [disabled]="!fotoFile"
              (click)="enviarFoto()"></button>
            <ul class="foto-list" *ngIf="card.fotos?.length">
              <li *ngFor="let f of card.fotos">{{ f.originalName || f.fileName }}</li>
            </ul>
          </p-tabPanel>

          <p-tabPanel [header]="'hangar.tab.assinatura' | translate">
            <div class="assin-block" *ngFor="let papel of papeisAssinatura">
              <h4>{{ papel.labelKey | translate }}</h4>
              <p-tag [severity]="assinaturaOk(papel.code) ? 'success' : 'warn'"
                [value]="assinaturaOk(papel.code) ? ('hangar.assinatura.ok' | translate) : '—'"></p-tag>
              <div class="sig-integrity" *ngIf="assinaturaMeta(papel.code) as meta">
                <p-tag
                  *ngIf="meta.integridadeOk === true"
                  severity="success"
                  [value]="'hangar.assinatura.integridadeOk' | translate"></p-tag>
                <p-tag
                  *ngIf="meta.integridadeOk === false"
                  severity="danger"
                  [value]="'hangar.assinatura.integridadeFail' | translate"></p-tag>
                <small>{{ 'hangar.assinatura.hash' | translate }}: <code>{{ meta.sha256 }}</code></small>
                <small *ngIf="meta.ts">{{ 'hangar.assinatura.serverTs' | translate }}: {{ meta.ts }}</small>
              </div>
              <canvas
                #sigCanvas
                class="sig-canvas"
                [attr.data-papel]="papel.code"
                width="320"
                height="120"
                (pointerdown)="startDraw($event, papel.code)"
                (pointermove)="moveDraw($event, papel.code)"
                (pointerup)="endDraw()"
                (pointerleave)="endDraw()"></canvas>
              <div class="sig-actions">
                <button pButton class="p-button-text" [label]="'hangar.assinatura.clear' | translate" (click)="clearSig(papel.code)"></button>
                <button
                  pButton
                  [label]="'hangar.assinatura.save' | translate"
                  [loading]="salvandoAssinatura === papel.code"
                  (click)="salvarAssinatura(papel.code)"></button>
              </div>
            </div>
          </p-tabPanel>
        </p-tabView>
      </ng-container>
    </div>
  `
})
export class HangarJobCardComponent implements OnInit, OnDestroy {
  /** Exposto para os parâmetros das traduções no template Angular. */
  protected readonly String = String;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private jobCard = inject(JobCardService);
  offlineCache = inject(HangarOfflineCacheService);
  private offlineSync = inject(HangarOfflineSyncService);
  private osFiles = inject(OSFileService);
  private i18n = inject(TranslationService);
  private toast = inject(MessageService);

  osId: number | null = null;
  search = '';
  itens: JobCardListItem[] = [];
  loadingLista = false;
  card: JobCard | null = null;

  readonly fases: { code: JobCardFase; labelKey: string }[] = [
    { code: 'A_FAZER', labelKey: 'hangar.fase.todo' },
    { code: 'EM_ANDAMENTO', labelKey: 'hangar.fase.inProgress' },
    { code: 'AGUARDANDO_PECA', labelKey: 'hangar.fase.waitingParts' },
    { code: 'CONCLUIDO', labelKey: 'hangar.fase.done' }
  ];

  execInicio = '';
  execFim = '';
  execObsIni = '';
  execObsFim = '';
  salvandoExec = false;

  horasData = '';
  horasQtd = 1;
  horasDesc = '';
  horasFerramenta = '';
  salvandoHoras = false;

  fotoFile: File | null = null;
  enviandoFoto = false;

  papeisAssinatura = [
    { code: 'EXECUCAO', labelKey: 'hangar.assinatura.exec' },
    { code: 'INSPECAO', labelKey: 'hangar.assinatura.insp' }
  ];
  private sigCtx = new Map<string, CanvasRenderingContext2D>();
  private drawing = false;
  private activePapel = '';
  salvandoAssinatura = '';
  offlinePending = 0;
  syncing = false;

  get offlineBannerText(): string {
    const pending = this.offlinePending;
    const suffix =
      pending > 0
        ? this.i18n.translate('hangar.offline.pendingSuffix', { count: String(pending) })
        : '';
    return this.i18n.translate('hangar.offline.banner', { pending: suffix });
  }

  alertaTexto(alerta: string): string {
    return translateApiMessage(this.i18n, alerta);
  }

  ngOnInit(): void {
    this.refreshOfflinePending();
    if (this.offlineCache.isOnline() && this.offlinePending > 0) {
      queueMicrotask(() => this.notifyFlushResult());
    }
    const today = new Date().toISOString().slice(0, 10);
    this.horasData = today;
    this.route.paramMap.subscribe(params => {
      const raw = params.get('osId');
      this.osId = raw ? Number(raw) : null;
      if (this.osId) {
        this.carregarCard();
      } else {
        this.carregarLista();
      }
    });
  }

  ngOnDestroy(): void {
    this.sigCtx.clear();
  }

  private refreshOfflinePending(): void {
    this.offlinePending = this.offlineCache.pendingCount();
  }

  sincronizarAgora(): void {
    if (!this.offlineCache.isOnline() || this.syncing) {
      return;
    }
    this.syncing = true;
    void this.notifyFlushResult().finally(() => {
      this.syncing = false;
    });
  }

  carregarLista(): void {
    if (!this.offlineCache.isOnline()) {
      this.itens = this.offlineCache.loadLista();
      this.loadingLista = false;
      return;
    }
    this.loadingLista = true;
    this.jobCard.listarAbertas(this.search).subscribe({
      next: res => {
        this.itens = res.itens ?? [];
        this.offlineCache.saveLista(this.itens);
        this.loadingLista = false;
      },
      error: () => {
        this.itens = this.offlineCache.loadLista();
        this.loadingLista = false;
        if (!this.itens.length) {
          this.toast.add({ severity: 'error', summary: this.i18n.translate('hangar.err.load') });
        }
      }
    });
  }

  abrirOs(item: JobCardListItem): void {
    this.router.navigate(['/hangar', item.osId]);
  }

  itensPorFase(fase: JobCardFase): JobCardListItem[] {
    return this.itens.filter(i => (i.faseJob ?? 'A_FAZER') === fase);
  }

  faseLabelKey(item: JobCardListItem): string {
    switch (item.faseJob) {
      case 'EM_ANDAMENTO':
        return 'hangar.fase.inProgress';
      case 'AGUARDANDO_PECA':
        return 'hangar.fase.waitingParts';
      case 'CONCLUIDO':
        return 'hangar.fase.done';
      default:
        return 'hangar.fase.todo';
    }
  }

  faseSeverity(fase?: JobCardFase): 'success' | 'info' | 'warn' | 'secondary' {
    switch (fase) {
      case 'EM_ANDAMENTO':
        return 'info';
      case 'AGUARDANDO_PECA':
        return 'warn';
      case 'CONCLUIDO':
        return 'success';
      default:
        return 'secondary';
    }
  }

  formatDataAbertura(isoDate: string): string {
    const parts = isoDate.split('-');
    if (parts.length !== 3) {
      return isoDate;
    }
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  voltarLista(): void {
    this.router.navigate(['/hangar']);
  }

  carregarCard(): void {
    if (!this.osId) {
      return;
    }
    if (!this.offlineCache.isOnline()) {
      const cached = this.offlineCache.loadCard(this.osId);
      if (cached) {
        this.applyCard(cached);
      }
      return;
    }
    this.jobCard.obter(this.osId).subscribe({
      next: c => {
        this.offlineCache.saveCard(this.osId!, c);
        this.applyCard(c);
      },
      error: () => {
        const cached = this.offlineCache.loadCard(this.osId!);
        if (cached) {
          this.applyCard(cached);
        } else {
          this.toast.add({ severity: 'error', summary: this.i18n.translate('hangar.err.load') });
        }
      }
    });
  }

  private applyCard(c: JobCard): void {
    this.card = c;
    this.execInicio = c.inicioServico ?? '';
    this.execFim = c.fimServico ?? '';
    this.execObsIni = c.obsIniServ ?? '';
    this.execObsFim = c.obsFimServ ?? '';
    setTimeout(() => this.initCanvases(), 0);
  }

  salvarExecucao(): void {
    if (!this.osId) {
      return;
    }
    const body = {
      inicioServico: this.execInicio,
      fimServico: this.execFim,
      obsIniServ: this.execObsIni,
      obsFimServ: this.execObsFim
    };
    if (!this.offlineCache.isOnline()) {
      this.offlineCache.enqueue({ kind: 'execucao', osId: this.osId, body });
      this.persistCardLocally(body);
      this.refreshOfflinePending();
      this.toast.add({ severity: 'info', summary: this.i18n.translate('hangar.toast.offlineQueued') });
      return;
    }
    this.salvandoExec = true;
    this.jobCard.atualizarExecucao(this.osId, body).subscribe({
      next: c => {
        this.card = c;
        this.offlineCache.saveCard(this.osId!, c);
        this.salvandoExec = false;
        this.toast.add({ severity: 'success', summary: this.i18n.translate('hangar.toast.execucao') });
      },
      error: err => {
        this.salvandoExec = false;
        this.toastError(err);
      }
    });
  }

  registrarHoras(): void {
    if (!this.osId || !this.horasData) {
      return;
    }
    const body = {
      trabalhoEm: this.horasData,
      horas: this.horasQtd,
      descricao: this.horasDesc.trim() || undefined,
      ferramentaIdentificador: this.horasFerramenta.trim() || undefined
    };
    if (!this.offlineCache.isOnline()) {
      this.offlineCache.enqueue({ kind: 'apontamento', osId: this.osId, body });
      this.refreshOfflinePending();
      this.horasDesc = '';
      this.horasFerramenta = '';
      this.toast.add({ severity: 'info', summary: this.i18n.translate('hangar.toast.offlineQueued') });
      return;
    }
    this.salvandoHoras = true;
    this.jobCard.registrarApontamento(this.osId, body).subscribe({
      next: () => {
        this.salvandoHoras = false;
        this.horasDesc = '';
        this.horasFerramenta = '';
        this.toast.add({ severity: 'success', summary: this.i18n.translate('hangar.toast.horas') });
        this.carregarCard();
      },
      error: err => {
        this.salvandoHoras = false;
        this.toastError(err);
      }
    });
  }

  private persistCardLocally(exec: {
    inicioServico: string;
    fimServico: string;
    obsIniServ: string;
    obsFimServ: string;
  }): void {
    if (!this.osId || !this.card) {
      return;
    }
    const updated: JobCard = {
      ...this.card,
      inicioServico: exec.inicioServico,
      fimServico: exec.fimServico,
      obsIniServ: exec.obsIniServ,
      obsFimServ: exec.obsFimServ
    };
    this.card = updated;
    this.offlineCache.saveCard(this.osId, updated);
  }

  private async enqueueFotoOffline(file: File): Promise<void> {
    if (!this.osId) {
      return;
    }
    const dataUrl = await this.readFileAsDataUrl(file);
    this.offlineCache.enqueue({
      kind: 'foto',
      osId: this.osId,
      body: {
        fileName: file.name,
        mimeType: file.type || 'image/jpeg',
        dataUrl
      }
    });
    this.fotoFile = null;
    this.refreshOfflinePending();
    this.toast.add({ severity: 'info', summary: this.i18n.translate('hangar.toast.offlineQueued') });
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  private async notifyFlushResult(): Promise<void> {
    const result = await this.offlineSync.flush();
    this.refreshOfflinePending();
    if (result.ok > 0 && result.fail === 0) {
      this.toast.add({
        severity: 'success',
        summary: this.i18n.translate('hangar.toast.offlineSyncOk', { count: String(result.ok) })
      });
    } else if (result.ok > 0 && result.fail > 0) {
      this.toast.add({
        severity: 'warn',
        summary: this.i18n.translate('hangar.toast.offlineSyncPartial', {
          ok: String(result.ok),
          fail: String(result.fail)
        })
      });
    }
    if (this.osId) {
      this.carregarCard();
    } else {
      this.carregarLista();
    }
  }

  onFotoSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.fotoFile = input.files?.[0] ?? null;
  }

  enviarFoto(): void {
    if (!this.osId || !this.fotoFile) {
      return;
    }
    if (!this.offlineCache.isOnline()) {
      void this.enqueueFotoOffline(this.fotoFile);
      return;
    }
    this.enviandoFoto = true;
    this.osFiles.uploadFiles(this.osId, [this.fotoFile]).subscribe({
      next: () => {
        this.enviandoFoto = false;
        this.fotoFile = null;
        this.toast.add({ severity: 'success', summary: this.i18n.translate('hangar.toast.foto') });
        this.carregarCard();
      },
      error: () => {
        this.enviandoFoto = false;
        this.toast.add({ severity: 'error', summary: this.i18n.translate('hangar.err.save') });
      }
    });
  }

  assinaturaOk(papel: string): boolean {
    return !!this.card?.assinaturas?.find(a => a.papel === papel && a.presente);
  }

  assinaturaMeta(papel: string): { sha256: string; ts?: string; integridadeOk?: boolean | null } | null {
    const row = this.card?.assinaturas?.find(a => a.papel === papel && a.assinaturaSha256);
    if (!row?.assinaturaSha256) return null;
    return {
      sha256: row.assinaturaSha256,
      ts: row.assinaturaTimestampServer,
      integridadeOk: row.integridadeOk
    };
  }

  private initCanvases(): void {
    this.sigCtx.clear();
    const canvases = document.querySelectorAll<HTMLCanvasElement>('canvas.sig-canvas');
    canvases.forEach(canvas => {
      const papel = canvas.getAttribute('data-papel') ?? '';
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      this.sigCtx.set(papel, ctx);
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    });
  }

  startDraw(ev: PointerEvent, papel: string): void {
    const ctx = this.sigCtx.get(papel);
    const canvas = ev.target as HTMLCanvasElement;
    if (!ctx || !canvas) {
      return;
    }
    canvas.setPointerCapture(ev.pointerId);
    this.drawing = true;
    this.activePapel = papel;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(ev.clientX - rect.left, ev.clientY - rect.top);
  }

  moveDraw(ev: PointerEvent, papel: string): void {
    if (!this.drawing || this.activePapel !== papel) {
      return;
    }
    const ctx = this.sigCtx.get(papel);
    const canvas = ev.target as HTMLCanvasElement;
    if (!ctx || !canvas) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(ev.clientX - rect.left, ev.clientY - rect.top);
    ctx.stroke();
  }

  endDraw(): void {
    this.drawing = false;
    this.activePapel = '';
  }

  clearSig(papel: string): void {
    const ctx = this.sigCtx.get(papel);
    const canvas = document.querySelector<HTMLCanvasElement>(`canvas.sig-canvas[data-papel="${papel}"]`);
    if (!ctx || !canvas) {
      return;
    }
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  salvarAssinatura(papel: string): void {
    if (!this.osId) {
      return;
    }
    const canvas = document.querySelector<HTMLCanvasElement>(`canvas.sig-canvas[data-papel="${papel}"]`);
    if (!canvas) {
      return;
    }
    const dataUrl = canvas.toDataURL('image/png');
    if (!this.offlineCache.isOnline()) {
      this.offlineCache.enqueue({
        kind: 'assinatura',
        osId: this.osId,
        body: { papel, assinaturaPngBase64: dataUrl }
      });
      this.refreshOfflinePending();
      this.salvandoAssinatura = '';
      this.toast.add({ severity: 'info', summary: this.i18n.translate('hangar.toast.offlineQueued') });
      return;
    }
    this.salvandoAssinatura = papel;
    this.jobCard.salvarAssinatura(this.osId, { papel, assinaturaPngBase64: dataUrl }).subscribe({
      next: () => {
        this.salvandoAssinatura = '';
        this.toast.add({ severity: 'success', summary: this.i18n.translate('hangar.assinatura.ok') });
        this.carregarCard();
      },
      error: err => {
        this.salvandoAssinatura = '';
        this.toastError(err);
      }
    });
  }

  private toastError(err: { error?: unknown }): void {
    const msg = this.i18n.translateApiError(err?.error, 'hangar.err.save');
    this.toast.add({ severity: 'error', summary: msg });
  }
}
