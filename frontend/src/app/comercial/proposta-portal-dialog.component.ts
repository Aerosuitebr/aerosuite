import { Component, EventEmitter, Input, Output, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import {
  PropostaComercialService,
  PropostaDisponibilizarPortalResult,
  PropostaPortalAcesso
} from '../core/proposta-comercial.service';
import { TranslationService } from '../core/translation.service';
import { TranslatePipe } from '../core/translate.pipe';
import { translateApiMessage } from '../core/backend-i18n-message.util';
import { propostaTemEmailCliente } from './proposta-portal.util';

@Component({
  standalone: true,
  selector: 'app-proposta-portal-dialog',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    CheckboxModule,
    RadioButtonModule,
    InputTextModule,
    ProgressSpinnerModule,
    TranslatePipe
  ],
  template: `
    <p-dialog styleClass="as-hero-dialog portal-acesso-dialog" [(visible)]="visible"
              [header]="'comercial.proposta.portal.dialogTitle' | translate"
              [modal]="true" [style]="{width: '520px'}" [closable]="true"
              (onHide)="onDialogHide()">
      <div class="portal-acesso-content" *ngIf="!carregando; else portalAcessoLoading">
        <p class="dialog-description">{{ 'comercial.proposta.portal.dialogIntro' | translate }}</p>

        <ul class="portal-acesso-checklist" *ngIf="acesso">
          <li [class.ok]="acesso.temEmailCliente" [class.fail]="!acesso.temEmailCliente">
            <i class="pi" [ngClass]="acesso.temEmailCliente ? 'pi-check-circle' : 'pi-times-circle'"></i>
            {{ 'comercial.proposta.portal.checkEmail' | translate }}
          </li>
          <li [class.ok]="acesso.visivelNoPortal" [class.pending]="!acesso.visivelNoPortal">
            <i class="pi" [ngClass]="acesso.visivelNoPortal ? 'pi-check-circle' : 'pi-circle'"></i>
            {{ 'comercial.proposta.portal.checkVisible' | translate }}
          </li>
          <li [class.ok]="acesso.usuarioExternoExiste" [class.fail]="!acesso.usuarioExternoExiste">
            <i class="pi" [ngClass]="acesso.usuarioExternoExiste ? 'pi-check-circle' : 'pi-times-circle'"></i>
            {{ 'comercial.proposta.portal.checkUser' | translate }}
          </li>
          <li [class.ok]="acesso.temAcessoPropostas" [class.pending]="acesso.usuarioExternoExiste && !acesso.temAcessoPropostas">
            <i class="pi" [ngClass]="acesso.temAcessoPropostas ? 'pi-check-circle' : 'pi-circle'"></i>
            {{ 'comercial.proposta.portal.checkAccess' | translate }}
          </li>
        </ul>

        <p *ngIf="acesso?.visivelNoPortal" class="portal-acesso-hint">
          <i class="pi pi-info-circle"></i> {{ 'comercial.proposta.portal.alreadyVisible' | translate }}
        </p>

        <p *ngIf="acesso && !acesso.usuarioExternoExiste" class="portal-acesso-warn">
          <i class="pi pi-exclamation-triangle"></i> {{ 'comercial.proposta.portal.warnNoUser' | translate }}
        </p>

        <p *ngIf="acesso?.usuarioExternoExiste" class="portal-acesso-user">
          {{ 'comercial.proposta.portal.userExisting' | translate:{ nome: acesso!.usuarioExternoNome || '—', email: acesso!.usuarioExternoEmail || '—' } }}
        </p>

        <div class="portal-acesso-options" *ngIf="acesso && !acesso.usuarioExternoExiste">
          <p-checkbox [(ngModel)]="criarAcesso" [binary]="true" [inputId]="checkboxId"></p-checkbox>
          <label [for]="checkboxId">{{ 'comercial.proposta.portal.createAccess' | translate }}</label>
        </div>

        <div class="form-field" *ngIf="acesso && !acesso.usuarioExternoExiste && criarAcesso">
          <label [for]="nomeInputId">{{ 'comercial.proposta.portal.nomeContato' | translate }}</label>
          <input pInputText [id]="nomeInputId" [(ngModel)]="nomeContato" class="w-full"
                 [placeholder]="nomeContatoPlaceholder || ''">
        </div>

        <div class="portal-notify-section" *ngIf="acesso?.podeDisponibilizar">
          <h4>{{ 'comercial.proposta.portal.notifyTitle' | translate }}</h4>
          <div class="portal-notify-option">
            <p-radioButton name="portalNotify" [value]="true" [(ngModel)]="notificarCliente" [inputId]="notifyYesId"></p-radioButton>
            <label [for]="notifyYesId">
              <strong>{{ 'comercial.proposta.portal.notifyYes' | translate }}</strong>
              <small>{{ 'comercial.proposta.portal.notifyYesHint' | translate }}</small>
            </label>
          </div>
          <div class="portal-notify-option">
            <p-radioButton name="portalNotify" [value]="false" [(ngModel)]="notificarCliente" [inputId]="notifyNoId"></p-radioButton>
            <label [for]="notifyNoId">
              <strong>{{ 'comercial.proposta.portal.notifyNo' | translate }}</strong>
              <small>{{ 'comercial.proposta.portal.notifyNoHint' | translate }}</small>
            </label>
          </div>
          <p *ngIf="!notificarCliente && acesso && !acesso.usuarioExternoExiste && criarAcesso" class="portal-acesso-warn">
            <i class="pi pi-exclamation-triangle"></i> {{ 'comercial.proposta.portal.warnNoNotifyNewUser' | translate }}
          </p>
        </div>

        <p *ngIf="acesso?.mensagemBloqueio" class="portal-acesso-block">{{ mensagemBloqueioTraduzida() }}</p>
      </div>

      <ng-template #portalAcessoLoading>
        <div class="portal-acesso-loading">
          <p-progressSpinner strokeWidth="4"></p-progressSpinner>
        </div>
      </ng-template>

      <ng-template pTemplate="footer">
        <button pButton [label]="'comercial.proposta.portal.cancel' | translate" icon="pi pi-times" class="p-button-text"
                (click)="close()"></button>
        <button pButton
                [label]="notificarCliente ? ('comercial.proposta.portal.confirmNotify' | translate) : ('comercial.proposta.portal.confirm' | translate)"
                icon="pi pi-globe"
                (click)="confirmar()" [loading]="publicando"
                [disabled]="!podeConfirmar()"></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .dialog-description {
      color: var(--text-color-secondary, #64748b);
      margin: 0 0 0.5rem;
    }

    .portal-acesso-checklist {
      list-style: none;
      padding: 0;
      margin: 1rem 0;

      li {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.35rem 0;

        &.ok i { color: var(--green-500, #22c55e); }
        &.fail i { color: var(--red-500, #ef4444); }
        &.pending i { color: var(--surface-500, #94a3b8); }
      }
    }

    .portal-acesso-warn {
      color: var(--orange-600, #ea580c);
      margin: 0.75rem 0;
    }

    .portal-acesso-hint,
    .portal-acesso-user {
      margin: 0.5rem 0;
      font-size: 0.9rem;
    }

    .portal-acesso-options {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      margin: 1rem 0;
    }

    .portal-notify-section {
      margin-top: 1.25rem;
      padding-top: 1rem;
      border-top: 1px solid var(--surface-border, #e2e8f0);

      h4 {
        margin: 0 0 0.75rem;
        font-size: 0.9rem;
        font-weight: 600;
      }
    }

    .portal-notify-option {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      margin-bottom: 0.75rem;

      label {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        cursor: pointer;

        strong {
          font-size: 0.875rem;
        }

        small {
          font-size: 0.8rem;
          color: var(--text-color-secondary, #64748b);
          line-height: 1.35;
        }
      }
    }

    .portal-acesso-block {
      color: var(--red-600, #dc2626);
      margin-top: 0.75rem;
    }

    .portal-acesso-loading {
      display: flex;
      justify-content: center;
      padding: 2rem;
    }

    .form-field {
      margin-top: 0.75rem;

      label {
        display: block;
        margin-bottom: 0.35rem;
        font-weight: 600;
        font-size: 0.875rem;
      }
    }

    .w-full { width: 100%; }
  `]
})
export class PropostaPortalDialogComponent implements OnChanges {
  private propostaService = inject(PropostaComercialService);
  private messageService = inject(MessageService);
  private i18n = inject(TranslationService);

