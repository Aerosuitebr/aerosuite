import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { readBlobAsDataUrl } from './blob-data-url.util';

// ==================== INTERFACES ====================

export interface Fornecedor {
  id?: number;
  codigo?: string;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpjCpf?: string;
  inscricaoEstadual?: string;
  paisOrigem?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  telefone?: string;
  email?: string;
  website?: string;
  contatoNome?: string;
  contatoTelefone?: string;
  contatoEmail?: string;
  observacoes?: string;
  aslStatus?: string;
  aslEscopo?: string;
  aslValidade?: string;
  aslAprovadoEm?: string;
  aslObservacoes?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface InvoiceItem {
  id?: number;
  invoiceId?: number;
  linha?: number;
  partNumber: string;
  descricao?: string;
  quantidade: number;
  unidade?: string;
  valorUnitario?: number;
  valorTotal?: number;
  quantidadeRecebida?: number;
  quantidadePendente?: number;
  status?: string;
  observacoes?: string;
}

export interface Invoice {
  id?: number;
  numeroInvoice: string;
  fornecedorId: number;
  fornecedorNome?: string;
  fornecedorCodigo?: string;
  dataEmissao: string;
  dataRecebimento?: string;
  paisOrigem?: string;
  moeda?: string;
  valorTotal?: number;
  valorFrete?: number;
  valorSeguro?: number;
  valorImpostos?: number;
  taxaCambio?: number;
  numeroDi?: string;
  numeroConhecimento?: string;
  modalTransporte?: string;
  status?: string;
  isActive?: boolean;
  observacoes?: string;
  arquivoInvoice?: string;
  createdAt?: string;
  itens?: InvoiceItem[];
}

export interface InvoiceInativacaoValidacao {
  podeInativar: boolean;
  podeCancelar: boolean;
  jaInativa: boolean;
  jaCancelada: boolean;
  statusAtual?: string;
  qtdItensEstoque: number;
  qtdLotes: number;
  bloqueios: string[];
  orientacao?: string;
  orientacaoCancelamento?: string;
}

export interface InvoiceAcaoRequest {
  motivo: string;
  usuarioEmail?: string;
}

export interface InvoiceAuditoria {
  id?: number;
  invoiceId?: number;
  numeroInvoice?: string;
  acao?: string;
  motivo?: string;
  statusAnterior?: string;
  statusNovo?: string;
  isActiveAnterior?: boolean;
  isActiveNovo?: boolean;
  qtdItensEstoque?: number;
  qtdLotes?: number;
  detalheBloqueio?: string;
  usuarioId?: number;
  usuarioNome?: string;
  usuarioEmail?: string;
  ipOrigem?: string;
  dataHora?: string;
}

/** Linha para POST /estoque/disponibilidade/consulta */
export interface ConsultaDisponibilidadeLinha {
  partNumber: string;
  quantidade?: number | null;
}

export interface DisponibilidadePnResult {
  partNumber: string;
  quantidadeSolicitada: number;
  quantidadeDisponivel: number;
  semEstoque: boolean;
}

export interface Lote {
  id?: number;
  codigoLote: string;
  fornecedorId?: number;
  fornecedorNome?: string;
  invoiceId?: number;
  invoiceNumero?: string;
  quantidadeTotal?: number;
  quantidadeDisponivel?: number;
  status?: string;
  localizacao?: string;
  dataEntrada?: string;
}

export interface ItemEstoque {
  id?: number;
  codigoRastreio?: string;
  qrCodeData?: string;
  partNumber: string;
  serialNumber?: string;
  descricao?: string;
  unidade?: string;
  quantidade?: number;
  estoqueMinimo?: number;
  estoqueIdeal?: number;
  valorUnitarioUsd?: number;
  valorUnitarioBrl?: number;
  fornecedorId?: number;
  fornecedorCodigo?: string;
  fornecedorNome?: string;
  fornecedorPais?: string;
  invoiceId?: number;
  invoiceNumero?: string;
  invoiceData?: string;
  loteId?: number;
  loteCodigo?: string;
  loteDataEntrada?: string;
  localizacao?: string;
  prateleira?: string;
  gaveta?: string;
  certificadoConformidade?: string;
  certTipo?: string;
  certNumero?: string;
  certEmissor?: string;
  certDataEmissao?: string;
  certOrgaoAprovacao?: string;
  certAnexoNome?: string;
  certificadoTemAnexo?: boolean;
  certificadoCompleto?: boolean;
  quarentenaMotivo?: string;
  quarentenaInicioEm?: string;
  quarentenaInicioUsuarioNome?: string;
  quarentenaFimEm?: string;
  quarentenaFimUsuarioNome?: string;
  quarentenaDisposicao?: string;
  quarentenaObservacoes?: string;
  dataFabricacao?: string;
  dataValidade?: string;
  shelfLifeMeses?: number;
  status?: string;
  osId?: number;
  dataConsumo?: string;
  observacoes?: string;
  createdAt?: string;
}

/** Linha da planilha de estoque mínimo em lote (Part Number + Est. Mínimo + Est. Ideal). */
export interface EstoqueMinimoLoteLinha {
  partNumber: string;
  estoqueMinimo?: number;
  estoqueIdeal?: number;
}

/** Resultado da atualização em lote de estoque mínimo/ideal. */
export interface EstoqueMinimoLoteResult {
  partNumbersAtualizados: string[];
  partNumbersNaoEncontrados: string[];
  totalItensAtualizados: number;
  linhasProcessadas: number;
}

export interface EntradaEstoque {
  partNumber: string;
  serialNumber?: string;
  descricao?: string;
  unidade?: string;
  quantidade?: number;
  valorUnitarioUsd?: number;
  valorUnitarioBrl?: number;
  fornecedorId: number;
  invoiceId?: number;
  invoiceItemId?: number;
  loteId?: number;
  criarLote?: boolean;
  localizacao?: string;
  prateleira?: string;
  gaveta?: string;
  certificadoConformidade?: string;
  certTipo?: string;
  certNumero?: string;
  certEmissor?: string;
  certDataEmissao?: string;
  certOrgaoAprovacao?: string;
  certAnexoNome?: string;
  certificadoTemAnexo?: boolean;
  certificadoCompleto?: boolean;
  quarentenaMotivo?: string;
  quarentenaInicioEm?: string;
  quarentenaInicioUsuarioNome?: string;
  quarentenaFimEm?: string;
  quarentenaFimUsuarioNome?: string;
  quarentenaDisposicao?: string;
  quarentenaObservacoes?: string;
  dataFabricacao?: string;
  dataValidade?: string;
  shelfLifeMeses?: number;
  observacoes?: string;
}

export interface SaidaRegrasCustomizadas {
  validacaoExtra: boolean;
  motivoMinLength: number;
  osObrigatoria: boolean;
}

export interface EstoqueSaidaRegras extends SaidaRegrasCustomizadas {
  exigeCertificadoPeca: boolean;
}

export interface CertificadoPeca {
  certTipo?: string;
  certNumero?: string;
  certEmissor?: string;
  certDataEmissao?: string;
  dataValidade?: string;
  certOrgaoAprovacao?: string;
  certificadoConformidade?: string;
  certAnexoNome?: string;
  temAnexo?: boolean;
  completo?: boolean;
}

export interface SaidaEstoque {
  itemId: number;
  osId: number;
  quantidade: number;
  motivo?: string;
}

export interface MovimentacaoEstoque {
  id?: number;
  itemEstoqueId?: number;
  itemCodigoRastreio?: string;
  itemPartNumber?: string;
  tipoMovimentacao?: string;
  quantidade?: number;
  quantidadeAnterior?: number;
  quantidadePosterior?: number;
  invoiceId?: number;
  osId?: number;
  loteId?: number;
  localizacaoOrigem?: string;
  localizacaoDestino?: string;
  usuarioId?: number;
  usuarioNome?: string;
  motivo?: string;
  observacoes?: string;
  dataMovimentacao?: string;
  origemSaida?: string;
  idProdutoCatalogo?: number;
  chaveIdempotencia?: string;
}

/** Linhas do relatório GET /estoque/rastreio/saidas-automaticas */
export interface SaidaProdutoRastreioLinha {
  movimentacaoId?: number;
  dataMovimentacao?: string;
  quantidade?: number;
  origemSaida?: string;
  chaveIdempotencia?: string;
  motivo?: string;
  usuarioNome?: string;
  osId?: number;
  idOs?: number;
  dtAberturaOs?: string;
  clienteNome?: string;
  idFcu?: number;
  /** Mesmo padrão da OS (Produto Aeronáutico): pn / fcuCodigo + descrição. */
  fcuPn?: string;
  fcuCodigo?: string;
  fcuDescription?: string;
  partNumber?: string;
  itemEstoqueId?: number;
  codigoRastreio?: string;
  idProdutoCatalogo?: number;
  produtoCatalogoNome?: string;
}

/** Linha de produto do kit dentro de uma OS (GET kit-catalogo-por-os-legado). */
export interface KitProdutoPorOsLinha {
  informacaoLegada?: boolean;
  confirmadoEmEstoque?: boolean;
  origemInformacao?: string;
  produtoCatalogoId?: number;
  productPn?: string;
  productName?: string;
  quantidadeKit?: number;
}

/** Uma OS com resumo do kit; `produtosKit` preenchido pelo backend (expandir na UI). */
export interface OsKitRastreioResumo {
  osId?: number;
  idOs?: number;
  clienteNome?: string;
  dtAberturaOs?: string;
  idFcu?: number;
  fcuPn?: string;
  fcuCodigo?: string;
  fcuDescription?: string;
  quantidadeItensKit?: number;
  quantidadeItensConfirmadosEstoque?: number;
  produtosKit?: KitProdutoPorOsLinha[];
}

export interface PageResponse<T> {
  content: T[];
  totalElements?: number;
  totalPages?: number;
  page: number;
  size: number;
}

// ==================== SERVIÇO ====================

@Injectable({ providedIn: 'root' })
export class EstoqueService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private base = `${environment.apiUrl}/estoque`;

