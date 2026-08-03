import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { TranslationService } from '../core/translation.service';
import { 
  TicketService, 
  Ticket, 
  TICKET_TIPOS, 
  TICKET_PRIORIDADES, 
  TICKET_CATEGORIAS, 
  TICKET_AMBIENTES 
} from '../core/ticket.service';
import { AuthService } from '../auth/auth.service';
import { TranslatePipe } from '../core/translate.pipe';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';
import { TicketSlaPreview } from '../core/ticket.service';
import {
  formatSlaPreviewLine,
  slaModifierBadgeClass,
  slaModifierHintKey
} from '../core/ticket-sla-format.util';
import { computeTicketSlaPreview } from '../core/ticket-sla-policy.util';

@Component({
  selector: 'app-ticket-new',
  standalone: true,
  styleUrls: ['./suporte-shared.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    InputTextareaModule,
    DropdownModule,
    FileUploadModule,
    ToastModule,
    TooltipModule,
    TranslatePipe,
    PageHeroComponent
  ],
  template: `
    <p-toast></p-toast>
    
    <div class="as-page suporte-page">
      <app-page-hero
        variant="gold"
        titleKey="suporte.ticketNew.title"
        subtitleKey="suporte.ticketNew.subtitle"
        titleIcon="pi-plus-circle">
      </app-page-hero>

      <div class="suporte-page-content">
      <div class="form-layout-premium">
        <!-- Coluna Principal -->
        <div class="form-main">
          <!-- Tipo e Prioridade -->
          <div class="form-card-premium">
            <h3>{{ 'suporte.ticketNew.section.classification' | translate }}</h3>
            <p class="form-card-hint">{{ 'suporte.ticketNew.section.classificationHint' | translate }}</p>
            
            <div class="form-row">
              <div class="form-group flex-1">
                <label>{{ 'suporte.ticketNew.label.type' | translate }} <span class="required">*</span></label>
                <div class="option-group">
                  <button 
                    *ngFor="let tipo of tipos"
                    type="button"
                    class="option-btn"
                    [attr.data-tipo]="tipo.value"
                    [class.selected]="ticket.tipo === tipo.value"
                    (click)="selecionarTipo(tipo.value)">
                    <i [class]="'pi ' + tipo.icon" aria-hidden="true"></i>
                    <span>{{ tipoLabelKey(tipo.value) | translate }}</span>
                  </button>
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>{{ 'suporte.ticketNew.label.priority' | translate }} <span class="required">*</span></label>
                <div class="option-group">
                  <button 
                    *ngFor="let prio of prioridades"
                    type="button"
                    class="option-btn small"
                    [attr.data-prio]="prio.value"
                    [class.selected]="ticket.prioridade === prio.value"
                    (click)="selecionarPrioridade(prio.value)"
                    [pTooltip]="getPrioridadeSlaTooltip(prio.value)"
                    tooltipPosition="top">
                    <span>{{ prioridadeLabelKey(prio.value) | translate }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Informações Básicas -->
          <div class="form-card-premium">
            <h3>{{ 'suporte.ticketNew.section.details' | translate }}</h3>
            <p class="form-card-hint">{{ 'suporte.ticketNew.section.detailsHint' | translate }}</p>
            
            <div class="form-group">
              <label for="titulo">{{ 'suporte.ticketNew.label.title' | translate }} <span class="required">*</span></label>
              <input 
                pInputText 
                id="titulo"
                [(ngModel)]="ticket.titulo"
                [placeholder]="'suporte.ticketNew.placeholder.title' | translate"
                maxlength="255">
              <span class="char-count">{{ ticket.titulo?.length || 0 }}/255</span>
            </div>

            <div class="form-group">
              <label for="descricao">{{ 'suporte.ticketNew.label.description' | translate }} <span class="required">*</span></label>
              <textarea 
                pInputTextarea 
                id="descricao"
                [(ngModel)]="ticket.descricao"
                [placeholder]="'suporte.ticketNew.placeholder.description' | translate"
                rows="4">
              </textarea>
            </div>

            <div class="form-row" *ngIf="ticket.tipo === 'ERRO'">
              <div class="form-group flex-1">
                <label for="passos">{{ 'suporte.ticketNew.label.steps' | translate }}</label>
                <textarea 
                  pInputTextarea 
                  id="passos"
                  [(ngModel)]="ticket.passosReproduzir"
                  [placeholder]="'suporte.ticketNew.placeholder.steps' | translate"
                  rows="3">
                </textarea>
              </div>
            </div>
          </div>

          <!-- Anexos -->
          <div class="form-card-premium">
            <h3>{{ 'suporte.ticketNew.section.attachments' | translate }}</h3>
            <p class="form-card-hint">{{ 'suporte.ticketNew.section.attachmentsHint' | translate }}</p>
            
            <div class="upload-area" 
                 [class.upload-area--dragover]="isDragOver"
                 (click)="fileInput.click()"
                 (dragover)="onDragOver($event)"
                 (dragleave)="onDragLeave($event)"
                 (drop)="onDrop($event)">
              <input 
                #fileInput
                type="file" 
                multiple 
                accept="image/*,.pdf,.txt,.log,.doc,.docx"
                (change)="onFilesSelected($event)"
                style="display: none;">
              <i class="pi pi-cloud-upload"></i>
              <p>{{ 'suporte.ticketNew.dropzone' | translate }}</p>
              <span>{{ 'suporte.ticketNew.attach.maxSize' | translate }}</span>
            </div>

            <div class="file-list" *ngIf="arquivosSelecionados.length > 0">
              <div class="file-item" *ngFor="let file of arquivosSelecionados; let i = index">
                <i class="pi" [ngClass]="getFileIcon(file.type)"></i>
                <span class="file-name">{{ file.name }}</span>
                <span class="file-size">{{ formatFileSize(file.size) }}</span>
                <button 
                  pButton 
                  type="button" 
                  icon="pi pi-times" 
                  class="p-button-text p-button-sm"
                  (click)="removerArquivo(i)">
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Coluna Lateral -->
        <div class="form-sidebar">
          <div class="sidebar-tips-premium">
            <h4>{{ 'suporte.ticketNew.sidebar.title' | translate }}</h4>
            <ul>
              <li>{{ 'suporte.ticketNew.sidebar.tip1' | translate }}</li>
              <li>{{ 'suporte.ticketNew.sidebar.tip2' | translate }}</li>
              <li>{{ 'suporte.ticketNew.sidebar.tip3' | translate }}</li>
            </ul>
          </div>

          <div class="form-card-premium">
            <h3>{{ 'suporte.ticketNew.label.category' | translate }}</h3>
            
            <div class="form-group">
              <label for="categoria">{{ 'suporte.ticketNew.label.category' | translate }}</label>
              <p-dropdown 
                id="categoria"
                [options]="categorias"
                [(ngModel)]="ticket.categoria"
                (ngModelChange)="atualizarSlaPreview()"
                [placeholder]="'common.placeholder.select' | translate"
                optionLabel="label"
                optionValue="value"
                [showClear]="true"
                styleClass="w-full">
              </p-dropdown>
            </div>

            <div class="form-group">
              <label for="ambiente">{{ 'suporte.ticketNew.label.environment' | translate }}</label>
              <p-dropdown 
                id="ambiente"
                [options]="ambientes"
                [(ngModel)]="ticket.ambiente"
                (ngModelChange)="atualizarSlaPreview()"
                [placeholder]="'common.placeholder.select' | translate"
                optionLabel="label"
                optionValue="value"
                [showClear]="true"
                styleClass="w-full">
              </p-dropdown>
            </div>
          </div>

          <!-- SLA Info -->
          <div class="sla-card" *ngIf="ticket.prioridade && slaPreview" [ngClass]="slaCardClass">
            <div class="sla-icon">
              <i class="pi pi-clock" aria-hidden="true"></i>
            </div>
            <div class="sla-content">
              <h4>{{ 'suporte.ticketNew.sla.title' | translate }}</h4>
              <span class="sla-modifier-badge">{{ slaModifierLabelKey | translate }}</span>
              <p class="sla-preview-line">{{ slaPreviewLine }}</p>
              <small class="sla-priority-hint">{{ 'suporte.ticketNew.sla.priorityHint' | translate }}</small>
            </div>
          </div>
          <div class="sla-card sla-card--placeholder" *ngIf="ticket.prioridade && !slaPreview">
            <div class="sla-icon">
              <i class="pi pi-clock" aria-hidden="true"></i>
            </div>
            <div class="sla-content">
              <h4>{{ 'suporte.ticketNew.sla.title' | translate }}</h4>
              <p>{{ 'suporte.ticketNew.sla.loading' | translate }}</p>
            </div>
          </div>

        </div>
      </div>

      <div class="form-footer-actions">
        <button
          pButton
          type="button"
          [label]="'suporte.ticketNew.cancel' | translate"
          icon="pi pi-times"
          class="p-button-text p-button-secondary form-footer-cancel"
          (click)="cancelar()">
        </button>
        <button
          pButton
          type="button"
          [label]="'suporte.ticketNew.submit' | translate"
          icon="pi pi-send"
          class="btn-suporte-primary form-footer-submit"
          (click)="enviarChamado()"
          [disabled]="!isFormValid || enviando"
          [loading]="enviando">
        </button>
      </div>
      </div>
    </div>
  `,
  styles: [`
    .suporte-container {
      width: 100%;
      max-width: none;
      margin: 0;
      padding: 0;
    }

    .page-header {
      margin-bottom: 1.5rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-text {
      h1 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: #0f172a;
      }

      p {
        margin: 0.25rem 0 0 0;
        font-size: 0.875rem;
        color: #475569;
      }
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
      border: none;
      padding: 0.625rem 1.25rem;
      font-weight: 500;
      border-radius: 8px;

      &:hover:not(:disabled) {
        background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      }

      &:disabled {
        opacity: 0.6;
      }
    }

    .btn-secondary {
      background: white;
      border: 1px solid #e2e8f0;
      color: #475569;
      padding: 0.625rem 1.25rem;
      font-weight: 500;
      border-radius: 8px;

      &:hover {
        background: #f8fafc;
        border-color: #cbd5e1;
      }
    }

    .form-layout {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 1.5rem;
    }

    .form-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;
      margin-bottom: 1rem;
    }

    .form-card-header {
      margin-bottom: 1rem;

      h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: #0f172a;
      }

      p {
        margin: 0.25rem 0 0 0;
        font-size: 0.8125rem;
        color: #475569;
      }
    }

    .form-row {
      display: flex;
      gap: 1rem;
    }

    .form-group {
      margin-bottom: 1rem;

      &.flex-1 {
        flex: 1;
      }

      label {
        display: block;
        margin-bottom: 0.5rem;
        font-size: 0.8125rem;
        font-weight: 500;
        color: #374151;
      }

      .required {
        color: #ef4444;
      }

      .char-count {
        display: block;
        text-align: right;
        font-size: 0.6875rem;
        color: #475569;
        margin-top: 0.25rem;
      }

      input, textarea {
        width: 100%;
        padding: 0.625rem 0.875rem;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 0.875rem;
        transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;

        &:focus {
          outline: none;
          border-color: #0ea5e9;
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
        }

        &::placeholder {
          color: #475569;
        }
      }

      textarea {
        resize: vertical;
        min-height: 80px;
      }
    }

    .option-group {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .option-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: white;
      cursor: pointer;
      transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
      font-size: 0.8125rem;
      color: #475569;

      i {
        font-size: 1rem;
      }

      &:hover {
        border-color: #cbd5e1;
        background: #f8fafc;
      }

      &.selected {
        border-width: 2px;
        font-weight: 600;
        box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.04);
      }

      &.small {
        padding: 0.5rem 0.875rem;
      }

      span {
        color: inherit;
        font-size: inherit;
        font-weight: inherit;
        line-height: 1.25;
        white-space: nowrap;
      }

      i {
        color: inherit;
        flex-shrink: 0;
      }

      &[data-tipo='ERRO'].selected,
      &[data-prio='CRITICA'].selected {
        border-color: #ef4444;
        background: rgba(239, 68, 68, 0.1);
        color: #b91c1c;
        box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.15);
      }
      &[data-tipo='MELHORIA'].selected {
        border-color: #0ea5e9;
        background: rgba(14, 165, 233, 0.12);
        color: #0369a1;
        box-shadow: 0 0 0 1px rgba(14, 165, 233, 0.15);
      }
      &[data-tipo='DUVIDA'].selected {
        border-color: #475569;
        background: rgba(100, 116, 139, 0.1);
        color: #334155;
        box-shadow: 0 0 0 1px rgba(100, 116, 139, 0.12);
      }
      &[data-tipo='SOLICITACAO'].selected,
      &[data-prio='BAIXA'].selected {
        border-color: #22c55e;
        background: rgba(34, 197, 94, 0.1);
        color: #15803d;
        box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.15);
      }
      &[data-prio='ALTA'].selected {
        border-color: #f97316;
        background: rgba(249, 115, 22, 0.12);
        color: #c2410c;
        box-shadow: 0 0 0 1px rgba(249, 115, 22, 0.15);
      }
      &[data-prio='MEDIA'].selected {
        border-color: #eab308;
        background: rgba(234, 179, 8, 0.14);
        color: #a16207;
        box-shadow: 0 0 0 1px rgba(234, 179, 8, 0.18);
      }
    }

    .form-footer-actions {
      position: sticky;
      bottom: 0;
      z-index: 20;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-top: 1.25rem;
      padding: 1rem 1.25rem;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.96);
      box-shadow: 0 -8px 24px rgba(15, 23, 42, 0.08);
      backdrop-filter: blur(6px);
    }

    :host ::ng-deep .form-footer-actions {
      .form-footer-cancel.p-button {
        color: #475569;
      }

      .form-footer-submit.p-button,
      .btn-suporte-primary.p-button {
        background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%) !important;
        border: none !important;
        color: #ffffff !important;
        box-shadow: 0 4px 14px rgba(15, 23, 42, 0.28);
        min-width: 11rem;
      }

      .btn-suporte-primary.p-button:enabled:hover {
        background: linear-gradient(135deg, #234b73 0%, #1e293b 100%) !important;
        color: #ffffff !important;
      }
    }

    .suporte-page-content {
      padding-bottom: 1rem;
    }

    .upload-area {
      border: 2px dashed #cbd5e1;
      border-radius: 12px;
      padding: 2rem;
      text-align: center;
      cursor: pointer;
      transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
      background: #f1f5f9;

      &:hover,
      &.upload-area--dragover {
        border-color: #0ea5e9;
        border-width: 2px;
        background: #e0f2fe;
        box-shadow: inset 0 0 0 1px rgba(14, 165, 233, 0.12);
      }

      &.upload-area--dragover {
        border-style: solid;
      }

      i {
        font-size: 2rem;
        color: #475569;
        margin-bottom: 0.5rem;
      }

      p {
        margin: 0 0 0.25rem 0;
        font-size: 0.875rem;
        color: #475569;
      }

      span {
        font-size: 0.75rem;
        color: #475569;
      }
    }

    .file-list {
      margin-top: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .file-item {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.625rem 0.875rem;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;

      i {
        color: #0ea5e9;
      }

      .file-name {
        flex: 1;
        font-size: 0.8125rem;
        color: #374151;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .file-size {
        font-size: 0.75rem;
        color: #475569;
      }
    }

    .sla-card {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 10px;
      padding: 1rem;
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1rem;

      &.sla-card--accelerated {
        background: #fef2f2;
        border-color: #fecaca;

        .sla-icon i,
        .sla-content h4,
        .sla-content p,
        .sla-preview-line {
          color: #b91c1c;
        }

        .sla-modifier-badge {
          background: #fee2e2;
          color: #991b1b;
        }
      }

      &.sla-card--relaxed {
        background: #f0fdf4;
        border-color: #bbf7d0;

        .sla-icon i,
        .sla-content h4,
        .sla-content p,
        .sla-preview-line {
          color: #15803d;
        }

        .sla-modifier-badge {
          background: #dcfce7;
          color: #166534;
        }
      }

      &.sla-card--standard {
        .sla-modifier-badge {
          background: #e0f2fe;
          color: #0369a1;
        }
      }

      .sla-modifier-badge {
        display: inline-block;
        margin: 0.25rem 0 0.45rem;
        padding: 0.15rem 0.5rem;
        border-radius: 999px;
        font-size: 0.6875rem;
        font-weight: 700;
        letter-spacing: 0.02em;
        text-transform: uppercase;
      }

      .sla-icon {
        width: 36px;
        height: 36px;
        background: white;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;

        i {
          color: #0284c7;
        }
      }

      .sla-content {
        h4 {
          margin: 0;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #0369a1;
        }

        p {
          margin: 0.25rem 0 0 0;
          font-size: 0.75rem;
          color: #0284c7;
        }

        .sla-priority-hint {
          display: block;
          margin-top: 0.45rem;
          font-size: 0.6875rem;
          color: #475569;
          line-height: 1.4;
        }

        .sla-preview-line {
          margin: 0.35rem 0 0;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #0369a1;
          line-height: 1.45;
        }
      }

      &.sla-card--placeholder {
        background: #f8fafc;
        border-color: #e2e8f0;

        .sla-content p {
          margin: 0.35rem 0 0;
          font-size: 0.8125rem;
          color: #475569;
        }
      }
    }

    .tips-card {
      background: #fefce8;
      border: 1px solid #fde68a;
      border-radius: 10px;
      padding: 1rem;

      h4 {
        margin: 0 0 0.75rem 0;
        font-size: 0.875rem;
        font-weight: 600;
        color: #a16207;
        display: flex;
        align-items: center;
        gap: 0.5rem;

        i {
          color: #ca8a04;
        }
      }

      ul {
        margin: 0;
        padding-left: 1.25rem;

        li {
          font-size: 0.75rem;
          color: #a16207;
          margin-bottom: 0.375rem;
          line-height: 1.4;

          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    }

    :host ::ng-deep {
      .p-dropdown {
        width: 100%;
        border-radius: 8px;
        border-color: #e2e8f0;

        &:hover {
          border-color: #cbd5e1;
        }

        &.p-focus {
          border-color: #0ea5e9;
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
        }
      }
    }

    @media (max-width: 992px) {
      .form-layout {
        grid-template-columns: 1fr;
      }

      .form-sidebar {
        order: -1;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;

        .form-card, .sla-card, .tips-card {
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
        align-items: flex-start;
        gap: 1rem;
      }

      .header-actions {
        width: 100%;

        button {
          flex: 1;
        }
      }

      .option-group {
        flex-direction: column;

        .option-btn {
          width: 100%;
          justify-content: center;
        }
      }
    }
  `]
})
export class TicketNewComponent implements OnInit {
  private router = inject(Router);
  private ticketService = inject(TicketService);
  private messageService = inject(MessageService);
  private i18n = inject(TranslationService);
  private authService = inject(AuthService);

