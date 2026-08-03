import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Subject, distinctUntilChanged, map, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { ChatService } from '../../core/chat.service';
import { AuthService } from '../../auth/auth.service';
import { TranslatePipe } from '../../core/translate.pipe';

@Component({
  selector: 'app-chat-icon',
  standalone: true,
  imports: [CommonModule, ButtonModule, BadgeModule, TooltipModule, TranslatePipe],
  template: `
    <div class="chat-icon-container" (click)="abrirChat()">
      <button 
        pButton 
        type="button" 
        icon="pi pi-comments" 
        class="p-button-text chat-btn"
        [class.has-messages]="contador > 0"
        [attr.aria-label]="'chat.icon.open' | translate"
        [pTooltip]="'chat.icon.open' | translate"
        tooltipPosition="bottom">
      </button>
      <span class="badge" *ngIf="contador > 0">
        {{ contador > 99 ? '99+' : contador }}
      </span>
    </div>
  `,
  styles: [`
    .chat-icon-container {
      position: relative;
      display: inline-flex;
      cursor: pointer;

      .chat-btn {
        color: #94a3b8;
        transition: color 0.2s ease, background-color 0.2s ease;

        &:hover {
          color: #0ea5e9;
          background: rgba(14, 165, 233, 0.1);
        }

        &.has-messages {
          color: #0ea5e9;
        }

        ::ng-deep .pi {
          font-size: 1.25rem;
        }
      }

      .badge {
        position: absolute;
        top: 2px;
        right: 2px;
        background: #ef4444;
        color: white;
        font-size: 10px;
        font-weight: 600;
        min-width: 18px;
        height: 18px;
        padding: 0 5px;
        border-radius: 9px;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
    }
  `]
})
export class ChatIconComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private chatService = inject(ChatService);
  private authService = inject(AuthService);

  contador = 0;
  private chatWindow: Window | null = null;
  private readonly destroy$ = new Subject<void>();

  ngOnInit() {
    this.authService.currentUser$.pipe(
      map((user) => user?.id ?? null),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((userId) => {
      if (userId != null) {
        this.chatService.iniciarPollingBadge(userId);
      }
    });

    this.chatService.contadorNaoLidas$.pipe(takeUntil(this.destroy$)).subscribe(count => {
      this.contador = count;
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  abrirChat() {
    // Verificar se a janela já está aberta
    if (this.chatWindow && !this.chatWindow.closed) {
      this.chatWindow.focus();
      return;
    }

    // Calcular posição e tamanho da janela (maior para caber a lista de contatos)
    const width = 900;
    const height = 700;
    const left = Math.max(0, (window.screen.width - width) / 2);
    const top = Math.max(0, (window.screen.height - height) / 2 - 50);

    // Obter a URL base correta (pode variar entre desenvolvimento e produção)
    const baseUrl = window.location.origin;
    const chatUrl = `${baseUrl}/chat`;

    // Abrir chat em nova janela popup
    this.chatWindow = window.open(
      chatUrl,
      'aerosuite-chat',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=no,toolbar=no,menubar=no,location=no`
    );

    // Fallback: se o popup for bloqueado, navegar na mesma janela
    if (!this.chatWindow || this.chatWindow.closed) {
      this.router.navigate(['/chat']);
    }
  }
}
