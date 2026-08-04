import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService, NovaMensagemNotificacao } from '../../core/chat.service';
import { Subscription } from 'rxjs';
import { TranslatePipe } from '../../core/translate.pipe';
import { buildChatPopupFeatures } from '../chat-popup.util';

interface NotificacaoVisivel extends NovaMensagemNotificacao {
  id: number;
  visible: boolean;
}

@Component({
  selector: 'app-chat-notification',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="chat-notifications-container">
      <div class="notification-item" 
           *ngFor="let notif of notificacoes"
           [class.show]="notif.visible"
           (click)="abrirChat(notif)">
        <div class="notification-icon">
          <i class="pi pi-comments"></i>
        </div>
        <div class="notification-content">
          <div class="notification-header">
            <span class="sender">{{ notif.remetenteNome }}</span>
            <span class="app-name">{{ 'chat.notification.newMessage' | translate }}</span>
          </div>
          <div class="notification-message">
            {{ notif.conteudo }}
          </div>
        </div>
        <button class="notification-close" (click)="fecharNotificacao(notif, $event)">
          <i class="pi pi-times"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .chat-notifications-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 12000;
      display: flex;
      flex-direction: column-reverse;
      gap: 10px;
      max-width: 380px;
      pointer-events: none;
    }

    .notification-item {
      position: relative;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px 18px;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      border-radius: 14px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(0, 168, 132, 0.35);
      cursor: pointer;
      pointer-events: all;
      transform: translateX(120%);
      opacity: 0;
      transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
      border-left: 5px solid #00a884;

      &.show {
        transform: translateX(0);
        opacity: 1;
        animation: chat-attention 0.65s ease-out;
      }

      &:hover {
        transform: translateX(-5px) scale(1.02);
        box-shadow: 0 16px 48px rgba(0, 168, 132, 0.45), 0 0 0 1px rgba(0, 168, 132, 0.5);
      }
    }

    @keyframes chat-attention {
      0% { filter: brightness(1.4); }
      30% { filter: brightness(1); transform: translateX(0) scale(1.03); }
      50% { transform: translateX(0) scale(1); }
      70% { transform: translateX(0) scale(1.02); }
      100% { transform: translateX(0) scale(1); }
    }

    .notification-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #00a884 0%, #075e54 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      i {
        font-size: 22px;
        color: white;
      }
    }

    .notification-content {
      flex: 1;
      min-width: 0;
    }

    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;

      .sender {
        font-size: 15px;
        font-weight: 600;
        color: #e9edef;
      }

      .app-name {
        font-size: 11px;
        color: #00a884;
        font-weight: 500;
      }
    }

    .notification-message {
      font-size: 13px;
      color: #8696a0;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .notification-close {
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
      flex-shrink: 0;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #e9edef;
      }

      i {
        font-size: 14px;
      }
    }

    /* Animação de entrada */
    @keyframes slideIn {
      from {
        transform: translateX(120%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    /* Som de notificação visual */
    .notification-item.show::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: 12px;
      animation: pulse-border 0.5s ease-out;
      pointer-events: none;
    }

    @keyframes pulse-border {
      0% {
        box-shadow: 0 0 0 0 rgba(0, 168, 132, 0.7);
      }
      100% {
        box-shadow: 0 0 0 15px rgba(0, 168, 132, 0);
      }
    }
  `]
})
export class ChatNotificationComponent implements OnInit, OnDestroy {
  private chatService = inject(ChatService);
  private subscription?: Subscription;
  private notifIdCounter = 0;
  private chatWindow: Window | null = null;

  notificacoes: NotificacaoVisivel[] = [];

  ngOnInit() {
    this.subscription = this.chatService.novaMensagem$.subscribe(notif => {
      this.mostrarNotificacao(notif);
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  mostrarNotificacao(notif: NovaMensagemNotificacao) {
    const notifVisivel: NotificacaoVisivel = {
      ...notif,
      id: ++this.notifIdCounter,
      visible: false
    };

    this.notificacoes.push(notifVisivel);

    // Limitar a 3 notificações visíveis
    if (this.notificacoes.length > 3) {
      this.notificacoes.shift();
    }

    // Animar entrada
    setTimeout(() => {
      notifVisivel.visible = true;
    }, 50);

    // Som é disparado em ChatService.emitirNotificacao (evita duplicar).

    // Auto-remover após 9 segundos (tempo para ler)
    setTimeout(() => {
      this.fecharNotificacao(notifVisivel);
    }, 9000);
  }

  fecharNotificacao(notif: NotificacaoVisivel, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    
    notif.visible = false;
    
    setTimeout(() => {
      const index = this.notificacoes.indexOf(notif);
      if (index > -1) {
        this.notificacoes.splice(index, 1);
      }
    }, 300);
  }

  abrirChat(notif: NotificacaoVisivel) {
    this.fecharNotificacao(notif);
    
    // Verificar se a janela do chat já está aberta
    if (this.chatWindow && !this.chatWindow.closed) {
      this.chatWindow.focus();
      return;
    }

    this.chatWindow = window.open(
      '/chat',
      'aerosuite-chat',
      buildChatPopupFeatures(window.screen)
    );
  }

}
