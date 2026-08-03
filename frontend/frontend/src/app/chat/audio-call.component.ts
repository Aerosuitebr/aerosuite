import { Component, OnInit, OnDestroy, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { RippleModule } from 'primeng/ripple';
import { AudioCallService, EstadoChamada, Chamada } from '../core/audio-call.service';
import { TranslatePipe } from '../core/translate.pipe';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-audio-call',
  standalone: true,
  imports: [CommonModule, ButtonModule, AvatarModule, RippleModule, TranslatePipe],
  template: `
    <!-- Overlay de Chamada -->
    <div class="call-overlay" *ngIf="estado !== 'idle'" [class.incoming]="estado === 'recebendo'">
      
      <!-- Fundo animado -->
      <div class="call-background">
        <div class="pulse-ring" *ngIf="estado === 'recebendo' || estado === 'chamando'"></div>
        <div class="pulse-ring delay-1" *ngIf="estado === 'recebendo' || estado === 'chamando'"></div>
        <div class="pulse-ring delay-2" *ngIf="estado === 'recebendo' || estado === 'chamando'"></div>
      </div>

      <div class="call-container">
        <!-- Avatar do contato -->
        <div class="contact-avatar" [class.pulsing]="estado === 'recebendo'">
          <p-avatar 
            [label]="getIniciais()" 
            [style]="{'background-color': '#00a884', 'color': 'white', 'font-size': '2rem'}"
            size="xlarge"
            shape="circle">
          </p-avatar>
        </div>

        <!-- Nome do contato -->
        <h2 class="contact-name">{{ getNomeContato() }}</h2>

        <!-- Status da chamada -->
        <p class="call-status">
          <ng-container [ngSwitch]="estado">
            <span *ngSwitchCase="'recebendo'" class="status-incoming">
              <i class="pi pi-phone"></i>
              {{ 'chat.call.incoming' | translate }}
            </span>
            <span *ngSwitchCase="'chamando'" class="status-calling">
              <i class="pi pi-phone"></i>
              {{ 'chat.call.calling' | translate }}
            </span>
            <span *ngSwitchCase="'conectando'" class="status-connecting">
              <i class="pi pi-spin pi-spinner"></i>
              {{ 'chat.call.connecting' | translate }}
            </span>
            <span *ngSwitchCase="'em_chamada'" class="status-active">
              <i class="pi pi-microphone"></i>
              {{ tempoFormatado }}
            </span>
          </ng-container>
        </p>

        <!-- Botões de ação -->
        <div class="call-actions">
          <!-- Chamada recebida: Atender ou Recusar -->
          <ng-container *ngIf="estado === 'recebendo'">
            <button pButton pRipple 
                    type="button" 
                    class="btn-decline"
                    icon="pi pi-phone"
                    (click)="recusar()">
            </button>
            <button pButton pRipple 
                    type="button" 
                    class="btn-accept"
                    icon="pi pi-phone"
                    (click)="atender()">
            </button>
          </ng-container>

          <!-- Chamando ou Em chamada: Desligar -->
          <ng-container *ngIf="estado === 'chamando' || estado === 'conectando' || estado === 'em_chamada'">
            <button pButton pRipple 
                    type="button" 
                    class="btn-hangup"
                    icon="pi pi-phone"
                    (click)="desligar()">
            </button>
          </ng-container>
        </div>

        <!-- Ações secundárias durante a chamada -->
        <div class="secondary-actions" *ngIf="estado === 'em_chamada'">
          <button pButton pRipple 
                  type="button" 
                  class="btn-secondary"
                  [icon]="muted ? 'pi pi-microphone-slash' : 'pi pi-microphone'"
                  [class.active]="muted"
                  (click)="toggleMute()"
                  [pTooltip]="'chat.call.mute' | translate">
          </button>
          <button pButton pRipple 
                  type="button" 
                  class="btn-secondary"
                  [icon]="speakerOn ? 'pi pi-volume-up' : 'pi pi-volume-off'"
                  [class.active]="speakerOn"
                  (click)="toggleSpeaker()"
                  [pTooltip]="'chat.call.speaker' | translate">
          </button>
        </div>

        <!-- Indicador de qualidade -->
        <div class="quality-indicator" *ngIf="estado === 'em_chamada'">
          <i class="pi pi-wifi"></i>
          <span>{{ 'chat.call.stableConnection' | translate }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .call-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.3s ease-out;

      &.incoming {
        background: linear-gradient(180deg, #1a2a1a 0%, #162e16 50%, #0f4a0f 100%);
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .call-background {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }

    .pulse-ring {
      position: absolute;
      width: 200px;
      height: 200px;
      border-radius: 50%;
      border: 3px solid rgba(0, 168, 132, 0.3);
      animation: pulse 2s ease-out infinite;

      &.delay-1 { animation-delay: 0.5s; }
      &.delay-2 { animation-delay: 1s; }
    }

    @keyframes pulse {
      0% {
        transform: scale(1);
        opacity: 1;
      }
      100% {
        transform: scale(3);
        opacity: 0;
      }
    }

    .call-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 40px;
      z-index: 1;
    }

    .contact-avatar {
      margin-bottom: 24px;
      transition: transform 0.3s ease;

      &.pulsing {
        animation: avatarPulse 1.5s ease-in-out infinite;
      }

      ::ng-deep .p-avatar {
        width: 120px !important;
        height: 120px !important;
        font-size: 3rem !important;
        box-shadow: 0 8px 32px rgba(0, 168, 132, 0.4);
      }
    }

    @keyframes avatarPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }

    .contact-name {
      color: white;
      font-size: 28px;
      font-weight: 600;
      margin: 0 0 12px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .call-status {
      color: rgba(255, 255, 255, 0.8);
      font-size: 16px;
      margin: 0 0 48px;
      display: flex;
      align-items: center;
      gap: 8px;

      i {
        font-size: 18px;
      }

      .status-incoming {
        color: #4ade80;
        animation: blink 1s ease-in-out infinite;
      }

      .status-calling {
        color: #60a5fa;
      }

      .status-connecting {
        color: #fbbf24;
      }

      .status-active {
        color: #00a884;
        font-weight: 600;
        font-size: 24px;
        font-family: 'Roboto Mono', monospace;
      }
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .call-actions {
      display: flex;
      gap: 48px;
      margin-bottom: 32px;
    }

    .btn-accept {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%) !important;
      border: none !important;
      box-shadow: 0 8px 24px rgba(34, 197, 94, 0.4);
      animation: bounce 1s ease infinite;

      &:hover {
        transform: scale(1.1);
        box-shadow: 0 12px 32px rgba(34, 197, 94, 0.5);
      }

      ::ng-deep .pi {
        font-size: 28px;
      }
    }

    .btn-decline {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
      border: none !important;
      box-shadow: 0 8px 24px rgba(239, 68, 68, 0.4);
      transform: rotate(135deg);

      &:hover {
        transform: rotate(135deg) scale(1.1);
        box-shadow: 0 12px 32px rgba(239, 68, 68, 0.5);
      }

      ::ng-deep .pi {
        font-size: 28px;
      }
    }

    .btn-hangup {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
      border: none !important;
      box-shadow: 0 8px 24px rgba(239, 68, 68, 0.4);
      transform: rotate(135deg);

      &:hover {
        transform: rotate(135deg) scale(1.1);
        box-shadow: 0 12px 32px rgba(239, 68, 68, 0.5);
      }

      ::ng-deep .pi {
        font-size: 28px;
      }
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }

    .secondary-actions {
      display: flex;
      gap: 24px;
      margin-bottom: 24px;
    }

    .btn-secondary {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1) !important;
      border: 1px solid rgba(255, 255, 255, 0.2) !important;
      color: white !important;
      transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.2) !important;
      }

      &.active {
        background: rgba(239, 68, 68, 0.3) !important;
        border-color: #ef4444 !important;
      }

      ::ng-deep .pi {
        font-size: 20px;
      }
    }

    .quality-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      color: rgba(255, 255, 255, 0.6);
      font-size: 13px;

      i {
        color: #00a884;
      }
    }

    /* Mobile responsiveness */
    @media (max-width: 480px) {
      .call-container {
        padding: 24px;
      }

      .contact-avatar ::ng-deep .p-avatar {
        width: 100px !important;
        height: 100px !important;
        font-size: 2.5rem !important;
      }

      .contact-name {
        font-size: 24px;
      }

      .call-actions {
        gap: 32px;
      }

      .btn-accept,
      .btn-decline,
      .btn-hangup {
        width: 64px;
        height: 64px;

        ::ng-deep .pi {
          font-size: 24px;
        }
      }
    }
  `]
})
export class AudioCallComponent implements OnInit, OnDestroy {
  private audioCallService = inject(AudioCallService);