  ticket: Ticket = {
    tipo: 'ERRO',
    prioridade: 'MEDIA',
    status: 'ABERTO'
  };

  tipos = TICKET_TIPOS;
  prioridades = TICKET_PRIORIDADES;
  categorias = TICKET_CATEGORIAS;
  ambientes = TICKET_AMBIENTES;

  arquivosSelecionados: File[] = [];
  enviando = false;
  isDragOver = false;
  slaPreview: TicketSlaPreview | null = null;

  get slaPreviewLine(): string {
    if (!this.slaPreview) {
      return '';
    }
    return formatSlaPreviewLine(
      this.slaPreview.primeiraRespostaMinutos,
      this.slaPreview.resolucaoMinutos,
      this.i18n
    );
  }

  get slaModifierLabelKey(): string {
    return slaModifierHintKey(this.slaPreview?.ambienteModifier);
  }

  get slaCardClass(): string {
    return slaModifierBadgeClass(this.slaPreview?.ambienteModifier);
  }

  get isFormValid(): boolean {
    return !!(
      this.ticket.tipo &&
      this.ticket.prioridade &&
      this.ticket.titulo?.trim() &&
      this.ticket.descricao?.trim()
    );
  }

  ngOnInit() {
    this.detectarInfoSistema();
    this.carregarUsuarioLogado();
    this.tipos = TICKET_TIPOS.map(t => ({ ...t, label: this.ticketService.getTipoLabel(t.value) }));
    this.prioridades = TICKET_PRIORIDADES.map(p => ({ ...p, label: this.ticketService.getPrioridadeLabel(p.value) }));
    this.categorias = TICKET_CATEGORIAS.map(c => ({ ...c, label: this.ticketService.getCategoriaLabel(c.value) }));
    this.ambientes = TICKET_AMBIENTES.map(a => ({ ...a, label: this.ticketService.getAmbienteLabel(a.value) }));
    this.atualizarSlaPreview();
  }

