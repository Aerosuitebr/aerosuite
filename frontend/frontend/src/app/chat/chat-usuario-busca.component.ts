import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ChatService, ParticipanteResumo } from '../core/chat.service';
import { debounceTime, Subject } from 'rxjs';
import { TranslatePipe } from '../core/translate.pipe';

@Component({
  selector: 'app-chat-usuario-busca',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    InputTextModule,
    ButtonModule,
    AvatarModule,
    ProgressSpinnerModule,
    TranslatePipe
  ],
  template: `
    <p-dialog styleClass="as-hero-dialog chat-busca-dialog" [header]="'chat.newConversation' | translate" 
              [(visible)]="visible"
              (visibleChange)="visibleChange.emit($event)"
              [modal]="true"
              [style]="{width: '450px'}"
             >
      
      <div class="busca-container">
        <!-- Campo de busca -->
        <div class="search-box">
          <i class="pi pi-search"></i>
          <input type="text" pInputText 
                 [(ngModel)]="termoBusca" 
                 [placeholder]="'chat.searchUserByNameOrEmail' | translate"
                 (input)="onBuscar()">
        </div>

        <!-- Resultados -->
        <div class="resultados">
          <!-- Loading -->
          <div class="loading" *ngIf="buscando">
            <p-progressSpinner [style]="{width: '30px', height: '30px'}"></p-progressSpinner>
            <span>{{ 'chat.search.loading' | translate }}</span>
          </div>

          <!-- Lista de usuários -->
          <div class="usuarios-list" *ngIf="!buscando && usuarios.length > 0">
            <div class="usuario-item" 
                 *ngFor="let usuario of usuarios"
                 (click)="selecionar(usuario)">
              <p-avatar [label]="getIniciais(usuario.nome)"
                        [style]="{'background-color': getCorAvatar(usuario.usuarioId), 'color': 'white'}"
                        shape="circle" size="large">
              </p-avatar>
              <div class="usuario-info">
                <span class="nome">{{ usuario.nome }}</span>
                <span class="email">{{ usuario.email }}</span>
              </div>
              <i class="pi pi-chevron-right"></i>
            </div>
          </div>

          <!-- Estado vazio -->
          <div class="empty-state" *ngIf="!buscando && usuarios.length === 0 && termoBusca.length >= 2">
            <i class="pi pi-user-minus"></i>
            <p>{{ 'chat.search.noUsers' | translate }}</p>
          </div>

          <!-- Instrução inicial -->
          <div class="initial-state" *ngIf="!buscando && termoBusca.length < 2">
            <i class="pi pi-users"></i>
            <p>{{ 'chat.search.minChars' | translate }}</p>
          </div>
        </div>
      </div>
    </p-dialog>
  `,
  styles: [`
    .busca-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .search-box {
      position: relative;

      i {
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        color: #94a3b8;
      }

      input {
        width: 100%;
        padding-left: 40px;
        border-radius: 8px;
      }
    }

    .resultados {
      min-height: 200px;
      max-height: 350px;
      overflow-y: auto;
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      gap: 12px;
      color: #64748b;

      span { font-size: 14px; }
    }

    .usuarios-list {
      display: flex;
      flex-direction: column;
    }

    .usuario-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      cursor: pointer;
      border-radius: 8px;
      transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;

      &:hover {
        background: #f1f5f9;
      }

      .usuario-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;

        .nome {
          font-size: 14px;
          font-weight: 500;
          color: #0f172a;
        }

        .email {
          font-size: 12px;
          color: #64748b;
        }
      }

      > i:last-child {
        color: #cbd5e1;
      }
    }

    .empty-state, .initial-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      color: #94a3b8;
      text-align: center;

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
export class ChatUsuarioBuscaComponent {
  @Input() visible = false;
  @Input() usuarioId: number = 0;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() usuarioSelecionado = new EventEmitter<ParticipanteResumo>();

  private chatService = inject(ChatService);
  private buscarSubject = new Subject<string>();

  termoBusca = '';
  usuarios: ParticipanteResumo[] = [];
  buscando = false;

  constructor() {
    this.buscarSubject.pipe(
      debounceTime(300)
    ).subscribe(termo => {
      this.executarBusca(termo);
    });
  }

  onBuscar() {
    if (this.termoBusca.length >= 2) {
      this.buscando = true;
      this.buscarSubject.next(this.termoBusca);
    } else {
      this.usuarios = [];
    }
  }

  private executarBusca(termo: string) {
    this.chatService.buscarUsuarios(termo, this.usuarioId).subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.buscando = false;
      },
      error: () => {
        this.usuarios = [];
        this.buscando = false;
      }
    });
  }

  selecionar(usuario: ParticipanteResumo) {
    this.usuarioSelecionado.emit(usuario);
    this.termoBusca = '';
    this.usuarios = [];
  }

  getIniciais(nome: string): string {
    return nome.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
  }

  getCorAvatar(id: number): string {
    const cores = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];
    return cores[id % cores.length];
  }
}
