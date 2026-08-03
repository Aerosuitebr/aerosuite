import { inject, Injectable } from '@angular/core';
import { TranslationService } from './translation.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Interfaces
export interface Page<T> {
  items: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface Ticket {
  id?: number;
  numero?: string;
  titulo?: string;
  descricao?: string;
  tipo?: 'ERRO' | 'MELHORIA' | 'DUVIDA' | 'SOLICITACAO';
  prioridade?: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  status?: 'ABERTO' | 'EM_ANALISE' | 'EM_ANDAMENTO' | 'AGUARDANDO_USUARIO' | 'RESOLVIDO' | 'FECHADO' | 'CANCELADO';
  categoria?: string;
  subcategoria?: string;
  passosReproduzir?: string;
  comportamentoEsperado?: string;
  comportamentoAtual?: string;
  ambiente?: 'PRODUCAO' | 'HOMOLOGACAO' | 'DESENVOLVIMENTO';
  navegador?: string;
  sistemaOperacional?: string;
  versaoSistema?: string;
  usuarioId?: number;
  usuarioNome?: string;
  usuarioEmail?: string;
  atendenteId?: number;
  atendenteNome?: string;
  dataAbertura?: string;
  dataPrimeiraResposta?: string;
  dataResolucao?: string;
  dataFechamento?: string;
  dataUltimaAtualizacao?: string;
  slaPrimeiraRespostaHoras?: number;
  slaResolucaoHoras?: number;
  slaPrimeiraRespostaMinutos?: number;
  slaResolucaoMinutos?: number;
  slaPrimeiraRespostaEstourado?: boolean;
  slaResolucaoEstourado?: boolean;
  avaliacao?: number;
  comentarioAvaliacao?: string;
  isActive?: boolean;
  anexos?: TicketAttachment[];
  comentarios?: TicketComment[];
}

export interface TicketAttachment {
  id?: number;
  ticketId?: number;
  nomeArquivo?: string;
  nomeOriginal?: string;
  tipoArquivo?: string;
  tamanhoBytes?: number;
  caminhoArquivo?: string;
  urlDownload?: string;
  descricao?: string;
  tipoAnexo?: 'SCREENSHOT' | 'LOG' | 'DOCUMENTO' | 'VIDEO' | 'OUTRO';
  usuarioId?: number;
  usuarioNome?: string;
  dataUpload?: string;
  isActive?: boolean;
}

export interface TicketComment {
  id?: number;
  ticketId?: number;
  conteudo?: string;
  tipo?: 'COMENTARIO' | 'RESPOSTA' | 'ALTERACAO_STATUS' | 'INTERNO' | 'SOLUCAO';
  visivelUsuario?: boolean;
  usuarioId?: number;
  usuarioNome?: string;
  usuarioTipo?: 'CLIENTE' | 'ATENDENTE' | 'SISTEMA';
  statusAnterior?: string;
  statusNovo?: string;
  dataCriacao?: string;
  dataEdicao?: string;
  isActive?: boolean;
}

export interface TicketEstatisticas {
  total: number;
  abertos: number;
  emAnalise: number;
  emAndamento: number;
  aguardandoUsuario: number;
  resolvidos: number;
  fechados: number;
}

export interface TicketEstatisticasAtendimento {
  totalAtivos: number;
  abertos: number;
  emAnalise: number;
  emAndamento: number;
  aguardandoUsuario: number;
  semAtendente: number;
  slaEstourado: number;
  meusAtendimentos: number;
  meusAbertos: number;
  resolvidos: number;
}

// Constantes para labels
export const TICKET_TIPOS = [
  { value: 'ERRO', label: 'ERRO', icon: 'pi-times-circle', color: '#dc3545' },
  { value: 'MELHORIA', label: 'MELHORIA', icon: 'pi-lightbulb', color: '#17a2b8' },
  { value: 'DUVIDA', label: 'DUVIDA', icon: 'pi-question-circle', color: '#6c757d' },
  { value: 'SOLICITACAO', label: 'SOLICITACAO', icon: 'pi-inbox', color: '#28a745' }
];

export const TICKET_PRIORIDADES = [
  { value: 'BAIXA', label: 'BAIXA', icon: 'pi-arrow-down', color: '#28a745' },
  { value: 'MEDIA', label: 'MEDIA', icon: 'pi-minus', color: '#ffc107' },
  { value: 'ALTA', label: 'ALTA', icon: 'pi-arrow-up', color: '#fd7e14' },
  { value: 'CRITICA', label: 'CRITICA', icon: 'pi-exclamation-triangle', color: '#dc3545' }
];

export const TICKET_STATUS = [
  { value: 'ABERTO', label: 'ABERTO', icon: 'pi-folder-open', color: '#17a2b8' },
  { value: 'EM_ANALISE', label: 'EM_ANALISE', icon: 'pi-search', color: '#6f42c1' },
  { value: 'EM_ANDAMENTO', label: 'EM_ANDAMENTO', icon: 'pi-cog', color: '#fd7e14' },
  { value: 'AGUARDANDO_USUARIO', label: 'AGUARDANDO_USUARIO', icon: 'pi-clock', color: '#ffc107' },
  { value: 'RESOLVIDO', label: 'RESOLVIDO', icon: 'pi-check-circle', color: '#28a745' },
  { value: 'FECHADO', label: 'FECHADO', icon: 'pi-lock', color: '#6c757d' }
];

export const TICKET_CATEGORIAS = [
  { value: 'ESTOQUE', label: 'ESTOQUE' },
  { value: 'PRODUTOS', label: 'PRODUTOS' },
  { value: 'OS', label: 'OS' },
  { value: 'FCU', label: 'FCU' },
  { value: 'COMERCIAL', label: 'COMERCIAL' },
  { value: 'FINANCEIRO', label: 'FINANCEIRO' },
  { value: 'RELATORIOS', label: 'RELATORIOS' },
  { value: 'USUARIOS', label: 'USUARIOS' },
  { value: 'INTEGRACAO', label: 'INTEGRACAO' },
  { value: 'OUTRO', label: 'OUTRO' }
];

export const TICKET_AMBIENTES = [
  { value: 'PRODUCAO', label: 'PRODUCAO' },
  { value: 'HOMOLOGACAO', label: 'HOMOLOGACAO' },
  { value: 'DESENVOLVIMENTO', label: 'DESENVOLVIMENTO' }
];

export interface TicketSlaPreview {
  primeiraRespostaMinutos: number;
  resolucaoMinutos: number;
  primeiraRespostaHoras: number;
  resolucaoHoras: number;
  ambienteModifier: 'ACCELERATED' | 'STANDARD' | 'RELAXED' | string;
}

@Injectable({ providedIn: 'root' })
export class TicketService {
  private http = inject(HttpClient);
  private i18n = inject(TranslationService);
  private base = `${environment.apiUrl}/tickets`;

