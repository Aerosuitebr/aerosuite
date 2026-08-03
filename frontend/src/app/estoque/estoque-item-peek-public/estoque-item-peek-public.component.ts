import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { EstoquePublicService, ItemEstoquePublicPeek } from '../../core/estoque-public.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { BrandingService } from '../../core/branding.service';

@Component({
  selector: 'app-estoque-item-peek-public',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, TagModule, ProgressSpinnerModule, TranslatePipe],
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background: linear-gradient(160deg, #0f172a 0%, #1e3a5f 45%, #0f172a 100%);
        padding: 1rem;
        box-sizing: border-box;
      }
      .peek-shell {
        max-width: 420px;
        margin: 0 auto;
        padding-top: 0.5rem;
      }
      .peek-card {
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
        overflow: hidden;
      }
      .peek-header {
        padding: 1rem 1.25rem;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      .peek-header img {
        width: 36px;
        height: 36px;
        object-fit: contain;
      }
      .peek-header h1 {
        margin: 0;
        font-size: 1rem;
        font-weight: 700;
        color: #0f172a;
      }
      .peek-header p {
        margin: 0.15rem 0 0;
        font-size: 0.8rem;
        color: #64748b;
      }
      .peek-body {
        padding: 1rem 1.25rem 1.25rem;
      }
      .codigo {
        font-family: Consolas, monospace;
        font-size: 1.05rem;
        font-weight: 700;
        color: #0369a1;
        word-break: break-all;
        margin-bottom: 0.75rem;
      }
      .row {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 0.45rem;
        font-size: 0.9rem;
        line-height: 1.35;
      }
      .row label {
        flex: 0 0 38%;
        color: #64748b;
        font-weight: 600;
      }
      .row span {
        flex: 1;
        color: #0f172a;
        word-break: break-word;
      }
      .peek-actions {
        padding: 0 1.25rem 1.25rem;
      }
      .state-box {
        text-align: center;
        color: #fff;
        padding: 3rem 1rem;
      }
      .state-box.error {
        color: #fecaca;
      }
    `
  ],
  template: `
    <div class="peek-shell">
      <div class="state-box" *ngIf="loading">
        <p-progressSpinner strokeWidth="4" />
        <p>{{ 'estoque.qrPeek.loading' | translate }}</p>
      </div>

      <div class="state-box error" *ngIf="!loading && erroKey">
        <i class="pi pi-exclamation-triangle" style="font-size: 2rem"></i>
        <p>{{ erroKey | translate }}</p>
      </div>

      <div class="peek-card" *ngIf="!loading && item">
        <div class="peek-header">
          <img [src]="logoUrl" alt="" />
          <div>
            <h1>{{ 'estoque.qrPeek.title' | translate }}</h1>
            <p>{{ commercialName }}</p>
          </div>
        </div>
        <div class="peek-body">
          <div class="codigo">{{ item.codigoRastreio }}</div>
          <p-tag *ngIf="item.status" [value]="item.status" severity="info"></p-tag>
          <div class="row" style="margin-top: 0.75rem">
            <label>{{ 'estoque.consultaQr.label.partNumber' | translate }}</label>
            <span>{{ item.partNumber }}</span>
          </div>
          <div class="row" *ngIf="item.serialNumber">
            <label>{{ 'estoque.consultaQr.label.serialNumber' | translate }}</label>
            <span>{{ item.serialNumber }}</span>
          </div>
          <div class="row" *ngIf="item.descricao">
            <label>{{ 'estoque.consultaQr.label.description' | translate }}</label>
            <span>{{ item.descricao }}</span>
          </div>
          <div class="row" *ngIf="item.fornecedorNome">
            <label>{{ 'estoque.consultaQr.label.supplier' | translate }}</label>
            <span>{{ item.fornecedorNome }}</span>
          </div>
          <div class="row" *ngIf="item.loteCodigo">
            <label>{{ 'estoque.consultaQr.label.batch' | translate }}</label>
            <span>{{ item.loteCodigo }}</span>
          </div>
          <div class="row" *ngIf="item.localizacao">
            <label>{{ 'estoque.consultaQr.label.location' | translate }}</label>
            <span>{{ item.localizacao }}</span>
          </div>
          <div class="row" *ngIf="item.certificadoConformidade">
            <label>{{ 'estoque.consultaQr.label.certificate' | translate }}</label>
            <span>{{ item.certificadoConformidade }}</span>
          </div>
        </div>
        <div class="peek-actions">
          <a
            pButton
            class="p-button-outlined w-full"
            [routerLink]="['/login']"
            [queryParams]="loginQueryParams"
            [label]="'estoque.qrPeek.openInApp' | translate"
            icon="pi pi-sign-in"></a>
        </div>
      </div>
    </div>
  `
})
export class EstoqueItemPeekPublicComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private publicApi = inject(EstoquePublicService);
  private branding = inject(BrandingService);

  loading = true;
  erroKey: string | null = null;
  item: ItemEstoquePublicPeek | null = null;
  logoUrl = '';
  commercialName = 'Aero Suite';
  loginQueryParams: Record<string, string> = {};

  ngOnInit(): void {
    const codigo = decodeURIComponent(this.route.snapshot.paramMap.get('codigo') ?? '').trim();
    const tenant = (this.route.snapshot.queryParamMap.get('tenant') ?? 'default').trim().toLowerCase();

    void this.branding.load({ tenantCodigo: tenant }).then(() => {
      const cfg = this.branding.config();
      this.logoUrl = cfg.logoUrl;
      this.commercialName = cfg.commercialName || 'Aero Suite';
    });

    this.loginQueryParams = {
      returnUrl: `/estoque/consulta-qr?cod=${encodeURIComponent(codigo)}`
    };

    if (!codigo) {
      this.loading = false;
      this.erroKey = 'estoque.qrPeek.error.invalidCode';
      return;
    }

    this.publicApi.consultarItem(tenant, codigo).subscribe({
      next: (data) => {
        this.item = data;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.erroKey =
          err?.status === 404 ? 'estoque.qrPeek.error.notFound' : 'estoque.qrPeek.error.loadFail';
      }
    });
  }
}
