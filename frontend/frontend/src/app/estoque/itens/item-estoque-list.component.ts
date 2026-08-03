import { DEFAULT_LIST_PAGE_SIZE, LIST_ROWS_PER_PAGE_OPTIONS } from '../../core/list-pagination.constants';
import { createStaleRequestGuard, resolveLazyPageRequest, type LazyLoadEvent } from '../../core/lazy-list-pagination.helper';
import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';
import { CertificadoPeca, EstoqueService, Invoice, ItemEstoque, Lote } from '../../core/estoque.service';
import { CalendarModule } from 'primeng/calendar';
import { TranslationService } from '../../core/translation.service';
import { getDefaultAppLogoUrlAbsolute } from '../../shared/constants/logo.constant';
import { buildEtiquetaPadrao100x45Document } from '../shared/etiqueta-padrao-100x45';
import { buildEtiquetaPrintContext, openEtiquetaHtmlPrint } from '../shared/etiqueta-print.util';
import { EtiquetaPrintService } from '../shared/etiqueta-print.service';
import { resolveEtiquetaQrPayload } from '../shared/etiqueta-qr.util';
import { EstoqueQrOriginService } from '../shared/estoque-qr-origin.service';
import { ThermalPrintMode } from '../../core/print/thermal-print-preferences.service';
import { BrandingService } from '../../core/branding.service';
import { AuthService } from '../../auth/auth.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { LocaleMoneyPipe } from '../../core/locale/locale-money.pipe';
import { LocaleCurrencyService } from '../../core/locale/locale-currency.service';
import { MoneyCurrency } from '../../core/locale/locale-region.config';
import { PageHeroComponent } from '../../shared/page-hero/page-hero.component';
import { ListDataStatesComponent } from '../../shared/list-data-states/list-data-states.component';
import { ListTableScrollDirective } from '../../shared/list-table-scroll/list-table-scroll.directive';
import { createEstoqueSearch } from '../shared/estoque-search.helper';
import { InvoiceParaDropdown, mapInvoicesParaDropdown } from '../shared/invoice-dropdown.util';