  selecionarTipo(tipo: string) {
    this.ticket.tipo = tipo as Ticket['tipo'];
  }

  selecionarPrioridade(prioridade: string) {
    this.ticket.prioridade = prioridade as Ticket['prioridade'];
    this.atualizarSlaPreview();
  }

  tipoLabelKey(value: string): string {
    return `ticket.type.${value}`;
  }

  prioridadeLabelKey(value: string): string {
    return `ticket.priority.${value}`;
  }

  getPrioridadeSlaTooltip(prioridade: string): string {
    const preview = computeTicketSlaPreview(
      prioridade,
      this.ticket.ambiente,
      this.ticket.categoria
    );
    if (!preview) {
      return this.getSLAInfo(prioridade);
    }
    return formatSlaPreviewLine(
      preview.primeiraRespostaMinutos,
      preview.resolucaoMinutos,
      this.i18n
    );
  }

  atualizarSlaPreview() {
    if (!this.ticket.prioridade) {
      this.slaPreview = null;
      return;
    }
    this.slaPreview = computeTicketSlaPreview(
      this.ticket.prioridade,
      this.ticket.ambiente,
      this.ticket.categoria
    );
    this.ticketService
      .previewSla(this.ticket.prioridade, this.ticket.ambiente, this.ticket.categoria)
      .subscribe({
        next: (preview) => (this.slaPreview = preview),
        error: () => {
          /* mantém cálculo local */
        }
      });
  }

