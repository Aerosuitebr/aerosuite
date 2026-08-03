import { DEFAULT_LIST_PAGE_SIZE, LIST_ROWS_PER_PAGE_OPTIONS } from '../../core/list-pagination.constants';
import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { CalendarModule } from 'primeng/calendar';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputSwitchModule } from 'primeng/inputswitch';
import { MessageService } from 'primeng/api';
import {
  EstoqueService,
  Invoice,
  Fornecedor,
  InvoiceItem,
  InvoiceInativacaoValidacao
} from '../../core/estoque.service';
import { TranslationService } from '../../core/translation.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { ESTOQUE_PAIS_I18N_KEYS, ESTOQUE_PAIS_OPTION_VALUES } from '../../core/i18n/estoque-screens-i18n';
import { LocaleMoneyPipe } from '../../core/locale/locale-money.pipe';
import { LocaleCurrencyService } from '../../core/locale/locale-currency.service';
import { IsoLocalDatePipe } from '../../core/locale/iso-local-date.pipe';
import { parseIsoDateLocal, toIsoDatePayload } from '../../core/locale/iso-local-date.util';
import { createEstoqueSearch } from '../shared/estoque-search.helper';
import { PageHeroComponent } from '../../shared/page-hero/page-hero.component';
import { ListDataStatesComponent } from '../../shared/list-data-states/list-data-states.component';
import { ListTableScrollDirective } from '../../shared/list-table-scroll/list-table-scroll.directive';
import { DialogNoteFieldComponent } from '../../shared/dialog-note-field/dialog-note-field.component';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [
    ListTableScrollDirective,
    CommonModule, FormsModule, RouterModule, TableModule, ButtonModule, 
    InputTextModule, InputNumberModule, TagModule, TooltipModule, DropdownModule, 
    ToastModule, DialogModule, CalendarModule, InputTextareaModule, InputSwitchModule, TranslatePipe, LocaleMoneyPipe, IsoLocalDatePipe, PageHeroComponent, ListDataStatesComponent, DialogNoteFieldComponent
  ],
  template: `
    <p-toast></p-toast>

    <p-dialog styleClass="as-hero-dialog" [(visible)]="showMotivoDialog" [header]="'estoque.invoices.dialog.inativar.title' | translate" [modal]="true"
              [style]="{ width: '520px' }" [closable]="!acaoProcessando">
      <p class="dialog-intro" *ngIf="acaoInvoice">
        {{ 'estoque.invoices.dialog.inativar.intro' | translate:{ numero: acaoInvoice.numeroInvoice } }}
      </p>
      <app-dialog-note-field
        [(ngModel)]="motivoAcao"
        labelKey="estoque.invoices.dialog.motivoLabel"
        placeholderKey="estoque.invoices.dialog.motivoPh"
        [rows]="5">
      </app-dialog-note-field>
      <p class="orientacao-hint" *ngIf="validacaoInativacao?.orientacao">{{ validacaoInativacao.orientacao | translate }}</p>
      <ng-template pTemplate="footer">
        <button pButton [label]="'common.dialog.cancel' | translate" class="p-button-text" (click)="fecharDialogsAcao()"
                [disabled]="acaoProcessando"></button>
        <button pButton [label]="'estoque.invoices.dialog.inativar.confirm' | translate" icon="pi pi-trash" class="p-button-danger"
                (click)="confirmarInativacao()" [loading]="acaoProcessando"
                [disabled]="!motivoAcao || motivoAcao.trim().length < 5"></button>
      </ng-template>
    </p-dialog>

    <p-dialog styleClass="as-hero-dialog" [(visible)]="showBloqueioDialog" [header]="'estoque.invoices.dialog.bloqueio.title' | translate" [modal]="true"
              [style]="{ width: '560px' }">
      <div class="bloqueio-box" *ngIf="validacaoInativacao">
        <p><i class="pi pi-lock"></i> {{ 'estoque.invoices.dialog.bloqueio.lead' | translate }}</p>
        <ul>
          <li *ngFor="let b of validacaoInativacao.bloqueios">{{ b | translate }}</li>
        </ul>
        <p class="orientacao-hint">{{ validacaoInativacao.orientacaoCancelamento | translate }}</p>
        <p *ngIf="validacaoInativacao.qtdItensEstoque || validacaoInativacao.qtdLotes" class="contadores">
          {{ 'estoque.invoices.dialog.bloqueio.contadores' | translate:{ itens: validacaoInativacao.qtdItensEstoque + '', lotes: validacaoInativacao.qtdLotes + '' } }}
        </p>
      </div>
      <ng-template pTemplate="footer">
        <button pButton [label]="'common.dialog.cancel' | translate" class="p-button-text" (click)="fecharDialogsAcao()"></button>
        <button pButton [label]="'estoque.invoices.dialog.cancelar.btn' | translate" icon="pi pi-ban" class="p-button-warning"
                *ngIf="validacaoInativacao?.podeCancelar"
                (click)="abrirCancelamentoDesdeBloqueio()"></button>
      </ng-template>
    </p-dialog>

    <p-dialog styleClass="as-hero-dialog" [(visible)]="showCancelarDialog" [header]="'estoque.invoices.dialog.cancelar.title' | translate" [modal]="true"
              [style]="{ width: '520px' }" [closable]="!acaoProcessando">
      <p class="dialog-intro" *ngIf="acaoInvoice">{{ 'estoque.invoices.dialog.cancelar.intro' | translate }}</p>
      <app-dialog-note-field
        [(ngModel)]="motivoAcao"
        labelKey="estoque.invoices.dialog.cancelar.motivoLabel"
        [rows]="5">
      </app-dialog-note-field>
      <p class="orientacao-hint" *ngIf="validacaoInativacao?.orientacaoCancelamento">{{ validacaoInativacao.orientacaoCancelamento | translate }}</p>
      <ng-template pTemplate="footer">
        <button pButton [label]="'common.dialog.cancel' | translate" class="p-button-text" (click)="fecharDialogsAcao()"
                [disabled]="acaoProcessando"></button>
        <button pButton [label]="'estoque.invoices.dialog.cancelar.confirm' | translate" icon="pi pi-ban" class="p-button-warning"
                (click)="confirmarCancelamento()" [loading]="acaoProcessando"
                [disabled]="!motivoAcao || motivoAcao.trim().length < 5"></button>
      </ng-template>
    </p-dialog>

    <p-dialog styleClass="as-hero-dialog" [(visible)]="showRestaurarDialog" [header]="'estoque.invoices.dialog.restaurar.title' | translate" [modal]="true"
              [style]="{ width: '520px' }" [closable]="!acaoProcessando">
      <p class="dialog-intro" *ngIf="acaoInvoice">
        {{ 'estoque.invoices.dialog.restaurar.intro' | translate:{ numero: acaoInvoice.numeroInvoice } }}
      </p>
      <app-dialog-note-field
        [(ngModel)]="motivoAcao"
        labelKey="estoque.invoices.dialog.motivoLabel"
        placeholderKey="estoque.invoices.dialog.motivoPh"
        [rows]="5">
      </app-dialog-note-field>
      <ng-template pTemplate="footer">
        <button pButton [label]="'common.dialog.cancel' | translate" class="p-button-text" (click)="fecharDialogsAcao()"
                [disabled]="acaoProcessando"></button>
        <button pButton [label]="'estoque.invoices.dialog.restaurar.confirm' | translate" icon="pi pi-refresh" class="p-button-success"
                (click)="confirmarRestauracao()" [loading]="acaoProcessando"
                [disabled]="!motivoAcao || motivoAcao.trim().length < 5"></button>
      </ng-template>
    </p-dialog>
    
    <div class="as-page invoice-container">
      <app-page-hero
        variant="sky"
        titleKey="estoque.invoices.list.title"
        subtitleKey="estoque.invoices.list.subtitle"
        titleIcon="pi-file-import"
        [hasActions]="true">
        <button
          actions
          pButton
          [label]="'estoque.invoices.list.btnNew' | translate"
          icon="pi pi-plus"
          (click)="abrirNovaInvoice()"></button>
      </app-page-hero>

      <!-- Filtros -->
      <div class="filter-bar">
        <span class="p-input-icon-left">
          <i class="pi pi-search"></i>
          <input
            pInputText
            [(ngModel)]="searchTerm"
            [placeholder]="'estoque.invoices.list.searchPlaceholder' | translate"
            (input)="listSearch.fromInput($event)"
            (ngModelChange)="listSearch.fromModel($event)" />
        </span>
        <p-dropdown [(ngModel)]="statusFilter" [options]="statusOptions" [placeholder]="'estoque.invoices.list.filterStatus' | translate" 
                    [showClear]="true" (onChange)="buscar()" [appendTo]="'body'"></p-dropdown>
        <div class="filter-inativas">
          <p-inputSwitch inputId="invoice-incluir-inativas" [(ngModel)]="incluirInativas" (onChange)="buscar()"></p-inputSwitch>
          <label for="invoice-incluir-inativas">{{ 'estoque.invoices.list.filterInativas' | translate }}</label>
        </div>
      </div>

      <p class="list-money-sources" *ngIf="listMoneySourcesLine">{{ listMoneySourcesLine }}</p>

      <!-- Tabela -->
      <div class="table-container">
        <app-list-data-states
          [loading]="loading"
          [itemCount]="invoices.length"
          [skeletonRows]="8"
          [skeletonCols]="8"
          emptyTitleKey="estoque.invoices.list.empty"
          emptyDescriptionKey="ui.empty.description">
          <button emptyAction pButton [label]="'estoque.invoices.list.emptyBtn' | translate" icon="pi pi-plus"
                  class="p-button-outlined" (click)="abrirNovaInvoice()"></button>
          <p-table appListScroll [value]="invoices" [loading]="loading" [paginator]="true" [rows]="listPageSize"
                 styleClass="p-datatable-striped estoque-data-table" [rowHover]="true"
                 [tableStyle]="{ width: '100%', 'table-layout': 'fixed' }">
          <ng-template pTemplate="header">
            <tr>
              <th class="col-inv-num"><div class="header-cell"><span>{{ 'estoque.invoices.list.col.invoiceNumber' | translate }}</span></div></th>
              <th class="col-inv-forn"><div class="header-cell"><span>{{ 'estoque.invoices.list.col.supplier' | translate }}</span></div></th>
              <th class="col-inv-data"><div class="header-cell"><span>{{ 'estoque.invoices.list.col.issueDate' | translate }}</span></div></th>
              <th class="col-inv-data"><div class="header-cell"><span>{{ 'estoque.invoices.list.col.receiptDate' | translate }}</span></div></th>
              <th class="col-inv-moeda col-center"><div class="header-cell header-cell--center"><span>{{ 'estoque.invoices.list.col.currency' | translate }}</span></div></th>
              <th class="col-inv-valor col-right"><div class="header-cell header-cell--end"><span>{{ 'estoque.invoices.list.col.totalValue' | translate }}</span></div></th>
              <th class="col-inv-status col-center"><div class="header-cell header-cell--center"><span>{{ 'common.list.col.status' | translate }}</span></div></th>
              <th class="col-inv-acoes col-center"><div class="header-cell header-cell--center"><span>{{ 'common.list.col.actions' | translate }}</span></div></th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-inv>
            <tr>
              <td class="col-inv-num">
                <span class="numero-badge">{{ inv.numeroInvoice }}</span>
                <p-tag *ngIf="inv.status === 'CANCELADA'" [value]="'estoque.invoices.list.badgeCancelada' | translate" severity="danger" styleClass="ml-2"></p-tag>
                <p-tag *ngIf="inv.isActive === false" [value]="'estoque.invoices.list.badgeInativa' | translate" severity="secondary" styleClass="ml-2"></p-tag>
              </td>
              <td class="col-inv-forn">
                <div class="fornecedor-info">
                  <strong>{{ inv.fornecedorNome || '-' }}</strong>
                  <small>{{ inv.fornecedorCodigo }}</small>
                </div>
              </td>
              <td class="col-inv-data">{{ inv.dataEmissao | isoLocalDate }}</td>
              <td class="col-inv-data">{{ inv.dataRecebimento ? (inv.dataRecebimento | isoLocalDate) : '-' }}</td>
              <td class="col-inv-moeda col-center">{{ inv.moeda || 'USD' }}</td>
              <td class="col-inv-valor col-right valor">{{ inv.valorTotal | localeMoney:(inv.moeda || 'USD'):invoiceListMoneyOpts }}</td>
              <td class="col-inv-status col-center"><p-tag [value]="getStatusLabel(inv.status)" [severity]="getStatusSeverity(inv.status)"></p-tag></td>
              <td class="col-inv-acoes col-center">
                <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" 
                        [pTooltip]="'estoque.invoices.list.tooltip.details' | translate" [routerLink]="['/estoque/invoices', inv.id]"></button>
                <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm p-button-warning" 
                        [pTooltip]="'common.list.tooltip.edit' | translate" (click)="editarInvoice(inv)"></button>
                <button pButton icon="pi pi-sign-in" class="p-button-text p-button-sm"
                        *ngIf="inv.isActive !== false && inv.status !== 'CANCELADA'"
                        [pTooltip]="'estoque.invoices.list.tooltip.entry' | translate"
                        [routerLink]="['/estoque/entrada']"
                        [queryParams]="{ invoiceId: inv.id, fornecedorId: inv.fornecedorId }"></button>
                <button pButton icon="pi pi-refresh" class="p-button-text p-button-sm p-button-success"
                        *ngIf="inv.isActive === false && inv.status !== 'CANCELADA'"
                        [pTooltip]="'estoque.invoices.list.tooltip.restaurar' | translate"
                        (click)="iniciarRestauracao(inv, $event)"></button>
                <button pButton icon="pi pi-trash" class="p-button-text p-button-sm p-button-danger"
                        *ngIf="inv.isActive !== false"
                        [pTooltip]="'estoque.invoices.list.tooltip.inativar' | translate"
                        (click)="iniciarInativacao(inv, $event)"></button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="8" class="empty-state">
                <i class="pi pi-inbox"></i>
                <p>{{ 'estoque.invoices.list.empty' | translate }}</p>
                <button pButton [label]="'estoque.invoices.list.emptyBtn' | translate" icon="pi pi-plus" 
                        class="p-button-outlined" (click)="abrirNovaInvoice()"></button>
              </td>
            </tr>
          </ng-template>
        </p-table>
        </app-list-data-states>
      </div>
    </div>

    <!-- Dialog Nova/Editar Invoice -->
    <p-dialog styleClass="as-hero-dialog invoice-dialog" [(visible)]="showInvoiceDialog" 
              [header]="invoiceEditando?.id ? ('estoque.invoices.dialog.edit' | translate) : ('estoque.invoices.dialog.new' | translate)"
              [modal]="true"
              [style]="{width: '800px'}"
              [contentStyle]="{'overflow': 'visible'}"
             >
      <div class="invoice-form" *ngIf="invoiceEditando">
        <!-- Dados Básicos -->
        <div class="form-section">
          <h4><i class="pi pi-file"></i> {{ 'estoque.invoices.dialog.section.basic' | translate }}</h4>
          <div class="form-grid">
            <div class="form-field">
              <label>{{ 'estoque.invoices.dialog.field.number' | translate }}</label>
              <input pInputText [(ngModel)]="invoiceEditando.numeroInvoice" [placeholder]="'estoque.invoices.dialog.ph.number' | translate">
            </div>
            <div class="form-field">
              <label>{{ 'estoque.invoices.dialog.field.supplier' | translate }}</label>
              <p-dropdown [(ngModel)]="invoiceEditando.fornecedorId" 
                          [options]="fornecedores" 
                          optionLabel="razaoSocial" 
                          optionValue="id"
                          [placeholder]="'estoque.invoices.dialog.ph.supplier' | translate"
                          [filter]="true"
                          filterBy="razaoSocial,codigo"
                          [appendTo]="'body'"
                          styleClass="w-full">
                <ng-template pTemplate="item" let-item>
                  <div class="fornecedor-option">
                    <strong>{{ item.codigo }}</strong> - {{ item.razaoSocial }}
                    <small>{{ item.paisOrigem }}</small>
                  </div>
                </ng-template>
              </p-dropdown>
            </div>
            <div class="form-field">
              <label>{{ 'estoque.invoices.dialog.field.issueDate' | translate }}</label>
              <p-calendar [(ngModel)]="invoiceEditando.dataEmissao" 
                          dateFormat="dd/mm/yy" 
                          [showIcon]="true"
                          [utc]="false"
                          [appendTo]="'body'"
                          styleClass="w-full"></p-calendar>
            </div>
            <div class="form-field">
              <label>{{ 'estoque.invoices.dialog.field.receiptDate' | translate }}</label>
              <p-calendar [(ngModel)]="invoiceEditando.dataRecebimento" 
                          dateFormat="dd/mm/yy" 
                          [showIcon]="true"
                          [utc]="false"
                          [appendTo]="'body'"
                          styleClass="w-full"></p-calendar>
            </div>
          </div>
        </div>

        <!-- Origem e Transporte -->
        <div class="form-section">
          <h4><i class="pi pi-globe"></i> {{ 'estoque.invoices.dialog.section.transport' | translate }}</h4>
          <div class="form-grid">
            <div class="form-field">
              <label>{{ 'estoque.invoices.dialog.field.originCountry' | translate }}</label>
              <p-dropdown [(ngModel)]="invoiceEditando.paisOrigem" 
                          [options]="paises"
                          [placeholder]="'estoque.common.select' | translate"
                          [appendTo]="'body'"
                          styleClass="w-full"></p-dropdown>
            </div>
            <div class="form-field">
              <label>{{ 'estoque.invoices.dialog.field.transportMode' | translate }}</label>
              <p-dropdown [(ngModel)]="invoiceEditando.modalTransporte" 
                          [options]="modaisTransporte"
                          [placeholder]="'estoque.common.select' | translate"
                          [appendTo]="'body'"
                          styleClass="w-full"></p-dropdown>
            </div>
            <div class="form-field">
              <label>{{ 'estoque.invoices.dialog.field.awb' | translate }}</label>
              <input pInputText [(ngModel)]="invoiceEditando.numeroConhecimento" [placeholder]="'estoque.invoices.dialog.ph.awb' | translate">
            </div>
            <div class="form-field">
              <label>{{ 'estoque.invoices.dialog.field.di' | translate }}</label>
              <input pInputText [(ngModel)]="invoiceEditando.numeroDi" [placeholder]="'estoque.invoices.dialog.ph.di' | translate">
            </div>
          </div>
        </div>

        <!-- Valores -->
        <div class="form-section">
          <h4><i class="pi pi-dollar"></i> {{ 'estoque.invoices.dialog.section.values' | translate }}</h4>
          <p class="section-hint">{{ 'estoque.invoices.dialog.hint.valuesCurrency' | translate }}</p>
          <div class="form-grid">
            <div class="form-field">
              <label>{{ 'estoque.invoices.dialog.field.currency' | translate }}</label>
              <p-dropdown [(ngModel)]="invoiceEditando.moeda" 
                          [options]="moedas"
                          [placeholder]="'estoque.common.select' | translate"
                          [appendTo]="'body'"
                          styleClass="w-full"></p-dropdown>
            </div>
            <div class="form-field">
              <label>{{ 'estoque.invoices.dialog.field.total' | translate }}</label>
              <p-inputNumber [(ngModel)]="invoiceEditando.valorTotal" 
                             mode="currency" 
                             [currency]="invoiceEditando.moeda || 'USD'" 
                             locale="en-US"></p-inputNumber>
            </div>
            <div class="form-field">
              <label>{{ 'estoque.invoices.dialog.field.freight' | translate }}</label>
              <p-inputNumber [(ngModel)]="invoiceEditando.valorFrete" 
                             mode="currency" 
                             [currency]="invoiceEditando.moeda || 'USD'" 
                             locale="en-US"></p-inputNumber>
            </div>
            <div class="form-field">
              <label>{{ 'estoque.invoices.dialog.field.fx' | translate }}</label>
              <p-inputNumber [(ngModel)]="invoiceEditando.taxaCambio" 
                             mode="decimal" 
                             [minFractionDigits]="4"
                             [maxFractionDigits]="4"></p-inputNumber>
            </div>
            <div class="form-field full-width taxes-brl-block">
              <h5 class="subsection-title">{{ 'estoque.invoices.dialog.subsection.importTaxes' | translate }}</h5>
              <label>{{ 'estoque.invoices.dialog.field.taxes' | translate }}</label>
              <p-inputNumber [(ngModel)]="invoiceEditando.valorImpostos" 
                             mode="currency" 
                             currency="BRL" 
                             locale="pt-BR"
                             styleClass="w-full"></p-inputNumber>
              <small class="field-hint">{{ 'estoque.invoices.dialog.hint.taxes' | translate }}</small>
            </div>
            <div class="form-field">
              <label>{{ 'estoque.invoices.dialog.field.status' | translate }}</label>
              <p-dropdown [(ngModel)]="invoiceEditando.status" 
                          [options]="statusOptions"
                          [placeholder]="'estoque.common.select' | translate"
                          [appendTo]="'body'"
                          styleClass="w-full"></p-dropdown>
            </div>
          </div>
        </div>

        <!-- Observações -->
        <div class="form-section">
          <h4><i class="pi pi-comment"></i> {{ 'estoque.invoices.dialog.section.notes' | translate }}</h4>
          <div class="form-grid">
            <div class="form-field full-width">
              <textarea pInputTextarea [(ngModel)]="invoiceEditando.observacoes" 
                        [rows]="3" [placeholder]="'estoque.invoices.dialog.ph.notes' | translate"></textarea>
            </div>
          </div>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <div class="dialog-footer">
          <button pButton [label]="'common.actions.cancel' | translate" class="p-button-text" (click)="cancelarInvoice()"></button>
          <button pButton [label]="'estoque.invoices.dialog.save' | translate" icon="pi pi-check" 
                  (click)="salvarInvoice()" 
                  [loading]="salvando"
                  [disabled]="!invoiceEditando?.numeroInvoice || !invoiceEditando?.fornecedorId"></button>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styleUrls: ['../shared/estoque-datatable.scss'],
  styles: [`
    :host { display: block; width: 100%; box-sizing: border-box; }
    .invoice-container { width: 100%; max-width: 100%; box-sizing: border-box; }
    
    .page-header { 
      display: flex; 
      justify-content: space-between; 
      align-items: flex-start; 
      margin-bottom: 24px; 
    }
    
    .page-header h1 { 
      display: flex; 
      align-items: center; 
      gap: 12px; 
      font-size: 24px; 
      color: #1e293b; 
      margin: 0 0 8px; 
    }
    
    .page-header h1 i { color: #3b82f6; }
    .page-header p { color: #64748b; margin: 0; }
    
    .filter-bar { 
      display: flex; 
      gap: 16px; 
      margin-bottom: 20px; 
      flex-wrap: wrap;
    }
    
    .filter-bar input { width: 350px; }

    .list-money-sources {
      margin: 0 0 12px;
      padding: 10px 12px;
      font-size: 12px;
      line-height: 1.45;
      color: #64748b;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
    }
    
    .table-container { 
      background: white; 
      border-radius: 12px; 
      overflow: hidden; 
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      width: 100%;
    }
    :host ::ng-deep .estoque-data-table .col-inv-num { width: 14%; }
    :host ::ng-deep .estoque-data-table .col-inv-forn { width: 22%; }
    :host ::ng-deep .estoque-data-table .col-inv-data { width: 10%; }
    :host ::ng-deep .estoque-data-table .col-inv-moeda { width: 6%; }
    :host ::ng-deep .estoque-data-table .col-inv-valor { width: 12%; }
    :host ::ng-deep .estoque-data-table .col-inv-status { width: 10%; }
    :host ::ng-deep .estoque-data-table .col-inv-acoes { width: 16%; }
    :host ::ng-deep .estoque-data-table .col-inv-acoes .p-button { margin: 0 1px; }
    
    .numero-badge { 
      background: #dbeafe; 
      padding: 6px 12px; 
      border-radius: 6px; 
      font-size: 13px; 
      font-weight: 600; 
      color: #1e40af; 
    }
    
    .fornecedor-info {
      display: flex;
      flex-direction: column;
      
      strong { font-size: 14px; }
      small { color: #64748b; font-size: 12px; }
    }
    
    .valor {
      font-weight: 600;
      color: #059669;
      white-space: nowrap;
    }
    
    .empty-state { 
      text-align: center; 
      padding: 60px 40px; 
      color: #64748b; 
      
      i { font-size: 56px; display: block; margin-bottom: 16px; opacity: 0.5; }
      p { margin-bottom: 20px; }
    }

    /* Form Styles */
    .invoice-form {
      max-height: 60vh;
      overflow-y: auto;
      padding-right: 8px;
    }

    .section-hint,
    .field-hint {
      margin: 0;
      font-size: 12px;
      color: #64748b;
      line-height: 1.4;
    }

    .section-hint {
      margin-bottom: 12px;
    }

    .subsection-title {
      margin: 8px 0 4px;
      font-size: 13px;
      font-weight: 600;
      color: #475569;
    }

    .taxes-brl-block {
      padding-top: 8px;
      border-top: 1px dashed #e2e8f0;
    }

    .form-section {
      margin-bottom: 24px;
      
      h4 {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 0 16px;
        padding-bottom: 8px;
        border-bottom: 1px solid #e2e8f0;
        color: #334155;
        font-size: 15px;
        
        i { color: #3b82f6; }
      }
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
      
      &.full-width { grid-column: span 2; }
      
      label {
        font-size: 13px;
        font-weight: 500;
        color: #334155;
      }
      
      input, textarea, :host ::ng-deep .p-dropdown, 
      :host ::ng-deep .p-calendar, :host ::ng-deep .p-inputnumber {
        width: 100%;
      }
    }

    .fornecedor-option {
      display: flex;
      flex-direction: column;
      
      small { color: #64748b; font-size: 11px; }
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    :host ::ng-deep {
      .invoice-dialog .p-dialog-content { overflow: visible; }
      .p-dropdown-panel { z-index: 10001 !important; }
      .p-datepicker { z-index: 10001 !important; }
    }

    .dialog-intro { margin: 0 0 1rem; color: #64748b; font-size: 0.9rem; }
    .field-label { display: block; font-weight: 600; margin-bottom: 0.35rem; }
    .orientacao-hint { font-size: 0.85rem; color: #64748b; margin-top: 0.5rem; }
    .bloqueio-box ul { margin: 0.5rem 0; padding-left: 1.25rem; }
    .contadores { font-size: 0.85rem; color: #475569; }

    @media (max-width: 768px) {
      .form-grid { grid-template-columns: 1fr; }
      .form-field.full-width { grid-column: span 1; }
      .filter-bar { flex-direction: column; }
      .filter-bar input { width: 100%; }
    }
  `]
})
export class InvoiceListComponent implements OnInit {
  readonly listPageSize = DEFAULT_LIST_PAGE_SIZE;

  private estoqueService = inject(EstoqueService);
  private messageService = inject(MessageService);
  private i18n = inject(TranslationService);
  private route = inject(ActivatedRoute);
  readonly localeCurrency = inject(LocaleCurrencyService);

  /** Só o valor na célula; fonte/taxa ficam em {@link listMoneySourcesLine}. */
  readonly invoiceListMoneyOpts = { showFootnote: false };

  /** Origem e taxa de conversão (moeda da interface) — uma vez acima da tabela. */
  get listMoneySourcesLine(): string {
    return this.localeCurrency.getCatalogPriceFootnote(null, 'USD');
  }
  private readonly destroyRef = inject(DestroyRef);

  readonly listSearch = createEstoqueSearch(this.destroyRef, term => {
    this.searchTerm = term;
    this.buscar();
  });

  invoices: Invoice[] = [];
  fornecedores: Fornecedor[] = [];
  loading = true;
  salvando = false;
  searchTerm = '';
  statusFilter: string | null = null;
  incluirInativas = false;
  
  showInvoiceDialog = false;
  invoiceEditando: Partial<Invoice> | null = null;

  showMotivoDialog = false;
  showBloqueioDialog = false;
  showCancelarDialog = false;
  showRestaurarDialog = false;
  acaoInvoice: Invoice | null = null;
  motivoAcao = '';
  acaoProcessando = false;
  validacaoInativacao: InvoiceInativacaoValidacao | null = null;

  private readonly statusOptionDefs = [
    { label: 'PENDENTE', value: 'PENDENTE' as const },
    { label: 'EM_TRANSITO', value: 'EM_TRANSITO' as const },
    { label: 'RECEBIDA', value: 'RECEBIDA' as const },
    { label: 'CONFERIDA', value: 'CONFERIDA' as const },
    { label: 'ESTOCADA', value: 'ESTOCADA' as const },
    { label: 'CANCELADA', value: 'CANCELADA' as const }
  ];

  get statusOptions() {
    return this.i18n.buildTranslatedOptions('invoice.status', this.statusOptionDefs);
  }

  private readonly modalTransporteDefs = [
    { label: 'AEREO', value: 'AEREO' as const },
    { label: 'MARITIMO', value: 'MARITIMO' as const },
    { label: 'RODOVIARIO', value: 'RODOVIARIO' as const },
    { label: 'COURIER', value: 'COURIER' as const }
  ];

  get modaisTransporte() {
    return this.i18n.buildTranslatedOptions('invoice.transport', this.modalTransporteDefs);
  }

  private readonly moedaCodes = ['USD', 'EUR', 'BRL', 'GBP'] as const;

  get moedas() {
    return this.moedaCodes.map(code => ({
      label: this.i18n.translate(`estoque.currency.${code}`),
      value: code
    }));
  }

  get paises() {
    return ESTOQUE_PAIS_OPTION_VALUES.map(value => ({
      label: this.i18n.translate(ESTOQUE_PAIS_I18N_KEYS[value] ?? value),
      value
    }));
  }

  ngOnInit() {
    this.buscar();
    this.carregarFornecedores();
    this.route.queryParams.subscribe(params => {
      const editarId = Number(params['editar']);
      if (editarId && !Number.isNaN(editarId)) {
        this.estoqueService.buscarInvoice(editarId).subscribe({
          next: inv => this.editarInvoice(inv),
          error: () => this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'estoque.invoices.detail.errorLoad')
        });
      }
    });
  }

  buscar() {
    this.loading = true;
    this.estoqueService.listarInvoices({ 
      size: 1000,
      search: this.searchTerm || undefined, 
      status: this.statusFilter || undefined,
      incluirInativas: this.incluirInativas || undefined
    }).subscribe({
      next: (result) => { 
        this.invoices = result.content; 
        this.loading = false; 
      },
      error: (err) => { 
        this.loading = false; 
        console.error('Failed to search invoices:', err);
      }
    });
  }

  carregarFornecedores() {
    this.estoqueService.listarFornecedores({ size: 200 }).subscribe({
      next: (result) => this.fornecedores = result.content,
      error: (err) => console.error('Failed to load suppliers:', err)
    });
  }

  abrirNovaInvoice() {
    this.invoiceEditando = {
      numeroInvoice: '',
      fornecedorId: undefined,
      dataEmissao: new Date() as any,
      moeda: 'USD',
      paisOrigem: 'Estados Unidos',
      modalTransporte: 'AEREO',
      status: 'PENDENTE'
    };
    this.showInvoiceDialog = true;
  }

  editarInvoice(invoice: Invoice) {
    this.invoiceEditando = { ...invoice };
    if (this.invoiceEditando.dataEmissao) {
      this.invoiceEditando.dataEmissao = parseIsoDateLocal(this.invoiceEditando.dataEmissao) as any;
    }
    if (this.invoiceEditando.dataRecebimento) {
      this.invoiceEditando.dataRecebimento = parseIsoDateLocal(this.invoiceEditando.dataRecebimento) as any;
    }
    this.showInvoiceDialog = true;
  }

  salvarInvoice() {
    if (!this.invoiceEditando) return;

    if (!this.invoiceEditando.numeroInvoice) {
      this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'estoque.invoiceList.toast.warnNeedNumber');
      return;
    }

    if (!this.invoiceEditando.fornecedorId) {
      this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'estoque.invoiceList.toast.warnNeedSupplier');
      return;
    }

    this.salvando = true;

    // Converter datas (sem deslocamento de fuso)
    const dados: any = { ...this.invoiceEditando };
    dados.dataEmissao = toIsoDatePayload(dados.dataEmissao);
    dados.dataRecebimento = toIsoDatePayload(dados.dataRecebimento);

    const request = dados.id 
      ? this.estoqueService.atualizarInvoice(dados.id, dados as Invoice)
      : this.estoqueService.criarInvoice(dados as Invoice);

    request.subscribe({
      next: (invoice) => {
        this.salvando = false;
        this.showInvoiceDialog = false;
        this.buscar();
        if (dados.id) {
          this.i18n.addToast(this.messageService, 'success', 'common.toast.success', 'estoque.invoiceList.toast.savedUpdated');
        } else {
          this.i18n.addToast(this.messageService, 'success', 'common.toast.success', 'estoque.invoiceList.toast.savedCreated', {
            numero: String(invoice.numeroInvoice ?? '')
          });
        }
      },
      error: (err) => {
        this.salvando = false;
        console.error('Failed to save invoice:', err);
        const msg = err.error?.error || this.i18n.translate('estoque.invoiceList.toast.saveErrorFallback');
        this.i18n.addToastLiteralDetail(this.messageService, 'error', 'common.toast.error', msg);
      }
    });
  }

  cancelarInvoice() {
    this.showInvoiceDialog = false;
    this.invoiceEditando = null;
  }

  getStatusLabel(status?: string): string {
    if (!status) {
      return '-';
    }
    return this.i18n.translateCatalog('invoice.status', status, status);
  }

  getStatusSeverity(status?: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    const severities: { [key: string]: 'success' | 'info' | 'warning' | 'danger' | 'secondary' } = { 
      PENDENTE: 'warning', 
      EM_TRANSITO: 'info', 
      RECEBIDA: 'info', 
      CONFERIDA: 'success', 
      ESTOCADA: 'success', 
      CANCELADA: 'danger' 
    };
    return severities[status || ''] || 'secondary';
  }

  iniciarInativacao(inv: Invoice, event?: Event): void {
    event?.stopPropagation();
    if (!inv.id) return;
    this.acaoInvoice = inv;
    this.motivoAcao = '';
    this.validacaoInativacao = null;
    this.estoqueService.validarInativacaoInvoice(inv.id).subscribe({
      next: v => {
        this.validacaoInativacao = v;
        if (v.podeInativar) {
          this.showMotivoDialog = true;
          this.showBloqueioDialog = false;
          this.showCancelarDialog = false;
        } else {
          this.showBloqueioDialog = true;
          this.showMotivoDialog = false;
        }
      },
      error: err => {
        this.i18n.addToastLiteralDetail(
          this.messageService,
          'error',
          'common.toast.error',
          this.i18n.translateApiError(err?.error, 'estoque.invoiceList.toast.validacaoErr')
        );
      }
    });
  }

  abrirCancelamentoDesdeBloqueio(): void {
    this.showBloqueioDialog = false;
    this.showCancelarDialog = true;
    this.motivoAcao = '';
  }

  iniciarRestauracao(inv: Invoice, event?: Event): void {
    event?.stopPropagation();
    if (!inv.id) return;
    this.acaoInvoice = inv;
    this.motivoAcao = '';
    this.showRestaurarDialog = true;
  }

  confirmarRestauracao(): void {
    if (!this.acaoInvoice?.id || !this.motivoAcao?.trim()) return;
    this.acaoProcessando = true;
    this.estoqueService.restaurarInvoice(this.acaoInvoice.id, this.motivoAcao.trim()).subscribe({
      next: res => {
        this.acaoProcessando = false;
        this.fecharDialogsAcao();
        this.buscar();
        this.i18n.addToast(
          this.messageService,
          'success',
          'common.toast.success',
          res.mensagem?.startsWith('estoque.') ? res.mensagem : 'estoque.invoiceList.toast.restaurada'
        );
      },
      error: err => this.tratarErroAcaoInvoice(err)
    });
  }

  fecharDialogsAcao(): void {
    this.showMotivoDialog = false;
    this.showBloqueioDialog = false;
    this.showCancelarDialog = false;
    this.showRestaurarDialog = false;
    this.acaoInvoice = null;
    this.motivoAcao = '';
    this.acaoProcessando = false;
  }

  confirmarInativacao(): void {
    if (!this.acaoInvoice?.id || !this.motivoAcao?.trim()) return;
    this.acaoProcessando = true;
    this.estoqueService.inativarInvoice(this.acaoInvoice.id, this.motivoAcao.trim()).subscribe({
      next: res => {
        this.acaoProcessando = false;
        this.fecharDialogsAcao();
        this.buscar();
        this.i18n.addToast(
          this.messageService,
          'success',
          'common.toast.success',
          res.mensagem?.startsWith('estoque.') ? res.mensagem : 'estoque.invoiceList.toast.inativada'
        );
      },
      error: err => this.tratarErroAcaoInvoice(err)
    });
  }

  confirmarCancelamento(): void {
    if (!this.acaoInvoice?.id || !this.motivoAcao?.trim()) return;
    this.acaoProcessando = true;
    this.estoqueService.cancelarInvoice(this.acaoInvoice.id, this.motivoAcao.trim()).subscribe({
      next: res => {
        this.acaoProcessando = false;
        this.fecharDialogsAcao();
        this.buscar();
        this.i18n.addToast(
          this.messageService,
          'success',
          'common.toast.success',
          res.mensagem?.startsWith('estoque.') ? res.mensagem : 'estoque.invoice.toast.cancelada'
        );
      },
      error: err => this.tratarErroAcaoInvoice(err)
    });
  }

  private tratarErroAcaoInvoice(err: { error?: { error?: string; message?: string } }): void {
    this.acaoProcessando = false;
    this.i18n.addToastLiteralDetail(
      this.messageService,
      'error',
      'common.toast.error',
      this.i18n.translateApiError(err?.error, 'estoque.invoiceList.toast.inativarErr')
    );
  }
}
