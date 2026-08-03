import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../../auth/auth.service';
import { OS, OSService } from '../../core/os.service';
import { EstoqueService, Invoice, ItemEstoque, Lote } from '../../core/estoque.service';
import { TranslationService } from '../../core/translation.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { ListDataStatesComponent } from '../../shared/list-data-states/list-data-states.component';
import { PageHeroComponent } from '../../shared/page-hero/page-hero.component';
import { createEstoqueSearch } from '../shared/estoque-search.helper';
import { TenantFeatureService } from '../../core/tenant-feature.service';
import { ListTableScrollDirective } from '../../shared/list-table-scroll/list-table-scroll.directive';
import { TenantFeatureCodes } from '../../core/tenant-feature-codes';

type ModoSaida = 'ITEM' | 'LOTE' | 'INVOICE';

@Component({
  selector: 'app-saida-estoque',
  standalone: true,
  imports: [
    ListTableScrollDirective,
    CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, InputNumberModule, DropdownModule, ToastModule, DialogModule, TagModule, AutoCompleteModule, TooltipModule, TranslatePipe, ListDataStatesComponent, PageHeroComponent],
  styleUrls: ['./saida-estoque.component.scss'],
  template: `
    <p-toast></p-toast>
    <div class="as-page saida-container">
      <app-page-hero
        variant="sky"
        titleKey="estoque.screens.saida.title"
        subtitleKey="estoque.screens.saida.subtitle"
        titleIcon="pi-arrow-circle-right"
        [hasActions]="false">
      </app-page-hero>

      <small class="permissao-alert" *ngIf="!podeOperarSaida">{{ 'estoque.screens.saida.readOnly' | translate }}</small>

      <div class="validacao-extra-banner" *ngIf="validacaoExtraAtiva" role="status">
        <i class="pi pi-shield" aria-hidden="true"></i>
        <span>{{ 'estoque.screens.saida.validacaoExtra.banner' | translate }}</span>
      </div>

      <section class="toolbar-card">
        <div class="toolbar-grid">
          <div class="field field-modo">
            <label class="field-label" for="saida-modo">{{ 'estoque.screens.saida.modoLabel' | translate }}</label>
            <p-dropdown
              inputId="saida-modo"
              styleClass="control-full"
              [options]="modos"
              [(ngModel)]="modo"
              optionLabel="labelKey"
              optionValue="value"
              (onChange)="onModoChange()">
              <ng-template pTemplate="selectedItem" let-selected>
                <span *ngIf="selected">{{ selected.labelKey | translate }}</span>
              </ng-template>
              <ng-template pTemplate="item" let-item>
                {{ item.labelKey | translate }}
              </ng-template>
            </p-dropdown>
          </div>

          <div class="field field-filter" *ngIf="modo === 'ITEM'">
            <label class="field-label" for="saida-codigo">{{ 'estoque.screens.saida.filtroCodigoLabel' | translate }}</label>
            <div class="search-row">
              <div class="search-field-wrap">
                <input
                  id="saida-codigo"
                  pInputText
                  class="control-full"
                  [(ngModel)]="codigoBusca"
                  [placeholder]="'estoque.screens.saida.filtroCodigoPh' | translate"
                  (input)="codigoSearch.fromInput($event)"
                  (ngModelChange)="codigoSearch.fromModel($event)"
                  (keyup.enter)="buscarPorCodigo()" />
              </div>
              <button
                pButton
                type="button"
                styleClass="search-action"
                [label]="'estoque.screens.saida.btnBuscar' | translate"
                icon="pi pi-search"
                (click)="buscarPorCodigo()"
                [loading]="loading"></button>
            </div>
          </div>

          <div class="field field-filter" *ngIf="modo === 'LOTE'">
            <label class="field-label" for="saida-lote">{{ 'estoque.screens.saida.filtroLoteLabel' | translate }}</label>
            <div class="search-row">
              <div class="search-field-wrap">
                <p-dropdown
                  inputId="saida-lote"
                  styleClass="control-full"
                  [options]="lotes"
                  [(ngModel)]="loteSelecionadoId"
                  optionLabel="codigoLote"
                  optionValue="id"
                  [filter]="true"
                  [placeholder]="'estoque.screens.saida.lotePh' | translate"></p-dropdown>
              </div>
              <button
                pButton
                type="button"
                styleClass="search-action"
                [label]="'estoque.screens.saida.btnCarregarItens' | translate"
                icon="pi pi-list"
                (click)="buscarPorLote()"
                [loading]="loading"></button>
            </div>
          </div>

          <div class="field field-filter" *ngIf="modo === 'INVOICE'">
            <label class="field-label" for="saida-invoice">{{ 'estoque.screens.saida.invoiceLabel' | translate }}</label>
            <div class="search-row">
              <div class="search-field-wrap">
                <p-dropdown
                  inputId="saida-invoice"
                  styleClass="control-full"
                  [options]="invoices"
                  [(ngModel)]="invoiceSelecionadaId"
                  optionLabel="numeroInvoice"
                  optionValue="id"
                  [filter]="true"
                  [placeholder]="'estoque.screens.saida.invoicePh' | translate"></p-dropdown>
              </div>
              <button
                pButton
                type="button"
                styleClass="search-action"
                [label]="'estoque.screens.saida.btnCarregarItens' | translate"
                icon="pi pi-list"
                (click)="buscarPorInvoice()"
                [loading]="loading"></button>
            </div>
          </div>
        </div>
      </section>

      <div class="table-wrap">
      <app-list-data-states
        [loading]="loading"
        [itemCount]="itens.length"
        [skeletonRows]="8"
        [skeletonCols]="9"
        emptyTitleKey="estoque.screens.saida.empty"
        emptyDescriptionKey="estoque.screens.saida.emptyHint">
      <p-table appListScroll [value]="itens" [loading]="loading" [(selection)]="itensSelecionados" dataKey="id" styleClass="p-datatable-striped saida-table">
        <ng-template pTemplate="header">
          <tr>
            <th class="col-select"><p-tableHeaderCheckbox></p-tableHeaderCheckbox></th>
            <th class="col-codigo">{{ 'estoque.screens.saida.colCodigo' | translate }}</th>
            <th class="col-pn">{{ 'estoque.screens.saida.colPn' | translate }}</th>
            <th class="col-lote">{{ 'estoque.screens.saida.colLote' | translate }}</th>
            <th class="col-invoice">{{ 'estoque.screens.saida.colInvoice' | translate }}</th>
            <th class="col-qtd">{{ 'estoque.screens.saida.colQtd' | translate }}</th>
            <th class="col-saldo">{{ 'estoque.screens.saida.colSaldoApos' | translate }}</th>
            <th class="col-status">{{ 'estoque.screens.saida.colStatus' | translate }}</th>
            <th class="col-acao">{{ 'estoque.screens.saida.colAcao' | translate }}</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-item>
          <tr>
            <td class="col-select"><p-tableCheckbox [value]="item" [disabled]="item.status !== 'DISPONIVEL' || !podeOperarSaida"></p-tableCheckbox></td>
            <td class="col-codigo"><span class="cell-ellipsis" [pTooltip]="item.codigoRastreio" tooltipPosition="top">{{ item.codigoRastreio }}</span></td>
            <td class="col-pn"><strong class="cell-ellipsis" [pTooltip]="item.partNumber" tooltipPosition="top">{{ item.partNumber }}</strong></td>
            <td class="col-lote"><span class="cell-ellipsis">{{ item.loteCodigo || '-' }}</span></td>
            <td class="col-invoice"><span class="cell-ellipsis">{{ item.invoiceNumero || '-' }}</span></td>
            <td class="col-qtd">{{ item.quantidade }}</td>
            <td class="col-saldo">{{ getSaldoPreview(item) }}</td>
            <td class="col-status"><p-tag [value]="getStatusLabel(item.status) || '-'" [severity]="item.status === 'DISPONIVEL' ? 'success' : 'warning'"></p-tag></td>
            <td class="col-acao">
              <button pButton type="button" icon="pi pi-arrow-circle-right" class="p-button-sm" [disabled]="item.status !== 'DISPONIVEL' || !podeOperarSaida" (click)="abrirSaida(item)"></button>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr><td colspan="9" class="empty">{{ 'estoque.screens.saida.empty' | translate }}</td></tr>
        </ng-template>
      </p-table>
      </app-list-data-states>
      </div>

      <div class="batch-toolbar">
        <span class="batch-count">{{ 'estoque.screens.saida.batchSelected' | translate: { count: '' + itensSelecionados.length } }}</span>
        <button pButton type="button" styleClass="batch-action" [label]="'estoque.screens.saida.batchBtn' | translate" icon="pi pi-check-square" [disabled]="itensSelecionados.length === 0 || !podeOperarSaida" (click)="abrirSaidaLote()"></button>
      </div>

      <p-dialog styleClass="as-hero-dialog" [(visible)]="showSaidaDialog" [header]="'estoque.screens.saida.dialogConfirmTitle' | translate" [modal]="true" [style]="{width:'420px'}">
        <div class="form" *ngIf="itemSaida">
          <p class="dialog-item-ref"><strong>{{ itemSaida.codigoRastreio }}</strong> - {{ itemSaida.partNumber }}</p>
          <div class="single-grid">
            <div class="form-field" [class.form-field--reforco]="validacaoExtraAtiva">
              <label>{{
                (validacaoExtraAtiva ? 'estoque.screens.saida.osLabelRequired' : 'estoque.screens.saida.osLabel')
                  | translate
              }}</label>
              <p-autoComplete
                [(ngModel)]="osSelecionadaSingle"
                [suggestions]="osSugestoes"
                (completeMethod)="buscarOsSugestoes($event)"
                [field]="'idOs'"
                [dropdown]="true"
                [forceSelection]="false"
                (ngModelChange)="onOsSingleModelChange($event)"
                (onSelect)="onSelectOsSingle()"
                [placeholder]="'estoque.screens.saida.osPh' | translate">
                <ng-template let-os pTemplate="item">
                  {{ osLine(os) }}
                </ng-template>
              </p-autoComplete>
              <small class="field-hint field-hint--reforco" *ngIf="validacaoExtraAtiva">{{
                'estoque.screens.saida.osHintExtra' | translate
              }}</small>
            </div>
            <div class="form-field">
              <label>{{ 'estoque.screens.saida.qtdLabel' | translate }}</label>
              <p-inputNumber [(ngModel)]="quantidade" [min]="0.001" mode="decimal"
                [minFractionDigits]="0" [maxFractionDigits]="3" [useGrouping]="false" [showButtons]="true"
                styleClass="w-full"></p-inputNumber>
              <small class="field-hint">{{ 'estoque.screens.saida.hintSaldo' | translate: { qtd: '' + (itemSaida.quantidade || 0) } }}</small>
            </div>
          </div>
          <div class="form-field" [class.form-field--reforco]="validacaoExtraAtiva">
            <label>{{
              (validacaoExtraAtiva ? 'estoque.screens.saida.motivoLabelRequired' : 'estoque.screens.saida.motivoLabel')
                | translate
            }}</label>
            <input pInputText [(ngModel)]="motivo" />
            <small class="field-hint field-hint--reforco" *ngIf="validacaoExtraAtiva">{{
              'estoque.screens.saida.motivoHintExtra' | translate: { min: '' + motivoMinLength }
            }}</small>
          </div>
          <small class="field-tip">{{ 'estoque.screens.saida.tipAtalhos' | translate }}</small>
          <div class="actions">
            <button pButton [label]="'estoque.screens.saida.btnCancelar' | translate" class="p-button-text" (click)="showSaidaDialog=false"></button>
            <button pButton [label]="'estoque.screens.saida.btnConfirmarSaida' | translate" icon="pi pi-check" [loading]="saving" (click)="confirmarSaida()"></button>
          </div>
        </div>
      </p-dialog>

      <p-dialog styleClass="as-hero-dialog" [(visible)]="showSaidaLoteDialog" [header]="'estoque.screens.saida.dialogLoteTitle' | translate" [modal]="true" [style]="{width:'760px'}">
        <div class="form">
          <div class="batch-top-grid">
            <div class="form-field" [class.form-field--reforco]="validacaoExtraAtiva">
              <label>{{
                (validacaoExtraAtiva ? 'estoque.screens.saida.osLabelRequired' : 'estoque.screens.saida.osLabel')
                  | translate
              }}</label>
              <p-autoComplete
                [(ngModel)]="osSelecionadaLote"
                [suggestions]="osSugestoes"
                (completeMethod)="buscarOsSugestoes($event)"
                [field]="'idOs'"
                [dropdown]="true"
                [forceSelection]="false"
                (ngModelChange)="onOsLoteModelChange($event)"
                (onSelect)="onSelectOsLote()"
                [placeholder]="'estoque.screens.saida.osPh' | translate">
                <ng-template let-os pTemplate="item">
                  {{ osLine(os) }}
                </ng-template>
              </p-autoComplete>
              <small class="field-hint field-hint--reforco" *ngIf="validacaoExtraAtiva">{{
                'estoque.screens.saida.osHintExtra' | translate
              }}</small>
            </div>
            <div class="form-field" [class.form-field--reforco]="validacaoExtraAtiva">
              <label>{{
                (validacaoExtraAtiva ? 'estoque.screens.saida.motivoLabelRequired' : 'estoque.screens.saida.motivoLabel')
                  | translate
              }}</label>
              <input pInputText [(ngModel)]="loteMotivo" />
              <small class="field-hint field-hint--reforco" *ngIf="validacaoExtraAtiva">{{
                'estoque.screens.saida.motivoHintExtra' | translate: { min: '' + motivoMinLength }
              }}</small>
            </div>
          </div>
          <div class="batch-actions-grid">
            <div class="form-field">
              <label>{{ 'estoque.screens.saida.qtdPadraoLabel' | translate }}</label>
              <p-inputNumber [(ngModel)]="quantidadePadraoLote" [min]="0.001" mode="decimal"
                [minFractionDigits]="0" [maxFractionDigits]="3" [useGrouping]="false" [showButtons]="true"
                styleClass="w-full" [placeholder]="'estoque.screens.saida.qtdPadraoPh' | translate"></p-inputNumber>
            </div>
            <div class="apply-all">
              <small class="batch-hint">{{ 'estoque.screens.saida.acoesRapidas' | translate }}</small>
              <div class="batch-actions">
                <button pButton [label]="'estoque.screens.saida.aplicarTodos' | translate" icon="pi pi-copy" class="p-button-secondary p-button-sm"
                        [pTooltip]="'estoque.screens.saida.aplicarTodosTooltip' | translate"
                        tooltipPosition="top"
                        (click)="aplicarQuantidadePadraoParaTodos()"></button>
                <button pButton [label]="'estoque.screens.saida.zerarSaldos' | translate" icon="pi pi-check-square" class="p-button-warning p-button-sm"
                        [pTooltip]="'estoque.screens.saida.zerarSaldosTooltip' | translate"
                        tooltipPosition="top"
                        (click)="aplicarSaldoTotalParaTodos()"></button>
              </div>
            </div>
          </div>
          <p-table [value]="itensSelecionados" styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
              <tr>
                <th>{{ 'estoque.screens.saida.colCodigo' | translate }}</th>
                <th>{{ 'estoque.screens.saida.colPn' | translate }}</th>
                <th>{{ 'estoque.screens.saida.colSaldo' | translate }}</th>
                <th>{{ 'estoque.screens.saida.colSaida' | translate }}</th>
                <th>{{ 'estoque.screens.saida.colSaldoFinal' | translate }}</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-item>
              <tr>
                <td>{{ item.codigoRastreio }}</td>
                <td>{{ item.partNumber }}</td>
                <td>{{ item.quantidade }}</td>
                <td>
                  <p-inputNumber [(ngModel)]="quantidadesLote[item.id!]" [min]="0.001" mode="decimal"
                    [minFractionDigits]="0" [maxFractionDigits]="3" [useGrouping]="false" [showButtons]="true"
                    styleClass="w-full"></p-inputNumber>
                </td>
                <td>{{ getSaldoFinalLote(item) }}</td>
              </tr>
            </ng-template>
          </p-table>
          <div class="actions">
            <button pButton [label]="'estoque.screens.saida.btnCancelar' | translate" class="p-button-text" (click)="showSaidaLoteDialog=false"></button>
            <button pButton [label]="'estoque.screens.saida.btnConfirmarSaidas' | translate" icon="pi pi-check" [loading]="savingLote" (click)="confirmarSaidaLote()"></button>
          </div>
        </div>
      </p-dialog>
    </div>
  `,
})
export class SaidaEstoqueComponent implements OnInit {
  private estoqueService = inject(EstoqueService);
  private messageService = inject(MessageService);
  private i18n = inject(TranslationService);
  private authService = inject(AuthService);
  private osService = inject(OSService);
  private tenantFeatures = inject(TenantFeatureService);
  private readonly destroyRef = inject(DestroyRef);