  private carregarUsuarioLogado() {
    // Preencher dados do usuário logado no ticket
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.ticket.usuarioId = user.id;
        this.ticket.usuarioNome = user.nome;
        this.ticket.usuarioEmail = user.email;
      }
    });
  }

  detectarInfoSistema() {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) this.ticket.navegador = 'Google Chrome';
    else if (ua.includes('Firefox')) this.ticket.navegador = 'Mozilla Firefox';
    else if (ua.includes('Safari')) this.ticket.navegador = 'Safari';
    else if (ua.includes('Edge')) this.ticket.navegador = 'Microsoft Edge';
    else this.ticket.navegador = 'Outro';

    if (ua.includes('Windows')) this.ticket.sistemaOperacional = 'Windows';
    else if (ua.includes('Mac')) this.ticket.sistemaOperacional = 'macOS';
    else if (ua.includes('Linux')) this.ticket.sistemaOperacional = 'Linux';
    else this.ticket.sistemaOperacional = 'Outro';
  }

  getSLAInfo(prioridade: string): string {
    switch (prioridade) {
      case 'CRITICA': return this.i18n.translate('suporte.ticketNew.sla.critical');
      case 'ALTA': return this.i18n.translate('suporte.ticketNew.sla.high');
      case 'MEDIA': return this.i18n.translate('suporte.ticketNew.sla.medium');
      case 'BAIXA': return this.i18n.translate('suporte.ticketNew.sla.low');
      default: return '';
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    if (event.dataTransfer?.files) {
      this.addFiles(event.dataTransfer.files);
    }
  }

  onFilesSelected(event: any) {
    if (event.target.files) {
      this.addFiles(event.target.files);
    }
  }

  private addFiles(files: FileList) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size <= 10 * 1024 * 1024) {
        if (!this.arquivosSelecionados.some(f => f.name === file.name)) {
          this.arquivosSelecionados.push(file);
        }
      } else {
        this.i18n.addToast(this.messageService, 'warn', 'suporte.ticketNew.toast.fileTooLargeSummary', 'suporte.ticketNew.toast.fileTooLargeDetail', {
          nome: file.name
        });
      }
    }
  }

  removerArquivo(index: number) {
    this.arquivosSelecionados.splice(index, 1);
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

  enviarChamado() {
    if (!this.isFormValid) {
      this.i18n.addToast(this.messageService, 'warn', 'suporte.ticketNew.toast.requiredSummary', 'suporte.ticketNew.toast.requiredDetail');
      return;
    }

    this.enviando = true;

    this.ticketService.create(this.ticket).subscribe({
      next: (ticketCriado) => {
        if (this.arquivosSelecionados.length > 0) {
          this.uploadArquivos(ticketCriado.id!);
        } else {
          this.finalizarEnvio(ticketCriado);
        }
      },
      error: (error) => {
        this.enviando = false;
        console.error('Failed to create ticket:', error);
        this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'suporte.ticketNew.toast.createError');
      }
    });
  }

  private uploadArquivos(ticketId: number) {
    const uploads = this.arquivosSelecionados.map(file => 
      this.ticketService.uploadAttachment(
        ticketId, 
        file, 
        undefined, 
        file.type.startsWith('image/') ? 'SCREENSHOT' : 'DOCUMENTO'
      ).toPromise()
    );

    Promise.all(uploads)
      .then(() => {
        this.ticketService.getById(ticketId).subscribe(ticket => {
          this.finalizarEnvio(ticket);
        });
      })
      .catch(() => {
        this.i18n.addToast(this.messageService, 'warn', 'suporte.ticketNew.toast.attachWarnSummary', 'suporte.ticketNew.toast.attachWarnDetail');
        this.router.navigate(['/suporte/chamados', ticketId]);
      });
  }

  private finalizarEnvio(ticket: Ticket) {
    this.enviando = false;
    this.i18n.addToast(this.messageService, 'success', 'suporte.ticketNew.toast.createdSummary', 'suporte.ticketNew.toast.createdDetail', {
      numero: String(ticket.numero ?? '')
    });
    
    setTimeout(() => {
      this.router.navigate(['/suporte/chamados', ticket.id]);
    }, 1500);
  }

  cancelar() {
    this.router.navigate(['/suporte']);
  }
}