  @Input() visible = false;
  @Input() propostaId: number | null = null;
  @Input() clienteEmail = '';
  @Input() nomeContatoDefault = '';
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() published = new EventEmitter<PropostaDisponibilizarPortalResult>();

  readonly checkboxId = `portalCriarAcesso-${Math.random().toString(36).slice(2, 9)}`;
  readonly nomeInputId = `portalNomeContato-${Math.random().toString(36).slice(2, 9)}`;
  readonly notifyYesId = `portalNotifyYes-${Math.random().toString(36).slice(2, 9)}`;
  readonly notifyNoId = `portalNotifyNo-${Math.random().toString(36).slice(2, 9)}`;

  carregando = false;
  publicando = false;
  acesso: PropostaPortalAcesso | null = null;
  criarAcesso = true;
  notificarCliente = true;
  nomeContato = '';
  nomeContatoPlaceholder = '';

  mensagemBloqueioTraduzida(): string {
    return translateApiMessage(this.i18n, this.acesso?.mensagemBloqueio);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      queueMicrotask(() => {
        if (this.visible) {
          this.abrir();
        }
      });
    }
  }

  abrir(): void {
    if (!propostaTemEmailCliente(this.clienteEmail)) {
      this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'comercial.proposta.portal.noEmail');
      this.close();
      return;
    }
    if (!this.propostaId) {
      this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'comercial.proposta.portal.saveFirst');
      this.close();
      return;
    }

    this.nomeContato = (this.nomeContatoDefault || '').trim();
    this.nomeContatoPlaceholder = this.nomeContatoDefault || '';
    this.criarAcesso = true;
    this.notificarCliente = true;
    this.acesso = null;
    this.carregando = true;

    this.propostaService.verificarPortalAcesso(this.propostaId).subscribe({
      next: (acesso) => {
        this.acesso = acesso;
        this.criarAcesso = !acesso.usuarioExternoExiste;
        this.carregando = false;
      },
      error: (err) => {
        this.carregando = false;
        this.close();
        console.error('Failed to verify portal access:', err);
        this.toastErro(err);
      }
    });
  }

  podeConfirmar(): boolean {
    if (!this.acesso?.podeDisponibilizar || this.carregando) {
      return false;
    }
    if (!this.acesso.usuarioExternoExiste && !this.criarAcesso) {
      return false;
    }
    return true;
  }

  confirmar(): void {
    if (!this.propostaId || !this.podeConfirmar()) {
      return;
    }

    this.publicando = true;
    this.propostaService.disponibilizarPortal(this.propostaId, {
      criarAcessoExterno: this.acesso!.usuarioExternoExiste ? false : this.criarAcesso,
      nomeContato: this.nomeContato.trim() || undefined,
      notificarCliente: this.notificarCliente
    }).subscribe({
      next: (result) => {
        this.publicando = false;
        this.acesso = result.acesso;
        this.i18n.addToast(this.messageService, 'success', 'common.toast.success', 'comercial.proposta.portal.toastOk');
        if (result.usuarioExternoCriado) {
          this.i18n.addToast(this.messageService, 'info', 'common.toast.info', 'comercial.proposta.portal.toastUserCreated');
        }
        if (result.emailNotificacaoEnviado) {
          this.i18n.addToast(this.messageService, 'info', 'common.toast.info', 'comercial.proposta.portal.toastNotified');
        } else if (!this.notificarCliente) {
          this.i18n.addToast(this.messageService, 'info', 'common.toast.info', 'comercial.proposta.portal.toastSilent');
        }
        this.published.emit(result);
        this.close();
      },
      error: (err) => {
        this.publicando = false;
        console.error('Failed to enable portal access:', err);
        this.toastErro(err);
      }
    });
  }

  close(): void {
    if (this.visible) {
      this.visible = false;
      this.visibleChange.emit(false);
    }
  }

  onDialogHide(): void {
    this.visibleChange.emit(this.visible);
  }

  private toastErro(err: unknown): void {
    const e = err as { error?: { message?: string }; message?: string };
    const msg = e?.error?.message || e?.message;
    if (msg) {
      this.i18n.addToastLiteralDetail(this.messageService, 'error', 'common.toast.error', msg);
    } else {
      this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'comercial.proposta.portal.toastErr');
    }
  }
}
