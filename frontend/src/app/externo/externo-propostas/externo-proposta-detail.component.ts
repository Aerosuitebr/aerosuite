import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { FileUploadModule } from 'primeng/fileupload';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { UsuarioExternoService, PropostaExternaResumo } from '../../core/usuario-externo.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { TranslationService } from '../../core/translation.service';
import { LocaleDateTimePipe } from '../../core/locale/locale-datetime.pipe';
import { toastKey } from '../../core/toast-i18n.util';

@Component({
  standalone: true,
  selector: 'app-externo-proposta-detail',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    CardModule,
    TagModule,
    InputTextareaModule,
    InputNumberModule,
    FileUploadModule,
    ProgressSpinnerModule,
    ConfirmDialogModule,
    ToastModule,
    TranslatePipe,
    LocaleDateTimePipe
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>

    <div class="detail-container">
      <button pButton type="button" icon="pi pi-arrow-left" class="p-button-text"
              [label]="'externo.propostas.detail.back' | translate" routerLink="/externo/propostas"></button>

      <div class="loading" *ngIf="loading">
        <p-progressSpinner></p-progressSpinner>
        <p>{{ 'externo.propostas.detail.loading' | translate }}</p>
      </div>

      <ng-container *ngIf="!loading && proposta">
        <div class="detail-header">
          <h1>{{ proposta.numeroProposta }}</h1>
          <p-tag [value]="statusLabel(proposta.status)" [severity]="statusSeverity(proposta.status)"></p-tag>
        </div>

        <div class="actions" *ngIf="proposta.podeAprovar || proposta.podeRejeitar">
          <button pButton type="button" icon="pi pi-check" class="p-button-success"
                  [label]="'externo.propostas.detail.approve' | translate"
                  (click)="confirmarAprovar()" [loading]="submitting"></button>
          <button pButton type="button" icon="pi pi-times" class="p-button-danger p-button-outlined"
                  [label]="'externo.propostas.detail.reject' | translate"
                  (click)="showReject = true"></button>
        </div>

        <div class="reject-box" *ngIf="showReject">
          <label>{{ 'externo.propostas.detail.rejectMotivo' | translate }}</label>
          <textarea pInputTextarea [(ngModel)]="motivoRejeicao" rows="3"
                    [placeholder]="'externo.propostas.detail.rejectPh' | translate"></textarea>
          <button pButton type="button" class="p-button-danger" icon="pi pi-send"
                  [label]="'externo.propostas.detail.reject' | translate"
                  (click)="confirmarRejeitar()" [loading]="submitting"
                  [disabled]="!motivoRejeicao.trim()"></button>
        </div>

        <div class="decision-info" *ngIf="proposta.clienteDecisaoEm">
          <p>{{ 'externo.propostas.detail.decisionAt' | translate:{ date: (proposta.clienteDecisaoEm | localeDateTime:'datetimeShort') } }}</p>
          <p *ngIf="proposta.clienteDecisaoMotivo">
            {{ 'externo.propostas.detail.decisionMotivo' | translate }}: {{ proposta.clienteDecisaoMotivo }}
          </p>
        </div>

        <p-card [header]="'externo.propostas.detail.secProposal' | translate">
          <p><strong>{{ proposta.produtoNome }}</strong> <span *ngIf="proposta.produtoPn">({{ proposta.produtoPn }})</span></p>
          <p *ngIf="proposta.servicoExecutado">{{ 'externo.propostas.detail.servico' | translate }}: {{ proposta.servicoExecutado }}</p>
          <p *ngIf="proposta.validadeProposta">{{ 'externo.propostas.detail.validade' | translate }}: {{ proposta.validadeProposta | localeDateTime:'dateNumeric' }}</p>
          <p *ngIf="proposta.prazoEntrega">{{ 'externo.propostas.detail.prazo' | translate }}: {{ proposta.prazoEntrega }}</p>
          <p *ngIf="proposta.formaPagamento">{{ 'externo.propostas.detail.pagamento' | translate }}: {{ proposta.formaPagamento }}</p>
          <p *ngIf="proposta.observacoes">{{ 'externo.propostas.detail.obs' | translate }}: {{ proposta.observacoes }}</p>
          <button pButton type="button" icon="pi pi-print" class="p-button-outlined p-button-sm"
                  [label]="'externo.propostas.detail.print' | translate" (click)="imprimir()"></button>
        </p-card>

        <p-card [header]="'externo.propostas.aditivo.title' | translate">
          <div *ngFor="let a of proposta.aditivos || []" class="aditivo-row">
            <p><strong>{{ a.descricao }}</strong> <span *ngIf="a.valor">— {{ a.valor | number:'1.2-2' }}</span></p>
            <p-tag [value]="a.status || '—'"></p-tag>
            <div class="aditivo-actions" *ngIf="a.podeAprovar || a.podeRejeitar">
              <button pButton type="button" class="p-button-success p-button-sm" icon="pi pi-check"
                      [label]="'externo.propostas.aditivo.approve' | translate"
                      (click)="decidirAditivo(a.id, true)"></button>
              <button pButton type="button" class="p-button-danger p-button-outlined p-button-sm" icon="pi pi-times"
                      [label]="'externo.propostas.aditivo.reject' | translate"
                      (click)="decidirAditivo(a.id, false)"></button>
            </div>
          </div>
          <p *ngIf="!(proposta.aditivos?.length)">{{ 'externo.propostas.aditivo.empty' | translate }}</p>
          <div *ngIf="proposta.status === 'APROVADA'" class="aditivo-form">
            <label>{{ 'externo.propostas.aditivo.requestLabel' | translate }}</label>
            <textarea pInputTextarea [(ngModel)]="novoAditivoDesc" rows="2"></textarea>
            <p-inputNumber [(ngModel)]="novoAditivoValor" mode="currency" currency="BRL" locale="pt-BR"></p-inputNumber>
            <button pButton type="button" icon="pi pi-send" [label]="'externo.propostas.aditivo.send' | translate"
                    (click)="enviarAditivo()" [loading]="submitting"></button>
          </div>
        </p-card>

        <p-card [header]="'externo.propostas.anexo.title' | translate">
          <ul *ngIf="proposta.anexos?.length">
            <li *ngFor="let an of proposta.anexos">{{ an.nomeArquivo }}</li>
          </ul>
          <p *ngIf="!proposta.anexos?.length">{{ 'externo.propostas.anexo.empty' | translate }}</p>
          <p-fileUpload *ngIf="proposta.status === 'ENVIADA' || proposta.status === 'APROVADA'"
                        mode="basic" [auto]="true" [chooseLabel]="'externo.propostas.anexo.upload' | translate"
                        (onSelect)="onAnexoSelect($event)"></p-fileUpload>
        </p-card>

        <p-card *ngIf="proposta.osVinculo" [header]="'externo.propostas.detail.osTitle' | translate">
          <p>{{ 'externo.propostas.detail.osStatus' | translate }}: {{ proposta.osVinculo.status }}</p>
          <p *ngIf="proposta.osVinculo.dtAbertura">
            {{ 'externo.propostas.detail.osOpened' | translate }}: {{ proposta.osVinculo.dtAbertura | localeDateTime:'dateNumeric' }}
          </p>
          <p *ngIf="proposta.osVinculo.dataFechamento">
            {{ 'externo.propostas.detail.osClosed' | translate }}: {{ proposta.osVinculo.dataFechamento | localeDateTime:'dateNumeric' }}
          </p>
          <button pButton type="button" icon="pi pi-external-link" class="p-button-outlined"
                  [label]="'externo.propostas.detail.osOpen' | translate"
                  [routerLink]="['/externo/os', proposta.osVinculo.id]"></button>
        </p-card>
      </ng-container>
    </div>
  `,
  styles: [`
    .detail-container { padding: 1rem; max-width: 720px; margin: 0 auto; display: flex; flex-direction: column; gap: 1rem; }
    .detail-header { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
    .detail-header h1 { margin: 0; font-size: 1.35rem; }
    .actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .reject-box { display: flex; flex-direction: column; gap: 0.5rem; padding: 1rem; border: 1px solid var(--surface-border); border-radius: 8px; }
    .decision-info { padding: 0.75rem 1rem; background: var(--surface-100); border-radius: 8px; font-size: 0.9rem; }
    .loading { text-align: center; padding: 2rem; }
    .aditivo-row { border-bottom: 1px solid var(--surface-border); padding: 0.5rem 0; margin-bottom: 0.5rem; }
    .aditivo-actions { display: flex; gap: 0.5rem; margin-top: 0.35rem; }
    .aditivo-form { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem; }
  `]
})
export class ExternoPropostaDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private usuarioExternoService = inject(UsuarioExternoService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private i18n = inject(TranslationService);
  loading = true;
  submitting = false;
  showReject = false;
  motivoRejeicao = '';
  proposta: PropostaExternaResumo | null = null;
  novoAditivoDesc = '';
  novoAditivoValor: number | null = null;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.loading = false;
      return;
    }
    this.load(id);
  }

  load(id: number): void {
    this.loading = true;
    this.usuarioExternoService.getPropostaExterna(id).subscribe({
      next: (p) => {
        this.proposta = p;
        this.loading = false;
      },
      error: () => {
        this.proposta = null;
        this.loading = false;
      }
    });
  }

  statusLabel(status?: string): string {
    if (!status) return '—';
    const key = `externo.propostas.status.${status}`;
    const t = this.i18n.translate(key);
    return t === key ? status : t;
  }

  statusSeverity(status?: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | undefined {
    const map: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'secondary'> = {
      ENVIADA: 'warning',
      APROVADA: 'success',
      REJEITADA: 'danger',
      CANCELADA: 'secondary'
    };
    return status ? map[status] : 'secondary';
  }

  confirmarAprovar(): void {
    this.confirmationService.confirm({
      header: this.i18n.translate('externo.propostas.confirm.approveTitle'),
      message: this.i18n.translate('externo.propostas.confirm.approveMsg'),
      icon: 'pi pi-check-circle',
      accept: () => this.aprovar()
    });
  }

  aprovar(): void {
    if (!this.proposta?.id) return;
    this.submitting = true;
    this.usuarioExternoService.aprovarPropostaExterna(this.proposta.id).subscribe({
      next: (p) => {
        this.proposta = p;
        this.submitting = false;
        this.showReject = false;
        toastKey(this.messageService, this.i18n, 'success', 'common.toast.success', 'externo.propostas.toast.approved');
      },
      error: () => {
        this.submitting = false;
        toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'externo.propostas.toast.error');
      }
    });
  }

  confirmarRejeitar(): void {
    this.confirmationService.confirm({
      header: this.i18n.translate('externo.propostas.confirm.rejectTitle'),
      message: this.i18n.translate('externo.propostas.confirm.rejectMsg'),
      icon: 'pi pi-times-circle',
      accept: () => this.rejeitar()
    });
  }

  rejeitar(): void {
    if (!this.proposta?.id || !this.motivoRejeicao.trim()) return;
    this.submitting = true;
    this.usuarioExternoService.rejeitarPropostaExterna(this.proposta.id, this.motivoRejeicao.trim()).subscribe({
      next: (p) => {
        this.proposta = p;
        this.submitting = false;
        this.showReject = false;
        toastKey(this.messageService, this.i18n, 'info', 'common.toast.info', 'externo.propostas.toast.rejected');
      },
      error: () => {
        this.submitting = false;
        toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'externo.propostas.toast.error');
      }
    });
  }

  enviarAditivo(): void {
    if (!this.proposta?.id || !this.novoAditivoDesc.trim()) return;
    this.submitting = true;
    this.usuarioExternoService
      .solicitarAditivo(this.proposta.id, this.novoAditivoDesc.trim(), this.novoAditivoValor ?? undefined)
      .subscribe({
        next: () => {
          this.submitting = false;
          this.novoAditivoDesc = '';
          this.novoAditivoValor = null;
          this.load(this.proposta!.id);
          toastKey(this.messageService, this.i18n, 'success', 'common.toast.success', 'externo.propostas.aditivo.sent');
        },
        error: () => {
          this.submitting = false;
          toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'externo.propostas.toast.error');
        }
      });
  }

  decidirAditivo(aditivoId: number, aprovar: boolean): void {
    if (!this.proposta?.id) return;
    this.submitting = true;
    this.usuarioExternoService.decidirAditivo(this.proposta.id, aditivoId, aprovar).subscribe({
      next: () => {
        this.submitting = false;
        this.load(this.proposta!.id);
      },
      error: () => {
        this.submitting = false;
        toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'externo.propostas.toast.error');
      }
    });
  }

  onAnexoSelect(event: { files?: File[] }): void {
    const file = event.files?.[0];
    if (!file || !this.proposta?.id) return;
    this.usuarioExternoService.enviarAnexoProposta(this.proposta.id, file).subscribe({
      next: () => this.load(this.proposta!.id),
      error: () => toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'externo.propostas.toast.error')
    });
  }

  imprimir(): void {
    if (!this.proposta?.id) return;
    this.usuarioExternoService.getPropostaImpressaoHtml(this.proposta.id).subscribe({
      next: (html) => {
        const w = window.open('', '_blank');
        if (w) {
          w.document.write(html);
          w.document.close();
        }
      }
    });
  }
}