@Component({
  selector: 'app-item-estoque-list',
  standalone: true,
  imports: [
    ListTableScrollDirective,
    CommonModule, FormsModule, RouterModule, TableModule, ButtonModule, InputTextModule, InputTextareaModule, InputNumberModule, TagModule, TooltipModule, DropdownModule, ToastModule, DialogModule, CalendarModule, TranslatePipe, LocaleMoneyPipe, PageHeroComponent, ListDataStatesComponent],
  template: `
    <p-toast></p-toast>
    <div class="as-page itens-container">
      <app-page-hero
        variant="sky"
        titleKey="estoque.itens.list.title"
        subtitleKey="estoque.itens.list.subtitle"
        titleIcon="pi-list"
        [hasActions]="true">
        <button
          actions
          pButton
          [label]="'estoque.itens.list.btnNewEntry' | translate"
          icon="pi pi-plus"
          routerLink="/estoque/entrada"></button>
      </app-page-hero>

      <div class="as-page-body">
      <div class="filter-bar">
        <span class="p-input-icon-left">
          <i class="pi pi-search"></i>
          <input
            pInputText
            [(ngModel)]="searchTerm"
            [placeholder]="'estoque.itens.list.searchPlaceholder' | translate"
            (input)="listSearch.fromInput($event)"
            (ngModelChange)="listSearch.fromModel($event)" />
        </span>
        <p-dropdown [(ngModel)]="statusFilter" [options]="statusOptions" [placeholder]="'estoque.itens.list.filterStatus' | translate" [showClear]="true" (onChange)="buscar()"></p-dropdown>
      </div>

      <div class="table-container">
        <app-list-data-states
          [loading]="loading"
          [itemCount]="totalRecords"
          [skeletonRows]="8"
          [skeletonCols]="14"
          [mountContentWhileLoading]="true"
          emptyTitleKey="estoque.itens.list.empty"
          emptyDescriptionKey="estoque.itens.list.emptyDescription">
        <p-table appListScroll [value]="itens" [loading]="loading" [paginator]="true"
                 [first]="tableFirst" [rows]="size" [rowsPerPageOptions]="listRowsPerPageOptions"
                 [totalRecords]="totalRecords" [lazy]="true" dataKey="id"
                 (onLazyLoad)="carregarDados($event)"
                 styleClass="p-datatable-striped itens-stock-table"
                 [tableStyle]="{ width: '100%', 'table-layout': 'fixed' }">
          <ng-template pTemplate="header">
            <tr>
              <th class="col-rastreio"><div class="header-cell"><span>{{ 'estoque.itens.list.col.traceCode' | translate }}</span></div></th>
              <th class="col-pn"><div class="header-cell"><span>{{ 'estoque.itens.list.col.partNumber' | translate }}</span></div></th>
              <th class="col-sn"><div class="header-cell"><span>{{ 'estoque.itens.list.col.serialNumber' | translate }}</span></div></th>
              <th class="col-forn"><div class="header-cell"><span>{{ 'estoque.itens.list.col.supplier' | translate }}</span></div></th>
              <th class="col-loc"><div class="header-cell"><span>{{ 'estoque.itens.list.col.location' | translate }}</span></div></th>
              <th class="col-caixa col-center"><div class="header-cell header-cell--center"><span>{{ 'estoque.itens.list.col.shelf' | translate }}</span></div></th>
              <th class="col-gaveta col-center"><div class="header-cell header-cell--center"><span>{{ 'estoque.itens.list.col.drawer' | translate }}</span></div></th>
              <th class="col-qty col-center"><div class="header-cell header-cell--center"><span>{{ 'estoque.itens.list.col.qty' | translate }}</span></div></th>
              <th class="col-usd col-right"><div class="header-cell header-cell--end"><span>{{ 'estoque.itens.list.col.unitUsd' | translate }}</span></div></th>
              <th class="col-brl col-right"><div class="header-cell header-cell--end"><span>{{ 'estoque.itens.list.col.unitBrl' | translate }}</span></div></th>
              <th class="col-min col-center"><div class="header-cell header-cell--center"><span>{{ 'estoque.itens.list.col.minStock' | translate }}</span></div></th>
              <th class="col-ideal col-center"><div class="header-cell header-cell--center"><span>{{ 'estoque.itens.list.col.idealStock' | translate }}</span></div></th>
              <th class="col-status col-center"><div class="header-cell header-cell--center"><span>{{ 'common.list.col.status' | translate }}</span></div></th>
              <th class="col-acoes col-center"><div class="header-cell header-cell--center"><span>{{ 'common.list.col.actions' | translate }}</span></div></th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-item>
            <tr [ngClass]="getRowClassEstoque(item)">
              <td class="col-rastreio"><span class="codigo-badge" [pTooltip]="item.codigoRastreio">{{ item.codigoRastreio }}</span></td>
              <td class="col-pn" [pTooltip]="item.partNumber"><strong>{{ item.partNumber }}</strong></td>
              <td class="col-sn" [pTooltip]="item.serialNumber">{{ item.serialNumber || '-' }}</td>
              <td class="col-forn" [pTooltip]="item.fornecedorNome">{{ item.fornecedorNome || '-' }}</td>
              <td class="col-loc" [pTooltip]="item.localizacao">{{ item.localizacao || '-' }}</td>
              <td class="col-caixa col-center">{{ item.prateleira || '-' }}</td>
              <td class="col-gaveta col-center">{{ item.gaveta || '-' }}</td>
              <td class="col-qty col-center"><span [class]="'qtd-cell ' + getRowClassEstoque(item)">{{ item.quantidade }}</span></td>
              <td class="col-usd col-right cell-money" [pTooltip]="moneyTooltip(item.valorUnitarioUsd, 'USD')">{{ item.valorUnitarioUsd != null ? (item.valorUnitarioUsd | localeMoney:'USD':itemValorUnitTableOpts) : '-' }}</td>
              <td class="col-brl col-right cell-money" [pTooltip]="moneyTooltip(item.valorUnitarioBrl, 'BRL')">{{ item.valorUnitarioBrl != null ? (item.valorUnitarioBrl | localeMoney:'BRL':itemValorUnitTableOpts) : '-' }}</td>
              <td class="col-min col-center">{{ item.estoqueMinimo != null ? item.estoqueMinimo : '-' }}</td>
              <td class="col-ideal col-center">{{ item.estoqueIdeal != null ? item.estoqueIdeal : '-' }}</td>
              <td class="col-status col-center"><p-tag [value]="getStatusLabel(item.status)" [severity]="getStatusSeverity(item.status)"></p-tag></td>
              <td class="col-acoes col-center">
                <div class="action-buttons">
                  <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" [pTooltip]="'estoque.itens.list.tooltip.details' | translate" (click)="verDetalhes(item)"></button>
                  <button pButton icon="pi pi-qrcode" class="p-button-text p-button-sm" [pTooltip]="'estoque.itens.list.tooltip.qr' | translate" (click)="verQrCode(item)"></button>
                  <button pButton icon="pi pi-shield" class="p-button-text p-button-sm p-button-warning"
                    *ngIf="item.status === 'DISPONIVEL' || item.status === 'RESERVADO'"
                    [pTooltip]="'estoque.quarentena.btn.enviar' | translate"
                    (click)="abrirQuarentena(item)"></button>
                  <button pButton icon="pi pi-file-edit" class="p-button-text p-button-sm"
                    [pTooltip]="'estoque.cert.btn.editar' | translate"
                    (click)="abrirCertificado(item)"></button>
                  <button pButton icon="pi pi-arrow-circle-right" class="p-button-text p-button-sm"
                    [pTooltip]="'estoque.itens.list.tooltip.exit' | translate"
                    [disabled]="exigeCertificadoPeca && item.certificadoCompleto === false"
                    (click)="registrarSaida(item)"></button>
                  <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm" [pTooltip]="'estoque.itens.list.tooltip.editEntry' | translate" (click)="editarEntrada(item)"></button>
                  <button pButton icon="pi pi-trash" class="p-button-text p-button-sm p-button-danger" [pTooltip]="'estoque.itens.list.tooltip.deleteEntry' | translate" (click)="excluirEntrada(item)"></button>
                  <button pButton type="button" icon="pi pi-print" class="p-button-text p-button-sm"
                    [pTooltip]="'estoque.etiqueta.print.tooltip.browser' | translate"
                    [loading]="printingItemId === item.id"
                    [disabled]="printingItemId != null"
                    (click)="imprimirEtiqueta(item, 'browser')"></button>
                  <button pButton type="button" icon="pi pi-bolt" class="p-button-text p-button-sm btn-print-thermal"
                    [pTooltip]="'estoque.etiqueta.print.tooltip.thermal' | translate"
                    [loading]="printingItemId === item.id"
                    [disabled]="printingItemId != null"
                    (click)="imprimirEtiqueta(item, 'thermal')"></button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="14" class="empty-state"><i class="pi pi-inbox"></i><p>{{ 'estoque.itens.list.empty' | translate }}</p></td></tr>
          </ng-template>
        </p-table>
        </app-list-data-states>
      </div>
      </div>

      <!-- Dialog de Detalhes -->
      <p-dialog styleClass="as-hero-dialog" [(visible)]="showDetalhesDialog" [header]="detalhesDialogHeader" [modal]="true" [style]="{width: '600px'}" (onHide)="onDetalhesDialogHide()">
        <div class="detalhes-content" *ngIf="itemSelecionado">
          <div class="detalhe-grid">
            <div class="detalhe-item"><label>{{ 'estoque.itens.list.col.partNumber' | translate }}</label><span>{{ itemSelecionado.partNumber }}</span></div>
            <div class="detalhe-item"><label>{{ 'estoque.itens.list.col.serialNumber' | translate }}</label><span>{{ itemSelecionado.serialNumber || '-' }}</span></div>
            <div class="detalhe-item"><label>{{ 'estoque.itens.list.col.supplier' | translate }}</label><span>{{ itemSelecionado.fornecedorNome || '-' }}</span></div>
            <div class="detalhe-item"><label>{{ 'estoque.itens.dialog.field.country' | translate }}</label><span>{{ itemSelecionado.fornecedorPais || '-' }}</span></div>
            <div class="detalhe-item"><label>{{ 'estoque.itens.dialog.field.invoice' | translate }}</label><span>{{ itemSelecionado.invoiceNumero || '-' }}</span></div>
            <div class="detalhe-item"><label>{{ 'estoque.itens.dialog.field.batch' | translate }}</label><span>{{ itemSelecionado.loteCodigo || '-' }}</span></div>
            <div class="detalhe-item"><label>{{ 'estoque.cert.numero' | translate }}</label><span>{{ certificadoNumeroExibicao(itemSelecionado) }}</span></div>
            <div class="detalhe-item"><label>{{ 'estoque.itens.list.col.location' | translate }}</label><span>{{ itemSelecionado.localizacao || '-' }}</span></div>
            <div class="detalhe-item"><label>{{ 'estoque.itens.list.col.shelf' | translate }}</label><span>{{ itemSelecionado.prateleira || '-' }}</span></div>
            <div class="detalhe-item"><label>{{ 'estoque.itens.list.col.drawer' | translate }}</label><span>{{ itemSelecionado.gaveta || '-' }}</span></div>
            <div class="detalhe-item"><label>{{ 'estoque.itens.dialog.field.qty' | translate }}</label><span>{{ itemSelecionado.quantidade }}</span></div>
            <div class="detalhe-item"><label>{{ 'estoque.itens.list.col.minStock' | translate }}</label><span>{{ itemSelecionado.estoqueMinimo != null ? itemSelecionado.estoqueMinimo : '-' }}</span></div>
            <div class="detalhe-item"><label>{{ 'estoque.itens.list.col.idealStock' | translate }}</label><span>{{ itemSelecionado.estoqueIdeal != null ? itemSelecionado.estoqueIdeal : '-' }}</span></div>
            <div class="detalhe-item"><label>{{ 'estoque.itens.dialog.field.usd' | translate }}</label><span>{{ itemSelecionado.valorUnitarioUsd | localeMoney:'USD':itemValorUnitDialogOpts }}</span></div>
            <div class="detalhe-item"><label>{{ 'estoque.itens.dialog.field.brl' | translate }}</label><span>{{ itemSelecionado.valorUnitarioBrl | localeMoney:'BRL':itemValorUnitDialogOpts }}</span></div>
            <div class="detalhe-item"><label>{{ 'estoque.itens.dialog.field.entryDate' | translate }}</label><span>{{ itemSelecionado.createdAt | date:'dd/MM/yyyy HH:mm' }}</span></div>
            <div class="detalhe-item"><label>{{ 'estoque.itens.list.filterStatus' | translate }}</label><span><p-tag [value]="getStatusLabel(itemSelecionado.status)" [severity]="getStatusSeverity(itemSelecionado.status)"></p-tag></span></div>
          </div>
          <div class="editar-minimo-ideal" *ngIf="itemSelecionado.id">
            <label>{{ 'estoque.itens.dialog.editMinIdeal' | translate }}</label>
            <div class="minimo-ideal-fields">
              <div class="form-field"><label>{{ 'estoque.itens.list.col.minStock' | translate }}</label><input type="number" min="0" step="0.001" [(ngModel)]="editEstoqueMinimo" [placeholder]="'estoque.itens.dialog.ph.min' | translate"></div>
              <div class="form-field"><label>{{ 'estoque.itens.list.col.idealStock' | translate }}</label><input type="number" min="0" step="0.001" [(ngModel)]="editEstoqueIdeal" [placeholder]="'estoque.itens.dialog.ph.ideal' | translate"></div>
              <button pButton [label]="'common.actions.save' | translate" icon="pi pi-check" class="p-button-sm" (click)="salvarEstoqueMinimoIdeal()" [loading]="salvandoMinimo"></button>
            </div>
          </div>
          <div class="qrcode-section">
            <i class="pi pi-spin pi-spinner qrcode-loading" *ngIf="qrCodePreviewLoading" aria-hidden="true"></i>
            <img *ngIf="qrCodePreviewUrl && !qrCodePreviewLoading" [src]="qrCodePreviewUrl" [attr.alt]="'estoque.itens.list.tooltip.qr' | translate">
            <p class="qrcode-error" *ngIf="!qrCodePreviewLoading && !qrCodePreviewUrl && itemSelecionado.id">{{ 'estoque.etiqueta.print.qrLoadFailed' | translate }}</p>
          </div>
        </div>
      </p-dialog>

      <p-dialog styleClass="as-hero-dialog" [(visible)]="showQuarentenaDialog" [header]="'estoque.quarentena.dialog.enviarTitle' | translate" [modal]="true" [style]="{width: '460px'}">
        <div class="form-dialog" *ngIf="itemAcao">
          <p class="dialog-item-ref"><strong>{{ itemAcao.codigoRastreio }}</strong> — {{ itemAcao.partNumber }}</p>
          <div class="form-field">
            <label>{{ 'estoque.quarentena.field.motivo' | translate }} *</label>
            <textarea pInputTextarea rows="3" [(ngModel)]="motivoQuarentena"></textarea>
          </div>
          <div class="form-field">
            <label>{{ 'estoque.quarentena.field.obs' | translate }}</label>
            <input pInputText [(ngModel)]="obsQuarentena" />
          </div>
          <div class="dialog-actions">
            <button pButton class="p-button-text" [label]="'common.actions.cancel' | translate" (click)="showQuarentenaDialog = false"></button>
            <button pButton icon="pi pi-shield" [loading]="salvandoQuarentena" [label]="'estoque.quarentena.btn.enviar' | translate" (click)="confirmarQuarentena()"></button>
          </div>
        </div>
      </p-dialog>

      <p-dialog styleClass="as-hero-dialog" [(visible)]="showCertDialog" [header]="'estoque.cert.btn.editar' | translate" [modal]="true" [style]="{width: '520px'}">
        <div class="form-dialog" *ngIf="itemAcao">
          <p class="dialog-item-ref"><strong>{{ itemAcao.codigoRastreio }}</strong> — {{ itemAcao.partNumber }}</p>
          <p-tag [value]="(certForm.completo ? 'estoque.cert.completo' : 'estoque.cert.incompleto') | translate"
                 [severity]="certForm.completo ? 'success' : 'warn'"></p-tag>
          <div class="form-field">
            <label>{{ 'estoque.cert.tipo' | translate }}</label>
            <p-dropdown [(ngModel)]="certForm.certTipo" [options]="certTipoOptions" optionLabel="label" optionValue="value" [showClear]="true" styleClass="w-full"></p-dropdown>
          </div>
          <div class="form-field">
            <label>{{ 'estoque.cert.numero' | translate }}</label>
            <input pInputText [(ngModel)]="certForm.certNumero" />
          </div>
          <div class="form-field">
            <label>{{ 'estoque.cert.emissor' | translate }}</label>
            <input pInputText [(ngModel)]="certForm.certEmissor" />
          </div>
          <div class="form-field">
            <label>{{ 'estoque.cert.dataEmissao' | translate }}</label>
            <p-calendar [(ngModel)]="certDataEmissaoDate" dateFormat="dd/mm/yy" [showIcon]="true" styleClass="w-full"></p-calendar>
          </div>
          <div class="form-field">
            <label>{{ 'estoque.cert.dataValidade' | translate }}</label>
            <p-calendar [(ngModel)]="certDataValidadeDate" dateFormat="dd/mm/yy" [showIcon]="true" styleClass="w-full"></p-calendar>
          </div>
          <div class="form-field">
            <label>{{ 'estoque.cert.orgao' | translate }}</label>
            <input pInputText [(ngModel)]="certForm.certOrgaoAprovacao" />
          </div>
          <div class="form-field">
            <label>{{ 'estoque.cert.anexo' | translate }}</label>
            <input type="file" accept=".pdf,image/jpeg,image/png" (change)="onCertAnexoPick($event)">
            <small *ngIf="certForm.temAnexo">{{ certForm.certAnexoNome }}</small>
          </div>
          <div class="dialog-actions">
            <button pButton type="button" class="p-button-text" [label]="'estoque.cert.btn.baixarAnexo' | translate"
                    icon="pi pi-download" *ngIf="certForm.temAnexo" (click)="baixarCertAnexo()"></button>
            <button pButton type="button" class="p-button-text" [label]="'common.actions.cancel' | translate" (click)="showCertDialog = false"></button>
            <button pButton [label]="'estoque.cert.btn.salvar' | translate" icon="pi pi-check" [loading]="salvandoCert" (click)="salvarCertificado()"></button>
          </div>
        </div>
      </p-dialog>

      <p-dialog styleClass="as-hero-dialog" [(visible)]="showSaidaDialog" [header]="'estoque.itens.dialog.exitTitle' | translate" [modal]="true" [style]="{width: '420px'}">
        <div class="form-dialog" *ngIf="itemAcao">
          <p class="dialog-item-ref"><strong>{{ itemAcao.codigoRastreio }}</strong> - {{ itemAcao.partNumber }}</p>
          <p class="cert-warn" *ngIf="exigeCertificadoPeca && !itemAcao.certificadoCompleto">
            {{ 'estoque.cert.error.incompleto_saida' | translate }}
          </p>
          <div class="form-grid-2">
            <div class="form-field">
              <label>{{ 'estoque.itens.dialog.field.os' | translate }} *</label>
              <input pInputText type="text" inputmode="numeric" [(ngModel)]="saidaOsIdInput" (ngModelChange)="onSaidaOsChange($event)" [placeholder]="'estoque.itens.dialog.ph.os' | translate" [class.input-invalid]="!isSaidaOsValida() && touchedSaida">
              <small class="field-error" *ngIf="!isSaidaOsValida() && touchedSaida">{{ 'estoque.itens.dialog.err.os' | translate }}</small>
            </div>
            <div class="form-field">
              <label>{{ 'estoque.itens.dialog.field.qty' | translate }} *</label>
              <p-inputNumber [(ngModel)]="saidaQuantidade" [min]="0.001" mode="decimal"
                [minFractionDigits]="0" [maxFractionDigits]="3" [useGrouping]="false" [showButtons]="true"
                styleClass="w-full" [inputStyleClass]="!isSaidaQuantidadeValida() && touchedSaida ? 'input-invalid' : ''">
              </p-inputNumber>
              <small class="field-error" *ngIf="!isSaidaQuantidadeValida() && touchedSaida">{{ 'estoque.itens.dialog.err.qtyExit' | translate }}</small>
            </div>
          </div>
          <div class="form-field">
            <label>{{ 'estoque.itens.dialog.field.balance' | translate }}</label>
            <small class="field-hint">{{ saidaBalanceHint }}</small>
          </div>
          <small class="field-hint">{{ 'estoque.itens.dialog.hint.qtyUnit' | translate }}</small>
          <div class="form-field">
            <label>{{ 'estoque.itens.dialog.field.reason' | translate }}</label>
            <input pInputText [(ngModel)]="saidaMotivo" [placeholder]="'estoque.itens.dialog.ph.reasonExit' | translate">
          </div>
          <div class="dialog-actions">
            <button pButton [label]="'common.actions.cancel' | translate" class="p-button-text" (click)="showSaidaDialog = false"></button>
            <button pButton [label]="'estoque.itens.dialog.btn.confirmExit' | translate" icon="pi pi-check" [loading]="salvandoSaida" [disabled]="!isSaidaFormValido()" (click)="confirmarSaida()"></button>
          </div>
        </div>
      </p-dialog>

      <p-dialog styleClass="as-hero-dialog" [(visible)]="showEditarDialog" [header]="'estoque.itens.dialog.editTitle' | translate" [modal]="true" [style]="{width: '520px'}">
        <div class="form-dialog" *ngIf="itemAcao">
          <p class="dialog-item-ref"><strong>{{ itemAcao.codigoRastreio }}</strong></p>
          <small class="field-hint" *ngIf="itemAcao.status === 'CONSUMIDO' || itemAcao.status === 'EM_USO'">
            {{ 'estoque.itens.dialog.hint.qtyReopen' | translate }}
          </small>
          <div class="form-field">
            <label>{{ 'estoque.itens.list.col.partNumber' | translate }} *</label>
            <input pInputText [(ngModel)]="editPartNumber" [placeholder]="'estoque.itens.dialog.ph.partNumber' | translate" [class.input-invalid]="!isEditPartNumberValido() && touchedEdicao">
            <small class="field-error" *ngIf="!isEditPartNumberValido() && touchedEdicao">{{ 'estoque.itens.dialog.err.partNumber' | translate }}</small>
          </div>
          <div class="form-field">
            <label>{{ 'estoque.itens.dialog.field.qty' | translate }} *</label>
            <p-inputNumber [(ngModel)]="editQuantidade" [min]="0.001" mode="decimal"
              [minFractionDigits]="0" [maxFractionDigits]="3" [useGrouping]="false" [showButtons]="true"
              styleClass="w-full" [inputStyleClass]="!isEdicaoQuantidadeValida() && touchedEdicao ? 'input-invalid' : ''">
            </p-inputNumber>
            <small class="field-error" *ngIf="!isEdicaoQuantidadeValida() && touchedEdicao">{{ 'estoque.itens.dialog.err.qtyEdit' | translate }}</small>
          </div>
          <div class="form-grid-2">
            <div class="form-field">
              <label>{{ 'estoque.itens.dialog.field.invoice' | translate }}</label>
              <p-dropdown [(ngModel)]="editInvoiceId" [options]="invoicesEdicao" optionLabel="rotuloSelecao"
                optionValue="id" [filter]="true" [showClear]="true" [placeholder]="'estoque.itens.dialog.ph.invoice' | translate"
                styleClass="w-full"></p-dropdown>
            </div>
            <div class="form-field">
              <label>{{ 'estoque.itens.dialog.field.batch' | translate }}</label>
              <p-dropdown [(ngModel)]="editLoteId" [options]="lotesEdicao" optionLabel="codigoLote"
                optionValue="id" [filter]="true" [showClear]="true" [placeholder]="'estoque.itens.dialog.ph.batch' | translate"
                styleClass="w-full"></p-dropdown>
            </div>
          </div>
          <div class="form-field">
            <label>{{ 'estoque.itens.dialog.field.localizacao' | translate }}</label>
            <input pInputText [(ngModel)]="editLocalizacao" [placeholder]="'estoque.itens.dialog.ph.localizacao' | translate">
          </div>
          <div class="form-grid-2">
            <div class="form-field">
              <label>{{ 'estoque.itens.dialog.field.caixa' | translate }}</label>
              <input pInputText [(ngModel)]="editCaixa" [placeholder]="'estoque.itens.dialog.ph.caixa' | translate">
            </div>
            <div class="form-field">
              <label>{{ 'estoque.itens.dialog.field.gaveta' | translate }}</label>
              <input pInputText [(ngModel)]="editGaveta" [placeholder]="'estoque.itens.dialog.ph.gaveta' | translate">
            </div>
          </div>
          <small class="field-hint">{{ 'estoque.itens.dialog.hint.qtyUnit' | translate }}</small>
          <div class="dialog-actions">
            <button pButton [label]="'common.actions.cancel' | translate" class="p-button-text" (click)="showEditarDialog = false"></button>
            <button pButton [label]="'common.actions.save' | translate" icon="pi pi-check" [loading]="salvandoEdicao" [disabled]="!isEdicaoFormValido()" (click)="confirmarEdicao()"></button>
          </div>
        </div>
      </p-dialog>

      <p-dialog styleClass="as-hero-dialog" [(visible)]="showExcluirDialog" [header]="'estoque.itens.dialog.deleteTitle' | translate" [modal]="true" [style]="{width: '460px'}">
        <div class="form-dialog" *ngIf="itemAcao">
          <p class="dialog-item-ref">{{ deleteConfirmMessage }}</p>
          <div class="form-field">
            <label>{{ 'estoque.itens.dialog.field.reason' | translate }}</label>
            <input pInputText [(ngModel)]="excluirMotivo" [placeholder]="'estoque.itens.dialog.ph.reasonDelete' | translate">
          </div>
          <div class="dialog-actions">
            <button pButton [label]="'common.actions.cancel' | translate" class="p-button-text" (click)="showExcluirDialog = false"></button>
            <button pButton [label]="'common.actions.delete' | translate" icon="pi pi-trash" class="p-button-danger" [loading]="salvandoExclusao" (click)="confirmarExclusao()"></button>
          </div>
        </div>
      </p-dialog>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      width: 100%;
      min-height: 0;
      box-sizing: border-box;
    }
    .itens-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      width: 100%;
      min-height: 0;
      box-sizing: border-box;
    }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-shrink: 0; }
    .page-header h1 { display: flex; align-items: center; gap: 12px; font-size: 24px; color: #1e293b; margin: 0 0 8px; }
    .page-header h1 i { color: #22c55e; }
    .page-header p { color: #475569; margin: 0; }
    .cert-warn { background: #fff7ed; border: 1px solid #fdba74; padding: 0.5rem 0.75rem; border-radius: 8px; font-size: 0.85rem; margin-bottom: 0.75rem; }
    .filter-bar { display: flex; gap: 16px; margin-bottom: 20px; flex-shrink: 0; flex-wrap: wrap; }
    .filter-bar input { width: min(100%, 350px); }
    .table-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      width: 100%;
      min-height: 0;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    @media (max-width: 1023px) {
      .table-container {
        overflow-x: auto;
        overflow-y: visible;
        -webkit-overflow-scrolling: touch;
      }

      :host ::ng-deep .itens-stock-table .p-datatable-wrapper {
        overflow-x: auto !important;
        overflow-y: visible !important;
        -webkit-overflow-scrolling: touch;
      }

      :host ::ng-deep .itens-stock-table .p-datatable-table {
        table-layout: auto !important;
        min-width: max(100%, 960px);
      }
    }
    :host ::ng-deep .itens-stock-table {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      width: 100%;
    }
    :host ::ng-deep .itens-stock-table .p-datatable-wrapper {
      flex: 1;
      min-height: 0;
      width: 100%;
    }
    :host ::ng-deep .itens-stock-table .p-datatable-scrollable-header-table,
    :host ::ng-deep .itens-stock-table .p-datatable-scrollable-body-table,
    :host ::ng-deep .itens-stock-table .p-datatable-table {
      width: 100% !important;
      min-width: 100% !important;
      table-layout: fixed !important;
    }
    :host ::ng-deep .itens-stock-table .p-datatable-scrollable-header-box {
      width: 100% !important;
    }
    :host ::ng-deep .itens-stock-table .p-paginator {
      flex-shrink: 0;
      border-top: 1px solid #e2e8f0;
    }
    :host ::ng-deep .itens-stock-table .p-datatable-thead > tr > th,
    :host ::ng-deep .itens-stock-table .p-datatable-tbody > tr > td {
      vertical-align: middle;
      padding: 0.65rem 0.5rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      box-sizing: border-box;
    }
    :host ::ng-deep .itens-stock-table .p-datatable-thead > tr > th {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      color: #475569;
      background: #f8fafc;
    }
    :host ::ng-deep .itens-stock-table .header-cell {
      display: inline-flex;
      align-items: center;
      gap: 0.2rem;
      white-space: nowrap;
      flex-wrap: nowrap;
      max-width: 100%;
    }
    :host ::ng-deep .itens-stock-table .header-cell--center {
      display: flex;
      justify-content: center;
      width: 100%;
    }
    :host ::ng-deep .itens-stock-table .header-cell--end {
      display: flex;
      justify-content: flex-end;
      width: 100%;
    }
    :host ::ng-deep .itens-stock-table .col-rastreio { width: 8%; }
    :host ::ng-deep .itens-stock-table .col-pn { width: 9%; }
    :host ::ng-deep .itens-stock-table .col-sn { width: 6%; }
    :host ::ng-deep .itens-stock-table .col-forn { width: 10%; }
    :host ::ng-deep .itens-stock-table .col-loc { width: 8%; }
    :host ::ng-deep .itens-stock-table .col-caixa { width: 4%; }
    :host ::ng-deep .itens-stock-table .col-gaveta { width: 4%; }
    :host ::ng-deep .itens-stock-table .col-qty { width: 4%; }
    :host ::ng-deep .itens-stock-table .col-usd { width: 7%; }
    :host ::ng-deep .itens-stock-table .col-brl { width: 7%; }
    :host ::ng-deep .itens-stock-table .col-min { width: 4%; }
    :host ::ng-deep .itens-stock-table .col-ideal { width: 4%; }
    :host ::ng-deep .itens-stock-table .col-status { width: 7%; }
    :host ::ng-deep .itens-stock-table .col-acoes { width: 18%; min-width: 200px; }
    :host ::ng-deep .itens-stock-table .col-center { text-align: center; }
    :host ::ng-deep .itens-stock-table .col-right { text-align: right; }
    :host ::ng-deep .itens-stock-table .p-datatable-tbody > tr > td.col-acoes {
      overflow: visible;
      white-space: nowrap;
      text-align: center;
    }
    .cell-money { font-variant-numeric: tabular-nums; }
    .codigo-badge {
      background: #dcfce7;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      color: #166534;
      font-family: monospace;
    }
    .action-buttons {
      display: inline-flex;
      flex-wrap: nowrap;
      justify-content: center;
      align-items: center;
      gap: 0;
    }
    :host ::ng-deep .action-buttons .p-button {
      width: 1.65rem;
      height: 1.65rem;
      padding: 0;
    }
    :host ::ng-deep .action-buttons .btn-print-thermal {
      color: #0369a1;
    }
    .empty-state { text-align: center; padding: 48px; color: #475569; }
    .empty-state i { font-size: 48px; display: block; margin-bottom: 16px; }
    .detalhes-content { padding: 16px 0; }
    .detalhe-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .detalhe-item { display: flex; flex-direction: column; gap: 4px; }
    .detalhe-item label { font-size: 12px; color: #475569; text-transform: uppercase; }
    .detalhe-item span { font-size: 14px; color: #1e293b; font-weight: 500; }
    .qrcode-section { text-align: center; margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0; min-height: 150px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; }
    .qrcode-section img { width: 150px; height: 150px; border: 1px solid #e2e8f0; border-radius: 8px; }
    .qrcode-loading { font-size: 2rem; color: #0ea5e9; }
    .qrcode-error { margin: 0; font-size: 12px; color: #64748b; max-width: 280px; }
    .row-estoque-verde { background-color: rgba(34, 197, 94, 0.12) !important; }
    .row-estoque-amarelo { background-color: rgba(234, 179, 8, 0.15) !important; }
    .row-estoque-vermelho { background-color: rgba(239, 68, 68, 0.15) !important; }
    .qtd-cell.row-estoque-verde { font-weight: 600; color: #166534; }
    .qtd-cell.row-estoque-amarelo { font-weight: 600; color: #a16207; }
    .qtd-cell.row-estoque-vermelho { font-weight: 600; color: #b91c1c; }
    .editar-minimo-ideal { margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
    .editar-minimo-ideal > label { font-size: 12px; color: #475569; text-transform: uppercase; display: block; margin-bottom: 8px; }
    .minimo-ideal-fields { display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap; }
    .minimo-ideal-fields .form-field { display: flex; flex-direction: column; gap: 4px; }
    .minimo-ideal-fields .form-field label { font-size: 11px; color: #475569; }
    .minimo-ideal-fields input { width: 90px; padding: 6px 8px; }
    .form-dialog { display: flex; flex-direction: column; gap: 12px; }
    .dialog-item-ref { margin: 0; color: #0f172a; background: #f8fafc; padding: 8px 10px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .form-dialog .form-field { display: flex; flex-direction: column; gap: 6px; }
    .form-dialog .form-field label { font-size: 12px; color: #475569; }
    .field-hint { font-size: 11px; color: #475569; }
    .field-hint.invalid { color: #dc2626; }
    .field-error { font-size: 11px; color: #dc2626; }
    .input-invalid { border-color: #dc2626 !important; }
    .dialog-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
  `]
})
export class ItemEstoqueListComponent implements OnInit {
  readonly listRowsPerPageOptions = LIST_ROWS_PER_PAGE_OPTIONS;

