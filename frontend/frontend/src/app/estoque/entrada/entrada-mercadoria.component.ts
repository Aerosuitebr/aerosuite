import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { StepsModule } from 'primeng/steps';
import { MessageService, MenuItem } from 'primeng/api';
import { EstoqueService, Fornecedor, EntradaEstoque, ItemEstoque } from '../../core/estoque.service';
import { ProductService, Product } from '../../core/product.service';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { firstValueFrom } from 'rxjs';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
import { PageHeroComponent } from '../../shared/page-hero/page-hero.component';
import { TranslationService } from '../../core/translation.service';
import { InvoiceParaDropdown, mapInvoicesParaDropdown } from '../shared/invoice-dropdown.util';
import { InvoiceItemParaDropdown, mapItensInvoiceParaDropdown } from '../shared/invoice-item-dropdown.util';

@Component({
  selector: 'app-entrada-mercadoria',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DropdownModule,
    CalendarModule,
    InputTextareaModule,
    CardModule,
    DividerModule,
    ToastModule,
    DialogModule,
    CheckboxModule,
    StepsModule,
    AutoCompleteModule,
    RouterLink,
    TranslatePipe,
    PageHeroComponent
  ],
  styleUrls: ['./entrada-mercadoria.component.scss'],
  template: `
    <p-toast></p-toast>
    
    <div class="entrada-shell">
      <app-page-hero
        variant="navy"
        titleKey="estoque.screens.entrada.title"
        subtitleKey="estoque.screens.entrada.subtitle"
        titleIcon="pi-sign-in" />

      <div class="steps-bar">
        <p-steps
          styleClass="entrada-steps"
          [model]="stepsItems"
          [activeIndex]="activeStep"
          [readonly]="false"
          (activeIndexChange)="onStepChange($event)"></p-steps>
      </div>

      <main class="wizard-main">
      <div class="wizard-body">
        <form [formGroup]="entradaForm">
          
          <!-- Step 1: Origem -->
          <div class="step-content" *ngIf="activeStep === 0">
            <div class="step-card">
              <div class="card-header">
                <i class="pi pi-truck card-header__icon"></i>
                <h2>{{ 'estoque.screens.entrada.card.origem.title' | translate }}</h2>
              </div>
              
              <div class="form-grid">
                <div class="form-field">
                  <label for="fornecedor">{{ 'estoque.screens.entrada.label.fornecedor' | translate }}</label>
                  <p-dropdown 
                    id="fornecedor"
                    formControlName="fornecedorId"
                    [options]="fornecedores"
                    optionLabel="razaoSocial"
                    optionValue="id"
                    [placeholder]="'estoque.screens.entrada.ph.fornecedor' | translate"
                    [filter]="true"
                    filterBy="razaoSocial,codigo"
                    [showClear]="true"
                    styleClass="w-full">
                    <ng-template pTemplate="item" let-item>
                      <div class="fornecedor-option">
                        <strong>{{ item.codigo }}</strong> - {{ item.razaoSocial }}
                        <small>{{ item.paisOrigem }}</small>
                      </div>
                    </ng-template>
                  </p-dropdown>
                  <small class="help-text">
                    <a (click)="showNovoFornecedorDialog = true">{{ 'estoque.screens.entrada.help.novoFornecedor' | translate }}</a>
                  </small>
                </div>
                
                <div class="form-field">
                  <label for="invoice">{{ 'estoque.screens.entrada.label.invoiceOpt' | translate }}</label>
                  <p-dropdown 
                    id="invoice"
                    formControlName="invoiceId"
                    [options]="invoices"
                    optionLabel="rotuloSelecao"
                    optionValue="id"
                    [placeholder]="'estoque.screens.entrada.ph.invoice' | translate"
                    [filter]="true"
                    filterBy="rotuloSelecao,numeroInvoice"
                    [showClear]="true"
                    (onChange)="onInvoiceDropdownChange()"
                    styleClass="w-full">
                  </p-dropdown>
                  <small class="help-text">
                    <a routerLink="/estoque/invoices">{{ 'estoque.screens.entrada.help.novaInvoice' | translate }}</a>
                  </small>
                </div>
              </div>
              
              <div class="step-actions">
                <span></span>
                <button pButton [label]="'estoque.screens.entrada.btn.next' | translate" icon="pi pi-arrow-right" iconPos="right"
                        (click)="proximoStep()"
                        [disabled]="!entradaForm.get('fornecedorId')?.value" styleClass="step-nav-btn">
                </button>
              </div>
            </div>
          </div>

          <!-- Step 2: Produto -->
          <div class="step-content" *ngIf="activeStep === 1">
            <div class="step-card">
              <div class="card-header">
                <i class="pi pi-box card-header__icon"></i>
                <h2>{{ 'estoque.screens.entrada.card.produto.title' | translate }}</h2>
              </div>
              
              <div class="form-grid">
                <div class="form-field full-width" *ngIf="entradaForm.get('invoiceId')?.value">
                  <label for="invoiceLinha">{{ 'estoque.screens.entrada.label.invoiceLinha' | translate }}</label>
                  <p-dropdown
                    id="invoiceLinha"
                    formControlName="invoiceItemId"
                    [options]="invoiceLinhas"
                    optionLabel="rotuloSelecao"
                    optionValue="id"
                    [placeholder]="'estoque.screens.entrada.ph.invoiceLinha' | translate"
                    [filter]="true"
                    filterBy="rotuloSelecao,partNumber,descricao"
                    [showClear]="true"
                    [loading]="carregandoLinhasInvoice"
                    [disabled]="carregandoLinhasInvoice"
                    (onChange)="aplicarLinhaInvoice()"
                    styleClass="w-full">
                  </p-dropdown>
                  <small class="help-text">{{ 'estoque.screens.entrada.help.invoiceLinha' | translate }}</small>
                  <small class="help-text help-text--muted" *ngIf="!carregandoLinhasInvoice && invoiceLinhas.length === 0">
                    {{ 'estoque.screens.entrada.help.invoiceLinhaEmpty' | translate }}
                  </small>
                </div>
                <div class="form-field full-width produto-cadastro-field">
                  <label>{{ 'estoque.screens.entrada.label.buscaCadastro' | translate }}</label>
                  <p-autoComplete [(ngModel)]="produtoCadastroBusca" [ngModelOptions]="{standalone: true}"
                    [suggestions]="produtosSugeridos"
                    (completeMethod)="buscarProdutosCadastro($event)"
                    (onSelect)="aplicarProdutoCadastro($event)"
                    (onClear)="limparProdutoCadastro()"
                    [placeholder]="'estoque.screens.entrada.ph.buscaCadastro' | translate"
                    [forceSelection]="false"
                    [showEmptyMessage]="true"
                    [emptyMessage]="'estoque.screens.entrada.autoEmpty' | translate"
                    [minLength]="1"
                    [dropdown]="true"
                    styleClass="w-full">
                    <ng-template let-p pTemplate="item">
                      <div class="produto-sugestao">
                        <strong>{{ p.productpn || p.name }}</strong>
                        <span>{{ p.name }}</span>
                        <small>{{ p.description }}</small>
                        <small *ngIf="p.price">USD {{ p.price | number:'1.2-2' }}</small>
                      </div>
                    </ng-template>
                  </p-autoComplete>
                  <small class="help-text">{{ 'estoque.screens.entrada.help.buscaCadastro' | translate }}</small>
                </div>
                <div class="form-field">
                  <label for="partNumber">{{ 'estoque.screens.entrada.label.partNumber' | translate }}</label>
                  <input pInputText id="partNumber" formControlName="partNumber"
                         [placeholder]="'estoque.screens.entrada.ph.partNumber' | translate">
                </div>
                
                <div class="form-field">
                  <label for="serialNumber">{{ 'estoque.screens.entrada.label.serialNumber' | translate }}</label>
                  <input pInputText id="serialNumber" formControlName="serialNumber"
                         [placeholder]="'estoque.screens.entrada.ph.serialNumber' | translate">
                </div>
                
                <div class="form-field full-width">
                  <label for="descricao">{{ 'estoque.screens.entrada.label.descricao' | translate }}</label>
                  <input pInputText id="descricao" formControlName="descricao"
                         [placeholder]="'estoque.screens.entrada.ph.descricao' | translate">
                </div>
                
                <div class="form-field">
                  <label for="quantidade">{{ 'estoque.screens.entrada.label.quantidade' | translate }}</label>
                  <p-inputNumber id="quantidade" formControlName="quantidade"
                                 [min]="0.001" [showButtons]="true" [useGrouping]="false"
                                 mode="decimal" [minFractionDigits]="0" [maxFractionDigits]="3">
                  </p-inputNumber>
                </div>
                
                <div class="form-field">
                  <label for="unidade">{{ 'estoque.screens.entrada.label.unidade' | translate }}</label>
                  <p-dropdown id="unidade" formControlName="unidade"
                              [options]="unidadesOptions" optionLabel="label" optionValue="value"
                              [placeholder]="'estoque.screens.entrada.ph.select' | translate" styleClass="w-full">
                  </p-dropdown>
                </div>
                
                <div class="form-field">
                  <label for="valorUsd">{{ 'estoque.screens.entrada.label.usd' | translate }}</label>
                  <p-inputNumber id="valorUsd" formControlName="valorUnitarioUsd"
                                 mode="currency" currency="USD" locale="en-US">
                  </p-inputNumber>
                </div>
                
                <div class="form-field">
                  <label for="valorBrl">{{ 'estoque.screens.entrada.label.brl' | translate }}</label>
                  <p-inputNumber id="valorBrl" formControlName="valorUnitarioBrl"
                                 mode="currency" currency="BRL" locale="pt-BR">
                  </p-inputNumber>
                </div>
              </div>
              
              <div class="step-actions">
                <button pButton [label]="'estoque.screens.entrada.btn.back' | translate" icon="pi pi-arrow-left" class="p-button-outlined"
                        (click)="voltarStep()" styleClass="step-nav-btn">
                </button>
                <button pButton [label]="'estoque.screens.entrada.btn.next' | translate" icon="pi pi-arrow-right" iconPos="right"
                        (click)="proximoStep()"
                        [disabled]="!entradaForm.get('partNumber')?.value" styleClass="step-nav-btn">
                </button>
              </div>
            </div>
          </div>

          <!-- Step 3: Localização e Certificação -->
          <div class="step-content" *ngIf="activeStep === 2">
            <div class="step-card">
              <div class="card-header">
                <i class="pi pi-map-marker card-header__icon"></i>
                <h2>{{ 'estoque.screens.entrada.card.loc.title' | translate }}</h2>
              </div>
              
              <div class="form-grid">
                <div class="form-field">
                  <label for="localizacao">{{ 'estoque.screens.entrada.label.loc' | translate }}</label>
                  <input pInputText id="localizacao" formControlName="localizacao"
                         [placeholder]="'estoque.screens.entrada.ph.loc' | translate">
                </div>
                
                <div class="form-field">
                  <label for="prateleira">{{ 'estoque.screens.entrada.label.prateleira' | translate }}</label>
                  <input pInputText id="prateleira" formControlName="prateleira"
                         [placeholder]="'estoque.screens.entrada.ph.prateleira' | translate">
                </div>
                
                <div class="form-field">
                  <label for="gaveta">{{ 'estoque.screens.entrada.label.gaveta' | translate }}</label>
                  <input pInputText id="gaveta" formControlName="gaveta"
                         [placeholder]="'estoque.screens.entrada.ph.gaveta' | translate">
                </div>
                
                <div class="form-field">
                  <label for="certTipo">{{ 'estoque.cert.tipo' | translate }}</label>
                  <p-dropdown id="certTipo" formControlName="certTipo" [options]="certTipoOptions"
                              optionLabel="label" optionValue="value" [showClear]="true" styleClass="w-full">
                  </p-dropdown>
                </div>
                <div class="form-field">
                  <label for="certNumero">{{ 'estoque.cert.numero' | translate }}</label>
                  <input pInputText id="certNumero" formControlName="certNumero"
                         [placeholder]="'estoque.screens.entrada.ph.certificado' | translate">
                </div>
                <div class="form-field">
                  <label for="certEmissor">{{ 'estoque.cert.emissor' | translate }}</label>
                  <input pInputText id="certEmissor" formControlName="certEmissor">
                </div>
                <div class="form-field">
                  <label for="certDataEmissao">{{ 'estoque.cert.dataEmissao' | translate }}</label>
                  <p-calendar id="certDataEmissao" formControlName="certDataEmissao"
                              dateFormat="dd/mm/yy" [showIcon]="true" styleClass="w-full">
                  </p-calendar>
                </div>
                <div class="form-field">
                  <label for="certOrgao">{{ 'estoque.cert.orgao' | translate }}</label>
                  <input pInputText id="certOrgao" formControlName="certOrgaoAprovacao">
                </div>
                <div class="form-field full-width">
                  <label for="certAnexo">{{ 'estoque.cert.anexo' | translate }}</label>
                  <input id="certAnexo" type="file" accept=".pdf,image/jpeg,image/png"
                         (change)="onCertAnexoSelected($event)">
                  <small class="field-hint">{{ 'estoque.cert.anexoHint' | translate }}</small>
                </div>
                <div class="form-field">
                  <label for="dataFabricacao">{{ 'estoque.screens.entrada.label.dataFabricacao' | translate }}</label>
                  <p-calendar id="dataFabricacao" formControlName="dataFabricacao"
                              dateFormat="dd/mm/yy" [showIcon]="true"
                              styleClass="w-full">
                  </p-calendar>
                </div>
                
                <div class="form-field">
                  <label for="dataValidade">{{ 'estoque.screens.entrada.label.dataValidade' | translate }}</label>
                  <p-calendar id="dataValidade" formControlName="dataValidade"
                              dateFormat="dd/mm/yy" [showIcon]="true"
                              styleClass="w-full">
                  </p-calendar>
                </div>
                
                <div class="form-field">
                  <label for="shelfLife">{{ 'estoque.screens.entrada.label.shelfLife' | translate }}</label>
                  <p-inputNumber id="shelfLife" formControlName="shelfLifeMeses"
                                 [min]="0" [showButtons]="true">
                  </p-inputNumber>
                </div>
                
                <div class="form-field full-width">
                  <label for="observacoes">{{ 'estoque.screens.entrada.label.observacoes' | translate }}</label>
                  <textarea pInputTextarea id="observacoes" formControlName="observacoes"
                            [rows]="3" [placeholder]="'estoque.screens.entrada.ph.obs' | translate">
                  </textarea>
                </div>
                
                <div class="form-field full-width">
                  <p-checkbox formControlName="criarLote" [binary]="true"
                              [label]="'estoque.screens.entrada.checkbox.criarLote' | translate">
                  </p-checkbox>
                </div>
              </div>
              
              <div class="step-actions">
                <button pButton [label]="'estoque.screens.entrada.btn.back' | translate" icon="pi pi-arrow-left" class="p-button-outlined"
                        (click)="voltarStep()" styleClass="step-nav-btn">
                </button>
                <button pButton [label]="'estoque.screens.entrada.btn.registrar' | translate" icon="pi pi-check" 
                        class="p-button-success"
                        (click)="registrarEntrada()"
                        [loading]="salvando" styleClass="step-nav-btn">
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
      </main>

      <!-- Dialog de Sucesso -->
      <p-dialog styleClass="as-hero-dialog sucesso-dialog" [(visible)]="showSucessoDialog" 
                [modal]="true" 
                [closable]="false"
                [style]="{width: '500px'}"
               >
        <div class="sucesso-content" *ngIf="itemCriado">
          <div class="sucesso-icon">
            <i class="pi pi-check-circle"></i>
          </div>
          <h2>{{ 'estoque.screens.entrada.sucesso.title' | translate }}</h2>
          <p>{{ 'estoque.screens.entrada.sucesso.lead' | translate }}</p>
          
          <div class="item-resumo">
            <div class="resumo-row">
              <label>{{ 'estoque.screens.entrada.sucesso.codigo' | translate }}</label>
              <span class="codigo">{{ itemCriado.codigoRastreio }}</span>
            </div>
            <div class="resumo-row">
              <label>{{ 'estoque.screens.entrada.sucesso.pnLabel' | translate }}</label>
              <span>{{ itemCriado.partNumber }}</span>
            </div>
            <div class="resumo-row" *ngIf="itemCriado.loteCodigo">
              <label>{{ 'estoque.screens.entrada.sucesso.loteLabel' | translate }}</label>
              <span>{{ itemCriado.loteCodigo }}</span>
            </div>
          </div>
          
          <div class="qrcode-preview">
            <i class="pi pi-spin pi-spinner" *ngIf="qrCodePreviewLoading" aria-hidden="true"></i>
            <img *ngIf="qrCodePreviewUrl && !qrCodePreviewLoading" [src]="qrCodePreviewUrl" [attr.alt]="'estoque.screens.entrada.sucesso.qr' | translate">
            <p *ngIf="!qrCodePreviewLoading && !qrCodePreviewUrl && itemCriado.id">{{ 'estoque.etiqueta.print.qrLoadFailed' | translate }}</p>
            <p *ngIf="qrCodePreviewUrl || qrCodePreviewLoading">{{ 'estoque.screens.entrada.sucesso.qr' | translate }}</p>
          </div>
          
          <div class="sucesso-actions">
            <button pButton [label]="'estoque.screens.entrada.btn.imprimir' | translate" icon="pi pi-print"
                    class="p-button-outlined"
                    (click)="imprimirEtiqueta('browser')">
            </button>
            <button pButton [label]="'estoque.etiqueta.print.menuThermal' | translate" icon="pi pi-print"
                    class="p-button-text"
                    (click)="imprimirEtiqueta('thermal')">
            </button>
            <button pButton [label]="'estoque.screens.entrada.btn.nova' | translate" icon="pi pi-plus"
                    (click)="novaEntrada()">
            </button>
          </div>
        </div>
      </p-dialog>

      <!-- Dialog Novo Fornecedor -->
      <p-dialog styleClass="as-hero-dialog fornecedor-dialog" [(visible)]="showNovoFornecedorDialog"
                [header]="'estoque.screens.entrada.dialogFornecedor.title' | translate"
                [modal]="true"
                [style]="{width: '700px'}"
                [contentStyle]="{'overflow': 'visible'}"
               >
        <div class="fornecedor-form">
          <div class="form-section">
            <h4><i class="pi pi-building"></i> {{ 'estoque.screens.entrada.forn.company' | translate }}</h4>
            <div class="form-grid">
              <div class="form-field">
                <label>{{ 'estoque.screens.entrada.forn.codigo' | translate }}</label>
                <input pInputText [(ngModel)]="novoFornecedor.codigo" [placeholder]="'estoque.screens.entrada.forn.codigo.ph' | translate">
                <small class="hint">{{ 'estoque.screens.entrada.forn.codigo.hint' | translate }}</small>
              </div>
              <div class="form-field">
                <label>{{ 'estoque.screens.entrada.forn.razao' | translate }}</label>
                <input pInputText [(ngModel)]="novoFornecedor.razaoSocial" [placeholder]="'estoque.screens.entrada.forn.razao.ph' | translate">
              </div>
              <div class="form-field">
                <label>{{ 'estoque.screens.entrada.forn.fantasia' | translate }}</label>
                <input pInputText [(ngModel)]="novoFornecedor.nomeFantasia" [placeholder]="'estoque.screens.entrada.forn.fantasia.ph' | translate">
              </div>
              <div class="form-field">
                <label>{{ 'estoque.screens.entrada.forn.pais' | translate }}</label>
                <p-dropdown [(ngModel)]="novoFornecedor.paisOrigem" 
                            [options]="paisesOptions"
                            [placeholder]="'estoque.screens.entrada.forn.pais.ph' | translate"
                            [appendTo]="'body'"
                            styleClass="w-full">
                </p-dropdown>
              </div>
            </div>
          </div>

          <div class="form-section">
            <h4><i class="pi pi-map-marker"></i> {{ 'estoque.screens.entrada.forn.address.title' | translate }}</h4>
            <div class="form-grid">
              <div class="form-field full-width">
                <label>{{ 'estoque.screens.entrada.forn.endereco' | translate }}</label>
                <input pInputText [(ngModel)]="novoFornecedor.endereco" [placeholder]="'estoque.screens.entrada.forn.endereco.ph' | translate">
              </div>
              <div class="form-field small">
                <label>{{ 'estoque.screens.entrada.forn.numero' | translate }}</label>
                <input pInputText [(ngModel)]="novoFornecedor.numero" [placeholder]="'estoque.screens.entrada.forn.numero.ph' | translate">
              </div>
              <div class="form-field">
                <label>{{ 'estoque.screens.entrada.forn.complemento' | translate }}</label>
                <input pInputText [(ngModel)]="novoFornecedor.complemento" [placeholder]="'estoque.screens.entrada.forn.complemento.ph' | translate">
              </div>
              <div class="form-field">
                <label>{{ 'estoque.screens.entrada.forn.cidade' | translate }}</label>
                <input pInputText [(ngModel)]="novoFornecedor.cidade" [placeholder]="'estoque.screens.entrada.forn.cidade' | translate">
              </div>
              <div class="form-field">
                <label>{{ 'estoque.screens.entrada.forn.estado' | translate }}</label>
                <input pInputText [(ngModel)]="novoFornecedor.estado" [placeholder]="'estoque.screens.entrada.forn.estado' | translate">
              </div>
              <div class="form-field">
                <label>{{ 'estoque.screens.entrada.forn.cep' | translate }}</label>
                <input pInputText [(ngModel)]="novoFornecedor.cep" [placeholder]="'comercial.proposta.cliente.phCep' | translate">
              </div>
            </div>
          </div>

          <div class="form-section">
            <h4><i class="pi pi-phone"></i> {{ 'estoque.screens.entrada.forn.contact.title' | translate }}</h4>
            <div class="form-grid">
              <div class="form-field">
                <label>{{ 'estoque.screens.entrada.forn.tel' | translate }}</label>
                <input pInputText [(ngModel)]="novoFornecedor.telefone" [placeholder]="'estoque.screens.entrada.forn.telefoneIntl.ph' | translate">
              </div>
              <div class="form-field">
                <label>{{ 'estoque.screens.entrada.forn.email' | translate }}</label>
                <input pInputText [(ngModel)]="novoFornecedor.email" [placeholder]="'comercial.proposta.cliente.phEmail' | translate" type="email">
              </div>
              <div class="form-field">
                <label>{{ 'estoque.screens.entrada.forn.site' | translate }}</label>
                <input pInputText [(ngModel)]="novoFornecedor.website" [placeholder]="'estoque.screens.entrada.forn.website.ph' | translate">
              </div>
            </div>
          </div>

          <div class="form-section">
            <h4><i class="pi pi-user"></i> {{ 'estoque.screens.entrada.forn.person.title' | translate }}</h4>
            <div class="form-grid">
              <div class="form-field">
                <label>{{ 'estoque.screens.entrada.forn.contatoNome' | translate }}</label>
                <input pInputText [(ngModel)]="novoFornecedor.contatoNome" [placeholder]="'estoque.screens.entrada.forn.contatoNome.ph' | translate">
              </div>
              <div class="form-field">
                <label>{{ 'estoque.screens.entrada.forn.contatoTel' | translate }}</label>
                <input pInputText [(ngModel)]="novoFornecedor.contatoTelefone" [placeholder]="'estoque.screens.entrada.forn.contatoTel.ph' | translate">
              </div>
              <div class="form-field">
                <label>{{ 'estoque.screens.entrada.forn.contatoEmail' | translate }}</label>
                <input pInputText [(ngModel)]="novoFornecedor.contatoEmail" [placeholder]="'comercial.proposta.cliente.phEmail' | translate" type="email">
              </div>
            </div>
          </div>

          <div class="form-section">
            <h4><i class="pi pi-comment"></i> {{ 'estoque.screens.entrada.forn.obs.title' | translate }}</h4>
            <div class="form-grid">
              <div class="form-field full-width">
                <textarea pInputTextarea [(ngModel)]="novoFornecedor.observacoes" 
                          [rows]="3" [placeholder]="'estoque.screens.entrada.forn.obs.ph' | translate">
                </textarea>
              </div>
            </div>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <div class="dialog-footer">
            <button pButton [label]="'estoque.screens.entrada.btn.cancelar' | translate" class="p-button-text" (click)="cancelarFornecedor()"></button>
            <button pButton [label]="'estoque.screens.entrada.btn.salvarFornecedor' | translate" icon="pi pi-check" 
                    (click)="salvarFornecedor()" 
                    [loading]="salvandoFornecedor"
                    [disabled]="!novoFornecedor.razaoSocial || !novoFornecedor.paisOrigem">
            </button>
          </div>
        </ng-template>
      </p-dialog>
    </div>
  `,
})
export class EntradaMercadoriaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private estoqueService = inject(EstoqueService);
  private productService = inject(ProductService);
  private messageService = inject(MessageService);
  private etiquetaPrint = inject(EtiquetaPrintService);
  private i18n = inject(TranslationService);
  private branding = inject(BrandingService);
  private auth = inject(AuthService);
  private qrOrigin = inject(EstoqueQrOriginService);
  private route = inject(ActivatedRoute);

  entradaForm!: FormGroup;
  activeStep = 0;
  salvando = false;
  
  fornecedores: Fornecedor[] = [];
  invoices: InvoiceParaDropdown[] = [];
  invoiceLinhas: InvoiceItemParaDropdown[] = [];
  invoiceMoeda = 'USD';
  carregandoLinhasInvoice = false;
  
  produtoCadastroBusca = '';
  produtosSugeridos: Product[] = [];
  produtoSelecionadoCadastro: Product | null = null;
  
  itemCriado: ItemEstoque | null = null;
  qrCodePreviewUrl: string | null = null;
  qrCodePreviewLoading = false;
  readonly appLogoDataUri = getDefaultAppLogoUrlAbsolute();
  showSucessoDialog = false;
  
  showNovoFornecedorDialog = false;
  novoFornecedor: Partial<Fornecedor> = this.initNovoFornecedor();
  salvandoFornecedor = false;
  certAnexoFile: File | null = null;
  readonly certTipoOptions = [
    { value: 'FAA_8130_3', labelKey: 'estoque.cert.tipo.FAA_8130_3' },
    { value: 'EASA_FORM1', labelKey: 'estoque.cert.tipo.EASA_FORM1' },
    { value: 'ANAC', labelKey: 'estoque.cert.tipo.ANAC' },
    { value: 'DUAL_RELEASE', labelKey: 'estoque.cert.tipo.DUAL_RELEASE' },
    { value: 'OUTRO', labelKey: 'estoque.cert.tipo.OUTRO' }
  ].map(o => ({ value: o.value, label: '' }));

  private initNovoFornecedor(): Partial<Fornecedor> {
    return {
      codigo: '',
      razaoSocial: '',
      nomeFantasia: '',
      paisOrigem: 'Estados Unidos',
      endereco: '',
      numero: '',
      complemento: '',
      cidade: '',
      estado: '',
      cep: '',
      telefone: '',
      email: '',
      website: '',
      contatoNome: '',
      contatoTelefone: '',
      contatoEmail: '',
      observacoes: ''
    };
  }

  get stepsItems(): MenuItem[] {
    return [
      { label: this.i18n.translate('estoque.screens.entrada.step.origem') },
      { label: this.i18n.translate('estoque.screens.entrada.step.produto') },
      { label: this.i18n.translate('estoque.screens.entrada.step.local') }
    ];
  }

  get unidadesOptions(): { label: string; value: string }[] {
    const codes = ['UN', 'PC', 'KT', 'M', 'L', 'KG'] as const;
    return codes.map((code) => ({
      value: code,
      label: this.i18n.translate(`estoque.screens.entrada.unit.${code}`)
    }));
  }

  private readonly paisSlugByValor: Record<string, string> = {
    'Estados Unidos': 'estados_unidos',
    Alemanha: 'alemanha',
    'Reino Unido': 'reino_unido',
    França: 'franca',
    Canadá: 'canada',
    Brasil: 'brasil',
    China: 'china',
    Japão: 'japao',
    Outro: 'outro'
  };

  get paisesOptions(): { label: string; value: string }[] {
    return Object.entries(this.paisSlugByValor).map(([value, slug]) => ({
      value,
      label: this.i18n.translate(`estoque.screens.entrada.pais.${slug}`)
    }));
  }

  ngOnInit() {
    this.certTipoOptions.forEach(o => {
      o.label = this.i18n.translate(`estoque.cert.tipo.${o.value}`);
    });
    this.initForm();
    this.entradaForm.get('invoiceId')?.valueChanges.subscribe(id => this.onInvoiceIdAlterado(id));
    this.carregarDados();
    this.route.queryParams.subscribe(params => {
      const invoiceId = params['invoiceId'] ? Number(params['invoiceId']) : null;
      const fornecedorId = params['fornecedorId'] ? Number(params['fornecedorId']) : null;
      if (!invoiceId && !fornecedorId) return;
      this.entradaForm.patchValue({
        invoiceId: invoiceId && !Number.isNaN(invoiceId) ? invoiceId : null,
        fornecedorId: fornecedorId && !Number.isNaN(fornecedorId) ? fornecedorId : null
      });
      this.validarInvoiceSelecionada();
    });
  }

  initForm() {
    this.entradaForm = this.fb.group({
      // Step 1 - Origem
      fornecedorId: [null, Validators.required],
      invoiceId: [null],
      invoiceItemId: [null],
      
      // Step 2 - Produto
      partNumber: ['', Validators.required],
      serialNumber: [''],
      descricao: [''],
      quantidade: [1, [Validators.required, Validators.min(0.001)]],
      unidade: ['UN'],
      valorUnitarioUsd: [null],
      valorUnitarioBrl: [null],
      
      // Step 3 - Localização
      localizacao: [''],
      prateleira: [''],
      gaveta: [''],
      certTipo: [null],
      certNumero: [''],
      certEmissor: [''],
      certDataEmissao: [null],
      certOrgaoAprovacao: [''],
      dataFabricacao: [null],
      dataValidade: [null],
      shelfLifeMeses: [null],
      observacoes: [''],
      criarLote: [true]
    });
  }

  carregarDados() {
    // Carregar fornecedores
    this.estoqueService.listarFornecedores({ size: 100 }).subscribe({
      next: (result) => {
        this.fornecedores = result.content;
      },
      error: (err) => console.error('Failed to load suppliers:', err)
    });

    // Carregar invoices utilizáveis (ativas, não canceladas)
    this.estoqueService.listarInvoices({ size: 100, somenteUtilizaveis: true }).subscribe({
      next: (result) => {
        this.invoices = mapInvoicesParaDropdown(result.content, s =>
          this.i18n.translateCatalog('invoice.status', s, s ?? '')
        );
        this.validarInvoiceSelecionada();
      },
      error: (err) => console.error('Failed to load invoices:', err)
    });
  }

  private validarInvoiceSelecionada(): void {
    const id = this.entradaForm.get('invoiceId')?.value;
    if (id == null || this.invoices.length === 0) return;
    if (!this.invoices.some(i => i.id === id)) {
      this.entradaForm.patchValue({ invoiceId: null, invoiceItemId: null });
      this.invoiceLinhas = [];
      this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'estoque.screens.entrada.toast.invoiceNaoUtilizavel');
      return;
    }
    this.carregarLinhasInvoice(id);
  }

  onInvoiceDropdownChange(): void {
    this.onInvoiceIdAlterado(this.entradaForm.get('invoiceId')?.value);
  }

  private onInvoiceIdAlterado(invoiceId: number | null): void {
    this.entradaForm.patchValue({ invoiceItemId: null }, { emitEvent: false });
    this.carregarLinhasInvoice(invoiceId);
  }

  private carregarLinhasInvoice(invoiceId: number | null | undefined): void {
    if (invoiceId == null || Number.isNaN(Number(invoiceId))) {
      this.invoiceLinhas = [];
      this.invoiceMoeda = 'USD';
      return;
    }
    this.carregandoLinhasInvoice = true;
    this.estoqueService.buscarInvoice(Number(invoiceId)).subscribe({
      next: inv => {
        this.invoiceMoeda = (inv.moeda || 'USD').toUpperCase();
        this.invoiceLinhas = mapItensInvoiceParaDropdown(inv.itens || []);
        this.carregandoLinhasInvoice = false;
        const linhaId = this.entradaForm.get('invoiceItemId')?.value;
        if (linhaId != null && this.invoiceLinhas.some(l => l.id === linhaId)) {
          this.aplicarLinhaInvoice();
        }
      },
      error: () => {
        this.invoiceLinhas = [];
        this.carregandoLinhasInvoice = false;
      }
    });
  }

  aplicarLinhaInvoice(): void {
    const linhaId = this.entradaForm.get('invoiceItemId')?.value;
    if (linhaId == null) return;
    const item = this.invoiceLinhas.find(l => l.id === linhaId);
    if (!item) return;
    const pend = Number(item.quantidadePendente ?? 0);
    const qtdLinha = Number(item.quantidade ?? 1);
    const qtd = pend > 0 ? pend : (qtdLinha > 0 ? qtdLinha : 1);
    const patch: Record<string, unknown> = {
      partNumber: item.partNumber ?? '',
      descricao: item.descricao ?? '',
      quantidade: qtd,
      unidade: item.unidade || 'UN'
    };
    const vu = item.valorUnitario != null ? Number(item.valorUnitario) : null;
    if (vu != null && !Number.isNaN(vu)) {
      if (this.invoiceMoeda === 'BRL') {
        patch['valorUnitarioBrl'] = vu;
      } else {
        patch['valorUnitarioUsd'] = vu;
      }
    }
    this.entradaForm.patchValue(patch);
  }

  buscarProdutosCadastro(event: { query: string }) {
    const q = (event.query || '').trim();
    if (!q) {
      this.produtosSugeridos = [];
      return;
    }
    this.productService.list({ q, size: 25 }).subscribe({
      next: (res) => {
        this.produtosSugeridos = res.items || [];
      },
      error: () => { this.produtosSugeridos = []; }
    });
  }

  aplicarProdutoCadastro(event: { value?: Product }) {
    const produto = event?.value;
    if (!produto) return;
    this.produtoSelecionadoCadastro = produto;
    this.produtoCadastroBusca = [produto.productpn, produto.name].filter(Boolean).join(' – ') || '';
    this.entradaForm.patchValue({
      partNumber: produto.productpn ?? this.entradaForm.get('partNumber')?.value,
      descricao: produto.description || produto.name || this.entradaForm.get('descricao')?.value,
      valorUnitarioUsd: produto.price != null ? produto.price : this.entradaForm.get('valorUnitarioUsd')?.value
    });
  }

  limparProdutoCadastro() {
    this.produtoCadastroBusca = '';
    this.produtoSelecionadoCadastro = null;
    this.produtosSugeridos = [];
  }

  onStepChange(index: number) {
    // Validar antes de avançar
    if (index > this.activeStep) {
      if (this.activeStep === 0 && !this.entradaForm.get('fornecedorId')?.value) {
        this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'entrada.mercadoria.toast.warnSupplier');
        return;
      }
      if (this.activeStep === 1 && !this.entradaForm.get('partNumber')?.value) {
        this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'entrada.mercadoria.toast.warnPn');
        return;
      }
    }
    this.activeStep = index;
  }

  proximoStep() {
    if (this.activeStep === 0) {
      if (!this.entradaForm.get('fornecedorId')?.value) {
        this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'entrada.mercadoria.toast.warnSupplier');
        return;
      }
      const invId = this.entradaForm.get('invoiceId')?.value;
      if (invId != null) {
        this.carregarLinhasInvoice(invId);
      }
    }
    if (this.activeStep < 2) {
      this.activeStep++;
    }
  }

  voltarStep() {
    if (this.activeStep > 0) {
      this.activeStep--;
    }
  }

  onCertAnexoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.certAnexoFile = input.files?.length ? input.files[0] : null;
  }

  registrarEntrada() {
    if (this.entradaForm.invalid) {
      this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'entrada.mercadoria.toast.warnFill');
      return;
    }

    this.salvando = true;
    const raw = this.entradaForm.value;
    const u = raw.unidade;
    const unidadeStr = typeof u === 'object' && u != null && 'value' in u ? (u as { value: string }).value : (u ?? 'UN');
    const fid = raw.fornecedorId != null ? Number(raw.fornecedorId) : 0;

    const dados: EntradaEstoque = {
      partNumber: String(raw.partNumber ?? ''),
      fornecedorId: fid,
      serialNumber: raw.serialNumber ?? undefined,
      descricao: raw.descricao ?? undefined,
      unidade: unidadeStr,
      quantidade: raw.quantidade ?? 1,
      valorUnitarioUsd: raw.valorUnitarioUsd ?? undefined,
      valorUnitarioBrl: raw.valorUnitarioBrl ?? undefined,
      invoiceId: raw.invoiceId ?? undefined,
      invoiceItemId: raw.invoiceItemId ?? undefined,
      loteId: raw.loteId ?? undefined,
      criarLote: raw.criarLote === true || raw.criarLote === 'true',
      localizacao: raw.localizacao ?? undefined,
      prateleira: raw.prateleira ?? undefined,
      gaveta: raw.gaveta ?? undefined,
      certTipo: raw.certTipo ?? undefined,
      certNumero: raw.certNumero?.trim() || undefined,
      certEmissor: raw.certEmissor?.trim() || undefined,
      certOrgaoAprovacao: raw.certOrgaoAprovacao?.trim() || undefined,
      certificadoConformidade: raw.certNumero?.trim() || undefined,
      certDataEmissao:
        raw.certDataEmissao && raw.certDataEmissao instanceof Date && !isNaN(raw.certDataEmissao.getTime())
          ? this.formatDate(raw.certDataEmissao)
          : undefined,
      dataFabricacao: raw.dataFabricacao && raw.dataFabricacao instanceof Date && !isNaN(raw.dataFabricacao.getTime())
        ? this.formatDate(raw.dataFabricacao) : undefined,
      dataValidade: raw.dataValidade && raw.dataValidade instanceof Date && !isNaN(raw.dataValidade.getTime())
        ? this.formatDate(raw.dataValidade) : undefined,
      shelfLifeMeses: raw.shelfLifeMeses ?? undefined,
      observacoes: raw.observacoes ?? undefined
    };

    this.estoqueService.entradaEstoque(dados).subscribe({
      next: (item) => {
        const finish = () => {
          this.salvando = false;
          this.itemCriado = item;
          this.qrCodePreviewUrl = null;
          this.qrCodePreviewLoading = !!item.id;
          this.showSucessoDialog = true;
          this.i18n.addToast(this.messageService, 'success', 'common.toast.success', 'entrada.mercadoria.toast.successEntrada');
          if (item.id) {
            firstValueFrom(this.estoqueService.loadQrCodeDataUrl(item.id, 150))
              .then(url => { this.qrCodePreviewUrl = url || null; })
              .catch(() => { this.qrCodePreviewUrl = null; })
              .finally(() => { this.qrCodePreviewLoading = false; });
          } else {
            this.qrCodePreviewLoading = false;
          }
        };
        if (item.id && this.certAnexoFile) {
          this.estoqueService.uploadCertificadoAnexo(item.id, this.certAnexoFile).subscribe({
            next: () => finish(),
            error: () => finish()
          });
        } else {
          finish();
        }
      },
      error: (err) => {
        this.salvando = false;
        console.error('Failed to register inbound stock:', err);
        const msg = this.i18n.translateApiError(err?.error, 'entrada.mercadoria.toast.errorEntradaFallback');
        this.i18n.addToastLiteralDetail(this.messageService, 'error', 'common.toast.error', msg);
      }
    });
  }

  formatDate(date: Date): string {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

  async imprimirEtiqueta(channel: ThermalPrintMode | 'browser' | 'thermal' = 'browser') {
    if (!this.itemCriado) return;

    const item = this.itemCriado;
    const codigoRastreio = item.codigoRastreio || '';
    const partNumber = item.partNumber || '';
    const qrCodeDataUrl = await this.getQrCodeDataUrl(item.id, 200);
    const scanOrigin = await this.qrOrigin.resolveOrigin();

    const ctx = buildEtiquetaPrintContext(this.i18n, this.branding, this.appLogoDataUri);
    const L = ctx.labels;
    const extras: string[] = [];
    if (item.loteCodigo) {
      extras.push(this.i18n.translate('estoque.etiqueta.print.loteLine', { code: item.loteCodigo }));
    }
    const linhaExtra = extras.length ? extras.join(' · ') : null;
    const html = buildEtiquetaPadrao100x45Document({
      appLogoDataUri: ctx.logoDataUri,
      commercialName: ctx.commercialName,
      codigoRastreio,
      partNumber,
      qrCodeDataUrl,
      serialNumber: item.serialNumber,
      linhaExtra,
      prefixPn: L.prefixPn,
      prefixSn: L.prefixSn,
      noQr: L.noQr,
      titleStandard: L.titleStandard
    });
    try {
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
          linhaExtra,
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
    } catch {
      /* toast já exibido */
    }
  }

  novaEntrada() {
    this.showSucessoDialog = false;
    this.itemCriado = null;
    this.qrCodePreviewUrl = null;
    this.qrCodePreviewLoading = false;
    this.activeStep = 0;
    this.limparProdutoCadastro();
    this.entradaForm.reset({
      quantidade: 1,
      unidade: 'UN',
      criarLote: true
    });
  }

  salvarFornecedor() {
    if (!this.novoFornecedor.razaoSocial) {
      this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'entrada.mercadoria.toast.warnRazao');
      return;
    }

    if (!this.novoFornecedor.paisOrigem) {
      this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'entrada.mercadoria.toast.warnPais');
      return;
    }

    this.salvandoFornecedor = true;
    this.estoqueService.criarFornecedor(this.novoFornecedor as Fornecedor).subscribe({
      next: (fornecedor) => {
        this.salvandoFornecedor = false;
        this.showNovoFornecedorDialog = false;
        this.fornecedores = [...this.fornecedores, fornecedor];
        this.entradaForm.patchValue({ fornecedorId: fornecedor.id });
        this.novoFornecedor = this.initNovoFornecedor();
        this.i18n.addToast(this.messageService, 'success', 'entrada.mercadoria.toast.fornecedorCreatedSummary', 'entrada.mercadoria.toast.fornecedorCreatedDetail', {
          nome: String(fornecedor.razaoSocial ?? ''),
          codigo: String(fornecedor.codigo ?? '')
        });
      },
      error: (err) => {
        this.salvandoFornecedor = false;
        console.error('Failed to register supplier:', err);
        const msg = err.error?.error || this.i18n.translate('entrada.mercadoria.toast.fornecedorErrorFallback');
        this.i18n.addToastLiteralDetail(this.messageService, 'error', 'common.toast.error', msg);
      }
    });
  }

  cancelarFornecedor() {
    this.showNovoFornecedorDialog = false;
    this.novoFornecedor = this.initNovoFornecedor();
  }
}
