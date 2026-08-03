import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { MoneyCurrency } from './locale/locale-region.config';

/**
 * Interface para dados da assinatura
 */
export interface SignatureData {
  name: string;
  styleId: string;
  fontFamily: string;
  fontWeight: string;
  fontSize: string;
  color: string;
  letterSpacing: string;
  timestamp?: string;
}

/**
 * Interface para Item da Proposta Comercial.
 * valorUnitario e valorTotal são sempre em USD (dólar).
 */
export interface PropostaComercialItem {
  id?: number;
  produtoNome: string;
  produtoDescricao?: string;
  produtoPn?: string;
  produtoSn?: string;
  quantidade: number;
  valorUnitario: number;  // USD
  valorTotal: number;      // USD
  ordem?: number;
}

/**
 * Interface para Proposta Comercial
 */
export interface PropostaComercial {
  id?: number;
  numeroProposta?: string;
  
  // Dados do Produto
  produtoNome?: string;
  produtoPn?: string;
  produtoSn?: string;
  produtoManual?: string;
  produtoValor?: number;
  aplicacaoMotor?: string;
  aeronavePrefixo?: string;
  servicoExecutado?: string;
  idTipoServico?: number;
  tipoServicoNome?: string;
  
  // Dados do Cliente
  clienteNome?: string;
  clienteCnpjCpf?: string;
  clienteEmail?: string;
  clienteTelefone?: string;
  clienteEndereco?: string;
  clienteCidade?: string;
  clienteEstado?: string;
  clienteCep?: string;
  clienteContato?: string;
  clienteObservacao?: string;
  
  // Dados da Proposta
  dataProposta?: string;
  validadeProposta?: string;
  prazoEntrega?: string;
  formaPagamento?: string;
  observacoes?: string;
  condicoesGerais?: string;
  referenciaCliente?: string;
  contatoTecnico?: string;
  centroCusto?: string;
  status?: string;
  
  // Dados do Desconto
  descontoTipo?: 'percent' | 'fixed';
  descontoPercentual?: number;
  descontoValorFixo?: number;
  descontoValorCalculado?: number;
  valorTotalFinal?: number;
  
  // Custos Adicionais (em BRL)
  freteBrl?: number;
  maoDeObraBrl?: number;
  
  // Dados da Cotação do Dólar
  cotacaoDolar?: number;
  dataCotacao?: string;
  
  // Valores convertidos
  freteUsd?: number;
  maoDeObraUsd?: number;
  subtotalProdutosUsd?: number;
  totalGeralUsd?: number;
  moedaProposta?: MoneyCurrency;
  totalGeralBrl?: number;
  totalGeralEur?: number;
  
  // Dados da Assinatura
  assinaturaNome?: string;
  assinaturaEstilo?: string;
  assinaturaFontFamily?: string;
  assinaturaColor?: string;
  assinaturaTimestamp?: string;
  
  // Itens da Proposta (produtos)
  itens?: PropostaComercialItem[];

  // Vínculo OS (P4.1)
  osId?: number;
  osGeradaEm?: string;
  osGeradaPor?: string;
  osResumoDtAbertura?: string;
  osResumoAtiva?: boolean;
  osResumoNumOsOriginal?: string;
  clienteDecisaoEm?: string;
  clienteDecisaoMotivo?: string;
  clientePropostaId?: number;

  /** P4.2 v1.1 — portal cliente */
  aditivos?: PropostaAditivo[];
  anexos?: PropostaAnexo[];
  