  private headersUsuarioAcao(): HttpHeaders {
    const u = this.auth.getCurrentUser();
    let headers = new HttpHeaders();
    if (u) {
      headers = headers
        .set('X-User-Id', String(u.id))
        .set('X-User-Name', u.nome || u.email || 'Usuario');
    }
    return headers;
  }

  private corpoAcaoInvoice(motivo: string): InvoiceAcaoRequest {
    const u = this.auth.getCurrentUser();
    return { motivo, usuarioEmail: u?.email };
  }

  // ==================== FORNECEDORES ====================

  listarFornecedores(params?: { page?: number; size?: number; search?: string }): Observable<PageResponse<Fornecedor>> {
    let httpParams = new HttpParams();
    if (params?.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params?.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);
    return this.http.get<PageResponse<Fornecedor>>(`${this.base}/fornecedores`, { params: httpParams });
  }

  buscarFornecedor(id: number): Observable<Fornecedor> {
    return this.http.get<Fornecedor>(`${this.base}/fornecedores/${id}`);
  }

  criarFornecedor(fornecedor: Fornecedor): Observable<Fornecedor> {
    return this.http.post<Fornecedor>(`${this.base}/fornecedores`, fornecedor);
  }

  atualizarFornecedor(id: number, fornecedor: Fornecedor): Observable<Fornecedor> {
    return this.http.put<Fornecedor>(`${this.base}/fornecedores/${id}`, fornecedor);
  }

