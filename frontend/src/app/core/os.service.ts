import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { SUPPRESS_FORBIDDEN_TOAST } from '../auth/http-context-tokens';
import { environment } from '../../environments/environment';

export interface OSSolicitacaoTrocaItem {
  id?: number;
  idProduto?: number;
  produtoNome?: string;
  produtoDescricao?: string;
  produtoPn?: string;
  produtoSn?: string;
  quantidade?: number;
  valorUnitario?: number;
  valorTotal?: number;
  /** null = pendente análise; true = pago; false = não pago */
  pago?: boolean | null;
  ordem?: number;
}

export interface OSPendenteTrocaPagamento {
  id: number;
  idOs: number;
  clienteNome?: string;
  itensPendentesPagamento: number;
}

/** Linha da consulta de OS com trocas eventuais (backend: OsConsultaTrocasEventuaisLinhaDto) */
export interface OsConsultaTrocasEventuaisLinha {
  id: number;
  idOs: number;
  clienteNome?: string;
  dtAbertura?: string;
  quantidadeItens: number;
  itensPagoPendente: number;
  itensPagoSim: number;
  itensPagoNao: number;
  temComentario: boolean;
}

export interface OSFile {
  id?: number;
  osId?: number;
  fileName: string;
  originalName: string;
  filePath?: string;
  fileSize?: number;
  contentType?: string;
  fileExtension?: string;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
}

export interface OS {
  naoConformidadesTotal?: number;
  id?: number;
  idOs: number;
  adsDas?: string;
  ataManual?: string;
  clienteNome?: string;
  dataConclusaoServ?: string;
  dataFechamento?: string;
  dataRevManual?: string;
  dtAbertura?: string;
  // IDs para persistência (backend espera idFabricanteId e idFcuId)
  idFabricanteId?: number;
  idFcuId?: number;
  // Objetos relacionados (vêm do backend)
  idFabricante?: any; // FabricanteDto
  idFcu?: any; // FcuDto
  fabricante?: any; // FabricanteDto
  fcu?: any; // FcuDto
  // Aliases para compatibilidade (usados no frontend)
  fabricanteId?: number;
  fcuId?: number;
  // Dados do Fabricante (carregados via relacionamento)
  fabricanteNome?: string;
  // Dados do FCU (carregados via relacionamento)
  fcuCodigo?: string;
  fcuDescription?: string;
  fcuModelo?: string;
  fcuPn?: string;
  fcuSerialNumber?: string;
  tsn?: string;
  tso?: string;
  marcasMatricula?: string;
  motor?: string;
  snMotor?: string;
  manualPn?: string;
  numOsOriginal?: string;
  numRevisao?: string;
  obsConclusaoServ?: string;
  obsFimServ?: string;
  serialNumber?: string;
  obsIniServ?: string;
  // Tipo de Serviço - nome armazenado no banco (para compatibilidade)
  tipoServico?: string;
  // ID do tipo de serviço (para o frontend selecionar na combo)
  tipoServicoId?: number;
  // Objeto TipoServico relacionado (para acesso como os.tipoServicoObj.nome)
  tipoServicoObj?: { id: number; nome: string; isActive?: boolean };
  // Campos de observações do serviço
  inicioServico?: string;
  fimServico?: string;
  tituloAds?: string;
  tituloAfins?: string;
  boletinsServAfins?: string;
  partNumber?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  isActive?: boolean;
  fileNames?: string[];
  files?: OSFile[];
  solicitacaoTrocasComentario?: string | null;
  solicitacaoTrocasItens?: OSSolicitacaoTrocaItem[];
  /** Marca a OS que tem déficit registrado no kit FCU (estoque insuficiente ao salvar). */
  temDeficitKitFcu?: boolean;
  mecanicoResponsavelId?: number | null;
  mecanicoResponsavelNome?: string | null;
  mecanicoAtribuidoPorId?: number | null;
  mecanicoAtribuidoPorNome?: string | null;
  mecanicoAtribuidoEm?: string | null;
  statusOperacional?: string | null;
  statusExecucao?: string | null;
  execucaoIniciadaEm?: string | null;
  execucaoPausadaEm?: string | null;
  execucaoFinalizadaEm?: string | null;
  jaEditada?: boolean | null;
  podeEditar?: boolean | null;
  /** TOTAL | MECANICO | BIBLIOTECA | NENHUM */
  escopoEdicao?: string | null;
  podeReencaminhar?: boolean | null;
  podeControlarExecucao?: boolean | null;
  modalSomenteLeitura?: boolean | null;
  diasSemAtribuicao?: number | null;
  alertaSemAtribuicao?: boolean | null;