  pageIndex = 0;
  size = DEFAULT_LIST_PAGE_SIZE;
  private readonly requestGuard = createStaleRequestGuard();


  estoqueService = inject(EstoqueService);
  private messageService = inject(MessageService);
  private etiquetaPrint = inject(EtiquetaPrintService);
  private i18n = inject(TranslationService);
  private branding = inject(BrandingService);
  private auth = inject(AuthService);
  private qrOrigin = inject(EstoqueQrOriginService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  invoiceIdFilter: number | null = null;

  readonly listSearch = createEstoqueSearch(this.destroyRef, term => {
    this.searchTerm = term;
    this.buscar();
  });

  private localeCurrency = inject(LocaleCurrencyService);

  /** Tabela: só valor formatado (sem nota PTAX na célula). */
  readonly itemValorUnitTableOpts = {
    minFractionDigits: 2,
    maxFractionDigits: 4,
    showFootnote: false
  };

  /** Detalhes: valor + nota de cotação. */
  readonly itemValorUnitDialogOpts = {
    minFractionDigits: 2,
    maxFractionDigits: 4,
    showFootnote: true,
    footnoteStyle: 'short' as const
  };

  itens: ItemEstoque[] = [];
  totalRecords = 0;
  loading = true;
  searchTerm = '';
  statusFilter: string | null = null;
  
  showDetalhesDialog = false;
  itemSelecionado: ItemEstoque | null = null;
  qrCodePreviewUrl: string | null = null;
  qrCodePreviewLoading = false;
  editEstoqueMinimo: number | null = null;
  editEstoqueIdeal: number | null = null;
  salvandoMinimo = false;
  itemAcao: ItemEstoque | null = null;
  showSaidaDialog = false;
  showEditarDialog = false;
  showExcluirDialog = false;
  saidaOsId: number | null = null;
  saidaQuantidade: number | null = null;
  saidaOsIdInput = '';
  saidaMotivo = '';
  editPartNumber = '';
  editQuantidade: number | null = null;
  editInvoiceId: number | null = null;
  editLoteId: number | null = null;
  invoicesEdicao: InvoiceParaDropdown[] = [];
  lotesEdicao: Lote[] = [];
  editCaixa = '';
  editGaveta = '';
  editLocalizacao = '';
  excluirMotivo = '';
  salvandoSaida = false;
  salvandoEdicao = false;
  salvandoExclusao = false;
  touchedSaida = false;
  touchedEdicao = false;
  readonly appLogoDataUri = getDefaultAppLogoUrlAbsolute();
  
  private readonly statusOptionDefs = [
    { label: 'DISPONIVEL', value: 'DISPONIVEL' as const },
    { label: 'RESERVADO', value: 'RESERVADO' as const },
    { label: 'EM_USO', value: 'EM_USO' as const },
    { label: 'CONSUMIDO', value: 'CONSUMIDO' as const },
    { label: 'BLOQUEADO', value: 'BLOQUEADO' as const },
    { label: 'QUARENTENA', value: 'QUARENTENA' as const }
  ];

  get statusOptions() {
    return this.i18n.buildTranslatedOptions('estoque.itens.status', this.statusOptionDefs);
  }

  exigeCertificadoPeca = false;
  showCertDialog = false;
  certForm: CertificadoPeca = {};
  certDataEmissaoDate: Date | null = null;
  certDataValidadeDate: Date | null = null;
  certAnexoFile: File | null = null;
  salvandoCert = false;
  certTipoOptions: { label: string; value: string }[] = [];
  showQuarentenaDialog = false;
  motivoQuarentena = '';
  obsQuarentena = '';
  salvandoQuarentena = false;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const id = params['invoiceId'] ? Number(params['invoiceId']) : null;
      this.invoiceIdFilter = id && !Number.isNaN(id) ? id : null;
      if (this.invoiceIdFilter) {
        this.buscar();
      }
    });
    this.certTipoOptions = ['FAA_8130_3', 'EASA_FORM1', 'ANAC', 'DUAL_RELEASE', 'OUTRO'].map(value => ({
      value,
      label: this.i18n.translate(`estoque.cert.tipo.${value}`)
    }));
    this.estoqueService.getSaidaRegras().subscribe({
      next: r => {
        this.exigeCertificadoPeca = !!r.exigeCertificadoPeca;
      },
      error: () => {
        this.exigeCertificadoPeca = false;
      }
    });

    // PrimeNG lazy table: garantir 1.ª carga após bootstrap (evita race com AuthService/interceptor no smoke Puppeteer).
    setTimeout(() => this.carregarDados({ first: 0, rows: this.size }), 100);
  }

  get tableFirst(): number {
    return this.pageIndex * this.size;
  }

  carregarDados(event?: LazyLoadEvent) {
    const req = resolveLazyPageRequest(event, { pageIndex: this.pageIndex, size: this.size });
    this.pageIndex = req.page;
    this.size = req.size;
    const seq = this.requestGuard.bump();
    this.loading = true;

    this.estoqueService.listarItensEstoque({
      page: req.page,
      size: req.size,
      search: this.searchTerm.trim() || undefined,
      status: this.statusFilter || undefined,
      invoiceId: this.invoiceIdFilter ?? undefined
    }).subscribe({
      next: (result) => {
        if (this.requestGuard.isStale(seq)) {
          return;
        }
        this.itens = result.content ?? [];
        this.totalRecords = result.totalElements ?? 0;
        this.loading = false;
      },
      error: () => {
        if (this.requestGuard.isStale(seq)) {
          return;
        }
        this.loading = false;
      }
    });
  }

  buscar() {
    this.pageIndex = 0;
    this.carregarDados({ first: 0, rows: this.size });
  }

  verDetalhes(item: ItemEstoque) {
    this.estoqueService.buscarItemEstoque(item.id!).subscribe({
      next: (detalhe) => {
        this.itemSelecionado = detalhe;
        this.editEstoqueMinimo = detalhe.estoqueMinimo ?? null;
        this.editEstoqueIdeal = detalhe.estoqueIdeal ?? null;
        this.showDetalhesDialog = true;
        if (detalhe.id) {
          this.loadQrCodePreview(detalhe.id);
        }
      },
      error: () => { this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'estoque.item.loadDetailError'); }
    });
  }

  onDetalhesDialogHide(): void {
    this.qrCodePreviewUrl = null;
    this.qrCodePreviewLoading = false;
  }

  private loadQrCodePreview(itemId: number): void {
    this.qrCodePreviewUrl = null;
    this.qrCodePreviewLoading = true;
    firstValueFrom(this.estoqueService.loadQrCodeDataUrl(itemId, 150))
      .then(url => { this.qrCodePreviewUrl = url || null; })
      .catch(() => { this.qrCodePreviewUrl = null; })
      .finally(() => { this.qrCodePreviewLoading = false; });
  }

  /** Cor da linha: verde (>= ideal), amarelo (entre mínimo e ideal), vermelho (<= mínimo). */
  getRowClassEstoque(item: ItemEstoque): string {
    const qtd = item.quantidade != null ? Number(item.quantidade) : 0;
    const min = item.estoqueMinimo != null ? Number(item.estoqueMinimo) : null;
    const ideal = item.estoqueIdeal != null ? Number(item.estoqueIdeal) : null;
    if (ideal != null && min != null) {
      if (qtd >= ideal) return 'row-estoque-verde';
      if (qtd > min) return 'row-estoque-amarelo';
      return 'row-estoque-vermelho';
    }
    if (ideal != null) {
      if (qtd >= ideal) return 'row-estoque-verde';
      return 'row-estoque-amarelo';
    }
    if (min != null) {
      if (qtd > min) return 'row-estoque-amarelo';
      return 'row-estoque-vermelho';
    }
    return '';
  }

  salvarEstoqueMinimoIdeal() {
    if (!this.itemSelecionado?.id) return;
    this.salvandoMinimo = true;
    this.estoqueService.atualizarItemEstoque(this.itemSelecionado.id, {
      estoqueMinimo: this.editEstoqueMinimo ?? undefined,
      estoqueIdeal: this.editEstoqueIdeal ?? undefined
    }).subscribe({
      next: (atualizado) => {
        this.itemSelecionado = atualizado;
        this.editEstoqueMinimo = atualizado.estoqueMinimo ?? null;
        this.editEstoqueIdeal = atualizado.estoqueIdeal ?? null;
        this.salvandoMinimo = false;
        this.buscar();
        this.i18n.addToast(this.messageService, 'success', 'common.toast.success', 'estoque.item.minMaxUpdated');
      },
      error: () => { this.salvandoMinimo = false; this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'estoque.item.saveError'); }
    });
  }

  verQrCode(item: ItemEstoque) { this.verDetalhes(item); }

  editarEntrada(item: ItemEstoque) {
    this.itemAcao = item;
    this.editPartNumber = item.partNumber || '';
    this.editQuantidade = Number(item.quantidade ?? 0) || null;
    this.editInvoiceId = item.invoiceId ?? null;
    this.editLoteId = item.loteId ?? null;
    this.editCaixa = item.prateleira || '';
    this.editGaveta = item.gaveta || '';
    this.editLocalizacao = item.localizacao || '';
    this.touchedEdicao = false;
    this.carregarListasEdicao();
    this.showEditarDialog = true;
  }

  private carregarListasEdicao(): void {
    this.estoqueService.listarInvoices({ page: 0, size: 300, somenteUtilizaveis: true }).subscribe({
      next: r => {
        this.invoicesEdicao = mapInvoicesParaDropdown(r.content || [], s =>
          this.i18n.translateCatalog('invoice.status', s, s ?? '')
        );
      },
      error: () => { this.invoicesEdicao = []; }
    });
    this.estoqueService.listarLotes({ page: 0, size: 300 }).subscribe({
      next: r => { this.lotesEdicao = r.content || []; },
      error: () => { this.lotesEdicao = []; }
    });
  }

  confirmarEdicao() {
    if (!this.itemAcao?.id) return;
    this.touchedEdicao = true;
    const novoPn = this.editPartNumber.trim();
    const novaQtd = Number(this.editQuantidade);
    if (!novoPn) {
      this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'estoque.item.pnRequired');
      return;
    }
    if (!Number.isFinite(novaQtd) || novaQtd <= 0) {
      this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'estoque.item.qtyInvalid');
      return;
    }
    this.salvandoEdicao = true;
    const body: Partial<ItemEstoque> = {
      partNumber: novoPn,
      quantidade: novaQtd,
      localizacao: this.editLocalizacao.trim(),
      prateleira: this.editCaixa.trim(),
      gaveta: this.editGaveta.trim()
    };
    if ((this.editInvoiceId ?? null) !== (this.itemAcao.invoiceId ?? null)) {
      body.invoiceId = this.editInvoiceId ?? 0;
    }
    if ((this.editLoteId ?? null) !== (this.itemAcao.loteId ?? null)) {
      body.loteId = this.editLoteId ?? 0;
    }
    this.estoqueService.atualizarItemEstoque(this.itemAcao.id, body).subscribe({
      next: () => {
        this.salvandoEdicao = false;
        this.showEditarDialog = false;
        this.buscar();
        this.i18n.addToast(this.messageService, 'success', 'common.toast.success', 'estoque.item.updateOk');
      },
      error: (err) => {
        this.salvandoEdicao = false;
        const detail =
          this.i18n.translateApiError(err?.error, 'estoque.item.updateFail');
        this.i18n.addToastLiteralDetail(this.messageService, 'error', 'common.toast.error', detail);
      }
    });
  }

  excluirEntrada(item: ItemEstoque) {
    this.itemAcao = item;
    this.excluirMotivo = this.i18n.translate('estoque.itens.dialog.default.reasonDelete');
    this.showExcluirDialog = true;
  }

  confirmarExclusao() {
    if (!this.itemAcao?.id) return;
    this.salvandoExclusao = true;
    const motivo = this.excluirMotivo?.trim() || undefined;
    this.estoqueService.excluirItemEstoque(this.itemAcao.id, motivo).subscribe({
      next: () => {
        this.salvandoExclusao = false;
        this.showExcluirDialog = false;
        this.buscar();
        this.i18n.addToast(this.messageService, 'success', 'common.toast.success', 'estoque.item.entryDeleted');
      },
      error: (err) => {
        this.salvandoExclusao = false;
        const detail =
          this.i18n.translateApiError(err?.error, 'estoque.item.deleteEntryFail');
        this.i18n.addToastLiteralDetail(this.messageService, 'error', 'common.toast.error', detail);
      }
    });
  }

  abrirQuarentena(item: ItemEstoque): void {
    this.itemAcao = item;
    this.motivoQuarentena = '';
    this.obsQuarentena = '';
    this.showQuarentenaDialog = true;
  }

  confirmarQuarentena(): void {
    if (!this.itemAcao?.id || !this.motivoQuarentena.trim()) {
      this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'estoque.quarentena.error.motivo_obrigatorio');
      return;
    }
    this.salvandoQuarentena = true;
    this.estoqueService
      .enviarQuarentena(this.itemAcao.id, {
        motivo: this.motivoQuarentena.trim(),
        observacoes: this.obsQuarentena.trim() || undefined
      })
      .subscribe({
        next: () => {
          this.salvandoQuarentena = false;
          this.showQuarentenaDialog = false;
          this.i18n.addToast(this.messageService, 'success', 'common.toast.success', 'estoque.quarentena.toast.enviado');
          this.buscar();
        },
        error: (err: { error?: unknown }) => {
          this.salvandoQuarentena = false;
          const detail = this.i18n.translateApiError(err?.error, 'estoque.quarentena.error.motivo_obrigatorio');
          this.i18n.addToastLiteralDetail(this.messageService, 'error', 'common.toast.error', detail);
        }
      });
  }

  abrirCertificado(item: ItemEstoque): void {
    if (!item.id) {
      return;
    }
    this.itemAcao = item;
    this.certAnexoFile = null;
    this.estoqueService.obterCertificado(item.id).subscribe({
      next: c => {
        this.certForm = { ...c };
        this.certDataEmissaoDate = c.certDataEmissao ? new Date(c.certDataEmissao) : null;
        this.certDataValidadeDate = c.dataValidade ? new Date(c.dataValidade) : null;
        this.showCertDialog = true;
      }
    });
  }

  onCertAnexoPick(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.certAnexoFile = input.files?.length ? input.files[0] : null;
  }

  salvarCertificado(): void {
    if (!this.itemAcao?.id) {
      return;
    }
    const body: CertificadoPeca = {
      ...this.certForm,
      certDataEmissao: this.certDataEmissaoDate
        ? this.certDataEmissaoDate.toISOString().slice(0, 10)
        : undefined,
      dataValidade: this.certDataValidadeDate
        ? this.certDataValidadeDate.toISOString().slice(0, 10)
        : undefined
    };
    this.salvandoCert = true;
    this.estoqueService.salvarCertificado(this.itemAcao.id, body).subscribe({
      next: c => {
        const upload = () => {
          this.salvandoCert = false;
          this.certForm = c;
          this.itemAcao!.certificadoCompleto = c.completo;
          this.i18n.addToast(this.messageService, 'success', 'common.toast.success', 'estoque.cert.toast.salvo');
          this.buscar();
        };
        if (this.certAnexoFile) {
          this.estoqueService.uploadCertificadoAnexo(this.itemAcao!.id!, this.certAnexoFile).subscribe({
            next: c2 => {
              this.certForm = c2;
              this.itemAcao!.certificadoCompleto = c2.completo;
              this.i18n.addToast(this.messageService, 'success', 'common.toast.success', 'estoque.cert.toast.anexoOk');
              upload();
            },
            error: () => upload()
          });
        } else {
          upload();
        }
      },
      error: (err: { error?: unknown }) => {
        this.salvandoCert = false;
        const detail = this.i18n.translateApiError(err?.error, 'estoque.cert.error.corpo_obrigatorio');
        this.i18n.addToastLiteralDetail(this.messageService, 'error', 'common.toast.error', detail);
      }
    });
  }

  baixarCertAnexo(): void {
    if (!this.itemAcao?.id) {
      return;
    }
    this.estoqueService.downloadCertificadoAnexo(this.itemAcao.id).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.certForm.certAnexoNome || 'certificado.pdf';
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  }

  registrarSaida(item: ItemEstoque) {
    if (this.exigeCertificadoPeca && item.certificadoCompleto === false) {
      this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'estoque.cert.error.incompleto_saida');
      this.abrirCertificado(item);
      return;
    }
    this.itemAcao = item;
    this.saidaOsId = null;
    const saldo = Number(item.quantidade ?? 0);
    this.saidaQuantidade = saldo > 0 ? saldo : 1;
    this.saidaOsIdInput = '';
    this.saidaMotivo = this.i18n.translate('estoque.itens.dialog.default.reasonExit');
    this.touchedSaida = false;
    this.showSaidaDialog = true;
  }

  confirmarSaida() {
    if (!this.itemAcao?.id) return;
    this.touchedSaida = true;
    const osId = Number(this.saidaOsId);
    const quantidade = Number(this.saidaQuantidade);
    const qtdAtual = Number(this.itemAcao.quantidade ?? 0);
    if (!Number.isFinite(osId) || osId <= 0) {
      this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'estoque.item.osInvalid');
      return;
    }
    if (!Number.isFinite(quantidade) || quantidade <= 0 || quantidade > qtdAtual) {
      this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'estoque.item.exitQtyInvalid');
      return;
    }
    this.salvandoSaida = true;
    const motivo = this.saidaMotivo?.trim() || undefined;
    this.estoqueService.saidaEstoque({ itemId: this.itemAcao.id, osId, quantidade, motivo }).subscribe({
      next: () => {
        this.salvandoSaida = false;
        this.showSaidaDialog = false;
        this.buscar();
        this.i18n.addToast(this.messageService, 'success', 'common.toast.success', 'estoque.item.exitOk');
      },
      error: (err: { error?: unknown }) => {
        this.salvandoSaida = false;
        const detail = this.i18n.translateApiError(err?.error, 'estoque.item.exitFail');
        this.i18n.addToastLiteralDetail(this.messageService, 'error', 'common.toast.error', detail);
      }
    });
  }

  isSaidaQuantidadeValida(): boolean {
    if (!this.itemAcao) return false;
    const quantidade = Number(this.saidaQuantidade);
    const saldo = Number(this.itemAcao.quantidade ?? 0);
    return Number.isFinite(quantidade) && quantidade > 0 && quantidade <= saldo;
  }

  isSaidaFormValido(): boolean {
    if (this.exigeCertificadoPeca && this.itemAcao?.certificadoCompleto === false) {
      return false;
    }
    return this.isSaidaOsValida() && this.isSaidaQuantidadeValida();
  }

  isSaidaOsValida(): boolean {
    const osId = Number(this.saidaOsId);
    return Number.isFinite(osId) && osId > 0;
  }

  getSaldoRestanteSaida(): string {
    if (!this.itemAcao) return '-';
    const saldo = Number(this.itemAcao.quantidade ?? 0);
    const quantidade = Number(this.saidaQuantidade);
    if (!Number.isFinite(quantidade)) return String(saldo);
    return (saldo - quantidade).toFixed(3).replace(/\.?0+$/, '');
  }

  isEdicaoQuantidadeValida(): boolean {
    const quantidade = Number(this.editQuantidade);
    return Number.isFinite(quantidade) && quantidade > 0;
  }

  isEdicaoFormValido(): boolean {
    return this.isEditPartNumberValido() && this.isEdicaoQuantidadeValida();
  }

  isEditPartNumberValido(): boolean {
    return this.editPartNumber.trim().length > 0;
  }

  onSaidaOsChange(value: string): void {
    this.saidaOsIdInput = (value || '').replace(/[^\d]/g, '');
    this.saidaOsId = this.saidaOsIdInput ? Number(this.saidaOsIdInput) : null;
  }

  printingItemId: number | null = null;

  async imprimirEtiqueta(item: ItemEstoque, channel: ThermalPrintMode | 'browser' | 'thermal' = 'browser') {
    if (this.printingItemId != null) return;
    this.printingItemId = item.id ?? null;
    try {
      const codigoRastreio = item.codigoRastreio || '';
      const partNumber = item.partNumber || '';
      const qrCodeDataUrl = await this.getQrCodeDataUrl(item.id, 200);
      const scanOrigin = await this.qrOrigin.resolveOrigin();
      const ctx = buildEtiquetaPrintContext(this.i18n, this.branding, this.appLogoDataUri);
      const L = ctx.labels;
      const html = buildEtiquetaPadrao100x45Document({
        appLogoDataUri: ctx.logoDataUri,
        commercialName: ctx.commercialName,
        codigoRastreio,
        partNumber,
        qrCodeDataUrl,
        serialNumber: item.serialNumber,
        linhaExtra: item.localizacao ? `📍 ${item.localizacao}` : null,
        prefixPn: L.prefixPn,
        prefixSn: L.prefixSn,
        noQr: L.noQr,
        titleStandard: L.titleStandard
      });

      if (channel === 'browser') {
        this.etiquetaPrint.printPadraoBrowser(html);
        return;
      }

      await this.etiquetaPrint.printPadrao100x60(
        {
          headerLine: ctx.commercialName,
          codigoRastreio,
          partNumber,
          serialNumber: item.serialNumber,
          linhaExtra: item.localizacao ? `📍 ${item.localizacao}` : null,
          qrPayload: resolveEtiquetaQrPayload(item, this.auth.getStoredTenantCodigo(), scanOrigin),
          prefixPn: L.prefixPn,
          prefixSn: L.prefixSn
        },
        () => {
          const popupOk = openEtiquetaHtmlPrint(html);
          this.etiquetaPrint.notifyBrowserFallbackOpened(popupOk);
        },
        channel
      );
    } catch (e) {
      if (!(e instanceof Error) || !['thermal-bridge-unavailable', 'thermal-print-failed'].includes(e.message)) {
        this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'estoque.etiqueta.print.errorGeneric');
      }
    } finally {
      this.printingItemId = null;
    }
  }

  private async getQrCodeDataUrl(itemId?: number, tamanho: number = 220): Promise<string> {
    if (!itemId) return '';
    try {
      return await firstValueFrom(this.estoqueService.loadQrCodeDataUrl(itemId, tamanho));
    } catch {
      this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'estoque.etiqueta.print.qrLoadFailed');
      return '';
    }
  }

  get detalhesDialogHeader(): string {
    const code = this.itemSelecionado?.codigoRastreio ?? '';
    return this.i18n.translate('estoque.itens.dialog.detailsTitle', { code });
  }

  get deleteConfirmMessage(): string {
    const code = this.itemAcao?.codigoRastreio ?? '';
    return this.i18n.translate('estoque.itens.dialog.deleteConfirm', { code });
  }

  get saidaBalanceHint(): string {
    return this.i18n.translate('estoque.itens.dialog.hint.balance', {
      available: String(this.itemAcao?.quantidade || 0),
      remaining: String(this.getSaldoRestanteSaida())
    });
  }

  moneyTooltip(value: number | null | undefined, currency: MoneyCurrency): string {
    if (value == null || !Number.isFinite(value)) return '';
    const r = this.localeCurrency.formatMoney(value, currency, {
      showFootnote: true,
      footnoteStyle: 'short',
      minFractionDigits: 2,
      maxFractionDigits: 4
    });
    return r.conversionFootnote ? `${r.formatted}\n${r.conversionFootnote}` : r.formatted;
  }

  certificadoNumeroExibicao(item: ItemEstoque): string {
    return item.certNumero?.trim() || item.certificadoConformidade?.trim() || '-';
  }

  getStatusLabel(status?: string): string {
    if (!status) return '';
    return this.i18n.translateCatalog('estoque.itens.status', status, status);
  }

  getStatusSeverity(status?: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    const severities: { [key: string]: 'success' | 'info' | 'warning' | 'danger' | 'secondary' } = {
      DISPONIVEL: 'success',
      RESERVADO: 'info',
      EM_USO: 'warning',
      CONSUMIDO: 'secondary',
      DEVOLVIDO: 'info',
      DESCARTADO: 'danger',
      BLOQUEADO: 'danger',
      QUARENTENA: 'warning'
    };
    return severities[status || ''] || 'secondary';
  }
}
