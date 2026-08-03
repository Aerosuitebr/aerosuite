import { Component, OnInit, inject, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { TabViewModule } from 'primeng/tabview';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { DialogModule } from 'primeng/dialog';
import { DataViewModule } from 'primeng/dataview';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { RadioButtonModule } from 'primeng/radiobutton';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { MessageService, ConfirmationService } from 'primeng/api';
import { PropostaComercialService, PropostaComercial, PropostaComercialItem, PropostaAditivo, PropostaAnexo, EnviarPropostaEmailRequest, SignatureData, PropostaDisponibilizarPortalResult } from '../core/proposta-comercial.service';
import { HttpClient } from '@angular/common/http';
import { TemplateProdutoServicoService, TemplateProdutoServico } from '../core/template-produto-servico.service';
import { TipoServicoService, TipoServico } from '../core/tipos-servico.service';
import { CotacaoService, CotacaoDolar } from '../core/cotacao.service';
import { ClientePropostaService, ClienteProposta } from '../core/cliente-proposta.service';
import {
  BlingApiService,
  BlingContact,
  BlingNfeRegistro,
  BlingPropostaFluxoPasso,
  BlingPropostaFluxoView,
  BlingPropostaPedidoView,
} from '../core/bling-api.service';
import { PageHelpComponent } from '../shared/page-help/page-help.component';
import { SignatureModalComponent, SignatureData as SignatureModalData } from '../shared/signature-modal/signature-modal.component';
import { ProductSelectorComponent, PropostaItem, Product } from '../shared/product-selector/product-selector.component';
import { environment } from '../../environments/environment';
import { TranslationService } from '../core/translation.service';
import { TranslatePipe } from '../core/translate.pipe';
import { LocaleMoneyPipe } from '../core/locale/locale-money.pipe';
import { parseIsoDateLocal, toIsoDatePayload } from '../core/locale/iso-local-date.util';
import { LocaleDateTimePipe } from '../core/locale/locale-datetime.pipe';
import { LocaleCurrencyService } from '../core/locale/locale-currency.service';
import { MoneyCurrency, coerceMoneyCurrency } from '../core/locale/locale-region.config';
import { bustStaticAssetUrl } from '../../environments/asset-cache-bust';
import { APP_LOGO_SRC } from '../shared/constants/app-logo';
import { BrandingService } from '../core/branding.service';
import { SistemaEmpresaConfig, SistemaEmpresaService } from '../core/sistema-empresa.service';
import { applyBrandPalette, brandPalette } from '../core/brand-colors.util';
import { translateApiMessage } from '../core/backend-i18n-message.util';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';
import { PropostaPortalDialogComponent } from './proposta-portal-dialog.component';
import { propostaPodeAcaoPortal, propostaPodeGerenciarPortalTab, propostaVisivelNoPortal } from './proposta-portal.util';
import { BRASIL_ESTADOS } from '../core/domain/brazil-states.data';

@Component({
  standalone: true,
  selector: 'app-proposta-comercial',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    InputTextareaModule,
    DropdownModule,
    CalendarModule,
    TabViewModule,
    CardModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    DividerModule,
    DialogModule,
    DataViewModule,
    TagModule,
    BadgeModule,
    ProgressSpinnerModule,
    RadioButtonModule,
    AutoCompleteModule,
    PropostaPortalDialogComponent,
    PageHelpComponent,
    SignatureModalComponent,
    ProductSelectorComponent,
    TranslatePipe,
    LocaleMoneyPipe,
    LocaleDateTimePipe,
    PageHeroComponent
  ],

  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>
    
    <div class="as-page proposta-container">
      <app-page-hero
        variant="slate"
        [titleKey]="isEditMode ? 'comercial.proposta.header.edit' : 'comercial.proposta.header.new'"
        [subtitle]="subCabecalho"
        titleIcon="pi-file-edit"
        [hasActions]="true">
        <div actions class="header-actions-group header-actions-nav">
          <app-page-help></app-page-help>
          <button *ngIf="isEditMode && proposta?.id" pButton [label]="'comercial.proposta.btn.clone' | translate" icon="pi pi-copy"
                  class="p-button-outlined p-button-secondary" (click)="clonarProposta()"
                  [pTooltip]="'comercial.proposta.tip.clone' | translate"></button>
          <button pButton [label]="'comercial.proposta.btn.voltar' | translate" icon="pi pi-arrow-left"
                  class="p-button-outlined" routerLink="/propostas-comerciais"></button>
        </div>
      </app-page-hero>
      <div *ngIf="showHeaderWorkflowRow()" class="header-actions header-actions-workflow">
          <button *ngIf="podeAcaoPortal()" pButton icon="pi pi-globe"
                  class="p-button-outlined p-button-info header-action-icon"
                  [attr.aria-label]="'comercial.proposta.btn.portal' | translate"
                  [pTooltip]="'comercial.proposta.tip.portal' | translate"
                  (click)="abrirDialogPortal()"></button>
          <button *ngIf="isEditMode && proposta?.osId" pButton icon="pi pi-external-link"
                  class="p-button-outlined p-button-success header-action-icon"
                  [attr.aria-label]="'comercial.proposta.btn.abrirOs' | translate"
                  [pTooltip]="'comercial.proposta.btn.abrirOs' | translate"
                  (click)="abrirOsVinculada()"></button>
          <button *ngIf="canEnviarPedidoBling()" pButton icon="pi pi-shopping-cart"
                  class="p-button-outlined p-button-warning header-action-icon"
                  [attr.aria-label]="'comercial.proposta.bling.pedidoBtn' | translate"
                  [pTooltip]="'comercial.proposta.bling.pedidoBtn' | translate"
                  [loading]="gerandoPedidoBling" (click)="confirmarPedidoBling()"></button>
          <p-tag *ngIf="blingPedido?.linked" severity="warn"
                 [value]="'comercial.proposta.bling.pedidoBadge' | translate"
                 [pTooltip]="'comercial.proposta.bling.pedidoBadgeTip' | translate : {
                   numero: blingPedido?.blingPedidoNumero || blingPedido?.blingPedidoId || '',
                   situacao: blingPedido?.blingSituacao || '—'
                 }"
                 styleClass="bling-pedido-tag"></p-tag>
          <button *ngIf="canEmitirNfeBling()" pButton icon="pi pi-file-export"
                  class="p-button-outlined p-button-info header-action-icon"
                  [attr.aria-label]="'comercial.proposta.bling.nfeEmitBtn' | translate"
                  [pTooltip]="'comercial.proposta.bling.nfeEmitBtn' | translate"
                  [loading]="emitindoNfeBling" (click)="confirmarEmitirNfeBling()"></button>
          <button *ngIf="canGerarOs()" pButton icon="pi pi-briefcase"
                  class="p-button-outlined p-button-help header-action-icon"
                  [attr.aria-label]="'comercial.proposta.btn.gerarOs' | translate"
                  [pTooltip]="'comercial.proposta.btn.gerarOs' | translate"
                  [loading]="gerandoOs" (click)="confirmarGerarOs()"></button>
          <button *ngIf="isEditMode && proposta?.id && !proposta?.osId && proposta?.status !== 'APROVADA'"
                  pButton icon="pi pi-check-circle"
                  class="p-button-outlined p-button-success header-action-icon"
                  [attr.aria-label]="'comercial.proposta.btn.aprovar' | translate"
                  [pTooltip]="'comercial.proposta.btn.aprovar' | translate"
                  [loading]="aprovandoProposta" (click)="marcarAprovada()"></button>
          <p-tag *ngIf="proposta?.osId" [value]="'comercial.proposta.gerarOs.badge' | translate" severity="success"
                 [pTooltip]="'comercial.proposta.gerarOs.badgeTip' | translate" styleClass="os-vinculada-tag"></p-tag>
        </div>
        <div *ngIf="blingPedido?.linked || blingFluxo" class="bling-fluxo-banner">
          <div class="bling-fluxo-header">
            <div>
              <strong>{{ 'comercial.proposta.bling.fluxoTitle' | translate }}</strong>
              <p class="text-sm text-color-secondary mb-0">{{ 'comercial.proposta.bling.fluxoHint' | translate }}</p>
            </div>
            <div class="bling-fluxo-actions">
              <p-tag *ngIf="blingFluxo?.automacaoPendente"
                     [severity]="blingFluxo?.automacaoComErro ? 'danger' : (blingFluxo?.aguardandoConclusaoOs ? 'info' : 'warn')"
                     [value]="fluxoAutomacaoLabel()"></p-tag>
              <button *ngIf="blingFluxo?.retryDisponivel" pButton type="button" class="p-button-sm p-button-outlined"
                      icon="pi pi-refresh" [label]="'comercial.proposta.bling.fluxoRetryBtn' | translate"
                      [loading]="reprocessandoFluxoBling" (click)="reprocessarFluxoBling()"></button>
              <button *ngIf="canEmitirNfeBling()" pButton type="button" class="p-button-sm p-button-outlined"
                      icon="pi pi-file-export" [label]="'comercial.proposta.bling.nfeEmitBtn' | translate"
                      [loading]="emitindoNfeBling" (click)="confirmarEmitirNfeBling()"></button>
            </div>
          </div>
          <ol class="bling-fluxo-steps" *ngIf="blingFluxo?.passos?.length">
            <li *ngFor="let passo of blingFluxo!.passos!" [class]="'bling-fluxo-step bling-fluxo-step--' + (passo.status || 'PENDING').toLowerCase()">
              <span class="bling-fluxo-step__icon" aria-hidden="true"></span>
              <div class="bling-fluxo-step__body">
                <strong>{{ fluxoPassoLabel(passo) }}</strong>
                <span>{{ passo.titulo }}</span>
                <small *ngIf="passo.detalhe">{{ passo.detalhe }}</small>
                <small *ngIf="passo.updatedAt" class="bling-fluxo-step__time">{{ passo.updatedAt | localeDateTime:'datetimeShort' }}</small>
              </div>
              <span class="bling-fluxo-step__status">{{ ('comercial.proposta.bling.fluxoStatus.' + (passo.status || 'PENDING')) | translate }}</span>
            </li>
          </ol>
          <p *ngIf="blingFluxo?.ultimoErro" class="bling-fluxo-erro text-sm">
            {{ blingFluxo?.ultimoErro }}
          </p>
          <div class="bling-nfe-block">
            <strong>{{ 'comercial.proposta.bling.nfeTitle' | translate }}</strong>
            <ul class="bling-nfe-list" *ngIf="blingNfeList.length">
              <li *ngFor="let nfe of blingNfeList">
                <span>#{{ nfe.numero || nfe.blingNfeId }} — {{ nfe.situacao || '—' }}</span>
                <a *ngIf="nfe.danfeUrl" [href]="nfe.danfeUrl" target="_blank" rel="noopener noreferrer">
                  {{ 'comercial.proposta.bling.nfeOpenDanfe' | translate }}
                </a>
              </li>
            </ul>
            <p *ngIf="!blingNfeList.length" class="text-sm text-color-secondary mb-0">
              {{ 'comercial.proposta.bling.nfeEmpty' | translate }}
            </p>
          </div>
          <details *ngIf="blingFluxo?.eventos?.length" class="bling-fluxo-historico">
            <summary>{{ 'comercial.proposta.bling.fluxoHistorico' | translate }}</summary>
            <ul>
              <li *ngFor="let ev of blingFluxo!.eventos!">
                <span>{{ ev.createdAt | localeDateTime:'datetimeShort' }} — {{ ev.mensagem }}</span>
                <small *ngIf="ev.detalhe">{{ ev.detalhe }}</small>
              </li>
            </ul>
          </details>
        </div>
        <div *ngIf="proposta?.clienteDecisaoEm && !carregandoProposta" class="cliente-decisao-banner">
          <i class="pi pi-user-check"></i>
          <span>{{ 'comercial.proposta.clienteDecisao.banner' | translate }}</span>
          <span>{{ 'comercial.proposta.clienteDecisao.em' | translate:{ date: (proposta.clienteDecisaoEm | localeDateTime:'datetimeShort') } }}</span>
          <span *ngIf="proposta.clienteDecisaoMotivo"> — {{ 'comercial.proposta.clienteDecisao.motivo' | translate:{ motivo: proposta.clienteDecisaoMotivo } }}</span>
        </div>

      <div class="proposta-loading" *ngIf="carregandoProposta" role="status" aria-live="polite">
        <p-progressSpinner strokeWidth="4"></p-progressSpinner>
        <p>{{ 'comercial.proposta.loading' | translate }}</p>
      </div>

      <!-- Seletor de Template (apenas para nova proposta) -->
      <div class="template-selector" *ngIf="!carregandoProposta && !isEditMode && !templateSelecionado">
        <div class="template-header">
          <h2><i class="pi pi-th-large"></i> {{ 'comercial.proposta.tpl.title' | translate }}</h2>
          <p>{{ 'comercial.proposta.tpl.sub' | translate }}</p>
        </div>

        <div class="template-options">
          <!-- Card para começar do zero -->
          <div class="template-card new-card" (click)="comecarDoZero()">
            <div class="card-icon">
              <i class="pi pi-plus-circle"></i>
            </div>
            <h3>{{ 'comercial.proposta.tpl.zeroTit' | translate }}</h3>
            <p>{{ 'comercial.proposta.tpl.zeroSub' | translate }}</p>
          </div>

          <!-- Cards de Templates -->
          <div class="template-card" 
               *ngFor="let template of templatesRecentes"
               (click)="selecionarTemplate(template)"
               [class.popular]="template.vezesUtilizado && template.vezesUtilizado > 5">
            <div class="card-badge" *ngIf="template.vezesUtilizado && template.vezesUtilizado > 5">
              <i class="pi pi-star-fill"></i> {{ 'comercial.proposta.tpl.popular' | translate }}
            </div>
            <div class="card-icon template-icon">
              <i class="pi pi-file"></i>
            </div>
            <h3>{{ template.nomeTemplate }}</h3>
            <p class="template-produto">{{ template.produtoNome }}</p>
            <p class="template-servico" *ngIf="template.tipoServicoNome">
              <i class="pi pi-cog"></i> {{ template.tipoServicoNome }}
            </p>
            <div class="template-meta">
              <span class="uso-count" *ngIf="template.vezesUtilizado">
                <i class="pi pi-chart-line"></i> {{ 'comercial.proposta.tpl.usado' | translate:{ n: (template.vezesUtilizado ?? 0) + '' } }}
              </span>
              <span class="valor" *ngIf="template.produtoValorBase">
                {{ template.produtoValorBase | localeMoney:'BRL':propostaMoneyPipeOpts }}
              </span>
            </div>
          </div>

          <!-- Card para ver mais templates -->
          <div class="template-card more-card" (click)="abrirGaleriaTemplates()">
            <div class="card-icon">
              <i class="pi pi-search"></i>
            </div>
            <h3>{{ 'comercial.proposta.tpl.verMais' | translate }}</h3>
            <p>{{ 'comercial.proposta.tpl.verMaisSub' | translate:{ total: totalTemplates + '' } }}</p>
          </div>
        </div>
      </div>

      <!-- Indicador de Template Selecionado -->
      <div class="template-selected-banner" *ngIf="!carregandoProposta && templateSelecionado">
        <div class="banner-content">
          <i class="pi pi-check-circle"></i>
          <div class="banner-text">
            <strong>{{ 'comercial.proposta.banner.lbl' | translate }} {{ templateSelecionado.nomeTemplate }}</strong>
            <span>{{ templateSelecionado.produtoNome }} - {{ templateSelecionado.tipoServicoNome }}</span>
          </div>
        </div>
        <div class="banner-actions">
          <button pButton [label]="'comercial.proposta.banner.trocar' | translate" icon="pi pi-refresh" 
                  class="p-button-text p-button-sm"
                  (click)="trocarTemplate()"></button>
          <button pButton [label]="'comercial.proposta.banner.salvarTpl' | translate" icon="pi pi-save" 
                  class="p-button-outlined p-button-sm"
                  (click)="abrirDialogSalvarTemplate()"
                  [pTooltip]="'comercial.proposta.banner.salvarTplTip' | translate"></button>
        </div>
      </div>

      <!-- Tabs (visível após selecionar template ou começar do zero) -->
      <div class="tabs-container" *ngIf="!carregandoProposta && (templateSelecionado || modoManual)">
        <p-tabView [(activeIndex)]="activeTabIndex" (onChange)="onTabChange($event)">
          <!-- Tab Produtos -->
          <p-tabPanel>
            <ng-template pTemplate="header">
              <i class="pi pi-box tab-icon"></i>
              <span>{{ 'comercial.proposta.tab.produtos' | translate }}</span>
              <span class="tab-badge success" *ngIf="propostaItems.length > 0">{{ propostaItems.length }}</span>
            </ng-template>
            
            <div class="tab-content">
              <!-- Seção de Produtos Selecionados -->
              <div class="products-section">
                <div class="section-header">
                  <div class="section-title">
                    <i class="pi pi-shopping-cart"></i>
                    <h3>{{ 'comercial.proposta.sec.itensTit' | translate }}</h3>
                  </div>
                  <div class="section-actions">
                    <div class="currency-selector">
                      <label>{{ 'comercial.proposta.currency.lbl' | translate }}</label>
                      <div class="currency-options">
                        <label class="currency-option">
                          <p-radioButton
                            name="proposalCurrency"
                            value="USD"
                            [(ngModel)]="selectedCurrency"
                            [ngModelOptions]="{standalone: true}"
                            (onClick)="onCurrencyChange()">
                          </p-radioButton>
                          <span>{{ 'comercial.proposta.currency.usdLbl' | translate }}</span>
                        </label>
                        <label class="currency-option">
                          <p-radioButton
                            name="proposalCurrency"
                            value="BRL"
                            [(ngModel)]="selectedCurrency"
                            [ngModelOptions]="{standalone: true}"
                            (onClick)="onCurrencyChange()">
                          </p-radioButton>
                          <span>{{ 'comercial.proposta.currency.brlLbl' | translate }}</span>
                        </label>
                        <label class="currency-option">
                          <p-radioButton
                            name="proposalCurrency"
                            value="EUR"
                            [(ngModel)]="selectedCurrency"
                            [ngModelOptions]="{standalone: true}"
                            (onClick)="onCurrencyChange()">
                          </p-radioButton>
                          <span>{{ 'comercial.proposta.currency.eurLbl' | translate }}</span>
                        </label>
                      </div>
                    </div>
                    <button pButton 
                            type="button"
                            [label]="'comercial.proposta.btn.addProd' | translate"
                            icon="pi pi-plus"
                            class="p-button-primary"
                            (click)="openProductSelector()">
                    </button>
                  </div>
                </div>

                <!-- Lista de Produtos Selecionados -->
                <div class="products-list" *ngIf="propostaItems.length > 0">
                  <div class="product-item" *ngFor="let item of propostaItems; let i = index">
                    <div class="item-number">{{ i + 1 }}</div>
                    
                    <div class="item-info">
                      <div class="item-name">{{ item.product.name }}</div>
                      <div class="item-desc" *ngIf="item.product.description">{{ item.product.description | slice:0:100 }}</div>
                      <div class="item-pn-sn">
                        <div class="pn-field">
                          <label>{{ 'comercial.proposta.lbl.pn' | translate }}</label>
                          <input pInputText 
                                 [(ngModel)]="item.produtoPn"
                                 [ngModelOptions]="{standalone: true}"
                                 [placeholder]="'comercial.proposta.ph.prodPn' | translate"
                                 class="pn-sn-input"
                                 (blur)="onItemPnSnChanged(item)">
                        </div>
                        <div class="sn-field">
                          <label>{{ 'comercial.proposta.lbl.sn' | translate }}</label>
                          <input pInputText 
                                 [(ngModel)]="item.produtoSn"
                                 [ngModelOptions]="{standalone: true}"
                                 [placeholder]="'comercial.proposta.ph.prodSn' | translate"
                                 class="pn-sn-input"
                                 (blur)="onItemPnSnChanged(item)">
                        </div>
                      </div>
                    </div>
                    
                    <div class="item-qty">
                      <label>{{ 'comercial.proposta.lbl.qtd' | translate }}</label>
                      <p-inputNumber 
                        [(ngModel)]="item.quantidade"
                        [min]="1"
                        [max]="999"
                        [showButtons]="true"
                        buttonLayout="horizontal"
                        spinnerMode="horizontal"
                        styleClass="qty-input-sm"
                        (ngModelChange)="updateItemTotal(item)">
                      </p-inputNumber>
                    </div>
                    
                    <div class="item-price">
                      <label>{{ 'comercial.proposta.lbl.valorUnitCur' | translate:{ ui: localeCurrency.getDisplayCurrency(), prop: selectedCurrency } }}</label>
                      <p-inputNumber 
                        [ngModel]="getItemUnitPriceUi(item)"
                        [ngModelOptions]="{standalone: true}"
                        mode="currency"
                        [currency]="localeCurrency.getDisplayCurrency()"
                        [locale]="localeCurrency.getIntlLocale()"
                        styleClass="price-input-sm"
                        (ngModelChange)="onItemUnitPriceUiChange(item, $event)">
                      </p-inputNumber>
                    </div>
                    
                    <div class="item-total">
                      <label>{{ 'comercial.proposta.lbl.totalCur' | translate:{ ui: localeCurrency.getDisplayCurrency() } }}</label>
                      <span class="total-value">{{ getItemTotalDisplay(item) | localeMoney:getSelectedCurrencyCode():propostaMoneyPipeOpts }}</span>
                    </div>
                    
                    <button pButton 
                            type="button"
                            icon="pi pi-trash"
                            class="p-button-danger p-button-text p-button-sm"
                            [pTooltip]="'comercial.proposta.tip.removeProd' | translate"
                            (click)="removePropostaItem(i)">
                    </button>
                  </div>
                  
                  <!-- Seção de Totais e Desconto - Layout Alinhado -->
                  <div class="totals-section-aligned">
                    <!-- Tabela de Totais -->
                    <table class="totals-table">
                      <tbody>
                        <!-- Subtotal Produtos -->
                        <tr class="subtotal-line">
                          <td class="label-cell">{{ 'comercial.proposta.totals.subtotalProd' | translate:{ cur: localeCurrency.getDisplayCurrency() } }}</td>
                          <td class="value-cell">{{ getPropostaTotalValueInSelectedCurrency() | localeMoney:getSelectedCurrencyCode():propostaMoneyPipeOpts }}</td>
                        </tr>
                        
                        <!-- Linha de Desconto -->
                        <tr class="discount-line" *ngIf="showDiscount && getDiscountValue() > 0">
                          <td class="label-cell discount-label">
                            <i class="pi pi-tag"></i>
                            {{ tituloLinhaDesconto() }}
                          </td>
                          <td class="value-cell discount-value">- {{ getDiscountValueInSelectedCurrency() | localeMoney:getSelectedCurrencyCode():propostaMoneyPipeOpts }}</td>
                        </tr>

                        <!-- Subtotal após desconto -->
                        <tr class="subtotal-line" *ngIf="showDiscount && getDiscountValueInSelectedCurrency() > 0">
                          <td class="label-cell">{{ 'comercial.proposta.totals.subtotalAposDesc' | translate:{ cur: localeCurrency.getDisplayCurrency() } }}</td>
                          <td class="value-cell">{{ getFinalTotalValueInSelectedCurrency() | localeMoney:getSelectedCurrencyCode():propostaMoneyPipeOpts }}</td>
                        </tr>
                      </tbody>
                    </table>

                    <!-- Custos Adicionais (BRL) -->
                    <div class="additional-costs-section">
                      <h4><i class="pi pi-money-bill"></i> {{ 'comercial.proposta.costs.secTitulo' | translate }}</h4>
                      <div class="costs-grid">
                        <div class="cost-item">
                          <label>{{ 'comercial.proposta.costs.freteLbl' | translate }}</label>
                          <p-inputNumber 
                            [ngModel]="getFreteUi()"
                            [ngModelOptions]="{standalone: true}"
                            mode="currency"
                            [currency]="localeCurrency.getDisplayCurrency()"
                            [locale]="localeCurrency.getIntlLocale()"
                            [placeholder]="'comercial.proposta.ph.moedaPlaceholder' | translate"
                            styleClass="cost-input"
                            (ngModelChange)="setFreteUi($event)">
                          </p-inputNumber>
                        </div>
                        <div class="cost-item">
                          <label>{{ 'comercial.proposta.costs.moLbl' | translate }}</label>
                          <p-inputNumber 
                            [ngModel]="getMaoDeObraUi()"
                            [ngModelOptions]="{standalone: true}"
                            mode="currency"
                            [currency]="localeCurrency.getDisplayCurrency()"
                            [locale]="localeCurrency.getIntlLocale()"
                            [placeholder]="'comercial.proposta.ph.moedaPlaceholder' | translate"
                            styleClass="cost-input"
                            (ngModelChange)="setMaoDeObraUi($event)">
                          </p-inputNumber>
                        </div>
                      </div>
                    </div>

                    <!-- Conversão e Total Final -->
                    <div class="conversion-section">
                      <div class="proposta-money-disclosure" *ngIf="showMoneyDisclosurePanel()">
                        <h4 class="proposta-money-disclosure-title">
                          <i class="pi pi-info-circle"></i>
                          {{ 'comercial.proposta.money.sourcesTit' | translate }}
                        </h4>
                        <div class="cotacao-info" *ngIf="showProposalBcbRate()">
                          <i class="pi pi-sync"></i>
                          <span>{{ 'comercial.proposta.costs.taxaProposta' | translate:{ rate: (cotacaoDolar!.cotacaoVenda | number:'1.4-4'), source: cotacaoDolar!.fonte } }}</span>
                          <button pButton type="button" icon="pi pi-refresh"
                                  class="p-button-text p-button-sm"
                                  (click)="atualizarCotacao()"
                                  [loading]="carregandoCotacao"
                                  [pTooltip]="'comercial.proposta.tip.cotacao' | translate">
                          </button>
                        </div>
                        <p class="proposta-money-tax-hint" *ngIf="showProposalBcbRate() && hasUiCurrencyConversion()">
                          {{ 'comercial.proposta.money.taxaPropostaVsFontes' | translate }}
                        </p>
                        <ul class="proposta-money-sources-list" *ngIf="getUiMoneyDisclosureLines().length">
                          <li *ngFor="let line of getUiMoneyDisclosureLines()">{{ line }}</li>
                        </ul>
                      </div>
                      <div class="cotacao-loading" *ngIf="carregandoCotacao && selectedCurrency !== 'USD' && !proposalRatesReady()">
                        <i class="pi pi-spin pi-spinner"></i>
                        <span>{{ 'comercial.proposta.cotacao.carregando' | translate }}</span>
                      </div>

                      <table class="totals-table final-totals" *ngIf="proposalRatesReady()" aria-live="polite" aria-atomic="true">
                        <caption class="as-sr-only">{{ totalA11yAnnouncement }}</caption>
                        <tbody>
                          <tr *ngIf="freteBrl > 0">
                            <td class="label-cell">{{ 'comercial.proposta.totals.freteCur' | translate:{ cur: selectedCurrency } }}</td>
                            <td class="value-cell">{{ getFreteInSelectedCurrency() | localeMoney:getSelectedCurrencyCode():propostaMoneyPipeOpts }}</td>
                          </tr>
                          <tr *ngIf="maoDeObraBrl > 0">
                            <td class="label-cell">{{ 'comercial.proposta.totals.moCur' | translate:{ cur: selectedCurrency } }}</td>
                            <td class="value-cell">{{ getMaoDeObraInSelectedCurrency() | localeMoney:getSelectedCurrencyCode():propostaMoneyPipeOpts }}</td>
                          </tr>
                          <tr class="final-line">
                            <td class="label-cell final-label">
                              <i class="pi pi-dollar"></i>
                              <strong>{{ 'comercial.proposta.lbl.totalGeralStrong' | translate:{ cur: selectedCurrency } }}</strong>
                            </td>
                            <td class="value-cell final-value usd-total">{{ getTotalGeralInSelectedCurrency() | localeMoney:getSelectedCurrencyCode():propostaMoneyPipeOpts }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <!-- Controles de Desconto -->
                    <div class="discount-controls-section">
                      <div class="discount-header">
                        <button 
                          pButton 
                          type="button"
                          [icon]="showDiscount ? 'pi pi-times-circle' : 'pi pi-percentage'"
                          [label]="showDiscount ? ('comercial.proposta.discount.remover' | translate) : ('comercial.proposta.discount.aplicar' | translate)"
                          [class]="showDiscount ? 'p-button-text p-button-danger p-button-sm' : 'p-button-sm add-discount-btn'"
                          (click)="toggleDiscount()">
                        </button>
                      </div>

                      <div class="discount-editor" *ngIf="showDiscount">
                        <div class="discount-type-buttons">
                          <button 
                            pButton 
                            type="button"
                            icon="pi pi-percentage"
                            [label]="'comercial.proposta.discount.percent' | translate"
                            [class]="discountType === 'percent' ? 'p-button-sm type-active' : 'p-button-outlined p-button-sm'"
                            (click)="setDiscountType('percent')">
                          </button>
                          <button 
                            pButton 
                            type="button"
                            icon="pi pi-dollar"
                            [label]="'comercial.proposta.discount.fixed' | translate"
                            [class]="discountType === 'fixed' ? 'p-button-sm type-active' : 'p-button-outlined p-button-sm'"
                            (click)="setDiscountType('fixed')">
                          </button>
                        </div>

                        <div class="discount-input-area">
                          <label>{{ discountType === 'percent' ? ('comercial.proposta.discount.lblPercentTit' | translate) : ('comercial.proposta.discount.lblValorTit' | translate) }}</label>
                          <p-inputNumber 
                            *ngIf="discountType === 'percent'"
                            [(ngModel)]="discountPercent"
                            [min]="0"
                            [max]="100"
                            suffix=" %"
                            [placeholder]="'comercial.proposta.discount.ph' | translate"
                            styleClass="discount-input-field"
                            (ngModelChange)="onDiscountChange()">
                          </p-inputNumber>
                          
                          <p-inputNumber 
                            *ngIf="discountType === 'fixed'"
                            [ngModel]="getDiscountFixedUi()"
                            [ngModelOptions]="{standalone: true}"
                            [min]="0"
                            [max]="getDiscountFixedUiMax()"
                            mode="currency"
                            [currency]="localeCurrency.getDisplayCurrency()"
                            [locale]="localeCurrency.getIntlLocale()"
                            [placeholder]="'comercial.proposta.ph.moedaPlaceholder' | translate"
                            styleClass="discount-input-field"
                            (ngModelChange)="setDiscountFixedUi($event)">
                          </p-inputNumber>
                        </div>

                        <!-- Info de economia -->
                        <div class="savings-badge" *ngIf="getDiscountValueInSelectedCurrency() > 0">
                          <i class="pi pi-check-circle"></i>
                          <span>{{ textoEconomiaCliente() }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Estado vazio -->
                <div class="empty-products" *ngIf="propostaItems.length === 0">
                  <i class="pi pi-inbox"></i>
                  <h4>{{ 'comercial.proposta.emptyProd.titulo' | translate }}</h4>
                  <p>{{ 'comercial.proposta.emptyProd.lead' | translate }}</p>
                  <button pButton 
                          type="button"
                          [label]="'comercial.proposta.btn.addProd' | translate"
                          icon="pi pi-plus"
                          class="p-button-outlined"
                          (click)="openProductSelector()">
                  </button>
                </div>
              </div>

              <p-divider></p-divider>

              <!-- Informações Adicionais do Serviço -->
              <div class="form-section">
                <h3><i class="pi pi-cog"></i> {{ 'comercial.proposta.sec.aplicacao' | translate }}</h3>
                
                <form [formGroup]="produtoForm">
                  <div class="form-grid">
                    <div class="form-field">
                      <label for="aplicacaoMotor">{{ 'comercial.proposta.lbl.aplicacaoMotor' | translate }}</label>
                      <input pInputText id="aplicacaoMotor" formControlName="aplicacaoMotor" 
                             [placeholder]="'comercial.proposta.manual.phPn' | translate" class="w-full">
                    </div>
                    
                    <div class="form-field">
                      <label for="aeronavePrefixo">{{ 'comercial.proposta.lbl.aeronavePrefixo' | translate }}</label>
                      <input pInputText id="aeronavePrefixo" formControlName="aeronavePrefixo" 
                             [placeholder]="'comercial.proposta.manual.phPrefixo' | translate" class="w-full">
                    </div>
                    
                    <div class="form-field">
                      <label for="idTipoServico">{{ 'comercial.proposta.lbl.tipoServico' | translate }}</label>
                      <p-dropdown id="idTipoServico" formControlName="idTipoServico"
                                  [options]="tiposServico" optionLabel="nome" optionValue="id"
                                  [placeholder]="'comercial.proposta.manual.phTipoServico' | translate"
                                  [filter]="true" filterBy="nome"
                                  [showClear]="true" class="w-full"
                                  (onChange)="onTipoServicoChange($event)">
                      </p-dropdown>
                    </div>
                    
                    <div class="form-field full-width">
                      <label for="servicoExecutado">{{ 'comercial.proposta.lbl.servicoExecutadoTit' | translate }}</label>
                      <textarea pInputTextarea id="servicoExecutado" formControlName="servicoExecutado"
                                [rows]="4" [maxlength]="1000"
                                [placeholder]="'comercial.proposta.manual.phDescServico' | translate"
                                class="w-full"></textarea>
                      <small class="char-counter">{{ produtoForm.get('servicoExecutado')?.value?.length || 0 }}/1000</small>
                    </div>
                  </div>
                </form>
              </div>
              
              <div class="tab-actions">
                <button pButton [label]="'comercial.proposta.btn.salvarTemplate' | translate" icon="pi pi-bookmark"
                        (click)="abrirDialogSalvarTemplate()" class="p-button-outlined p-button-secondary"
                        [pTooltip]="'comercial.proposta.tip.salvarTemplateManual' | translate"></button>
                <span class="spacer"></span>
                <button pButton [label]="'comercial.proposta.btn.proxCliente' | translate" icon="pi pi-arrow-right" iconPos="right"
                        (click)="nextTab()" class="p-button-primary"
                        [disabled]="propostaItems.length === 0"></button>
              </div>
            </div>
          </p-tabPanel>

          <!-- Tab Cliente -->
          <p-tabPanel>
            <ng-template pTemplate="header">
              <i class="pi pi-user tab-icon"></i>
              <span>{{ 'comercial.proposta.tab.cliente' | translate }}</span>
              <span class="tab-badge" *ngIf="isClienteValid">✓</span>
            </ng-template>
            
            <div class="tab-content">
              <!-- Busca de Cliente Cadastrado -->
              <div class="form-section cliente-search-section">
                <h3><i class="pi pi-search"></i> {{ 'comercial.proposta.cliente.secBusca' | translate }}</h3>
                <p class="section-hint">{{ 'comercial.proposta.cliente.buscaHint' | translate }}</p>
                
                <div class="cliente-search-container">
                  <p-autoComplete 
                    [(ngModel)]="clienteBuscaTexto"
                    (ngModelChange)="onClienteBuscaModelChange($event)"
                    [suggestions]="clientesSugestoes"
                    (completeMethod)="buscarClientes($event)"
                    (onSelect)="selecionarCliente($event)"
                    (onClear)="limparClienteSelecionado()"
                    optionLabel="nome"
                    [minLength]="2"
                    [showEmptyMessage]="true"
                    [emptyMessage]="'comercial.proposta.cliente.emptyAc' | translate"
                    [placeholder]="'comercial.proposta.cliente.buscaPh' | translate"
                    [style]="{'width': '100%'}"
                    [inputStyle]="{'width': '100%'}"
                    [forceSelection]="false">
                    <ng-template let-cliente pTemplate="item">
                      <div class="cliente-suggestion">
                        <div class="cliente-nome">{{ cliente.nome }}</div>
                        <div class="cliente-info" *ngIf="cliente.cnpjCpf || cliente.email">
                          <span *ngIf="cliente.cnpjCpf">{{ cliente.cnpjCpf }}</span>
                          <span *ngIf="cliente.cnpjCpf && cliente.email"> | </span>
                          <span *ngIf="cliente.email">{{ cliente.email }}</span>
                        </div>
                      </div>
                    </ng-template>
                  </p-autoComplete>
                  
                  <span class="cliente-badge" *ngIf="clienteSelecionado?.id">
                    <i class="pi pi-check-circle"></i> {{ 'comercial.proposta.cliente.badgeSalvo' | translate }}
                  </span>
                  <button
                    pButton
                    type="button"
                    class="p-button-outlined p-button-sm mt-2"
                    icon="pi pi-cloud-download"
                    [label]="'comercial.proposta.bling.importBtn' | translate"
                    (click)="abrirBlingImport()"></button>
                </div>
              </div>

              <p-divider></p-divider>

              <form [formGroup]="clienteForm">
                <div class="form-section">
                  <div class="section-header-with-action">
                    <h3><i class="pi pi-id-card"></i> {{ 'comercial.proposta.cliente.secDados' | translate }}</h3>
                    <button pButton [label]="'comercial.proposta.cliente.btnSalvar' | translate" icon="pi pi-save" 
                            class="p-button-outlined p-button-success p-button-sm"
                            (click)="salvarCliente()"
                            [loading]="salvandoCliente"
                            [disabled]="!clienteForm.get('clienteNome')?.valid"
                            [pTooltip]="'comercial.proposta.cliente.tipSalvar' | translate"></button>
                  </div>
                  
                  <div class="form-grid">
                    <div class="form-field full-width">
                      <label for="clienteNome">{{ 'comercial.proposta.cliente.lblNomeRazao' | translate }}</label>
                      <input pInputText id="clienteNome" formControlName="clienteNome" 
                             [placeholder]="'comercial.proposta.cliente.phNome' | translate" class="w-full">
                    </div>
                    
                    <div class="form-field">
                      <label for="clienteCnpjCpf">{{ 'comercial.proposta.cliente.lblCnpjCpf' | translate }}</label>
                      <input pInputText id="clienteCnpjCpf" formControlName="clienteCnpjCpf" 
                             [placeholder]="'comercial.proposta.cliente.phCnpj' | translate" class="w-full">
                    </div>
                    
                    <div class="form-field">
                      <label for="clienteContato">{{ 'comercial.proposta.cliente.lblPessoaContato' | translate }}</label>
                      <input pInputText id="clienteContato" formControlName="clienteContato" 
                             [placeholder]="'comercial.proposta.cliente.phContatoNome' | translate" class="w-full">
                    </div>
                    
                    <div class="form-field">
                      <label for="clienteEmail">{{ 'comercial.proposta.cliente.lblEmailFld' | translate }}</label>
                      <input pInputText id="clienteEmail" formControlName="clienteEmail" 
                             type="email" [placeholder]="'comercial.proposta.cliente.phEmail' | translate" class="w-full">
                    </div>
                    
                    <div class="form-field">
                      <label for="clienteTelefone">{{ 'comercial.proposta.cliente.lblTelFld' | translate }}</label>
                      <input pInputText id="clienteTelefone" formControlName="clienteTelefone" 
                             [placeholder]="'comercial.proposta.cliente.phTel' | translate" class="w-full">
                    </div>
                  </div>
                </div>

                <p-divider></p-divider>

                <div class="form-section">
                  <h3><i class="pi pi-map-marker"></i> {{ 'comercial.proposta.cliente.secEndereco' | translate }}</h3>
                  
                  <div class="form-grid">
                    <div class="form-field full-width">
                      <label for="clienteEndereco">{{ 'comercial.proposta.cliente.lblEnderecoFld' | translate }}</label>
                      <input pInputText id="clienteEndereco" formControlName="clienteEndereco" 
                             [placeholder]="'comercial.proposta.cliente.phEndereco' | translate" class="w-full">
                    </div>
                    
                    <div class="form-field">
                      <label for="clienteCidade">{{ 'comercial.proposta.cliente.lblCidadeFld' | translate }}</label>
                      <input pInputText id="clienteCidade" formControlName="clienteCidade" 
                             [placeholder]="'comercial.proposta.cliente.phCidade' | translate" class="w-full">
                    </div>
                    
                    <div class="form-field">
                      <label for="clienteEstado">{{ 'comercial.proposta.cliente.lblEstadoFld' | translate }}</label>
                      <p-dropdown id="clienteEstado" formControlName="clienteEstado"
                                  [options]="estados" optionLabel="nome" optionValue="sigla"
                                  [placeholder]="'comercial.proposta.cliente.phUfPh' | translate" [filter]="true"
                                  class="w-full">
                      </p-dropdown>
                    </div>
                    
                    <div class="form-field">
                      <label for="clienteCep">{{ 'comercial.proposta.cliente.lblCepFld' | translate }}</label>
                      <input pInputText id="clienteCep" formControlName="clienteCep" 
                             [placeholder]="'comercial.proposta.cliente.phCep' | translate" class="w-full">
                    </div>
                  </div>
                </div>

                <p-divider></p-divider>

                <div class="form-section">
                  <h3><i class="pi pi-info-circle"></i> {{ 'comercial.proposta.cliente.secObsTit' | translate }}</h3>
                  
                  <div class="form-grid">
                    <div class="form-field full-width">
                      <label for="clienteObservacao">{{ 'comercial.proposta.cliente.lblObsFld' | translate }}</label>
                      <textarea pInputTextarea id="clienteObservacao" formControlName="clienteObservacao" 
                                [placeholder]="'comercial.proposta.cliente.obsPh' | translate"
                                [rows]="4" class="w-full"
                                [maxlength]="5000"></textarea>
                      <small class="char-counter">
                        {{ 'comercial.proposta.cliente.counter' | translate:{ n: '' + (clienteForm.get('clienteObservacao')?.value?.length || 0) } }}
                      </small>
                    </div>
                  </div>
                </div>
              </form>
              
              <div class="tab-actions">
                <button pButton [label]="'comercial.proposta.btn.voltarTab' | translate" icon="pi pi-arrow-left"
                        (click)="prevTab()" class="p-button-outlined"></button>
                <button pButton [label]="'comercial.proposta.btn.proxProposta' | translate" icon="pi pi-arrow-right" iconPos="right"
                        (click)="nextTab()" class="p-button-primary"></button>
              </div>
            </div>
          </p-tabPanel>

          <!-- Tab Proposta -->
          <p-tabPanel>
            <ng-template pTemplate="header">
              <i class="pi pi-file tab-icon"></i>
              <span>{{ 'comercial.proposta.tab.proposta' | translate }}</span>
            </ng-template>
            
            <div class="tab-content proposta-tab">
              <div class="proposta-preview-container">
                <div class="proposta-preview" #propostaPreview>
                  <div class="proposta-header">
                    <div class="company-logo">
                      <div class="logo-container">
                        <!-- Logo Aero Suite -->
                        <img [src]="previewLogoSrc()"
                             [attr.alt]="previewEmpresaTitulo()"
                             class="logo"
                             style="max-width: 80px; max-height: 80px; height: auto;">
                      </div>
                      <div class="company-info">
                        <h2>{{ previewEmpresaTitulo() }}</h2>
                        <p *ngIf="previewEmpresaSubtitulo()" class="company-tagline">{{ previewEmpresaSubtitulo() }}</p>
                      </div>
                    </div>
                    <div class="proposta-info">
                      <h1>{{ 'comercial.proposta.preview.docTitulo' | translate }}</h1>
                      <p class="numero">{{ proposta?.numeroProposta || ('comercial.proposta.preview.numPlaceholder' | translate) }}</p>
                      <p class="data">{{ 'comercial.proposta.preview.prefixoData' | translate }} {{ getDataFormatada() }}</p>
                    </div>
                  </div>

                  <div class="proposta-body">
                    <div class="proposta-section cliente-section">
                      <h3><i class="pi pi-user"></i> {{ 'comercial.proposta.preview.secCliente' | translate }}</h3>
                      <div class="section-content">
                        <p><strong>{{ clienteForm.get('clienteNome')?.value || ('comercial.proposta.preview.nomeFallback' | translate) }}</strong></p>
                        <p *ngIf="clienteForm.get('clienteCnpjCpf')?.value">{{ 'comercial.proposta.preview.lblDocumento' | translate }} {{ clienteForm.get('clienteCnpjCpf')?.value }}</p>
                        <p *ngIf="clienteForm.get('clienteContato')?.value">{{ 'comercial.proposta.preview.lblContato' | translate }} {{ clienteForm.get('clienteContato')?.value }}</p>
                        <p *ngIf="clienteForm.get('clienteEmail')?.value">{{ 'comercial.proposta.preview.lblMail' | translate }} {{ clienteForm.get('clienteEmail')?.value }}</p>
                        <p *ngIf="clienteForm.get('clienteTelefone')?.value">{{ 'comercial.proposta.preview.lblFone' | translate }} {{ clienteForm.get('clienteTelefone')?.value }}</p>
                        <p *ngIf="getEnderecoCompleto()">{{ getEnderecoCompleto() }}</p>
                        <p *ngIf="clienteForm.get('clienteObservacao')?.value" class="cliente-observacao">
                          <strong>{{ 'comercial.proposta.preview.obsTit' | translate }}</strong> {{ clienteForm.get('clienteObservacao')?.value }}
                        </p>
                      </div>
                    </div>

                    <div class="proposta-section produto-section">
                      <h3><i class="pi pi-box"></i> {{ 'comercial.proposta.preview.secProdutos' | translate }}</h3>
                      
                      <!-- Tabela de Múltiplos Produtos -->
                      <table class="produto-table produtos-multiplos" *ngIf="propostaItems.length > 0">
                        <thead>
                          <tr>
                            <th class="col-item">{{ 'comercial.proposta.preview.colHash' | translate }}</th>
                            <th class="col-descricao">{{ 'comercial.proposta.preview.colDesc' | translate }}</th>
                            <th class="col-pn">{{ 'comercial.proposta.preview.colPn' | translate }}</th>
                            <th class="col-sn">{{ 'comercial.proposta.preview.colSn' | translate }}</th>
                            <th class="col-qtd">{{ 'comercial.proposta.preview.colQtd' | translate }}</th>
                            <th class="col-valor" style="text-align: right;">{{ 'comercial.proposta.preview.colValorUnit' | translate }}</th>
                            <th class="col-total" style="text-align: right;">{{ 'comercial.proposta.preview.colTotal' | translate }}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr *ngFor="let item of propostaItems; let i = index">
                            <td class="col-item">{{ i + 1 }}</td>
                            <td class="col-descricao">
                              <strong>{{ item.product.name }}</strong>
                              <br *ngIf="item.product.description">
                              <small *ngIf="item.product.description">{{ item.product.description | slice:0:80 }}</small>
                            </td>
                            <td class="col-pn">{{ (item.produtoPn || item.product.productpn) || '-' }}</td>
                            <td class="col-sn">{{ item.produtoSn || '-' }}</td>
                            <td class="col-qtd">{{ item.quantidade }}</td>
                            <td class="col-valor" style="text-align: right;">{{ getItemUnitPriceDisplay(item) | localeMoney:getSelectedCurrencyCode():propostaMoneyPipeOpts }}</td>
                            <td class="col-total valor" style="text-align: right;">{{ getItemTotalDisplay(item) | localeMoney:getSelectedCurrencyCode():propostaMoneyPipeOpts }}</td>
                          </tr>
                        </tbody>
                        <tfoot>
                          <!-- Linha de Subtotal Produtos -->
                          <tr class="subtotal-row">
                            <td colspan="5" style="text-align: right; font-weight: 500; color: #64748b; padding: 10px 12px;">
                              {{ 'comercial.proposta.totals.subtotalProd' | translate:{ cur: localeCurrency.getDisplayCurrency() } }}
                            </td>
                            <td colspan="2" style="text-align: right; font-weight: 600; color: #334155; padding: 10px 12px;">
                              {{ getPropostaTotalValueInSelectedCurrency() | localeMoney:getSelectedCurrencyCode():propostaMoneyPipeOpts }}
                            </td>
                          </tr>
                          
                          <!-- Linha de Desconto (se houver) -->
                          <tr class="discount-row" *ngIf="showDiscount && getDiscountValueInSelectedCurrency() > 0">
                            <td colspan="5" style="text-align: right; font-weight: 500; color: #dc2626; padding: 8px 12px; background: #fef2f2;">
                              <i class="pi pi-tag" style="margin-right: 6px; font-size: 12px;"></i>
                              {{ tituloLinhaDesconto() }}
                            </td>
                            <td colspan="2" style="text-align: right; font-weight: 700; color: #dc2626; padding: 8px 12px; background: #fef2f2;">
                              - {{ getDiscountValueInSelectedCurrency() | localeMoney:getSelectedCurrencyCode():propostaMoneyPipeOpts }}
                            </td>
                          </tr>
                          
                          <!-- Subtotal Produtos com Desconto -->
                          <tr class="subtotal-row" *ngIf="showDiscount && getDiscountValueInSelectedCurrency() > 0">
                            <td colspan="5" style="text-align: right; font-weight: 500; color: #64748b; padding: 10px 12px;">
                              {{ 'comercial.proposta.totals.subtotalAposDesc' | translate:{ cur: localeCurrency.getDisplayCurrency() } }}
                            </td>
                            <td colspan="2" style="text-align: right; font-weight: 600; color: #334155; padding: 10px 12px;">
                              {{ getFinalTotalValueInSelectedCurrency() | localeMoney:getSelectedCurrencyCode():propostaMoneyPipeOpts }}
                            </td>
                          </tr>

                          <!-- Custos Adicionais (Frete e Mão de Obra) -->
                          <tr class="cost-row" *ngIf="freteBrl > 0">
                            <td colspan="5" style="text-align: right; font-weight: 500; color: #64748b; padding: 8px 12px; background: #f0fdf4;">
                              {{ getFreteLabel() }}:
                            </td>
                            <td colspan="2" style="text-align: right; font-weight: 600; color: #16a34a; padding: 8px 12px; background: #f0fdf4;">
                              {{ getFreteInSelectedCurrency() | localeMoney:getSelectedCurrencyCode():propostaMoneyPipeOpts }}
                            </td>
                          </tr>
                          <tr class="cost-row" *ngIf="maoDeObraBrl > 0">
                            <td colspan="5" style="text-align: right; font-weight: 500; color: #64748b; padding: 8px 12px; background: #f0fdf4;">
                              {{ getMaoDeObraLabel() }}:
                            </td>
                            <td colspan="2" style="text-align: right; font-weight: 600; color: #16a34a; padding: 8px 12px; background: #f0fdf4;">
                              {{ getMaoDeObraInSelectedCurrency() | localeMoney:getSelectedCurrencyCode():propostaMoneyPipeOpts }}
                            </td>
                          </tr>
                          
                          <!-- Linha de Total Geral -->
                          <tr class="final-total-row">
                            <td colspan="5" style="text-align: right; font-weight: 700; color: white; padding: 14px 12px; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); font-size: 15px;">
                              <i class="pi pi-dollar" style="margin-right: 8px;"></i>
                              {{ 'comercial.proposta.lbl.totalGeralStrong' | translate:{ cur: localeCurrency.getDisplayCurrency() } }}
                            </td>
                            <td colspan="2" style="text-align: right; font-weight: 700; color: white; padding: 14px 12px; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); font-size: 18px;">
                              {{ getTotalGeralInSelectedCurrency() | localeMoney:getSelectedCurrencyCode():propostaMoneyPipeOpts }}
                            </td>
                          </tr>
                        </tfoot>
                      </table>

                      <!-- Fallback para modo antigo (sem produtos selecionados) -->
                      <table class="produto-table" *ngIf="propostaItems.length === 0">
                        <thead>
                          <tr>
                            <th>{{ 'comercial.proposta.preview.colDesc' | translate }}</th>
                            <th>{{ 'comercial.proposta.preview.colPn' | translate }}</th>
                            <th>{{ 'comercial.proposta.preview.colSn' | translate }}</th>
                            <th>{{ 'comercial.proposta.preview.colValor' | translate }}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>
                              <strong>{{ produtoForm.get('produtoNome')?.value || ('comercial.proposta.preview.nomeProdFallback' | translate) }}</strong>
                              <br><small>{{ produtoForm.get('tipoServicoNome')?.value || tipoServicoSelecionado?.nome || '' }}</small>
                            </td>
                            <td>{{ produtoForm.get('produtoPn')?.value || '-' }}</td>
                            <td>{{ produtoForm.get('produtoSn')?.value || '-' }}</td>
                            <td class="valor">{{ getValorFormatado() }}</td>
                          </tr>
                        </tbody>
                      </table>
                      
                      <div class="produto-details" *ngIf="produtoForm.get('aplicacaoMotor')?.value || produtoForm.get('aeronavePrefixo')?.value">
                        <p *ngIf="produtoForm.get('aplicacaoMotor')?.value">
                          <strong>{{ 'comercial.proposta.preview.detalheAprMotor' | translate }}</strong> {{ produtoForm.get('aplicacaoMotor')?.value }}
                        </p>
                        <p *ngIf="produtoForm.get('aeronavePrefixo')?.value">
                          <strong>{{ 'comercial.proposta.preview.detalheAprAero' | translate }}</strong> {{ produtoForm.get('aeronavePrefixo')?.value }}
                        </p>
                        <p *ngIf="produtoForm.get('produtoManual')?.value">
                          <strong>{{ 'comercial.proposta.preview.detalheManual' | translate }}</strong> {{ produtoForm.get('produtoManual')?.value }}
                        </p>
                      </div>

                      <div class="servico-descricao" *ngIf="produtoForm.get('servicoExecutado')?.value">
                        <h4>{{ 'comercial.proposta.preview.servicoTitulo' | translate }}</h4>
                        <p>{{ produtoForm.get('servicoExecutado')?.value }}</p>
                      </div>
                    </div>

                    <div class="proposta-section condicoes-section">
                      <h3><i class="pi pi-list"></i> {{ 'comercial.proposta.preview.secCondCom' | translate }}</h3>
                      <div class="condicoes-grid">
                        <div class="condicao-item">
                          <label>{{ 'comercial.proposta.preview.condPrazo' | translate }}</label>
                          <span>{{ propostaForm.get('prazoEntrega')?.value || ('comercial.proposta.aCombinar' | translate) }}</span>
                        </div>
                        <div class="condicao-item">
                          <label>{{ 'comercial.proposta.preview.condPagto' | translate }}</label>
                          <span>{{ propostaForm.get('formaPagamento')?.value || ('comercial.proposta.aCombinar' | translate) }}</span>
                        </div>
                        <div class="condicao-item">
                          <label>{{ 'comercial.proposta.preview.condValidade' | translate }}</label>
                          <span>{{ getValidadeFormatada() }}</span>
                        </div>
                      </div>
                    </div>

                    <div class="proposta-section condicoes-gerais-section informacoes-gerais-section">
                      <h3><i class="pi pi-file"></i> {{ 'comercial.proposta.preview.secCondGerais' | translate }}</h3>
                      <div class="informacoes-gerais-grid">
                        <div class="info-geral-item" *ngFor="let item of condicoesGeraisItems; let i = index">
                          <span class="info-geral-num">{{ i + 1 }}.</span>
                          <span class="info-geral-text">{{ item }}</span>
                        </div>
                      </div>
                    </div>

                    <div class="proposta-section proposta-observacao-section" *ngIf="hasObservacaoProposta()">
                      <h3><i class="pi pi-exclamation-circle"></i> {{ 'comercial.proposta.preview.secObs' | translate }}</h3>
                      <div class="proposta-observacao-box">{{ propostaForm.get('observacoes')?.value }}</div>
                    </div>
                  </div>

                  <div class="proposta-footer">
                    <div class="assinatura" (click)="abrirModalAssinatura()">
                      <div class="linha-assinatura" [class.has-signature]="signatureData">
                        <span 
                          *ngIf="signatureData" 
                          class="signature-display"
                          [ngStyle]="getSignatureDisplayStyle()">
                          {{ signatureData.name }}
                        </span>
                        <span *ngIf="!signatureData" class="add-signature-hint">
                          <i class="pi pi-pencil"></i> {{ 'comercial.proposta.assinatura.hint' | translate }}
                        </span>
                      </div>
                      <p>{{ 'comercial.proposta.assinatura.rodape' | translate }}</p>
                      <small *ngIf="signatureData" class="signature-info">
                        {{ 'comercial.proposta.assinatura.por' | translate:{ nome: signatureData.name } }}
                      </small>
                    </div>
                    <div class="contato-footer">
                      <p>Tel: {{ previewFooterTelefone() }} | E-mail: {{ previewFooterEmail() }}</p>
                      <p *ngIf="previewFooterSite()">{{ previewFooterSite() }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="proposta-form-sidebar">
                <form [formGroup]="propostaForm">
                  <div class="form-section">
                    <h3><i class="pi pi-calendar"></i> {{ 'comercial.proposta.sidebar.secDatas' | translate }}</h3>
                    <div class="form-field">
                      <label for="dataProposta">{{ 'comercial.proposta.sidebar.dataProposta' | translate }}</label>
                      <p-calendar id="dataProposta" formControlName="dataProposta"
                                  dateFormat="dd/mm/yy" [showIcon]="true" class="w-full"></p-calendar>
                    </div>
                    <div class="form-field">
                      <label for="validadeProposta">{{ 'comercial.proposta.sidebar.validade' | translate }}</label>
                      <p-calendar id="validadeProposta" formControlName="validadeProposta"
                                  dateFormat="dd/mm/yy" [showIcon]="true" class="w-full"></p-calendar>
                    </div>
                  </div>

                  <div class="form-section">
                    <h3><i class="pi pi-money-bill"></i> {{ 'comercial.proposta.sidebar.secCond' | translate }}</h3>
                    <div class="form-field">
                      <label for="prazoEntrega">{{ 'comercial.proposta.sidebar.lblPrazo' | translate }}</label>
                      <input pInputText id="prazoEntrega" formControlName="prazoEntrega" 
                             [placeholder]="'comercial.proposta.cond.phPrazo' | translate" class="w-full">
                    </div>
                    <div class="form-field">
                      <label for="formaPagamento">{{ 'comercial.proposta.sidebar.lblPgto' | translate }}</label>
                      <input pInputText id="formaPagamento" formControlName="formaPagamento" 
                             [placeholder]="'comercial.proposta.cond.phPgto' | translate" class="w-full">
                    </div>
                    <div class="form-field form-field-observacao">
                      <label for="observacoesProposta">{{ 'comercial.proposta.sidebar.lblObs' | translate }}</label>
                      <textarea pInputTextarea id="observacoesProposta" formControlName="observacoes"
                                rows="4" maxlength="8000" [autoResize]="true"
                                [placeholder]="'comercial.proposta.cond.notePh' | translate"
                                class="w-full observacao-proposta-input"></textarea>
                      <small class="field-hint">{{ 'comercial.proposta.sidebar.hintObs' | translate }}</small>
                    </div>
                  </div>

                  <div class="form-section" *ngIf="camposExtrasOn">
                    <h3><i class="pi pi-sliders-h"></i> {{ 'comercial.proposta.extras.secTitle' | translate }}</h3>
                    <div class="form-field">
                      <label for="referenciaCliente">{{ 'comercial.proposta.extras.referenciaCliente' | translate }}</label>
                      <input pInputText id="referenciaCliente" formControlName="referenciaCliente" maxlength="120" class="w-full" />
                    </div>
                    <div class="form-field">
                      <label for="contatoTecnico">{{ 'comercial.proposta.extras.contatoTecnico' | translate }}</label>
                      <input pInputText id="contatoTecnico" formControlName="contatoTecnico" maxlength="150" class="w-full" />
                    </div>
                    <div class="form-field">
                      <label for="centroCusto">{{ 'comercial.proposta.extras.centroCusto' | translate }}</label>
                      <input pInputText id="centroCusto" formControlName="centroCusto" maxlength="80" class="w-full" />
                    </div>
                  </div>

                </form>
              </div>
            </div>
              
            <div class="tab-actions main-actions">
              <button pButton [label]="'comercial.proposta.btn.voltarTab' | translate" icon="pi pi-arrow-left"
                      (click)="prevTab()" class="p-button-outlined main-actions-back"></button>
              <div class="main-actions-toolbar">
                <button pButton icon="pi pi-pencil"
                        (click)="abrirModalAssinatura()" class="p-button-outlined p-button-help toolbar-icon-btn"
                        [attr.aria-label]="'comercial.proposta.btn.assinar' | translate"
                        [pTooltip]="'comercial.proposta.btn.assinar' | translate"></button>
                <button *ngIf="canEnviarPedidoBling()" pButton icon="pi pi-shopping-cart"
                        (click)="confirmarPedidoBling()" class="p-button-outlined p-button-warning toolbar-icon-btn"
                        [attr.aria-label]="'comercial.proposta.bling.pedidoBtn' | translate"
                        [pTooltip]="'comercial.proposta.bling.pedidoBtn' | translate"
                        [loading]="gerandoPedidoBling"></button>
                <button *ngIf="canGerarOs()" pButton icon="pi pi-briefcase"
                        (click)="confirmarGerarOs()" class="p-button-outlined p-button-help toolbar-icon-btn"
                        [attr.aria-label]="'comercial.proposta.btn.gerarOs' | translate"
                        [pTooltip]="'comercial.proposta.btn.gerarOs' | translate"
                        [loading]="gerandoOs"></button>
                <button pButton [label]="'comercial.proposta.btn.rascunho' | translate" icon="pi pi-save"
                        (click)="salvar('RASCUNHO')" class="p-button-secondary"
                        [loading]="saving"></button>
                <button pButton [label]="'comercial.proposta.btn.print' | translate" icon="pi pi-print"
                        (click)="abrirModalContato('imprimir')" class="p-button-info"></button>
                <button pButton [label]="'comercial.proposta.btn.whatsapp' | translate" icon="pi pi-whatsapp"
                        (click)="abrirDialogEnvioWhatsApp()" class="p-button-success p-button-outlined"
                        [disabled]="!isProdutoValid || !isClienteValid"
                        [loading]="enviandoWhatsApp"></button>
                <button *ngIf="podeAcaoPortal()" pButton [label]="'comercial.proposta.btn.portal' | translate" icon="pi pi-globe"
                        (click)="abrirDialogPortal()" class="p-button-outlined p-button-info"
                        [disabled]="!isProdutoValid || !isClienteValid"></button>
                <button pButton [label]="'comercial.proposta.btn.enviar' | translate" icon="pi pi-send"
                        (click)="abrirDialogEnvioEmail()" class="p-button-success"
                        [disabled]="!isProdutoValid || !isClienteValid"></button>
              </div>
            </div>
          </p-tabPanel>

          <!-- Tab Portal (edição) -->
          <p-tabPanel *ngIf="isEditMode && proposta?.id">
            <ng-template pTemplate="header">
              <i class="pi pi-globe tab-icon"></i>
              <span>{{ 'comercial.proposta.tab.portal' | translate }}</span>
            </ng-template>
            <div class="tab-content portal-tab">
              <p class="portal-intro">{{ 'comercial.proposta.portal.intro' | translate }}</p>

              <div class="portal-section portal-publicacao">
                <h3><i class="pi pi-globe"></i> {{ 'comercial.proposta.portal.secPublicacao' | translate }}</h3>
                <p-tag *ngIf="propostaVisivelNoPortal(proposta?.status)"
                       severity="success" [value]="'comercial.proposta.portal.checkVisible' | translate"></p-tag>
                <p-tag *ngIf="!propostaVisivelNoPortal(proposta?.status)"
                       severity="warning" [value]="'comercial.proposta.portal.notVisible' | translate"></p-tag>
                <button *ngIf="podeGerenciarPortalTab()" pButton type="button" icon="pi pi-globe"
                        [label]="'comercial.proposta.btn.portal' | translate"
                        (click)="abrirDialogPortal()" class="p-button-outlined p-button-info"></button>
              </div>

              <p-divider></p-divider>

              <div class="portal-section">
                <h3><i class="pi pi-plus-circle"></i> {{ 'comercial.proposta.portal.secAditivos' | translate }}</h3>
                <div class="portal-aditivo-row" *ngFor="let a of portalAditivos">
                  <div class="portal-aditivo-main">
                    <strong>{{ a.descricao }}</strong>
                    <span *ngIf="a.valor != null"> — {{ a.valor | localeMoney:'BRL':propostaMoneyPipeOpts }}</span>
                    <p-tag [value]="a.status || '—'" class="portal-tag"></p-tag>
                    <small>{{ 'comercial.proposta.portal.lblOrigem' | translate }}:
                      {{ a.solicitadoPeloCliente ? ('comercial.proposta.portal.origemCliente' | translate) : ('comercial.proposta.portal.origemOficina' | translate) }}</small>
                  </div>
                </div>
                <p *ngIf="!portalAditivos.length" class="portal-empty">{{ 'comercial.proposta.portal.emptyAditivos' | translate }}</p>

                <div class="portal-aditivo-form" *ngIf="proposta?.status === 'APROVADA'">
                  <h4>{{ 'comercial.proposta.portal.formTitulo' | translate }}</h4>
                  <label>{{ 'comercial.proposta.portal.lblDescricao' | translate }}</label>
                  <textarea pInputTextarea [(ngModel)]="portalAditivoDesc" rows="2"
                            [placeholder]="'comercial.proposta.portal.phDescricao' | translate"></textarea>
                  <label>{{ 'comercial.proposta.portal.lblValor' | translate }}</label>
                  <p-inputNumber [(ngModel)]="portalAditivoValor" mode="currency" currency="BRL" locale="pt-BR"></p-inputNumber>
                  <button pButton type="button" icon="pi pi-send"
                          [label]="'comercial.proposta.portal.btnEnviarAditivo' | translate"
                          (click)="enviarAditivoOficina()" [loading]="portalSalvandoAditivo"
                          [disabled]="!portalAditivoDesc.trim()"></button>
                </div>
                <p *ngIf="proposta?.status !== 'APROVADA'" class="portal-hint">
                  <i class="pi pi-info-circle"></i> {{ 'comercial.proposta.portal.hintAprovada' | translate }}
                </p>
              </div>

              <p-divider></p-divider>

              <div class="portal-section">
                <h3><i class="pi pi-paperclip"></i> {{ 'comercial.proposta.portal.secAnexos' | translate }}</h3>
                <ul class="portal-anexos" *ngIf="portalAnexos.length">
                  <li *ngFor="let an of portalAnexos">
                    <span>{{ an.nomeArquivo }}</span>
                    <small *ngIf="an.tamanhoBytes">({{ formatBytes(an.tamanhoBytes) }})</small>
                    <button pButton type="button" icon="pi pi-download" class="p-button-text p-button-sm"
                            [label]="'comercial.proposta.portal.btnDownload' | translate"
                            (click)="baixarAnexoPortal(an)"></button>
                  </li>
                </ul>
                <p *ngIf="!portalAnexos.length" class="portal-empty">{{ 'comercial.proposta.portal.emptyAnexos' | translate }}</p>
              </div>

              <div class="tab-actions">
                <button pButton [label]="'comercial.proposta.btn.voltarTab' | translate" icon="pi pi-arrow-left"
                        (click)="prevTab()" class="p-button-outlined"></button>
              </div>
            </div>
          </p-tabPanel>
        </p-tabView>
      </div>
    </div>

    <!-- Modal de Assinatura -->
    <app-signature-modal
      [(visible)]="showSignatureModal"
      [initialName]="signatureData?.name || ''"
      (signatureConfirmed)="onSignatureConfirmed($event)"
      (cancelled)="onSignatureCancelled()">
    </app-signature-modal>

    <!-- Modal de Seleção de Produtos -->
    <app-product-selector
      [(visible)]="showProductSelector"
      [existingItems]="propostaItems"
      [proposalCurrency]="proposalCurrencyAsMoney()"
      (productsSelected)="onProductsSelected($event)"
      (cancelled)="onProductSelectorCancelled()">
    </app-product-selector>

    <!-- Modal de Informações de Contato -->
    <p-dialog styleClass="as-hero-dialog contato-info-dialog" [(visible)]="showContatoModal"
              [header]="'comercial.proposta.contato.dialogTitle' | translate"
              [modal]="true"
              [style]="{ width: '450px' }"
              [closable]="true"
             >
      
      <div class="contato-info-content">
        <p class="info-text" *ngIf="pendingAction !== 'whatsapp'">
          <i class="pi pi-info-circle"></i>
          {{ 'comercial.proposta.contato.intro' | translate }}
        </p>
        <p class="info-text" *ngIf="pendingAction === 'whatsapp'">
          <i class="pi pi-whatsapp"></i>
          {{ 'comercial.proposta.contato.introWhatsapp' | translate }}
        </p>
        
        <div class="form-field">
          <label for="contatoNome">{{ 'comercial.proposta.contato.lblResp' | translate }}</label>
          <input pInputText id="contatoNome" 
                 [(ngModel)]="contatoInfo.nome"
                 [placeholder]="'comercial.proposta.contato.phNome' | translate" />
        </div>
        
        <div class="form-field">
          <label for="contatoTelefone">{{ 'comercial.proposta.cliente.lblTelFld' | translate }}</label>
          <input pInputText id="contatoTelefone" 
                 [(ngModel)]="contatoInfo.telefone"
                 [placeholder]="'comercial.proposta.contato.phTel' | translate" />
        </div>
        
        <div class="form-field">
          <label for="contatoEmail">{{ 'comercial.proposta.cliente.lblEmailFld' | translate }}</label>
          <input pInputText id="contatoEmail" 
                 [(ngModel)]="contatoInfo.email"
                 [placeholder]="'comercial.proposta.contato.phEmail' | translate" />
        </div>
      </div>
      
      <ng-template pTemplate="footer">
        <button pButton [label]="'comercial.proposta.dialog.btnCancel' | translate" icon="pi pi-times" 
                class="p-button-text" (click)="cancelarContato()"></button>
        <button pButton [label]="'comercial.proposta.dialog.btnContinuar' | translate" icon="pi pi-check" 
                (click)="confirmarContato()" [disabled]="isContatoModalConfirmDisabled()"></button>
      </ng-template>
    </p-dialog>

    <!-- Dialog de Envio de Email -->
    <p-dialog styleClass="as-hero-dialog envio-email-dialog" [(visible)]="showEnvioEmailDialog" 
              [header]="'comercial.proposta.email.dialogTitle' | translate" 
              [modal]="true" 
              [style]="{width: '600px'}"
              [closable]="true"
              [draggable]="false"
              [resizable]="false"
              [blockScroll]="true"
             >
      
      <div class="envio-email-content">
        <!-- Status de assinatura -->
        <div class="signature-status" [class.has-signature]="signatureData">
          <div class="status-icon">
            <i [class]="signatureData ? 'pi pi-check-circle' : 'pi pi-exclamation-circle'"></i>
          </div>
          <div class="status-text">
            <strong *ngIf="signatureData">{{ 'comercial.proposta.email.statusAssinado' | translate:{ nome: signatureData.name } }}</strong>
            <strong *ngIf="!signatureData">{{ 'comercial.proposta.email.statusNaoAssinado' | translate }}</strong>
            <p *ngIf="!signatureData">{{ 'comercial.proposta.email.recomendaAssinatura' | translate }}</p>
          </div>
          <button pButton 
                  type="button"
                  [label]="signatureData ? ('comercial.proposta.email.btnAlterarAss' | translate) : ('comercial.proposta.email.btnAddAss' | translate)"
                  [icon]="signatureData ? 'pi pi-pencil' : 'pi pi-plus'"
                  class="p-button-outlined p-button-sm"
                  (click)="abrirModalAssinatura()">
          </button>
        </div>

        <!-- Campos do email -->
        <div class="email-fields">
          <div class="form-field">
            <label for="emailDestino">
              <i class="pi pi-envelope"></i>
              {{ 'comercial.proposta.email.destLbl' | translate }}
            </label>
            <input pInputText id="emailDestino" [(ngModel)]="emailEnvio.emailDestino" 
                   [placeholder]="clienteForm.get('clienteEmail')?.value || ('comercial.proposta.cliente.phEmail' | translate)"
                   class="w-full">
            <small class="field-hint" *ngIf="clienteForm.get('clienteEmail')?.value">
              {{ 'comercial.proposta.email.hintCliente' | translate }} {{ clienteForm.get('clienteEmail')?.value }}
            </small>
          </div>

          <div class="form-field">
            <label for="assuntoEmail">
              <i class="pi pi-tag"></i>
              {{ 'comercial.proposta.email.assuntoLbl' | translate }}
            </label>
            <input pInputText id="assuntoEmail" [(ngModel)]="emailEnvio.assunto" 
                   [placeholder]="('comercial.proposta.email.phAssuntoPrefix' | translate) + (proposta?.numeroProposta || '')"
                   class="w-full">
          </div>

          <div class="form-field">
            <label>
              <i class="pi pi-paperclip"></i>
              {{ 'comercial.proposta.email.formaEnvio' | translate }}
            </label>
            <div class="tipo-envio-options">
              <div class="radio-option" (click)="emailEnvio.tipoEnvio = 'corpo'; onTipoEnvioChanged()">
                <p-radioButton inputId="corpo" name="tipoEnvio" value="corpo" [(ngModel)]="emailEnvio.tipoEnvio" (onChange)="onTipoEnvioChanged()"></p-radioButton>
                <label for="corpo" class="radio-label">
                  <i class="pi pi-file"></i>
                  <span>{{ 'comercial.proposta.email.corpoTit' | translate }}</span>
                  <small>{{ 'comercial.proposta.email.corpoSub' | translate }}</small>
                </label>
              </div>
              <div class="radio-option" (click)="emailEnvio.tipoEnvio = 'anexo'; onTipoEnvioChanged()">
                <p-radioButton inputId="anexo" name="tipoEnvio" value="anexo" [(ngModel)]="emailEnvio.tipoEnvio" (onChange)="onTipoEnvioChanged()"></p-radioButton>
                <label for="anexo" class="radio-label">
                  <i class="pi pi-paperclip"></i>
                  <span>{{ 'comercial.proposta.email.anexoTit' | translate }}</span>
                  <small>{{ 'comercial.proposta.email.anexoSub' | translate }}</small>
                </label>
              </div>
            </div>
          </div>

          <div class="form-field">
            <label for="mensagemAdicional">
              <i class="pi pi-comment"></i>
              {{ 'comercial.proposta.email.msgTit' | translate }} <span *ngIf="emailEnvio.tipoEnvio === 'anexo'">{{ 'comercial.proposta.email.msgTitAuto' | translate }}</span>
            </label>
            <textarea pInputTextarea id="mensagemAdicional" [(ngModel)]="emailEnvio.mensagemAdicional"
                      [rows]="4" 
                      [readonly]="emailEnvio.tipoEnvio === 'anexo'"
                      [placeholder]="emailEnvio.tipoEnvio === 'anexo' ? ('comercial.proposta.email.phMsgGerada' | translate) : ('comercial.proposta.email.phMsgManual' | translate)"
                      class="w-full"></textarea>
            <small class="field-hint" *ngIf="emailEnvio.tipoEnvio === 'anexo'">
              {{ 'comercial.proposta.email.hintGeradaAuto' | translate }}
            </small>
          </div>
        </div>

        <!-- Preview resumido -->
        <div class="email-preview-summary">
          <h4><i class="pi pi-eye"></i> {{ 'comercial.proposta.email.resumo' | translate }}</h4>
          <div class="preview-items">
            <div class="preview-item">
              <span class="label">{{ 'comercial.proposta.email.lblClientePrev' | translate }}</span>
              <span class="value">{{ clienteForm.get('clienteNome')?.value || '-' }}</span>
            </div>
            <div class="preview-item">
              <span class="label">{{ 'comercial.proposta.email.lblProdutoPrev' | translate }}</span>
              <span class="value">{{ produtoForm.get('produtoNome')?.value || '-' }}</span>
            </div>
            <div class="preview-item">
              <span class="label">{{ 'comercial.proposta.email.lblValorPrev' | translate }}</span>
              <span class="value">{{ getValorFormatado() }}</span>
            </div>
          </div>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <div class="dialog-footer">
          <button pButton 
                  type="button"
                  [label]="'comercial.proposta.email.cancel' | translate" 
                  icon="pi pi-times"
                  class="p-button-text"
                  (click)="showEnvioEmailDialog = false">
          </button>
          <button pButton 
                  type="button"
                  [label]="'comercial.proposta.email.send' | translate" 
                  icon="pi pi-send"
                  class="p-button-success"
                  [loading]="enviandoEmail"
                  [disabled]="!canSendEmail()"
                  (click)="enviarEmail()">
          </button>
        </div>
      </ng-template>
    </p-dialog>

    <p-dialog
      styleClass="as-hero-dialog" [(visible)]="showBlingDialog"
      [modal]="true"
      [header]="'comercial.proposta.bling.dialogTitle' | translate"
      [style]="{ width: '560px' }">
      <p class="section-hint mb-2">{{ 'comercial.proposta.bling.dialogHint' | translate }}</p>
      <p class="text-sm text-color-secondary mb-2" *ngIf="blingStatusMessage">{{ blingStatusMessage }}</p>
      <div class="flex gap-2 mb-3">
        <input
          pInputText
          class="flex-1"
          [(ngModel)]="blingSearch"
          [placeholder]="'comercial.proposta.bling.searchPh' | translate"
          (keyup.enter)="buscarBlingContatos()" />
        <button
          pButton
          type="button"
          icon="pi pi-search"
          [label]="'comercial.proposta.bling.searchBtn' | translate"
          [loading]="blingLoading"
          (click)="buscarBlingContatos()"></button>
      </div>
      <div *ngIf="blingLoading" class="flex justify-content-center py-3">
        <p-progressSpinner strokeWidth="4" [style]="{ width: '40px', height: '40px' }"></p-progressSpinner>
      </div>
      <ul class="bling-contact-list" *ngIf="!blingLoading && blingContacts.length">
        <li *ngFor="let c of blingContacts">
          <div>
            <strong>{{ c.nome || ('comercial.proposta.bling.semNome' | translate) }}</strong>
            <div class="text-sm" *ngIf="c.email">{{ c.email }}</div>
            <div class="text-sm" *ngIf="c.telefone">{{ c.telefone }}</div>
            <div class="text-sm" *ngIf="c.cnpjCpf">{{ c.cnpjCpf }}</div>
          </div>
          <button
            pButton
            type="button"
            class="p-button-sm"
            icon="pi pi-check"
            [label]="blingApplyLabel(c)"
            (click)="aplicarBlingContact(c)"></button>
        </li>
      </ul>
      <p *ngIf="!blingLoading && !blingContacts.length && blingSearch.length >= 2" class="text-center py-3">
        {{ 'comercial.proposta.bling.empty' | translate }}
      </p>
      <ng-template pTemplate="footer">
        <button
          pButton
          type="button"
          class="p-button-text"
          [label]="'common.actions.cancel' | translate"
          (click)="showBlingDialog = false"></button>
      </ng-template>
    </p-dialog>

    <!-- Dialog de Sucesso de Envio -->
    <p-dialog styleClass="as-hero-dialog success-dialog" [(visible)]="showSuccessDialog" 
              [modal]="true" 
              [closable]="false"
              [style]="{width: '450px'}"
             >
      <div class="success-content">
        <div class="success-icon">
          <i class="pi pi-check-circle"></i>
        </div>
        <h2>{{ 'comercial.proposta.emailSuccess.title' | translate }}</h2>
        <p>{{ 'comercial.proposta.emailSuccess.lead' | translate }}</p>
        <strong>{{ emailEnvio.emailDestino }}</strong>
        <div class="success-actions">
          <button pButton 
                  type="button"
                  [label]="'comercial.proposta.success.voltarLista' | translate" 
                  icon="pi pi-list"
                  class="p-button-outlined"
                  (click)="voltarParaLista()">
          </button>
          <button pButton 
                  type="button"
                  [label]="'comercial.proposta.success.contEdit' | translate" 
                  icon="pi pi-pencil"
                  class="p-button-primary"
                  (click)="showSuccessDialog = false">
          </button>
        </div>
      </div>
    </p-dialog>

    <!-- Dialog: Galeria de Templates -->
    <p-dialog styleClass="as-hero-dialog" [(visible)]="showGaleriaTemplates" 
              [header]="'comercial.proposta.gallery.title' | translate" 
              [modal]="true" 
              [style]="{width: '900px', maxHeight: '80vh'}"
              [closable]="true">
      <div class="galeria-content">
        <div class="galeria-filtros">
          <span class="p-input-icon-left">
            <i class="pi pi-search"></i>
            <input type="text" pInputText [(ngModel)]="templateSearch" 
                   [placeholder]="'comercial.proposta.gallery.searchPh' | translate" (input)="filtrarTemplates()">
          </span>
          <p-dropdown [(ngModel)]="categoriaFiltro" [options]="categorias"
                      [placeholder]="'comercial.proposta.gallery.catPh' | translate" [showClear]="true"
                      (onChange)="filtrarTemplates()">
          </p-dropdown>
        </div>

        <div class="galeria-grid">
          <div class="galeria-item" 
               *ngFor="let template of templatesFiltrados"
               (click)="selecionarTemplate(template); showGaleriaTemplates = false">
            <div class="item-header">
              <span class="item-categoria" *ngIf="template.categoria">{{ template.categoria }}</span>
              <span class="item-uso" *ngIf="template.vezesUtilizado">
                <i class="pi pi-chart-line"></i> {{ template.vezesUtilizado }}
              </span>
            </div>
            <h4>{{ template.nomeTemplate }}</h4>
            <p class="item-produto">{{ template.produtoNome }}</p>
            <p class="item-servico" *ngIf="template.tipoServicoNome">{{ template.tipoServicoNome }}</p>
            <div class="item-footer">
              <span class="item-valor" *ngIf="template.produtoValorBase">
                {{ template.produtoValorBase | localeMoney:'BRL':propostaMoneyPipeOpts }}
              </span>
            </div>
          </div>
        </div>

        <div class="galeria-empty" *ngIf="templatesFiltrados.length === 0">
          <i class="pi pi-inbox"></i>
          <p>{{ 'comercial.proposta.gallery.empty' | translate }}</p>
        </div>
      </div>
    </p-dialog>

    <!-- Dialog: Salvar como Template -->
    <p-dialog styleClass="as-hero-dialog" [(visible)]="showSalvarTemplate" 
              [header]="'comercial.proposta.tplDialog.title' | translate" 
              [modal]="true" 
              [style]="{width: '500px'}"
              [closable]="true">
      <div class="salvar-template-content">
        <p class="dialog-description">
          {{ 'comercial.proposta.tplDialog.intro' | translate }}
        </p>
        
        <div class="form-field">
          <label for="nomeTemplate">{{ 'comercial.proposta.tplDialog.lblNome' | translate }}</label>
          <input pInputText id="nomeTemplate" [(ngModel)]="novoTemplate.nomeTemplate" 
                 [placeholder]="'comercial.proposta.tplDialog.nomePh' | translate" class="w-full">
        </div>
        
        <div class="form-field">
          <label for="descricaoTemplate">{{ 'comercial.proposta.tplDialog.lblDescricao' | translate }}</label>
          <textarea pInputTextarea id="descricaoTemplate" [(ngModel)]="novoTemplate.descricaoTemplate"
                    [rows]="3" [placeholder]="'comercial.proposta.tplDialog.descPh' | translate" class="w-full"></textarea>
        </div>
        
        <div class="form-field">
          <label for="categoriaTemplate">{{ 'comercial.proposta.tplDialog.lblCategoria' | translate }}</label>
          <p-dropdown id="categoriaTemplate" [(ngModel)]="novoTemplate.categoria"
                      [options]="categorias" [editable]="true"
                      [placeholder]="'comercial.proposta.tplDialog.catPh' | translate" class="w-full">
          </p-dropdown>
        </div>

        <div class="template-preview">
          <h5>{{ 'comercial.proposta.tplPreview.sec' | translate }}</h5>
          <ul>
            <li><strong>{{ 'comercial.proposta.tplPreview.lblProduto' | translate }}</strong> {{ produtoForm.get('produtoNome')?.value || '-' }}</li>
            <li><strong>{{ 'comercial.proposta.tplPreview.lblPnPrev' | translate }}</strong> {{ produtoForm.get('produtoPn')?.value || '-' }}</li>
            <li><strong>{{ 'comercial.proposta.tplPreview.lblServicoPrev' | translate }}</strong> {{ tipoServicoSelecionado?.nome || '-' }}</li>
            <li><strong>{{ 'comercial.proposta.tplPreview.lblValorPrev' | translate }}</strong> {{ getValorFormatado() }}</li>
            <li><strong>{{ 'comercial.proposta.tplPreview.lblPrazoPrev' | translate }}</strong> {{ propostaForm.get('prazoEntrega')?.value || '-' }}</li>
            <li><strong>{{ 'comercial.proposta.tplPreview.lblPgtoPrev' | translate }}</strong> {{ propostaForm.get('formaPagamento')?.value || '-' }}</li>
          </ul>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <button pButton [label]="'comercial.proposta.tplDialog.cancel' | translate" icon="pi pi-times" class="p-button-text"
                (click)="showSalvarTemplate = false"></button>
        <button pButton [label]="'comercial.proposta.tplDialog.save' | translate" icon="pi pi-check" 
                (click)="salvarTemplate()" [loading]="salvandoTemplate"
                [disabled]="!novoTemplate.nomeTemplate"></button>
      </ng-template>
    </p-dialog>

    <!-- Dialog: Disponibilizar no portal -->
    <app-proposta-portal-dialog
      [(visible)]="showPortalDialog"
      [propostaId]="proposta?.id ?? null"
      [clienteEmail]="portalClienteEmail"
      [nomeContatoDefault]="portalNomeContatoDefault"
      (published)="onPortalPublished($event)">
    </app-proposta-portal-dialog>
  `,
  styleUrls: ['./proposta-comercial.component.scss']
})
export class PropostaComercialComponent implements OnInit {
  @ViewChild('propostaPreview') propostaPreview!: ElementRef;

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private propostaService = inject(PropostaComercialService);
  private templateService = inject(TemplateProdutoServicoService);
  private tipoServicoService = inject(TipoServicoService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private i18n = inject(TranslationService);
  private branding = inject(BrandingService);
  private sistemaEmpresa = inject(SistemaEmpresaService);
  private hostEl = inject(ElementRef<HTMLElement>);
  private empresaPreview: SistemaEmpresaConfig | null = null;

  constructor() {
    effect(() => {
      const palette = brandPalette(this.branding.config().primaryColor);
      const el = this.hostEl.nativeElement;
      el.style.setProperty('--proposta-brand-primary', palette.primary);
      el.style.setProperty('--proposta-brand-primary-deep', palette.primaryDeep);
    });
  }

  activeTabIndex = 0;
  isEditMode = false;
  modoManual = false;
  carregandoProposta = false;
  proposta: PropostaComercial | null = null;
  saving = false;
  tiposServico: TipoServico[] = [];
  tipoServicoSelecionado: TipoServico | null = null;

  get tituloCabecalho(): string {
    return this.i18n.translate(
      this.isEditMode ? 'comercial.proposta.header.edit' : 'comercial.proposta.header.new'
    );
  }

  get subCabecalho(): string {
    if (this.isEditMode) {
      const num = this.proposta?.numeroProposta?.trim();
      const prefix = this.i18n.translate('comercial.proposta.headerSub.editPrefix');
      return num ? `${prefix} ${num}` : prefix;
    }
    return this.i18n.translate('comercial.proposta.headerSub.new');
  }

  get totalA11yAnnouncement(): string {
    if (!this.proposalRatesReady()) {
      return '';
    }
    const total = this.getTotalGeralInSelectedCurrency();
    const formatted = new Intl.NumberFormat(this.i18n.getCurrentLanguage(), {
      style: 'currency',
      currency: this.getSelectedCurrencyCode()
    }).format(total);
    return this.i18n.translate('comercial.proposta.a11y.totalAnnounce', {
      cur: this.selectedCurrency,
      total: formatted
    });
  }

  // Templates
  templatesRecentes: TemplateProdutoServico[] = [];
  templatesFiltrados: TemplateProdutoServico[] = [];
  todosTemplates: TemplateProdutoServico[] = [];
  templateSelecionado: TemplateProdutoServico | null = null;
  totalTemplates = 0;
  showGaleriaTemplates = false;
  showSalvarTemplate = false;
  templateSearch = '';
  categoriaFiltro: string | null = null;
  categorias: string[] = [];
  salvandoTemplate = false;
  novoTemplate: Partial<TemplateProdutoServico> = {};

  // Assinatura Digital
  showSignatureModal = false;
  signatureData: SignatureModalData | null = null;

  // Informações de Contato para rodapé e email
  showContatoModal = false;
  contatoInfo: { telefone: string; email: string; nome: string } = {
    telefone: '',
    email: '',
    nome: ''
  };
  pendingAction: 'email' | 'whatsapp' | 'imprimir' | null = null;

  // Seletor de Produtos
  showProductSelector = false;
  propostaItems: PropostaItem[] = [];

  // Desconto
  showDiscount = false;
  discountType: 'percent' | 'fixed' = 'percent';
  discountPercent = 0;
  discountFixed = 0;

  // Custos Adicionais (BRL)
  freteBrl = 0;
  maoDeObraBrl = 0;

  // Cotação do Dólar
  cotacaoService = inject(CotacaoService);
  readonly localeCurrency = inject(LocaleCurrencyService);
  cotacaoDolar: CotacaoDolar | null = null;
  carregandoCotacao = false;
  selectedCurrency: MoneyCurrency = 'USD';
  /** Valores de linha/totais na moeda escolhida para a proposta (USD/BRL/EUR). */
  /** Valores sem nota inline — fontes centralizadas em {@link getUiMoneyDisclosureLines}. */
  readonly propostaMoneyPipeOpts = { showFootnote: false };

  // Envio de Email
  showEnvioEmailDialog = false;
  showSuccessDialog = false;
  enviandoEmail = false;
  enviandoWhatsApp = false;
  gerandoOs = false;
  gerandoPedidoBling = false;
  emitindoNfeBling = false;
  reprocessandoFluxoBling = false;
  aprovandoProposta = false;
  blingPedido: BlingPropostaPedidoView | null = null;
  blingFluxo: BlingPropostaFluxoView | null = null;
  blingNfeList: BlingNfeRegistro[] = [];
  portalAditivos: PropostaAditivo[] = [];
  portalAnexos: PropostaAnexo[] = [];
  portalAditivoDesc = '';
  portalAditivoValor: number | null = null;
  portalSalvandoAditivo = false;
  showPortalDialog = false;
  private http = inject(HttpClient);
  emailEnvio: {
    emailDestino: string;
    assunto: string;
    mensagemAdicional: string;
    tipoEnvio: 'corpo' | 'anexo';
  } = {
    emailDestino: '',
    assunto: '',
    mensagemAdicional: '',
    tipoEnvio: 'corpo'
  };

  // Forms
  produtoForm!: FormGroup;
  clienteForm!: FormGroup;
  propostaForm!: FormGroup;

  // Cliente Autocomplete
  private clientePropostaService = inject(ClientePropostaService);
  private blingApi = inject(BlingApiService);
  clientesSugestoes: ClienteProposta[] = [];
  showBlingDialog = false;
  blingSearch = '';
  blingContacts: BlingContact[] = [];
  blingLoading = false;
  blingStatusMessage = '';
  clienteSelecionado: ClienteProposta | null = null;
  /** Texto exibido no input de busca do cliente (evita [object] quando objeto está selecionado) */
  clienteBuscaTexto = '';
  buscandoClientes = false;
  salvandoCliente = false;

  readonly estados = BRASIL_ESTADOS;
  camposExtrasOn = false;

  get condicoesGeraisItems(): string[] {
    return Array.from({ length: 12 }, (_, i) =>
      this.i18n.translate(`comercial.proposta.condGerais.${i + 1}`)
    );
  }

  /** Texto salvo em condicoesGerais no backend (itens numerados). */
  getCondicoesGeraisTextoSalvar(): string {
    return this.condicoesGeraisItems.map((s, i) => `${i + 1}. ${s}`).join('\n\n');
  }

  private uiDateLocale(): string {
    switch (this.i18n.getCurrentLanguage()) {
      case 'en-US':
        return 'en-US';
      case 'es-ES':
        return 'es-ES';
      case 'fr-FR':
        return 'fr-FR';
      default:
        return 'pt-BR';
    }
  }

  private apiMessage(message?: string | null, fallbackKey?: string): string {
    return translateApiMessage(this.i18n, message, fallbackKey);
  }

  tituloLinhaDesconto(): string {
    if (this.discountType === 'percent') {
      return this.i18n.translate('comercial.proposta.totals.descontoPct', {
        pct: String(this.discountPercent ?? 0)
      });
    }
    return this.i18n.translate('comercial.proposta.totals.desconto');
  }

  textoEconomiaCliente(): string {
    const v = this.getDiscountValueInSelectedCurrency();
    const amount = this.localeCurrency.formatMoney(v, this.proposalCurrencyAsMoney(), {
      showFootnote: false
    }).formatted;
    return this.i18n.translate('comercial.proposta.discount.savings', { amount });
  }

  ngOnInit() {
    this.initForms();
    this.loadEmpresaPreview();
    this.propostaService.camposExtrasRegras().subscribe({
      next: (r) => { this.camposExtrasOn = !!r.camposExtras; },
      error: () => { this.camposExtrasOn = false; }
    });
    this.loadTiposServico();
    this.loadTemplates();
    this.loadCategorias();
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id && id !== 'new') {
        const propostaId = parseInt(id, 10);
        if (!Number.isNaN(propostaId)) {
          this.enterEditMode(propostaId);
        }
      } else {
        this.carregandoProposta = false;
      }
    });
    this.carregarCotacao(); // Carregar cotação do dólar
  }

  private enterEditMode(id: number): void {
    this.isEditMode = true;
    this.modoManual = true;
    this.carregandoProposta = true;
    this.templateSelecionado = null;
    this.loadProposta(id);
  }

  initForms() {
    this.produtoForm = this.fb.group({
      produtoNome: ['', Validators.required],
      produtoPn: [''],
      produtoSn: [''],
      produtoManual: [''],
      produtoValor: [null],
      aplicacaoMotor: [''],
      aeronavePrefixo: [''],
      idTipoServico: [null],
      tipoServicoNome: [''],
      servicoExecutado: ['', Validators.maxLength(1000)]
    });

    this.clienteForm = this.fb.group({
      clienteNome: ['', Validators.required],
      clienteCnpjCpf: [''],
      clienteEmail: ['', Validators.email],
      clienteTelefone: [''],
      clienteEndereco: [''],
      clienteCidade: [''],
      clienteEstado: [''],
      clienteCep: [''],
      clienteContato: [''],
      clienteObservacao: ['', Validators.maxLength(5000)]
    });

    this.propostaForm = this.fb.group({
      dataProposta: [new Date()],
      validadeProposta: [this.addDays(new Date(), 30)],
      prazoEntrega: [this.i18n.translate('comercial.proposta.defaults.prazoEntrega')],
      formaPagamento: [this.i18n.translate('comercial.proposta.defaults.formaPagamento')],
      observacoes: [''],
      condicoesGerais: [''],
      referenciaCliente: [''],
      contatoTecnico: [''],
      centroCusto: ['']
    });
  }

  loadTiposServico() {
    this.tipoServicoService.list({ size: 1000 }).subscribe({
      next: (result) => {
        this.tiposServico = result.items || [];
      },
      error: (err) => console.error('Failed to load service types:', err)
    });
  }

  loadTemplates() {
    this.templateService.list({ size: 100, ativo: true }).subscribe({
      next: (result) => {
        this.todosTemplates = result.content;
        this.templatesFiltrados = [...this.todosTemplates];
        this.totalTemplates = result.totalElements;
        // Pegar os 5 mais usados para exibir na tela inicial
        this.templatesRecentes = [...this.todosTemplates]
          .sort((a, b) => (b.vezesUtilizado || 0) - (a.vezesUtilizado || 0))
          .slice(0, 5);
      },
      error: (err) => console.error('Failed to load templates:', err)
    });
  }

  loadCategorias() {
    this.templateService.listCategorias().subscribe({
      next: (cats) => {
        this.categorias = cats;
      },
      error: (err) => console.error('Failed to load categories:', err)
    });
  }

  /**
   * ID da proposta em edição: prioriza id da rota (quando URL é /propostas-comerciais/:id) para evitar update na proposta errada; senão usa proposta carregada.
   */
  get propostaId(): number | null {
    const routeId = this.route.snapshot.paramMap.get('id');
    if (routeId && routeId !== 'new') {
      const n = parseInt(routeId, 10);
      if (!Number.isNaN(n)) return n;
    }
    return this.proposta?.id ?? null;
  }

  /**
   * Controle único: proposta já existente (tem ID na rota ou carregada) deve sempre usar UPDATE.
   * Só usa CREATE para proposta nova (sem id). Evita duplicar número de proposta.
   */
  get deveUsarUpdate(): boolean {
    return this.propostaId != null;
  }

  loadProposta(id: number) {
    this.carregandoProposta = true;
    this.propostaService.getById(id).subscribe({
      next: (proposta) => {
        this.proposta = proposta;
        this.patchForms(proposta);
        this.syncPortalFromProposta(proposta);
        this.loadClientePropostaVinculo(proposta);
        this.loadBlingIntegracao(proposta.id!);
        this.carregandoProposta = false;
      },
      error: (err) => {
        this.carregandoProposta = false;
        console.error('Failed to load proposal:', err);
        this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'proposta.comercial.toast.loadError');
        this.router.navigate(['/propostas-comerciais']);
      }
    });
  }

  clonarProposta() {
    if (!this.proposta?.id) return;
    
    this.confirmationService.confirm({
      message: this.i18n.translate('confirm.proposta.clone', {
        numero: String(this.proposta.numeroProposta ?? '')
      }),
      header: 'confirm.header.cloneProposal',
      icon: 'pi pi-copy',
      acceptLabel: 'common.confirm.yesClone',
      rejectLabel: 'common.confirm.cancel',
      accept: () => {
        this.saving = true;
        this.propostaService.duplicate(this.proposta!.id!).subscribe({
          next: (novaProposta) => {
            this.saving = false;
            this.i18n.addToast(this.messageService, 'success', 'proposta.comercial.toast.cloneOkSummary', 'proposta.comercial.toast.cloneOkDetail', {
              numero: String(novaProposta.numeroProposta ?? '')
            });
            // Navegar para a nova proposta
            this.router.navigate(['/propostas-comerciais', novaProposta.id]);
          },
          error: (err) => {
            this.saving = false;
            console.error('Failed to clone proposal:', err);
            this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'proposta.comercial.toast.cloneError');
          }
        });
      }
    });
  }

  patchForms(proposta: PropostaComercial) {
    this.produtoForm.patchValue({
      produtoNome: proposta.produtoNome,
      produtoPn: proposta.produtoPn,
      produtoSn: proposta.produtoSn,
      produtoManual: proposta.produtoManual,
      produtoValor: proposta.produtoValor,
      aplicacaoMotor: proposta.aplicacaoMotor,
      aeronavePrefixo: proposta.aeronavePrefixo,
      idTipoServico: proposta.idTipoServico,
      tipoServicoNome: proposta.tipoServicoNome,
      servicoExecutado: proposta.servicoExecutado
    });

    this.clienteForm.patchValue({
      clienteNome: proposta.clienteNome,
      clienteCnpjCpf: proposta.clienteCnpjCpf,
      clienteEmail: proposta.clienteEmail,
      clienteTelefone: proposta.clienteTelefone,
      clienteEndereco: proposta.clienteEndereco,
      clienteCidade: proposta.clienteCidade,
      clienteEstado: proposta.clienteEstado,
      clienteCep: proposta.clienteCep,
      clienteContato: proposta.clienteContato,
      clienteObservacao: proposta.clienteObservacao
    });
    this.clienteBuscaTexto = proposta.clienteNome ?? '';

    this.propostaForm.patchValue({
      dataProposta: parseIsoDateLocal(proposta.dataProposta) ?? new Date(),
      validadeProposta: parseIsoDateLocal(proposta.validadeProposta),
      prazoEntrega: proposta.prazoEntrega,
      formaPagamento: proposta.formaPagamento,
      observacoes: proposta.observacoes,
      condicoesGerais: '',
      referenciaCliente: proposta.referenciaCliente,
      contatoTecnico: proposta.contatoTecnico,
      centroCusto: proposta.centroCusto
    });

    // Carregar itens da proposta se existirem
    if (proposta.itens && proposta.itens.length > 0) {
      this.propostaItems = proposta.itens.map(item => ({
        product: {
          id: item.id || 0,
          name: item.produtoNome,
          description: item.produtoDescricao,
          productpn: item.produtoPn,
          price: item.valorUnitario
        },
        quantidade: item.quantidade,
        valorUnitario: item.valorUnitario,
        valorTotal: item.valorTotal,
        produtoPn: item.produtoPn || '',
        produtoSn: item.produtoSn || ''
      }));
    }

    // Carregar dados de desconto se existirem
    if (proposta.descontoTipo) {
      this.showDiscount = true;
      this.discountType = proposta.descontoTipo as 'percent' | 'fixed';
      this.discountPercent = proposta.descontoPercentual || 0;
      this.discountFixed = proposta.descontoValorFixo || 0;
    } else {
      this.showDiscount = false;
      this.discountType = 'percent';
      this.discountPercent = 0;
      this.discountFixed = 0;
    }

    // Carregar custos adicionais se existirem
    this.freteBrl = proposta.freteBrl || 0;
    this.maoDeObraBrl = proposta.maoDeObraBrl || 0;

    this.selectedCurrency = coerceMoneyCurrency(proposta.moedaProposta);
    this.restoreSignatureFromProposta(proposta);
    if (this.selectedCurrency !== 'USD') {
      this.ensureProposalRates();
    }
  }

  private restoreSignatureFromProposta(proposta: PropostaComercial): void {
    if (!proposta.assinaturaNome?.trim()) {
      this.signatureData = null;
      return;
    }
    this.signatureData = {
      name: proposta.assinaturaNome.trim(),
      styleId: proposta.assinaturaEstilo || 'classic',
      style: {
        id: proposta.assinaturaEstilo || 'classic',
        name: '',
        fontFamily: proposta.assinaturaFontFamily || 'Great Vibes, cursive',
        fontWeight: '400',
        fontSize: '24px',
        fontStyle: 'normal',
        letterSpacing: '0',
        color: proposta.assinaturaColor || '#1e293b',
        previewClass: ''
      },
      timestamp: proposta.assinaturaTimestamp ? new Date(proposta.assinaturaTimestamp) : new Date()
    };
  }

  private buildItensPayload(): PropostaComercialItem[] {
    return this.propostaItems.map((item, index) => ({
      produtoNome: item.product.name,
      produtoDescricao: item.product.description || '',
      produtoPn: item.produtoPn || item.product.productpn || '',
      produtoSn: item.produtoSn || '',
      quantidade: item.quantidade,
      valorUnitario: item.valorUnitario,
      valorTotal: item.valorTotal,
      ordem: index
    }));
  }

  private buildValoresComplementares(): Pick<
    PropostaComercial,
    | 'descontoTipo'
    | 'descontoPercentual'
    | 'descontoValorFixo'
    | 'descontoValorCalculado'
    | 'valorTotalFinal'
    | 'freteBrl'
    | 'maoDeObraBrl'
    | 'cotacaoDolar'
    | 'dataCotacao'
    | 'freteUsd'
    | 'maoDeObraUsd'
    | 'subtotalProdutosUsd'
    | 'totalGeralUsd'
    | 'moedaProposta'
    | 'totalGeralBrl'
    | 'totalGeralEur'
  > {
    return {
      descontoTipo: this.showDiscount ? this.discountType : undefined,
      descontoPercentual: this.showDiscount && this.discountType === 'percent' ? this.discountPercent : undefined,
      descontoValorFixo: this.showDiscount && this.discountType === 'fixed' ? this.discountFixed : undefined,
      descontoValorCalculado: this.showDiscount ? this.getDiscountValue() : undefined,
      valorTotalFinal: this.getFinalTotalValue(),
      freteBrl: this.freteBrl > 0 ? this.freteBrl : undefined,
      maoDeObraBrl: this.maoDeObraBrl > 0 ? this.maoDeObraBrl : undefined,
      cotacaoDolar: this.cotacaoDolar?.cotacaoVenda,
      dataCotacao: this.cotacaoDolar?.dataHoraCotacao,
      freteUsd: this.getFreteUsd() > 0 ? this.getFreteUsd() : undefined,
      maoDeObraUsd: this.getMaoDeObraUsd() > 0 ? this.getMaoDeObraUsd() : undefined,
      subtotalProdutosUsd: this.getFinalTotalValue(),
      totalGeralUsd: this.getTotalGeralUsd(),
      moedaProposta: this.selectedCurrency,
      totalGeralBrl: this.selectedCurrency === 'BRL' ? this.getTotalGeralInSelectedCurrency() : undefined,
      totalGeralEur: this.selectedCurrency === 'EUR' ? this.getTotalGeralInSelectedCurrency() : undefined
    };
  }

  private buildPropostaBasePayload(status?: string): PropostaComercial {
    return {
      ...this.produtoForm.value,
      ...this.clienteForm.value,
      dataProposta: this.formatDate(this.propostaForm.get('dataProposta')?.value),
      validadeProposta: this.formatDate(this.propostaForm.get('validadeProposta')?.value),
      prazoEntrega: this.propostaForm.get('prazoEntrega')?.value,
      formaPagamento: this.propostaForm.get('formaPagamento')?.value,
      observacoes: this.propostaForm.get('observacoes')?.value,
      condicoesGerais: this.getCondicoesGeraisTextoSalvar(),
      referenciaCliente: this.camposExtrasOn ? this.propostaForm.get('referenciaCliente')?.value : undefined,
      contatoTecnico: this.camposExtrasOn ? this.propostaForm.get('contatoTecnico')?.value : undefined,
      centroCusto: this.camposExtrasOn ? this.propostaForm.get('centroCusto')?.value : undefined,
      status,
      itens: this.buildItensPayload(),
      ...this.buildValoresComplementares(),
      clientePropostaId: this.clienteSelecionado?.id ?? this.proposta?.clientePropostaId,
      ...(this.signatureData
        ? {
            assinaturaNome: this.signatureData.name,
            assinaturaEstilo: this.signatureData.styleId,
            assinaturaFontFamily: this.signatureData.style.fontFamily,
            assinaturaColor: this.signatureData.style.color
          }
        : {})
    };
  }

  private buildEnvioSnapshot(): Pick<
    EnviarPropostaEmailRequest,
    | 'moedaProposta'
    | 'dataProposta'
    | 'validadeProposta'
    | 'valorTotalFinal'
    | 'totalGeralBrl'
    | 'totalGeralEur'
    | 'totalGeralUsd'
    | 'freteBrl'
    | 'maoDeObraBrl'
    | 'freteUsd'
    | 'maoDeObraUsd'
    | 'cotacaoDolar'
    | 'dataCotacao'
    | 'descontoTipo'
    | 'descontoPercentual'
    | 'descontoValorFixo'
    | 'descontoValorCalculado'
  > {
    const v = this.buildValoresComplementares();
    return {
      moedaProposta: v.moedaProposta,
      dataProposta: this.formatDate(this.propostaForm.get('dataProposta')?.value) ?? undefined,
      validadeProposta: this.formatDate(this.propostaForm.get('validadeProposta')?.value) ?? undefined,
      valorTotalFinal: v.valorTotalFinal,
      totalGeralBrl: v.totalGeralBrl,
      totalGeralEur: v.totalGeralEur,
      totalGeralUsd: v.totalGeralUsd,
      freteBrl: v.freteBrl,
      maoDeObraBrl: v.maoDeObraBrl,
      freteUsd: v.freteUsd,
      maoDeObraUsd: v.maoDeObraUsd,
      cotacaoDolar: v.cotacaoDolar,
      dataCotacao: v.dataCotacao,
      descontoTipo: v.descontoTipo,
      descontoPercentual: v.descontoPercentual,
      descontoValorFixo: v.descontoValorFixo,
      descontoValorCalculado: v.descontoValorCalculado
    };
  }

  // ========== TEMPLATE FUNCTIONS ==========

  comecarDoZero() {
    this.modoManual = true;
    this.templateSelecionado = null;
  }

  selecionarTemplate(template: TemplateProdutoServico) {
    this.templateSelecionado = template;
    this.modoManual = true;

    // Preencher formulários com dados do template
    this.produtoForm.patchValue({
      produtoNome: template.produtoNome,
      produtoPn: template.produtoPn,
      produtoManual: template.produtoManual,
      produtoValor: template.produtoValorBase,
      aplicacaoMotor: template.aplicacaoMotor,
      idTipoServico: template.idTipoServico,
      tipoServicoNome: template.tipoServicoNome,
      servicoExecutado: template.servicoDescricaoPadrao
    });

    this.propostaForm.patchValue({
      prazoEntrega: template.prazoEntregaPadrao || this.propostaForm.get('prazoEntrega')?.value,
      formaPagamento: template.formaPagamentoPadrao || this.propostaForm.get('formaPagamento')?.value,
      condicoesGerais: '',
      observacoes: template.observacaoPadrao || ''
    });

    if (template.validadeDias) {
      this.propostaForm.patchValue({
        validadeProposta: this.addDays(new Date(), template.validadeDias)
      });
    }

    // Registrar uso do template
    if (template.id) {
      this.templateService.registrarUso(template.id).subscribe();
    }

    this.i18n.addToast(this.messageService, 'success', 'proposta.comercial.toast.templateAppliedSummary', 'proposta.comercial.toast.templateAppliedDetail', {
      nome: String(template.nomeTemplate ?? '')
    });
  }

  trocarTemplate() {
    this.templateSelecionado = null;
    this.modoManual = false;
    this.initForms(); // Resetar formulários
  }

  abrirGaleriaTemplates() {
    this.templatesFiltrados = [...this.todosTemplates];
    this.templateSearch = '';
    this.categoriaFiltro = null;
    this.showGaleriaTemplates = true;
  }

  filtrarTemplates() {
    let filtrados = [...this.todosTemplates];

    if (this.templateSearch) {
      const search = this.templateSearch.toLowerCase();
      filtrados = filtrados.filter(t =>
        t.nomeTemplate?.toLowerCase().includes(search) ||
        t.produtoNome?.toLowerCase().includes(search) ||
        t.tipoServicoNome?.toLowerCase().includes(search)
      );
    }

    if (this.categoriaFiltro) {
      filtrados = filtrados.filter(t => t.categoria === this.categoriaFiltro);
    }

    this.templatesFiltrados = filtrados;
  }

  abrirDialogSalvarTemplate() {
    this.novoTemplate = {
      nomeTemplate: '',
      descricaoTemplate: '',
      categoria: ''
    };
    this.showSalvarTemplate = true;
  }

  salvarTemplate() {
    if (!this.novoTemplate.nomeTemplate) {
      this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'proposta.comercial.toast.warnTemplateName');
      return;
    }

    this.salvandoTemplate = true;

    const template: TemplateProdutoServico = {
      nomeTemplate: this.novoTemplate.nomeTemplate,
      descricaoTemplate: this.novoTemplate.descricaoTemplate,
      categoria: this.novoTemplate.categoria,
      produtoNome: this.produtoForm.get('produtoNome')?.value,
      produtoPn: this.produtoForm.get('produtoPn')?.value,
      produtoManual: this.produtoForm.get('produtoManual')?.value,
      produtoValorBase: this.produtoForm.get('produtoValor')?.value,
      aplicacaoMotor: this.produtoForm.get('aplicacaoMotor')?.value,
      idTipoServico: this.produtoForm.get('idTipoServico')?.value,
      tipoServicoNome: this.tipoServicoSelecionado?.nome || this.produtoForm.get('tipoServicoNome')?.value,
      servicoDescricaoPadrao: this.produtoForm.get('servicoExecutado')?.value,
      prazoEntregaPadrao: this.propostaForm.get('prazoEntrega')?.value,
      formaPagamentoPadrao: this.propostaForm.get('formaPagamento')?.value,
      validadeDias: 30,
      condicoesGeraisPadrao: this.getCondicoesGeraisTextoSalvar(),
      ativo: true
    };

    this.templateService.create(template).subscribe({
      next: (created) => {
        this.salvandoTemplate = false;
        this.showSalvarTemplate = false;
        this.i18n.addToast(this.messageService, 'success', 'proposta.comercial.toast.templateSavedSummary', 'proposta.comercial.toast.templateSavedDetail', {
          nome: String(created.nomeTemplate ?? '')
        });
        this.loadTemplates();
        this.loadCategorias();
      },
      error: (err) => {
        this.salvandoTemplate = false;
        console.error('Failed to save template:', err);
        this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'proposta.comercial.toast.templateSaveError');
      }
    });
  }

  // ========== FORM FUNCTIONS ==========

  onTipoServicoChange(event: any) {
    const id = event.value;
    this.tipoServicoSelecionado = this.tiposServico.find(t => t.id === id) || null;
    if (this.tipoServicoSelecionado) {
      this.produtoForm.patchValue({ tipoServicoNome: this.tipoServicoSelecionado.nome });
    }
  }

  get isProdutoValid(): boolean {
    // Considerar válido se há produtos selecionados OU se o nome do produto está preenchido
    return this.propostaItems.length > 0 || (this.produtoForm.get('produtoNome')?.valid || false);
  }

  get isClienteValid(): boolean {
    return this.clienteForm.get('clienteNome')?.valid || false;
  }

  onTabChange(event: any) {
    this.activeTabIndex = event.index;
  }

  nextTab() {
    if (this.activeTabIndex < 2) this.activeTabIndex++;
  }

  prevTab() {
    if (this.activeTabIndex > 0) this.activeTabIndex--;
  }

  getDataFormatada(): string {
    const data = this.propostaForm.get('dataProposta')?.value;
    const d = data ? new Date(data) : new Date();
    const loc = this.uiDateLocale();
    if (data && isNaN(d.getTime())) {
      return new Date().toLocaleDateString(loc);
    }
    return d.toLocaleDateString(loc);
  }

  getValidadeFormatada(): string {
    const data = this.propostaForm.get('validadeProposta')?.value;
    if (!data) return this.i18n.translate('comercial.proposta.validadePadrao');
    const d = new Date(data);
    if (isNaN(d.getTime())) return this.i18n.translate('comercial.proposta.validadePadrao');
    return d.toLocaleDateString(this.uiDateLocale());
  }

  /** Observação da proposta (lado direito): só exibe bloco na prévia/PDF se houver texto. */
  hasObservacaoProposta(): boolean {
    const v = this.propostaForm.get('observacoes')?.value;
    return typeof v === 'string' && v.trim().length > 0;
  }

  getValorFormatado(): string {
    const amount =
      this.propostaItems.length > 0
        ? this.getFinalTotalValueInSelectedCurrency()
        : Number(this.produtoForm.get('produtoValor')?.value) || 0;
    if (!amount) {
      return this.i18n.translate('comercial.proposta.valor.aOrcar');
    }
    return this.localeCurrency.formatMoney(amount, this.proposalCurrencyAsMoney(), {
      showFootnote: false
    }).formatted;
  }

  getEnderecoCompleto(): string {
    const parts = [
      this.clienteForm.get('clienteEndereco')?.value,
      this.clienteForm.get('clienteCidade')?.value,
      this.clienteForm.get('clienteEstado')?.value,
      this.clienteForm.get('clienteCep')?.value
    ].filter(p => p);
    return parts.join(', ');
  }

  // ==========================================
  // Métodos de Cliente Cadastrado
  // ==========================================

  buscarClientes(event: any) {
    const query = event.query || '';
    if (query.length < 2) {
      this.clientesSugestoes = [];
      return;
    }
    
    this.buscandoClientes = true;
    this.clientePropostaService.searchByName(query).subscribe({
      next: (clientes) => {
        this.clientesSugestoes = clientes || [];
        this.buscandoClientes = false;
      },
      error: (error) => {
        console.error('Failed to search clients:', error);
        this.clientesSugestoes = [];
        this.buscandoClientes = false;
      }
    });
  }

  selecionarCliente(event: any) {
    // PrimeNG pode enviar o objeto direto ou { value: objeto }
    const cliente: ClienteProposta | null = (event && typeof event === 'object' && event.value !== undefined)
      ? event.value
      : event;
    if (!cliente || typeof cliente !== 'object') return;

    this.clienteSelecionado = cliente;
    this.clienteBuscaTexto = (cliente.nome ?? '') + '';

    const nome = cliente.nome ?? '';
    this.clienteForm.patchValue({
      clienteNome: nome,
      clienteCnpjCpf: (cliente.cnpjCpf ?? '') + '',
      clienteEmail: (cliente.email ?? '') + '',
      clienteTelefone: (cliente.telefone ?? '') + '',
      clienteContato: (cliente.contato ?? '') + '',
      clienteEndereco: (cliente.endereco ?? '') + '',
      clienteCidade: (cliente.cidade ?? '') + '',
      clienteEstado: (cliente.estado ?? '') + '',
      clienteCep: (cliente.cep ?? '') + '',
      clienteObservacao: (cliente.observacao ?? '') + ''
    });
    this.clienteForm.markAsDirty();

    this.i18n.addToast(this.messageService, 'success', 'proposta.comercial.toast.clienteLoadedSummary', 'proposta.comercial.toast.clienteLoadedDetail', {
      nome: String(nome)
    });
  }

  limparClienteSelecionado() {
    this.clienteSelecionado = null;
    this.clienteBuscaTexto = '';
  }

  /** Quando o usuário digita: mantém texto. Quando seleciona um item (model vira objeto): preenche formulário e evita [object]. */
  onClienteBuscaModelChange(value: any) {
    if (value != null && typeof value === 'object') {
      const nome = value.nome ?? value.nomeRazao ?? '';
      this.clienteBuscaTexto = String(nome);
      this.selecionarCliente(value);
      return;
    }
    this.clienteBuscaTexto = value == null ? '' : String(value);
  }

  abrirBlingImport(): void {
    this.showBlingDialog = true;
    this.blingSearch = '';
    this.blingContacts = [];
    this.blingStatusMessage = '';
    this.blingApi.status().subscribe({
      next: (s) => {
        if (!s.enabled || !s.configured) {
          this.blingStatusMessage = this.apiMessage(
            s.message,
            'comercial.proposta.bling.notConfigured'
          );
        }
      },
      error: () => {
        this.blingStatusMessage = this.i18n.translate('comercial.proposta.bling.notConfigured');
      },
    });
  }

  buscarBlingContatos(): void {
    const q = this.blingSearch?.trim() ?? '';
    if (q.length < 2) {
      this.i18n.addToast(
        this.messageService,
        'warn',
        'common.toast.warn',
        'comercial.proposta.bling.searchMin'
      );
      return;
    }
    this.blingLoading = true;
    this.blingContacts = [];
    const digits = q.replace(/\D/g, '');
    const opts =
      digits.length === 11 || digits.length === 14
        ? { numeroDocumento: digits, limit: 20 }
        : { pesquisa: q, limit: 20 };
    this.blingApi.searchContacts(opts).subscribe({
      next: (page) => {
        this.blingLoading = false;
        this.blingContacts = page.items ?? [];
        if (page.message) {
          this.blingStatusMessage = this.apiMessage(page.message);
        } else if (!page.configured || !page.enabled) {
          this.blingStatusMessage = this.i18n.translate('comercial.proposta.bling.notConfigured');
        } else {
          this.blingStatusMessage = '';
        }
      },
      error: () => {
        this.blingLoading = false;
        this.i18n.addToast(
          this.messageService,
          'error',
          'common.toast.error',
          'comercial.proposta.bling.searchError'
        );
      },
    });
  }

  blingApplyLabel(c: BlingContact): string {
    if (this.clienteSelecionado?.id) {
      return this.i18n.translate('comercial.proposta.bling.linkBtn');
    }
    return this.i18n.translate('comercial.proposta.bling.importBtnShort');
  }

  aplicarBlingContact(c: BlingContact): void {
    if (!c.id) {
      return;
    }
    this.blingLoading = true;
    const clienteId = this.clienteSelecionado?.id;
    if (clienteId) {
      this.blingApi.linkContact(c.id, clienteId).subscribe({
        next: cliente => this.onBlingContactApplied(c, cliente, { linked: true, created: false }),
        error: () => this.onBlingContactApplyError(c, true),
      });
      return;
    }
    this.blingApi.importContactAsCliente(c.id).subscribe({
      next: result => this.onBlingContactApplied(c, result.cliente, { linked: result.linked, created: result.created }),
      error: () => this.onBlingContactApplyError(c, false),
    });
  }

  private onBlingContactApplied(
    c: BlingContact,
    cliente: ClienteProposta | null | undefined,
    flags: { linked: boolean; created: boolean }
  ): void {
    this.blingLoading = false;
    const nome = (cliente?.nome ?? c.nome ?? '').trim();
    this.clienteBuscaTexto = nome;
    this.clienteSelecionado = cliente ?? this.clienteSelecionado;
    this.clienteForm.patchValue({
      clienteNome: nome,
      clienteCnpjCpf: (cliente?.cnpjCpf ?? c.cnpjCpf ?? '') + '',
      clienteEmail: (cliente?.email ?? c.email ?? '') + '',
      clienteTelefone: (cliente?.telefone ?? c.telefone ?? '') + '',
      clienteEndereco: (cliente?.endereco ?? c.endereco ?? '') + '',
      clienteCidade: (cliente?.cidade ?? c.cidade ?? '') + '',
      clienteEstado: (cliente?.estado ?? c.uf ?? '') + '',
    });
    this.clienteForm.markAsDirty();
    this.showBlingDialog = false;
    let detailKey = 'comercial.proposta.bling.appliedLinked';
    if (flags.linked && this.clienteSelecionado?.id) {
      detailKey = 'comercial.proposta.bling.linkOk';
    } else if (flags.created) {
      detailKey = 'comercial.proposta.bling.appliedCreated';
    }
    this.i18n.addToast(this.messageService, 'success', 'common.toast.success', detailKey);
  }

  private onBlingContactApplyError(c: BlingContact, hadCliente: boolean): void {
    this.blingLoading = false;
    if (!hadCliente) {
      const nome = (c.nome ?? '').trim();
      this.clienteBuscaTexto = nome;
      this.clienteSelecionado = null;
      this.clienteForm.patchValue({
        clienteNome: nome,
        clienteCnpjCpf: (c.cnpjCpf ?? '') + '',
        clienteEmail: (c.email ?? '') + '',
        clienteTelefone: (c.telefone ?? '') + '',
        clienteEndereco: (c.endereco ?? '') + '',
        clienteCidade: (c.cidade ?? '') + '',
        clienteEstado: (c.uf ?? '') + '',
      });
      this.clienteForm.markAsDirty();
      this.showBlingDialog = false;
    }
    this.i18n.addToast(
      this.messageService,
      hadCliente ? 'error' : 'warn',
      hadCliente ? 'common.toast.error' : 'common.toast.warn',
      hadCliente ? 'comercial.proposta.bling.linkErr' : 'comercial.proposta.bling.appliedLocalOnly'
    );
  }

  salvarCliente() {
    if (!this.clienteForm.get('clienteNome')?.valid) {
      this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'proposta.comercial.toast.warnClienteNome');
      return;
    }

    this.salvandoCliente = true;

    const clienteData: ClienteProposta = {
      nome: this.clienteForm.get('clienteNome')?.value,
      cnpjCpf: this.clienteForm.get('clienteCnpjCpf')?.value,
      email: this.clienteForm.get('clienteEmail')?.value,
      telefone: this.clienteForm.get('clienteTelefone')?.value,
      contato: this.clienteForm.get('clienteContato')?.value,
      endereco: this.clienteForm.get('clienteEndereco')?.value,
      cidade: this.clienteForm.get('clienteCidade')?.value,
      estado: this.clienteForm.get('clienteEstado')?.value,
      cep: this.clienteForm.get('clienteCep')?.value,
      observacao: this.clienteForm.get('clienteObservacao')?.value
    };

    // Se já tem cliente selecionado com ID, atualiza; senão, cria novo
    if (this.clienteSelecionado?.id) {
      this.clientePropostaService.update(this.clienteSelecionado.id, clienteData).subscribe({
        next: (cliente) => {
          this.clienteSelecionado = cliente;
          this.salvandoCliente = false;
          this.i18n.addToast(this.messageService, 'success', 'proposta.comercial.toast.clienteUpdatedSummary', 'proposta.comercial.toast.clienteUpdatedDetail', {
            nome: String(cliente.nome ?? '')
          });
        },
        error: (error) => {
          console.error('Failed to update client:', error);
          this.salvandoCliente = false;
          this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'proposta.comercial.toast.clienteUpdatedError');
        }
      });
    } else {
      this.clientePropostaService.create(clienteData).subscribe({
        next: (cliente) => {
          this.clienteSelecionado = cliente;
          this.salvandoCliente = false;
          this.i18n.addToast(this.messageService, 'success', 'proposta.comercial.toast.clienteCreatedSummary', 'proposta.comercial.toast.clienteCreatedDetail', {
            nome: String(cliente.nome ?? '')
          });
        },
        error: (error) => {
          console.error('Failed to save client:', error);
          this.salvandoCliente = false;
          this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'proposta.comercial.toast.clienteCreatedError');
        }
      });
    }
  }

  addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  salvar(status: string) {
    if (!this.isProdutoValid || !this.isClienteValid) {
      this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'proposta.comercial.toast.warnProdutoCliente');
      return;
    }

    this.saving = true;

    const proposta: PropostaComercial = this.buildPropostaBasePayload(status);

    // Controle único: id presente (rota ou proposta) = atualizar; sem id = criar nova (nunca enviar numeroProposta no create)
    const request = this.deveUsarUpdate && this.propostaId
      ? this.propostaService.update(this.propostaId, proposta)
      : this.propostaService.create({ ...proposta, numeroProposta: undefined });

    request.subscribe({
      next: (result) => {
        this.saving = false;
        this.proposta = result;
        this.isEditMode = true;
        this.i18n.addToast(
          this.messageService,
          'success',
          'common.toast.success',
          status === 'ENVIADA' ? 'proposta.comercial.toast.saveOkSent' : 'proposta.comercial.toast.saveOkDraft'
        );
        
        if (!this.deveUsarUpdate && result.id) {
          this.router.navigate(['/propostas-comerciais', result.id], { replaceUrl: true });
        }
      },
      error: (err) => {
        this.saving = false;
        console.error('Failed to save:', err);
        this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'proposta.comercial.toast.saveError');
      }
    });
  }

  /**
   * Salva a proposta em sua totalidade com status ENVIADA (chamado após envio de email com sucesso).
   * Garante que a proposta fique persistida e apareça na lista como Enviada.
   */
  atualizarPropostaStatusEnviada() {
    if (!this.proposta?.id) return;
    const proposta: PropostaComercial = this.buildPropostaBasePayload('ENVIADA');
    this.propostaService.update(this.proposta.id, proposta).subscribe({
      next: (result) => {
        this.proposta = result;
        this.restoreSignatureFromProposta(result);
        if (result.moedaProposta) {
          this.selectedCurrency = coerceMoneyCurrency(result.moedaProposta);
        }
      },
      error: (err) => {
        console.error('Failed to update status to SENT:', err);
        this.proposta!.status = 'ENVIADA';
      }
    });
  }

  formatDate(date: Date | null): string | null {
    return toIsoDatePayload(date) ?? null;
  }

  private loadEmpresaPreview(): void {
    this.sistemaEmpresa.getConfig().subscribe({
      next: cfg => {
        this.empresaPreview = cfg;
        if (!this.contatoInfo.telefone?.trim() && cfg.telefone?.trim()) {
          this.contatoInfo.telefone = cfg.telefone.trim();
        }
        if (!this.contatoInfo.email?.trim() && cfg.supportEmail?.trim()) {
          this.contatoInfo.email = cfg.supportEmail.trim();
        }
      },
      error: () => {
        this.empresaPreview = null;
      },
    });
  }

  previewEmpresaTitulo(): string {
    const razao = this.empresaPreview?.razaoSocial?.trim();
    if (razao) {
      return razao;
    }
    const nome = this.empresaPreview?.displayName?.trim();
    if (nome) {
      return nome;
    }
    return this.branding.config().commercialName;
  }

  previewEmpresaSubtitulo(): string | null {
    const tagline = this.empresaPreview?.tagline?.trim() || this.branding.config().commercialTagline?.trim();
    return tagline || null;
  }

  previewLogoSrc(): string {
    const url = this.empresaPreview?.logoUrl?.trim() || this.branding.config().logoUrl;
    return this.resolveAssetUrl(url);
  }

  previewFooterTelefone(): string {
    return (this.contatoInfo.telefone || this.empresaPreview?.telefone || '').trim() || '(00) 0000-0000';
  }

  previewFooterEmail(): string {
    return (
      this.contatoInfo.email ||
      this.empresaPreview?.supportEmail ||
      this.branding.config().copyrightEntity ||
      ''
    ).trim() || 'contato@empresa.com';
  }

  previewFooterSite(): string | null {
    const site = this.empresaPreview?.siteUrl?.trim();
    return site || null;
  }

  private resolveAssetUrl(url: string | null | undefined): string {
    const raw = url?.trim() || APP_LOGO_SRC;
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:')) {
      return raw;
    }
    if (raw.startsWith('/')) {
      return typeof window !== 'undefined' ? `${window.location.origin}${raw}` : raw;
    }
    return bustStaticAssetUrl(raw);
  }

  private resolvePrintLogoUrl(logoUrl: string | null | undefined): string {
    const raw = logoUrl?.trim() || APP_LOGO_SRC;
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:')) {
      return raw;
    }
    const path = raw.startsWith('/') ? raw : `/${raw}`;
    return `${window.location.origin}${path}`;
  }

  imprimir() {
    if (!this.propostaPreview?.nativeElement) {
      this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'proposta.comercial.toast.printPrepareError');
      return;
    }

    const logoUrl = this.resolvePrintLogoUrl(this.empresaPreview?.logoUrl?.trim() || this.branding.config().logoUrl);
    const altLogo = this.i18n.translate('comercial.proposta.preview.altLogo').replace(/"/g, '&quot;');
    const logoHtml = `<img src="${logoUrl}" alt="${altLogo}" data-print-logo="1" style="max-width: 80px; max-height: 80px; height: auto; width: auto;" onerror="this.style.display='none'">`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const locale = this.uiDateLocale();
      const tl = (key: string, params?: Record<string, string>) => this.i18n.translate(key, params);

      // Construir o conteúdo da proposta manualmente
      const proposta = this.proposta;
      const clienteForm = this.clienteForm.value;
      const propostaFormValue = this.propostaForm.value;
      
      // Formatação de data
      const dataFormatada = proposta?.dataProposta 
        ? new Date(proposta.dataProposta).toLocaleDateString(locale)
        : new Date().toLocaleDateString(locale);
      let validadeFormatada = proposta?.validadeProposta 
        ? new Date(proposta.validadeProposta).toLocaleDateString(locale)
        : '';

      // Construir tabela de produtos
      let produtosHtml = '';
      if (this.propostaItems && this.propostaItems.length > 0) {
        let totalQtd = 0;
        let totalValor = 0;
        
        produtosHtml = `
          <table class="produto-table">
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">${tl('comercial.proposta.preview.colHash')}</th>
                <th style="text-align: left;">${tl('comercial.proposta.preview.colDesc')}</th>
                <th style="width: 100px; text-align: left;">${tl('comercial.proposta.preview.colPn')}</th>
                <th style="width: 100px; text-align: left;">${tl('comercial.proposta.preview.colSn')}</th>
                <th style="width: 60px; text-align: center;">${tl('comercial.proposta.preview.colQtd')}</th>
                <th style="width: 100px; text-align: right;">${tl('comercial.proposta.preview.colValorUnit')}</th>
                <th style="width: 100px; text-align: right;">${tl('comercial.proposta.preview.colTotal')}</th>
              </tr>
            </thead>
            <tbody>
        `;
        
        this.propostaItems.forEach((item, index) => {
          const itemUnitDisplay = this.getItemUnitPriceDisplay(item);
          const itemTotal = this.getItemTotalDisplay(item);
          totalQtd += item.quantidade;
          totalValor += itemTotal;
          
          produtosHtml += `
            <tr>
              <td style="text-align: center;">${index + 1}</td>
              <td style="text-align: left;">
                <strong>${item.product.name}</strong>
                ${item.product.description ? '<br><small>' + item.product.description.slice(0, 80) + '</small>' : ''}
              </td>
              <td style="text-align: left;">${(item.produtoPn || item.product.productpn) || '-'}</td>
              <td style="text-align: left;">${item.produtoSn || '-'}</td>
              <td style="text-align: center;">${item.quantidade}</td>
              <td style="text-align: right;">${this.formatProposalTotalForExport(itemUnitDisplay)}</td>
              <td style="text-align: right; font-weight: bold; color: #0ea5e9;">${this.formatProposalTotalForExport(itemTotal)}</td>
            </tr>
          `;
        });
        
        // Calcular desconto para impressão
        const descontoValor = this.getDiscountValueInSelectedCurrency();
        const subtotalComDesconto = this.getFinalTotalValueInSelectedCurrency();
        const temDesconto = this.showDiscount && descontoValor > 0;
        const totalGeral = this.getTotalGeralInSelectedCurrency();
        const freteValor = this.getFreteInSelectedCurrency();
        const maoDeObraValor = this.getMaoDeObraInSelectedCurrency();
        const moeda = this.selectedCurrency;
        const freteLabel = this.getFreteLabel();
        const maoDeObraLabel = this.getMaoDeObraLabel();
        const tituloDesc = this.tituloLinhaDesconto();
        
        produtosHtml += `
            </tbody>
            <tfoot>
              <!-- Subtotal Produtos -->
              <tr style="background: #f8fafc; border-top: 1px solid #e2e8f0;">
                <td colspan="5" style="text-align: right; font-weight: 500; color: #64748b; padding: 12px 8px;">${tl('comercial.proposta.totals.subtotalProd', { cur: moeda })}</td>
                <td colspan="2" style="text-align: right; font-weight: 600; color: #334155; padding: 12px 8px;">${this.formatProposalTotalForExport(totalValor)}</td>
              </tr>
              ${temDesconto ? `
              <!-- Desconto -->
              <tr style="background: #fef2f2;">
                <td colspan="5" style="text-align: right; font-weight: 600; color: #dc2626; padding: 10px 8px;">
                  🏷️ ${tituloDesc}
                </td>
                <td colspan="2" style="text-align: right; font-weight: 700; color: #dc2626; padding: 10px 8px;">
                  - ${this.formatProposalTotalForExport(descontoValor)}
                </td>
              </tr>
              <tr style="background: #f8fafc;">
                <td colspan="5" style="text-align: right; font-weight: 500; color: #64748b; padding: 10px 8px;">${tl('comercial.proposta.totals.subtotalAposDesc', { cur: moeda })}</td>
                <td colspan="2" style="text-align: right; font-weight: 600; color: #334155; padding: 10px 8px;">${this.formatProposalTotalForExport(subtotalComDesconto)}</td>
              </tr>
              ` : ''}
              ${this.freteBrl > 0 ? `
              <!-- Frete -->
              <tr style="background: #f0fdf4;">
                <td colspan="5" style="text-align: right; font-weight: 500; color: #64748b; padding: 10px 8px;">
                  ${freteLabel}:
                </td>
                <td colspan="2" style="text-align: right; font-weight: 600; color: #16a34a; padding: 10px 8px;">
                  ${this.formatProposalTotalForExport(freteValor)}
                </td>
              </tr>
              ` : ''}
              ${this.maoDeObraBrl > 0 ? `
              <!-- Mão de Obra -->
              <tr style="background: #f0fdf4;">
                <td colspan="5" style="text-align: right; font-weight: 500; color: #64748b; padding: 10px 8px;">
                  ${maoDeObraLabel}:
                </td>
                <td colspan="2" style="text-align: right; font-weight: 600; color: #16a34a; padding: 10px 8px;">
                  ${this.formatProposalTotalForExport(maoDeObraValor)}
                </td>
              </tr>
              ` : ''}
              <!-- Total Geral -->
              <tr style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);">
                <td colspan="5" style="text-align: right; font-weight: 700; color: white; padding: 14px 8px; font-size: 15px;">
                  💵 ${tl('comercial.proposta.lbl.totalGeralStrong', { cur: moeda })}
                </td>
                <td colspan="2" style="text-align: right; font-weight: 700; color: white; padding: 14px 8px; font-size: 18px;">
                  ${this.formatProposalTotalForExport(totalGeral)}
                </td>
              </tr>
            </tfoot>
          </table>
        `;

        const disclosureLinesPrint = this.getUiMoneyDisclosureLines();
        if (disclosureLinesPrint.length > 0) {
          produtosHtml += `<p style="font-size:10px;color:#64748b;margin-top:10px;line-height:1.4;"><strong>${tl(
            'comercial.proposta.money.sourcesTit'
          )}</strong><br/>${disclosureLinesPrint
            .map((line) =>
              String(line).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            )
            .join('<br/>')}</p>`;
        }
      } else {
        produtosHtml = `<p style="color: #666; font-style: italic;">${tl('comercial.proposta.print.semProdutos')}</p>`;
      }

      // Assinatura (igual ao preview)
      // Calcular tamanho da fonte baseado no tamanho do nome
      let signatureFontSize = this.signatureData?.style.fontSize || '18px';
      if (this.signatureData?.name && this.signatureData.name.length > 25) {
        signatureFontSize = '14px';
      } else if (this.signatureData?.name && this.signatureData.name.length > 20) {
        signatureFontSize = '16px';
      }
      
      let assinaturaHtml = '';
      if (this.signatureData) {
        const linhaAss = this.i18n.translate('comercial.proposta.assinatura.por', {
          nome: this.signatureData.name
        });
        assinaturaHtml = `
          <div class="assinatura">
            <div class="linha-assinatura has-signature">
              <span style="font-family: ${this.signatureData.style.fontFamily}; font-size: ${signatureFontSize}; color: ${this.signatureData.style.color}; white-space: nowrap;">
                ${this.signatureData.name}
              </span>
            </div>
            <p>${this.previewEmpresaTitulo()}</p>
            <small style="color: #666; font-size: 10px;">${linhaAss}</small>
          </div>
        `;
      } else {
        assinaturaHtml = `
          <div class="assinatura">
            <div class="linha-assinatura"></div>
            <p>${tl('comercial.proposta.assinatura.rodape')}</p>
          </div>
        `;
      }

      const obsPropostaPrint = String(propostaFormValue.observacoes || '').trim();
      const hdrObs = tl('comercial.proposta.preview.secObs');
      const observacaoSecaoPrint = obsPropostaPrint
        ? `<div class="proposta-section proposta-observacao-section"><h3>⚠ ${hdrObs}</h3><div class="proposta-observacao-box">${obsPropostaPrint
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/\n/g, '<br>')}</div></div>`
        : '';

      const tituloPagina = tl('comercial.proposta.print.winTitle', {
        num: proposta?.numeroProposta || tl('comercial.proposta.print.refNova')
      });

      const numCabecalho = proposta?.numeroProposta || tl('comercial.proposta.print.refNova');
      const prefixoData = tl('comercial.proposta.preview.prefixoData');
      const hClientePrint = '👤 ' + tl('comercial.proposta.preview.secCliente');
      const nomeClientePrint = clienteForm.clienteNome || tl('comercial.proposta.preview.nomeFallback');
      const lblDoc = tl('comercial.proposta.preview.lblDocumento');
      const lblCont = tl('comercial.proposta.preview.lblContato');
      const lblMail = tl('comercial.proposta.preview.lblMail');
      const lblFone = tl('comercial.proposta.preview.lblFone');
      const lblObsTit = tl('comercial.proposta.preview.obsTit');
      const hdrProdutosPrint = '📦 ' + tl('comercial.proposta.preview.secProdutos');
      const hdrCondComPrint = '📋 ' + tl('comercial.proposta.preview.secCondCom');
      const lblPrazoP = tl('comercial.proposta.preview.condPrazo');
      const lblPagtoP = tl('comercial.proposta.preview.condPagto');
      const lblValidP = tl('comercial.proposta.preview.condValidade');
      const aComb = tl('comercial.proposta.aCombinar');
      const spanValidade = validadeFormatada || aComb;
      const hdrCondGPrint = '📜 ' + tl('comercial.proposta.preview.secCondGerais');
      const empresaTit = this.previewEmpresaTitulo();
      const empresaSub = this.previewEmpresaSubtitulo();
      const docTit = tl('comercial.proposta.preview.docTitulo');
      const footerTel = tl('comercial.proposta.print.footerTel', {
        tel: this.previewFooterTelefone(),
        email: this.previewFooterEmail(),
      });
      const footerSite = this.previewFooterSite();

      const printHtml = applyBrandPalette(`
        <html>
          <head>
            <title>${tituloPagina}</title>
            <style>
              * { box-sizing: border-box; }
              body { font-family: Arial, sans-serif; margin: 20px; color: #333; line-height: 1.5; }
              .proposta-header { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #0ea5e9; padding-bottom: 20px; }
              .company-logo { display: flex; align-items: center; gap: 20px; }
              .company-info { display: flex; align-items: center; }
              .company-info h2 { margin: 0; color: #0ea5e9; font-size: 15px; font-weight: 700; letter-spacing: 0.5px; }
              .proposta-info { text-align: right; }
              .proposta-info h1 { margin: 0; font-size: 20px; color: #0ea5e9; }
              .proposta-info .numero { font-size: 14px; font-weight: bold; margin: 5px 0; }
              .proposta-info .data { font-size: 12px; color: #666; }
              .proposta-section { margin-bottom: 16px; page-break-inside: auto; break-inside: auto; }
              .proposta-section > h3 { color: #0ea5e9; font-size: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px;
                page-break-after: avoid; break-after: avoid; }
              .proposta-section > h3 + table, .proposta-section > h3 + div { page-break-before: avoid; break-before: avoid; }
              .section-content { max-height: none; overflow: visible; }
              .section-content p { margin: 4px 0; font-size: 13px; word-wrap: break-word; overflow-wrap: break-word; }
              .produto-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; page-break-inside: auto; break-inside: auto; }
              .produto-table thead { display: table-header-group; }
              .produto-table th, .produto-table td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-size: 11px; word-wrap: break-word; }
              .produto-table th { background: #f8fafc; font-weight: 600; }
              .produto-table tr { page-break-inside: avoid; break-inside: avoid; }
              .condicoes-grid { display: flex; flex-wrap: wrap; gap: 15px; }
              .condicao-item { flex: 1; min-width: 150px; background: #f8fafc; padding: 10px; border-radius: 5px; }
              .condicao-item label { display: block; font-size: 11px; color: #666; margin-bottom: 3px; }
              .condicao-item span { font-size: 13px; font-weight: 500; }
              .condicoes-text { font-size: 11px; line-height: 1.6; white-space: pre-wrap; color: #666; margin-top: 15px; }
              .informacoes-gerais-section { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
              .informacoes-gerais-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; font-size: 10px; line-height: 1.45; color: #475569;
                page-break-inside: auto; break-inside: auto; }
              .condicoes-gerais-section > h3 + .informacoes-gerais-grid { page-break-before: avoid; break-before: avoid; }
              .info-geral-item { display: flex; gap: 6px; align-items: flex-start; page-break-inside: auto; break-inside: auto;
                word-wrap: break-word; overflow-wrap: break-word; }
              .info-geral-item .num { flex-shrink: 0; font-weight: 700; color: #0ea5e9; }
              .info-geral-item .text { flex: 1; }
              .condicoes-gerais-section { background: #fafbfc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
              .condicoes-gerais-content { font-size: 11px; line-height: 1.7; color: #475569; text-align: justify; }
              .proposta-observacao-section > h3 { color: #c2410c !important; border-bottom-color: #fdba74 !important; }
              .proposta-observacao-box { background: linear-gradient(135deg,#fff7ed 0%,#ffedd5 100%); border: 2px solid #ea580c; border-radius: 10px; padding: 14px 16px; font-size: 13px; line-height: 1.65; color: #1c1917; word-wrap: break-word; box-shadow: 0 2px 8px rgba(234,88,12,0.12); }
              .proposta-footer { margin-top: 36px; min-height: 64px; display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #e2e8f0; padding-top: 16px; page-break-inside: avoid; break-inside: avoid; position: relative; clear: both; }
              .assinatura { text-align: center; }
              .linha-assinatura { min-width: 200px; max-width: 350px; width: auto; border-bottom: 1px solid #333; margin: 10px auto; padding: 0 10px; display: inline-block; }
              .linha-assinatura.has-signature { min-height: 40px; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 5px; }
              .assinatura p { margin: 0; font-size: 12px; }
              .contato-footer { text-align: right; font-size: 11px; color: #666; }
              @media print {
                body { margin: 0; padding: 15px; }
                * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                svg { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                .proposta-section { margin-bottom: 14px !important; page-break-inside: auto !important; break-inside: auto !important; }
                .proposta-section > h3 { page-break-after: avoid !important; }
                .produto-table { page-break-inside: auto !important; break-inside: auto !important; }
                .produto-table tr { page-break-inside: avoid !important; break-inside: avoid !important; }
                .proposta-footer { margin-top: 32px !important; min-height: 56px !important; page-break-inside: avoid !important; break-inside: avoid !important; }
              }
            </style>
          </head>
          <body>
            <!-- CABEÇALHO -->
            <div class="proposta-header">
              <div class="company-logo">
                ${logoHtml}
                <div class="company-info">
                  <h2>${empresaTit}</h2>
                  ${empresaSub ? `<p class="company-tagline" style="margin:4px 0 0;font-size:12px;color:#64748b;">${empresaSub}</p>` : ''}
                </div>
              </div>
              <div class="proposta-info">
                <h1>${docTit}</h1>
                <div class="numero">${numCabecalho}</div>
                <div class="data">${prefixoData} ${dataFormatada}</div>
              </div>
            </div>

            <!-- CLIENTE -->
            <div class="proposta-section">
              <h3>${hClientePrint}</h3>
              <div class="section-content">
                <p><strong>${nomeClientePrint}</strong></p>
                ${clienteForm.clienteCnpjCpf ? `<p>${lblDoc} ${clienteForm.clienteCnpjCpf}</p>` : ''}
                ${clienteForm.clienteContato ? `<p>${lblCont} ${clienteForm.clienteContato}</p>` : ''}
                ${clienteForm.clienteEmail ? `<p>${lblMail} ${clienteForm.clienteEmail}</p>` : ''}
                ${clienteForm.clienteTelefone ? `<p>${lblFone} ${clienteForm.clienteTelefone}</p>` : ''}
                ${this.getEnderecoCompleto() ? `<p>${this.getEnderecoCompleto()}</p>` : ''}
                ${clienteForm.clienteObservacao ? `<p style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #e2e8f0;"><strong>${lblObsTit}</strong> ${clienteForm.clienteObservacao}</p>` : ''}
              </div>
            </div>

            <!-- PRODUTOS/SERVIÇOS -->
            <div class="proposta-section">
              <h3>${hdrProdutosPrint}</h3>
              ${produtosHtml}
            </div>

            <!-- CONDIÇÕES COMERCIAIS -->
            <div class="proposta-section">
              <h3>${hdrCondComPrint}</h3>
              <div class="condicoes-grid">
                <div class="condicao-item">
                  <label>${lblPrazoP}</label>
                  <span>${propostaFormValue.prazoEntrega || aComb}</span>
                </div>
                <div class="condicao-item">
                  <label>${lblPagtoP}</label>
                  <span>${propostaFormValue.formaPagamento || aComb}</span>
                </div>
                <div class="condicao-item">
                  <label>${lblValidP}</label>
                  <span>${spanValidade}</span>
                </div>
              </div>
            </div>

            <!-- CONDIÇÕES GERAIS (conteúdo fixo em colunas) -->
            <div class="proposta-section condicoes-gerais-section informacoes-gerais-section">
              <h3>${hdrCondGPrint}</h3>
              <div class="informacoes-gerais-grid">
                ${this.condicoesGeraisItems.map((text, i) => {
                  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
                  return `<div class="info-geral-item"><span class="num">${i + 1}.</span><span class="text">${escaped}</span></div>`;
                }).join('')}
              </div>
            </div>

            ${observacaoSecaoPrint}

            <!-- RODAPÉ -->
            <div class="proposta-footer">
              ${assinaturaHtml}
              <div class="contato-footer">
                <p>${footerTel}</p>
                ${footerSite ? `<p>${footerSite}</p>` : ''}
              </div>
            </div>
          </body>
        </html>
      `, this.branding.config().primaryColor);
      printWindow.document.write(printHtml);
      printWindow.document.close();
      
      // Esperar a imagem do logo carregar antes de imprimir
      printWindow.onload = () => {
        setTimeout(() => {
          const logoImg = printWindow.document.querySelector('img[data-print-logo="1"]') as HTMLImageElement;
          if (logoImg) {
            if (logoImg.complete && logoImg.naturalHeight !== 0) {
              printWindow.print();
            } else {
              logoImg.onload = () => {
                setTimeout(() => printWindow.print(), 100);
              };
              logoImg.onerror = () => {
                console.warn('Failed to load logo, printing anyway');
                printWindow.print();
              };
              // Timeout de segurança caso a imagem não carregue
              setTimeout(() => printWindow.print(), 2000);
            }
          } else {
            printWindow.print();
          }
        }, 200);
      };
      
      // Fallback caso onload não dispare
      setTimeout(() => printWindow.print(), 3000);
    }
  }

  // ========== ASSINATURA DIGITAL ==========

  abrirModalAssinatura() {
    this.showSignatureModal = true;
  }

  onSignatureConfirmed(signature: SignatureModalData) {
    this.signatureData = signature;
    this.showSignatureModal = false;
    
    this.i18n.addToast(this.messageService, 'success', 'proposta.comercial.toast.signatureOkSummary', 'proposta.comercial.toast.signatureOkDetail', {
      name: String(signature.name ?? ''),
      style: String(signature.style?.name ?? '')
    });

    // Se a proposta já foi salva, atualizar a assinatura no servidor
    if (this.proposta?.id && this.signatureData) {
      const signatureToSave: SignatureData = {
        name: this.signatureData.name,
        styleId: this.signatureData.styleId,
        fontFamily: this.signatureData.style.fontFamily,
        fontWeight: this.signatureData.style.fontWeight,
        fontSize: this.signatureData.style.fontSize,
        color: this.signatureData.style.color,
        letterSpacing: this.signatureData.style.letterSpacing
      };
      
      this.propostaService.salvarAssinatura(this.proposta.id, signatureToSave).subscribe({
        next: () => {},
        error: (err) => console.error('Failed to save signature:', err)
      });
    }
  }

  onSignatureCancelled() {
    this.showSignatureModal = false;
  }

  getSignatureDisplayStyle(): { [key: string]: string } {
    if (!this.signatureData) return {};
    
    // Ajustar tamanho da fonte baseado no comprimento do nome
    let fontSize = this.signatureData.style.fontSize;
    const nameLength = this.signatureData.name?.length || 0;
    
    if (nameLength > 30) {
      fontSize = '14px';
    } else if (nameLength > 25) {
      fontSize = '16px';
    } else if (nameLength > 20) {
      fontSize = '18px';
    }
    
    return {
      'font-family': this.signatureData.style.fontFamily,
      'font-weight': this.signatureData.style.fontWeight,
      'font-size': fontSize,
      'color': this.signatureData.style.color,
      'letter-spacing': this.signatureData.style.letterSpacing,
      'white-space': 'nowrap'
    };
  }

  // ========== INFORMAÇÕES DE CONTATO ==========

  abrirModalContato(action: 'email' | 'whatsapp' | 'imprimir') {
    this.pendingAction = action;
    this.carregarContatoInfoDoFormulario();
    this.showContatoModal = true;
  }

  carregarContatoInfoDoFormulario(): void {
    this.contatoInfo = {
      nome: (
        this.clienteForm.get('clienteContato')?.value ||
        this.proposta?.clienteContato ||
        ''
      )
        .toString()
        .trim(),
      telefone: (
        this.clienteForm.get('clienteTelefone')?.value ||
        this.proposta?.clienteTelefone ||
        ''
      )
        .toString()
        .trim(),
      email: (
        this.clienteForm.get('clienteEmail')?.value ||
        this.proposta?.clienteEmail ||
        ''
      )
        .toString()
        .trim()
    };
  }

  aplicarContatoInfoDoModal(): void {
    const nome = (this.contatoInfo.nome || '').trim();
    const telefone = (this.contatoInfo.telefone || '').trim();
    const email = (this.contatoInfo.email || '').trim();

    this.clienteForm.patchValue({
      clienteContato: nome || this.clienteForm.get('clienteContato')?.value,
      clienteTelefone: telefone || this.clienteForm.get('clienteTelefone')?.value,
      clienteEmail: email || this.clienteForm.get('clienteEmail')?.value
    });

    if (this.proposta) {
      this.proposta = {
        ...this.proposta,
        clienteContato: nome || this.proposta.clienteContato,
        clienteTelefone: telefone || this.proposta.clienteTelefone,
        clienteEmail: email || this.proposta.clienteEmail
      };
    }
  }

  isContatoModalConfirmDisabled(): boolean {
    const tel = (this.contatoInfo.telefone || '').replace(/\D/g, '');
    const email = (this.contatoInfo.email || '').trim();
    const action = this.pendingAction;
    if (action === 'whatsapp') {
      return tel.length < 10;
    }
    if (action === 'email') {
      return !email.includes('@');
    }
    return tel.length < 10 || !email.includes('@');
  }

  cancelarContato() {
    this.showContatoModal = false;
    this.pendingAction = null;
  }

  confirmarContato() {
    this.aplicarContatoInfoDoModal();
    const action = this.pendingAction;
    this.showContatoModal = false;
    this.pendingAction = null;

    if (action === 'email') {
      this.continuarEnvioEmail();
    } else if (action === 'whatsapp') {
      this.continuarEnvioWhatsApp();
    } else if (action === 'imprimir') {
      this.imprimir();
    }
  }

  abrirDialogEnvioWhatsApp() {
    if (!this.isProdutoValid || !this.isClienteValid) {
      this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'proposta.comercial.toast.warnBeforeSendEmail');
      return;
    }
    if (!this.proposta?.id) {
      this.pendingAction = 'whatsapp';
      this.salvarParaEnvio();
      return;
    }
    this.propostaService.getWhatsAppEnvioStatus().subscribe({
      next: (status) => {
        if (status.configured) {
          this.abrirModalContato('whatsapp');
          return;
        }
        this.confirmationService.confirm({
          header: this.i18n.translate('comercial.proposta.whatsapp.notConfiguredHeader'),
          message: this.i18n.translate('comercial.proposta.whatsapp.notConfiguredMsg'),
          icon: 'pi pi-info-circle',
          acceptLabel: this.i18n.translate('comercial.proposta.whatsapp.notConfiguredContinue'),
          rejectLabel: this.i18n.translate('comercial.proposta.dialog.btnCancel'),
          accept: () => this.abrirModalContato('whatsapp')
        });
      },
      error: () => this.abrirModalContato('whatsapp')
    });
  }

  continuarEnvioWhatsApp() {
    this.enviarWhatsApp();
  }

  getTelefoneWhatsAppDestino(): string {
    return (
      (this.contatoInfo.telefone || '').trim() ||
      (this.clienteForm.get('clienteTelefone')?.value || '').toString().trim() ||
      (this.proposta?.clienteTelefone || '').trim()
    );
  }

  canSendWhatsApp(): boolean {
    return this.getTelefoneWhatsAppDestino().replace(/\D/g, '').length >= 10;
  }

  private abrirWhatsappUrl(url: string): void {
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  }

  private baixarPdfBase64(base64: string, nomeArquivo: string): void {
    if (!base64?.trim()) {
      return;
    }
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo?.trim() || 'proposta-comercial.pdf';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  private confirmarEnvioWhatsAppManual(response: {
    whatsappUrl?: string;
    pdfBase64?: string;
    pdfNome?: string;
    errorMessage?: string;
  }): void {
    this.confirmationService.confirm({
      header: this.i18n.translate('comercial.proposta.whatsapp.manualConfirmHeader'),
      message: this.i18n.translate('comercial.proposta.whatsapp.manualConfirmMsg', {
        motivo: this.apiMessage(response.errorMessage)
      }),
      icon: 'pi pi-whatsapp',
      acceptLabel: this.i18n.translate('comercial.proposta.whatsapp.manualConfirmAccept'),
      rejectLabel: this.i18n.translate('comercial.proposta.dialog.btnCancel'),
      accept: () => this.executarEnvioWhatsAppManual(response)
    });
  }

  private executarEnvioWhatsAppManual(response: {
    whatsappUrl?: string;
    pdfBase64?: string;
    pdfNome?: string;
  }): void {
    const nomePdf =
      response.pdfNome?.trim() ||
      `Proposta_Comercial_${this.proposta?.numeroProposta || 'proposta'}.pdf`;

    if (response.pdfBase64) {
      this.baixarPdfBase64(response.pdfBase64, nomePdf);
    }

    if (response.whatsappUrl) {
      window.setTimeout(() => this.abrirWhatsappUrl(response.whatsappUrl!), 400);
    }

    this.i18n.addToast(
      this.messageService,
      'info',
      'comercial.proposta.toast.whatsappLinkSummary',
      'comercial.proposta.toast.whatsappLinkDetailPdf'
    );
  }

  enviarWhatsApp() {
    if (!this.proposta?.id) {
      return;
    }
    if (!this.canSendWhatsApp()) {
      this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'comercial.proposta.toast.whatsappNoPhone');
      return;
    }

    const telefoneDestino = this.getTelefoneWhatsAppDestino();

    this.enviandoWhatsApp = true;

    const signaturePayload = this.signatureData
      ? {
          name: this.signatureData.name,
          styleId: this.signatureData.styleId,
          fontFamily: this.signatureData.style.fontFamily,
          fontWeight: this.signatureData.style.fontWeight,
          fontSize: this.signatureData.style.fontSize,
          color: this.signatureData.style.color,
          letterSpacing: this.signatureData.style.letterSpacing
        }
      : undefined;

    this.propostaService
      .enviarPorWhatsApp(this.proposta.id, {
        telefoneDestino,
        mensagemAdicional: undefined,
        signature: signaturePayload
      })
      .subscribe({
        next: (response) => {
          this.enviandoWhatsApp = false;
          if (!response.success) {
            this.i18n.addToastLiteralDetail(
              this.messageService,
              'error',
              'comercial.proposta.toast.whatsappErrorSummary',
              this.apiMessage(response.message, 'comercial.proposta.toast.whatsappErrorSummary')
            );
            return;
          }
          if (response.fallback && response.whatsappUrl) {
            this.confirmarEnvioWhatsAppManual(response);
          } else {
            this.i18n.addToast(
              this.messageService,
              'success',
              'comercial.proposta.toast.whatsappSentSummary',
              'comercial.proposta.toast.whatsappSentDetail'
            );
          }
          this.atualizarPropostaStatusEnviada();
        },
        error: (err) => {
          this.enviandoWhatsApp = false;
          this.i18n.addToastLiteralDetail(
            this.messageService,
            'error',
            'comercial.proposta.toast.whatsappErrorSummary',
            this.apiMessage(
              err?.error?.message || err?.message,
              'comercial.proposta.toast.whatsappErrorSummary'
            )
          );
        }
      });
  }

  // ========== SELEÇÃO DE PRODUTOS ==========

  openProductSelector() {
    this.ensureProposalRates();
    this.showProductSelector = true;
  }

  onProductsSelected(items: PropostaItem[]) {
    // Garantir que todos os itens tenham PN e S/N inicializados
    this.propostaItems = items.map(item => ({
      ...item,
      produtoPn: item.produtoPn || item.product.productpn || '',
      produtoSn: item.produtoSn || ''
    }));
    this.showProductSelector = false;
    
    // Atualizar o valor do produto principal (primeiro item)
    if (this.propostaItems.length > 0) {
      const firstItem = this.propostaItems[0];
      this.produtoForm.patchValue({
        produtoNome: firstItem.product.name,
        produtoPn: firstItem.produtoPn || firstItem.product.productpn || '',
        produtoValor: this.getPropostaTotalValue()
      });
    }
    
    this.i18n.addToast(this.messageService, 'success', 'proposta.comercial.toast.productsUpdatedSummary', 'proposta.comercial.toast.productsUpdatedDetail', {
      count: String(items.length)
    });

    // Salvar automaticamente os itens se a proposta já existe
    this.salvarItensSilenciosamente();
  }

  onItemPnSnChanged(item: PropostaItem) {
    // Atualizar o valor do produto principal se for o primeiro item
    if (this.propostaItems.length > 0 && this.propostaItems[0] === item) {
      this.produtoForm.patchValue({
        produtoPn: item.produtoPn || item.product.productpn || ''
      });
    }
    // Salvar automaticamente os itens se a proposta já existe
    this.agendarSalvamentoAutomatico();
  }

  // Timer para debounce do salvamento automático
  private salvamentoAutomaticoTimer: any = null;

  /**
   * Agenda um salvamento automático com debounce de 1 segundo
   * Evita muitas requisições quando o usuário está digitando
   */
  agendarSalvamentoAutomatico() {
    // Cancelar timer anterior se existir
    if (this.salvamentoAutomaticoTimer) {
      clearTimeout(this.salvamentoAutomaticoTimer);
    }
    
    // Agendar novo salvamento em 1 segundo
    this.salvamentoAutomaticoTimer = setTimeout(() => {
      this.salvarItensSilenciosamente();
    }, 1000);
  }

  onProductSelectorCancelled() {
    this.showProductSelector = false;
  }

  updateItemTotal(item: PropostaItem) {
    item.valorTotal = item.quantidade * item.valorUnitario;
    // Atualizar valor total no form
    this.produtoForm.patchValue({
      produtoValor: this.getPropostaTotalValue()
    });
    // Salvar automaticamente os itens se a proposta já existe (com debounce)
    this.agendarSalvamentoAutomatico();
  }

  getSelectedCurrencyCode(): MoneyCurrency {
    return this.proposalCurrencyAsMoney();
  }

  onCurrencyChange() {
    this.ensureProposalRates();
    this.agendarSalvamentoAutomatico();
  }

  private ensureProposalRates(): void {
    if (this.selectedCurrency === 'USD') {
      return;
    }
    if (this.carregandoCotacao) {
      return;
    }
    this.carregandoCotacao = true;
    this.localeCurrency.refreshRates().subscribe({
      next: () => {
        this.cotacaoService.getCotacaoDolar().subscribe({
          next: (cotacao) => {
            this.cotacaoDolar = cotacao;
            this.carregandoCotacao = false;
          },
          error: () => {
            this.carregandoCotacao = false;
          }
        });
      },
      error: () => {
        this.carregandoCotacao = false;
        this.i18n.addToast(
          this.messageService,
          'warn',
          'proposta.comercial.toast.warnCotacaoSummary',
          'proposta.comercial.toast.warnCotacaoDolar'
        );
      }
    });
  }

  proposalRatesReady(): boolean {
    if (this.selectedCurrency === 'USD') {
      return true;
    }
    if (this.carregandoCotacao) {
      return false;
    }
    if (this.selectedCurrency === 'BRL') {
      return !!this.cotacaoDolar;
    }
    return true;
  }

  getItemUnitPriceDisplay(item: PropostaItem): number {
    const usd = item.valorUnitario || 0;
    if (this.selectedCurrency === 'USD') {
      return usd;
    }
    return this.roundMoney(this.localeCurrency.convertBetween(usd, 'USD', this.proposalCurrencyAsMoney()));
  }

  onItemUnitPriceChange(item: PropostaItem, value: number | null) {
    const normalizedValue = value || 0;
    if (this.selectedCurrency === 'USD') {
      item.valorUnitario = normalizedValue;
    } else {
      if (!this.proposalRatesReady()) {
        this.i18n.addToast(
          this.messageService,
          'warn',
          'proposta.comercial.toast.warnCotacaoIndisponivelSummary',
          'proposta.comercial.toast.warnCotacaoIndisponivelDetail'
        );
        return;
      }
      item.valorUnitario = this.roundMoney(
        this.localeCurrency.convertBetween(normalizedValue, this.proposalCurrencyAsMoney(), 'USD')
      );
    }
    this.updateItemTotal(item);
  }

  getItemTotalDisplay(item: PropostaItem): number {
    return item.quantidade * this.getItemUnitPriceDisplay(item);
  }

  /** Moeda da proposta (linhas / desconto fixo / totais intermediários antes do frete BR). */
  proposalCurrencyAsMoney(): MoneyCurrency {
    return coerceMoneyCurrency(this.selectedCurrency);
  }

  /** Taxa PTAX BCB — quando a proposta é negociada em BRL. */
  showProposalBcbRate(): boolean {
    return this.selectedCurrency === 'BRL' && !!this.cotacaoDolar;
  }

  /** Taxa EUR/USD (Frankfurter) — quando a proposta é negociada em EUR. */
  showProposalEurRate(): boolean {
    return this.selectedCurrency === 'EUR';
  }

  private roundMoney(value: number, digits = 2): number {
    const f = 10 ** digits;
    return Math.round(value * f) / f;
  }

  private amountUiFromProposal(amountInProposal: number): number {
    const ui = this.localeCurrency.getDisplayCurrency();
    const prop = this.proposalCurrencyAsMoney();
    return this.roundMoney(this.localeCurrency.convertBetween(amountInProposal, prop, ui));
  }

  private amountProposalFromUi(amountUi: number): number {
    const ui = this.localeCurrency.getDisplayCurrency();
    const prop = this.proposalCurrencyAsMoney();
    return this.roundMoney(this.localeCurrency.convertBetween(amountUi, ui, prop));
  }

  hasUiCurrencyConversion(): boolean {
    const ui = this.localeCurrency.getDisplayCurrency();
    const prop = this.proposalCurrencyAsMoney();
    return prop !== ui || this.freteBrl > 0 || this.maoDeObraBrl > 0;
  }

  showMoneyDisclosurePanel(): boolean {
    return this.showProposalBcbRate() || this.showProposalEurRate() || this.getUiMoneyDisclosureLines().length > 0;
  }

  /** Fontes de câmbio centralizadas (idioma da interface + moeda da proposta). */
  getUiMoneyDisclosureLines(): string[] {
    const lines: string[] = [];
    const seen = new Set<string>();
    const add = (raw: string) => {
      const t = (raw ?? '').trim();
      if (t && !seen.has(t)) {
        seen.add(t);
        lines.push(t);
      }
    };

    const ui = this.localeCurrency.getDisplayCurrency();
    const prop = this.proposalCurrencyAsMoney();

    add(this.i18n.translate('locale.money.storedIn', { currency: prop }));

    if (prop !== ui) {
      add(this.localeCurrency.getRateSourcesLine(prop));
    }

    const hasBrlCosts = this.freteBrl > 0 || this.maoDeObraBrl > 0;
    if (hasBrlCosts && ui !== 'BRL') {
      add(this.localeCurrency.getRateSourcesLine('BRL'));
    } else if (hasBrlCosts && prop === 'USD' && ui === 'BRL' && !this.showProposalBcbRate()) {
      add(this.localeCurrency.getRateSourcesLine('BRL'));
    }

    return lines;
  }

  getItemUnitPriceUi(item: PropostaItem): number {
    return this.amountUiFromProposal(this.getItemUnitPriceDisplay(item));
  }

  onItemUnitPriceUiChange(item: PropostaItem, value: number | null): void {
    this.onItemUnitPriceChange(item, this.amountProposalFromUi(value ?? 0));
  }

  getDiscountFixedUi(): number {
    return this.amountUiFromProposal(this.discountFixed);
  }

  setDiscountFixedUi(value: number | null): void {
    const maxProp = this.getPropostaTotalValueInSelectedCurrency();
    const inProp = Math.min(this.amountProposalFromUi(value ?? 0), maxProp);
    this.discountFixed = inProp;
    this.onDiscountChange();
  }

  getDiscountFixedUiMax(): number {
    return this.amountUiFromProposal(this.getPropostaTotalValueInSelectedCurrency());
  }

  getFreteUi(): number {
    return this.roundMoney(
      this.localeCurrency.convertBetween(this.freteBrl, 'BRL', this.localeCurrency.getDisplayCurrency())
    );
  }

  setFreteUi(value: number | null): void {
    const brl = this.localeCurrency.convertBetween(value ?? 0, this.localeCurrency.getDisplayCurrency(), 'BRL');
    this.freteBrl = this.roundMoney(brl);
    this.onCostChange();
  }

  getMaoDeObraUi(): number {
    return this.roundMoney(
      this.localeCurrency.convertBetween(this.maoDeObraBrl, 'BRL', this.localeCurrency.getDisplayCurrency())
    );
  }

  setMaoDeObraUi(value: number | null): void {
    const brl = this.localeCurrency.convertBetween(value ?? 0, this.localeCurrency.getDisplayCurrency(), 'BRL');
    this.maoDeObraBrl = this.roundMoney(brl);
    this.onCostChange();
  }

  /** Para HTML de impressão: valor na moeda do idioma ativo (fonte igual à listagem da proposta). */
  formatProposalTotalForExport(amountInProposalCurrency: number): string {
    return this.localeCurrency.formatMoney(amountInProposalCurrency, this.proposalCurrencyAsMoney(), {
      showFootnote: false
    }).formatted;
  }

  removePropostaItem(index: number) {
    this.propostaItems.splice(index, 1);
    this.produtoForm.patchValue({
      produtoValor: this.getPropostaTotalValue()
    });
    
    // Se removeu todos, limpar o nome do produto
    if (this.propostaItems.length === 0) {
      this.produtoForm.patchValue({
        produtoNome: '',
        produtoPn: ''
      });
    } else {
      // Atualizar com o primeiro produto
      const firstItem = this.propostaItems[0];
      this.produtoForm.patchValue({
        produtoNome: firstItem.product.name,
        produtoPn: firstItem.product.productpn || ''
      });
    }

    // Salvar automaticamente os itens se a proposta já existe
    this.salvarItensSilenciosamente();
  }

  getPropostaTotalValue(): number {
    return this.propostaItems.reduce((total, item) => total + item.valorTotal, 0);
  }

  getPropostaTotalValueInSelectedCurrency(): number {
    return this.propostaItems.reduce((total, item) => total + this.getItemTotalDisplay(item), 0);
  }

  /**
   * Salva os itens da proposta de forma silenciosa (sem mensagem de sucesso)
   * Chamado automaticamente quando produtos são adicionados ou removidos
   */
  salvarItensSilenciosamente() {
    // Só salvar se a proposta já existe (tem ID)
    if (!this.proposta?.id) {
      return;
    }

    const proposta: PropostaComercial = {
      ...this.buildPropostaBasePayload(this.proposta?.status || 'RASCUNHO')
    };

    this.propostaService.update(this.proposta.id, proposta).subscribe({
      next: (result) => {
        this.proposta = result;
      },
      error: (err) => {
        console.error('Failed to auto-save items:', err);
        // Não mostrar mensagem de erro para não incomodar o usuário
      }
    });
  }

  getTotalQuantidade(): number {
    return this.propostaItems.reduce((total, item) => total + item.quantidade, 0);
  }

  // ========== DESCONTO ==========

  toggleDiscount() {
    this.showDiscount = !this.showDiscount;
    if (!this.showDiscount) {
      this.discountPercent = 0;
      this.discountFixed = 0;
      this.onDiscountChange();
    }
  }

  setDiscountType(type: 'percent' | 'fixed') {
    this.discountType = type;
    // Resetar valores ao trocar tipo
    this.discountPercent = 0;
    this.discountFixed = 0;
    this.onDiscountChange();
  }

  onDiscountChange() {
    // Atualizar valor do produto no form
    this.produtoForm.patchValue({
      produtoValor: this.getFinalTotalValue()
    });
    // Salvar automaticamente
    this.agendarSalvamentoAutomatico();
  }

  getDiscountValue(): number {
    const subtotal = this.getPropostaTotalValue();
    if (this.discountType === 'percent') {
      return subtotal * (this.discountPercent / 100);
    } else {
      return Math.min(this.discountFixed, subtotal);
    }
  }

  getDiscountValueInSelectedCurrency(): number {
    const subtotal = this.getPropostaTotalValueInSelectedCurrency();
    if (this.discountType === 'percent') {
      return subtotal * (this.discountPercent / 100);
    }
    return Math.min(this.discountFixed, subtotal);
  }

  getFinalTotalValue(): number {
    return this.getPropostaTotalValue() - this.getDiscountValue();
  }

  getFinalTotalValueInSelectedCurrency(): number {
    return this.getPropostaTotalValueInSelectedCurrency() - this.getDiscountValueInSelectedCurrency();
  }

  // ========== COTAÇÃO E CONVERSÃO ==========

  carregarCotacao() {
    this.carregandoCotacao = true;
    this.cotacaoService.getCotacaoDolar().subscribe({
      next: (cotacao) => {
        this.cotacaoDolar = cotacao;
        this.carregandoCotacao = false;
      },
      error: (err) => {
        console.error('Failed to load exchange rate:', err);
        this.carregandoCotacao = false;
        this.i18n.addToast(this.messageService, 'warn', 'proposta.comercial.toast.warnCotacaoSummary', 'proposta.comercial.toast.warnCotacaoDolar');
      }
    });
  }

  atualizarCotacao() {
    this.cotacaoService.clearCache();
    this.carregarCotacao();
  }

  onCostChange() {
    // Atualizar totais quando frete ou mão de obra mudam
    this.agendarSalvamentoAutomatico();
  }

  getFreteUsd(): number {
    if (!this.cotacaoDolar || this.freteBrl <= 0) return 0;
    return this.cotacaoService.convertBrlToUsd(this.freteBrl, this.cotacaoDolar);
  }

  getMaoDeObraUsd(): number {
    if (!this.cotacaoDolar || this.maoDeObraBrl <= 0) return 0;
    return this.cotacaoService.convertBrlToUsd(this.maoDeObraBrl, this.cotacaoDolar);
  }

  getTotalGeralUsd(): number {
    // Produtos (já em USD) - desconto + frete convertido + mão de obra convertida
    const subtotalProdutos = this.getFinalTotalValue(); // Já com desconto aplicado
    const freteUsd = this.getFreteUsd();
    const maoDeObraUsd = this.getMaoDeObraUsd();
    return subtotalProdutos + freteUsd + maoDeObraUsd;
  }

  getFreteInSelectedCurrency(): number {
    if (this.freteBrl <= 0) {
      return 0;
    }
    if (this.selectedCurrency === 'BRL') {
      return this.freteBrl;
    }
    return this.roundMoney(
      this.localeCurrency.convertBetween(this.freteBrl, 'BRL', this.proposalCurrencyAsMoney())
    );
  }

  getMaoDeObraInSelectedCurrency(): number {
    if (this.maoDeObraBrl <= 0) {
      return 0;
    }
    if (this.selectedCurrency === 'BRL') {
      return this.maoDeObraBrl;
    }
    return this.roundMoney(
      this.localeCurrency.convertBetween(this.maoDeObraBrl, 'BRL', this.proposalCurrencyAsMoney())
    );
  }

  getFreteLabel(): string {
    if (this.selectedCurrency === 'BRL') {
      return this.i18n.translate('comercial.proposta.lbl.freteBrlTit');
    }
    return this.i18n.translate('comercial.proposta.lbl.freteConv', {
      brl: this.freteBrl.toFixed(2)
    });
  }

  getMaoDeObraLabel(): string {
    if (this.selectedCurrency === 'BRL') {
      return this.i18n.translate('comercial.proposta.lbl.moBrlTit');
    }
    return this.i18n.translate('comercial.proposta.lbl.moConv', {
      brl: this.maoDeObraBrl.toFixed(2)
    });
  }

  getTotalGeralInSelectedCurrency(): number {
    const subtotalProdutos = this.getFinalTotalValueInSelectedCurrency();
    return subtotalProdutos + this.getFreteInSelectedCurrency() + this.getMaoDeObraInSelectedCurrency();
  }

  // ========== ENVIO DE EMAIL ==========

  abrirDialogEnvioEmail() {
    // Verificar campos obrigatórios
    if (!this.isProdutoValid || !this.isClienteValid) {
      this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'proposta.comercial.toast.warnBeforeSendEmail');
      return;
    }

    // Primeiro salvar a proposta se ainda não foi salva
    if (!this.proposta?.id) {
      this.salvarParaEnvio();
      return;
    }

    // Abrir modal de contato primeiro
    this.abrirModalContato('email');
  }

  continuarEnvioEmail() {
    // Preencher email de destino: formulário do cliente ou proposta já salva
    const emailCliente = this.clienteForm.get('clienteEmail')?.value || '';
    const emailProposta = this.proposta?.clienteEmail || '';
    this.emailEnvio.emailDestino = (emailCliente || emailProposta || '').trim();
    this.emailEnvio.assunto = this.i18n.translate('comercial.proposta.email.assuntoDefault', {
      num: this.proposta?.numeroProposta || ''
    });
    this.emailEnvio.tipoEnvio = 'corpo';
    this.emailEnvio.mensagemAdicional = '';
    this.showEnvioEmailDialog = true;
  }

  onTipoEnvioChanged() {
    if (this.emailEnvio.tipoEnvio === 'anexo') {
      // Gerar mensagem automática com saudação baseada no horário
      this.emailEnvio.mensagemAdicional = this.gerarMensagemAnexo();
    } else {
      const m = this.emailEnvio.mensagemAdicional || '';
      const autoGreetings = [
        'Bom dia',
        'Boa tarde',
        'Boa noite',
        'Good morning',
        'Good afternoon',
        'Good evening'
      ];
      if (autoGreetings.some((g) => m.trimStart().startsWith(g))) {
        this.emailEnvio.mensagemAdicional = '';
      }
    }
  }

  gerarMensagemAnexo(): string {
    const hora = new Date().getHours();
    let saudKey = 'comercial.proposta.email.saudManha';
    if (hora >= 12 && hora < 18) {
      saudKey = 'comercial.proposta.email.saudTarde';
    } else if (hora >= 18 || hora < 6) {
      saudKey = 'comercial.proposta.email.saudNoite';
    }
    const saudacao = this.i18n.translate(saudKey);
    const num = (this.proposta?.numeroProposta || '').trim();
    const remetente = this.contatoInfo.nome || this.i18n.translate('comercial.proposta.email.anexoEquipeFallback');
    const empresa = this.previewEmpresaTitulo();

    return this.i18n.translate('comercial.proposta.email.corpoAnexo', {
      saudacao,
      num,
      remetente,
      empresa,
      tel: this.contatoInfo.telefone || '',
      email: this.contatoInfo.email || ''
    });
  }

  salvarParaEnvio() {
    this.saving = true;

    const proposta: PropostaComercial = this.buildPropostaBasePayload('RASCUNHO');

    // Controle único: id presente (rota ou proposta) = atualizar; sem id = criar nova (nunca enviar numeroProposta no create)
    const request = this.deveUsarUpdate && this.propostaId
      ? this.propostaService.update(this.propostaId, proposta)
      : this.propostaService.create({ ...proposta, numeroProposta: undefined });

    request.subscribe({
      next: (result) => {
        this.saving = false;
        this.proposta = result;
        this.isEditMode = true;
        
        const nextAction = this.pendingAction ?? 'email';
        this.pendingAction = null;
        this.abrirModalContato(nextAction);
      },
      error: (err) => {
        this.saving = false;
        console.error('Failed to save:', err);
        this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'proposta.comercial.toast.saveError');
      }
    });
  }

  canSendEmail(): boolean {
    if (!this.proposta?.id) return false;
    const email = (this.emailEnvio.emailDestino || this.clienteForm.get('clienteEmail')?.value || this.proposta?.clienteEmail || '').trim();
    return email.length > 0 && email.includes('@');
  }

  enviarEmail() {
    if (!this.canSendEmail() || !this.proposta?.id) return;

    this.enviandoEmail = true;

    // Montar request de envio
    const request: EnviarPropostaEmailRequest = {
      propostaId: this.proposta.id,
      emailDestino: (this.emailEnvio.emailDestino || '').trim() || (this.clienteForm.get('clienteEmail')?.value || '').trim(),
      assunto: this.emailEnvio.assunto || undefined,
      mensagemAdicional: this.emailEnvio.mensagemAdicional || undefined,
      tipoEnvio: this.emailEnvio.tipoEnvio || 'corpo',
      telefoneRemetente: this.contatoInfo?.telefone || undefined,
      emailRemetente: this.contatoInfo?.email || undefined,
      ...this.buildEnvioSnapshot()
    };

    // Adicionar itens da proposta (produtos com quantidade, P/N, S/N)
    if (this.propostaItems && this.propostaItems.length > 0) {
      request.items = this.propostaItems.map(item => ({
        produtoNome: item.product.name,
        produtoDescricao: item.product.description,
        produtoPn: item.produtoPn || item.product.productpn || '',
        produtoSn: item.produtoSn || '',
        quantidade: item.quantidade,
        valorUnitario: item.valorUnitario,
        valorTotal: item.valorTotal
      }));
    }

    // Adicionar dados de assinatura se existir
    if (this.signatureData) {
      request.signature = {
        name: this.signatureData.name,
        styleId: this.signatureData.styleId,
        fontFamily: this.signatureData.style.fontFamily,
        fontWeight: this.signatureData.style.fontWeight,
        fontSize: this.signatureData.style.fontSize,
        color: this.signatureData.style.color,
        letterSpacing: this.signatureData.style.letterSpacing
      };
    }

    this.propostaService.enviarPorEmail(request).subscribe({
      next: (response) => {
        this.enviandoEmail = false;
        this.showEnvioEmailDialog = false;
        
        if (response.success) {
          this.atualizarPropostaStatusEnviada();
          this.showSuccessDialog = true;
        } else {
          this.i18n.addToastLiteralDetail(
            this.messageService,
            'error',
            'proposta.comercial.toast.emailSendErrorSummary',
            this.apiMessage(response.message, 'proposta.comercial.toast.emailSendFailureFallback')
          );
        }
      },
      error: (err) => {
        this.enviandoEmail = false;
        this.showEnvioEmailDialog = false;
        console.error('Failed to send email:', err);
        this.i18n.addToastLiteralDetail(
          this.messageService,
          'error',
          'proposta.comercial.toast.emailSendErrorSummary',
          this.apiMessage(
            err?.error?.message || err?.message,
            'proposta.comercial.toast.emailSendHttpFallback'
          )
        );
      }
    });
  }

  canGerarOs(): boolean {
    return !!(this.isEditMode && this.proposta?.id && !this.proposta.osId);
  }

  canEnviarPedidoBling(): boolean {
    return !!(
      this.isEditMode &&
      this.proposta?.id &&
      this.proposta.status === 'APROVADA' &&
      !this.blingPedido?.linked
    );
  }

  canEmitirNfeBling(): boolean {
    return !!(this.isEditMode && this.proposta?.id && this.blingPedido?.linked);
  }

  loadBlingIntegracao(propostaId: number): void {
    this.blingApi.getPropostaPedido(propostaId).subscribe({
      next: view => {
        this.blingPedido = view;
        if (view.linked) {
          this.blingApi.listPropostaNfe(propostaId).subscribe({
            next: list => (this.blingNfeList = list.items ?? []),
            error: () => (this.blingNfeList = []),
          });
          this.loadBlingFluxo(propostaId);
        } else {
          this.blingNfeList = [];
          this.blingFluxo = null;
        }
      },
      error: () => {
        this.blingPedido = null;
        this.blingNfeList = [];
        this.blingFluxo = null;
      },
    });
  }

  loadBlingFluxo(propostaId: number): void {
    this.blingApi.getPropostaFluxo(propostaId).subscribe({
      next: fluxo => (this.blingFluxo = fluxo),
      error: () => (this.blingFluxo = null),
    });
  }

  fluxoPassoLabel(passo: BlingPropostaFluxoPasso): string {
    const code = passo.codigo || '';
    const key = `comercial.proposta.bling.fluxoStep.${code}`;
    const translated = this.i18n.translate(key);
    return translated !== key ? translated : passo.titulo || code;
  }

  fluxoAutomacaoLabel(): string {
    const motivo = this.blingFluxo?.automacaoMotivo;
    if (motivo && motivo !== 'NENHUM') {
      const key = `comercial.proposta.bling.fluxoMotivo.${motivo}`;
      const translated = this.i18n.translate(key);
      if (translated !== key) {
        return translated;
      }
    }
    return this.i18n.translate('comercial.proposta.bling.fluxoPendente');
  }

  reprocessarFluxoBling(): void {
    if (!this.proposta?.id) {
      return;
    }
    this.reprocessandoFluxoBling = true;
    this.blingApi.retryPropostaFluxo(this.proposta.id).subscribe({
      next: result => {
        this.reprocessandoFluxoBling = false;
        if (result.fluxo) {
          this.blingFluxo = result.fluxo;
        }
        this.i18n.addToastLiteralDetail(
          this.messageService,
          result.success ? 'success' : 'warn',
          'common.toast.success',
          this.apiMessage(result.message, 'comercial.proposta.bling.fluxoRetryOk')
        );
        this.loadBlingIntegracao(this.proposta!.id!);
        this.loadProposta(this.proposta!.id!);
      },
      error: err => {
        this.reprocessandoFluxoBling = false;
        this.i18n.addToastLiteralDetail(
          this.messageService,
          'error',
          'common.toast.error',
          this.apiMessage(err?.error?.message, 'comercial.proposta.bling.fluxoRetryErr')
        );
      },
    });
  }

  confirmarPedidoBling(): void {
    if (!this.proposta?.id || this.blingPedido?.linked) {
      return;
    }
    this.confirmationService.confirm({
      header: this.i18n.translate('comercial.proposta.bling.pedidoConfirmHeader'),
      message: this.i18n.translate('comercial.proposta.bling.pedidoConfirmMsg'),
      icon: 'pi pi-shopping-cart',
      accept: () => this.executarPedidoBling(),
    });
  }

  executarPedidoBling(): void {
    if (!this.proposta?.id) {
      return;
    }
    this.gerandoPedidoBling = true;
    this.blingApi.createPropostaPedido(this.proposta.id).subscribe({
      next: view => {
        this.gerandoPedidoBling = false;
        this.blingPedido = view;
        this.i18n.addToast(
          this.messageService,
          'success',
          'common.toast.success',
          'comercial.proposta.bling.pedidoOk'
        );
        if (this.proposta?.id) {
          this.loadBlingIntegracao(this.proposta.id);
          this.loadProposta(this.proposta.id);
        }
      },
      error: err => {
        this.gerandoPedidoBling = false;
        this.i18n.addToastLiteralDetail(
          this.messageService,
          'error',
          'common.toast.error',
          this.apiMessage(err?.error?.message, 'comercial.proposta.bling.pedidoErr')
        );
      },
    });
  }

  confirmarEmitirNfeBling(): void {
    if (!this.proposta?.id || !this.blingPedido?.linked) {
      return;
    }
    this.confirmationService.confirm({
      header: this.i18n.translate('comercial.proposta.bling.nfeEmitConfirmHeader'),
      message: this.i18n.translate('comercial.proposta.bling.nfeEmitConfirmMsg'),
      icon: 'pi pi-file-export',
      accept: () => this.executarEmitirNfeBling(),
    });
  }

  executarEmitirNfeBling(): void {
    if (!this.proposta?.id) {
      return;
    }
    this.emitindoNfeBling = true;
    this.blingApi.emitirPropostaNfe(this.proposta.id).subscribe({
      next: () => {
        this.emitindoNfeBling = false;
        this.i18n.addToast(
          this.messageService,
          'success',
          'common.toast.success',
          'comercial.proposta.bling.nfeEmitOk'
        );
        this.loadBlingIntegracao(this.proposta!.id!);
        if (this.proposta?.id) {
          this.loadBlingFluxo(this.proposta.id);
        }
      },
      error: err => {
        this.emitindoNfeBling = false;
        this.i18n.addToastLiteralDetail(
          this.messageService,
          'error',
          'common.toast.error',
          this.apiMessage(err?.error?.message, 'comercial.proposta.bling.nfeEmitErr')
        );
        if (this.proposta?.id) {
          this.loadBlingFluxo(this.proposta.id);
        }
      },
    });
  }

  showHeaderWorkflowRow(): boolean {
    if (this.carregandoProposta || !this.isEditMode || !this.proposta?.id) {
      return false;
    }
    const showAprovar = !this.proposta.osId && this.proposta.status !== 'APROVADA';
    return !!(this.proposta.osId || this.canGerarOs() || this.canEnviarPedidoBling() || this.canEmitirNfeBling() || this.blingPedido?.linked || showAprovar || this.podeAcaoPortal());
  }

  propostaVisivelNoPortal = propostaVisivelNoPortal;

  podeAcaoPortal(): boolean {
    return this.isEditMode && !!this.proposta?.id && propostaPodeAcaoPortal(this.proposta?.status);
  }

  podeGerenciarPortalTab(): boolean {
    return this.isEditMode && !!this.proposta?.id && propostaPodeGerenciarPortalTab(this.proposta?.status);
  }

  get portalClienteEmail(): string {
    return (this.clienteForm.get('clienteEmail')?.value || this.proposta?.clienteEmail || '').trim();
  }

  get portalNomeContatoDefault(): string {
    return (this.clienteForm.get('clienteContato')?.value || this.clienteForm.get('clienteNome')?.value || '').trim();
  }

  abrirOsVinculada(): void {
    if (!this.proposta?.osId) {
      return;
    }
    this.router.navigate(['/os'], { queryParams: { editId: String(this.proposta.osId) } });
  }

  marcarAprovada(): void {
    if (!this.proposta?.id) {
      return;
    }
    this.aprovandoProposta = true;
    this.propostaService.changeStatus(this.proposta.id, 'APROVADA').subscribe({
      next: (updated) => {
        this.aprovandoProposta = false;
        this.proposta = { ...this.proposta!, ...updated };
        this.i18n.addToast(this.messageService, 'success', 'common.toast.success', 'comercial.proposta.toast.aprovarOk');
      },
      error: () => {
        this.aprovandoProposta = false;
        this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'comercial.proposta.toast.gerarOsErr');
      }
    });
  }

  confirmarGerarOs(): void {
    if (!this.proposta?.id || this.proposta.osId) {
      return;
    }
    const needsApprove = this.proposta.status !== 'APROVADA';
    this.confirmationService.confirm({
      header: this.i18n.translate('comercial.proposta.gerarOs.confirmHeader'),
      message: this.i18n.translate(
        needsApprove ? 'comercial.proposta.gerarOs.confirmAprovarMsg' : 'comercial.proposta.gerarOs.confirmMsg'
      ),
      icon: 'pi pi-briefcase',
      accept: () => {
        if (needsApprove) {
          this.aprovandoProposta = true;
          this.propostaService.changeStatus(this.proposta!.id!, 'APROVADA').subscribe({
            next: (updated) => {
              this.aprovandoProposta = false;
              this.proposta = { ...this.proposta!, ...updated };
              this.executarGerarOs();
            },
            error: () => {
              this.aprovandoProposta = false;
              this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'comercial.proposta.toast.gerarOsErr');
            }
          });
        } else {
          this.executarGerarOs();
        }
      }
    });
  }

  private executarGerarOs(): void {
    if (!this.proposta?.id) {
      return;
    }
    this.gerandoOs = true;
    this.propostaService.gerarOs(this.proposta.id).subscribe({
      next: (result) => {
        this.gerandoOs = false;
        this.proposta = { ...this.proposta!, ...result.proposta };
        this.i18n.addToast(this.messageService, 'success', 'common.toast.success', 'comercial.proposta.toast.gerarOsOk');
        if (result.os?.id) {
          this.confirmationService.confirm({
            header: this.i18n.translate('comercial.proposta.gerarOs.confirmHeader'),
            message: this.i18n.translate('comercial.proposta.toast.gerarOsOk'),
            icon: 'pi pi-check',
            acceptLabel: this.i18n.translate('comercial.proposta.btn.abrirOs'),
            rejectLabel: this.i18n.translate('comercial.proposta.dialog.btnCancel'),
            accept: () => this.abrirOsVinculada()
          });
        }
      },
      error: (err) => {
        this.gerandoOs = false;
        this.i18n.addToastLiteralDetail(
          this.messageService,
          'error',
          'common.toast.error',
          this.apiMessage(
            typeof err?.error === 'string' ? err.error : err?.error?.message,
            'comercial.proposta.toast.gerarOsErr'
          )
        );
      }
    });
  }

  voltarParaLista() {
    this.showSuccessDialog = false;
    this.router.navigate(['/propostas-comerciais']);
  }

  abrirDialogPortal(): void {
    const email = this.portalClienteEmail;
    if (!email || !email.includes('@')) {
      this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'comercial.proposta.portal.noEmail');
      this.activeTabIndex = 1;
      return;
    }
    if (!this.proposta?.id) {
      this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'comercial.proposta.portal.saveFirst');
      return;
    }
    this.showPortalDialog = true;
  }

  onPortalPublished(result: PropostaDisponibilizarPortalResult): void {
    this.proposta = result.proposta;
    this.patchForms(result.proposta);
    this.syncPortalFromProposta(result.proposta);
    if (result.proposta.clientePropostaId) {
      this.loadClientePropostaVinculo(result.proposta);
    }
  }

  private loadClientePropostaVinculo(proposta: PropostaComercial): void {
    if (!proposta.clientePropostaId) {
      return;
    }
    this.clientePropostaService.findById(proposta.clientePropostaId).subscribe({
      next: (cliente) => {
        this.clienteSelecionado = cliente;
        this.clienteBuscaTexto = cliente.nome ?? '';
      },
      error: () => { /* cliente pode ter sido removido */ }
    });
  }

  private syncPortalFromProposta(proposta: PropostaComercial): void {
    this.portalAditivos = proposta.aditivos ? [...proposta.aditivos] : [];
    this.portalAnexos = proposta.anexos ? [...proposta.anexos] : [];
  }

  private refreshPortalLists(): void {
    const id = this.proposta?.id;
    if (!id) return;
    this.propostaService.listarAditivos(id).subscribe({
      next: list => { this.portalAditivos = list; },
      error: () => { /* mantém lista do findById */ }
    });
    this.propostaService.listarAnexos(id).subscribe({
      next: list => { this.portalAnexos = list; },
      error: () => { /* mantém lista do findById */ }
    });
  }

  enviarAditivoOficina(): void {
    const id = this.proposta?.id;
    if (!id) {
      this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'comercial.proposta.portal.toast.needSalvar');
      return;
    }
    const desc = this.portalAditivoDesc.trim();
    if (!desc) {
      this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'comercial.proposta.portal.toast.needDescricao');
      return;
    }
    this.portalSalvandoAditivo = true;
    this.propostaService.criarAditivoOficina(id, {
      descricao: desc,
      valor: this.portalAditivoValor ?? undefined
    }).subscribe({
      next: () => {
        this.portalSalvandoAditivo = false;
        this.portalAditivoDesc = '';
        this.portalAditivoValor = null;
        this.i18n.addToast(this.messageService, 'success', 'common.toast.success', 'comercial.proposta.portal.toast.aditivoOk');
        this.refreshPortalLists();
        this.propostaService.getById(id).subscribe({
          next: p => {
            this.proposta = p;
            this.syncPortalFromProposta(p);
          }
        });
      },
      error: () => {
        this.portalSalvandoAditivo = false;
        this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'comercial.proposta.portal.toast.aditivoErr');
      }
    });
  }

  baixarAnexoPortal(anexo: PropostaAnexo): void {
    const propostaId = this.proposta?.id;
    if (!propostaId || !anexo.id) return;
    const url = this.propostaService.downloadAnexoUrl(propostaId, anexo.id);
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = anexo.nomeArquivo || 'anexo';
        a.click();
        URL.revokeObjectURL(a.href);
      },
      error: () => {
        this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'comercial.proposta.portal.toast.aditivoErr');
      }
    });
  }

  formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