  validacaoExtraAtiva = false;
  motivoMinLength = 10;

  readonly codigoSearch = createEstoqueSearch(this.destroyRef, term => {
    this.codigoBusca = term;
    if (this.modo === 'ITEM') {
      this.buscarPorCodigo();
    }
  }, 400);

  modo: ModoSaida = 'ITEM';
  modos: { labelKey: string; value: ModoSaida }[] = [
    { labelKey: 'estoque.screens.saida.modoItem', value: 'ITEM' },
    { labelKey: 'estoque.screens.saida.modoLote', value: 'LOTE' },
    { labelKey: 'estoque.screens.saida.modoInvoice', value: 'INVOICE' }
  ];

  codigoBusca = '';
  loteSelecionadoId: number | null = null;
  invoiceSelecionadaId: number | null = null;

  lotes: Lote[] = [];
  invoices: Invoice[] = [];
  itens: ItemEstoque[] = [];
  itensSelecionados: ItemEstoque[] = [];
  loading = false;
  podeOperarSaida = false;

  showSaidaDialog = false;
  itemSaida: ItemEstoque | null = null;
  osId: number | null = null;
  osSelecionadaSingle: OS | null = null;
  quantidade: number | null = null;
  motivo = '';
  saving = false;
  showSaidaLoteDialog = false;
  loteOsId: number | null = null;
  osSelecionadaLote: OS | null = null;
  loteMotivo = '';
  quantidadePadraoLote: number | null = null;
  quantidadesLote: Record<number, number> = {};
  savingLote = false;
  osSugestoes: OS[] = [];

