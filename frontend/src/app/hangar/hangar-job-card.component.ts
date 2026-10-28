import { splitExecutionOrigin, combineExecutionOrigin, executionSnapshot, ExecutionOrigin } from './hangar-execution.util';
import { hourRows, filterHours, groupHours, sumHours, HourRow, HourGroup, PendingHourEntry, HourFilters, UNKNOWN_USER, PENDING_USER } from './hangar-hours.util';
import { CdkDragDrop, CdkDrag, CdkDropList, DragDropModule } from '@angular/cdk/drag-drop';
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
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { LocaleDateTimePipe } from '../core/locale/locale-datetime.pipe';
import { TranslatePipe } from '../core/translate.pipe';
import { TranslationService } from '../core/translation.service';
import { translateApiMessage } from '../core/backend-i18n-message.util';
import { ProgressBarModule } from 'primeng/progressbar';
import { JobCard, JobCardFase, JobCardListItem, JobCardService } from '../core/job-card.service';
import { HangarOfflineCacheService } from '../core/hangar-offline-cache.service';
import { HangarOfflineSyncService } from '../core/hangar-offline-sync.service';
import { OSFileService } from '../core/os-file.service';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';

@Component({
  selector: 'app-hangar-job-card',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    ConfirmDialogModule,
    LocaleDateTimePipe,
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
    TranslatePipe,
    PageHeroComponent
  ],
  providers: [MessageService, ConfirmationService],
  styleUrls: ['./hangar-job-card.component.scss'],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog key="signature"></p-confirmDialog>
    <div class="hangar-shell">
      <p-message
        *ngIf="!offlineCache.isOnline() || offlinePending > 0"
        severity="warn"
        [text]="offlineBannerText"
        styleClass="w-full mb-2"></p-message>
      <app-page-hero variant="navy" titleKey="hangar.title" subtitleKey="hangar.subtitle" titleIcon="pi-mobile" [hasActions]="true">
        <div actions class="header-actions">
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
      </app-page-hero>
      <p class="pwa-hint">{{ 'hangar.offline.pwaHint' | translate }}</p>

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

        <p class="board-help" *ngIf="itens.length">{{ 'hangar.board.help' | translate }}</p>
        <div class="kanban-board" cdkDropListGroup *ngIf="itens.length > 0" [attr.aria-busy]="movingId !== null">
          <section class="kanban-col" *ngFor="let fase of fases" cdkDropList [cdkDropListData]="fase.code"
            [cdkDropListEnterPredicate]="canEnter" [cdkDropListSortingDisabled]="true" (cdkDropListDropped)="dropCard($event)"
            [class.is-collapsed]="isCollapsed(fase.code)" [class.is-empty]="!itensPorFase(fase.code).length"
            [class.is-drop-target]="draggedItem && canMove(draggedItem, fase.code)">
            <header class="kanban-col__head">
              <span class="kanban-col__title">{{ fase.labelKey | translate }}</span>
              <span class="kanban-col__count">{{ itensPorFase(fase.code).length }}</span>
              <button type="button" class="column-toggle" *ngIf="!itensPorFase(fase.code).length"
                [attr.aria-expanded]="!isCollapsed(fase.code)" [attr.aria-label]="(('hangar.board.toggle' | translate) + ': ' + (fase.labelKey | translate))"
                (click)="toggleColumn(fase.code)"><i [class]="isCollapsed(fase.code) ? 'pi pi-chevron-right' : 'pi pi-chevron-left'" aria-hidden="true"></i></button>
            </header>
            <ul class="kanban-col__cards" [hidden]="isCollapsed(fase.code)">
              <li
                class="job-card" cdkDrag [cdkDragData]="item" [cdkDragDisabled]="!canDrag(item)"
                [cdkDragStartDelay]="{touch: 200, mouse: 0}" (cdkDragStarted)="draggedItem = item" (cdkDragEnded)="endDrag()"
                [class.is-priority]="item.prioridadeFila === 'AOG'" [class.is-overdue]="item.prazoVencido"
                *ngFor="let item of itensPorFase(fase.code)"
                (click)="abrirOs(item)"

                [attr.aria-label]="'hangar.card.line' | translate:{ numero: String(item.numeroOs), cliente: item.clienteNome || '—' }">
                <div class="job-card__head">
                  <div class="job-card__ids">
                    <button type="button" class="job-card__open" (click)="$event.stopPropagation(); abrirOs(item)">OS {{ item.numeroOs }}</button>
                    <span class="job-card__ref">{{ 'hangar.card.internalId' | translate:{ id: String(item.osId) } }}</span>
                  </div>
                  <p-tag
                    [value]="faseLabelKey(item) | translate"
                    [severity]="faseSeverity(item.faseJob)"
                    styleClass="job-card__tag"></p-tag>
                </div>
                <div class="job-card__alerts" *ngIf="item.prioridadeFila === 'AOG' || item.prazoVencido">
                  <span class="priority-badge" *ngIf="item.prioridadeFila === 'AOG'"><i class="pi pi-bolt" aria-hidden="true"></i> AOG</span>
                  <span class="overdue-badge" *ngIf="item.prazoVencido"><i class="pi pi-clock" aria-hidden="true"></i> {{ 'hangar.board.overdue' | translate }}</span>
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
                <div class="job-card__progress" *ngIf="item.progressPct != null" [class.is-active]="(item.progressPct || 0) > 0" [class.is-complete]="item.progressPct === 100">
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
                <div class="job-card__board-actions" (click)="$event.stopPropagation()">
                  <button type="button" class="drag-handle" cdkDragHandle *ngIf="canDrag(item)"
                    [attr.aria-label]="('hangar.board.drag' | translate) + ' OS ' + item.numeroOs"><i class="pi pi-arrows-alt" aria-hidden="true"></i></button>
                  <button type="button" class="move-card" *ngFor="let target of item.destinosPermitidos || []"
                    [disabled]="movingId !== null || !offlineCache.isOnline()" (click)="moveCard(item, target)">
                    {{ (target === 'EM_ANDAMENTO' ? 'hangar.board.start' : 'hangar.board.finish') | translate }}
                  </button>
                  <i class="pi pi-spin pi-spinner" *ngIf="movingId === item.osId" aria-hidden="true"></i>
                </div>
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
            <section class="execution-overview">
              <article><span>{{ 'hangar.execution.state' | translate }}</span><strong>{{ (card.fimServico ? 'hangar.execution.endRecorded' : card.inicioServico ? 'hangar.execution.started' : 'hangar.execution.waiting') | translate }}</strong></article>
              <article><span>{{ 'hangar.horas.total' | translate }}</span><strong>{{ formatHours(card.totalHoras || 0) }} h</strong></article>
              <article><span>{{ 'hangar.tab.assinatura' | translate }}</span><strong>{{ executionSignatureCount }} / 2</strong></article>
            </section>
            <aside class="execution-origin" *ngIf="execOrigin.line"><i class="pi pi-link" aria-hidden="true"></i><div><span>{{ 'hangar.execution.origin' | translate }}</span><p>{{ execOrigin.line }}</p></div></aside>
            <p class="execution-help">{{ 'hangar.execution.help' | translate }}</p>
            <form class="execution-form" (ngSubmit)="salvarExecucao()">
              <div class="execution-grid">
                <fieldset><legend><i class="pi pi-play" aria-hidden="true"></i>{{ 'hangar.execution.startBlock' | translate }}</legend>
                  <label for="hangar-exec-start">{{ 'hangar.field.inicio' | translate }}</label>
                  <textarea id="hangar-exec-start" name="execInicio" pInputTextarea rows="2" [(ngModel)]="execInicio" [disabled]="salvandoExec" [placeholder]="'hangar.execution.milestoneHint' | translate"></textarea>
                  <label for="hangar-exec-start-notes">{{ 'hangar.field.obsIni' | translate }}</label>
                  <textarea id="hangar-exec-start-notes" name="execObsIni" pInputTextarea rows="4" [(ngModel)]="execObsIni" [disabled]="salvandoExec"></textarea>
                </fieldset>
                <fieldset><legend><i class="pi pi-flag" aria-hidden="true"></i>{{ 'hangar.execution.endBlock' | translate }}</legend>
                  <label for="hangar-exec-end">{{ 'hangar.field.fim' | translate }}</label>
                  <textarea id="hangar-exec-end" name="execFim" pInputTextarea rows="2" [(ngModel)]="execFim" [disabled]="salvandoExec" [placeholder]="'hangar.execution.milestoneHint' | translate"></textarea>
                  <label for="hangar-exec-end-notes">{{ 'hangar.field.obsFim' | translate }}</label>
                  <textarea id="hangar-exec-end-notes" name="execObsFim" pInputTextarea rows="4" [(ngModel)]="execObsFim" [disabled]="salvandoExec"></textarea>
                </fieldset>
              </div>
              <footer class="execution-save-bar">
                <span role="status" aria-live="polite"><i [class]="salvandoExec ? 'pi pi-spin pi-spinner' : executionDirty ? 'pi pi-pencil' : 'pi pi-check-circle'" aria-hidden="true"></i>{{ (salvandoExec ? 'hangar.execution.saving' : executionDirty ? 'hangar.execution.unsaved' : executionSaveState === 'queued' ? 'hangar.signature.pending' : executionSaveState === 'saved' ? 'hangar.execution.saved' : 'hangar.execution.upToDate') | translate }}</span>
                <button pButton type="submit" [label]="'hangar.btn.salvarExecucao' | translate" icon="pi pi-save" [loading]="salvandoExec" [disabled]="!executionDirty || salvandoExec"></button>
              </footer>
            </form>
          </p-tabPanel>

          <p-tabPanel [header]="'hangar.tab.horas' | translate">
            <section class="hours-metrics" aria-live="polite">
              <article class="hours-metric hours-metric--primary"><span>{{ 'hangar.horas.total' | translate }}</span><strong>{{ formatHours(card.totalHoras || 0) }} <small>h</small></strong></article>
              <article class="hours-metric"><span>{{ 'hangar.hours.filtered' | translate }}</span><strong>{{ formatHours(registeredFilteredHours) }} <small>h</small></strong><small>{{ filteredHourRows.length }} {{ 'hangar.hours.records' | translate }}</small></article>
              <article class="hours-metric hours-metric--pending" *ngIf="pendingHours.length"><span>{{ 'hangar.signature.pending' | translate }}</span><strong>{{ formatHours(pendingTotalHours) }} <small>h</small></strong></article>
            </section>
            <div class="hours-filters">
              <label>{{ 'hangar.horas.data' | translate }}<input type="date" [(ngModel)]="hoursFilters.day" /></label>
              <label>{{ 'hangar.hours.user' | translate }}<select [(ngModel)]="hoursFilters.user"><option value="">{{ 'hangar.hours.all' | translate }}</option><option *ngFor="let user of hourUsers" [value]="user.key">{{ user.label }}</option></select></label>
              <label>{{ 'hangar.hours.group' | translate }}<select [(ngModel)]="hoursFilters.group"><option value="none">{{ 'hangar.hours.ungrouped' | translate }}</option><option value="day">{{ 'hangar.hours.byDay' | translate }}</option><option value="user">{{ 'hangar.hours.byUser' | translate }}</option></select></label>
              <button pButton type="button" class="p-button-outlined" *ngIf="hoursFilters.day || hoursFilters.user" [label]="'hangar.hours.clear' | translate" (click)="hoursFilters.day = ''; hoursFilters.user = ''"></button>
            </div>
            <div class="hours-table-wrap" tabindex="0" role="region" [attr.aria-label]="'hangar.hours.history' | translate">
              <table class="hours-table">
                <caption>{{ 'hangar.hours.history' | translate }}</caption>
                <thead><tr><th scope="col">{{ 'hangar.horas.data' | translate }}</th><th scope="col">{{ 'hangar.hours.duration' | translate }}</th><th scope="col">{{ 'hangar.horas.desc' | translate }}</th><th scope="col">{{ 'hangar.horas.ferramenta' | translate }}</th><th scope="col">{{ 'hangar.hours.user' | translate }}</th><th scope="col">{{ 'hangar.hours.state' | translate }}</th></tr></thead>
                <tbody *ngFor="let group of hourGroups; trackBy: trackHourGroup">
                  <tr class="hours-group" *ngIf="hoursFilters.group !== 'none'"><th colspan="6" scope="rowgroup"><span>{{ hoursFilters.group === 'day' ? (group.label | localeDateTime:'dateNumeric') : group.label }}</span><span>{{ formatHours(group.registered) }} h <small *ngIf="group.pending"> · {{ formatHours(group.pending) }} h {{ 'hangar.hours.pendingShort' | translate }}</small></span></th></tr>
                  <tr *ngFor="let row of group.rows; trackBy: trackHourRow" [class.is-pending]="row.pending">
                    <td><time [attr.datetime]="row.trabalhoEm">{{ row.trabalhoEm | localeDateTime:'dateNumeric' }}</time></td>
                    <td class="hours-duration">{{ formatHours(row.horas) }} <small>h</small></td>
                    <td class="hours-description">{{ row.descricao || '—' }}</td>
                    <td><span class="hours-tool" *ngIf="row.ferramentaIdentificador">{{ row.ferramentaIdentificador }}</span><span *ngIf="!row.ferramentaIdentificador">—</span></td>
                    <td>{{ hourUserLabel(row.userKey) }}</td>
                    <td><span class="hours-state" [class.hours-state--pending]="row.pending"><i [class]="row.pending ? 'pi pi-clock' : 'pi pi-check-circle'" aria-hidden="true"></i>{{ (row.pending ? 'hangar.signature.pending' : 'hangar.hours.registered') | translate }}</span></td>
                  </tr>
                </tbody>
                <tbody *ngIf="!filteredHourRows.length"><tr><td colspan="6" class="hours-empty">{{ (allHourRows.length ? 'hangar.hours.noResults' : 'hangar.hours.empty') | translate }}</td></tr></tbody>
              </table>
            </div>
            <section class="hours-entry"><h3>{{ 'hangar.btn.addHoras' | translate }}</h3>
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
          </section>
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
            <div class="signature-grid">
            <section class="assin-block" *ngFor="let papel of papeisAssinatura">
              <div class="signature-heading"><h4>{{ papel.labelKey | translate }}</h4>
                <p-tag [severity]="pendingSignatures.has(papel.code) ? 'warning' : assinaturaOk(papel.code) ? 'success' : 'info'"
                  [value]="(pendingSignatures.has(papel.code) ? 'hangar.signature.pending' : editingSignatures.has(papel.code) ? 'hangar.signature.editing' : assinaturaOk(papel.code) ? 'hangar.assinatura.ok' : 'hangar.signature.waiting') | translate"></p-tag>
              </div>
              <ng-container *ngIf="signatureLocked(papel.code); else captureSignature">
                <div class="signature-saved" role="status">
                  <img *ngIf="signatureImage(papel.code) as image" [src]="image" [alt]="papel.labelKey | translate" />
                  <i *ngIf="!signatureImage(papel.code)" class="pi pi-check-circle" aria-hidden="true"></i>
                  <p *ngIf="pendingSignatures.has(papel.code)">{{ 'hangar.signature.pendingHelp' | translate }}</p>
                  <ng-container *ngIf="!pendingSignatures.has(papel.code) && signatureRow(papel.code) as signed">
                    <p><strong>{{ signed.usuarioNome || '—' }}</strong></p>
                    <time *ngIf="signed.assinaturaTimestampServer || signed.assinadoEm" [attr.datetime]="signed.assinaturaTimestampServer || signed.assinadoEm">{{ (signed.assinaturaTimestampServer || signed.assinadoEm) | localeDateTime:'dateTime' }}</time>
                  </ng-container>
                </div>
                <button pButton type="button" class="p-button-outlined p-button-sm signature-unlock" icon="pi pi-pencil"
                  *ngIf="!pendingSignatures.has(papel.code)" [label]="'hangar.signature.replace' | translate"
                  [disabled]="!!salvandoAssinatura || !!card?.dataFechamento || !!card?.crsEmitido" (click)="unlockSignature(papel.code)"></button>
              </ng-container>
              <ng-template #captureSignature>
                <div class="signature-pad" [class.has-ink]="dirtySignatures.has(papel.code)">
                  <span class="signature-pad__hint" aria-hidden="true"><i class="pi pi-pencil"></i>{{ 'hangar.signature.drawHint' | translate }}</span>
                  <canvas class="sig-canvas" [attr.data-papel]="papel.code" width="480" height="120"
                    [attr.aria-label]="('hangar.signature.drawHint' | translate) + ': ' + (papel.labelKey | translate)"
                    (pointerdown)="startDraw($event, papel.code)" (pointermove)="moveDraw($event, papel.code)"
                    (pointerup)="endDraw()" (pointercancel)="endDraw()" (pointerleave)="endDraw()"></canvas>
                </div>
                <div class="sig-actions">
                  <div class="signature-secondary-actions">
                    <button pButton type="button" class="p-button-outlined p-button-secondary" icon="pi pi-eraser"
                      [label]="'hangar.assinatura.clear' | translate" [disabled]="!dirtySignatures.has(papel.code) || !!salvandoAssinatura"
                      (click)="requestClearSig(papel.code)"></button>
                    <button pButton type="button" class="p-button-text" *ngIf="editingSignatures.has(papel.code)"
                      [label]="'hangar.signature.cancel' | translate" [disabled]="!!salvandoAssinatura" (click)="cancelSignatureEdit(papel.code)"></button>
                  </div>
                  <button pButton type="button" icon="pi pi-check" [label]="'hangar.assinatura.save' | translate"
                    [loading]="salvandoAssinatura === papel.code" [disabled]="!dirtySignatures.has(papel.code) || !!salvandoAssinatura"
                    (click)="salvarAssinatura(papel.code)"></button>
                </div>
              </ng-template>
              <details class="sig-integrity" *ngIf="!editingSignatures.has(papel.code) && !pendingSignatures.has(papel.code) && assinaturaMeta(papel.code) as meta">
                <summary>{{ 'hangar.signature.integrity' | translate }}</summary>
                <p-tag *ngIf="meta.integridadeOk === true" severity="success" [value]="'hangar.assinatura.integridadeOk' | translate"></p-tag>
                <p-tag *ngIf="meta.integridadeOk === false" severity="danger" [value]="'hangar.assinatura.integridadeFail' | translate"></p-tag>
                <small>{{ 'hangar.assinatura.hash' | translate }}: <code>{{ meta.sha256 }}</code></small>
              </details>
            </section>
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
  private confirmation = inject(ConfirmationService);

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

  movingId: number | null = null;
  draggedItem: JobCardListItem | null = null;
  private expandedEmptyColumns = new Set<JobCardFase>();
  private suppressClickUntil = 0;
  readonly canEnter = (drag: CdkDrag<JobCardListItem>, drop: CdkDropList<JobCardFase>) => this.canMove(drag.data, drop.data);

  isCollapsed(fase: JobCardFase): boolean {
    return !this.itensPorFase(fase).length && !this.expandedEmptyColumns.has(fase);
  }

  toggleColumn(fase: JobCardFase): void {
    if (this.expandedEmptyColumns.has(fase)) this.expandedEmptyColumns.delete(fase);
    else this.expandedEmptyColumns.add(fase);
  }

  canDrag(item: JobCardListItem): boolean {
    return this.offlineCache.isOnline() && !this.loadingLista && this.movingId === null && !!item.destinosPermitidos?.length;
  }

  canMove(item: JobCardListItem, target: JobCardFase): boolean {
    return this.canDrag(item) && !!item.destinosPermitidos?.includes(target);
  }

  endDrag(): void {
    this.draggedItem = null;
    this.suppressClickUntil = Date.now() + 250;
  }

  dropCard(event: CdkDragDrop<JobCardFase, JobCardFase, JobCardListItem>): void {
    this.moveCard(event.item.data, event.container.data);
  }

  moveCard(item: JobCardListItem, target: JobCardFase): void {
    if (!this.canMove(item, target)) return;
    this.movingId = item.osId;
    this.jobCard.moverFase(item, target).subscribe({
      next: () => {
        this.movingId = null;
        this.toast.add({ severity: 'success', summary: this.i18n.translate('hangar.board.moved') });
        this.carregarLista();
      },
      error: () => {
        this.movingId = null;
        this.toast.add({ severity: 'error', summary: this.i18n.translate('hangar.board.failed') });
        this.carregarLista();
      }
    });
  }

  execOrigin: ExecutionOrigin = { line: '', separator: '', observations: '' };
  private executionBaseline = '';
  private executionOsId: number | null = null;
  executionSaveState: 'idle' | 'saved' | 'queued' = 'idle';

  private executionDraftSnapshot(): string { return executionSnapshot(this.execInicio, this.execFim, this.execObsIni, this.execObsFim); }
  get executionDirty(): boolean { return !!this.executionBaseline && this.executionDraftSnapshot() !== this.executionBaseline; }
  get executionSignatureCount(): number { return (this.card?.assinaturas || []).filter(signature => signature.presente).length; }

  execInicio = '';
  execFim = '';
  execObsIni = '';
  execObsFim = '';
  salvandoExec = false;

  hoursFilters: HourFilters = { day: '', user: '', group: 'none' };
  pendingHours: PendingHourEntry[] = [];

  get allHourRows(): HourRow[] { return hourRows(this.card?.apontamentos || [], this.pendingHours); }
  get filteredHourRows(): HourRow[] { return filterHours(this.allHourRows, this.hoursFilters); }
  get registeredFilteredHours(): number { return sumHours(this.filteredHourRows, false); }
  get pendingTotalHours(): number { return sumHours(this.allHourRows, true); }
  get hourGroups(): HourGroup[] { return groupHours(this.allHourRows, this.hoursFilters, this.i18n.getCurrentLanguage(), key => this.hourUserLabel(key)); }
  get hourUsers(): { key: string; label: string }[] {
    const collator = new Intl.Collator(this.i18n.getCurrentLanguage(), { sensitivity: 'base' });
    return Array.from(new Set(this.allHourRows.map(row => row.userKey)), key => ({ key, label: this.hourUserLabel(key) })).sort((a,b) => collator.compare(a.label,b.label));
  }
  hourUserLabel(key: string): string {
    return key === PENDING_USER ? this.i18n.translate('hangar.hours.pendingUser') : key === UNKNOWN_USER ? this.i18n.translate('hangar.hours.unknownUser') : key;
  }
  formatHours(value: number): string {
    return new Intl.NumberFormat(this.i18n.getCurrentLanguage(), { maximumFractionDigits: 2 }).format(Number.isFinite(Number(value)) ? Number(value) : 0);
  }
  trackHourRow(_index: number, row: HourRow): string { return row.key; }
  trackHourGroup(_index: number, group: HourGroup): string { return group.key; }

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
  readonly editingSignatures = new Set<string>();
  readonly dirtySignatures = new Set<string>();
  readonly pendingSignatures = new Map<string, string>();
  private signatureBaseHashes = new Map<string, string | null>();
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
      const nextId = raw ? Number(raw) : null;
      if (this.osId !== nextId) {
        this.editingSignatures.clear();
        this.dirtySignatures.clear();
        this.signatureBaseHashes.clear();
        this.pendingSignatures.clear();
        this.pendingHours = [];
        this.executionBaseline = '';
        this.executionOsId = null;
        this.executionSaveState = 'idle';
        this.salvandoExec = false;
        this.hoursFilters = { day: '', user: '', group: 'none' };
        this.sigCtx.clear();
        this.salvandoAssinatura = '';
        this.endDraw();
      }
      this.osId = nextId;
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
    this.pendingSignatures.clear();
    this.pendingHours = [];
    for (const op of this.offlineCache.loadQueue()) {
      if (op.kind === 'assinatura' && op.osId === this.osId) this.pendingSignatures.set(op.body.papel, op.body.assinaturaPngBase64);
      if (op.kind === 'apontamento' && op.osId === this.osId) this.pendingHours.push({ id: op.id, ...op.body, createdAt: op.queuedAt });
    }
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
    if (Date.now() < this.suppressClickUntil) return;
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
    const requestedOsId = this.osId;
    this.jobCard.obter(requestedOsId).subscribe({
      next: c => {
        if (this.osId !== requestedOsId) return;
        this.offlineCache.saveCard(requestedOsId, c);
        this.applyCard(c);
      },
      error: () => {
        if (this.osId !== requestedOsId) return;
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
    const keepDraft = this.executionOsId === this.osId && this.executionDirty;
    this.card = c;
    this.refreshOfflinePending();
    if (!keepDraft) {
      this.execOrigin = splitExecutionOrigin(c.obsIniServ);
      this.execInicio = c.inicioServico ?? '';
      this.execFim = c.fimServico ?? '';
      this.execObsIni = this.execOrigin.observations;
      this.execObsFim = c.obsFimServ ?? '';
      this.executionBaseline = this.executionDraftSnapshot();
      this.executionOsId = this.osId;
      this.executionSaveState = 'idle';
    }
    setTimeout(() => this.initCanvases(), 0);
  }

  salvarExecucao(): void {
    if (!this.osId || this.salvandoExec || !this.executionDirty) return;
    const submittedOsId = this.osId;
    const submittedSnapshot = this.executionDraftSnapshot();
    const body = {
      inicioServico: this.execInicio,
      fimServico: this.execFim,
      obsIniServ: combineExecutionOrigin(this.execOrigin, this.execObsIni),
      obsFimServ: this.execObsFim
    };
    if (!this.offlineCache.isOnline()) {
      this.offlineCache.enqueue({ kind: 'execucao', osId: submittedOsId, body });
      this.persistCardLocally(body);
      this.refreshOfflinePending();
      this.executionBaseline = submittedSnapshot;
      this.executionSaveState = 'queued';
      this.toast.add({ severity: 'info', summary: this.i18n.translate('hangar.toast.offlineQueued') });
      return;
    }
    this.salvandoExec = true;
    this.jobCard.atualizarExecucao(submittedOsId, body).subscribe({
      next: c => {
        if (this.osId !== submittedOsId) return;
        this.card = c;
        this.offlineCache.saveCard(submittedOsId, c);
        this.executionBaseline = submittedSnapshot;
        this.executionSaveState = 'saved';
        this.salvandoExec = false;
        this.toast.add({ severity: 'success', summary: this.i18n.translate('hangar.toast.execucao') });
      },
      error: err => {
        if (this.osId !== submittedOsId) return;
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

  signatureRow(papel: string) {
    return this.card?.assinaturas?.find(row => row.papel === papel && row.presente);
  }

  signatureLocked(papel: string): boolean {
    return this.pendingSignatures.has(papel) || (!!this.signatureRow(papel) && !this.editingSignatures.has(papel));
  }

  signatureImage(papel: string): string | null {
    const pending = this.pendingSignatures.get(papel);
    if (pending) return pending;
    const image = this.signatureRow(papel)?.assinaturaPngBase64;
    return image ? 'data:image/png;base64,' + image : null;
  }

  requestClearSig(papel: string): void {
    if (!this.dirtySignatures.has(papel) || this.salvandoAssinatura) return;
    this.confirmation.confirm({ key: 'signature', header: this.i18n.translate('hangar.signature.clearTitle'),
      message: this.i18n.translate('hangar.signature.clearConfirm'), acceptLabel: this.i18n.translate('hangar.assinatura.clear'),
      rejectLabel: this.i18n.translate('hangar.signature.cancel'), defaultFocus: 'reject', accept: () => this.clearSig(papel) });
  }

  unlockSignature(papel: string): void {
    if (this.pendingSignatures.has(papel) || this.card?.dataFechamento || this.card?.crsEmitido || this.salvandoAssinatura) return;
    this.confirmation.confirm({ key: 'signature', header: this.i18n.translate('hangar.signature.replace'),
      message: this.i18n.translate('hangar.signature.replaceConfirm'), acceptLabel: this.i18n.translate('hangar.signature.replace'),
      rejectLabel: this.i18n.translate('hangar.signature.cancel'), defaultFocus: 'reject', accept: () => {
        this.signatureBaseHashes.set(papel, this.signatureRow(papel)?.assinaturaSha256 ?? null);
        this.editingSignatures.add(papel);
        this.dirtySignatures.delete(papel);
        setTimeout(() => this.initCanvases(), 0);
      } });
  }

  cancelSignatureEdit(papel: string): void {
    const cancel = () => { this.editingSignatures.delete(papel); this.dirtySignatures.delete(papel); this.signatureBaseHashes.delete(papel); };
    if (!this.dirtySignatures.has(papel)) { cancel(); return; }
    this.confirmation.confirm({ key: 'signature', message: this.i18n.translate('hangar.signature.discardConfirm'),
      acceptLabel: this.i18n.translate('hangar.signature.discard'), rejectLabel: this.i18n.translate('hangar.signature.continue'), defaultFocus: 'reject', accept: cancel });
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
    const canvases = document.querySelectorAll<HTMLCanvasElement>('canvas.sig-canvas');
    canvases.forEach(canvas => {
      const papel = canvas.getAttribute('data-papel') ?? '';
      if (this.sigCtx.get(papel)?.canvas === canvas) return;
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
    if (this.signatureLocked(papel) || this.salvandoAssinatura) return;
    if (!this.sigCtx.get(papel)) this.initCanvases();
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
    ctx.moveTo((ev.clientX - rect.left) * canvas.width / rect.width, (ev.clientY - rect.top) * canvas.height / rect.height);
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
    ctx.lineTo((ev.clientX - rect.left) * canvas.width / rect.width, (ev.clientY - rect.top) * canvas.height / rect.height);
    this.dirtySignatures.add(papel);
    ctx.stroke();
  }

  endDraw(): void {
    this.drawing = false;
    this.activePapel = '';
  }

  clearSig(papel: string): void {
    if (this.signatureLocked(papel) || this.salvandoAssinatura) return;
    const ctx = this.sigCtx.get(papel);
    const canvas = document.querySelector<HTMLCanvasElement>(`canvas.sig-canvas[data-papel="${papel}"]`);
    if (!ctx || !canvas) {
      return;
    }
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    this.dirtySignatures.delete(papel);
  }

  salvarAssinatura(papel: string): void {
    if (this.signatureLocked(papel) || !this.dirtySignatures.has(papel) || this.salvandoAssinatura) return;
    if (!this.osId) {
      return;
    }
    const canvas = document.querySelector<HTMLCanvasElement>(`canvas.sig-canvas[data-papel="${papel}"]`);
    if (!canvas) {
      return;
    }
    const dataUrl = canvas.toDataURL('image/png');
    const assinaturaOsId = this.osId;
    const body = { papel, assinaturaPngBase64: dataUrl, substituir: this.editingSignatures.has(papel), assinaturaAnteriorSha256: this.signatureBaseHashes.get(papel) ?? null };
    if (!this.offlineCache.isOnline()) {
      this.offlineCache.enqueue({
        kind: 'assinatura',
        osId: this.osId,
        body
      });
      this.dirtySignatures.delete(papel);
      this.editingSignatures.delete(papel);
      this.refreshOfflinePending();
      this.salvandoAssinatura = '';
      this.toast.add({ severity: 'info', summary: this.i18n.translate('hangar.toast.offlineQueued') });
      return;
    }
    this.salvandoAssinatura = papel;
    this.jobCard.salvarAssinatura(assinaturaOsId, body).subscribe({
      next: signed => {
        if (this.osId !== assinaturaOsId) return;
        this.salvandoAssinatura = '';
        this.dirtySignatures.delete(papel);
        this.editingSignatures.delete(papel);
        this.signatureBaseHashes.delete(papel);
        if (this.card) {
          this.card.assinaturas = [...(this.card.assinaturas || []).filter(row => row.papel !== papel), signed];
          this.offlineCache.saveCard(this.osId!, this.card);
        }
        this.toast.add({ severity: 'success', summary: this.i18n.translate('hangar.assinatura.ok') });
        this.carregarCard();
      },
      error: err => {
        if (this.osId !== assinaturaOsId) return;
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