  // Metadados
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

/**
 * Interface para item da proposta no email
 */
export interface PropostaItemEmail {
  produtoNome: string;
  produtoDescricao?: string;
  produtoPn?: string;
  produtoSn?: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

/**
 * Interface para envio de email da proposta
 */
export interface EnviarPropostaEmailRequest {
  propostaId: number;
  emailDestino: string;
  assunto?: string;
  mensagemAdicional?: string;
  tipoEnvio?: 'corpo' | 'anexo';
  signature?: SignatureData;
  htmlContent?: string;
  items?: PropostaItemEmail[];
  /** Snapshot persistido no envio */
  moedaProposta?: MoneyCurrency;
  dataProposta?: string;
  validadeProposta?: string;
  valorTotalFinal?: number;
  totalGeralBrl?: number;
  totalGeralEur?: number;
  totalGeralUsd?: number;
  freteBrl?: number;
  maoDeObraBrl?: number;
  freteUsd?: number;
  maoDeObraUsd?: number;
  cotacaoDolar?: number;
  dataCotacao?: string;
  descontoTipo?: 'percent' | 'fixed';
  descontoPercentual?: number;
  descontoValorFixo?: number;
  descontoValorCalculado?: number;
  /** Telefone e email do remetente (exibidos no rodapé do email) */
  telefoneRemetente?: string;
  emailRemetente?: string;
}

/**
 * Interface para resultado paginado
 */
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

/**
 * Service para Propostas Comerciais
 */
@Injectable({ providedIn: 'root' })
export class PropostaComercialService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/propostas-comerciais`;

  /**
   * Lista propostas com filtros
   */
  list(params: {
    page?: number;
    size?: number;
    sort?: string;
    q?: string;
    status?: string;
  } = {}): Observable<Page<PropostaComercial>> {
    let hp = new HttpParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') {
        hp = hp.set(k, String(v));
      }
    }
    return this.http.get<Page<PropostaComercial>>(this.base, { params: hp });
  }

  /**
   * Busca proposta por ID
   */
  getById(id: number): Observable<PropostaComercial> {
    return this.http.get<PropostaComercial>(`${this.base}/${id}`);
  }

  /** Itens da proposta — leve, para preview na listagem. */
  listItens(id: number): Observable<PropostaComercialItem[]> {
    return this.http.get<PropostaComercialItem[]>(`${this.base}/${id}/itens`);
  }

  camposExtrasRegras(): Observable<{ camposExtras: boolean }> {
    return this.http.get<{ camposExtras: boolean }>(`${this.base}/campos-extras/regras`);
  }

  /**
   * Cria nova proposta
   */
  create(body: PropostaComercial): Observable<PropostaComercial> {
    return this.http.post<PropostaComercial>(this.base, body);
  }

  /**
   * Atualiza proposta existente
   */
  update(id: number, body: PropostaComercial): Observable<PropostaComercial> {
    return this.http.put<PropostaComercial>(`${this.base}/${id}`, body);
  }

  /**
   * Exclui proposta
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  /**
   * Altera status da proposta
   */
  changeStatus(id: number, status: string): Observable<PropostaComercial> {
    return this.http.put<PropostaComercial>(`${this.base}/${id}/status?status=${status}`, {});
  }

  /**
   * Duplica uma proposta
   */
  duplicate(id: number): Observable<PropostaComercial> {
    return this.http.post<PropostaComercial>(`${this.base}/${id}/duplicar`, {});
  }

  /**
   * Envia proposta por email
   */
  enviarPorEmail(request: EnviarPropostaEmailRequest): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.base}/${request.propostaId}/enviar-email`,
      request
    );
  }

  getWhatsAppEnvioStatus(): Observable<{ configured: boolean }> {
    return this.http.get<{ configured: boolean }>(`${this.base}/whatsapp-envio/status`);
  }

  enviarPorWhatsApp(
    propostaId: number,
    body: {
      telefoneDestino: string;
      mensagemAdicional?: string;
      signature?: SignatureData;
    }
  ): Observable<{
    success: boolean;
    message: string;
    fallback?: boolean;
    whatsappUrl?: string;
    pdfBase64?: string;
    pdfNome?: string;
    whatsappApiConfigured?: boolean;
    errorMessage?: string;
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      fallback?: boolean;
      whatsappUrl?: string;
      pdfBase64?: string;
      pdfNome?: string;
      whatsappApiConfigured?: boolean;
      errorMessage?: string;
    }>(`${this.base}/${propostaId}/enviar-whatsapp`, {
      propostaId,
      telefoneDestino: body.telefoneDestino,
      mensagemAdicional: body.mensagemAdicional,
      signature: body.signature
    });
  }

  /**
   * Salva assinatura na proposta
   */
  salvarAssinatura(id: number, signature: SignatureData): Observable<PropostaComercial> {
    return this.http.put<PropostaComercial>(`${this.base}/${id}/assinatura`, signature);
  }

  /** P4.1 — gera OS a partir de proposta aprovada. */
  gerarOs(id: number): Observable<GerarOsPropostaResult> {
    return this.http.post<GerarOsPropostaResult>(`${this.base}/${id}/gerar-os`, {});
  }

  listarAditivos(propostaId: number): Observable<PropostaAditivo[]> {
    return this.http.get<PropostaAditivo[]>(`${this.base}/${propostaId}/aditivos`);
  }

  criarAditivoOficina(propostaId: number, body: { descricao: string; valor?: number }): Observable<PropostaAditivo> {
    return this.http.post<PropostaAditivo>(`${this.base}/${propostaId}/aditivos`, body);
  }

  listarAnexos(propostaId: number): Observable<PropostaAnexo[]> {
    return this.http.get<PropostaAnexo[]>(`${this.base}/${propostaId}/anexos`);
  }

  downloadAnexoUrl(propostaId: number, anexoId: number): string {
    return `${this.base}/${propostaId}/anexos/${anexoId}/download`;
  }

  verificarPortalAcesso(id: number): Observable<PropostaPortalAcesso> {
    return this.http.get<PropostaPortalAcesso>(`${this.base}/${id}/portal-acesso`);
  }

  disponibilizarPortal(id: number, body?: PropostaDisponibilizarPortalRequest): Observable<PropostaDisponibilizarPortalResult> {
    return this.http.post<PropostaDisponibilizarPortalResult>(`${this.base}/${id}/disponibilizar-portal`, body ?? {});
  }
}

