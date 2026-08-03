import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { FileUploadModule } from 'primeng/fileupload';
import { Conversa, Mensagem, ChatService } from '../core/chat.service';
import { TranslatePipe } from '../core/translate.pipe';
import { TranslationService } from '../core/translation.service';
import {
  formatChatMessageDaySeparator,
  formatChatMessageTime
} from './chat-date.util';

@Component({
  selector: 'app-chat-conversa',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ButtonModule, 
    InputTextareaModule, 
    AvatarModule, 
    TooltipModule,
    FileUploadModule,
    TranslatePipe
  ],
  template: `
    <div class="chat-conversa" [class.popup-mode]="isPopup">
      <!-- Área de Mensagens com Scroll -->
      <div class="mensagens-container" #messagesContainer (scroll)="onScroll()">
        <div class="mensagens-list">
          <!-- Espaço inicial para melhor visualização -->
          <div class="mensagens-spacer"></div>
          
          <div class="mensagem-wrapper" 
               *ngFor="let mensagem of mensagens; let i = index"
               [class.minha]="mensagem.remetenteId === usuarioId"
               [class.sistema]="mensagem.tipo === 'SISTEMA'">
            
            <!-- Separador de data -->
            <div class="data-separator" *ngIf="mostrarSeparadorData(i)">
              <span>{{ formatarDataSeparador(mensagem.dataEnvio) }}</span>
            </div>

            <!-- Mensagem -->
            <div class="mensagem" [class.minha]="mensagem.remetenteId === usuarioId">
              <!-- Avatar (apenas para mensagens de outros) -->
              <p-avatar *ngIf="mensagem.remetenteId !== usuarioId && mensagem.tipo !== 'SISTEMA'"
                        [label]="avatarInitial(mensagem.remetenteNome)"
                        [style]="{'background-color': '#64748b', 'color': 'white'}"
                        shape="circle" size="normal"
                        class="msg-avatar">
              </p-avatar>

              <div class="mensagem-content">
                <!-- Nome do remetente (grupos) -->
                <span class="remetente-nome" 
                      *ngIf="conversa.tipo === 'GRUPO' && mensagem.remetenteId !== usuarioId && mensagem.tipo !== 'SISTEMA'">
                  {{ mensagem.remetenteNome }}
                </span>

                <!-- Conteúdo -->
                <div class="mensagem-body">
                  <!-- Texto -->
                  <p class="texto" *ngIf="mensagem.conteudo">{{ mensagem.conteudo }}</p>

                  <!-- Anexos -->
                  <div class="anexos" *ngIf="mensagem.anexos && mensagem.anexos.length > 0">
                    <div class="anexo" *ngFor="let anexo of mensagem.anexos">
                      <!-- Imagem -->
                      <img *ngIf="chatService.isImagem(anexo.tipoArquivo)"
                           [src]="chatService.getDownloadUrl(anexo)"
                           [alt]="anexo.nomeOriginal"
                           class="anexo-imagem"
                           (click)="abrirAnexo(anexo)">
                      
                      <!-- Arquivo -->
                      <a *ngIf="!chatService.isImagem(anexo.tipoArquivo)"
                         [href]="chatService.getDownloadUrl(anexo)"
                         target="_blank"
                         class="anexo-arquivo">
                        <i [class]="chatService.getIconeArquivo(anexo.tipoArquivo)"></i>
                        <div class="anexo-info">
                          <span class="anexo-nome">{{ anexo.nomeOriginal }}</span>
                          <span class="anexo-tamanho">{{ chatService.formatarTamanhoArquivo(anexo.tamanhoBytes) }}</span>
                        </div>
                        <i class="pi pi-download"></i>
                      </a>
                    </div>
                  </div>

                  <!-- Hora -->
                  <span class="hora">
                    {{ formatarHora(mensagem.dataEnvio) }}
                    <i *ngIf="mensagem.editada" class="pi pi-pencil" pTooltip="Editada"></i>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Botão de scroll para baixo -->
      <button class="scroll-to-bottom" 
              *ngIf="showScrollButton"
              (click)="scrollToBottomClick()">
        <i class="pi pi-chevron-down"></i>
      </button>

      <!-- Input de Mensagem - SEMPRE VISÍVEL -->
      <div class="input-container">
        <!-- Preview de arquivo -->
        <div class="arquivo-preview" *ngIf="arquivoSelecionado">
          <div class="preview-info">
            <i [class]="chatService.getIconeArquivo(arquivoSelecionado.type)"></i>
            <span>{{ arquivoSelecionado.name }}</span>
            <small>{{ chatService.formatarTamanhoArquivo(arquivoSelecionado.size) }}</small>
          </div>
          <button pButton type="button" icon="pi pi-times" 
                  class="p-button-text p-button-rounded p-button-danger"
                  (click)="removerArquivo()"></button>
        </div>

        <div class="input-row">
          <!-- Botão de anexo -->
          <input type="file" #fileInput hidden (change)="onFileSelected($event)">
          <button pButton type="button" icon="pi pi-paperclip" 
                  class="p-button-text p-button-rounded btn-anexo"
                  pTooltip="Anexar arquivo"
                  (click)="fileInput.click()"></button>

          <!-- Textarea -->
          <textarea pInputTextarea 
                    [(ngModel)]="novaMensagem"
                    [placeholder]="'chat.typeMessage' | translate"
                    [rows]="1"
                    [autoResize]="true"
                    (keydown.enter)="onEnterPress($event)"
                    class="mensagem-input">
          </textarea>

          <!-- Botão de enviar -->
          <button pButton type="button" icon="pi pi-send" 
                  class="p-button-rounded btn-enviar"
                  [disabled]="!podeEnviar"
                  (click)="enviar()"></button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
      overflow: hidden;
    }

    .chat-conversa {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
      max-height: 100%;
      background: white;
      position: relative;
      overflow: hidden;

      /* Modo popup - tema escuro */
      &.popup-mode {
        background: #0b141a;

        .mensagens-container {
          background: #0b141a;
          background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="p" patternUnits="userSpaceOnUse" width="20" height="20"><circle cx="10" cy="10" r="1" fill="%23182229" opacity="0.5"/></pattern></defs><rect fill="url(%23p)" width="100" height="100"/></svg>');
        }

        .data-separator span {
          background: rgba(17, 27, 33, 0.95);
          color: #8696a0;
        }

        .mensagem-body {
          background: #202c33 !important;
          .texto { color: #e9edef !important; }
          .hora { color: #8696a0 !important; }
        }

        .mensagem.minha .mensagem-body {
          background: #005c4b !important;
          .texto { color: #e9edef !important; }
          .hora { color: rgba(255,255,255,0.6) !important; }
        }

        .input-container {
          background: #202c33;
          border-top: 1px solid #222d34;
        }

        .arquivo-preview {
          background: #182229;
          span, small { color: #e9edef; }
        }

        .mensagem-input {
          background: #2a3942 !important;
          color: #e9edef !important;
          border: none !important;

          &::placeholder { color: #8696a0; }
        }

        .btn-anexo {
          color: #8696a0 !important;
          &:hover { color: #00a884 !important; background: rgba(0, 168, 132, 0.1) !important; }
        }

        .btn-enviar {
          background: #00a884 !important;
          border: none !important;
          &:disabled { background: #3b4a54 !important; }
        }

        .scroll-to-bottom {
          background: #202c33;
          color: #8696a0;
          border-color: #374045;
          &:hover { background: #2a3942; color: #00a884; }
        }

        .anexo-arquivo {
          background: #182229 !important;
          color: #e9edef !important;
          .anexo-tamanho { color: #8696a0 !important; }
        }
      }
    }

    .mensagens-container {
      flex: 1 1 0;
      min-height: 0;
      max-height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 16px;
      background: #f8fafc;
      scroll-behavior: smooth;

      &::-webkit-scrollbar { width: 6px; }
      &::-webkit-scrollbar-track { background: transparent; }
      &::-webkit-scrollbar-thumb { 
        background: #cbd5e1; 
        border-radius: 3px;
        &:hover { background: #94a3b8; }
      }
    }

    .mensagens-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-height: 100%;
    }

    .mensagens-spacer {
      flex: 1;
      min-height: 20px;
    }

    .data-separator {
      text-align: center;
      margin: 12px 0;
      position: sticky;
      top: 0;
      z-index: 1;

      span {
        background: #e2e8f0;
        color: #64748b;
        font-size: 11px;
        padding: 5px 14px;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
    }

    .mensagem-wrapper {
      display: flex;
      flex-direction: column;
      padding: 2px 0;

      &.minha {
        align-items: flex-end;
      }

      &.sistema {
        align-items: center;
        
        .mensagem {
          background: #fef3c7;
          border-radius: 8px;
          
          .texto { color: #92400e; font-style: italic; }
        }
      }
    }

    .mensagem {
      display: flex;
      gap: 8px;
      max-width: 70%;

      @media (max-width: 768px) { max-width: 85%; }

      .msg-avatar {
        flex-shrink: 0;
        align-self: flex-end;
      }

      .mensagem-content {
        display: flex;
        flex-direction: column;
        gap: 2px;
        max-width: 100%;
      }

      .remetente-nome {
        font-size: 12px;
        font-weight: 600;
        color: #0ea5e9;
        margin-left: 12px;
      }

      .mensagem-body {
        background: white;
        padding: 8px 12px;
        border-radius: 12px;
        border-top-left-radius: 4px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.08);

        .texto {
          margin: 0;
          font-size: 14px;
          color: #0f172a;
          line-height: 1.45;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .hora {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: #94a3b8;
          margin-top: 4px;
          justify-content: flex-end;

          i { font-size: 10px; }
        }
      }

      &.minha {
        flex-direction: row-reverse;

        .mensagem-body {
          background: #0ea5e9;
          border-radius: 12px;
          border-top-right-radius: 4px;

          .texto { color: white; }
          .hora { color: rgba(255,255,255,0.8); }
        }
      }
    }

    .anexos {
      margin-top: 8px;
    }

    .anexo-imagem {
      max-width: 250px;
      max-height: 200px;
      border-radius: 8px;
      cursor: pointer;
      transition: transform 0.2s;

      &:hover { transform: scale(1.02); }
    }

    .anexo-arquivo {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      background: #f1f5f9;
      border-radius: 8px;
      text-decoration: none;
      color: #0f172a;
      transition:
        background-color var(--as-duration-normal, 200ms) var(--as-ease-out, ease),
        border-color var(--as-duration-normal, 200ms) var(--as-ease-out, ease),
        box-shadow var(--as-duration-normal, 200ms) var(--as-ease-out, ease),
        color var(--as-duration-fast, 120ms) var(--as-ease-out, ease),
        transform var(--as-duration-normal, 200ms) var(--as-ease-out, ease);

      &:hover { background: #e2e8f0; }

      > i:first-child {
        font-size: 24px;
        color: #0ea5e9;
      }

      .anexo-info {
        flex: 1;
        display: flex;
        flex-direction: column;

        .anexo-nome {
          font-size: 13px;
          font-weight: 500;
        }

        .anexo-tamanho {
          font-size: 11px;
          color: #64748b;
        }
      }

      > i:last-child {
        color: #64748b;
      }
    }

    .minha .anexo-arquivo {
      background: rgba(255,255,255,0.2);
      color: white;

      > i { color: white; }
      .anexo-tamanho { color: rgba(255,255,255,0.8); }
    }

    /* Botão de scroll para baixo */
    .scroll-to-bottom {
      position: absolute;
      bottom: 80px;
      right: 20px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: white;
      border: 1px solid #e2e8f0;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      transition:
        background-color var(--as-duration-normal, 200ms) var(--as-ease-out, ease),
        border-color var(--as-duration-normal, 200ms) var(--as-ease-out, ease),
        box-shadow var(--as-duration-normal, 200ms) var(--as-ease-out, ease),
        color var(--as-duration-fast, 120ms) var(--as-ease-out, ease),
        transform var(--as-duration-normal, 200ms) var(--as-ease-out, ease);
      z-index: 10;

      &:hover {
        background: #f1f5f9;
        color: #0ea5e9;
        transform: scale(1.1);
      }

      i {
        font-size: 18px;
      }
    }

    /* Input de mensagem - SEMPRE VISÍVEL */
    .input-container {
      flex-shrink: 0;
      padding: 12px 16px;
      background: white;
      border-top: 1px solid #e2e8f0;
    }

    .arquivo-preview {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background: #f1f5f9;
      border-radius: 8px;
      margin-bottom: 8px;

      .preview-info {
        display: flex;
        align-items: center;
        gap: 8px;

        i { color: #0ea5e9; font-size: 20px; }
        span { font-size: 13px; font-weight: 500; }
        small { font-size: 11px; color: #64748b; }
      }
    }

    .input-row {
      display: flex;
      align-items: flex-end;
      gap: 8px;

      .btn-anexo {
        flex-shrink: 0;
        width: 40px;
        height: 40px;
        color: #64748b;

        &:hover {
          color: #0ea5e9;
          background: rgba(14, 165, 233, 0.1);
        }
      }

      .mensagem-input {
        flex: 1;
        min-width: 0;
        resize: none;
        border-radius: 20px;
        padding: 10px 16px;
        max-height: 120px;
        min-height: 40px;
        border: 1px solid #e2e8f0;
        font-size: 14px;
        line-height: 1.4;

        &:focus {
          outline: none;
          border-color: #0ea5e9;
          box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.2);
        }
      }

      .btn-enviar {
        flex-shrink: 0;
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
        border: none;
        
        &:disabled {
          background: #cbd5e1;
          opacity: 1;
        }
      }
    }
  `]
})
export class ChatConversaComponent implements AfterViewChecked, OnChanges {
  @Input() conversa!: Conversa;
  @Input() mensagens: Mensagem[] = [];
  @Input() usuarioId: number = 0;
  @Input() isPopup: boolean = false;
  @Output() voltar = new EventEmitter<void>();
  @Output() mensagemEnviada = new EventEmitter<string>();
  @Output() arquivoEnviado = new EventEmitter<{ conteudo: string; arquivo: File }>();

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  chatService!: ChatService;
  private i18n = inject(TranslationService);
  novaMensagem = '';
  arquivoSelecionado: File | null = null;
  showScrollButton = false;
  private shouldScroll = true;
  private isUserNearBottom = true;
  private lastMessageCount = 0;
  private isFirstLoad = true;