  ngOnInit(): void {
    this.definirPermissao();
    this.carregarListas();
    this.carregarRegrasCustomizadas();
  }

  getStatusLabel(status?: string): string {
    if (!status) return '';
    return this.i18n.translateCatalog('estoque.itens.status', status, status);
  }

  private carregarRegrasCustomizadas(): void {
    this.tenantFeatures.refreshFromServer().subscribe({
      next: () => this.aplicarRegrasCustomizadas(),
      error: () => this.aplicarRegrasCustomizadas()
    });
  }

  private aplicarRegrasCustomizadas(): void {
    if (!this.tenantFeatures.isOn(TenantFeatureCodes.ESTOQUE_SAIDA_VALIDACAO_EXTRA)) {
      this.validacaoExtraAtiva = false;
      return;
    }
    this.estoqueService.getSaidaRegrasCustomizadas().subscribe({
      next: regras => {
        this.validacaoExtraAtiva = !!regras.validacaoExtra;
        this.motivoMinLength = regras.motivoMinLength > 0 ? regras.motivoMinLength : 10;
      },
      error: () => {
        this.validacaoExtraAtiva = true;
        this.motivoMinLength = 10;
      }
    });
  }

  private osAtendeValidacaoExtra(osId: number, lote = false): boolean {
    if (!Number.isFinite(osId) || osId <= 0) {
      const key = this.validacaoExtraAtiva
        ? 'estoque.screens.saida.toast.osRequiredExtra'
        : lote
          ? 'estoque.screens.saida.toast.osInvalidBatch'
          : 'estoque.screens.saida.toast.osInvalid';
      this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', key);
      return false;
    }
    return true;
  }