export interface PropostaAditivo {
  id?: number;
  propostaId?: number;
  descricao?: string;
  valor?: number;
  status?: string;
  createdAt?: string;
  clienteDecisaoEm?: string;
  clienteDecisaoMotivo?: string;
  podeAprovar?: boolean;
  podeRejeitar?: boolean;
  solicitadoPeloCliente?: boolean;
}

export interface PropostaAnexo {
  id?: number;
  nomeArquivo?: string;
  tamanhoBytes?: number;
  contentType?: string;
  createdAt?: string;
}

export interface GerarOsPropostaResult {
  proposta: PropostaComercial;
  os: { id?: number; clienteNome?: string; dtAbertura?: string };
}

export interface PropostaPortalAcesso {
  propostaSalva: boolean;
  temEmailCliente: boolean;
  clientePropostaId?: number;
  statusAtual?: string;
  visivelNoPortal: boolean;
  usuarioExternoExiste: boolean;
  usuarioExternoAtivo: boolean;
  usuarioExternoId?: number;
  usuarioExternoEmail?: string;
  usuarioExternoNome?: string;
  temAcessoPropostas: boolean;
  podeDisponibilizar: boolean;
  mensagemBloqueio?: string;
}

export interface PropostaDisponibilizarPortalRequest {
  criarAcessoExterno?: boolean;
  nomeContato?: string;
  notificarCliente?: boolean;
}

export interface PropostaDisponibilizarPortalResult {
  acesso: PropostaPortalAcesso;
  proposta: PropostaComercial;
  usuarioExternoCriado: boolean;
  funcionalidadePropostasConcedida: boolean;
  vinculoClienteAtualizado: boolean;
  jaEstavaVisivel: boolean;
  osGeradaId?: number;
  emailNotificacaoEnviado?: boolean;
}
