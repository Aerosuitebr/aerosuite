import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { TranslatePipe } from '../core/translate.pipe';
import { P1ApiService } from './p1-api.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-lgpd-aceite-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, CheckboxModule, ButtonModule, TranslatePipe],
  template: `
    <p-dialog
      styleClass="as-hero-dialog" [visible]="visible"
      [modal]="true"
      [closable]="false"
      [draggable]="false"
      [style]="{ width: 'min(520px, 96vw)' }"
      [header]="'p1.lgpd.title' | translate">
      <p>{{ 'p1.lgpd.intro' | translate }}</p>
      <p class="legal-snippet" *ngIf="termos">{{ termos.conteudo | slice:0:400 }}…</p>
      <div class="accept-row">
        <p-checkbox [(ngModel)]="aceito" [binary]="true" inputId="lgpdAceite"></p-checkbox>
        <label for="lgpdAceite">{{ 'p1.lgpd.accept' | translate }}</label>
      </div>
      <ng-template pTemplate="footer">
        <button pButton type="button" [label]="'p1.lgpd.confirm' | translate" [disabled]="!aceito || saving" (click)="confirmar()"></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [
    `.legal-snippet { font-size: 0.85rem; color: var(--text-color-secondary); white-space: pre-wrap; }
     .accept-row { display: flex; gap: 0.75rem; align-items: flex-start; margin-top: 1rem; }`
  ]
})
export class LgpdAceiteDialogComponent implements OnInit {
  @Input() visible = false;
  @Output() accepted = new EventEmitter<void>();

  private p1 = inject(P1ApiService);
  private auth = inject(AuthService);
  termos: { versao: string; conteudo: string } | null = null;
  privacidadeVersao = '';
  aceito = false;
  saving = false;

  ngOnInit(): void {
    const tenant = this.auth.getStoredTenantCodigo() || undefined;
    this.p1.getTermos(tenant).subscribe((t) => (this.termos = t));
    this.p1.getPrivacidade(tenant).subscribe((p) => (this.privacidadeVersao = p.versao));
  }

  confirmar(): void {
    if (!this.termos || !this.aceito) return;
    this.saving = true;
    this.p1
      .registrarAceite({
        aceito: true,
        versaoTermos: this.termos.versao,
        versaoPrivacidade: this.privacidadeVersao
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.accepted.emit();
        },
        error: () => (this.saving = false)
      });
  }
}
