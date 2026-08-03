import { inject, Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, Subscription, Subject, EMPTY } from 'rxjs';
import { map, tap, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { bustStaticAssetUrl } from '../../environments/asset-cache-bust';
import { TranslationService } from './translation.service';
import {
  CHAT_BADGE_POLL_MS,
  CHAT_CONVERSAS_POLL_MS,
  CHAT_SOUND_NOTIFICATIONS_ENABLED
} from './chat-features.config';

// Interfaces
export interface Conversa {
  id: number;
  tipo: 'DIRETA' | 'GRUPO';
  nome?: string;
  descricao?: string;
  imagem?: string;
  criadorId: number;
  dataCriacao: string;
  dataAtualizacao: string;
  ativo: boolean;
  naoLidas: number;
  ultimaMensagem?: Mensagem;
  participantes?: ParticipanteResumo[];
}

export interface Mensagem {
  id: number;
  conversaId: number;
  remetenteId: number;
  remetenteNome: string;
  remetenteFoto?: string;
  conteudo: string;
  tipo: 'TEXTO' | 'ARQUIVO' | 'SISTEMA';
  dataEnvio: string;
  dataEdicao?: string;
  editada: boolean;
  ativo: boolean;
  anexos?: MensagemAnexo[];
}

export interface MensagemAnexo {
  id: number;
  mensagemId: number;
  nomeOriginal: string;
  nomeArquivo: string;
  tipoArquivo: string;
  tamanhoBytes: number;
  caminho: string;
  urlDownload: string;
  dataUpload: string;
  ativo: boolean;
}

export interface ParticipanteResumo {
  usuarioId: number;
  nome: string;
  email: string;
  fotoPerfil?: string;
  papel?: string;
  online?: boolean;
}

export interface CriarConversaRequest {
  tipo: 'DIRETA' | 'GRUPO';
  nome?: string;
  descricao?: string;
  participantesIds: number[];
}

export interface EnviarMensagemRequest {
  conteudo: string;
  tipo?: 'TEXTO' | 'ARQUIVO' | 'SISTEMA';
}

// Interface para notificação de nova mensagem
export interface NovaMensagemNotificacao {
  conversaId: number;
  conversaNome: string;
  remetenteNome: string;
  conteudo: string;
  tipo: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService implements OnDestroy {
  private http = inject(HttpClient);
  private i18n = inject(TranslationService);
  private apiUrl = environment.apiUrl;
  private base = `${this.apiUrl}/chat`;

  // State
  private _conversas = new BehaviorSubject<Conversa[]>([]);
  private _conversaAtual = new BehaviorSubject<Conversa | null>(null);
  private _mensagens = new BehaviorSubject<Mensagem[]>([]);
  private _contadorNaoLidas = new BehaviorSubject<number>(0);
  private _novaMensagem = new Subject<NovaMensagemNotificacao>();

  conversas$ = this._conversas.asObservable();
  conversaAtual$ = this._conversaAtual.asObservable();
  mensagens$ = this._mensagens.asObservable();
  contadorNaoLidas$ = this._contadorNaoLidas.asObservable();
  novaMensagem$ = this._novaMensagem.asObservable();

  private pollingSubscription?: Subscription;
  private conversaPollingSubscription?: Subscription;
  private badgePollingSubscription?: Subscription;
  private usuarioId: number | null = null;
  /** Evita reiniciar polling (e refazer GET) quando a sessão é apenas re-hidratada. */
  private pollingActiveForUserId: number | null = null;
  private badgePollingActiveForUserId: number | null = null;
  private ultimoContador = 0;
  private ultimasMensagensIds: Set<number> = new Set();
  private tituloDocumentoBase?: string;
  private tituloFlashTimer?: ReturnType<typeof setTimeout>;
  private visibilidadeHandler?: () => void;

  ngOnDestroy() {
    this.pararPolling();
    this.pararPollingBadge();
  }

  private registrarListenerTituloVisibilidade(): void {
    if (typeof document === 'undefined' || this.visibilidadeHandler) {
      return;
    }
    this.visibilidadeHandler = () => {
      if (!document.hidden && this.tituloDocumentoBase !== undefined) {
        if (this.tituloFlashTimer) {
          clearTimeout(this.tituloFlashTimer);
          this.tituloFlashTimer = undefined;
        }
        document.title = this.tituloDocumentoBase;
      }
    };
    document.addEventListener('visibilitychange', this.visibilidadeHandler);
  }

  // Solicitar permissão para notificações do navegador
  solicitarPermissaoNotificacao(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  /**
   * @deprecated Chat só texto — não inicializa Web Audio.
   */
  prepararContextoAudioNotificacao(): void {
    /* desligado */
  }

  private tocarSomNovoMensagem(): void {
    if (!CHAT_SOUND_NOTIFICATIONS_ENABLED) {
      return;
    }
  }

  private piscarTituloAba(remetente: string): void {
    if (typeof document === 'undefined') return;
    if (this.tituloDocumentoBase === undefined) {
      this.tituloDocumentoBase = document.title;
    }
    if (this.tituloFlashTimer) {
      clearTimeout(this.tituloFlashTimer);
    }
    document.title = `(${remetente}) Nova mensagem — ${this.tituloDocumentoBase}`;
    this.tituloFlashTimer = setTimeout(() => {
      if (this.tituloDocumentoBase !== undefined) {
        document.title = this.tituloDocumentoBase;
      }
    }, 2800);
  }

  // Emitir notificação de nova mensagem
  private emitirNotificacao(conversa: Conversa): void {
    if (!conversa.ultimaMensagem) return;
    if (conversa.ultimaMensagem.remetenteId === this.usuarioId) return;

    const conversaAberta = this._conversaAtual.value;
    const mesmaConversaVisivel =
      conversaAberta != null &&
      conversaAberta.id === conversa.id &&
      typeof document !== 'undefined' &&
      document.visibilityState === 'visible';
    if (mesmaConversaVisivel) {
      return;
    }

    const notif: NovaMensagemNotificacao = {
      conversaId: conversa.id,
      conversaNome: conversa.nome || this.i18n.translate('chat.layout.defaultConversationName'),
      remetenteNome: conversa.ultimaMensagem.remetenteNome,
      conteudo: conversa.ultimaMensagem.tipo === 'ARQUIVO' 
        ? this.i18n.translate('chat.preview.fileSent') 
        : conversa.ultimaMensagem.conteudo?.substring(0, 100) || '',
      tipo: conversa.ultimaMensagem.tipo
    };

    this._novaMensagem.next(notif);
    this.tocarSomNovoMensagem();

    const abaEmSegundoPlano =
      typeof document !== 'undefined' &&
      (document.hidden || (typeof document.hasFocus === 'function' && !document.hasFocus()));
    if (abaEmSegundoPlano) {
      this.piscarTituloAba(notif.remetenteNome);
    }

    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate([180, 80, 180]);
      } catch {
        /* ignore */
      }
    }

    // Notificação do navegador (se permitido)
    if ('Notification' in window && Notification.permission === 'granted') {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const iconUrl = origin
        ? bustStaticAssetUrl(`${origin}/assets/aerosuite-logo.png`)
        : bustStaticAssetUrl('/assets/aerosuite-logo.png');
      const browserNotif = new Notification(`Chat: ${notif.remetenteNome}`, {
        body: notif.conteudo,
        icon: iconUrl,
        tag: `chat-${conversa.id}`,
        requireInteraction: abaEmSegundoPlano
      });
      
      browserNotif.onclick = () => {
        window.focus();
        browserNotif.close();
      };

      setTimeout(() => browserNotif.close(), abaEmSegundoPlano ? 12000 : 6000);
    }
  }

  // ==================== POLLING ====================

  /**
   * Polling leve no layout: só contador de não lidas (1 query simples), sem listar conversas.
   */
  iniciarPollingBadge(usuarioId: number): void {
    if (this.pollingActiveForUserId != null) {
      return;
    }
    if (this.badgePollingActiveForUserId === usuarioId && this.badgePollingSubscription && !this.badgePollingSubscription.closed) {
      return;
    }
    this.pararPollingBadge();
    this.usuarioId = usuarioId;
    this.badgePollingActiveForUserId = usuarioId;
    this.solicitarPermissaoNotificacao();
    this.registrarListenerTituloVisibilidade();

    this.atualizarBadgeNaoLidas(usuarioId);

    this.badgePollingSubscription = interval(CHAT_BADGE_POLL_MS).pipe(
      switchMap(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
          return EMPTY;
        }
        return this.contarNaoLidas(usuarioId);
      })
    ).subscribe((count) => this.onBadgeCountUpdated(usuarioId, count));
  }

  pararPollingBadge(): void {
    this.badgePollingSubscription?.unsubscribe();
    this.badgePollingSubscription = undefined;
    this.badgePollingActiveForUserId = null;
  }

  private atualizarBadgeNaoLidas(usuarioId: number): void {
    this.contarNaoLidas(usuarioId).subscribe((count) => this.onBadgeCountUpdated(usuarioId, count));
  }

  private onBadgeCountUpdated(usuarioId: number, count: number): void {
    const anterior = this.ultimoContador;
    this.ultimoContador = count;
    this._contadorNaoLidas.next(count);
    if (count > anterior && this.pollingActiveForUserId == null) {
      this.listarConversas(usuarioId).subscribe((conversas) => this.processarConversasPolling(usuarioId, conversas));
    }
  }

  /** Polling completo — apenas com a tela do chat aberta. */
  iniciarPolling(usuarioId: number): void {
    if (this.pollingActiveForUserId === usuarioId && this.pollingSubscription && !this.pollingSubscription.closed) {
      return;
    }
    this.pararPollingBadge();
    this.pararPolling();
    this.usuarioId = usuarioId;
    this.pollingActiveForUserId = usuarioId;
    this.solicitarPermissaoNotificacao();
    this.registrarListenerTituloVisibilidade();

    this.carregarConversas(usuarioId);
    this.atualizarBadgeNaoLidas(usuarioId);

    this.pollingSubscription = interval(CHAT_CONVERSAS_POLL_MS).pipe(
      switchMap(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
          return EMPTY;
        }
        return this.listarConversas(usuarioId);
      })
    ).subscribe((conversas) => this.processarConversasPolling(usuarioId, conversas));
  }

  private processarConversasPolling(usuarioId: number, conversas: Conversa[]): void {
    const conversasAnteriores = this._conversas.value;

    conversas.forEach((conv) => {
      if (conv.ultimaMensagem && conv.ultimaMensagem.remetenteId !== usuarioId) {
        const convAnterior = conversasAnteriores.find((c) => c.id === conv.id);

        if (
          !convAnterior ||
          !convAnterior.ultimaMensagem ||
          convAnterior.ultimaMensagem.id !== conv.ultimaMensagem.id
        ) {
          if (!this.ultimasMensagensIds.has(conv.ultimaMensagem.id)) {
            this.ultimasMensagensIds.add(conv.ultimaMensagem.id);
            if (this.ultimasMensagensIds.size > 100) {
              const arr = Array.from(this.ultimasMensagensIds);
              this.ultimasMensagensIds = new Set(arr.slice(-50));
            }
            this.emitirNotificacao(conv);
          }
        }
      }
    });

    this._conversas.next(conversas);

    const novoContador = conversas.reduce((sum, c) => sum + (c.naoLidas || 0), 0);
    if (novoContador !== this.ultimoContador) {
      this.ultimoContador = novoContador;
      this._contadorNaoLidas.next(novoContador);
    }
  }

  pararPolling(): void {
    this.pollingSubscription?.unsubscribe();
    this.pollingSubscription = undefined;
    this.conversaPollingSubscription?.unsubscribe();
    this.conversaPollingSubscription = undefined;
    const uid = this.usuarioId;
    this.pollingActiveForUserId = null;
    if (typeof document !== 'undefined' && this.visibilidadeHandler) {
      document.removeEventListener('visibilitychange', this.visibilidadeHandler);
      this.visibilidadeHandler = undefined;
    }
    if (uid != null) {
      this.iniciarPollingBadge(uid);
    }
  }

  iniciarPollingConversa(conversaId: number, usuarioId: number): void {
    this.conversaPollingSubscription?.unsubscribe();
    
    this.conversaPollingSubscription = interval(5000).pipe(
      switchMap(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
          return EMPTY;
        }
        return this.listarMensagens(conversaId, usuarioId);
      })
    ).subscribe(mensagens => {
      this._mensagens.next(mensagens.reverse()); // Inverter para ordem cronológica
    });
  }

  pararPollingConversa(): void {
    this.conversaPollingSubscription?.unsubscribe();
  }

  // ==================== CONVERSAS ====================

  carregarConversas(usuarioId: number): void {
    this.listarConversas(usuarioId).subscribe(conversas => {
      this._conversas.next(conversas);
    });
  }

  listarConversas(usuarioId: number): Observable<Conversa[]> {
    return this.http.get<Conversa[]>(`${this.base}/conversas`, {
      params: { usuarioId: usuarioId.toString() }
    });
  }

  buscarConversa(conversaId: number, usuarioId: number): Observable<Conversa> {
    return this.http.get<Conversa>(`${this.base}/conversas/${conversaId}`, {
      params: { usuarioId: usuarioId.toString() }
    });
  }

  criarConversa(request: CriarConversaRequest, criadorId: number): Observable<Conversa> {
    return this.http.post<Conversa>(`${this.base}/conversas`, request, {
      params: { criadorId: criadorId.toString() }
    }).pipe(
      tap(() => {
        if (this.usuarioId) {
          this.carregarConversas(this.usuarioId);
        }
      })
    );
  }

  selecionarConversa(conversa: Conversa, usuarioId: number): void {
    this._conversaAtual.next(conversa);
    this.listarMensagens(conversa.id, usuarioId).subscribe(mensagens => {
      this._mensagens.next(mensagens.reverse());
    });
    this.marcarComoLida(conversa.id, usuarioId).subscribe(() => {
      this.carregarConversas(usuarioId);
      this.contarNaoLidas(usuarioId).subscribe(count => this._contadorNaoLidas.next(count));
    });
    this.iniciarPollingConversa(conversa.id, usuarioId);
  }

  limparConversaAtual(): void {
    this._conversaAtual.next(null);
    this._mensagens.next([]);
    this.pararPollingConversa();
  }

  // ==================== MENSAGENS ====================

  listarMensagens(conversaId: number, usuarioId: number, page: number = 0, size: number = 50): Observable<Mensagem[]> {
    return this.http.get<Mensagem[]>(`${this.base}/conversas/${conversaId}/mensagens`, {
      params: {
        usuarioId: usuarioId.toString(),
        page: page.toString(),
        size: size.toString()
      }
    });
  }

  enviarMensagem(conversaId: number, remetenteId: number, conteudo: string): Observable<Mensagem> {
    // Atualização otimista: adicionar mensagem temporária imediatamente
    const mensagemTemp: Mensagem = {
      id: -Date.now(), // ID temporário negativo
      conversaId,
      remetenteId,
      remetenteNome: this.i18n.translate('chat.you'),
      conteudo,
      tipo: 'TEXTO',
      dataEnvio: new Date().toISOString(),
      editada: false,
      ativo: true
    };
    
    // Adicionar imediatamente à lista
    const mensagensAtuais = this._mensagens.value;
    this._mensagens.next([...mensagensAtuais, mensagemTemp]);

    const request: EnviarMensagemRequest = { conteudo, tipo: 'TEXTO' };
    return this.http.post<Mensagem>(`${this.base}/conversas/${conversaId}/mensagens`, request, {
      params: { remetenteId: remetenteId.toString() }
    }).pipe(
      tap(mensagem => {
        // Substituir mensagem temporária pela real
        const mensagens = this._mensagens.value.filter(m => m.id !== mensagemTemp.id);
        this._mensagens.next([...mensagens, mensagem]);
        if (this.usuarioId) {
          this.carregarConversas(this.usuarioId);
        }
      })
    );
  }

  enviarMensagemComArquivo(conversaId: number, remetenteId: number, conteudo: string, file: File): Observable<Mensagem> {
    // Atualização otimista: adicionar mensagem temporária imediatamente
    const mensagemTemp: Mensagem = {
      id: -Date.now(),
      conversaId,
      remetenteId,
      remetenteNome: this.i18n.translate('chat.you'),
      conteudo:
        conteudo ||
        this.i18n.translate('chat.preview.sendingFile', { file: file.name }),
      tipo: 'ARQUIVO',
      dataEnvio: new Date().toISOString(),
      editada: false,
      ativo: true
    };
    
    const mensagensAtuais = this._mensagens.value;
    this._mensagens.next([...mensagensAtuais, mensagemTemp]);

    const formData = new FormData();
    formData.append('conteudo', conteudo || '');
    formData.append('file', file);

    return this.http.post<Mensagem>(`${this.base}/conversas/${conversaId}/mensagens/arquivo`, formData, {
      params: { remetenteId: remetenteId.toString() }
    }).pipe(
      tap(mensagem => {
        // Substituir mensagem temporária pela real
        const mensagens = this._mensagens.value.filter(m => m.id !== mensagemTemp.id);
        this._mensagens.next([...mensagens, mensagem]);
        if (this.usuarioId) {
          this.carregarConversas(this.usuarioId);
        }
      })
    );
  }

  marcarComoLida(conversaId: number, usuarioId: number): Observable<void> {
    return this.http.put<void>(`${this.base}/conversas/${conversaId}/lida`, null, {
      params: { usuarioId: usuarioId.toString() }
    });
  }

  // ==================== CONTADORES ====================

  contarNaoLidas(usuarioId: number): Observable<number> {
    return this.http.get<{ count: number }>(`${this.base}/nao-lidas`, {
      params: { usuarioId: usuarioId.toString() }
    }).pipe(map(r => r.count));
  }

  // ==================== BUSCA DE USUÁRIOS ====================

  buscarUsuarios(termo: string, usuarioId: number): Observable<ParticipanteResumo[]> {
    return this.http.get<ParticipanteResumo[]>(`${this.base}/usuarios/buscar`, {
      params: {
        termo,
        usuarioId: usuarioId.toString()
      }
    });
  }

  // ==================== HELPERS ====================

  getDownloadUrl(anexo: MensagemAnexo): string {
    return `${this.apiUrl}${anexo.urlDownload}`;
  }

  formatarTamanhoArquivo(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  isImagem(tipoArquivo: string): boolean {
    return tipoArquivo?.startsWith('image/') || false;
  }

  getIconeArquivo(tipoArquivo: string): string {
    if (!tipoArquivo) return 'pi pi-file';
    if (tipoArquivo.startsWith('image/')) return 'pi pi-image';
    if (tipoArquivo.startsWith('video/')) return 'pi pi-video';
    if (tipoArquivo.startsWith('audio/')) return 'pi pi-volume-up';
    if (tipoArquivo.includes('pdf')) return 'pi pi-file-pdf';
    if (tipoArquivo.includes('word') || tipoArquivo.includes('document')) return 'pi pi-file-word';
    if (tipoArquivo.includes('excel') || tipoArquivo.includes('sheet')) return 'pi pi-file-excel';
    if (tipoArquivo.includes('zip') || tipoArquivo.includes('rar')) return 'pi pi-box';
    return 'pi pi-file';
  }
}