  excluirFornecedor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/fornecedores/${id}`);
  }

  // ==================== INVOICES ====================

  listarInvoices(params?: {
    page?: number;
    size?: number;
    search?: string;
    status?: string;
    incluirInativas?: boolean;
    /** Ativas e não canceladas — dropdowns de entrada/lote */
    somenteUtilizaveis?: boolean;
  }): Observable<PageResponse<Invoice>> {
    let httpParams = new HttpParams();
    if (params?.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params?.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.incluirInativas) httpParams = httpParams.set('incluirInativas', 'true');
    if (params?.somenteUtilizaveis) httpParams = httpParams.set('somenteUtilizaveis', 'true');
    return this.http.get<PageResponse<Invoice>>(`${this.base}/invoices`, { params: httpParams });
  }

  buscarInvoice(id: number): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.base}/invoices/${id}`);
  }

  criarInvoice(invoice: Invoice): Observable<Invoice> {
    return this.http.post<Invoice>(`${this.base}/invoices`, invoice);
  }

  atualizarInvoice(id: number, invoice: Invoice): Observable<Invoice> {
    return this.http.put<Invoice>(`${this.base}/invoices/${id}`, invoice);
  }

  validarInativacaoInvoice(id: number): Observable<InvoiceInativacaoValidacao> {
    return this.http.get<InvoiceInativacaoValidacao>(`${this.base}/invoices/${id}/validacao-inativacao`);
  }

  listarAuditoriaInvoice(id: number): Observable<InvoiceAuditoria[]> {
    return this.http.get<InvoiceAuditoria[]>(`${this.base}/invoices/${id}/auditoria`);
  }

  inativarInvoice(id: number, motivo: string): Observable<{ sucesso: boolean; mensagem: string }> {
    return this.http.post<{ sucesso: boolean; mensagem: string }>(
      `${this.base}/invoices/${id}/inativar`,
      this.corpoAcaoInvoice(motivo),
      { headers: this.headersUsuarioAcao() }
    );
  }

  cancelarInvoice(id: number, motivo: string): Observable<{ sucesso: boolean; mensagem: string; invoice?: Invoice }> {
    return this.http.post<{ sucesso: boolean; mensagem: string; invoice?: Invoice }>(
      `${this.base}/invoices/${id}/cancelar`,
      this.corpoAcaoInvoice(motivo),
      { headers: this.headersUsuarioAcao() }
    );
  }

  restaurarInvoice(id: number, motivo: string): Observable<{ sucesso: boolean; mensagem: string; invoice?: Invoice }> {
    return this.http.post<{ sucesso: boolean; mensagem: string; invoice?: Invoice }>(
      `${this.base}/invoices/${id}/restaurar`,
      this.corpoAcaoInvoice(motivo),
      { headers: this.headersUsuarioAcao() }
    );
  }

  adicionarItemInvoice(invoiceId: number, item: InvoiceItem): Observable<InvoiceItem> {
    return this.http.post<InvoiceItem>(`${this.base}/invoices/${invoiceId}/itens`, item);
  }

  /** Compara quantidade solicitada por P/N com soma de itens DISPONÍVEIS no estoque. */
  consultarDisponibilidade(linhas: ConsultaDisponibilidadeLinha[]): Observable<DisponibilidadePnResult[]> {
    return this.http.post<DisponibilidadePnResult[]>(`${this.base}/disponibilidade/consulta`, linhas);
  }

  listarLotes(params?: { page?: number; size?: number; search?: string; status?: string; invoiceId?: number }): Observable<PageResponse<Lote>> {
    let httpParams = new HttpParams();
    if (params?.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params?.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.invoiceId) httpParams = httpParams.set('invoiceId', params.invoiceId.toString());
    return this.http.get<PageResponse<Lote>>(`${this.base}/lotes`, { params: httpParams });
  }

  // ==================== ITENS DE ESTOQUE ====================

  listarItensEstoque(params?: { page?: number; size?: number; search?: string; status?: string; fornecedorId?: number; invoiceId?: number; loteId?: number }): Observable<PageResponse<ItemEstoque>> {
    let httpParams = new HttpParams();
    if (params?.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params?.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.fornecedorId) httpParams = httpParams.set('fornecedorId', params.fornecedorId.toString());
    if (params?.invoiceId) httpParams = httpParams.set('invoiceId', params.invoiceId.toString());
    if (params?.loteId) httpParams = httpParams.set('loteId', params.loteId.toString());
    return this.http.get<PageResponse<ItemEstoque>>(`${this.base}/itens`, { params: httpParams });
  }

  buscarItemEstoque(id: number): Observable<ItemEstoque> {
    return this.http.get<ItemEstoque>(`${this.base}/itens/${id}`);
  }

  atualizarItemEstoque(id: number, dto: Partial<ItemEstoque>): Observable<ItemEstoque> {
    return this.http.put<ItemEstoque>(`${this.base}/itens/${id}`, dto);
  }

  excluirItemEstoque(id: number, motivo?: string): Observable<ItemEstoque> {
    let httpParams = new HttpParams();
    if (motivo) httpParams = httpParams.set('motivo', motivo);
    return this.http.delete<ItemEstoque>(`${this.base}/itens/${id}`, { params: httpParams });
  }

  /** Atualiza estoque mínimo e ideal em lote por Part Number (planilha). */
  atualizarEstoqueMinimoLote(linhas: EstoqueMinimoLoteLinha[]): Observable<EstoqueMinimoLoteResult> {
    return this.http.post<EstoqueMinimoLoteResult>(`${this.base}/itens/atualizar-estoque-minimo-lote`, linhas);
  }

  /**
   * Consulta item por qualquer código (rastreio, part number, serial number ou número da invoice).
   * Usado pelo leitor de código de barras ou QR Code
   */
  consultarPorCodigo(codigo: string): Observable<ItemEstoque> {
    return this.http.get<ItemEstoque>(`${this.base}/consulta/${encodeURIComponent(codigo)}`);
  }

  /**
   * Busca todos os itens com um determinado part number
   * Retorna lista de itens (pode haver múltiplos com mesmo P/N)
   */
  buscarPorPartNumber(partNumber: string): Observable<PageResponse<ItemEstoque>> {
    return this.http.get<PageResponse<ItemEstoque>>(`${this.base}/consulta/pn/${encodeURIComponent(partNumber)}`);
  }

  /**
   * Entrada de mercadoria no estoque
   */
  entradaEstoque(entrada: EntradaEstoque): Observable<ItemEstoque> {
    return this.http.post<ItemEstoque>(`${this.base}/entrada`, entrada);
  }

  /**
   * Saída de mercadoria do estoque
   */
  saidaEstoque(saida: SaidaEstoque): Observable<ItemEstoque> {
    return this.http.post<ItemEstoque>(`${this.base}/saida`, saida);
  }

  /** Regras de saída do tenant (certificado, validação extra, etc.). */
  getSaidaRegras(): Observable<EstoqueSaidaRegras> {
    return this.http.get<EstoqueSaidaRegras>(`${this.base}/saida/regras`);
  }

  /** Regras customizadas de saída (requer flag {@code estoque.saida.validacaoExtra} no tenant). */
  getSaidaRegrasCustomizadas(): Observable<SaidaRegrasCustomizadas> {
    return this.http.get<SaidaRegrasCustomizadas>(`${this.base}/saida/regras-customizadas`);
  }

  obterCertificado(itemId: number): Observable<CertificadoPeca> {
    return this.http.get<CertificadoPeca>(`${this.base}/itens/${itemId}/certificado`);
  }

  salvarCertificado(itemId: number, body: CertificadoPeca): Observable<CertificadoPeca> {
    return this.http.put<CertificadoPeca>(`${this.base}/itens/${itemId}/certificado`, body);
  }

  uploadCertificadoAnexo(itemId: number, file: File): Observable<CertificadoPeca> {
    const fd = new FormData();
    fd.append('file', file, file.name);
    return this.http.post<CertificadoPeca>(`${this.base}/itens/${itemId}/certificado/anexo`, fd);
  }

  downloadCertificadoAnexo(itemId: number): Observable<Blob> {
    return this.http.get(`${this.base}/itens/${itemId}/certificado/anexo`, { responseType: 'blob' });
  }

  listarQuarentena(params?: { page?: number; size?: number; search?: string }): Observable<PageResponse<ItemEstoque>> {
    let httpParams = new HttpParams();
    if (params?.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params?.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);
    return this.http.get<PageResponse<ItemEstoque>>(`${this.base}/quarentena`, { params: httpParams });
  }

  enviarQuarentena(itemId: number, body: { motivo: string; observacoes?: string }): Observable<ItemEstoque> {
    return this.http.post<ItemEstoque>(`${this.base}/itens/${itemId}/quarentena`, body);
  }

  liberarQuarentena(itemId: number, body: { disposicao: string; observacoes?: string }): Observable<ItemEstoque> {
    return this.http.post<ItemEstoque>(`${this.base}/itens/${itemId}/quarentena/liberar`, body);
  }

  /**
   * URL bruta do endpoint — não usar em `<img src>` (sem JWT). Preferir {@link loadQrCodeDataUrl}.
   */
  getQrCodeUrl(itemId: number, tamanho: number = 200): string {
    return `${this.base}/itens/${itemId}/qrcode?tamanho=${tamanho}`;
  }

  /**
   * Obtém imagem do QR Code autenticada (blob), útil para impressão em popup.
   */
  getQrCodeBlob(itemId: number, tamanho: number = 200): Observable<Blob> {
    return this.http.get(`${this.base}/itens/${itemId}/qrcode?tamanho=${tamanho}`, { responseType: 'blob' });
  }

  /** QR Code autenticado como data URL — use em preview `<img>` e etiquetas. */
  loadQrCodeDataUrl(itemId: number, tamanho: number = 200): Observable<string> {
    return this.getQrCodeBlob(itemId, tamanho).pipe(
      switchMap(blob => {
        if (!blob?.size || (blob.type && !blob.type.startsWith('image/'))) {
          return throwError(() => new Error('invalid-qr-blob'));
        }
        return from(readBlobAsDataUrl(blob));
      })
    );
  }

  consultaQrRegras(): Observable<{ historicoExtendido: boolean; historicoLimite: number }> {
    return this.http.get<{ historicoExtendido: boolean; historicoLimite: number }>(
      `${this.base}/consulta-qr/regras`
    );
  }

  // ==================== MOVIMENTAÇÕES ====================

  listarMovimentacoes(params?: {
    page?: number;
    size?: number;
    itemId?: number;
    tipo?: string;
    partNumber?: string;
    dataInicio?: string;
    dataFim?: string;
  }): Observable<PageResponse<MovimentacaoEstoque>> {
    let httpParams = new HttpParams();
    if (params?.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params?.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
    if (params?.itemId) httpParams = httpParams.set('itemId', params.itemId.toString());
    if (params?.tipo) httpParams = httpParams.set('tipo', params.tipo);
    if (params?.partNumber?.trim()) httpParams = httpParams.set('partNumber', params.partNumber.trim());
    if (params?.dataInicio) httpParams = httpParams.set('dataInicio', params.dataInicio);
    if (params?.dataFim) httpParams = httpParams.set('dataFim', params.dataFim);
    return this.http.get<PageResponse<MovimentacaoEstoque>>(`${this.base}/movimentacoes`, { params: httpParams });
  }

  /** Relatório de saídas automáticas (kit FCU na OS e trocas eventuais pagas). */
  listarRastreioSaidasAutomaticas(params?: {
    page?: number;
    size?: number;
    partNumber?: string;
    origemSaida?: string;
    osId?: number;
    produtoCatalogoId?: number;
    dataInicio?: string;
    dataFim?: string;
  }): Observable<PageResponse<SaidaProdutoRastreioLinha>> {
    let httpParams = new HttpParams();
    if (params?.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params?.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
    if (params?.partNumber) httpParams = httpParams.set('partNumber', params.partNumber);
    if (params?.origemSaida && typeof params.origemSaida === 'string') {
      httpParams = httpParams.set('origemSaida', params.origemSaida);
    }
    if (params?.osId != null) httpParams = httpParams.set('osId', params.osId.toString());
    if (params?.produtoCatalogoId != null) httpParams = httpParams.set('produtoCatalogoId', params.produtoCatalogoId.toString());
    if (params?.dataInicio) httpParams = httpParams.set('dataInicio', params.dataInicio);
    if (params?.dataFim) httpParams = httpParams.set('dataFim', params.dataFim);
    return this.http.get<PageResponse<SaidaProdutoRastreioLinha>>(`${this.base}/rastreio/saidas-automaticas`, { params: httpParams });
  }

  /** Kit FCU por OS: uma linha por OS com `produtosKit` aninhados. */
  listarKitCatalogoFcuPorOsLegado(params?: {
    page?: number;
    size?: number;
    partNumber?: string;
    osId?: number;
    produtoCatalogoId?: number;
    dataInicio?: string;
    dataFim?: string;
  }): Observable<PageResponse<OsKitRastreioResumo>> {
    let httpParams = new HttpParams();
    if (params?.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params?.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
    if (params?.partNumber) httpParams = httpParams.set('partNumber', params.partNumber);
    if (params?.osId != null) httpParams = httpParams.set('osId', params.osId.toString());
    if (params?.produtoCatalogoId != null) {
      httpParams = httpParams.set('produtoCatalogoId', params.produtoCatalogoId.toString());
    }
    if (params?.dataInicio) httpParams = httpParams.set('dataInicio', params.dataInicio);
    if (params?.dataFim) httpParams = httpParams.set('dataFim', params.dataFim);
    return this.http.get<PageResponse<OsKitRastreioResumo>>(`${this.base}/rastreio/kit-catalogo-por-os-legado`, {
      params: httpParams
    });
  }

  // ==================== RASTREIO / LINHA DO TEMPO (COMPLIANCE) ====================

  linhaTempoPorCodigo(codigo: string): Observable<ItemLinhaTempo> {
    const encoded = encodeURIComponent(codigo.trim());
    return this.http.get<ItemLinhaTempo>(`${this.base}/rastreio/${encoded}/linha-tempo`);
  }

  downloadLinhaTempoPdf(codigo: string, locale: string): Observable<Blob> {
    const encoded = encodeURIComponent(codigo.trim());
    const params = new HttpParams().set('locale', locale);
    return this.http.get(`${this.base}/rastreio/${encoded}/linha-tempo/pdf`, {
      params,
      responseType: 'blob'
    });
  }
}

export interface ItemLinhaTempo {
  item: ItemLinhaTempoResumo;
  eventos: LinhaTempoEvento[];
  totalEventos: number;
}

export interface ItemLinhaTempoResumo {
  id: number;
  codigoRastreio?: string;
  partNumber?: string;
  serialNumber?: string;
  descricao?: string;
  status?: string;
  certificadoConformidade?: string;
  dataValidade?: string;
  loteCodigo?: string;
  invoiceNumero?: string;
  fornecedorNome?: string;
  localizacao?: string;
  osConsumoNumero?: number;
  osConsumoId?: number;
}

export interface LinhaTempoEvento {
  movimentacaoId?: number;
  tipo?: string;
  dataHora?: string;
  quantidade?: string;
  quantidadeAnterior?: string;
  quantidadePosterior?: string;
  usuarioNome?: string;
  motivo?: string;
  osNumero?: number;
  osIdInterno?: number;
  origemSaida?: string;
  localizacaoOrigem?: string;
  localizacaoDestino?: string;
}