  constructor(chatService: ChatService) {
    this.chatService = chatService;
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // Só faz scroll automático se:
    // 1. É o primeiro carregamento da conversa OU
    // 2. Chegaram novas mensagens E o usuário está perto do final
    if (changes['mensagens']) {
      const currentMessages = changes['mensagens'].currentValue as Mensagem[];
      const previousMessages = changes['mensagens'].previousValue as Mensagem[];
      
      const currentCount = currentMessages?.length || 0;
      const previousCount = previousMessages?.length || 0;
      
      // Primeiro carregamento ou mudança de conversa
      if (this.isFirstLoad || !previousMessages) {
        this.shouldScroll = true;
        this.isFirstLoad = false;
        this.lastMessageCount = currentCount;
        return;
      }
      
      // Novas mensagens chegaram
      if (currentCount > previousCount) {
        // Só faz scroll se o usuário estiver perto do final
        if (this.isUserNearBottom) {
          this.shouldScroll = true;
        } else {
          // Usuário está vendo mensagens antigas - apenas mostrar botão
          this.showScrollButton = true;
        }
        this.lastMessageCount = currentCount;
      }
    }
    
    // Se mudou de conversa, resetar e fazer scroll
    if (changes['conversa'] && !changes['conversa'].firstChange) {
      this.isFirstLoad = true;
      this.shouldScroll = true;
      this.isUserNearBottom = true;
    }
  }

