import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { TimelineModule } from 'primeng/timeline';
import { AccordionModule } from 'primeng/accordion';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TranslationService } from '../core/translation.service';
import { TicketService, Ticket, TicketComment, TICKET_STATUS } from '../core/ticket.service';
import { TranslatePipe } from '../core/translate.pipe';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';
import { ListRefreshOverlayComponent } from '../shared/list-refresh-overlay/list-refresh-overlay.component';
import { DisplayTextPipe } from '../core/display-text.pipe';
import { DialogNoteFieldComponent } from '../shared/dialog-note-field/dialog-note-field.component';
import { AuthService, User } from '../auth/auth.service';
import { finalize } from 'rxjs/operators';

interface TimelineEvent {
  tipo: string;
  conteudo: string;
  usuarioNome: string;
  usuarioTipo: string;
  data: Date;
  status?: string;
}

@Component({
  selector: 'app-ticket-atendimento',
  standalone: true,
  styleUrls: ['./suporte-shared.scss'],
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    InputTextareaModule,
    DropdownModule,
    ToastModule,
    TooltipModule,
    TagModule,
    ConfirmDialogModule,
    DialogModule,
    TimelineModule,
    AccordionModule,
    TranslatePipe,
    PageHeroComponent,
    ListRefreshOverlayComponent,
    DisplayTextPipe,
    DialogNoteFieldComponent
  ],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>

    <div class="as-page suporte-page atendimento-workspace">
      <div class="loading-state detail-initial-loading" *ngIf="loading && !ticket">
        <i class="pi pi-spin pi-spinner"></i>
        <span>{{ 'suporte.ticketAtendimento.loading' | translate }}</span>
      </div>

      <ng-container *ngIf="ticket">
      <div class="suporte-page-content workspace-full list-with-refresh">
      <app-list-refresh-overlay [loading]="refreshing" labelKey="ui.loading"></app-list-refresh-overlay>
      <app-page-hero
        variant="navy"
        kickerKey="suporte.ticketAtendimento.kicker"
        [title]="ticket.titulo | displayText"
        [subtitle]="ticket.numero"
        titleIcon="pi-headphones"
        [hasActions]="true">
        <div actions class="header-actions">
          <p-tag [value]="getStatusLabel(ticket.status)"
                 [severity]="getStatusSeverity(ticket.status)"
                 [rounded]="true"></p-tag>
          <p-tag [value]="getPrioridadeLabel(ticket.prioridade)"
                 [severity]="getPrioridadeSeverity(ticket.prioridade)"
                 [rounded]="true"></p-tag>
          <button pButton type="button" icon="pi pi-arrow-left"
                  class="btn-back p-button-text"
                  routerLink="/suporte/atendimento"
                  [pTooltip]="'suporte.ticketAtendimento.back' | translate"></button>
            <!-- Ações principais baseadas no status -->
            <ng-container [ngSwitch]="ticket.status">
              <!-- Chamado ABERTO - pode assumir -->
              <button *ngSwitchCase="'ABERTO'" 
                      pButton type="button" 
                      [label]="'suporte.ticketAtendimento.assume' | translate" 
                      icon="pi pi-user-plus" 
                      class="btn-primary"
                      (click)="assumirChamado()">
              </button>
              
              <!-- Em análise - pode iniciar atendimento ou devolver -->
              <ng-container *ngSwitchCase="'EM_ANALISE'">
                <button pButton type="button" 
                        [label]="'suporte.ticketAtendimento.startService' | translate" 
                        icon="pi pi-play" 
                        class="btn-primary"
                        (click)="alterarStatus('EM_ANDAMENTO')">
                </button>
                <button pButton type="button" 
                        [label]="'suporte.ticketAtendimento.returnUser' | translate" 
                        icon="pi pi-user" 
                        class="btn-warning"
                        (click)="abrirDialogDevolucao()">
                </button>
              </ng-container>
              
              <!-- Em andamento - pode resolver, devolver ou solicitar info -->
              <ng-container *ngSwitchCase="'EM_ANDAMENTO'">
                <button pButton type="button" 
                        [label]="'suporte.ticketAtendimento.resolve' | translate" 
                        icon="pi pi-check-circle" 
                        class="btn-success"
                        (click)="abrirDialogResolucao()">
                </button>
                <button pButton type="button" 
                        [label]="'suporte.ticketAtendimento.returnUser' | translate" 
                        icon="pi pi-user" 
                        class="btn-warning"
                        (click)="abrirDialogDevolucao()">
                </button>
              </ng-container>
              
              <!-- Aguardando usuário - pode retomar -->
              <ng-container *ngSwitchCase="'AGUARDANDO_USUARIO'">
                <button pButton type="button" 
                        [label]="'suporte.ticketAtendimento.resumeService' | translate" 
                        icon="pi pi-play" 
                        class="btn-primary"
                        (click)="alterarStatus('EM_ANDAMENTO')">
                </button>
              </ng-container>
              
              <!-- Resolvido - pode fechar ou reabrir -->
              <ng-container *ngSwitchCase="'RESOLVIDO'">
                <button pButton type="button" 
                        [label]="'suporte.ticketAtendimento.closeTicket' | translate" 
                        icon="pi pi-lock" 
                        class="btn-secondary"
                        (click)="fecharChamado()">
                </button>
                <button pButton type="button" 
                        [label]="'suporte.ticketAtendimento.reopen' | translate" 
                        icon="pi pi-refresh" 
                        class="btn-warning"
                        (click)="alterarStatus('EM_ANDAMENTO')">
                </button>
              </ng-container>
            </ng-container>
        </div>
      </app-page-hero>

      <div class="content-layout">
        <!-- Coluna Principal -->
        <div class="main-column">
          <!-- Informações do Chamado -->
          <div class="info-card">
            <div class="card-header">
              <i class="pi pi-info-circle"></i>
              <h3>{{ 'suporte.ticketAtendimento.section.details' | translate }}</h3>
            </div>
            <div class="card-content">
              <div class="info-grid">
                <div class="info-item">
                  <label>{{ 'suporte.ticketAtendimento.label.type' | translate }}</label>
                  <span class="value">{{ getTipoLabel(ticket.tipo) }}</span>
                </div>
                <div class="info-item">
                  <label>{{ 'suporte.ticketAtendimento.label.category' | translate }}</label>
                  <span class="value">{{ ticket.categoria ? getCategoriaLabel(ticket.categoria) : ('suporte.ticketAtendimento.notInformed' | translate) }}</span>
                </div>
                <div class="info-item">
                  <label>{{ 'suporte.ticketAtendimento.label.environment' | translate }}</label>
                  <span class="value">{{ ticket.ambiente ? getAmbienteLabel(ticket.ambiente) : ('suporte.ticketAtendimento.notInformed' | translate) }}</span>
                </div>
                <div class="info-item">
                  <label>{{ 'suporte.ticketAtendimento.label.openedAt' | translate }}</label>
                  <span class="value">{{ ticket.dataAbertura | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
              </div>
              
              <div class="description-section">
                <label>{{ 'suporte.ticketAtendimento.label.description' | translate }}</label>
                <div class="description-text">{{ ticket.descricao }}</div>
              </div>

              <div class="description-section" *ngIf="ticket.passosReproduzir">
                <label>{{ 'suporte.ticketAtendimento.label.steps' | translate }}</label>
                <div class="description-text">{{ ticket.passosReproduzir }}</div>
              </div>
            </div>
          </div>

          <!-- Adicionar Resposta -->
          <div class="response-card" *ngIf="podeResponder">
            <div class="card-header">
              <i class="pi pi-comment"></i>
              <h3>{{ 'suporte.ticketAtendimento.section.reply' | translate }}</h3>
            </div>
            <div class="card-content">
              <textarea pInputTextarea 
                        [(ngModel)]="novaResposta" 
                        rows="4" 
                        [placeholder]="'suporte.ticketAtendimento.placeholder.reply' | translate"
                        class="response-textarea"></textarea>
              <div class="response-actions">
                <button pButton type="button" 
                        [label]="'suporte.ticketAtendimento.btn.sendReply' | translate" 
                        icon="pi pi-send" 
                        class="btn-primary"
                        [disabled]="!novaResposta.trim() || refreshing"
                        [loading]="enviandoResposta"
                        (click)="enviarResposta()">
                </button>
              </div>
            </div>
          </div>

          <!-- Timeline de Interações -->
          <div class="timeline-card">
            <div class="card-header">
              <i class="pi pi-history"></i>
              <h3>{{ 'suporte.ticketAtendimento.section.timeline' | translate }}</h3>
            </div>
            <div class="card-content">
              <div class="timeline-container" *ngIf="timelineEvents.length > 0">
                <div class="timeline-item" *ngFor="let event of timelineEvents" 
                     [class]="'type-' + event.tipo.toLowerCase().replace('_', '-')">
                  <div class="timeline-marker">
                    <i [class]="getEventIcon(event.tipo)"></i>
                  </div>
                  <div class="timeline-content">
                    <div class="timeline-header">
                      <span class="timeline-author" [class.atendente]="event.usuarioTipo === 'ATENDENTE'">
                        {{ event.usuarioNome || ('suporte.ticketAtendimento.actor.system' | translate) }}
                        <small *ngIf="event.usuarioTipo === 'ATENDENTE'">{{ 'suporte.ticketAtendimento.agentSuffix' | translate }}</small>
                      </span>
                      <span class="timeline-date">{{ event.data | date:'dd/MM/yyyy HH:mm' }}</span>
                    </div>
                    <div class="timeline-body">
                      <p-tag *ngIf="event.status" 
                             [value]="getStatusLabel(event.status)" 
                             [severity]="getStatusSeverity(event.status)"
                             [rounded]="true"
                             class="status-tag"></p-tag>
                      <p class="timeline-text">{{ event.conteudo }}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div class="empty-timeline" *ngIf="timelineEvents.length === 0">
                <i class="pi pi-inbox"></i>
                <p>{{ 'suporte.ticketAtendimento.empty.timeline' | translate }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Coluna Lateral -->
        <div class="side-column">
          <!-- Informações do Usuário -->
          <div class="side-card">
            <div class="card-header">
              <i class="pi pi-user"></i>
              <h3>{{ 'suporte.ticketAtendimento.panel.requester' | translate }}</h3>
            </div>
            <div class="card-content">
              <div class="user-info">
                <div class="user-avatar">
                  <i class="pi pi-user"></i>
                </div>
                <div class="user-details">
                  <span class="user-name">{{ ticket.usuarioNome }}</span>
                  <span class="user-email">{{ ticket.usuarioEmail }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- SLA -->
          <div class="side-card" [class.sla-warning]="ticket.slaPrimeiraRespostaEstourado || ticket.slaResolucaoEstourado">
            <div class="card-header">
              <i class="pi pi-clock"></i>
              <h3>{{ 'suporte.ticketAtendimento.panel.sla' | translate }}</h3>
            </div>
            <div class="card-content">
              <div class="sla-item">
                <label>{{ 'suporte.ticketAtendimento.sla.firstResponse' | translate }}</label>
                <div class="sla-value" [class.estourado]="ticket.slaPrimeiraRespostaEstourado">
                  <span>{{ ticket.slaPrimeiraRespostaHoras }}h</span>
                  <i *ngIf="ticket.slaPrimeiraRespostaEstourado" 
                     class="pi pi-exclamation-triangle" 
                     [pTooltip]="'suporte.ticketAtendimento.sla.breached' | translate"></i>
                  <i *ngIf="ticket.dataPrimeiraResposta && !ticket.slaPrimeiraRespostaEstourado" 
                     class="pi pi-check" 
                     [pTooltip]="'suporte.ticketAtendimento.sla.fulfilled' | translate"></i>
                </div>
              </div>
              <div class="sla-item">
                <label>{{ 'suporte.ticketAtendimento.sla.resolution' | translate }}</label>
                <div class="sla-value" [class.estourado]="ticket.slaResolucaoEstourado">
                  <span>{{ ticket.slaResolucaoHoras }}h</span>
                  <i *ngIf="ticket.slaResolucaoEstourado" 
                     class="pi pi-exclamation-triangle" 
                     pTooltip="SLA estourado"></i>
                  <i *ngIf="ticket.dataResolucao && !ticket.slaResolucaoEstourado" 
                     class="pi pi-check" 
                     pTooltip="Cumprido"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- Atendente -->
          <div class="side-card" *ngIf="ticket.atendenteNome">
            <div class="card-header">
              <i class="pi pi-id-card"></i>
              <h3>{{ 'suporte.ticketAtendimento.panel.assignee' | translate }}</h3>
            </div>
            <div class="card-content">
              <div class="user-info">
                <div class="user-avatar atendente">
                  <i class="pi pi-headphones"></i>
                </div>
                <div class="user-details">
                  <span class="user-name">{{ ticket.atendenteNome }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Anexos -->
          <div class="side-card" *ngIf="ticket.anexos && ticket.anexos.length > 0">
            <div class="card-header">
              <i class="pi pi-paperclip"></i>
              <h3>{{ 'suporte.ticketAtendimento.panel.attachments' | translate }} ({{ ticket.anexos.length }})</h3>
            </div>
            <div class="card-content">
              <div class="attachment-list">
                <a *ngFor="let anexo of ticket.anexos" 
                   [href]="anexo.urlDownload" 
                   target="_blank"
                   class="attachment-item">
                  <i class="pi pi-file"></i>
                  <span>{{ anexo.nomeOriginal }}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
      </ng-container>
    </div>

    <!-- Dialog de Devolução -->
    <p-dialog styleClass="as-hero-dialog dialog-devolucao" [header]="'suporte.ticketAtendimento.dialog.return.title' | translate" 
              [(visible)]="showDialogDevolucao" 
              [modal]="true"
              [style]="{width: '500px'}"
             >
      <div class="dialog-content">
        <p class="as-dialog-intro">
          <i class="pi pi-info-circle"></i>
          {{ 'suporte.ticketAtendimento.dialog.return.info' | translate }}
        </p>
        <app-dialog-note-field
          [(ngModel)]="motivoDevolucao"
          labelKey="suporte.ticketAtendimento.dialog.return.label"
          placeholderKey="suporte.ticketAtendimento.dialog.return.placeholder"
          [rows]="5">
        </app-dialog-note-field>
      </div>
      <ng-template pTemplate="footer">
        <button pButton type="button" [label]="'suporte.ticketAtendimento.dialog.btn.cancel' | translate" 
                icon="pi pi-times" class="btn-secondary"
                (click)="showDialogDevolucao = false"></button>
        <button pButton type="button" [label]="'suporte.ticketAtendimento.dialog.btn.return' | translate" 
                icon="pi pi-send" class="btn-warning"
                [disabled]="!motivoDevolucao.trim()"
                (click)="confirmarDevolucao()"></button>
      </ng-template>
    </p-dialog>

    <!-- Dialog de Resolução -->
    <p-dialog styleClass="as-hero-dialog dialog-resolucao" [header]="'suporte.ticketAtendimento.dialog.resolve.title' | translate" 
              [(visible)]="showDialogResolucao" 
              [modal]="true"
              [style]="{width: '500px'}"
             >
      <div class="dialog-content">
        <p class="as-dialog-intro">
          <i class="pi pi-check-circle"></i>
          {{ 'suporte.ticketAtendimento.dialog.resolve.info' | translate }}
        </p>
        <app-dialog-note-field
          [(ngModel)]="descricaoResolucao"
          labelKey="suporte.ticketAtendimento.dialog.resolve.label"
          placeholderKey="suporte.ticketAtendimento.dialog.resolve.placeholder"
          [rows]="5">
        </app-dialog-note-field>
      </div>
      <ng-template pTemplate="footer">
        <button pButton type="button" [label]="'common.dialog.cancel' | translate" 
                icon="pi pi-times" class="btn-secondary"
                (click)="showDialogResolucao = false"></button>
        <button pButton type="button" [label]="'suporte.ticketAtendimento.dialog.btn.resolve' | translate" 
                icon="pi pi-check" class="btn-success"
                [disabled]="!descricaoResolucao.trim()"
                (click)="confirmarResolucao()"></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .atendimento-container,
    .atendimento-workspace,
    .workspace-full {
      width: 100%;
      max-width: none;
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    .page-header {
      margin-bottom: 24px;
      
      .header-content {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 24px;
        flex-wrap: wrap;
      }

      .header-left {
        display: flex;
        align-items: flex-start;
        gap: 16px;
      }

      .btn-back {
        background: white;
        border: 1px solid #e2e8f0;
        color: #475569;
        width: 40px;
        height: 40px;
        border-radius: 10px;
        
        &:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }
      }

      .header-info {
        .ticket-number {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
          
          .number {
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 14px;
            color: #475569;
            background: #f1f5f9;
            padding: 4px 8px;
            border-radius: 4px;
          }
        }

        h1 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #0f172a;
        }
      }

      .header-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
    }

    .content-layout {
      display: grid;
      width: 100%;
      grid-template-columns: 1fr minmax(260px, 22rem);
      gap: 24px;

      @media (max-width: 1024px) {
        grid-template-columns: 1fr;
      }
    }

    .main-column {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .side-column {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .info-card, .response-card, .timeline-card, .side-card {
      background: white;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      overflow: hidden;

      .card-header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 16px 20px;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;

        i {
          font-size: 16px;
          color: #0ea5e9;
        }

        h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #334155;
        }
      }

      .card-content {
        padding: 20px;
      }
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 20px;

      @media (max-width: 600px) {
        grid-template-columns: 1fr;
      }

      .info-item {
        label {
          display: block;
          font-size: 12px;
          color: #475569;
          margin-bottom: 4px;
        }

        .value {
          font-size: 14px;
          font-weight: 500;
          color: #0f172a;
        }
      }
    }

    .description-section {
      margin-top: 16px;

      label {
        display: block;
        font-size: 12px;
        color: #475569;
        margin-bottom: 8px;
      }

      .description-text {
        font-size: 14px;
        color: #334155;
        line-height: 1.6;
        white-space: pre-wrap;
        background: #f8fafc;
        padding: 12px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
      }
    }

    .response-textarea {
      width: 100%;
      resize: vertical;
      min-height: 100px;
    }

    .response-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 12px;
    }

    .timeline-container {
      .timeline-item {
        display: flex;
        gap: 16px;
        padding: 16px 0;
        border-bottom: 1px solid #f1f5f9;

        &:last-child {
          border-bottom: none;
        }

        .timeline-marker {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f1f5f9;
          flex-shrink: 0;

          i {
            font-size: 14px;
            color: #475569;
          }
        }

        &.type-comentario .timeline-marker {
          background: #e0f2fe;
          i { color: #0284c7; }
        }

        &.type-status .timeline-marker {
          background: #fef3c7;
          i { color: #d97706; }
        }

        &.type-resolucao .timeline-marker {
          background: #d1fae5;
          i { color: #059669; }
        }

        .timeline-content {
          flex: 1;

          .timeline-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;

            .timeline-author {
              font-weight: 500;
              color: #334155;
              font-size: 13px;

              &.atendente {
                color: #0284c7;
              }

              small {
                font-weight: 400;
                color: #475569;
              }
            }

            .timeline-date {
              font-size: 12px;
              color: #475569;
            }
          }

          .timeline-body {
            .status-tag {
              margin-bottom: 8px;
            }

            .timeline-text {
              margin: 0;
              font-size: 14px;
              color: #475569;
              line-height: 1.5;
              white-space: pre-wrap;
            }
          }
        }
      }
    }

    .empty-timeline {
      text-align: center;
      padding: 32px;
      color: #475569;

      i {
        font-size: 32px;
        margin-bottom: 8px;
      }

      p {
        margin: 0;
        font-size: 14px;
      }
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;

      .user-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #e0f2fe;
        display: flex;
        align-items: center;
        justify-content: center;

        i {
          color: #0284c7;
          font-size: 16px;
        }

        &.atendente {
          background: #d1fae5;
          i { color: #059669; }
        }
      }

      .user-details {
        display: flex;
        flex-direction: column;
        gap: 2px;

        .user-name {
          font-weight: 500;
          color: #0f172a;
          font-size: 14px;
        }

        .user-email {
          font-size: 12px;
          color: #475569;
        }
      }
    }

    .side-card.sla-warning {
      border-color: #fbbf24;
      
      .card-header {
        background: #fef3c7;
      }
    }

    .sla-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #f1f5f9;

      &:last-child {
        border-bottom: none;
      }

      label {
        font-size: 13px;
        color: #475569;
      }

      .sla-value {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        font-size: 14px;
        color: #0f172a;

        &.estourado {
          color: #dc2626;
        }

        .pi-exclamation-triangle {
          color: #dc2626;
        }

        .pi-check {
          color: #059669;
        }
      }
    }

    .attachment-list {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .attachment-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: #f8fafc;
        border-radius: 6px;
        text-decoration: none;
        color: #334155;
        font-size: 13px;
        transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;

        &:hover {
          background: #e0f2fe;
          color: #0284c7;
        }

        i {
          color: #475569;
        }
      }
    }

    .dialog-content {
      .dialog-info {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 12px;
        background: #f0f9ff;
        border-radius: 8px;
        margin-bottom: 16px;
        font-size: 13px;
        color: #0369a1;

        i {
          color: #0ea5e9;
          margin-top: 2px;
        }

        &.success {
          background: #f0fdf4;
          color: #166534;
          i { color: #22c55e; }
        }
      }

      .form-group {
        label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #334155;
          margin-bottom: 8px;

          .required {
            color: #dc2626;
          }
        }

        textarea {
          width: 100%;
          resize: vertical;
        }
      }
    }

    .loading-overlay {
      display: none;
    }

    .detail-initial-loading {
      width: 100%;
      min-height: 50vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      color: #475569;

      i {
        font-size: 32px;
        color: #0ea5e9;
      }
    }

    /* Botões */
    .btn-primary {
      background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
      border: none;
      
      &:hover {
        background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      }
    }

    .btn-secondary {
      background: white;
      border: 1px solid #e2e8f0;
      color: #475569;
      
      &:hover {
        background: #f8fafc;
        border-color: #cbd5e1;
      }
    }

    .btn-success {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      border: none;
      
      &:hover {
        background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
      }
    }

    .btn-warning {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      border: none;
      
      &:hover {
        background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
      }
    }
  `]
})
export class TicketAtendimentoComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ticketService = inject(TicketService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private i18n = inject(TranslationService);
  private confirmationService = inject(ConfirmationService);

  ticket: Ticket | null = null;
  currentUser: User | null = null;
  loading = true;
  refreshing = false;

  novaResposta = '';
  enviandoResposta = false;

  showDialogDevolucao = false;
  motivoDevolucao = '';

  showDialogResolucao = false;
  descricaoResolucao = '';

  timelineEvents: TimelineEvent[] = [];

  get statusOptions() {
    return this.i18n.buildTranslatedOptions(
      'ticket.status',
      TICKET_STATUS.map((s) => ({ label: s.value, value: s.value }))
    );
  }

  get podeResponder(): boolean {
    if (!this.ticket) return false;
    return !['FECHADO', 'CANCELADO'].includes(this.ticket.status || '');
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    const id = this.route.snapshot.params['id'];
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
        this.enviandoResposta = false;
      })
    ).subscribe({
      next: (ticket) => {
        this.ticket = ticket;
        this.construirTimeline();
      },
      error: (err) => {
        console.error('Failed to load ticket:', err);
        this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'suporte.ticketAtendimento.toast.loadError');
        if (!isRefresh) {
          this.router.navigate(['/suporte/atendimento']);
        }
      }
    });
  }

  construirTimeline() {
    this.timelineEvents = [];
    
    if (!this.ticket) return;

    // Adicionar comentários
    if (this.ticket.comentarios) {
      this.ticket.comentarios.forEach(c => {
        this.timelineEvents.push({
          tipo: c.tipo || 'COMENTARIO',
          conteudo: c.conteudo || '',
          usuarioNome: c.usuarioNome || this.i18n.translate('profile.userFallback'),
          usuarioTipo: c.usuarioTipo || 'USUARIO',
          data: new Date(c.dataCriacao || new Date()),
          status: c.tipo === 'ALTERACAO_STATUS' && c.conteudo ? c.conteudo.split(':')[0] : undefined
        });
      });
    }

    // Ordenar por data (mais recentes primeiro)
    this.timelineEvents.sort((a, b) => b.data.getTime() - a.data.getTime());
  }

  assumirChamado() {
    if (!this.ticket || !this.currentUser) return;

    this.confirmationService.confirm({
      message: 'confirm.ticket.assume',
      header: 'confirm.header.confirm',
      icon: 'pi pi-user-plus',
      accept: () => {
        this.refreshing = true;
        const update: Partial<Ticket> = {
          atendenteId: this.currentUser!.id,
          atendenteNome: this.currentUser!.nome,
          status: 'EM_ANALISE'
        };

        this.ticketService.update(this.ticket!.id!, update as Ticket).subscribe({
          next: () => {
            this.i18n.addToast(
              this.messageService,
              'success',
              'suporte.ticketAtendimento.toast.assumeOkSummary',
              'suporte.ticketAtendimento.toast.assumeOkDetail'
            );
            this.carregarTicket(this.ticket!.id!);
          },
          error: (err) => {
            console.error('Failed to take ticket:', err);
            this.refreshing = false;
            this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'suporte.ticketAtendimento.toast.assumeError');
          }
        });
      }
    });
  }

  alterarStatus(novoStatus: string) {
    if (!this.ticket || !this.currentUser) return;

    this.refreshing = true;
    this.ticketService.alterarStatus(
      this.ticket.id!, 
      novoStatus,
      this.currentUser.id,
      this.currentUser.nome,
      'ATENDENTE'
    ).subscribe({
      next: () => {
        this.i18n.addToast(this.messageService, 'success', 'suporte.ticketAtendimento.toast.statusOkSummary', 'suporte.ticketAtendimento.toast.statusOkDetail', {
          label: this.getStatusLabel(novoStatus)
        });
        this.carregarTicket(this.ticket!.id!);
      },
      error: (err) => {
        console.error('Failed to change status:', err);
        this.refreshing = false;
        this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'suporte.ticketAtendimento.toast.statusError');
      }
    });
  }

  enviarResposta() {
    if (!this.ticket || !this.novaResposta.trim() || !this.currentUser) return;

    this.enviandoResposta = true;
    this.refreshing = true;

    const comentario: TicketComment = {
      conteudo: this.novaResposta,
      usuarioId: this.currentUser.id,
      usuarioNome: this.currentUser.nome,
      usuarioTipo: 'ATENDENTE',
      tipo: 'COMENTARIO'
    };

    this.ticketService.addComment(this.ticket.id!, comentario).subscribe({
      next: () => {
        this.i18n.addToast(
          this.messageService,
          'success',
          'suporte.ticketAtendimento.toast.replyOkSummary',
          'suporte.ticketAtendimento.toast.replyOkDetail'
        );
        this.novaResposta = '';
        this.carregarTicket(this.ticket!.id!);
      },
      error: (err) => {
        console.error('Failed to send reply:', err);
        this.enviandoResposta = false;
        this.refreshing = false;
        this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'suporte.ticketAtendimento.toast.replyError');
      }
    });
  }

  abrirDialogDevolucao() {
    this.motivoDevolucao = '';
    this.showDialogDevolucao = true;
  }

  confirmarDevolucao() {
    if (!this.ticket || !this.motivoDevolucao.trim() || !this.currentUser) return;

    this.refreshing = true;
    const comentario: TicketComment = {
      conteudo: `Chamado devolvido ao usuário: ${this.motivoDevolucao}`,
      usuarioId: this.currentUser.id,
      usuarioNome: this.currentUser.nome,
      usuarioTipo: 'ATENDENTE',
      tipo: 'ALTERACAO_STATUS'
    };

    this.ticketService.addComment(this.ticket.id!, comentario).subscribe({
      next: () => {
        // Então altera o status
        this.ticketService.alterarStatus(
          this.ticket!.id!, 
          'AGUARDANDO_USUARIO',
          this.currentUser!.id,
          this.currentUser!.nome,
          'ATENDENTE'
        ).subscribe({
          next: () => {
            this.showDialogDevolucao = false;
            this.i18n.addToast(
              this.messageService,
              'success',
              'suporte.ticketAtendimento.toast.returnOkSummary',
              'suporte.ticketAtendimento.toast.replyOkDetail'
            );
            this.carregarTicket(this.ticket!.id!);
          },
          error: (err) => {
            console.error('Failed to return ticket:', err);
            this.refreshing = false;
            this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'suporte.ticketAtendimento.toast.returnError');
          }
        });
      },
      error: () => {
        this.refreshing = false;
        this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'suporte.ticketAtendimento.toast.returnError');
      }
    });
  }

  abrirDialogResolucao() {
    this.descricaoResolucao = '';
    this.showDialogResolucao = true;
  }

  confirmarResolucao() {
    if (!this.ticket || !this.descricaoResolucao.trim() || !this.currentUser) return;

    this.refreshing = true;
    const comentario: TicketComment = {
      conteudo: `Solução: ${this.descricaoResolucao}`,
      usuarioId: this.currentUser.id,
      usuarioNome: this.currentUser.nome,
      usuarioTipo: 'ATENDENTE',
      tipo: 'SOLUCAO'
    };

    this.ticketService.addComment(this.ticket.id!, comentario).subscribe({
      next: () => {
        // Então altera o status para resolvido
        this.ticketService.alterarStatus(
          this.ticket!.id!, 
          'RESOLVIDO',
          this.currentUser!.id,
          this.currentUser!.nome,
          'ATENDENTE'
        ).subscribe({
          next: () => {
            this.showDialogResolucao = false;
            this.i18n.addToast(
              this.messageService,
              'success',
              'suporte.ticketAtendimento.toast.resolveOkSummary',
              'suporte.ticketAtendimento.toast.replyOkDetail'
            );
            this.carregarTicket(this.ticket!.id!);
          },
          error: (err) => {
            console.error('Failed to resolve ticket:', err);
            this.refreshing = false;
            this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'suporte.ticketAtendimento.toast.resolveError');
          }
        });
      },
      error: () => {
        this.refreshing = false;
        this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'suporte.ticketAtendimento.toast.resolveError');
      }
    });
  }

  fecharChamado() {
    this.confirmationService.confirm({
      message: 'confirm.ticket.closePermanent',
      header: 'confirm.header.closeTicket',
      icon: 'pi pi-lock',
      accept: () => {
        this.alterarStatus('FECHADO');
      }
    });
  }

  getStatusLabel(status: string | undefined): string {
    return this.ticketService.getStatusLabel(status || '');
  }

  getStatusSeverity(status: string | undefined): string {
    const severities: Record<string, string> = {
      'ABERTO': 'info',
      'EM_ANALISE': 'warning',
      'EM_ANDAMENTO': 'warning',
      'AGUARDANDO_USUARIO': 'danger',
      'RESOLVIDO': 'success',
      'FECHADO': 'secondary',
      'CANCELADO': 'secondary'
    };
    return severities[status || ''] || 'info';
  }

  getPrioridadeSeverity(prioridade: string | undefined): string {
    const severities: Record<string, string> = {
      'CRITICA': 'danger',
      'ALTA': 'warning',
      'MEDIA': 'info',
      'BAIXA': 'secondary'
    };
    return severities[prioridade || ''] || 'info';
  }

  getTipoLabel(tipo: string | undefined): string {
    return this.ticketService.getTipoLabel(tipo || '');
  }

  getPrioridadeLabel(prioridade: string | undefined): string {
    return this.ticketService.getPrioridadeLabel(prioridade || '');
  }

  getCategoriaLabel(categoria: string | undefined): string {
    return this.ticketService.getCategoriaLabel(categoria || '');
  }

  getAmbienteLabel(ambiente: string | undefined): string {
    return this.ticketService.getAmbienteLabel(ambiente || '');
  }

  getEventIcon(tipo: string): string {
    const icons: Record<string, string> = {
      'COMENTARIO': 'pi pi-comment',
      'STATUS': 'pi pi-sync',
      'RESOLUCAO': 'pi pi-check-circle'
    };
    return icons[tipo] || 'pi pi-circle';
  }
}
