import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ConformidadePage<T> {
  items: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface ConformidadeAlertasResumo {
  diasJanela: number;
  totalVencidas: number;
  totalProximas: number;
  totalAtivos: number;
  itens: unknown[];
}

export interface SgqDocumento {
  id?: number;
  tipo?: string;
  codigo?: string;
  titulo?: string;
  revisao?: string;
  dataRevisao?: string;
  dataVigencia?: string;
  status?: string;
  referenciaArquivo?: string;
  arquivoNome?: string;
  temArquivo?: boolean;
  arquivoTamanho?: number;
  observacoes?: string;
  ativo?: boolean;
  severidadeAlerta?: string;
}

export interface ConformidadeChecklistItem {
  id?: string;
  label?: string;
  concluido?: boolean;
  responsavel?: string;
  observacao?: string;
}

export interface ConformidadeTreinamento {
  id?: number;
  usuarioId?: number;
  usuarioNome?: string;
  curso?: string;
  cargaHoraria?: number;
  dataConclusao?: string;
  dataValidade?: string;
  certificador?: string;
  observacoes?: string;
  turmaRef?: string;
  presenteLista?: boolean;
  ativo?: boolean;
  severidadeAlerta?: string;
}

export interface ConformidadeContingencia {
  id?: number;
  titulo?: string;
  osId?: number;
  periodoInicio?: string;
  periodoFim?: string;
  checklist?: ConformidadeChecklistItem[];
  status?: string;
  observacoes?: string;
  concluidoEm?: string;
  createdAt?: string;
}

export interface ConformidadeReleaseAceite {
  id?: number;
  versaoApp?: string;
  flywayAte?: string;
  tipoMudanca?: string;
  impactoRegulatorio?: boolean;
  checklist?: ConformidadeChecklistItem[];
  observacoes?: string;
  aceiteUsuarioId?: number;
  aceiteUsuarioNome?: string;
  aceiteEm?: string;
}

export interface ConformidadeReleaseMeta {
  versaoApp?: string;
  flywayAte?: string;
  checklistPadrao?: ConformidadeChecklistItem[];
}

export interface ConformidadeCalibracao {
  id?: number;
  identificador?: string;
  descricao?: string;
  tipo?: string;
  localizacao?: string;
  dataUltimaCalibracao?: string;
  dataProximaCalibracao?: string;
  certificadoRef?: string;
  observacoes?: string;
  ativo?: boolean;
  severidadeAlerta?: string;
}

export interface ConformidadeNcOsOpcao {
  id?: number;
  idOs?: number;
  clienteNome?: string;
  serialNumber?: string;
  marcasMatricula?: string;
  dtAbertura?: string;
}

export interface ConformidadeNcCapaEtapa {
  fase?: string;
  responsavelUsuarioId?: number;
  responsavelUsuarioNome?: string;
  prazo?: string;
  aprovado?: boolean;
  aprovadoUsuarioId?: number;
  aprovadoUsuarioNome?: string;
  aprovadoEm?: string;
  aprovacaoObservacao?: string;
}

export interface ConformidadeNcAnexo {
  id?: number;
  ncId?: number;
  capaFase?: string;
  nomeArquivo?: string;
  nomeOriginal?: string;
  tipoArquivo?: string;
  tamanhoBytes?: number;
  descricao?: string;
  usuarioId?: number;
  usuarioNome?: string;
  dataUpload?: string;
}

export interface ConformidadeNc {
  id?: number;
  numero?: string;
  titulo?: string;
  descricao?: string;
  severidade?: string;
  status?: string;
  /** PK interna da OS (os.id). */
  osId?: number;
  osNumero?: number;
  osClienteNome?: string;
  dataAbertura?: string;
  dataFechamento?: string;
  acaoCorretiva?: string;
  causaRaiz?: string;
  acaoContencao?: string;
  verificacaoEficacia?: string;
  eficaciaConfirmada?: boolean;
  dataVerificacao?: string;
  capaFase?: string;
  observacoes?: string;
  etapas?: ConformidadeNcCapaEtapa[];
  anexos?: ConformidadeNcAnexo[];
}

export interface ConformidadePainelItem {
  categoria?: string;
  severidade?: string;
  titulo?: string;
  detalhe?: string;
  rota?: string;
  referenciaId?: number;
}

export interface ConformidadePainel {
  diasJanela: number;
  totalDocumentosVencidos: number;
  totalDocumentosProximos: number;
  totalTreinamentosVencidos: number;
  totalTreinamentosProximos: number;
  totalCalibracaoVencida: number;
  totalCalibracaoProxima: number;
  totalNcAbertas: number;
  totalAslPendente: number;
  totalAslVencido: number;
  totalSubcontratacaoAlerta: number;
  itens: ConformidadePainelItem[];
}

export interface ConformidadeSmsTendenciaMes {
  mes: string;
  abertas: number;
  fechadas: number;
}

export interface ConformidadeSmsIndicadores {
  diasJanela: number;
  ncAbertas: number;
  ncFechadasPeriodo: number;
  ncAbertasPeriodo: number;
  ncCriticasSemAcao: number;
  ncMediaDiasAbertas: number;
  scoreRisco: number;
  taxaFechamentoPercent: number;
  porSeveridade: Record<string, number>;
  porCapaFase: Record<string, number>;
  tendenciaMensal: ConformidadeSmsTendenciaMes[];
}

export interface ConformidadeEnforcementConfig {
  bloquearCalibracaoVencida: boolean;
  bloquearTreinoObrigatorio: boolean;
  bloquearSubcontratacaoVencida: boolean;
}

export interface ConformidadeTreinamentoObrigatorio {
  id?: number;
  funcaoCodigo?: string;
  curso?: string;
  validadeMeses?: number;
  observacoes?: string;
  ativo?: boolean;
}

export interface SgqDocumentoHistorico {
  id?: number;
  documentoId?: number;
  codigo?: string;
  revisaoAnterior?: string;
  revisaoNova?: string;
  statusAnterior?: string;
  statusNovo?: string;
  observacao?: string;
  usuarioEmail?: string;
  createdAt?: string;
}

export interface OsConformidadeAlertas {
  osId?: number;
  numeroOs?: number;
  alertas: string[];
  bloqueioMaterial?: boolean;
}

export interface ConformidadeSubcontratacao {
  id?: number;
  razaoSocial?: string;
  certificadoPart145?: string;
  escopo?: string;
  validadeCertificado?: string;
  osId?: number;
  status?: string;
  observacoes?: string;
  severidadeAlerta?: string;
}

@Injectable({ providedIn: 'root' })
export class ConformidadeSgqService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  documentos = {
    listar: (p: { page?: number; size?: number; q?: string; tipo?: string; status?: string }) => {
      let params = new HttpParams();
      if (p.page != null) params = params.set('page', String(p.page));
      if (p.size != null) params = params.set('size', String(p.size));
      if (p.q) params = params.set('q', p.q);
      if (p.tipo) params = params.set('tipo', p.tipo);
      if (p.status) params = params.set('status', p.status);
      return this.http.get<ConformidadePage<SgqDocumento>>(`${this.api}/conformidade/documentos`, { params });
    },
    alertas: (dias = 60) =>
      this.http.get<ConformidadeAlertasResumo>(`${this.api}/conformidade/documentos/alertas`, {
        params: new HttpParams().set('dias', String(dias))
      }),
    criar: (body: Partial<SgqDocumento>) => this.http.post<SgqDocumento>(`${this.api}/conformidade/documentos`, body),
    atualizar: (id: number, body: Partial<SgqDocumento>) =>
      this.http.put<SgqDocumento>(`${this.api}/conformidade/documentos/${id}`, body),
    excluir: (id: number) => this.http.delete<void>(`${this.api}/conformidade/documentos/${id}`),
    uploadArquivo: (id: number, file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      return this.http.post<SgqDocumento>(`${this.api}/conformidade/documentos/${id}/arquivo`, fd);
    },
    downloadArquivo: (id: number) =>
      this.http.get(`${this.api}/conformidade/documentos/${id}/arquivo`, {
        responseType: 'blob',
        observe: 'response'
      }),
    historico: (codigo: string) =>
      this.http.get<SgqDocumentoHistorico[]>(
        `${this.api}/conformidade/documentos/historico/${encodeURIComponent(codigo)}`
      ),
    publicarNovaRevisao: (id: number, body: Partial<SgqDocumento>) =>
      this.http.post<SgqDocumento>(`${this.api}/conformidade/documentos/${id}/nova-revisao`, body)
  };

  treinamentos = {
    listar: (p: { page?: number; size?: number; q?: string; usuarioId?: number }) => {
      let params = new HttpParams();
      if (p.page != null) params = params.set('page', String(p.page));
      if (p.size != null) params = params.set('size', String(p.size));
      if (p.q) params = params.set('q', p.q);
      if (p.usuarioId != null) params = params.set('usuarioId', String(p.usuarioId));
      return this.http.get<ConformidadePage<ConformidadeTreinamento>>(`${this.api}/conformidade/treinamentos`, { params });
    },
    alertas: (dias = 60) =>
      this.http.get<ConformidadeAlertasResumo>(`${this.api}/conformidade/treinamentos/alertas`, {
        params: new HttpParams().set('dias', String(dias))
      }),
    criar: (body: Partial<ConformidadeTreinamento>) =>
      this.http.post<ConformidadeTreinamento>(`${this.api}/conformidade/treinamentos`, body),
    atualizar: (id: number, body: Partial<ConformidadeTreinamento>) =>
      this.http.put<ConformidadeTreinamento>(`${this.api}/conformidade/treinamentos/${id}`, body),
    excluir: (id: number) => this.http.delete<void>(`${this.api}/conformidade/treinamentos/${id}`),
    listaPresencaPdf: (turmaRef: string) =>
      this.http.get(`${this.api}/conformidade/treinamentos/lista-presenca/pdf`, {
        params: new HttpParams().set('turmaRef', turmaRef),
        responseType: 'blob'
      })
  };

  contingencia = {
    listar: (p: { page?: number; size?: number; q?: string; status?: string }) => {
      let params = new HttpParams();
      if (p.page != null) params = params.set('page', String(p.page));
      if (p.size != null) params = params.set('size', String(p.size));
      if (p.q) params = params.set('q', p.q);
      if (p.status) params = params.set('status', p.status);
      return this.http.get<ConformidadePage<ConformidadeContingencia>>(`${this.api}/conformidade/contingencia`, { params });
    },
    checklistPadrao: () =>
      this.http.get<ConformidadeChecklistItem[]>(`${this.api}/conformidade/contingencia/checklist-padrao`),
    criar: (body: Partial<ConformidadeContingencia>) =>
      this.http.post<ConformidadeContingencia>(`${this.api}/conformidade/contingencia`, body),
    atualizar: (id: number, body: Partial<ConformidadeContingencia>) =>
      this.http.put<ConformidadeContingencia>(`${this.api}/conformidade/contingencia/${id}`, body),
    excluir: (id: number) => this.http.delete<void>(`${this.api}/conformidade/contingencia/${id}`)
  };

  releases = {
    listar: (p: { page?: number; size?: number }) => {
      let params = new HttpParams();
      if (p.page != null) params = params.set('page', String(p.page));
      if (p.size != null) params = params.set('size', String(p.size));
      return this.http.get<ConformidadePage<ConformidadeReleaseAceite>>(`${this.api}/conformidade/releases`, { params });
    },
    meta: () => this.http.get<ConformidadeReleaseMeta>(`${this.api}/conformidade/releases/meta`),
    registrar: (body: Partial<ConformidadeReleaseAceite>) =>
      this.http.post<ConformidadeReleaseAceite>(`${this.api}/conformidade/releases`, body)
  };

  calibracao = {
    listar: (p: { page?: number; size?: number; q?: string; tipo?: string }) => {
      let params = new HttpParams();
      if (p.page != null) params = params.set('page', String(p.page));
      if (p.size != null) params = params.set('size', String(p.size));
      if (p.q) params = params.set('q', p.q);
      if (p.tipo) params = params.set('tipo', p.tipo);
      return this.http.get<ConformidadePage<ConformidadeCalibracao>>(`${this.api}/conformidade/calibracao`, { params });
    },
    alertas: (dias = 30) =>
      this.http.get<ConformidadeAlertasResumo>(`${this.api}/conformidade/calibracao/alertas`, {
        params: new HttpParams().set('dias', String(dias))
      }),
    criar: (body: Partial<ConformidadeCalibracao>) =>
      this.http.post<ConformidadeCalibracao>(`${this.api}/conformidade/calibracao`, body),
    atualizar: (id: number, body: Partial<ConformidadeCalibracao>) =>
      this.http.put<ConformidadeCalibracao>(`${this.api}/conformidade/calibracao/${id}`, body),
    excluir: (id: number) => this.http.delete<void>(`${this.api}/conformidade/calibracao/${id}`)
  };

  naoConformidades = {
    listar: (p: { page?: number; size?: number; q?: string; status?: string; severidade?: string }) => {
      let params = new HttpParams();
      if (p.page != null) params = params.set('page', String(p.page));
      if (p.size != null) params = params.set('size', String(p.size));
      if (p.q) params = params.set('q', p.q);
      if (p.status) params = params.set('status', p.status);
      if (p.severidade) params = params.set('severidade', p.severidade);
      return this.http.get<ConformidadePage<ConformidadeNc>>(`${this.api}/conformidade/nao-conformidades`, { params });
    },
    obter: (id: number) =>
      this.http.get<ConformidadeNc>(`${this.api}/conformidade/nao-conformidades/${id}`),
    criar: (body: Partial<ConformidadeNc>) =>
      this.http.post<ConformidadeNc>(`${this.api}/conformidade/nao-conformidades`, body),
    atualizar: (id: number, body: Partial<ConformidadeNc>) =>
      this.http.put<ConformidadeNc>(`${this.api}/conformidade/nao-conformidades/${id}`, body),
    excluir: (id: number) => this.http.delete<void>(`${this.api}/conformidade/nao-conformidades/${id}`),
    buscarOsOpcoes: (q?: string) => {
      let params = new HttpParams();
      if (q) params = params.set('q', q);
      return this.http.get<ConformidadeNcOsOpcao[]>(`${this.api}/conformidade/nao-conformidades/os-opcoes`, {
        params
      });
    },
    aprovarEtapa: (id: number, fase: string, observacao?: string) =>
      this.http.post<ConformidadeNcCapaEtapa>(
        `${this.api}/conformidade/nao-conformidades/${id}/etapas/${fase}/aprovar`,
        { observacao }
      ),
    rejeitarEtapa: (id: number, fase: string, observacao?: string) =>
      this.http.post<ConformidadeNcCapaEtapa>(
        `${this.api}/conformidade/nao-conformidades/${id}/etapas/${fase}/rejeitar`,
        { observacao }
      ),
    listarAnexos: (id: number, capaFase?: string) => {
      let params = new HttpParams();
      if (capaFase) params = params.set('capaFase', capaFase);
      return this.http.get<ConformidadeNcAnexo[]>(`${this.api}/conformidade/nao-conformidades/${id}/anexos`, {
        params
      });
    },
    uploadAnexo: (id: number, file: File, capaFase?: string, descricao?: string) => {
      const fd = new FormData();
      fd.append('file', file);
      if (capaFase) fd.append('capaFase', capaFase);
      if (descricao) fd.append('descricao', descricao);
      return this.http.post<ConformidadeNcAnexo>(`${this.api}/conformidade/nao-conformidades/${id}/anexos`, fd);
    },
    downloadAnexo: (id: number, anexoId: number) =>
      this.http.get(`${this.api}/conformidade/nao-conformidades/${id}/anexos/${anexoId}`, {
        responseType: 'blob',
        observe: 'response'
      }),
    excluirAnexo: (id: number, anexoId: number) =>
      this.http.delete<void>(`${this.api}/conformidade/nao-conformidades/${id}/anexos/${anexoId}`)
  };

  subcontratacao = {
    listar: (p: { page?: number; size?: number; q?: string; status?: string }) => {
      let params = new HttpParams();
      if (p.page != null) params = params.set('page', String(p.page));
      if (p.size != null) params = params.set('size', String(p.size));
      if (p.q) params = params.set('q', p.q);
      if (p.status) params = params.set('status', p.status);
      return this.http.get<ConformidadePage<ConformidadeSubcontratacao>>(`${this.api}/conformidade/subcontratacao`, {
        params
      });
    },
    alertas: (dias = 60) =>
      this.http.get<ConformidadeAlertasResumo>(`${this.api}/conformidade/subcontratacao/alertas`, {
        params: new HttpParams().set('dias', String(dias))
      }),
    criar: (body: Partial<ConformidadeSubcontratacao>) =>
      this.http.post<ConformidadeSubcontratacao>(`${this.api}/conformidade/subcontratacao`, body),
    atualizar: (id: number, body: Partial<ConformidadeSubcontratacao>) =>
      this.http.put<ConformidadeSubcontratacao>(`${this.api}/conformidade/subcontratacao/${id}`, body),
    excluir: (id: number) => this.http.delete<void>(`${this.api}/conformidade/subcontratacao/${id}`)
  };

  painel(dias = 60) {
    return this.http.get<ConformidadePainel>(`${this.api}/conformidade/painel`, {
      params: new HttpParams().set('dias', String(dias))
    });
  }

  smsIndicadores(dias = 60) {
    return this.http.get<ConformidadeSmsIndicadores>(`${this.api}/conformidade/sms/indicadores`, {
      params: new HttpParams().set('dias', String(dias))
    });
  }

  downloadRelatorioSgq(dias = 60) {
    return this.http.get(`${this.api}/conformidade/relatorios/sgq.zip`, {
      params: new HttpParams().set('dias', String(dias)),
      responseType: 'blob'
    });
  }

  triggerRelatorioSgqDownload(blob: Blob): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Relatorio_SGQ_${new Date().toISOString().slice(0, 10)}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }

  enforcementConfig() {
    return this.http.get<ConformidadeEnforcementConfig>(`${this.api}/conformidade/enforcement`);
  }

  updateEnforcementConfig(body: Partial<ConformidadeEnforcementConfig>) {
    return this.http.put<ConformidadeEnforcementConfig>(`${this.api}/conformidade/enforcement`, body);
  }

  alertasOs(osId: number) {
    return this.http.get<OsConformidadeAlertas>(`${this.api}/os/${osId}/conformidade-alertas`);
  }

  treinamentosObrigatorios = {
    listar: (p: { page?: number; size?: number; funcao?: string; q?: string }) => {
      let params = new HttpParams();
      if (p.page != null) params = params.set('page', String(p.page));
      if (p.size != null) params = params.set('size', String(p.size));
      if (p.funcao) params = params.set('funcao', p.funcao);
      if (p.q) params = params.set('q', p.q);
      return this.http.get<ConformidadePage<ConformidadeTreinamentoObrigatorio>>(
        `${this.api}/conformidade/treinamentos-obrigatorios`,
        { params }
      );
    },
    criar: (body: Partial<ConformidadeTreinamentoObrigatorio>) =>
      this.http.post<ConformidadeTreinamentoObrigatorio>(`${this.api}/conformidade/treinamentos-obrigatorios`, body),
    atualizar: (id: number, body: Partial<ConformidadeTreinamentoObrigatorio>) =>
      this.http.put<ConformidadeTreinamentoObrigatorio>(`${this.api}/conformidade/treinamentos-obrigatorios/${id}`, body),
    excluir: (id: number) => this.http.delete<void>(`${this.api}/conformidade/treinamentos-obrigatorios/${id}`)
  };
}
