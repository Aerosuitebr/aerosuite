import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { RatingModule } from 'primeng/rating';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { TranslationService } from '../core/translation.service';
import { 
  TicketService, 
  Ticket, 
  TicketComment,
  TicketAttachment,
  TICKET_TIPOS, 
  TICKET_PRIORIDADES, 
  TICKET_STATUS 
} from '../core/ticket.service';
import { TranslatePipe } from '../core/translate.pipe';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';
import { ListRefreshOverlayComponent } from '../shared/list-refresh-overlay/list-refresh-overlay.component';
import { finalize } from 'rxjs/operators';

interface TimelineEvent {
  tipo: string;
  conteudo: string;
  usuarioNome: string;
  usuarioTipo: string;
  data: string;
}

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  styleUrls: ['./suporte-shared.scss'],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ButtonModule,
    InputTextareaModule,
    DropdownModule,
    FileUploadModule,
    ToastModule,
    TooltipModule,
    DialogModule,
    RatingModule,
    ProgressSpinnerModule,
    TranslatePipe,
    PageHeroComponent,
    ListRefreshOverlayComponent
  ],
  template: `
    <p-toast></p-toast>

    <div class="as-page suporte-page">
      <!-- Carga inicial -->
      <div class="loading-state detail-initial-loading" *ngIf="loading && !ticket">
        <p-progressSpinner strokeWidth="3"></p-progressSpinner>
        <p>{{ 'suporte.ticketDetail.loading' | translate }}</p>
      </div>

      <!-- Conteúdo (overlay leve durante ações assíncronas) -->
      <ng-container *ngIf="ticket">
        <div class="suporte-page-content detail-full list-with-refresh">
        <app-list-refresh-overlay [loading]="refreshing" labelKey="ui.loading"></app-list-refresh-overlay>
        <app-page-hero
          variant="gold"
          kickerKey="suporte.ticketDetail.kicker"
          [title]="ticket.titulo"
          [subtitle]="ticket.numero"
          titleIcon="pi-ticket"
          [hasActions]="true">
          <div actions class="header-actions" *ngIf="!isResolvido && !isFechado">
            <button pButton type="button" icon="pi pi-arrow-left"
                    class="btn-back p-button-text"
                    (click)="voltar()"
                    [pTooltip]="'suporte.ticketDetail.back' | translate"></button>
            <button pButton type="button"
                    [label]="'suporte.ticketDetail.btn.changeStatus' | translate"
                    icon="pi pi-sync"
                    class="btn-secondary"
                    (click)="mostrarDialogStatus = true">
            </button>
          </div>
        </app-page-hero>

        <div class="content-layout">
          <!-- Coluna Principal -->
          <div class="main-content">
            <!-- Informações -->
            <div class="content-card">
              <div class="card-header">
                <h3>{{ 'suporte.ticketDetail.section.details' | translate }}</h3>
              </div>
              
              <div class="info-grid">
                <div class="info-item">
                  <label>{{ 'suporte.ticketDetail.label.type' | translate }}</label>
                  <span class="tag tipo" [class]="'tipo-' + (ticket.tipo || '').toLowerCase()">
                    {{ getTipoLabel(ticket.tipo || '') }}
                  </span>
                </div>
                <div class="info-item">
                  <label>{{ 'suporte.ticketDetail.label.priority' | translate }}</label>
                  <span class="tag prio" [class]="'prio-' + (ticket.prioridade || '').toLowerCase()">
                    {{ getPrioridadeLabel(ticket.prioridade || '') }}
                  </span>
                </div>
                <div class="info-item" *ngIf="ticket.categoria">
                  <label>{{ 'suporte.ticketDetail.label.module' | translate }}</label>
                  <span>{{ ticket.categoria }}</span>
                </div>
                <div class="info-item" *ngIf="ticket.ambiente">
                  <label>{{ 'suporte.ticketDetail.label.environment' | translate }}</label>
                  <span>{{ ticket.ambiente }}</span>
                </div>
              </div>

              <div class="description-section">
                <label>{{ 'suporte.ticketDetail.label.description' | translate }}</label>
                <p>{{ ticket.descricao }}</p>
              </div>

              <div class="description-section" *ngIf="ticket.passosReproduzir">
                <label>{{ 'suporte.ticketDetail.label.steps' | translate }}</label>
                <pre>{{ ticket.passosReproduzir }}</pre>
              </div>
            </div>

            <!-- Anexos -->
            <div class="content-card" *ngIf="(ticket.anexos?.length || 0) > 0 || !isFechado">
              <div class="card-header">
                <h3>{{ 'suporte.ticketDetail.section.attachments' | translate }}</h3>
              </div>
              
              <div class="attachments-list" *ngIf="(ticket.anexos?.length || 0) > 0">
                <div class="attachment-item" *ngFor="let anexo of ticket.anexos">
                  <i class="pi" [ngClass]="getFileIcon(anexo.tipoArquivo || '')"></i>
                  <div class="attachment-info">
                    <span class="attachment-name">{{ anexo.nomeOriginal }}</span>
                    <span class="attachment-meta">{{ formatFileSize(anexo.tamanhoBytes || 0) }}</span>
                  </div>
                  <button 
                    pButton 
                    type="button" 
                    icon="pi pi-download" 
                    class="p-button-text p-button-sm"
                    (click)="downloadAnexo(anexo)">
                  </button>
                </div>
              </div>

              <div class="upload-inline" *ngIf="!isFechado">
                <input 
                  #fileInput
                  type="file"
                  accept="image/*,.pdf,.txt,.log"
                  (change)="onAnexoSelecionado($event)"
                  style="display: none;">
                <button 
                  pButton 
                  type="button" 
                  [label]="'suporte.ticketDetail.btn.addAttachment' | translate" 
                  icon="pi pi-plus" 
                  class="btn-outline-sm"
                  (click)="fileInput.click()">
                </button>
              </div>
            </div>

            <!-- Timeline -->
            <div class="content-card">
              <div class="card-header">
                <h3>{{ 'suporte.ticketDetail.section.timeline' | translate }}</h3>
              </div>
              
              <div class="timeline">
                <div class="timeline-item" *ngFor="let event of timelineEvents" [class]="'type-' + event.tipo.toLowerCase().replace('_', '-')">
                  <div class="timeline-marker"></div>
                  <div class="timeline-content">
                    <div class="timeline-header">
                      <span class="timeline-author" [class.atendente]="event.usuarioTipo === 'ATENDENTE'">
                        {{ event.usuarioNome || ('suporte.ticketAtendimento.actor.system' | translate) }}
                      </span>
                      <span class="timeline-date">{{ event.data | date:'dd/MM/yyyy HH:mm' }}</span>
                    </div>
                    <p class="timeline-text">{{ event.conteudo }}</p>
                  </div>
                </div>
              </div>

              <!-- Novo Comentário -->
              <div class="comment-form" *ngIf="!isFechado">
                <textarea 
                  pInputTextarea 
                  [(ngModel)]="novoComentario"
                  [placeholder]="'suporte.ticketDetail.placeholder.comment' | translate"
                  rows="3">
                </textarea>
                <button 
                  pButton 
                  type="button" 
                  [label]="'suporte.ticketDetail.btn.send' | translate" 
                  icon="pi pi-send"
                  class="btn-primary"
                  [disabled]="!novoComentario?.trim()"
                  (click)="enviarComentario()">
                </button>
              </div>
            </div>

            <!-- Avaliação -->
            <div class="content-card avaliacao-card" *ngIf="isResolvido && !ticket.avaliacao">
              <div class="card-header">
                <h3>{{ 'suporte.ticketDetail.section.rating.title' | translate }}</h3>
                <p>{{ 'suporte.ticketDetail.section.rating.subtitle' | translate }}</p>
              </div>
              
              <div class="avaliacao-form">
                <p-rating [(ngModel)]="avaliacaoNota" [cancel]="false"></p-rating>
                <textarea 
                  pInputTextarea 
                  [(ngModel)]="avaliacaoComentario"
                  [placeholder]="'suporte.ticketDetail.section.rating.placeholder' | translate"
                  rows="2">
                </textarea>
                <button 
                  pButton 
                  type="button" 
                  [label]="'suporte.ticketDetail.btn.submitRating' | translate" 
                  icon="pi pi-check"
                  class="btn-primary"
                  [disabled]="!avaliacaoNota"
                  (click)="enviarAvaliacao()">
                </button>
              </div>
            </div>

            <div class="content-card avaliacao-done" *ngIf="ticket.avaliacao">
              <div class="avaliacao-display">
                <span>{{ 'suporte.ticketDetail.ratingSent' | translate }}</span>
                <p-rating [ngModel]="ticket.avaliacao" [readonly]="true" [cancel]="false"></p-rating>
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="sidebar-content">
            <!-- SLA -->
            <div class="sidebar-card sla-card" [class.warning]="ticket.slaPrimeiraRespostaEstourado || ticket.slaResolucaoEstourado">
              <h4>{{ 'suporte.ticketAtendimento.panel.sla' | translate }}</h4>
              <div class="sla-item">
                <span>{{ 'suporte.ticketAtendimento.sla.firstResponse' | translate }}</span>
                <div class="sla-value">
                  {{ ticket.slaPrimeiraRespostaHoras }}h
                  <i class="pi pi-check" *ngIf="ticket.dataPrimeiraResposta && !ticket.slaPrimeiraRespostaEstourado"></i>
                  <i class="pi pi-exclamation-triangle" *ngIf="ticket.slaPrimeiraRespostaEstourado"></i>
                </div>
              </div>
              <div class="sla-item">
                <span>{{ 'suporte.ticketAtendimento.sla.resolution' | translate }}</span>
                <div class="sla-value">
                  {{ ticket.slaResolucaoHoras }}h
                  <i class="pi pi-check" *ngIf="ticket.dataResolucao && !ticket.slaResolucaoEstourado"></i>
                  <i class="pi pi-exclamation-triangle" *ngIf="ticket.slaResolucaoEstourado"></i>
                </div>
              </div>
            </div>

            <!-- Datas -->
            <div class="sidebar-card">
              <h4>{{ 'suporte.ticketDetail.section.dates' | translate }}</h4>
              <div class="info-row">
                <span>{{ 'suporte.ticketDetail.label.opened' | translate }}</span>
                <strong>{{ ticket.dataAbertura | date:'dd/MM/yyyy HH:mm' }}</strong>
              </div>
              <div class="info-row" *ngIf="ticket.dataPrimeiraResposta">
                <span>{{ 'suporte.ticketAtendimento.sla.firstResponse' | translate }}</span>
                <strong>{{ ticket.dataPrimeiraResposta | date:'dd/MM/yyyy HH:mm' }}</strong>
              </div>
              <div class="info-row" *ngIf="ticket.dataResolucao">
                <span>{{ 'suporte.ticketAtendimento.sla.resolution' | translate }}</span>
                <strong>{{ ticket.dataResolucao | date:'dd/MM/yyyy HH:mm' }}</strong>
              </div>
            </div>

            <!-- Responsáveis -->
            <div class="sidebar-card">
              <h4>{{ 'suporte.ticketDetail.section.responsible' | translate }}</h4>
              <div class="info-row">
                <span>{{ 'suporte.ticketDetail.label.requester' | translate }}</span>
                <strong>{{ ticket.usuarioNome || '-' }}</strong>
              </div>
              <div class="info-row">
                <span>{{ 'suporte.ticketDetail.assigned' | translate }}</span>
                <strong>{{ ticket.atendenteNome || ('suporte.ticketDetail.unassigned' | translate) }}</strong>
              </div>
            </div>
          </div>
        </div>
        </div>
      </ng-container>
    </div>

    <!-- Dialog Status -->
    <p-dialog 
      styleClass="as-hero-dialog" [header]="'suporte.ticketDetail.dialog.status.title' | translate" 
      [(visible)]="mostrarDialogStatus"
      [modal]="true"
      [style]="{ width: '350px' }">
      <div class="dialog-content">
        <p-dropdown 
          [options]="statusOptions"
          [(ngModel)]="novoStatus"
          [placeholder]="'suporte.ticketDetail.dialog.status.placeholder' | translate"
          optionLabel="label"
          optionValue="value"
          styleClass="w-full">
        </p-dropdown>
      </div>
      <ng-template pTemplate="footer">
        <button pButton [label]="'suporte.ticketDetail.dialog.btn.cancel' | translate" class="p-button-text" (click)="mostrarDialogStatus = false"></button>
        <button pButton [label]="'suporte.ticketDetail.dialog.btn.confirm' | translate" [disabled]="!novoStatus" (click)="alterarStatus()"></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .suporte-container,
    .detail-full {
      width: 100%;
      max-width: none;
      margin: 0;
      padding: 0;
    }

    .page-header {
      width: 100%;
    }

    .loading-state {
      width: 100%;
      min-height: 50vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      color: #64748b;

      p {
        margin-top: 1rem;
      }
    }

    .page-header {
      margin-bottom: 1.5rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .header-left {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }

    .btn-back {
      background: white;
      border: 1px solid #e2e8f0;
      color: #64748b;
      width: 40px;
      height: 40px;
      padding: 0;
      border-radius: 8px;
      flex-shrink: 0;

      &:hover {
        background: #f8fafc;
        color: #0f172a;
      }
    }

    .header-text {
      .ticket-id-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.375rem;
      }

      .ticket-id {
        font-family: monospace;
        font-size: 0.8125rem;
        color: #0ea5e9;
        font-weight: 600;
        background: #f0f9ff;
        padding: 0.25rem 0.625rem;
        border-radius: 4px;
      }

      h1 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #0f172a;
      }
    }

    .status-badge {
      font-size: 0.6875rem;
      padding: 0.25rem 0.625rem;
      border-radius: 12px;
      font-weight: 500;

      &.status-aberto { background: #e0f2fe; color: #0369a1; }
      &.status-em-analise { background: #ede9fe; color: #7c3aed; }
      &.status-em-andamento { background: #fef3c7; color: #b45309; }
      &.status-aguardando-usuario { background: #ffedd5; color: #c2410c; }
      &.status-resolvido { background: #dcfce7; color: #15803d; }
      &.status-fechado { background: #f1f5f9; color: #475569; }
    }

    .btn-secondary {
      background: white;
      border: 1px solid #e2e8f0;
      color: #475569;
      padding: 0.5rem 1rem;
      font-size: 0.8125rem;
      border-radius: 8px;

      &:hover {
        background: #f8fafc;
      }
    }

    .btn-primary {
      background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
      border: none;
      padding: 0.5rem 1rem;
      font-size: 0.8125rem;
      border-radius: 8px;

      &:hover:not(:disabled) {
        background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      }
    }

    .btn-outline-sm {
      background: white;
      border: 1px solid #e2e8f0;
      color: #475569;
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
      border-radius: 6px;

      &:hover {
        background: #f8fafc;
      }
    }

    .content-layout {
      display: grid;
      width: 100%;
      grid-template-columns: 1fr minmax(240px, 20rem);
      gap: 1.5rem;
    }

    .content-card, .sidebar-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;
      margin-bottom: 1rem;
    }

    .card-header {
      margin-bottom: 1rem;

      h3 {
        margin: 0;
        font-size: 0.9375rem;
        font-weight: 600;
        color: #0f172a;
      }

      p {
        margin: 0.25rem 0 0 0;
        font-size: 0.8125rem;
        color: #64748b;
      }
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 1.25rem;
    }

    .info-item {
      label {
        display: block;
        font-size: 0.6875rem;
        font-weight: 500;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 0.375rem;
      }

      span {
        font-size: 0.8125rem;
        color: #0f172a;
      }
    }

    .tag {
      display: inline-block;
      font-size: 0.75rem;
      padding: 0.25rem 0.625rem;
      border-radius: 4px;
      font-weight: 500;

      &.tipo-erro { background: #fee2e2; color: #dc2626; }
      &.tipo-melhoria { background: #e0f2fe; color: #0284c7; }
      &.tipo-duvida { background: #f3f4f6; color: #4b5563; }
      &.tipo-solicitacao { background: #dcfce7; color: #16a34a; }

      &.prio-critica { background: #fef2f2; color: #dc2626; }
      &.prio-alta { background: #fff7ed; color: #ea580c; }
      &.prio-media { background: #fefce8; color: #ca8a04; }
      &.prio-baixa { background: #f0fdf4; color: #16a34a; }
    }

    .description-section {
      margin-bottom: 1rem;

      label {
        display: block;
        font-size: 0.6875rem;
        font-weight: 500;
        color: #94a3b8;
        text-transform: uppercase;
        margin-bottom: 0.5rem;
      }

      p, pre {
        margin: 0;
        font-size: 0.875rem;
        color: #374151;
        line-height: 1.6;
        white-space: pre-wrap;
      }

      pre {
        background: #f8fafc;
        padding: 0.75rem;
        border-radius: 8px;
        font-family: inherit;
      }
    }

    .attachments-list {
      margin-bottom: 1rem;
    }

    .attachment-item {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.5rem 0.75rem;
      background: #f8fafc;
      border-radius: 6px;
      margin-bottom: 0.5rem;

      i {
        color: #0ea5e9;
      }

      .attachment-info {
        flex: 1;
        min-width: 0;
      }

      .attachment-name {
        display: block;
        font-size: 0.8125rem;
        color: #374151;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .attachment-meta {
        font-size: 0.6875rem;
        color: #94a3b8;
      }
    }

    .timeline {
      margin-bottom: 1.5rem;
    }

    .timeline-item {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1rem;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .timeline-marker {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #e2e8f0;
      flex-shrink: 0;
      margin-top: 4px;
    }

    .timeline-item.type-abertura .timeline-marker { background: #0ea5e9; }
    .timeline-item.type-comentario .timeline-marker { background: #94a3b8; }
    .timeline-item.type-resposta .timeline-marker { background: #8b5cf6; }
    .timeline-item.type-alteracao-status .timeline-marker { background: #f59e0b; }
    .timeline-item.type-solucao .timeline-marker { background: #22c55e; }

    .timeline-content {
      flex: 1;
      background: #f8fafc;
      border-radius: 8px;
      padding: 0.75rem 1rem;
    }

    .timeline-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.375rem;
    }

    .timeline-author {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #374151;

      &.atendente {
        color: #7c3aed;
      }
    }

    .timeline-date {
      font-size: 0.6875rem;
      color: #94a3b8;
    }

    .timeline-text {
      margin: 0;
      font-size: 0.8125rem;
      color: #475569;
      line-height: 1.5;
      white-space: pre-wrap;
    }

    .comment-form {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;

      textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 0.875rem;
        resize: none;

        &:focus {
          outline: none;
          border-color: #0ea5e9;
        }
      }

      button {
        align-self: flex-end;
      }
    }

    .avaliacao-card {
      background: #f0f9ff;
      border-color: #bae6fd;
    }

    .avaliacao-form {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      align-items: flex-start;

      textarea {
        width: 100%;
        padding: 0.625rem;
        border: 1px solid #bae6fd;
        border-radius: 8px;
        font-size: 0.8125rem;
        resize: none;
        background: white;

        &:focus {
          outline: none;
          border-color: #0ea5e9;
        }
      }
    }

    .avaliacao-done {
      background: #f0fdf4;
      border-color: #bbf7d0;
    }

    .avaliacao-display {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      span {
        font-size: 0.8125rem;
        color: #15803d;
      }
    }

    .sidebar-card {
      h4 {
        margin: 0 0 0.75rem 0;
        font-size: 0.8125rem;
        font-weight: 600;
        color: #374151;
      }
    }

    .sla-card {
      &.warning {
        background: #fef2f2;
        border-color: #fecaca;

        h4 {
          color: #dc2626;
        }
      }
    }

    .sla-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px solid #f1f5f9;

      &:last-child {
        border-bottom: none;
      }

      span {
        font-size: 0.75rem;
        color: #64748b;
      }

      .sla-value {
        font-size: 0.8125rem;
        font-weight: 600;
        color: #0f172a;
        display: flex;
        align-items: center;
        gap: 0.375rem;

        i.pi-check {
          color: #22c55e;
          font-size: 0.75rem;
        }

        i.pi-exclamation-triangle {
          color: #ef4444;
          font-size: 0.75rem;
        }
      }
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 0.375rem 0;
      border-bottom: 1px solid #f1f5f9;

      &:last-child {
        border-bottom: none;
      }

      span {
        font-size: 0.75rem;
        color: #64748b;
      }

      strong {
        font-size: 0.75rem;
        font-weight: 500;
        color: #0f172a;
      }
    }

    .dialog-content {
      padding: 1rem 0;
    }

    :host ::ng-deep {
      .p-dropdown {
        width: 100%;
        border-radius: 8px;
      }

      .p-rating .p-rating-item .p-rating-icon {
        font-size: 1.25rem;
      }

      .p-progressspinner-circle {
        stroke: #0ea5e9 !important;
      }
    }

    @media (max-width: 992px) {
      .content-layout {
        grid-template-columns: 1fr;
      }

      .sidebar-content {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;

        .sidebar-card {
          margin-bottom: 0;
        }
      }
    }

    @media (max-width: 768px) {
      .suporte-container {
        padding: 1rem;
      }

      .header-content {
        flex-direction: column;
        gap: 1rem;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class TicketDetailComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private ticketService = inject(TicketService);
  private messageService = inject(MessageService);
  private i18n = inject(TranslationService);

  ticket: Ticket | null = null;
  loading = true;
  refreshing = false;
  timelineEvents: TimelineEvent[] = [];
  novoComentario = '';
  mostrarDialogStatus = false;
  novoStatus = '';
  get statusOptions() {
    return this.i18n.buildTranslatedOptions(
      'ticket.status',
      TICKET_STATUS.filter((s) => s.value !== 'ABERTO').map((s) => ({ label: s.value, value: s.value }))
    );
  }
  avaliacaoNota: number = 0;
  avaliacaoComentario = '';

  get isResolvido(): boolean {
    return this.ticket?.status === 'RESOLVIDO';
  }

  get isFechado(): boolean {
    return this.ticket?.status === 'FECHADO';
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.carregarTicket(Number(id));
    }
  }

  carregarTicket(id: number) {
    const isRefresh = !!this.ticket;
    if (isRefresh) {
      this.refreshing = true;
    } else {
      this.loading = true;
    }
    this.ticketService.getById(id).pipe(
      finalize(() => {
        this.loading = false;
        this.refreshing = false;
      })
    ).subscribe({
      next: (ticket) => {
        this.ticket = ticket;
        this.construirTimeline();
      },
      error: () => {
        this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'suporte.ticketDetail.toast.notFound');
        if (!isRefresh) {
          this.router.navigate(['/suporte']);
        }
      }
    });
  }

  construirTimeline() {
    this.timelineEvents = [];

    this.timelineEvents.push({
      tipo: 'ABERTURA',
      conteudo: this.i18n.translate('suporte.ticketDetail.event.opened'),
      usuarioNome: this.ticket?.usuarioNome || this.i18n.translate('profile.userFallback'),
      usuarioTipo: 'CLIENTE',
      data: this.ticket?.dataAbertura || ''
    });

    if (this.ticket?.comentarios) {
      for (const c of this.ticket.comentarios) {
        this.timelineEvents.push({
          tipo: c.tipo || 'COMENTARIO',
          conteudo: c.conteudo || '',
          usuarioNome: c.usuarioNome || this.i18n.translate('suporte.ticketAtendimento.actor.system'),
          usuarioTipo: c.usuarioTipo || 'SISTEMA',
          data: c.dataCriacao || ''
        });
      }
    }

    this.timelineEvents.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  }

  enviarComentario() {
    if (!this.novoComentario?.trim() || !this.ticket?.id) return;

    const comment: TicketComment = {
      conteudo: this.novoComentario.trim(),
      tipo: 'COMENTARIO',
      visivelUsuario: true,
      usuarioTipo: 'CLIENTE'
    };

    this.refreshing = true;
    this.ticketService.addComment(this.ticket.id, comment).subscribe({
      next: () => {
        this.i18n.addToast(this.messageService, 'success', 'common.toast.success', 'suporte.ticketDetail.toast.commentOk');
        this.novoComentario = '';
        this.carregarTicket(this.ticket!.id!);
      },
      error: () => {
        this.refreshing = false;
        this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'suporte.ticketDetail.toast.commentErr');
      }
    });
  }

  alterarStatus() {
    if (!this.novoStatus || !this.ticket?.id) return;

    this.refreshing = true;
    this.ticketService.alterarStatus(this.ticket.id, this.novoStatus, 0, 'Usuário', 'CLIENTE').subscribe({
      next: () => {
        this.i18n.addToast(this.messageService, 'success', 'common.toast.success', 'suporte.ticketDetail.toast.statusOk');
        this.mostrarDialogStatus = false;
        this.novoStatus = '';
        this.carregarTicket(this.ticket!.id!);
      },
      error: () => {
        this.refreshing = false;
        this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'suporte.ticketDetail.toast.statusErr');
      }
    });
  }

  onAnexoSelecionado(event: any) {
    if (!this.ticket?.id || !event.target.files?.length) return;

    const file = event.target.files[0];
    this.refreshing = true;
    this.ticketService.uploadAttachment(this.ticket.id, file).subscribe({
      next: () => {
        this.i18n.addToast(this.messageService, 'success', 'common.toast.success', 'suporte.ticketDetail.toast.attachmentOk');
        this.carregarTicket(this.ticket!.id!);
      },
      error: () => {
        this.refreshing = false;
        this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'suporte.ticketDetail.toast.attachmentErr');
      }
    });
  }

  downloadAnexo(anexo: TicketAttachment) {
    if (anexo.urlDownload) {
      window.open(anexo.urlDownload, '_blank');
    }
  }

  enviarAvaliacao() {
    if (!this.avaliacaoNota || !this.ticket?.id) return;

    this.refreshing = true;
    this.ticketService.avaliar(this.ticket.id, this.avaliacaoNota, this.avaliacaoComentario || undefined).subscribe({
      next: () => {
        this.i18n.addToast(this.messageService, 'success', 'suporte.ticketDetail.toast.ratingSummary', 'suporte.ticketDetail.toast.ratingOk');
        this.carregarTicket(this.ticket!.id!);
      },
      error: () => {
        this.refreshing = false;
        this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'suporte.ticketDetail.toast.ratingErr');
      }
    });
  }

  voltar() {
    this.router.navigate(['/suporte']);
  }

  getStatusLabel(status: string): string {
    return this.ticketService.getStatusLabel(status);
  }

  getTipoLabel(tipo: string): string {
    return this.ticketService.getTipoLabel(tipo);
  }

  getPrioridadeLabel(prioridade: string): string {
    return this.ticketService.getPrioridadeLabel(prioridade);
  }

  getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'pi-image';
    if (mimeType.includes('pdf')) return 'pi-file-pdf';
    return 'pi-file';
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
