import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MessageModule } from 'primeng/message';
import { ButtonModule } from 'primeng/button';
import { ConformidadeSgqService } from '../../core/conformidade-sgq.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { TranslationService } from '../../core/translation.service';
import { translateApiMessage } from '../../core/backend-i18n-message.util';

@Component({
  selector: 'app-os-conformidade-alertas',
  standalone: true,
  imports: [CommonModule, RouterModule, MessageModule, ButtonModule, TranslatePipe],
  styles: [
    `
      .panel {
        border: 1px solid #fde68a;
        border-radius: 8px;
        padding: 0.75rem 1rem;
        margin-bottom: 1rem;
        background: #fffbeb;
      }
      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
      }
      .panel-header h4 {
        margin: 0;
        font-size: 0.95rem;
        display: flex;
        align-items: center;
        gap: 0.35rem;
      }
      ul {
        margin: 0;
        padding-left: 1.2rem;
        font-size: 0.88rem;
      }
      li {
        margin-bottom: 0.35rem;
      }
    `
  ],
  template: `
    <div class="panel" *ngIf="visible && (loading || alertas.length > 0)">
      <div class="panel-header">
        <h4><i class="pi pi-shield"></i> {{ 'os.form.conformidade.panelTitle' | translate }}</h4>
        <a pButton class="p-button-text p-button-sm" routerLink="/conformidade/painel" [label]="'os.form.conformidade.openPainel' | translate"></a>
      </div>
      <p *ngIf="loading" class="empty">{{ 'os.form.conformidade.loading' | translate }}</p>
      <ul *ngIf="!loading && alertas.length > 0">
        <li *ngFor="let msg of alertas">{{ msg }}</li>
      </ul>
      <p-message
        *ngIf="!loading && bloqueioMaterial"
        severity="warn"
        [text]="'os.form.conformidade.bloqueioMaterial' | translate"
        styleClass="w-full mt-2"></p-message>
    </div>
  `
})
export class OsConformidadeAlertasComponent implements OnChanges {
  private svc = inject(ConformidadeSgqService);
  private i18n = inject(TranslationService);

  @Input() osId: number | null = null;

  alertas: string[] = [];
  bloqueioMaterial = false;
  loading = false;
  visible = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['osId']) {
      this.carregar();
    }
  }

  carregar(): void {
    if (this.osId == null || this.osId <= 0) {
      this.visible = false;
      this.alertas = [];
      return;
    }
    this.visible = true;
    this.loading = true;
    this.svc.alertasOs(this.osId).subscribe({
      next: res => {
        this.alertas = (res.alertas ?? []).map(a => translateApiMessage(this.i18n, a));
        this.bloqueioMaterial = !!res.bloqueioMaterial;
        this.loading = false;
        if (!this.loading && this.alertas.length === 0 && !this.bloqueioMaterial) {
          this.visible = false;
        }
      },
      error: () => {
        this.alertas = [];
        this.bloqueioMaterial = false;
        this.loading = false;
        this.visible = false;
      }
    });
  }
}