  crsEmitido?: boolean;
  crsEmitidoEm?: string;
  crsCertificadoNumero?: string;
  crsLiberadoPorNome?: string;
  crsLiberadoPorCargo?: string;
  tarefasDadosTecnicos?: OsTarefaDadoTecnicoVinculo[];
}

export interface OsTarefaDadoTecnicoVinculo {
  id?: number;
  ordem?: number;
  tarefaDescricao: string;
  tipoDado: 'AD_SB' | 'MANUAL' | 'OUTRO';
  aeroDiretrizId?: number | null;
  publicacaoTecnicaId?: number | null;
  referenciaExterna?: string | null;
  tituloExibicao?: string | null;
  numeroExibicao?: string | null;
  observacao?: string | null;
}

/** Item de déficit do kit FCU (preview ou detalhe da OS). */
export interface KitFcuDeficitItem {
  cadastradoNoCatalogo?: boolean;
  temEntradaEstoque?: boolean;
  situacaoEstoque?: string;
  situacaoLabel?: string;
  quantidadeEntradaPendente?: number;
  produtoCatalogoId?: number;
  productPn?: string;
  productName?: string;
  quantidadeNecessaria: number;
  quantidadeDisponivel: number;
  deficit: number;
}

/** Preview de déficit do kit FCU para um FCU informado (antes de salvar a OS). */
export interface KitFcuDeficitPreview {
  fcuId?: number;
  temDeficit: boolean;
  quantidadeItensFaltantes: number;
  itens: KitFcuDeficitItem[];
}

export interface Page<T> { 
  items: T[]; 
  totalElements: number; 
  totalPages: number; 
  page: number; 
  size: number; 
  sort?: string; 
}

export interface MecanicoOption {
  id: number;
  nome: string;
  email?: string;
}

export interface OSCargaMecanico {
  mecanicoId: number;
  mecanicoNome: string;
  atribuidasPeriodo: number;
  emAndamentoPeriodo: number;
  concluidasPeriodo: number;
  cargaAtual: number;
}

export interface OSCargaDashboard {
  periodo: string;
  dataInicio: string;
  dataFim: string;
  totalSemAtribuicao: number;
  totalAlertaSemAtribuicao5Dias: number;
  totalEmAndamento: number;
  mecanicos: OSCargaMecanico[];
}


