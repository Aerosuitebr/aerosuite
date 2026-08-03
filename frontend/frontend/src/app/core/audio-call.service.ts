import { Injectable, inject, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CHAT_VOICE_CALLS_ENABLED } from './chat-features.config';
import { BehaviorSubject, Observable, Subject, Subscription, interval, firstValueFrom } from 'rxjs';
import { tap, switchMap, filter, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';

// Interfaces
export interface Chamada {
  id: number;
  conversaId: number;
  chamadorId: number;
  chamadorNome: string;
  receptorId: number;
  receptorNome: string;
  status: 'CHAMANDO' | 'ATENDIDA' | 'RECUSADA' | 'ENCERRADA' | 'NAO_ATENDIDA' | 'OCUPADO';
  dataInicio: string;
  dataAtendimento?: string;
  dataFim?: string;
  duracaoSegundos?: number;
  ofertaSdp?: string;
  respostaSdp?: string;
  iceCandidatesChamador?: string;
  iceCandidatesReceptor?: string;
}

export interface IniciarChamadaRequest {
  conversaId: number;
  receptorId: number;
  chamadorId: number;
  /** JSON stringificado de RTCSessionDescription (oferta). */
  ofertaSdp: string;
}

export type EstadoChamada = 'idle' | 'chamando' | 'recebendo' | 'conectando' | 'em_chamada' | 'encerrada';

@Injectable({ providedIn: 'root' })
export class AudioCallService implements OnDestroy {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.apiUrl;
  private base = `${this.apiUrl}/chamadas`;

  // Estado
  private _estadoChamada = new BehaviorSubject<EstadoChamada>('idle');
  private _chamadaAtual = new BehaviorSubject<Chamada | null>(null);
  private _chamadaRecebida = new Subject<Chamada>();
  private _tempoLigacao = new BehaviorSubject<number>(0);

  estadoChamada$ = this._estadoChamada.asObservable();
  chamadaAtual$ = this._chamadaAtual.asObservable();
  chamadaRecebida$ = this._chamadaRecebida.asObservable();
  tempoLigacao$ = this._tempoLigacao.asObservable();

  // WebRTC
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;

  // Polling e Timers
  private pollingSubscription?: Subscription;
  private callTimerSubscription?: Subscription;
  private ringtoneAudio: HTMLAudioElement | null = null;
  private callingAudio: HTMLAudioElement | null = null;
  private remoteAudio: HTMLAudioElement | null = null;
  private usuarioId: number | null = null;
  private chamadaRecebidaId: number | null = null;

  // ICE candidates coletados
  private localIceCandidates: RTCIceCandidate[] = [];

  // Configuração WebRTC (STUN servers)
  private rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ]
  };

  ngOnDestroy() {
    this.pararPolling();
    this.encerrarChamada();
    this.pararSons();
  }

  // ==================== INICIALIZAÇÃO ====================

  private pollingActiveForUserId: number | null = null;

  iniciarPolling(usuarioId: number): void {
    if (!CHAT_VOICE_CALLS_ENABLED) {
      return;
    }
    if (this.pollingActiveForUserId === usuarioId && this.pollingSubscription && !this.pollingSubscription.closed) {
      return;
    }
    this.pararPolling();
    this.usuarioId = usuarioId;
    this.pollingActiveForUserId = usuarioId;

    this.pollingSubscription = interval(8000).pipe(
      filter(() => {
        const isIdle = this._estadoChamada.value === 'idle';
        return isIdle;
      }),
      switchMap(() => this.verificarChamadaRecebida(usuarioId))
    ).subscribe({
      next: (chamada) => {
        if (chamada && chamada.id !== this.chamadaRecebidaId) {
          
          this.chamadaRecebidaId = chamada.id;
          this._estadoChamada.next('recebendo');
          this._chamadaAtual.next(chamada);
          this._chamadaRecebida.next(chamada);
          this.tocarRingtone();
          this.vibrarDispositivo();
          this.solicitarWakeLock();
          this.monitorarChamadaRecebida(chamada.id);
        }
      },
      error: (err) => {
        console.error('Call polling error:', err);
      }
    });
  }

  pararPolling(): void {
    this.pollingSubscription?.unsubscribe();
    this.pollingSubscription = undefined;
    this.pollingActiveForUserId = null;
  }

  private monitorarChamadaRecebida(chamadaId: number): void {
    let monitorAtivo = true;
    let errosConsecutivos = 0;
    const MAX_ERROS = 5;
    
    const verificarStatus = () => {
      if (!monitorAtivo || this._estadoChamada.value !== 'recebendo') {
        return;
      }

      this.http.get<Chamada>(`${this.base}/${chamadaId}`).subscribe({
        next: (chamada) => {
          if (!monitorAtivo) return;
          
          errosConsecutivos = 0;
          
          if (!chamada) {
            setTimeout(verificarStatus, 3000);
            return;
          }
          
          if (chamada.status === 'ENCERRADA' || chamada.status === 'NAO_ATENDIDA') {
            monitorAtivo = false;
            this.encerrarChamadaLocal();
            return;
          }
          
          if (chamada.status === 'CHAMANDO') {
            setTimeout(verificarStatus, 3000);
          } else if (chamada.status === 'ATENDIDA') {
            monitorAtivo = false;
          }
        },
        error: (err) => {
          errosConsecutivos++;
          if (errosConsecutivos >= MAX_ERROS) {
            monitorAtivo = false;
            this.encerrarChamadaLocal();
            return;
          }
          if (monitorAtivo && this._estadoChamada.value === 'recebendo') {
            setTimeout(verificarStatus, 4000);
          }
        }
      });
    };

    setTimeout(verificarStatus, 5000);

    setTimeout(() => {
      if (monitorAtivo && this._estadoChamada.value === 'recebendo') {
        monitorAtivo = false;
        this.recusarChamada();
      }
    }, 60000);
  }

  // ==================== INICIAR CHAMADA ====================

  async iniciarChamada(conversaId: number, receptorId: number, receptorNome: string): Promise<void> {
    if (!CHAT_VOICE_CALLS_ENABLED) {
      throw new Error('chat.audioCall.error.voiceDisabled');
    }
    
    if (this._estadoChamada.value !== 'idle') {
      throw new Error('chat.audioCall.error.callInProgress');
    }

    const chamadorId = this.authService.getCurrentUser()?.id ?? this.usuarioId ?? undefined;
    if (chamadorId == null) {
      throw new Error('chat.audioCall.error.sessionNotLoaded');
    }

    this._estadoChamada.next('chamando');
    this.tocarChamando();

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      });

      this.criarPeerConnection();

      this.localStream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });

      const offer = await this.peerConnection!.createOffer();
      await this.peerConnection!.setLocalDescription(offer);

      const body: IniciarChamadaRequest = {
        conversaId,
        receptorId,
        chamadorId,
        ofertaSdp: JSON.stringify(this.peerConnection!.localDescription)
      };

      const chamada = await firstValueFrom(
        this.http.post<Chamada>(`${this.base}/iniciar`, body)
      );
      this._chamadaAtual.next(chamada);
      this.monitorarChamada(chamada.id);
      setTimeout(() => this.enviarIceCandidates(), 2000);
    } catch (err: unknown) {
      console.error('Failed to start call:', err);
      this.encerrarChamadaLocal();
      const httpErr = err as { error?: { message?: string }; message?: string };
      const detail =
        httpErr?.error?.message ||
        httpErr?.message ||
        (err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'chat.audioCall.error.micDenied'
          : 'chat.toast.callStartFailed');
      throw new Error(detail);
    }
  }

  // ==================== ATENDER CHAMADA ====================

  async atenderChamada(): Promise<void> {
    
    const chamada = this._chamadaAtual.value;
    if (!chamada || this._estadoChamada.value !== 'recebendo') {
      return;
    }

    
    this.pararSons();
    this._estadoChamada.next('conectando');

    this.http.post<Chamada>(`${this.base}/${chamada.id}/atender`, {
      receptorId: this.usuarioId!,
      respostaSdp: ''
    }).subscribe({
      next: async (chamadaAtualizada) => {
        this._chamadaAtual.next(chamadaAtualizada);
        this._estadoChamada.next('em_chamada');
        this.iniciarTimerChamada();
        
        try {
          await this.configurarAudioAposAtender(chamada);
        } catch (err) {
          console.error('Failed to configure audio:', err);
        }
      },
      error: (err) => {
        console.error('Failed to answer call on server:', err);
        this.encerrarChamadaLocal();
      }
    });
  }

  private async configurarAudioAposAtender(chamada: Chamada): Promise<void> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      });

      this.criarPeerConnection();

      this.localStream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });

      if (chamada.ofertaSdp) {
        const oferta = JSON.parse(chamada.ofertaSdp);
        await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(oferta));
        
        // Adicionar ICE candidates do chamador se existirem
        if (chamada.iceCandidatesChamador) {
          const candidates = JSON.parse(chamada.iceCandidatesChamador);
          for (const candidate of candidates) {
            try {
              await this.peerConnection!.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              console.warn('Failed to add ICE candidate:', e);
            }
          }
        }
      }

      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);

      this.http.post<Chamada>(`${this.base}/${chamada.id}/atualizar-sdp`, {
        respostaSdp: JSON.stringify(this.peerConnection!.localDescription)
      }).subscribe({
        next: () => {
          // Enviar ICE candidates após enviar SDP
          setTimeout(() => this.enviarIceCandidates(), 2000);
          // Monitorar ICE candidates do chamador
          this.monitorarIceCandidatesRemotos(chamada.id, false);
        },
        error: (err) => console.error('Failed to send answer SDP:', err)
      });

    } catch (err) {
      console.error('Audio configuration error:', err);
    }
  }

  // ==================== RECUSAR CHAMADA ====================

  recusarChamada(): void {
    const chamada = this._chamadaAtual.value;
    if (!chamada) return;

    this.pararSons();

    this.http.post<Chamada>(`${this.base}/${chamada.id}/recusar`, null, {
      params: { receptorId: this.usuarioId!.toString() }
    }).subscribe({
      next: () => {
        this.encerrarChamadaLocal();
      },
      error: (err) => {
        console.error('Failed to reject call:', err);
        this.encerrarChamadaLocal();
      }
    });
  }

  // ==================== ENCERRAR CHAMADA ====================

  encerrarChamada(): void {
    
    const chamada = this._chamadaAtual.value;
    if (!chamada) {
      this.encerrarChamadaLocal();
      return;
    }

    this.http.post<Chamada>(`${this.base}/${chamada.id}/encerrar`, null, {
      params: { usuarioId: this.usuarioId!.toString() }
    }).subscribe({
      next: () => {
        this.encerrarChamadaLocal();
      },
      error: (err) => {
        console.error('Failed to end call:', err);
        this.encerrarChamadaLocal();
      }
    });
  }

  private encerrarChamadaLocal(): void {
    
    this.pararSons();
    this.pararTimerChamada();

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop());
      this.remoteStream = null;
    }
    
    if (this.remoteAudio) {
      this.remoteAudio.pause();
      this.remoteAudio.srcObject = null;
      if (this.remoteAudio.parentNode) {
        this.remoteAudio.parentNode.removeChild(this.remoteAudio);
      }
      this.remoteAudio = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.localIceCandidates = [];
    this._estadoChamada.next('idle');
    this._chamadaAtual.next(null);
    this._tempoLigacao.next(0);
    this.chamadaRecebidaId = null;
    
    this.liberarWakeLock();
  }

  // ==================== WEBRTC ====================

  private criarPeerConnection(): void {
    this.localIceCandidates = [];
    
    this.peerConnection = new RTCPeerConnection(this.rtcConfig);

    // Evento de track remoto (áudio do outro participante)
    this.peerConnection.ontrack = (event) => {
      
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        this.reproduzirAudioRemoto(this.remoteStream);
      } else if (event.track) {
        this.remoteStream = new MediaStream([event.track]);
        this.reproduzirAudioRemoto(this.remoteStream);
      }
    };

    // Evento de mudança de estado da conexão
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      const estadoAtual = this._estadoChamada.value;
      
      if (state === 'connected') {
        this.pararSons();
        if (estadoAtual === 'chamando' || estadoAtual === 'conectando') {
          this._estadoChamada.next('em_chamada');
          this.iniciarTimerChamada();
        }
      } else if (state === 'disconnected' || state === 'failed') {
        if (estadoAtual === 'em_chamada') {
          this.encerrarChamadaLocal();
        }
      }
    };

    // Evento de mudança de estado ICE
    this.peerConnection.oniceconnectionstatechange = () => {
    };

    // Coletar ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.localIceCandidates.push(event.candidate);
      }
    };
  }

  // Enviar ICE candidates para o servidor
  private enviarIceCandidates(): void {
    const chamada = this._chamadaAtual.value;
    if (!chamada || this.localIceCandidates.length === 0) {
      return;
    }
    
    const souchamador = chamada.chamadorId === this.usuarioId;
    const endpoint = souchamador 
      ? `${this.base}/${chamada.id}/ice-chamador`
      : `${this.base}/${chamada.id}/ice-receptor`;
    
    const iceCandidatesJson = JSON.stringify(this.localIceCandidates.map(c => c.toJSON()));
    
    
    this.http.put(endpoint, { iceCandidates: iceCandidatesJson }).subscribe({
      error: (err) => console.error('Failed to send ICE candidates:', err)
    });
  }

  // Monitorar ICE candidates do outro participante
  private monitorarIceCandidatesRemotos(chamadaId: number, souchamador: boolean): void {
    let ultimoIceCandidates = '';
    let tentativas = 0;
    
    const verificar = () => {
      if (this._estadoChamada.value === 'idle') return;
      if (tentativas >= 30) return;
      
      tentativas++;
      
      this.http.get<Chamada>(`${this.base}/${chamadaId}`).subscribe({
        next: async (chamada) => {
          if (!chamada) return;
          
          const iceCandidates = souchamador 
            ? chamada.iceCandidatesReceptor 
            : chamada.iceCandidatesChamador;
          
          if (iceCandidates && iceCandidates !== ultimoIceCandidates && this.peerConnection) {
            ultimoIceCandidates = iceCandidates;
            
            try {
              const candidates = JSON.parse(iceCandidates);
              for (const candidate of candidates) {
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
              }
            } catch (e) {
              console.warn('Failed to add ICE candidates:', e);
            }
          }
          
          const connectionState = this.peerConnection?.connectionState;
          if (connectionState !== 'connected') {
            setTimeout(verificar, 1000);
          }
        },
        error: () => setTimeout(verificar, 2000)
      });
    };
    
    setTimeout(verificar, 1000);
  }

  private reproduzirAudioRemoto(stream: MediaStream): void {
    
    if (this.remoteAudio) {
      this.remoteAudio.pause();
      this.remoteAudio.srcObject = null;
    }
    
    this.remoteAudio = new Audio();
    this.remoteAudio.srcObject = stream;
    this.remoteAudio.autoplay = true;
    this.remoteAudio.volume = 1.0;
    
    this.remoteAudio.id = 'remote-audio-call';
    document.body.appendChild(this.remoteAudio);
    
    this.remoteAudio.play()
      .catch(err => console.error('Failed to play remote audio:', err));
  }

  // ==================== MONITORAMENTO ====================

  private monitorarChamada(chamadaId: number): void {
    let monitorAtivo = true;
    let errosConsecutivos = 0;
    const MAX_ERROS = 5;
    
    
    const verificarStatus = () => {
      if (!monitorAtivo) return;
      
      const estadoAtual = this._estadoChamada.value;
      if (estadoAtual !== 'chamando' && estadoAtual !== 'conectando') {
        return;
      }
      
      this.http.get<Chamada>(`${this.base}/${chamadaId}`).subscribe({
        next: (chamada) => {
          if (!monitorAtivo) return;
          
          errosConsecutivos = 0;
          
          if (!chamada) {
            setTimeout(verificarStatus, 2000);
            return;
          }
          
          this._chamadaAtual.next(chamada);

          if (chamada.status === 'ATENDIDA') {
            this.pararSons();
            
            if (chamada.respostaSdp) {
              monitorAtivo = false;
              this.configurarConexaoRemota(chamada);
            } else {
              this._estadoChamada.next('conectando');
              setTimeout(verificarStatus, 1000);
            }
          } else if (chamada.status === 'RECUSADA' || chamada.status === 'NAO_ATENDIDA' || chamada.status === 'OCUPADO') {
            monitorAtivo = false;
            this.encerrarChamadaLocal();
          } else if (chamada.status === 'ENCERRADA') {
            monitorAtivo = false;
            this.encerrarChamadaLocal();
          } else if (chamada.status === 'CHAMANDO') {
            setTimeout(verificarStatus, 2000);
          }
        },
        error: (err) => {
          errosConsecutivos++;
          console.error('Failed to monitor call:', err);
          
          if (errosConsecutivos >= MAX_ERROS) {
            monitorAtivo = false;
            this.encerrarChamadaLocal();
            return;
          }
          
          if (monitorAtivo) {
            setTimeout(verificarStatus, 3000);
          }
        }
      });
    };

    setTimeout(verificarStatus, 3000);

    setTimeout(() => {
      if (monitorAtivo && this._estadoChamada.value === 'chamando') {
        monitorAtivo = false;
        this.marcarNaoAtendida(chamadaId);
      }
    }, 60000);
  }

  private async configurarConexaoRemota(chamada: Chamada): Promise<void> {
    
    if (!chamada.respostaSdp || !this.peerConnection) {
      console.warn('SDP ou PeerConnection ausente');
      return;
    }

    try {
      this.pararSons();
      this._estadoChamada.next('conectando');

      const resposta = JSON.parse(chamada.respostaSdp);
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(resposta));

      // Adicionar ICE candidates do receptor
      if (chamada.iceCandidatesReceptor) {
        const candidates = JSON.parse(chamada.iceCandidatesReceptor);
        for (const candidate of candidates) {
          try {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.warn('Failed to add ICE candidate:', e);
          }
        }
      }

      this._estadoChamada.next('em_chamada');
      this._chamadaAtual.next(chamada);
      this.iniciarTimerChamada();
      
      // Monitorar ICE candidates do receptor
      this.monitorarIceCandidatesRemotos(chamada.id, true);
    } catch (err) {
      console.error('Failed to configure remote connection:', err);
      this.encerrarChamadaLocal();
    }
  }

  private marcarNaoAtendida(chamadaId: number): void {
    this.http.post(`${this.base}/${chamadaId}/nao-atendida`, null).subscribe({
      complete: () => this.encerrarChamadaLocal()
    });
  }

  // ==================== VERIFICAR CHAMADAS RECEBIDAS ====================

  private verificarChamadaRecebida(usuarioId: number): Observable<Chamada | null> {
    return this.http.get<Chamada | null>(`${this.base}/recebida`, {
      params: { receptorId: usuarioId.toString() },
      observe: 'response'
    }).pipe(
      map(response => {
        if (response.status === 204 || !response.body) {
          return null;
        }
        return response.body;
      })
    );
  }

  // ==================== SONS ====================

  private tocarRingtone(): void {
    this.pararSons();
    
    this.ringtoneAudio = new Audio();
    this.ringtoneAudio.src = this.gerarRingtoneSom();
    this.ringtoneAudio.loop = true;
    this.ringtoneAudio.volume = 1.0;
    this.ringtoneAudio.play().catch(err => console.error('Failed to play ringtone:', err));
  }

  private tocarChamando(): void {
    this.pararSons();
    
    this.callingAudio = new Audio();
    this.callingAudio.src = this.gerarChamandoSom();
    this.callingAudio.loop = true;
    this.callingAudio.volume = 0.5;
    this.callingAudio.play().catch(err => console.error('Failed to play calling tone:', err));
  }

  private pararSons(): void {
    if (this.ringtoneAudio) {
      this.ringtoneAudio.pause();
      this.ringtoneAudio.currentTime = 0;
      this.ringtoneAudio = null;
    }
    if (this.callingAudio) {
      this.callingAudio.pause();
      this.callingAudio.currentTime = 0;
      this.callingAudio = null;
    }
  }

  private gerarRingtoneSom(): string {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const sampleRate = audioContext.sampleRate;
    const duration = 2;
    const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      const ringFreq = t % 1 < 0.5 ? 440 : 480;
      const volume = t % 2 < 1 ? 0.8 : 0;
      data[i] = Math.sin(2 * Math.PI * ringFreq * t) * volume;
    }

    return this.bufferToWav(buffer);
  }

  private gerarChamandoSom(): string {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const sampleRate = audioContext.sampleRate;
    const duration = 4;
    const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      const phase = t % 4;
      const volume = phase < 1 ? 0.3 : 0;
      data[i] = Math.sin(2 * Math.PI * 425 * t) * volume;
    }

    return this.bufferToWav(buffer);
  }

  private bufferToWav(buffer: AudioBuffer): string {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1;
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const dataLength = buffer.length * blockAlign;
    const bufferLength = 44 + dataLength;
    
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);
    
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, bufferLength - 8, true);
    this.writeString(view, 8, 'WAVE');
    
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);
    
    const channelData = buffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
    
    const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  }

  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  // ==================== TIMER DA CHAMADA ====================

  private iniciarTimerChamada(): void {
    this.pararTimerChamada();
    let segundos = 0;
    this.callTimerSubscription = interval(1000).subscribe(() => {
      segundos++;
      this._tempoLigacao.next(segundos);
    });
  }

  private pararTimerChamada(): void {
    this.callTimerSubscription?.unsubscribe();
    this.callTimerSubscription = undefined;
  }

  formatarTempo(segundos: number): string {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // ==================== MOBILE SUPPORT ====================

  private vibrarDispositivo(): void {
    if ('vibrate' in navigator) {
      navigator.vibrate([500, 500, 500, 500, 500, 500, 500, 500, 500, 500]);
    }
  }

  private wakeLock: any = null;

  private async solicitarWakeLock(): Promise<void> {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
      } catch (err) {
      }
    }
  }

  private liberarWakeLock(): void {
    if (this.wakeLock) {
      this.wakeLock.release();
      this.wakeLock = null;
    }
    if ('vibrate' in navigator) {
      navigator.vibrate(0);
    }
  }

  // ==================== CONTROLES DE ÁUDIO ====================

  muteLocalAudio(muted: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
  }

  muteRemoteAudio(muted: boolean): void {
    if (this.remoteAudio) {
      this.remoteAudio.muted = muted;
    }
  }

  setRemoteVolume(volume: number): void {
    if (this.remoteAudio) {
      this.remoteAudio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  // ==================== ESTADO ====================

  get estado(): EstadoChamada {
    return this._estadoChamada.value;
  }

  get chamadaAtual(): Chamada | null {
    return this._chamadaAtual.value;
  }

  estaEmChamada(): boolean {
    return this._estadoChamada.value !== 'idle';
  }
}