  scrollToBottom() {
    try {
      const container = this.messagesContainer?.nativeElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
        this.showScrollButton = false;
        this.isUserNearBottom = true;
      }
    } catch (err) {}
  }

  onScroll() {
    try {
      const container = this.messagesContainer?.nativeElement;
      if (container) {
        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
        this.isUserNearBottom = distanceFromBottom < 100;
        this.showScrollButton = !this.isUserNearBottom;
      }
    } catch (err) {}
  }

  scrollToBottomClick() {
    this.scrollToBottom();
  }

  get podeEnviar(): boolean {
    return !!(this.novaMensagem.trim() || this.arquivoSelecionado);
  }

  enviar() {
    if (!this.podeEnviar) return;

    if (this.arquivoSelecionado) {
      this.arquivoEnviado.emit({
        conteudo: this.novaMensagem.trim(),
        arquivo: this.arquivoSelecionado
      });
      this.arquivoSelecionado = null;
    } else {
      this.mensagemEnviada.emit(this.novaMensagem.trim());
    }
    
    this.novaMensagem = '';
    this.shouldScroll = true;
  }

  onEnterPress(event: KeyboardEvent) {
    if (!event.shiftKey) {
      event.preventDefault();
      this.enviar();
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.arquivoSelecionado = input.files[0];
    }
    input.value = '';
  }

  removerArquivo() {
    this.arquivoSelecionado = null;
  }

  abrirAnexo(anexo: any) {
    window.open(this.chatService.getDownloadUrl(anexo), '_blank');
  }

  avatarInitial(nome?: string | null): string {
    const trimmed = nome?.trim();
    if (trimmed) return trimmed.charAt(0).toUpperCase();
    return this.i18n.translate('chat.avatar.fallbackInitial');
  }

  getIniciais(): string {
    const nome = this.conversa.nome || this.i18n.translate('chat.layout.defaultConversationName');
    return nome.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
  }

  getCorAvatar(): string {
    const cores = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];
    return cores[this.conversa.id % cores.length];
  }

  mostrarSeparadorData(index: number): boolean {
    if (index === 0) return true;
    
    const msgAtual = this.mensagens[index];
    const msgAnterior = this.mensagens[index - 1];
    
    const dataAtual = new Date(msgAtual.dataEnvio).toDateString();
    const dataAnterior = new Date(msgAnterior.dataEnvio).toDateString();
    
    return dataAtual !== dataAnterior;
  }

  formatarDataSeparador(dataStr: string): string {
    return formatChatMessageDaySeparator(dataStr, this.i18n);
  }

  formatarHora(dataStr: string): string {
    return formatChatMessageTime(dataStr, this.i18n);
  }
}