  private motivoAtendeValidacaoExtra(motivo: string | undefined | null): boolean {
    if (!this.validacaoExtraAtiva) {
      return true;
    }
    const min = this.motivoMinLength > 0 ? this.motivoMinLength : 10;
    if ((motivo ?? '').trim().length >= min) {
      return true;
    }
    this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'estoque.screens.saida.toast.motivoInvalid', {
      min: String(min)
    });
    return false;
  }

  onModoChange(): void {
    this.itens = [];
    this.itensSelecionados = [];
  }

  definirPermissao(): void {
    const user = this.authService.getCurrentUser();
    const role = (user?.role || '').toUpperCase();
    const perfilCodigo = (user?.perfil?.codigo || '').toUpperCase();
    this.podeOperarSaida = role.includes('ADMIN') || perfilCodigo.includes('ADMIN') || perfilCodigo.includes('ESTOQUE');
  }

  carregarListas(): void {
    this.estoqueService.listarLotes({ page: 0, size: 300 }).subscribe({
      next: (r) => this.lotes = r.content || [],
      error: () => this.lotes = []
    });
    this.estoqueService.listarInvoices({ page: 0, size: 300 }).subscribe({
      next: (r) => this.invoices = r.content || [],
      error: () => this.invoices = []
    });
  }

  buscarPorCodigo(): void {
    const codigo = this.codigoBusca.trim();
    if (!codigo) {
      this.itens = [];
      this.itensSelecionados = [];
      return;
    }
    this.loading = true;
    this.estoqueService.consultarPorCodigo(codigo).subscribe({
      next: (item) => { this.itens = item ? [item] : []; this.itensSelecionados = []; this.loading = false; },
      error: () => { this.itens = []; this.itensSelecionados = []; this.loading = false; this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'estoque.screens.saida.toast.itemNotFound'); }
    });
  }

  buscarPorLote(): void {
    if (!this.loteSelecionadoId) return;
    this.loading = true;
    this.estoqueService.listarItensEstoque({ page: 0, size: 200, loteId: this.loteSelecionadoId, status: 'DISPONIVEL' }).subscribe({
      next: (r) => { this.itens = r.content || []; this.itensSelecionados = []; this.loading = false; },
      error: () => { this.itens = []; this.itensSelecionados = []; this.loading = false; }
    });
  }

  buscarPorInvoice(): void {
    if (!this.invoiceSelecionadaId) return;
    this.loading = true;
    this.estoqueService.listarItensEstoque({ page: 0, size: 200, invoiceId: this.invoiceSelecionadaId, status: 'DISPONIVEL' }).subscribe({
      next: (r) => { this.itens = r.content || []; this.itensSelecionados = []; this.loading = false; },
      error: () => { this.itens = []; this.itensSelecionados = []; this.loading = false; }
    });
  }

  getSaldoPreview(item: ItemEstoque): string {
    const selecionado = this.itensSelecionados.some(i => i.id === item.id);
    if (!selecionado) return '-';
    const qtd = this.quantidadesLote[item.id || 0] ?? 0;
    const saldo = Number(item.quantidade ?? 0) - Number(qtd);
    return saldo.toFixed(3).replace(/\.?0+$/, '');
  }

  abrirSaida(item: ItemEstoque): void {
    this.itemSaida = item;
    this.osId = null;
    this.osSelecionadaSingle = null;
    this.quantidade = 1;
    this.motivo = this.i18n.translate('estoque.screens.saida.motivoDefault');
    this.showSaidaDialog = true;
  }

  confirmarSaida(): void {
    if (!this.podeOperarSaida) return;
    if (!this.itemSaida?.id) return;
    const osId = Number(this.osId);
    const quantidade = Number(this.quantidade);
    const saldo = Number(this.itemSaida.quantidade ?? 0);
    if (!this.osAtendeValidacaoExtra(osId)) {
      return;
    }
    if (!Number.isFinite(quantidade) || quantidade <= 0 || quantidade > saldo) {
      this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'estoque.screens.saida.toast.qtyInvalid');
      return;
    }
    if (!this.motivoAtendeValidacaoExtra(this.motivo)) {
      return;
    }
    this.saving = true;
    this.estoqueService.saidaEstoque({ itemId: this.itemSaida.id, osId, quantidade, motivo: this.motivo || undefined }).subscribe({
      next: () => {
        this.saving = false;
        this.showSaidaDialog = false;
        this.i18n.addToast(this.messageService, 'success', 'common.toast.success', 'estoque.screens.saida.toast.exitOk');
        if (this.modo === 'ITEM') this.buscarPorCodigo();
        if (this.modo === 'LOTE') this.buscarPorLote();
        if (this.modo === 'INVOICE') this.buscarPorInvoice();
      },
      error: (err) => {
        this.saving = false;
        const msg = this.i18n.translateApiError(err?.error, 'estoque.screens.saida.toast.registerFail');
        this.i18n.addToastLiteralDetail(this.messageService, 'error', 'common.toast.error', msg);
      }
    });
  }

  abrirSaidaLote(): void {
    if (this.itensSelecionados.length === 0) return;
    this.loteOsId = null;
    this.osSelecionadaLote = null;
    this.loteMotivo = this.i18n.translate('estoque.screens.saida.motivoDefault');
    this.quantidadePadraoLote = 1;
    this.quantidadesLote = {};
    for (const item of this.itensSelecionados) {
      this.quantidadesLote[item.id!] = 1;
    }
    this.showSaidaLoteDialog = true;
  }

  aplicarQuantidadePadraoParaTodos(): void {
    const qtdPadrao = Number(this.quantidadePadraoLote);
    if (!Number.isFinite(qtdPadrao) || qtdPadrao <= 0) {
      this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'estoque.screens.saida.toast.defaultQtyInvalid');
      return;
    }
    let excedeu = false;
    for (const item of this.itensSelecionados) {
      const saldo = Number(item.quantidade ?? 0);
      if (qtdPadrao > saldo) {
        this.quantidadesLote[item.id!] = saldo;
        excedeu = true;
      } else {
        this.quantidadesLote[item.id!] = qtdPadrao;
      }
    }
    if (excedeu) {
      this.i18n.addToast(this.messageService, 'info', 'estoque.screens.saida.toast.qtyCappedInfo', 'estoque.screens.saida.toast.qtyCappedDetail');
    }
  }

  aplicarSaldoTotalParaTodos(): void {
    for (const item of this.itensSelecionados) {
      const saldo = Number(item.quantidade ?? 0);
      this.quantidadesLote[item.id!] = saldo > 0 ? saldo : 0;
    }
    this.i18n.addToast(this.messageService, 'info', 'estoque.screens.saida.toast.fillTotalSummary', 'estoque.screens.saida.toast.fillTotalDetail');
  }

  getSaldoFinalLote(item: ItemEstoque): string {
    const saldo = Number(item.quantidade ?? 0);
    const saida = Number(this.quantidadesLote[item.id!] ?? 0);
    return (saldo - saida).toFixed(3).replace(/\.?0+$/, '');
  }

  confirmarSaidaLote(): void {
    if (!this.podeOperarSaida) return;
    const osId = Number(this.loteOsId);
    if (!this.osAtendeValidacaoExtra(osId, true)) {
      return;
    }
    if (!this.motivoAtendeValidacaoExtra(this.loteMotivo)) {
      return;
    }
    const requests = [];
    const itensProcessados = [...this.itensSelecionados];
    for (const item of this.itensSelecionados) {
      const quantidade = Number(this.quantidadesLote[item.id!] ?? 0);
      const saldo = Number(item.quantidade ?? 0);
      if (!Number.isFinite(quantidade) || quantidade <= 0 || quantidade > saldo) {
        this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'estoque.screens.saida.toast.qtyInvalidRastreio', {
          codigo: String(item.codigoRastreio ?? '')
        });
        return;
      }
      requests.push(
        this.estoqueService.saidaEstoque({
          itemId: item.id!,
          osId,
          quantidade,
          motivo: this.loteMotivo || undefined
        }).pipe(
          map(() => ({ ok: true, item, error: '' })),
          catchError((err) => of({
            ok: false,
            item,
            error: this.i18n.translateApiError(err?.error, 'estoque.screens.saida.toast.registerFail')
          }))
        )
      );
    }
    this.savingLote = true;
    forkJoin(requests).subscribe({
      next: (resultados) => {
        this.savingLote = false;
        const sucesso = resultados.filter(r => r.ok);
        const falha = resultados.filter(r => !r.ok);

        if (sucesso.length > 0) {
          if (falha.length > 0) {
            this.i18n.addToast(this.messageService, 'warn', 'estoque.screens.saida.toast.batchPartial', 'estoque.screens.saida.toast.batchPartialDetail', {
              ok: String(sucesso.length),
              fail: String(falha.length)
            });
          } else {
            this.i18n.addToast(this.messageService, 'success', 'common.toast.success', 'estoque.screens.saida.toast.batchAllSuccess', {
              count: String(sucesso.length)
            });
          }
        }

        if (falha.length > 0) {
          const detalhesFalha = falha
            .map(f => `${f.item.codigoRastreio}: ${f.error}`)
            .join(' | ');
          this.i18n.addToastLiteralDetail(this.messageService, 'error', 'estoque.screens.saida.toast.itemsFailedSummary', detalhesFalha);
        } else {
          this.showSaidaLoteDialog = false;
        }

        // Remove da seleção apenas os que saíram com sucesso
        const idsComSucesso = new Set(sucesso.map(s => s.item.id));
        this.itensSelecionados = itensProcessados.filter(i => !idsComSucesso.has(i.id));

        if (this.modo === 'ITEM') this.buscarPorCodigo();
        if (this.modo === 'LOTE') this.buscarPorLote();
        if (this.modo === 'INVOICE') this.buscarPorInvoice();
      },
      error: (err) => {
        this.savingLote = false;
        const msg = this.i18n.translateApiError(err?.error, 'estoque.screens.saida.toast.batchFail');
        this.i18n.addToastLiteralDetail(this.messageService, 'error', 'common.toast.error', msg);
      }
    });
  }

  buscarOsSugestoes(event: any): void {
    const query = (event?.query || '').trim();
    this.osService.list({ page: 0, size: 12, q: query }).subscribe({
      next: (res) => this.osSugestoes = res.items || [],
      error: () => this.osSugestoes = []
    });
  }

  onSelectOsSingle(): void {
    this.osId = this.osSelecionadaSingle?.idOs ?? null;
  }

  onSelectOsLote(): void {
    this.loteOsId = this.osSelecionadaLote?.idOs ?? null;
  }

  onOsSingleModelChange(value: OS | string | null): void {
    if (!value) {
      this.osId = null;
      return;
    }
    if (typeof value === 'string') {
      const parsed = Number(String(value).replace(/[^\d]/g, ''));
      this.osId = Number.isFinite(parsed) && parsed > 0 ? parsed : null;
      return;
    }
    this.osId = value.idOs ?? null;
  }

  onOsLoteModelChange(value: OS | string | null): void {
    if (!value) {
      this.loteOsId = null;
      return;
    }
    if (typeof value === 'string') {
      const parsed = Number(String(value).replace(/[^\d]/g, ''));
      this.loteOsId = Number.isFinite(parsed) && parsed > 0 ? parsed : null;
      return;
    }
    this.loteOsId = value.idOs ?? null;
  }

  osLine(os: OS): string {
    const cliente = (os.clienteNome || '').trim()
      ? (os.clienteNome as string)
      : this.i18n.translate('estoque.screens.saida.semCliente');
    return this.i18n.translate('estoque.screens.saida.osTemplate', {
      id: String(os.idOs ?? ''),
      cliente
    });
  }
}

