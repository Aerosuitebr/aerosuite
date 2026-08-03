import { DEFAULT_LIST_PAGE_SIZE, LIST_ROWS_PER_PAGE_OPTIONS } from '../../core/list-pagination.constants';
import { createStaleRequestGuard, resolveLazyPageRequest, type LazyLoadEvent } from '../../core/lazy-list-pagination.helper';
import { Component, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { StepsModule } from 'primeng/steps';
import { CheckboxModule } from 'primeng/checkbox';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import {
  ConformidadeNc,
  ConformidadeNcAnexo,
  ConformidadeNcCapaEtapa,
  ConformidadeNcOsOpcao,
  ConformidadeSgqService
} from '../../core/conformidade-sgq.service';
import { UsuarioService } from '../../core/usuarios.service';
import { TranslationService } from '../../core/translation.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { PageHeroComponent } from '../../shared/page-hero/page-hero.component';
import { ListTableScrollDirective } from '../../shared/list-table-scroll/list-table-scroll.directive';
import { ListDataStatesComponent } from '../../shared/list-data-states/list-data-states.component';
import { extractApiErrorKey } from '../../core/api-error';
import { AuthService } from '../../auth/auth.service';
import { isSuperPerfil } from '../../auth/permissao.util';
import { destructiveDeleteConfirm, CONFIRM_DESTRUCTIVE_ACCEPT_CLASS, CONFIRM_SAFE_REJECT_CLASS } from '../../core/confirm-dialog.util';

type NcFieldKey =
  | 'titulo'
  | 'acaoContencao'
  | 'causaRaiz'
  | 'acaoCorretiva'
  | 'verificacaoEficacia'
  | 'eficaciaConfirmada'
  | 'dataFechamento'
  | 'responsavelUsuarioId'
  | 'anexo';

@Component({
  selector: 'app-nao-conformidade-list',
  standalone: true,
  imports: [
    ListTableScrollDirective,
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    InputTextareaModule,
    DropdownModule,
    DialogModule,
    ToastModule,
    TagModule,
    ConfirmDialogModule,
    StepsModule,
    CheckboxModule,
    AutoCompleteModule,
    TooltipModule,
    TranslatePipe,
    PageHeroComponent,
    ListDataStatesComponent
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>
    <div class="as-page page conformidade-module">
      <app-page-hero variant="navy" titleKey="conformidade.nc.title" subtitleKey="conformidade.nc.subtitle" titleIcon="pi-exclamation-triangle" [hasActions]="true">
        <div actions><button pButton icon="pi pi-plus" [label]="'conformidade.nc.btn.novo' | translate" (click)="abrirNovo()"></button></div>
      </app-page-hero>
      <div class="filter-bar">
        <span class="p-input-icon-left">
          <i class="pi pi-search"></i>
          <input
            pInputText
            [(ngModel)]="search"
            (keyup.enter)="buscar()"
            [attr.aria-label]="'common.list.tooltip.search' | translate" />
        </span>
        <p-dropdown
          [(ngModel)]="filtroStatus"
          [options]="statusOptions"
          optionLabel="label"
          optionValue="value"
          [showClear]="true"
          [placeholder]="'conformidade.nc.field.status' | translate"
          [attr.aria-label]="'conformidade.nc.field.status' | translate"
          (onChange)="buscar()"></p-dropdown>
        <button
          pButton
          type="button"
          icon="pi pi-search"
          [attr.aria-label]="'common.list.tooltip.search' | translate"
          (click)="buscar()"
          [loading]="loading"></button>
      </div>
      <app-list-data-states [loading]="loading" [itemCount]="total" [skeletonRows]="8" [skeletonCols]="6" [mountContentWhileLoading]="true" emptyTitleKey="conformidade.nc.empty" emptyDescriptionKey="ui.empty.description">
        <p-table appListScroll [first]="tableFirst" [value]="itens" [loading]="loading" [paginator]="true" [rows]="size" [totalRecords]="total" [lazy]="true" [rowsPerPageOptions]="listRowsPerPageOptions" dataKey="id" (onLazyLoad)="carregar($event)">
          <ng-template pTemplate="header">
            <tr>
              <th>{{ 'conformidade.nc.col.numero' | translate }}</th>
              <th>{{ 'conformidade.nc.col.titulo' | translate }}</th>
              <th>{{ 'conformidade.nc.col.severidade' | translate }}</th>
              <th>{{ 'conformidade.nc.col.status' | translate }}</th>
              <th>{{ 'conformidade.nc.col.capa' | translate }}</th>
              <th>{{ 'conformidade.nc.col.os' | translate }}</th>
              <th scope="col">{{ 'common.list.col.actions' | translate }}</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-row>
            <tr>
              <td>{{ row.numero }}</td>
              <td>{{ row.titulo }}</td>
              <td><p-tag [value]="labelSev(row.severidade)" [severity]="sevTag(row.severidade)"></p-tag></td>
              <td>{{ labelStatus(row.status) }}</td>
              <td>
                <p-tag *ngIf="row.capaFase" [value]="labelCapa(row.capaFase)" [severity]="capaTag(row.capaFase)"></p-tag>
                <span *ngIf="!row.capaFase">—</span>
              </td>
              <td>{{ osDisplay(row) }}</td>
              <td>
                <button pButton type="button" icon="pi pi-pencil" class="p-button-text p-button-sm"
                  [attr.aria-label]="('common.list.tooltip.edit' | translate) + ': ' + row.titulo"
                  [pTooltip]="'common.list.tooltip.edit' | translate" tooltipPosition="top"
                  (click)="abrirEditar(row)"></button>
                <button pButton type="button" icon="pi pi-trash" class="p-button-text p-button-sm p-button-danger"
                  [attr.aria-label]="('common.list.tooltip.delete' | translate) + ': ' + row.titulo"
                  [pTooltip]="'common.list.tooltip.delete' | translate" tooltipPosition="top"
                  (click)="confirmarExcluir(row)"></button>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </app-list-data-states>
      <p-dialog
        styleClass="as-hero-dialog nc-capa-dialog conformidade-dialog"
        maskStyleClass="nc-capa-dialog-mask"
        [(visible)]="showDialog"
        [header]="(editId ? 'conformidade.nc.dialog.edit' : 'conformidade.nc.btn.novo') | translate"
        [modal]="true"
        [style]="{ width: '820px' }">
        <div class="nc-capa-body">
        <p-toast key="ncCapaToast" position="top-center" styleClass="nc-capa-toast"></p-toast>
        <p-steps
          styleClass="nc-capa-steps"
          [model]="capaStepItems"
          [activeIndex]="capaStepIndex"
          [readonly]="false"
          (activeIndexChange)="onCapaStepChange($event)"></p-steps>
        <div class="form-grid capa-step-body">
          <ng-container *ngIf="capaStepIndex === 0">
            <div class="nc-field" [class.nc-field--invalid]="fieldInvalid('titulo')">
              <label for="nc-titulo">{{ 'conformidade.nc.field.titulo' | translate }} *</label>
              <input
                id="nc-titulo"
                name="titulo"
                pInputText
                [(ngModel)]="form.titulo"
                (ngModelChange)="clearFieldError('titulo')"
                class="w-full"
                required
                aria-required="true"
                [attr.aria-invalid]="fieldInvalid('titulo')"
                [attr.aria-describedby]="fieldInvalid('titulo') ? 'nc-titulo-error' : null"
                [class.p-invalid]="fieldInvalid('titulo')" />
              <p id="nc-titulo-error" class="nc-field-error" role="alert" *ngIf="fieldInvalid('titulo')">{{ fieldErrorText('titulo') }}</p>
            </div>
            <div class="nc-field">
              <label>{{ 'conformidade.nc.field.descricao' | translate }}</label>
              <textarea pInputTextarea rows="4" class="w-full" [(ngModel)]="form.descricao"></textarea>
            </div>
            <div class="nc-field">
              <label>{{ 'conformidade.nc.field.severidade' | translate }}</label>
              <p-dropdown [(ngModel)]="form.severidade" [options]="severidadeOptions" optionLabel="label" optionValue="value" styleClass="w-full" appendTo="body"></p-dropdown>
            </div>
            <div class="nc-field">
              <label>{{ 'conformidade.nc.field.osId' | translate }}</label>
              <p-autoComplete
                [(ngModel)]="osSelected"
                [suggestions]="osSuggestions"
                (completeMethod)="searchOs($event)"
                (onSelect)="onOsSelected($event)"
                (onClear)="onOsClear()"
                field="label"
                [dropdown]="true"
                dropdownIcon="pi pi-chevron-down"
                dropdownMode="blank"
                [forceSelection]="true"
                [placeholder]="'conformidade.nc.field.osSearchPh' | translate"
                [emptyMessage]="'primeng.emptySearch' | translate"
                styleClass="conformidade-ac w-full"
                appendTo="body">
              </p-autoComplete>
            </div>
            <div class="nc-field">
              <label>{{ 'conformidade.nc.field.abertura' | translate }}</label>
              <input pInputText type="date" [(ngModel)]="form.dataAbertura" class="w-full" />
            </div>
            <div class="nc-field">
              <label>{{ 'conformidade.nc.field.obs' | translate }}</label>
              <textarea pInputTextarea rows="3" class="w-full" [(ngModel)]="form.observacoes"></textarea>
            </div>
          </ng-container>
          <ng-container *ngIf="capaStepIndex === 1">
            <p class="step-hint">{{ 'conformidade.nc.stepper.hint.CONTENCAO' | translate }}</p>
            <div class="nc-field" [class.nc-field--invalid]="fieldInvalid('acaoContencao')">
              <label>{{ 'conformidade.nc.field.contencao' | translate }}</label>
              <textarea
                pInputTextarea
                rows="4"
                class="w-full"
                [(ngModel)]="form.acaoContencao"
                (ngModelChange)="clearFieldError('acaoContencao')"
                [class.p-invalid]="fieldInvalid('acaoContencao')"></textarea>
              <p class="nc-field-error" *ngIf="fieldInvalid('acaoContencao')">{{ fieldErrorText('acaoContencao') }}</p>
            </div>
          </ng-container>
          <ng-container *ngIf="capaStepIndex === 2">
            <p class="step-hint">{{ 'conformidade.nc.stepper.hint.CAUSA' | translate }}</p>
            <div class="nc-field" [class.nc-field--invalid]="fieldInvalid('causaRaiz')">
              <label>{{ 'conformidade.nc.field.causa' | translate }}</label>
              <textarea
                pInputTextarea
                rows="4"
                class="w-full"
                [(ngModel)]="form.causaRaiz"
                (ngModelChange)="clearFieldError('causaRaiz')"
                [class.p-invalid]="fieldInvalid('causaRaiz')"></textarea>
              <p class="nc-field-error" *ngIf="fieldInvalid('causaRaiz')">{{ fieldErrorText('causaRaiz') }}</p>
            </div>
          </ng-container>
          <ng-container *ngIf="capaStepIndex === 3">
            <p class="step-hint">{{ 'conformidade.nc.stepper.hint.ACAO' | translate }}</p>
            <div class="nc-field" [class.nc-field--invalid]="fieldInvalid('acaoCorretiva')">
              <label>{{ 'conformidade.nc.field.acao' | translate }}</label>
              <textarea
                pInputTextarea
                rows="4"
                class="w-full"
                [(ngModel)]="form.acaoCorretiva"
                (ngModelChange)="clearFieldError('acaoCorretiva')"
                [class.p-invalid]="fieldInvalid('acaoCorretiva')"></textarea>
              <p class="nc-field-error" *ngIf="fieldInvalid('acaoCorretiva')">{{ fieldErrorText('acaoCorretiva') }}</p>
            </div>
          </ng-container>
          <ng-container *ngIf="capaStepIndex === 4">
            <p class="step-hint">{{ 'conformidade.nc.stepper.hint.VERIFICACAO' | translate }}</p>
            <div class="nc-field" [class.nc-field--invalid]="fieldInvalid('verificacaoEficacia')">
              <label>{{ 'conformidade.nc.field.eficacia' | translate }}</label>
              <textarea
                pInputTextarea
                rows="3"
                class="w-full"
                [(ngModel)]="form.verificacaoEficacia"
                (ngModelChange)="clearFieldError('verificacaoEficacia')"
                [class.p-invalid]="fieldInvalid('verificacaoEficacia')"></textarea>
              <p class="nc-field-error" *ngIf="fieldInvalid('verificacaoEficacia')">{{ fieldErrorText('verificacaoEficacia') }}</p>
            </div>
            <div class="nc-field">
              <label>{{ 'conformidade.nc.field.dataVerificacao' | translate }}</label>
              <input pInputText type="date" [(ngModel)]="form.dataVerificacao" class="w-full" />
            </div>
            <div class="nc-field" [class.nc-field--invalid]="fieldInvalid('eficaciaConfirmada')">
              <div class="checkbox-row">
                <p-checkbox
                  [(ngModel)]="form.eficaciaConfirmada"
                  (ngModelChange)="clearFieldError('eficaciaConfirmada')"
                  [binary]="true"
                  inputId="eficOk"></p-checkbox>
                <label for="eficOk">{{ 'conformidade.nc.field.eficaciaOk' | translate }}</label>
              </div>
              <p class="nc-field-error" *ngIf="fieldInvalid('eficaciaConfirmada')">{{ fieldErrorText('eficaciaConfirmada') }}</p>
            </div>
          </ng-container>
          <ng-container *ngIf="capaStepIndex === 5">
            <p class="step-hint">{{ 'conformidade.nc.stepper.hint.FECHADA' | translate }}</p>
            <div class="nc-field" [class.nc-field--invalid]="fieldInvalid('dataFechamento')">
              <label>{{ 'conformidade.nc.field.fechamento' | translate }}</label>
              <input
                pInputText
                type="date"
                [(ngModel)]="form.dataFechamento"
                (ngModelChange)="clearFieldError('dataFechamento')"
                class="w-full"
                [class.p-invalid]="fieldInvalid('dataFechamento')" />
              <p class="nc-field-error" *ngIf="fieldInvalid('dataFechamento')">{{ fieldErrorText('dataFechamento') }}</p>
            </div>
            <p-tag severity="success" [value]="labelCapa('FECHADA')"></p-tag>
          </ng-container>

          <div class="etapa-meta" *ngIf="etapaAtual() as etapa">
            <div class="etapa-meta-grid">
              <div class="nc-field etapa-meta-field" [class.nc-field--invalid]="fieldInvalid('responsavelUsuarioId')">
                <label>{{ 'conformidade.nc.field.responsavel' | translate }}</label>
                <p-dropdown
                  [(ngModel)]="etapa.responsavelUsuarioId"
                  (ngModelChange)="clearFieldError('responsavelUsuarioId')"
                  [options]="usuarioOptions"
                  optionLabel="label"
                  optionValue="value"
                  [filter]="true"
                  [showClear]="true"
                  [styleClass]="dropdownStyleClass('responsavelUsuarioId', 'w-full etapa-meta-control')"
                  appendTo="body"></p-dropdown>
                <p class="nc-field-error" *ngIf="fieldInvalid('responsavelUsuarioId')">{{ fieldErrorText('responsavelUsuarioId') }}</p>
              </div>
              <div class="etapa-meta-field">
                <label>{{ 'conformidade.nc.field.prazo' | translate }}</label>
                <input pInputText type="date" [(ngModel)]="etapa.prazo" class="w-full etapa-meta-control" />
              </div>
            </div>
            <div class="aprovacao-block" *ngIf="editId">
              <p-tag
                [severity]="etapa.aprovado ? 'success' : 'warning'"
                [value]="(etapa.aprovado ? 'conformidade.nc.aprovacao.aprovada' : 'conformidade.nc.aprovacao.pendente') | translate"></p-tag>
              <p *ngIf="etapa.aprovado" class="aprovacao-info">
                {{ 'conformidade.nc.field.aprovadoPor' | translate }}: {{ etapa.aprovadoUsuarioNome || '—' }}
                · {{ 'conformidade.nc.field.aprovadoEm' | translate }}: {{ etapa.aprovadoEm || '—' }}
              </p>
              <div *ngIf="!etapa.aprovado">
                <label>{{ 'conformidade.nc.field.aprovacaoObs' | translate }}</label>
                <textarea pInputTextarea rows="2" class="w-full" [(ngModel)]="aprovacaoObs"></textarea>
              </div>
            </div>
            <p *ngIf="!editId && capaStepIndex > 0" class="step-hint">{{ 'conformidade.nc.hint.salvarPrimeiro' | translate }}</p>
          </div>

          <div class="anexo-block" *ngIf="editId" [class.nc-field--invalid]="fieldInvalid('anexo')">
            <h4>{{ 'conformidade.nc.anexo.title' | translate }}</h4>
            <small class="step-hint">{{ 'conformidade.nc.anexo.hint' | translate }}</small>
            <p class="nc-field-error" *ngIf="fieldInvalid('anexo')">{{ fieldErrorText('anexo') }}</p>
            <ul class="anexo-list" *ngIf="anexosFaseAtual().length > 0">
              <li *ngFor="let anexo of anexosFaseAtual()">
                <span>{{ anexo.nomeOriginal || anexo.nomeArquivo }}</span>
                <span class="anexo-meta">{{ anexo.usuarioNome }} · {{ anexo.dataUpload }}</span>
                <button pButton icon="pi pi-download" class="p-button-text p-button-sm" (click)="baixarAnexo(anexo)"></button>
                <button pButton icon="pi pi-trash" class="p-button-text p-button-sm p-button-danger" (click)="excluirAnexo(anexo)"></button>
              </li>
            </ul>
            <p *ngIf="anexosFaseAtual().length === 0 && !enviandoAnexo" class="step-hint">{{ 'conformidade.nc.anexo.empty' | translate }}</p>
            <div
              class="nc-anexo-dropzone"
              [class.drag-over]="dragOverAnexo"
              [class.is-uploading]="enviandoAnexo"
              role="button"
              tabindex="0"
              [attr.aria-label]="'conformidade.nc.anexo.dropzone' | translate"
              (click)="triggerAnexoInput()"
              (keydown.enter)="triggerAnexoInput()"
              (keydown.space)="$event.preventDefault(); triggerAnexoInput()"
              (dragover)="onAnexoDragOver($event)"
              (dragleave)="onAnexoDragLeave($event)"
              (drop)="onAnexoDrop($event)">
              <i class="pi" [ngClass]="enviandoAnexo ? 'pi-spin pi-spinner' : 'pi-paperclip'"></i>
              <span>{{ 'conformidade.nc.anexo.dropzone' | translate }}</span>
            </div>
            <input
              #anexoFileInput
              type="file"
              hidden
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
              (change)="onAnexoFileInput($event)" />
          </div>
        </div>
        </div>
        <ng-template pTemplate="footer">
          <div class="dialog-actions nc-capa-footer">
            <span
              class="nc-footer-tip"
              [attr.data-tip]="'common.actions.cancel' | translate"
              [attr.aria-label]="'common.actions.cancel' | translate">
              <button
                pButton
                type="button"
                icon="pi pi-times"
                class="p-button-text nc-footer-icon-btn"
                [attr.aria-label]="'common.actions.cancel' | translate"
                (click)="showDialog = false"></button>
            </span>
            <ng-container *ngIf="capaStepIndex === 0; else capaNavActions">
              <span
                class="nc-footer-tip"
                [attr.data-tip]="'conformidade.nc.btn.next' | translate"
                [attr.aria-label]="'conformidade.nc.btn.next' | translate">
                <button
                  pButton
                  type="button"
                  icon="pi pi-angle-right"
                  class="nc-footer-icon-btn nc-footer-icon-btn--primary"
                  [loading]="salvando"
                  [attr.aria-label]="'conformidade.nc.btn.next' | translate"
                  (click)="avancarRegistro()"></button>
              </span>
            </ng-container>
            <ng-template #capaNavActions>
              <div class="dialog-actions-cluster">
                <span
                  class="nc-footer-tip"
                  [attr.data-tip]="'conformidade.nc.btn.prev' | translate"
                  [attr.aria-label]="'conformidade.nc.btn.prev' | translate">
                  <button
                    pButton
                    type="button"
                    class="p-button-outlined nc-footer-icon-btn"
                    icon="pi pi-angle-left"
                    [attr.aria-label]="'conformidade.nc.btn.prev' | translate"
                    (click)="onCapaStepChange(capaStepIndex - 1)"></button>
                </span>
                <span
                  class="nc-footer-tip"
                  [class.nc-footer-tip--disabled]="!podeAvancarCapa()"
                  [attr.data-tip]="'conformidade.nc.btn.next' | translate"
                  [attr.aria-label]="'conformidade.nc.btn.next' | translate">
                  <button
                    pButton
                    type="button"
                    class="p-button-outlined nc-footer-icon-btn"
                    icon="pi pi-angle-right"
                    [disabled]="!podeAvancarCapa()"
                    [attr.aria-label]="'conformidade.nc.btn.next' | translate"
                    (click)="onCapaStepChange(capaStepIndex + 1)"></button>
                </span>
                <span class="nc-footer-divider" *ngIf="mostrarSolicitarNoRodape() || mostrarAprovarNoRodape() || mostrarRejeitarNoRodape()" aria-hidden="true"></span>
                <span
                  *ngIf="mostrarSolicitarNoRodape()"
                  class="nc-footer-tip"
                  [attr.data-tip]="'conformidade.nc.btn.solicitarAprovacao' | translate"
                  [attr.aria-label]="'conformidade.nc.btn.solicitarAprovacao' | translate">
                  <button
                    pButton
                    type="button"
                    icon="pi pi-send"
                    class="nc-footer-icon-btn nc-footer-icon-btn--primary"
                    [loading]="solicitandoAprovacao"
                    [attr.aria-label]="'conformidade.nc.btn.solicitarAprovacao' | translate"
                    (click)="solicitarAprovacao()"></button>
                </span>
                <span
                  *ngIf="mostrarAprovarNoRodape()"
                  class="nc-footer-tip"
                  [attr.data-tip]="'conformidade.nc.btn.aprovar' | translate"
                  [attr.aria-label]="'conformidade.nc.btn.aprovar' | translate">
                  <button
                    pButton
                    type="button"
                    icon="pi pi-check"
                    class="p-button-success nc-footer-icon-btn"
                    [loading]="aprovando"
                    [attr.aria-label]="'conformidade.nc.btn.aprovar' | translate"
                    (click)="aprovarFase()"></button>
                </span>
                <span
                  *ngIf="mostrarRejeitarNoRodape()"
                  class="nc-footer-tip"
                  [attr.data-tip]="'conformidade.nc.btn.rejeitar' | translate"
                  [attr.aria-label]="'conformidade.nc.btn.rejeitar' | translate">
                  <button
                    pButton
                    type="button"
                    class="p-button-outlined p-button-danger nc-footer-icon-btn"
                    icon="pi pi-times"
                    [attr.aria-label]="'conformidade.nc.btn.rejeitar' | translate"
                    (click)="confirmarRejeitar()"></button>
                </span>
                <span class="nc-footer-divider" aria-hidden="true"></span>
                <span
                  class="nc-footer-tip"
                  [attr.data-tip]="'common.actions.save' | translate"
                  [attr.aria-label]="'common.actions.save' | translate">
                  <button
                    pButton
                    type="button"
                    icon="pi pi-save"
                    class="nc-footer-icon-btn nc-footer-icon-btn--primary"
                    [loading]="salvando"
                    [attr.aria-label]="'common.actions.save' | translate"
                    (click)="salvar()"></button>
                </span>
              </div>
            </ng-template>
          </div>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [
    `.page { padding: 0 8px 2rem; }`,
    `.filter-bar { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; align-items: flex-end; }`,
    `.form-grid { display: grid; gap: 0.75rem; }`,
    `.nc-field { display: flex; flex-direction: column; gap: 0.35rem; min-width: 0; }`,
    `.nc-field label { font-weight: 500; }`,
    `.dialog-actions { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; }`,
    `.nc-capa-footer { margin: 0; padding: 0; width: 100%; border-top: none; }`,
    `.dialog-actions-cluster { display: flex; flex-wrap: nowrap; align-items: center; justify-content: flex-end; gap: 0.35rem; margin-left: auto; }`,
    `.nc-footer-divider { width: 1px; height: 1.75rem; background: #e2e8f0; margin: 0 0.15rem; flex-shrink: 0; }`,
    `.checkbox-row { display: flex; align-items: center; gap: 0.5rem; }`,
    `.capa-step-body { margin-top: 1rem; }`,
    `.step-hint { margin: 0 0 0.5rem; color: var(--text-color-secondary); font-size: 0.9rem; }`,
    `.etapa-meta { border-top: 1px solid #e2e8f0; padding-top: 0.75rem; margin-top: 0.5rem; }`,
    `.etapa-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; align-items: end; }`,
    `.etapa-meta-field { display: flex; flex-direction: column; gap: 0.35rem; min-width: 0; }`,
    `.etapa-meta-field label { font-weight: 500; }`,
    `:host ::ng-deep .etapa-meta-control.p-dropdown,
     :host ::ng-deep .etapa-meta-field .p-dropdown { width: 100%; }`,
    `:host ::ng-deep .etapa-meta-field .p-dropdown .p-dropdown-label,
     :host ::ng-deep .etapa-meta-field input.etapa-meta-control { min-height: 2.75rem; }`,
    `:host ::ng-deep .etapa-meta-field .p-dropdown .p-dropdown-label { display: flex; align-items: center; }`,
    `.aprovacao-block { margin-top: 0.75rem; display: grid; gap: 0.5rem; }`,
    `.aprovacao-info { margin: 0; font-size: 0.85rem; color: var(--text-color-secondary); }`,
    `.aprovacao-actions { display: flex; gap: 0.5rem; }`,
    `.anexo-block { border-top: 1px solid #e2e8f0; padding-top: 0.75rem; }`,
    `.anexo-block h4 { margin: 0 0 0.25rem; font-size: 1rem; }`,
    `.anexo-list { list-style: none; margin: 0.5rem 0; padding: 0; }`,
    `.anexo-list li { display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap; padding: 0.35rem 0; border-bottom: 1px solid #f1f5f9; }`,
    `.anexo-meta { font-size: 0.8rem; color: var(--text-color-secondary); }`,
    `.nc-anexo-dropzone { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; width: 100%; min-height: 5.5rem; margin-top: 0.5rem; padding: 1rem; border: 2px dashed #cbd5e1; border-radius: 10px; background: #f8fafc; color: #475569; text-align: center; cursor: pointer; transition: border-color 0.15s ease, background 0.15s ease; }`,
    `.nc-anexo-dropzone i { font-size: 1.35rem; color: #475569; }`,
    `.nc-anexo-dropzone span { font-size: 0.9rem; line-height: 1.4; max-width: 28rem; }`,
    `.nc-anexo-dropzone:hover, .nc-anexo-dropzone.drag-over { border-color: #0ea5e9; background: #f0f9ff; color: #0c4a6e; }`,
    `.nc-anexo-dropzone:hover i, .nc-anexo-dropzone.drag-over i { color: #0284c7; }`,
    `.nc-anexo-dropzone.is-uploading { pointer-events: none; opacity: 0.85; }`,
    `:host ::ng-deep .nc-capa-steps.p-steps { margin-bottom: 0.25rem; }`,
    `:host ::ng-deep .nc-capa-steps .p-steps-title { font-size: 0.75rem; }`
  ]
})
export class NaoConformidadeListComponent implements OnInit {
  readonly listRowsPerPageOptions = LIST_ROWS_PER_PAGE_OPTIONS;
  private svc = inject(ConformidadeSgqService);
  private usuarioSvc = inject(UsuarioService);
  private auth = inject(AuthService);
  private i18n = inject(TranslationService);
  private toast = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private readonly requestGuard = createStaleRequestGuard();

  itens: ConformidadeNc[] = [];
  total = 0;
  pageIndex = 0;
  size = DEFAULT_LIST_PAGE_SIZE;
  loading = true;
  search = '';
  filtroStatus: string | null = null;
  showDialog = false;
  editId: number | null = null;
  salvando = false;
  aprovando = false;
  solicitandoAprovacao = false;
  enviandoAnexo = false;
  dragOverAnexo = false;
  private readonly anexoMaxBytes = 25 * 1024 * 1024;
  @ViewChild('anexoFileInput') anexoFileInput?: ElementRef<HTMLInputElement>;
  form: Partial<ConformidadeNc> = { severidade: 'MEDIA' };
  formEtapas: ConformidadeNcCapaEtapa[] = [];
  anexos: ConformidadeNcAnexo[] = [];
  aprovacaoObs = '';
  usuarioOptions: { label: string; value: number }[] = [];
  osSuggestions: {
    id: number;
    idOs?: number;
    label: string;
    clienteNome?: string;
  }[] = [];
  osSelected: {
    id: number;
    idOs?: number;
    label: string;
    clienteNome?: string;
  } | null = null;
  severidadeOptions: { label: string; value: string }[] = [];
  statusOptions: { label: string; value: string }[] = [];
  readonly capaPhases = ['REGISTRO', 'CONTENCAO', 'CAUSA', 'ACAO', 'VERIFICACAO', 'FECHADA'] as const;
  capaStepIndex = 0;
  capaStepItems: MenuItem[] = [];
  fieldErrors: Partial<Record<NcFieldKey, string>> = {};

  get tableFirst(): number {
    return this.pageIndex * this.size;
  }

  ngOnInit(): void {
    this.severidadeOptions = ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'].map(v => ({
      value: v,
      label: this.i18n.translate(`conformidade.nc.sev.${v}`)
    }));
    this.statusOptions = ['ABERTA', 'EM_ACAO', 'FECHADA'].map(v => ({
      value: v,
      label: this.i18n.translate(`conformidade.nc.status.${v}`)
    }));
    this.capaStepItems = this.capaPhases.map(v => ({
      label: this.i18n.translate(`conformidade.nc.capa.${v}`)
    }));
    this.usuarioSvc.list({ size: 500 }).subscribe(res => {
      this.usuarioOptions = (res.items ?? []).map(u => ({
        value: u.id!,
        label: (u['nome'] as string) || (u['email'] as string) || `#${u.id}`
      }));
    });
  }

  etapaAtual(): ConformidadeNcCapaEtapa | undefined {
    return this.formEtapas[this.capaStepIndex];
  }

  isAuditorQualidade(): boolean {
    const user = this.auth.getCurrentUser();
    if (!user) return false;
    if (isSuperPerfil(user)) return true;
    const codigo = user.perfil?.codigo?.trim().toUpperCase();
    return codigo === 'QUALIDADE' || codigo === 'P145_INSPETOR' || codigo === 'P145_RT';
  }

  isAtuadorFase(): boolean {
    const user = this.auth.getCurrentUser();
    const etapa = this.etapaAtual();
    if (!user || !etapa?.responsavelUsuarioId) return false;
    return user.id === etapa.responsavelUsuarioId;
  }

  mostrarAprovarNoRodape(): boolean {
    return !!this.editId && this.capaStepIndex > 0 && !this.etapaAtual()?.aprovado && this.isAuditorQualidade();
  }

  mostrarSolicitarNoRodape(): boolean {
    return (
      !!this.editId &&
      this.capaStepIndex > 0 &&
      !this.etapaAtual()?.aprovado &&
      this.isAtuadorFase() &&
      !this.isAuditorQualidade()
    );
  }

  mostrarRejeitarNoRodape(): boolean {
    return (
      !!this.editId &&
      this.capaStepIndex > 0 &&
      !!this.etapaAtual()?.aprovado &&
      this.capaStepIndex < this.capaPhases.length - 1 &&
      this.isAuditorQualidade()
    );
  }

  faseAtualAprovada(): boolean {
    if (this.capaStepIndex === 0) return true;
    if (!this.editId) return false;
    return !!this.etapaAtual()?.aprovado;
  }

  podeAvancarCapa(): boolean {
    if (this.capaStepIndex >= this.capaPhases.length - 1) return false;
    return this.faseAtualAprovada();
  }

  fieldInvalid(key: NcFieldKey): boolean {
    return key in this.fieldErrors;
  }

  fieldErrorText(key: NcFieldKey): string {
    const messageKey = this.fieldErrors[key];
    if (!messageKey) return '';
    const direct = this.i18n.translate(messageKey);
    if (direct !== messageKey) return direct;
    return this.i18n.translateApiError({ message: messageKey }, 'ui.error.validation');
  }

  dropdownStyleClass(key: NcFieldKey, base: string): string {
    return this.fieldInvalid(key) ? `${base} p-invalid` : base;
  }

  clearFieldError(key: NcFieldKey): void {
    delete this.fieldErrors[key];
  }

  private clearFieldErrors(): void {
    this.fieldErrors = {};
  }

  private markFieldError(key: NcFieldKey, messageKey: string): void {
    this.fieldErrors[key] = messageKey;
  }

  private showCapaToast(severity: 'success' | 'info' | 'warn' | 'error', summary: string): void {
    this.toast.add({
      key: 'ncCapaToast',
      severity,
      summary,
      life: severity === 'success' || severity === 'info' ? 3000 : 6000
    });
  }

  private phaseContentField(index = this.capaStepIndex): NcFieldKey | null {
    switch (this.capaPhases[index]) {
      case 'REGISTRO':
        return 'titulo';
      case 'CONTENCAO':
        return 'acaoContencao';
      case 'CAUSA':
        return 'causaRaiz';
      case 'ACAO':
        return 'acaoCorretiva';
      case 'VERIFICACAO':
        return 'verificacaoEficacia';
      case 'FECHADA':
        return 'dataFechamento';
      default:
        return null;
    }
  }

  private validateStep(index = this.capaStepIndex, options?: { requireResponsavel?: boolean }): boolean {
    this.clearFieldErrors();
    let valid = true;
    const fail = (key: NcFieldKey, messageKey: string) => {
      this.markFieldError(key, messageKey);
      valid = false;
    };

    switch (this.capaPhases[index]) {
      case 'REGISTRO':
        if (!this.form.titulo?.trim()) {
          fail('titulo', 'conformidade.nc.error.tituloObrigatorio');
        }
        break;
      case 'CONTENCAO':
        if (!this.form.acaoContencao?.trim()) {
          fail('acaoContencao', 'conformidade.nc.error.contencaoObrigatoria');
        }
        break;
      case 'CAUSA':
        if (!this.form.causaRaiz?.trim()) {
          fail('causaRaiz', 'conformidade.nc.error.causaObrigatoria');
        }
        break;
      case 'ACAO':
        if (!this.form.acaoCorretiva?.trim()) {
          fail('acaoCorretiva', 'conformidade.nc.error.acaoObrigatoria');
        }
        break;
      case 'VERIFICACAO':
        if (!this.form.verificacaoEficacia?.trim()) {
          fail('verificacaoEficacia', 'conformidade.nc.error.eficaciaTextoObrigatoria');
        }
        if (!this.form.eficaciaConfirmada) {
          fail('eficaciaConfirmada', 'conformidade.nc.error.eficaciaConfirmacaoObrigatoria');
        }
        if (this.editId && this.anexosFaseAtual().length === 0) {
          fail('anexo', 'conformidade.nc.error.anexoObrigatorio');
        }
        break;
      case 'FECHADA':
        if (!this.form.dataFechamento) {
          fail('dataFechamento', 'conformidade.nc.error.fechamentoObrigatorio');
        }
        break;
      default:
        break;
    }

    if (options?.requireResponsavel && index > 0) {
      const etapa = this.formEtapas[index];
      if (!etapa?.responsavelUsuarioId) {
        fail('responsavelUsuarioId', 'conformidade.nc.error.responsavelObrigatorio');
      }
    }

    if (!valid) {
      this.showCapaToast('warn', this.i18n.translate('ui.error.validation'));
    }
    return valid;
  }

  private applyApiErrorFields(err: unknown): void {
    const body = (err as { error?: unknown })?.error ?? err;
    const apiKey = extractApiErrorKey(body);
    if (!apiKey) return;

    const contentField = this.phaseContentField();
    const fieldMap: Record<string, NcFieldKey[]> = {
      'nc.error.campos_obrigatorios': contentField ? [contentField] : ['titulo'],
      'nc.error.conteudo_fase_incompleto': contentField ? [contentField] : ['titulo'],
      'nc.error.responsavel_obrigatorio': ['responsavelUsuarioId'],
      'nc.error.responsavel_invalido': ['responsavelUsuarioId'],
      'nc.error.eficacia_obrigatoria': ['eficaciaConfirmada'],
      'nc.error.anexo_evidencia_obrigatorio': ['anexo'],
      'nc.error.anexo_obrigatorio': ['anexo']
    };
    const targets = fieldMap[apiKey];
    if (!targets?.length) return;
    for (const field of targets) {
      this.markFieldError(field, apiKey);
    }
  }

  private handleCapaApiError(err: unknown, fallbackKey: string): void {
    this.applyApiErrorFields(err);
    this.showCapaToast('error', this.i18n.translateApiError((err as { error?: unknown })?.error ?? err, fallbackKey));
  }

  anexosFaseAtual(): ConformidadeNcAnexo[] {
    const fase = this.capaPhases[this.capaStepIndex];
    return this.anexos.filter(a => a.capaFase === fase);
  }

  private initEtapas(from?: ConformidadeNcCapaEtapa[]): void {
    this.formEtapas = this.capaPhases.map(fase => {
      const existente = from?.find(e => e.fase === fase);
      return existente ? { ...existente } : { fase, aprovado: false };
    });
  }

  onCapaStepChange(index: number): void {
    const clamped = Math.max(0, Math.min(index, this.capaPhases.length - 1));
    if (clamped > this.capaStepIndex) {
      if (!this.validateStep(this.capaStepIndex)) {
        return;
      }
      if (!this.faseAtualAprovada()) {
        this.showCapaToast('warn', this.i18n.translate('conformidade.nc.error.faseNaoAprovada'));
        return;
      }
    }
    this.clearFieldErrors();
    this.capaStepIndex = clamped;
    this.form.capaFase = this.capaPhases[clamped];
    this.aprovacaoObs = '';
    this.dragOverAnexo = false;
    if (clamped === this.capaPhases.length - 1) {
      this.form.status = 'FECHADA';
      if (!this.form.dataFechamento) {
        this.form.dataFechamento = new Date().toISOString().slice(0, 10);
      }
    } else if (this.form.status === 'FECHADA') {
      this.form.status = 'EM_ACAO';
    }
  }

  private syncCapaStepFromForm(): void {
    const phase = this.form.capaFase || 'REGISTRO';
    const idx = this.capaPhases.indexOf(phase as (typeof this.capaPhases)[number]);
    this.capaStepIndex = idx >= 0 ? idx : 0;
  }

  private payloadFromForm(): Partial<ConformidadeNc> {
    const payload: Partial<ConformidadeNc> = {
      ...this.form,
      capaFase: this.capaPhases[this.capaStepIndex],
      etapas: this.formEtapas.map(e => ({
        fase: e.fase,
        responsavelUsuarioId: e.responsavelUsuarioId,
        prazo: e.prazo
      }))
    };
    if (!this.editId) {
      delete payload.status;
    }
    return payload;
  }

  avancarRegistro(): void {
    if (!this.validateStep(0)) {
      return;
    }
    if (this.osSelected?.id != null) {
      this.form.osId = this.osSelected.id;
    }
    this.form.capaFase = 'REGISTRO';
    this.salvando = true;
    const body = this.payloadFromForm();
    const req = this.editId
      ? this.svc.naoConformidades.atualizar(this.editId, body)
      : this.svc.naoConformidades.criar(body);
    req.subscribe({
      next: nc => {
        this.salvando = false;
        this.editId = nc.id ?? this.editId;
        this.form = { ...nc };
        this.initEtapas(nc.etapas);
        this.anexos = nc.anexos ?? [];
        this.syncOsFromForm();
        this.buscar();
        this.clearFieldErrors();
        this.onCapaStepChange(1);
      },
      error: err => {
        this.salvando = false;
        this.handleCapaApiError(err, 'conformidade.err.salvar');
      }
    });
  }

  carregar(event?: LazyLoadEvent): void {
    const req = resolveLazyPageRequest(event, { pageIndex: this.pageIndex, size: this.size });
    this.pageIndex = req.page;
    this.size = req.size;
    const seq = this.requestGuard.bump();
    this.loading = true;
    this.svc.naoConformidades
      .listar({ page: this.pageIndex, size: this.size, q: this.search.trim() || undefined, status: this.filtroStatus || undefined })
      .subscribe({
        next: res => {
          if (this.requestGuard.isStale(seq)) return;
          this.itens = res.items ?? [];
          this.total = res.totalElements ?? 0;
          this.loading = false;
        },
        error: () => {
          if (this.requestGuard.isStale(seq)) return;
          this.loading = false;
        }
      });
  }

  buscar(): void {
    this.pageIndex = 0;
    this.carregar({ first: 0, rows: this.size });
  }

  labelSev(s: string): string {
    return this.i18n.translateCatalog('conformidade.nc.sev', s, s);
  }

  labelStatus(s: string): string {
    return this.i18n.translateCatalog('conformidade.nc.status', s, s);
  }

  labelCapa(f: string): string {
    return this.i18n.translateCatalog('conformidade.nc.capa', f, f);
  }

  osDisplay(row: ConformidadeNc): string {
    if (row.osNumero != null) {
      const parts = [`#${row.osNumero}`];
      const cliente = row.osClienteNome?.trim();
      if (cliente) parts.push(cliente);
      return parts.join(' — ');
    }
    return '—';
  }

  private formatOsLabel(op: ConformidadeNcOsOpcao): string {
    const num = op.idOs != null ? `#${op.idOs}` : '—';
    const parts = [num];
    const cliente = op.clienteNome?.trim();
    if (cliente) parts.push(cliente);
    const sn = op.serialNumber?.trim();
    const mat = op.marcasMatricula?.trim();
    if (sn) parts.push(`SN ${sn}`);
    else if (mat) parts.push(mat);
    if (op.dtAbertura) parts.push(op.dtAbertura);
    return parts.join(' · ');
  }

  searchOs(event: { query: string }): void {
    const q = event.query?.trim() ?? '';
    this.svc.naoConformidades.buscarOsOpcoes(q || undefined).subscribe({
      next: rows =>
        (this.osSuggestions = (rows ?? [])
          .filter(op => op.id != null)
          .map(op => ({
            id: op.id!,
            idOs: op.idOs,
            clienteNome: op.clienteNome,
            label: this.formatOsLabel(op)
          })))
    });
  }

  onOsSelected(event: { value?: { id: number } }): void {
    const val = event?.value;
    this.form.osId = val?.id;
  }

  onOsClear(): void {
    this.form.osId = undefined;
    this.osSelected = null;
  }

  private syncOsFromForm(): void {
    if (this.form.osId == null) {
      this.osSelected = null;
      return;
    }
    this.svc.naoConformidades.buscarOsOpcoes(String(this.form.osId)).subscribe({
      next: rows => {
        const match = (rows ?? []).find(r => r.id === this.form.osId);
        if (match?.id != null) {
          this.osSelected = {
            id: match.id,
            idOs: match.idOs,
            clienteNome: match.clienteNome,
            label: this.formatOsLabel(match)
          };
        } else {
          this.osSelected = null;
        }
      }
    });
  }

  capaTag(f: string): 'info' | 'warning' | 'success' {
    if (f === 'FECHADA') return 'success';
    if (f === 'VERIFICACAO' || f === 'ACAO') return 'warning';
    return 'info';
  }

  sevTag(s: string): 'info' | 'warning' | 'danger' {
    if (s === 'CRITICA' || s === 'ALTA') return 'danger';
    if (s === 'MEDIA') return 'warning';
    return 'info';
  }

  abrirNovo(): void {
    this.editId = null;
    this.form = {
      severidade: 'MEDIA',
      capaFase: 'REGISTRO',
      dataAbertura: new Date().toISOString().slice(0, 10)
    };
    this.initEtapas();
    this.anexos = [];
    this.aprovacaoObs = '';
    this.osSelected = null;
    this.dragOverAnexo = false;
    this.capaStepIndex = 0;
    this.clearFieldErrors();
    this.showDialog = true;
  }

  abrirEditar(row: ConformidadeNc): void {
    if (!row.id) return;
    this.editId = row.id;
    this.svc.naoConformidades.obter(row.id).subscribe({
      next: nc => {
        this.form = { ...nc };
        this.initEtapas(nc.etapas);
        this.anexos = nc.anexos ?? [];
        this.syncOsFromForm();
        this.syncCapaStepFromForm();
        this.aprovacaoObs = '';
        this.dragOverAnexo = false;
        this.clearFieldErrors();
        this.showDialog = true;
      },
      error: err =>
        this.toast.add({
          severity: 'error',
          summary: this.i18n.translateApiError(err?.error, 'conformidade.err.salvar')
        })
    });
  }

  salvar(): void {
    if (!this.validateStep(this.capaStepIndex)) {
      return;
    }
    if (this.osSelected?.id != null) {
      this.form.osId = this.osSelected.id;
    }
    this.form.capaFase = this.capaPhases[this.capaStepIndex];
    if (this.capaStepIndex === this.capaPhases.length - 1) {
      this.form.status = 'FECHADA';
    }
    this.salvando = true;
    const body = this.payloadFromForm();
    const req = this.editId
      ? this.svc.naoConformidades.atualizar(this.editId, body)
      : this.svc.naoConformidades.criar(body);
    req.subscribe({
      next: nc => {
        this.salvando = false;
        this.editId = nc.id ?? this.editId;
        this.form = { ...nc };
        this.initEtapas(nc.etapas);
        this.anexos = nc.anexos ?? [];
        this.syncOsFromForm();
        this.showCapaToast('success', this.i18n.translate('conformidade.toast.salvo'));
        this.buscar();
      },
      error: err => {
        this.salvando = false;
        this.handleCapaApiError(err, 'conformidade.err.salvar');
      }
    });
  }

  solicitarAprovacao(): void {
    if (!this.editId || !this.validateStep(this.capaStepIndex)) {
      return;
    }
    if (this.osSelected?.id != null) {
      this.form.osId = this.osSelected.id;
    }
    this.form.capaFase = this.capaPhases[this.capaStepIndex];
    this.solicitandoAprovacao = true;
    const body = this.payloadFromForm();
    this.svc.naoConformidades.atualizar(this.editId, body).subscribe({
      next: nc => {
        this.solicitandoAprovacao = false;
        this.form = { ...nc };
        this.initEtapas(nc.etapas);
        this.anexos = nc.anexos ?? [];
        this.syncOsFromForm();
        this.showCapaToast('success', this.i18n.translate('conformidade.nc.toast.solicitacaoEnviada'));
        this.buscar();
      },
      error: err => {
        this.solicitandoAprovacao = false;
        this.handleCapaApiError(err, 'conformidade.err.salvar');
      }
    });
  }

  aprovarFase(): void {
    if (!this.editId) return;
    if (!this.validateStep(this.capaStepIndex, { requireResponsavel: true })) {
      return;
    }
    const fase = this.capaPhases[this.capaStepIndex];
    this.aprovando = true;
    const body = this.payloadFromForm();
    this.svc.naoConformidades.atualizar(this.editId, body).subscribe({
      next: nc => {
        this.form = { ...nc };
        this.initEtapas(nc.etapas);
        this.svc.naoConformidades.aprovarEtapa(this.editId!, fase, this.aprovacaoObs || undefined).subscribe({
          next: etapa => {
            this.aprovando = false;
            const idx = this.formEtapas.findIndex(e => e.fase === etapa.fase);
            if (idx >= 0) this.formEtapas[idx] = { ...etapa };
            this.aprovacaoObs = '';
            this.showCapaToast('success', this.i18n.translate('conformidade.nc.toast.aprovado'));
          },
          error: err => {
            this.aprovando = false;
            this.handleCapaApiError(err, 'conformidade.err.salvar');
          }
        });
      },
      error: err => {
        this.aprovando = false;
        this.handleCapaApiError(err, 'conformidade.err.salvar');
      }
    });
  }

  confirmarRejeitar(): void {
    this.confirm.confirm({
      message: this.i18n.translate('conformidade.nc.confirm.rejeitar'),
      header: 'confirm.header.confirm',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'common.confirm.yes',
      rejectLabel: 'common.confirm.noShort',
      acceptIcon: 'pi pi-check',
      acceptButtonStyleClass: CONFIRM_DESTRUCTIVE_ACCEPT_CLASS,
      rejectButtonStyleClass: CONFIRM_SAFE_REJECT_CLASS,
      accept: () => this.rejeitarFase()
    });
  }

  rejeitarFase(): void {
    if (!this.editId) return;
    const fase = this.capaPhases[this.capaStepIndex];
    this.svc.naoConformidades.rejeitarEtapa(this.editId, fase, this.aprovacaoObs || undefined).subscribe({
      next: etapa => {
        const idx = this.formEtapas.findIndex(e => e.fase === etapa.fase);
        if (idx >= 0) this.formEtapas[idx] = { ...etapa };
        this.aprovacaoObs = '';
        this.showCapaToast('info', this.i18n.translate('conformidade.nc.toast.rejeitado'));
      },
      error: err => this.handleCapaApiError(err, 'conformidade.err.salvar')
    });
  }

  triggerAnexoInput(): void {
    if (this.enviandoAnexo) return;
    this.anexoFileInput?.nativeElement?.click();
  }

  onAnexoDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOverAnexo = true;
  }

  onAnexoDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOverAnexo = false;
  }

  onAnexoDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOverAnexo = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.processAnexoFile(file);
    }
  }

  onAnexoFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.processAnexoFile(file);
    }
    input.value = '';
  }

  private processAnexoFile(file: File): void {
    if (!this.editId) return;
    if (file.size > this.anexoMaxBytes) {
      this.showCapaToast('warn', this.i18n.translate('conformidade.nc.error.anexoGrande'));
      return;
    }
    this.enviarAnexoFile(file);
  }

  private enviarAnexoFile(file: File): void {
    if (!this.editId) return;
    const fase = this.capaPhases[this.capaStepIndex];
    this.enviandoAnexo = true;
    this.svc.naoConformidades.uploadAnexo(this.editId, file, fase).subscribe({
      next: anexo => {
        this.enviandoAnexo = false;
        this.anexos = [anexo, ...this.anexos];
        this.clearFieldError('anexo');
        this.showCapaToast('success', this.i18n.translate('conformidade.nc.toast.anexoEnviado'));
      },
      error: err => {
        this.enviandoAnexo = false;
        this.handleCapaApiError(err, 'conformidade.err.salvar');
      }
    });
  }

  baixarAnexo(anexo: ConformidadeNcAnexo): void {
    if (!this.editId || !anexo.id) return;
    this.svc.naoConformidades.downloadAnexo(this.editId, anexo.id).subscribe({
      next: res => {
        const blob = res.body;
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = anexo.nomeOriginal || anexo.nomeArquivo || 'anexo';
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  }

  excluirAnexo(anexo: ConformidadeNcAnexo): void {
    if (!this.editId || !anexo.id) return;
    this.svc.naoConformidades.excluirAnexo(this.editId, anexo.id).subscribe({
      next: () => {
        this.anexos = this.anexos.filter(a => a.id !== anexo.id);
        this.toast.add({ severity: 'success', summary: this.i18n.translate('conformidade.toast.excluido') });
      }
    });
  }

  confirmarExcluir(row: ConformidadeNc): void {
    this.confirm.confirm(
      destructiveDeleteConfirm(this.i18n.translate('conformidade.confirm.excluir'), () => {
        if (!row.id) return;
        this.svc.naoConformidades.excluir(row.id).subscribe(() => {
          this.toast.add({ severity: 'success', summary: this.i18n.translate('conformidade.toast.excluido') });
          this.buscar();
        });
      })
    );
  }
}
