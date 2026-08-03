import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';
import { ChatService, Conversa, Mensagem, ParticipanteResumo } from '../core/chat.service';
import { AuthService, User } from '../auth/auth.service';
import { ChatListaComponent } from './chat-lista.component';
import { ChatConversaComponent } from './chat-conversa.component';
import { ChatUsuarioBuscaComponent } from './chat-usuario-busca.component';
import { ChatNotificationComponent } from '../shared/chat-notification/chat-notification.component';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { TranslatePipe } from '../core/translate.pipe';
import { BrandStackComponent } from '../shared/brand-stack/brand-stack.component';
import { RouteLoadingBarComponent } from '../shared/route-loading-bar/route-loading-bar.component';
import { TranslationService } from '../core/translation.service';
import { toastKey } from '../core/toast-i18n.util';
import { formatChatConversationDate } from './chat-date.util';

@Component({
  selector: 'app-chat-layout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterOutlet,
    DialogModule,
    ButtonModule,
    ToastModule,
    TooltipModule,
    AvatarModule,
    BadgeModule,
    ProgressSpinnerModule,
    ChatListaComponent,
    ChatConversaComponent,
    ChatUsuarioBuscaComponent,
    ChatNotificationComponent,
    TranslatePipe,
    BrandStackComponent,
    RouteLoadingBarComponent
  ],
  template: `
    <p-toast></p-toast>
    
    <div class="chat-container" [class.is-popup]="isPopup">
      <app-route-loading-bar></app-route-loading-bar>
      <!-- Header Principal com Logo -->
      <div class="chat-header">
        <div class="header-left">
          <div class="header-brand">
            <app-brand-stack surface="dark" size="chat" />
            <span class="brand-subtitle">{{ 'chat.brand.subtitle' | translate }}</span>
          </div>
        </div>
        <div class="header-right">
          <span class="user-info" *ngIf="currentUser">
            <i class="pi pi-user"></i>
            {{ currentUser.nome }}
          </span>
          <button pButton type="button" 
                  icon="pi pi-external-link" 
                  class="p-button-text header-btn"
                  [pTooltip]="'chat.tooltip.openMain' | translate"
                  tooltipPosition="bottom"
                  (click)="abrirSistema()"
                  *ngIf="isPopup">
          </button>
          <button pButton type="button" 
                  icon="pi pi-home" 
                  [label]="'chat.btn.backToSystem' | translate"
                  class="p-button-sm chat-back-btn"
                  (click)="voltarAoSistema()"
                  *ngIf="!isPopup">
          </button>
          <button pButton type="button" 
                  icon="pi pi-times" 
                  class="p-button-text header-btn btn-close"
                  [pTooltip]="'chat.tooltip.close' | translate"
                  tooltipPosition="bottom"
                  (click)="fecharChat()"
                  *ngIf="isPopup">
          </button>
        </div>
      </div>

      <div class="chat-body">
        <!-- Painel de Conversas (estilo WhatsApp) -->
        <div class="contacts-panel" [class.hidden-mobile]="conversaAtual && isMobile">
          
          <!-- Header da lista de conversas -->
          <div class="contacts-header">
            <span class="title">{{ 'chat.layout.conversations' | translate }}</span>
            <button pButton type="button" icon="pi pi-user-plus" 
                    class="p-button-rounded p-button-text btn-new"
                    [pTooltip]="'chat.layout.tooltip.newConversation' | translate"
                    [attr.aria-label]="'chat.layout.tooltip.newConversation' | translate"
                    (click)="abrirBuscaUsuario()"></button>
          </div>

          <!-- Busca -->
          <div class="contacts-search">
            <div class="search-input-wrapper">
              <i class="pi pi-search"></i>
              <input type="text" [placeholder]="'chat.layout.searchPlaceholder' | translate" 
                     [(ngModel)]="termoBusca" (input)="filtrarConversas()">
            </div>
          </div>

          <!-- Carregando conversas -->
          <div class="contacts-loading" *ngIf="carregando && conversas.length === 0">
            <p-progressSpinner [style]="{width: '36px', height: '36px'}" strokeWidth="4"></p-progressSpinner>
            <span>{{ 'ui.loading' | translate }}</span>
          </div>

          <!-- PRIMEIRO ACESSO - Sem conversas -->
          <div class="first-access" *ngIf="conversas.length === 0 && !carregando">
            <div class="first-access-content">
              <div class="icon-wrapper">
                <i class="pi pi-comments"></i>
              </div>
              <h3>{{ 'chat.layout.welcome.title' | translate }}</h3>
              <p>{{ 'chat.layout.welcome.noConversations' | translate }}</p>
              <p class="hint">{{ 'chat.layout.welcome.hint' | translate }}</p>
              <button pButton type="button" 
                      [label]="'chat.layout.btn.startConversationLong' | translate" 
                      icon="pi pi-user-plus"
                      class="p-button-lg btn-start-chat"
                      (click)="abrirBuscaUsuario()">
              </button>
            </div>
          </div>

          <!-- Lista de Contatos/Conversas -->
          <div class="contacts-list" *ngIf="conversas.length > 0">
            <div class="contact-item" 
                 *ngFor="let conversa of conversasFiltradas"
                 [class.active]="conversaAtual?.id === conversa.id"
                 [class.unread]="conversa.naoLidas > 0"
                 (click)="selecionarConversa(conversa)">
              
              <!-- Avatar do Contato -->
              <div class="contact-avatar">
                <p-avatar *ngIf="conversa.tipo === 'GRUPO'"
                          icon="pi pi-users" 
                          [style]="{'background-color': '#00a884', 'color': 'white'}"
                          shape="circle" size="large">
                </p-avatar>
                <p-avatar *ngIf="conversa.tipo === 'DIRETA'"
                          [label]="getIniciais(conversa)"
                          [style]="{'background-color': getCorAvatar(conversa), 'color': 'white'}"
                          shape="circle" size="large">
                </p-avatar>
              </div>

              <!-- Info do Contato -->
              <div class="contact-info">
                <div class="contact-header">
                  <span class="contact-name">{{ conversa.nome || ('chat.layout.defaultConversationName' | translate) }}</span>
                  <span class="contact-time" [class.unread]="conversa.naoLidas > 0">
                    {{ formatarData(conversa.ultimaMensagem?.dataEnvio || conversa.dataAtualizacao) }}
                  </span>
                </div>
                <div class="contact-preview">
                  <span class="preview-text">
                    <i class="pi pi-check-circle sent-icon" *ngIf="conversa.ultimaMensagem?.remetenteId === currentUser?.id"></i>
                    {{ getPreviewMensagem(conversa) }}
                  </span>
                  <span class="unread-badge" *ngIf="conversa.naoLidas > 0">
                    {{ conversa.naoLidas > 99 ? '99+' : conversa.naoLidas }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Nenhum resultado na busca -->
            <div class="no-results" *ngIf="conversasFiltradas.length === 0 && termoBusca">
              <i class="pi pi-search"></i>
              <p>{{ 'chat.layout.search.noResults' | translate:{ termo: termoBusca } }}</p>
              <button pButton type="button" [label]="'chat.layout.btn.searchUser' | translate" 
                      icon="pi pi-user-plus" class="p-button-text p-button-sm"
                      (click)="abrirBuscaUsuario()"></button>
            </div>
          </div>

          <!-- Botão flutuante para nova conversa -->
          <button pButton type="button" icon="pi pi-plus" 
                  class="fab-new-chat"
                  [pTooltip]="'chat.layout.tooltip.newChat' | translate"
                  [attr.aria-label]="'chat.layout.tooltip.newChat' | translate"
                  tooltipPosition="left"
                  (click)="abrirBuscaUsuario()"
                  *ngIf="conversas.length > 0">
          </button>
        </div>

        <!-- Área de Conversa -->
        <div class="conversation-panel" [class.hidden-mobile]="!conversaAtual && isMobile">
          <!-- Conversa selecionada -->
          <ng-container *ngIf="conversaAtual">
            <!-- Header da conversa -->
            <div class="conversation-header">
              <button pButton type="button" icon="pi pi-arrow-left" 
                      class="p-button-text btn-back"
                      (click)="voltarParaLista()">
              </button>
              
              <div class="conversation-contact" (click)="verInfoContato()">
                <p-avatar *ngIf="conversaAtual.tipo === 'GRUPO'"
                          icon="pi pi-users" 
                          [style]="{'background-color': '#00a884', 'color': 'white'}"
                          shape="circle">
                </p-avatar>
                <p-avatar *ngIf="conversaAtual.tipo === 'DIRETA'"
                          [label]="getIniciais(conversaAtual)"
                          [style]="{'background-color': getCorAvatar(conversaAtual), 'color': 'white'}"
                          shape="circle">
                </p-avatar>
                <div class="contact-details">
                  <span class="name">{{ conversaAtual.nome }}</span>
                  <span class="status">
                    {{ conversaAtual.tipo === 'GRUPO'
                      ? ('chat.layout.status.participants' | translate:{ count: conversaAtual.participantes?.length || 0 })
                      : ('chat.layout.status.online' | translate) }}
                  </span>
                </div>
              </div>

              <div class="conversation-actions">
                <button pButton type="button" icon="pi pi-search" 
                        class="p-button-text p-button-rounded"
                        [pTooltip]="'chat.layout.tooltip.searchInChat' | translate"></button>
                <button pButton type="button" icon="pi pi-ellipsis-v" 
                        class="p-button-text p-button-rounded"
                        [pTooltip]="'chat.layout.tooltip.options' | translate"></button>
              </div>
            </div>

            <!-- Mensagens -->
            <app-chat-conversa
              [conversa]="conversaAtual"
              [mensagens]="mensagens"
              [usuarioId]="currentUser?.id || 0"
              [isPopup]="isPopup"
              (voltar)="voltarParaLista()"
              (mensagemEnviada)="onMensagemEnviada($event)"
              (arquivoEnviado)="onArquivoEnviado($event)">
            </app-chat-conversa>
          </ng-container>

          <!-- Tela inicial (sem conversa selecionada) -->
          <div class="welcome-screen" *ngIf="!conversaAtual">
            <div class="welcome-content">
              <div class="welcome-illustration">
                <div class="phone-mockup">
                  <div class="phone-screen">
                    <i class="pi pi-comments"></i>
                  </div>
                </div>
              </div>
              <h1>{{ 'chat.layout.empty.title' | translate }}</h1>
              <p class="welcome-text" [innerHTML]="'chat.layout.empty.welcomeText' | translate"></p>
              
              <div class="welcome-features">
                <div class="feature-item">
                  <i class="pi pi-lock"></i>
                  <span>{{ 'chat.layout.feature.secure' | translate }}</span>
                </div>
                <div class="feature-item">
                  <i class="pi pi-file"></i>
                  <span>{{ 'chat.layout.feature.files' | translate }}</span>
                </div>
                <div class="feature-item">
                  <i class="pi pi-users"></i>
                  <span>{{ 'chat.layout.feature.groups' | translate }}</span>
                </div>
              </div>

              <div class="welcome-hint" *ngIf="conversas.length === 0">
                <i class="pi pi-arrow-left"></i>
                <span>{{ 'chat.layout.hint.startFirst' | translate }}</span>
              </div>

              <div class="welcome-hint" *ngIf="conversas.length > 0">
                <i class="pi pi-arrow-left"></i>
                <span>{{ 'chat.layout.hint.selectConversation' | translate }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de busca de usuário -->
    <app-chat-usuario-busca
      [(visible)]="showBuscaUsuario"
      [usuarioId]="currentUser?.id || 0"
      (usuarioSelecionado)="iniciarConversa($event)">
    </app-chat-usuario-busca>

    <!-- Mesmas notificações flutuantes do app principal (rota /chat não usa app-layout) -->
    <app-chat-notification></app-chat-notification>
  `,
  styles: [`
    .chat-container {
      position: relative;
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: #111b21;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    /* ========== HEADER ========== */
    .chat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px;
      background: #202c33;
      color: white;
      flex-shrink: 0;
      border-bottom: 1px solid #222d34;
    }

    .header-left {
      display: flex;
      align-items: center;
      min-width: 0;

      .header-brand {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      .brand-subtitle {
        font-size: 11px;
        color: #8696a0;
        letter-spacing: 0.5px;
        padding-left: calc(2.25rem + 0.65rem);
        line-height: 1.2;
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;

      .user-info {
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: rgba(0, 168, 132, 0.22);
        border-radius: 16px;
        margin-right: 8px;
        color: #e9edef;

        i { font-size: 14px; }
      }

      .header-btn {
        color: #aebac1;
        width: 36px;
        height: 36px;
        
        &:hover {
          background: rgba(134, 150, 160, 0.15);
          color: #e9edef;
        }

        &.btn-close:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }
      }

      .p-button-outlined {
        color: #00a884;
        border-color: #00a884;
        font-size: 12px;
        
        &:hover {
          background: rgba(0, 168, 132, 0.1);
        }
      }
    }

    /* ========== BODY ========== */
    .chat-body {
      display: flex;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    /* ========== CONTACTS PANEL ========== */
    .contacts-panel {
      width: 340px;
      background: #111b21;
      border-right: 1px solid #222d34;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      position: relative;

      &.hidden-mobile {
        @media (max-width: 768px) {
          display: none;
        }
      }
    }

    .contacts-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: #202c33;

      .title {
        font-size: 20px;
        font-weight: 700;
        color: #e9edef;
      }

      .btn-new {
        color: #aebac1;
        &:hover { 
          color: #00a884;
          background: rgba(0, 168, 132, 0.1);
        }
      }
    }

    .contacts-search {
      padding: 8px 12px;
      background: #111b21;

      .search-input-wrapper {
        position: relative;

        i {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #8696a0;
          font-size: 14px;
        }

        input {
          width: 100%;
          padding: 10px 12px 10px 40px;
          background: #202c33;
          border: none;
          border-radius: 8px;
          color: #e9edef;
          font-size: 14px;

          &::placeholder {
            color: #8696a0;
          }

          &:focus {
            outline: none;
            background: #2a3942;
          }
        }
      }
    }

    /* ========== FIRST ACCESS ========== */
    .contacts-loading {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 24px;
      color: #8696a0;

      span {
        font-size: 0.9rem;
      }
    }

    .first-access {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .first-access-content {
      text-align: center;
      max-width: 280px;

      .icon-wrapper {
        width: 100px;
        height: 100px;
        margin: 0 auto 20px;
        background: linear-gradient(135deg, #00a884 0%, #075e54 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;

        i {
          font-size: 48px;
          color: white;
        }
      }

      h3 {
        color: #e9edef;
        font-size: 18px;
        font-weight: 600;
        margin: 0 0 8px;
      }

      p {
        color: #aebac1;
        font-size: 14px;
        margin: 0 0 8px;
        line-height: 1.5;

        &.hint {
          font-size: 13px;
          color: #cbd5e1;
          margin-bottom: 20px;
        }
      }

      .btn-start-chat {
        background: linear-gradient(135deg, #00a884 0%, #075e54 100%);
        border: none;
        font-weight: 600;
        
        &:hover {
          background: linear-gradient(135deg, #00c49a 0%, #0a7d68 100%);
        }
      }
    }

    /* ========== CONTACTS LIST ========== */
    .contacts-list {
      flex: 1;
      overflow-y: auto;

      &::-webkit-scrollbar {
        width: 6px;
      }
      &::-webkit-scrollbar-thumb {
        background: #374045;
        border-radius: 3px;
      }
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 16px;
      cursor: pointer;
      transition: background 0.15s;

      &:hover {
        background: #202c33;
      }

      &.active {
        background: #2a3942;
      }

      &.unread {
        .contact-name {
          color: #e9edef;
          font-weight: 600;
        }
        .preview-text {
          color: #d1d7db;
          font-weight: 500;
        }
        .contact-time {
          color: #00a884;
        }
      }
    }

    .contact-avatar {
      flex-shrink: 0;
    }

    .contact-info {
      flex: 1;
      min-width: 0;
      border-bottom: 1px solid #222d34;
      padding-bottom: 12px;
    }

    .contact-item:last-child .contact-info {
      border-bottom: none;
    }

    .contact-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;

      .contact-name {
        font-size: 16px;
        color: #e9edef;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .contact-time {
        font-size: 12px;
        color: #8696a0;
        flex-shrink: 0;
        margin-left: 8px;
      }
    }

    .contact-preview {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .preview-text {
        font-size: 14px;
        color: #8696a0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 1;
        display: flex;
        align-items: center;
        gap: 4px;

        .sent-icon {
          font-size: 14px;
          color: #53bdeb;
        }
      }

      .unread-badge {
        background: #00a884;
        color: #111b21;
        font-size: 12px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 12px;
        min-width: 22px;
        text-align: center;
        margin-left: 8px;
      }
    }

    .no-results {
      padding: 40px 20px;
      text-align: center;
      color: #8696a0;

      i {
        font-size: 40px;
        color: #3b4a54;
        margin-bottom: 12px;
      }

      p {
        margin: 0 0 16px;
        font-size: 14px;
      }
    }

    /* ========== FAB BUTTON ========== */
    .fab-new-chat {
      position: absolute;
      bottom: 20px;
      right: 20px;
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: linear-gradient(135deg, #00a884 0%, #075e54 100%);
      border: none;
      color: white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      transition:
        background-color var(--as-duration-normal, 200ms) var(--as-ease-out, ease),
        border-color var(--as-duration-normal, 200ms) var(--as-ease-out, ease),
        box-shadow var(--as-duration-normal, 200ms) var(--as-ease-out, ease),
        color var(--as-duration-fast, 120ms) var(--as-ease-out, ease),
        transform var(--as-duration-normal, 200ms) var(--as-ease-out, ease);

      &:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 20px rgba(0, 168, 132, 0.4);
      }

      ::ng-deep .pi {
        font-size: 24px;
      }
    }

    /* ========== CONVERSATION PANEL ========== */
    .conversation-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #0b141a;
      min-height: 0;
      overflow: hidden;

      &.hidden-mobile {
        @media (max-width: 768px) {
          display: none;
        }
      }

      app-chat-conversa {
        flex: 1;
        min-height: 0;
        overflow: hidden;
      }
    }

    .conversation-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: #202c33;
      border-bottom: 1px solid #222d34;

      .btn-back {
        color: #aebac1;
        
        &:hover {
          color: #e9edef;
          background: rgba(134, 150, 160, 0.15);
        }
      }

      .conversation-contact {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 8px;
        transition: background 0.15s;

        &:hover {
          background: rgba(134, 150, 160, 0.1);
        }

        .contact-details {
          display: flex;
          flex-direction: column;

          .name {
            font-size: 16px;
            font-weight: 500;
            color: #e9edef;
          }

          .status {
            font-size: 13px;
            color: #00a884;
          }
        }
      }

      .conversation-actions {
        display: flex;
        gap: 4px;

        button {
          color: #aebac1;
          &:hover {
            color: #e9edef;
            background: rgba(134, 150, 160, 0.15);
          }
        }

        .btn-call {
          color: #00a884;
          
          &:hover {
            color: #00c49a;
            background: rgba(0, 168, 132, 0.15);
          }

          &:disabled {
            color: #3b4a54;
            cursor: not-allowed;
          }
        }
      }
    }

    /* ========== WELCOME SCREEN ========== */
    .welcome-screen {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(180deg, #222e35 0%, #111b21 100%);
    }

    .welcome-content {
      text-align: center;
      max-width: 500px;
      padding: 40px;

      .welcome-illustration {
        margin-bottom: 32px;

        .phone-mockup {
          width: 140px;
          height: 140px;
          margin: 0 auto;
          background: linear-gradient(135deg, #00a884 0%, #075e54 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 32px rgba(0, 168, 132, 0.3);

          .phone-screen {
            i {
              font-size: 64px;
              color: white;
            }
          }
        }
      }

      h1 {
        color: #e9edef;
        font-size: 32px;
        font-weight: 300;
        margin: 0 0 16px;
        letter-spacing: 2px;
      }

      .welcome-text {
        color: #8696a0;
        font-size: 15px;
        line-height: 1.6;
        margin: 0 0 32px;
      }

      .welcome-features {
        display: flex;
        justify-content: center;
        gap: 32px;
        margin-bottom: 40px;
        flex-wrap: wrap;

        .feature-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;

          i {
            font-size: 28px;
            color: #00a884;
          }

          span {
            font-size: 13px;
            color: #8696a0;
          }
        }
      }

      .welcome-hint {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 16px 24px;
        background: rgba(0, 168, 132, 0.1);
        border-radius: 12px;
        border: 1px solid rgba(0, 168, 132, 0.2);

        i {
          font-size: 20px;
          color: #00a884;
          animation: bounceLeft 1.5s infinite;
        }

        span {
          color: #00a884;
          font-size: 14px;
          font-weight: 500;
        }
      }

      @keyframes bounceLeft {
        0%, 100% { transform: translateX(0); }
        50% { transform: translateX(-8px); }
      }
    }

    /* ========== RESPONSIVE ========== */
    @media (max-width: 768px) {
      .contacts-panel {
        width: 100%;
      }

      .conversation-panel {
        position: absolute;
        top: 60px;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10;
      }

      .header-left .brand-subtitle {
        display: none;
      }

      .header-right .user-info {
        display: none;
      }

      .welcome-content {
        padding: 24px;

        h1 {
          font-size: 24px;
        }

        .welcome-features {
          gap: 16px;
        }
      }

      .conversation-header .btn-back {
        display: flex;
      }
    }
  `]
})
export class ChatLayoutComponent implements OnInit, OnDestroy {
  private chatService = inject(ChatService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private i18n = inject(TranslationService);
  private router = inject(Router);

  conversas: Conversa[] = [];
  conversasFiltradas: Conversa[] = [];
  conversaAtual: Conversa | null = null;
  mensagens: Mensagem[] = [];
  currentUser: User | null = null;
  showBuscaUsuario = false;
  isMobile = false;
  isPopup = false;
  termoBusca = '';
  carregando = true;

  ngOnInit() {
    // Detectar se está em janela popup
    this.isPopup = window.opener !== null || window.name === 'aerosuite-chat';
    
    // Configurar título da janela
    if (this.isPopup) {
      document.title = 'AEROSUITE CHAT';
    }

    this.checkMobile();
    window.addEventListener('resize', () => this.checkMobile());

    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.chatService.iniciarPolling(user.id);
      }
    });

    this.chatService.conversas$.subscribe(conversas => {
      this.conversas = conversas;
      this.filtrarConversas();
      this.carregando = false;
    });

    this.chatService.conversaAtual$.subscribe(conversa => {
      this.conversaAtual = conversa;
    });

    this.chatService.mensagens$.subscribe(mensagens => {
      this.mensagens = mensagens;
    });
  }

  ngOnDestroy() {
    this.chatService.pararPollingConversa();
    this.chatService.pararPolling();
  }

  checkMobile() {
    this.isMobile = window.innerWidth <= 768;
  }

  selecionarConversa(conversa: Conversa) {
    if (this.currentUser) {
      this.chatService.selecionarConversa(conversa, this.currentUser.id);
    }
  }

  voltarParaLista() {
    this.chatService.limparConversaAtual();
  }

  abrirBuscaUsuario() {
    this.showBuscaUsuario = true;
  }

  iniciarConversa(usuario: ParticipanteResumo) {
    if (!this.currentUser) return;

    this.chatService.criarConversa({
      tipo: 'DIRETA',
      participantesIds: [usuario.usuarioId]
    }, this.currentUser.id).subscribe({
      next: (conversa) => {
        this.showBuscaUsuario = false;
        this.selecionarConversa(conversa);
      },
      error: () => {
        toastKey(this.messageService, this.i18n, 'error', 'chat.toast.error', 'chat.toast.conversationStartFailed');
      }
    });
  }

  onMensagemEnviada(conteudo: string) {
    if (!this.currentUser || !this.conversaAtual) return;

    this.chatService.enviarMensagem(
      this.conversaAtual.id,
      this.currentUser.id,
      conteudo
    ).subscribe({
      next: () => {
        toastKey(this.messageService, this.i18n, 'success', 'chat.toast.sent', 'chat.toast.messageSent', undefined, 2000);
      },
      error: () => {
        toastKey(this.messageService, this.i18n, 'error', 'chat.toast.error', 'chat.toast.messageSendFailed');
      }
    });
  }

  onArquivoEnviado(event: { conteudo: string; arquivo: File }) {
    if (!this.currentUser || !this.conversaAtual) return;

    this.chatService.enviarMensagemComArquivo(
      this.conversaAtual.id,
      this.currentUser.id,
      event.conteudo,
      event.arquivo
    ).subscribe({
      next: () => {
        toastKey(this.messageService, this.i18n, 'success', 'chat.toast.sent', 'chat.toast.fileSent', undefined, 2000);
      },
      error: () => {
        toastKey(this.messageService, this.i18n, 'error', 'chat.toast.error', 'chat.toast.fileSendFailed');
      }
    });
  }

  // Voltar ao sistema (quando não está em popup)
  voltarAoSistema() {
    this.router.navigate(['/dashboard']);
  }

  // Abrir sistema em nova aba (quando está em popup)
  abrirSistema() {
    window.open('/', '_blank');
  }

  // Fechar janela do chat (quando está em popup)
  fecharChat() {
    if (this.isPopup) {
      window.close();
    }
  }

  // Filtrar conversas pela busca
  filtrarConversas() {
    if (!this.termoBusca.trim()) {
      this.conversasFiltradas = this.conversas;
    } else {
      const termo = this.termoBusca.toLowerCase();
      this.conversasFiltradas = this.conversas.filter(c => 
        c.nome?.toLowerCase().includes(termo) ||
        c.ultimaMensagem?.conteudo?.toLowerCase().includes(termo)
      );
    }
  }

  // Obter iniciais do nome para avatar
  getIniciais(conversa: Conversa): string {
    const nome = conversa.nome || this.i18n.translate('chat.layout.defaultConversationName');
    return nome.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
  }

  // Cor do avatar baseada no ID
  getCorAvatar(conversa: Conversa): string {
    const cores = ['#00a884', '#53bdeb', '#8b5cf6', '#ec4899', '#f59e0b', '#6366f1'];
    return cores[conversa.id % cores.length];
  }

  // Formatar data para exibição
  formatarData(dataStr: string | undefined): string {
    return formatChatConversationDate(dataStr, this.i18n);
  }

  // Preview da última mensagem
  getPreviewMensagem(conversa: Conversa): string {
    if (!conversa.ultimaMensagem) return this.i18n.translate('chat.preview.noMessage');
    
    const msg = conversa.ultimaMensagem;
    if (msg.tipo === 'ARQUIVO') {
      return this.i18n.translate('chat.preview.fileShort');
    }
    
    return (msg.conteudo || '').substring(0, 40) + (msg.conteudo && msg.conteudo.length > 40 ? '...' : '');
  }

  // Ver informações do contato
  verInfoContato() {
    // Placeholder para futuras funcionalidades
  }
}