  @Input() visible = false;
  @Output() closed = new EventEmitter<void>();

  estado: EstadoChamada = 'idle';
  chamada: Chamada | null = null;
  tempoFormatado = '00:00';
  muted = false;
  speakerOn = true;

  private subscriptions: Subscription[] = [];

  ngOnInit() {
    this.subscriptions.push(
      this.audioCallService.estadoChamada$.subscribe(estado => {
        this.estado = estado;
        if (estado === 'idle') {
          this.closed.emit();
        }
      }),
      this.audioCallService.chamadaAtual$.subscribe(chamada => {
        this.chamada = chamada;
      }),
      this.audioCallService.tempoLigacao$.subscribe(segundos => {
        this.tempoFormatado = this.audioCallService.formatarTempo(segundos);
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  getIniciais(): string {
    const nome = this.getNomeContato();
    return nome.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
  }

  getNomeContato(): string {
    if (!this.chamada) return 'Desconhecido';
    
    // Se estamos recebendo a chamada, mostrar nome do chamador
    // Se estamos fazendo a chamada, mostrar nome do receptor
    if (this.estado === 'recebendo') {
      return this.chamada.chamadorNome || 'Desconhecido';
    }
    return this.chamada.receptorNome || 'Desconhecido';
  }

  async atender() {
    await this.audioCallService.atenderChamada();
  }

  recusar() {
    this.audioCallService.recusarChamada();
  }

  desligar() {
    this.audioCallService.encerrarChamada();
  }

  toggleMute() {
    this.muted = !this.muted;
    this.audioCallService.muteLocalAudio(this.muted);
  }

  toggleSpeaker() {
    this.speakerOn = !this.speakerOn;
    // Quando speaker está desligado, muta o áudio remoto
    this.audioCallService.muteRemoteAudio(!this.speakerOn);
    // Alternativa: ajustar volume (0.0 para mute, 1.0 para normal)
    // this.audioCallService.setRemoteVolume(this.speakerOn ? 1.0 : 0.0);
  }
}
