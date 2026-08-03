import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TranslationService } from './translation.service';
import { formatUiDateTime } from './locale/locale-intl.util';

/**
 * Interface para registro de auditoria
 */
export interface OSAuditoria {
  id: number;
  idOs: number;
  numeroOs: number;
  acao: 'CRIACAO' | 'ALTERACAO' | 'EXCLUSAO' | 'RESTAURACAO' | 'UPLOAD_ARQUIVO' | 'ASSOCIACAO_ARQUIVO' | 'EXCLUSAO_ARQUIVO';
  acaoDescricao: string;
  campoAlterado?: string;
  campoAlteradoLabel?: string;
  valorAnterior?: string;
  valorNovo?: string;
  snapshotOs?: string;
  usuarioId?: number;
  usuarioNome?: string;
  usuarioEmail?: string;
  ipOrigem?: string;
  userAgent?: string;
  dataHora: string;
}

/**
 * Interface para resposta paginada
 */
export interface PageResponse<T> {
  items: T[];
  totalElements: number;
  page: number;
  size: number;
  totalPages: number;
}

/**
 * Serviço para consulta de auditoria de OS
 */
@Injectable({ providedIn: 'root' })
export class OSAuditoriaService {
  private http = inject(HttpClient);
  private i18n = inject(TranslationService);
  private baseUrl = `${environment.apiUrl}/os-auditoria`;

  /**
   * Busca histórico de auditoria por ID da OS
   */
  buscarPorOs(idOs: number): Observable<OSAuditoria[]> {
    return this.http.get<OSAuditoria[]>(`${this.baseUrl}/os/${idOs}`);
  }

  /**
   * Busca histórico de auditoria por número da OS
   */
  buscarPorNumeroOs(numeroOs: number): Observable<OSAuditoria[]> {
    return this.http.get<OSAuditoria[]>(`${this.baseUrl}/numero/${numeroOs}`);
  }

  /**
   * Busca auditoria com filtros
   */
  buscarComFiltros(params: {
    /** ID interno (PK em `os`) ou omita e use `refOs`. */
    idOs?: number;
    numeroOs?: number;
    /** Um único valor: casa com PK da OS **ou** com o número da OS (evita confusão na tela). */
    refOs?: number;
    acao?: string;
    dataInicio?: string;
    dataFim?: string;
    usuario?: string;
    page?: number;
    size?: number;
  }): Observable<PageResponse<OSAuditoria>> {
    let httpParams = new HttpParams();

    if (params.idOs != null && !Number.isNaN(Number(params.idOs))) {
      httpParams = httpParams.set('idOs', String(params.idOs));
    }
    if (params.numeroOs != null && !Number.isNaN(Number(params.numeroOs))) {
      httpParams = httpParams.set('numeroOs', String(params.numeroOs));
    }
    if (params.refOs != null && !Number.isNaN(Number(params.refOs))) {
      httpParams = httpParams.set('refOs', String(params.refOs));
    }
    if (params.acao) {
      httpParams = httpParams.set('acao', params.acao);
    }
    if (params.dataInicio) {
      httpParams = httpParams.set('dataInicio', params.dataInicio);
    }
    if (params.dataFim) {
      httpParams = httpParams.set('dataFim', params.dataFim);
    }
    if (params.usuario) {
      httpParams = httpParams.set('usuario', params.usuario);
    }
    if (params.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.size !== undefined) {
      httpParams = httpParams.set('size', params.size.toString());
    }

    return this.http.get<PageResponse<OSAuditoria>>(this.baseUrl, { params: httpParams });
  }

  /**
   * Retorna as ações disponíveis
   */
  listarAcoes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/acoes`);
  }

  /**
   * Formata a data para exibição
   */
  formatarData(dataStr: string): string {
    return formatUiDateTime(this.i18n.getCurrentLanguage(), dataStr, 'dateTimeFull');
  }

  /**
   * Retorna a cor do badge baseado na ação
   */
  getAcaoBadgeColor(acao: string): string {
    switch (acao) {
      case 'CRIACAO': return 'success';
      case 'ALTERACAO': return 'info';
      case 'EXCLUSAO': return 'danger';
      case 'RESTAURACAO': return 'warning';
      case 'UPLOAD_ARQUIVO': return 'success';
      case 'ASSOCIACAO_ARQUIVO': return 'info';
      case 'EXCLUSAO_ARQUIVO': return 'warning';
      default: return 'secondary';
    }
  }

  /**
   * Retorna o ícone baseado na ação
   */
  getAcaoIcon(acao: string): string {
    switch (acao) {
      case 'CRIACAO': return 'pi pi-plus-circle';
      case 'ALTERACAO': return 'pi pi-pencil';
      case 'EXCLUSAO': return 'pi pi-trash';
      case 'RESTAURACAO': return 'pi pi-refresh';
      case 'UPLOAD_ARQUIVO': return 'pi pi-upload';
      case 'ASSOCIACAO_ARQUIVO': return 'pi pi-link';
      case 'EXCLUSAO_ARQUIVO': return 'pi pi-times-circle';
      default: return 'pi pi-info-circle';
    }
  }
}