  // Listar tickets com filtros
  list(params: {
    page?: number;
    size?: number;
    sort?: string;
    q?: string;
    status?: string;
    prioridade?: string;
    tipo?: string;
    usuarioId?: number;
    atendenteId?: number;
    isActive?: boolean;
  } = {}): Observable<Page<Ticket>> {
    let hp = new HttpParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') {
        hp = hp.set(k, String(v));
      }
    }
    return this.http.get<Page<Ticket>>(this.base, { params: hp });
  }

  // Buscar por ID
  getById(id: number): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.base}/${id}`);
  }

  // Buscar por número
  getByNumero(numero: string): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.base}/numero/${numero}`);
  }

  // Criar ticket
  create(ticket: Ticket): Observable<Ticket> {
    return this.http.post<Ticket>(this.base, ticket);
  }

  // Atualizar ticket
  update(id: number, ticket: Ticket): Observable<Ticket> {
    return this.http.put<Ticket>(`${this.base}/${id}`, ticket);
  }

  // Atribuir atendente
  atribuirAtendente(id: number, atendenteId: number, atendenteNome: string): Observable<Ticket> {
    return this.http.put<Ticket>(`${this.base}/${id}/atribuir`, null, {
      params: { atendenteId: atendenteId.toString(), atendenteNome }
    });
  }

  // Alterar status
  alterarStatus(id: number, status: string, usuarioId: number, usuarioNome: string, usuarioTipo: string): Observable<Ticket> {
    return this.http.put<Ticket>(`${this.base}/${id}/status`, null, {
      params: { status, usuarioId: usuarioId.toString(), usuarioNome, usuarioTipo }
    });
  }

  // Adicionar comentário
  addComment(ticketId: number, comment: TicketComment): Observable<TicketComment> {
    return this.http.post<TicketComment>(`${this.base}/${ticketId}/comentarios`, comment);
  }

  // Upload de anexo
  uploadAttachment(ticketId: number, file: File, descricao?: string, tipoAnexo?: string, usuarioId?: number, usuarioNome?: string): Observable<TicketAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    if (descricao) formData.append('descricao', descricao);
    if (tipoAnexo) formData.append('tipoAnexo', tipoAnexo);
    if (usuarioId) formData.append('usuarioId', usuarioId.toString());
    if (usuarioNome) formData.append('usuarioNome', usuarioNome);
    
    return this.http.post<TicketAttachment>(`${this.base}/${ticketId}/anexos`, formData);
  }

  // Avaliar atendimento
  avaliar(id: number, avaliacao: number, comentario?: string): Observable<Ticket> {
    let params: any = { avaliacao: avaliacao.toString() };
    if (comentario) params.comentario = comentario;
    return this.http.put<Ticket>(`${this.base}/${id}/avaliar`, null, { params });
  }

  // Deletar (soft delete)
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  // Estatísticas
  getEstatisticas(usuarioId?: number): Observable<TicketEstatisticas> {
    let hp = new HttpParams();
    if (usuarioId) hp = hp.set('usuarioId', usuarioId.toString());
    return this.http.get<TicketEstatisticas>(`${this.base}/estatisticas`, { params: hp });
  }

  getEstatisticasAtendimento(atendenteId?: number): Observable<TicketEstatisticasAtendimento> {
    let hp = new HttpParams();
    if (atendenteId) hp = hp.set('atendenteId', atendenteId.toString());
    return this.http.get<TicketEstatisticasAtendimento>(`${this.base}/estatisticas/atendimento`, { params: hp });
  }

  previewSla(prioridade: string, ambiente?: string, categoria?: string): Observable<TicketSlaPreview> {
    let hp = new HttpParams().set('prioridade', prioridade);
    if (ambiente) hp = hp.set('ambiente', ambiente);
    if (categoria) hp = hp.set('categoria', categoria);
    return this.http.get<TicketSlaPreview>(`${this.base}/sla-preview`, { params: hp });
  }

  // Busca com parâmetros de pesquisa (alias para list com filtros)
  search(busca?: string, status?: string, prioridade?: string, page: number = 0, size: number = 50): Observable<{items: Ticket[], total: number}> {
    let hp = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (busca) hp = hp.set('q', busca);
    if (status) hp = hp.set('status', status);
    if (prioridade) hp = hp.set('prioridade', prioridade);
    
    return this.http.get<Page<Ticket>>(this.base, { params: hp }).pipe(
      map(page => ({ items: page.items, total: page.totalElements }))
    );
  }

  // Helpers para labels
  getTipoLabel(tipo: string): string {
    return this.i18n.translateCatalog('ticket.type', tipo, tipo);
  }

  getPrioridadeLabel(prioridade: string): string {
    return this.i18n.translateCatalog('ticket.priority', prioridade, prioridade);
  }

  getStatusLabel(status: string): string {
    return this.i18n.translateCatalog('ticket.status', status, status);
  }

  getCategoriaLabel(categoria: string): string {
    return this.i18n.translateCatalog('ticket.category', categoria, categoria);
  }

  getAmbienteLabel(ambiente: string): string {
    return this.i18n.translateCatalog('ticket.environment', ambiente, ambiente);
  }
}