@Injectable({ providedIn: 'root' })
export class OSService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/os`;

  list(params: any = {}, opts?: { suppressForbiddenToast?: boolean }) {
    let hp = new HttpParams();
    // Filtrar apenas registros ativos por padrão
    hp = hp.set('isActive', 'true');
    for (const [k,v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') hp = hp.set(k, String(v));
    const context = opts?.suppressForbiddenToast ? new HttpContext().set(SUPPRESS_FORBIDDEN_TOAST, true) : undefined;
    return this.http.get<Page<OS>>(this.base, context ? { params: hp, context } : { params: hp });
  }

  update(id: number, body: any) { 
    return this.http.put<OS>(`${this.base}/${id}`, body); 
  }

  reabrir(id: number, justificativa: string) {
    return this.http.post<{ success: boolean; message: string; os: OS }>(
      `${this.base}/${id}/reabrir`,
      { justificativa }
    );
  }

  delete(id: number) { 
    const body = { isActive: false };
    return this.http.put<OS>(`${this.base}/${id}`, body); 
  }

  create(body: any) { 
    return this.http.post<OS>(this.base, body); 
  }

  getById(id: number) {
    return this.http.get<OS>(`${this.base}/${id}`);
  }

  /** Suprimento / Admin / Diretor — OS com itens de trocas sem pagamento confirmado */
  listPendentesPagamentoTrocas() {
    return this.http.get<OSPendenteTrocaPagamento[]>(`${this.base}/pendentes-pagamento-trocas`);
  }

  /** OS ativas com itens de troca e/ou comentário de solicitação (paginado) */
  listConsultaTrocasEventuais(params: { page?: number; size?: number; sort?: string; q?: string } = {}) {
    let hp = new HttpParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') {
        hp = hp.set(k, String(v));
      }
    }
    return this.http.get<Page<OsConsultaTrocasEventuaisLinha>>(`${this.base}/consulta-trocas-eventuais`, {
      params: hp
    });
  }

  /**
   * Preview de déficit do kit FCU para um FCU. Usado antes de salvar a OS para
   * pedir confirmação ao usuário caso falte estoque para algum item do kit.
   */
  previewKitFcuDeficit(fcuId: number) {
    return this.http.get<KitFcuDeficitPreview>(`${this.base}/preview-kit-fcu-deficit/${fcuId}`);
  }

  /** Itens de déficit registrados no momento em que a OS foi salva (modal da listagem). */
  listKitFcuDeficit(osId: number) {
    return this.http.get<KitFcuDeficitItem[]>(`${this.base}/${osId}/kit-fcu-deficit`);
  }

  listarMecanicos() {
    return this.http.get<MecanicoOption[]>(`${this.base}/mecanicos`);
  }

  encaminhar(osId: number, mecanicoId: number, motivo?: string) {
    return this.http.post<OS>(`${this.base}/${osId}/encaminhar`, { mecanicoId, motivo });
  }

  iniciarExecucao(osId: number, observacao?: string) {
    return this.http.post<OS>(`${this.base}/${osId}/execucao/iniciar`, { observacao });
  }

  pausarExecucao(osId: number, observacao?: string) {
    return this.http.post<OS>(`${this.base}/${osId}/execucao/pausar`, { observacao });
  }

  retomarExecucao(osId: number, observacao?: string) {
    return this.http.post<OS>(`${this.base}/${osId}/execucao/retomar`, { observacao });
  }

  finalizarExecucao(osId: number, observacao?: string) {
    return this.http.post<OS>(`${this.base}/${osId}/execucao/finalizar`, { observacao });
  }

  dashboardCarga(periodo: 'DIA' | 'SEMANA' | 'MES' = 'DIA') {
    return this.http.get<OSCargaDashboard>(`${this.base}/carga-mecanicos`, {
      params: new HttpParams().set('periodo', periodo)
    });
  }

  listarAtribuidasMecanicoPeriodo(mecanicoId: number, periodo: 'DIA' | 'SEMANA' | 'MES' = 'DIA') {
    return this.listarOsCargaMecanico(mecanicoId, periodo, 'ATRIBUIDAS');
  }

  listarOsCargaMecanico(
    mecanicoId: number,
    periodo: 'DIA' | 'SEMANA' | 'MES' = 'DIA',
    tipo: 'ATRIBUIDAS' | 'EM_ANDAMENTO' | 'CONCLUIDAS' | 'CARGA_ATUAL' = 'ATRIBUIDAS'
  ) {
    return this.http.get<OS[]>(`${this.base}/carga-mecanicos/${mecanicoId}/os`, {
      params: new HttpParams().set('periodo', periodo).set('tipo', tipo)
    });
  }

  alertaSemAtribuicao() {
    return this.http.get<{ diasLimite: number; total: number }>(`${this.base}/alerta-sem-atribuicao`);
  }

  listarAlertaSemAtribuicaoOs() {
    return this.http.get<OS[]>(`${this.base}/alerta-sem-atribuicao/os`);
  }

  listarSemAtribuicaoOs() {
    return this.http.get<OS[]>(`${this.base}/sem-atribuicao/os`);
  }

  painelResumo() {
    return this.http.get<OsPainelResumo>(`${this.base}/painel-resumo`, {
      context: new HttpContext().set(SUPPRESS_FORBIDDEN_TOAST, true)
    });
  }
}

export interface OsPainelResumo {
  totalAtivas: number;
  aguardando: number;
  emExecucao: number;
  aguardandoPecas: number;
  inspecao: number;
  prioridadeAog: number;
  crsPendente: number;
}
