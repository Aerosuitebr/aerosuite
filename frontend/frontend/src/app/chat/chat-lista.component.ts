import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { BadgeModule } from 'primeng/badge';
import { AvatarModule } from 'primeng/avatar';
import { Conversa } from '../core/chat.service';
import { TranslatePipe } from '../core/translate.pipe';
import { TranslationService } from '../core/translation.service';
import { formatChatConversationDate } from './chat-date.util';

@Component({
  selector: 'app-chat-lista',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, BadgeModule, AvatarModule, TranslatePipe],
  template: `
    <div class="chat-lista">
      <!-- Busca -->
      <div class="search-box">
        <i class="pi pi-search"></i>
        <input type="text" pInputText 
               [(ngModel)]="termoBusca" 
               [placeholder]="'chat.list.searchPlaceholder' | translate"
               (input)="filtrar()">
      </div>

      <!-- Lista de conversas -->
      <div class="conversas-list">
        <div class="conversa-item" 
             *ngFor="let conversa of conversasFiltradas"
             [class.active]="conversaAtual?.id === conversa.id"
             [class.nao-lida]="conversa.naoLidas > 0"
             (click)="selecionar(conversa)">
          
          <!-- Avatar -->
          <div class="conversa-avatar">
            <p-avatar *ngIf="conversa.tipo === 'GRUPO'"
                      icon="pi pi-users" 
                      [style]="{'background-color': '#0ea5e9', 'color': 'white'}"
                      shape="circle" size="large">
            </p-avatar>
            <p-avatar *ngIf="conversa.tipo === 'DIRETA'"
                      [label]="getIniciais(conversa)"
                      [style]="{'background-color': getCorAvatar(conversa), 'color': 'white'}"
                      shape="circle" size="large">
            </p-avatar>
          </div>

          <!-- Info -->
          <div class="conversa-info">
            <div class="conversa-header">
              <span class="nome">{{ conversa.nome || ('chat.list.defaultName' | translate) }}</span>
              <span class="data">{{ formatarData(conversa.ultimaMensagem?.dataEnvio || conversa.dataAtualizacao) }}</span>
            </div>
            <div class="conversa-preview">
              <span class="preview-text">
                {{ getPreviewMensagem(conversa) }}
              </span>
              <span class="badge" *ngIf="conversa.naoLidas > 0">
                {{ conversa.naoLidas > 99 ? '99+' : conversa.naoLidas }}
              </span>
            </div>
          </div>
        </div>

        <!-- Estado vazio -->
        <div class="empty-list" *ngIf="conversasFiltradas.length === 0">
          <i class="pi pi-inbox"></i>
          <p>{{ (termoBusca ? 'chat.list.empty.search' : 'chat.list.empty.none') | translate }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-lista {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .search-box {
      padding: 12px 16px;
      position: relative;

      i {
        position: absolute;
        left: 28px;
        top: 50%;
        transform: translateY(-50%);
        color: #475569;
      }

      input {
        width: 100%;
        padding-left: 36px;
        border-radius: 20px;
        background: #f1f5f9;
        border: none;

        &:focus {
          background: white;
          box-shadow: 0 0 0 2px #0ea5e9;
        }
      }
    }

    .conversas-list {
      flex: 1;
      overflow-y: auto;
    }

    .conversa-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      cursor: pointer;
      transition:
        background-color var(--as-duration-normal, 200ms) var(--as-ease-out, ease),
        border-color var(--as-duration-normal, 200ms) var(--as-ease-out, ease),
        box-shadow var(--as-duration-normal, 200ms) var(--as-ease-out, ease),
        color var(--as-duration-fast, 120ms) var(--as-ease-out, ease),
        transform var(--as-duration-normal, 200ms) var(--as-ease-out, ease);
      border-bottom: 1px solid #f1f5f9;

      &:hover {
        background: #f8fafc;
      }

      &.active {
        background: #e0f2fe;
        border-left: 3px solid #0ea5e9;
      }

      &.nao-lida {
        background: #fefce8;

        .nome {
          font-weight: 600;
        }

        .preview-text {
          font-weight: 500;
          color: #0f172a;
        }
      }
    }

    .conversa-avatar {
      flex-shrink: 0;
    }

    .conversa-info {
      flex: 1;
      min-width: 0;
    }

    .conversa-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;

      .nome {
        font-size: 14px;
        font-weight: 500;
        color: #0f172a;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .data {
        font-size: 11px;
        color: #475569;
        flex-shrink: 0;
        margin-left: 8px;
      }
    }

    .conversa-preview {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .preview-text {
        font-size: 13px;
        color: #475569;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 1;
      }

      .badge {
        flex-shrink: 0;
        margin-left: 8px;
        background: #0ea5e9;
        color: white;
        font-size: 11px;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 10px;
        min-width: 20px;
        text-align: center;
      }
    }

    .empty-list {
      text-align: center;
      padding: 40px 20px;
      color: #94a3b8;

      i {
        font-size: 40px;
        margin-bottom: 12px;
        color: #cbd5e1;
      }

      p {
        margin: 0;
        font-size: 14px;
      }
    }
  `]
})
export class ChatListaComponent {
  private i18n = inject(TranslationService);

  @Input() conversas: Conversa[] = [];
  @Input() conversaAtual: Conversa | null = null;
  @Input() usuarioId: number = 0;
  @Output() conversaSelecionada = new EventEmitter<Conversa>();

  termoBusca = '';
  conversasFiltradas: Conversa[] = [];

  ngOnChanges() {
    this.filtrar();
  }

  filtrar() {
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

  selecionar(conversa: Conversa) {
    this.conversaSelecionada.emit(conversa);
  }

  getIniciais(conversa: Conversa): string {
    const nome = conversa.nome || this.i18n.translate('chat.layout.defaultConversationName');
    return nome.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
  }

  getCorAvatar(conversa: Conversa): string {
    const cores = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];
    return cores[conversa.id % cores.length];
  }

  getPreviewMensagem(conversa: Conversa): string {
    if (!conversa.ultimaMensagem) return this.i18n.translate('chat.preview.noMessage');
    
    const msg = conversa.ultimaMensagem;
    if (msg.tipo === 'ARQUIVO') {
      return this.i18n.translate('chat.preview.fileAttached');
    }
    
    const prefixo = msg.remetenteId === this.usuarioId ? this.i18n.translate('chat.preview.youPrefix') : '';
    return prefixo + (msg.conteudo || '').substring(0, 50);
  }

  formatarData(dataStr: string | undefined): string {
    return formatChatConversationDate(dataStr, this.i18n);
  }
}
