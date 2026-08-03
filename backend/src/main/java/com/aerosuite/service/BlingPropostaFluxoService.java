package com.aerosuite.service;

import com.aerosuite.domain.BlingNfeRegistro;
import com.aerosuite.domain.BlingPropostaFluxoEvento;
import com.aerosuite.domain.OS;
import com.aerosuite.domain.PropostaBlingPedido;
import com.aerosuite.domain.PropostaComercial;
import com.aerosuite.domain.TenantBlingFiscalConfig;
import com.aerosuite.domain.TenantConstants;
import com.aerosuite.integration.bling.BlingNfeDetailDto;
import io.quarkus.panache.common.Page;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.integration.bling.BlingFluxoRetryResultDto;
import com.aerosuite.integration.bling.BlingNfeEmitResultDto;
import com.aerosuite.integration.bling.BlingPropostaFluxoEventoDto;
import com.aerosuite.integration.bling.BlingPropostaFluxoPassoDto;
import com.aerosuite.integration.bling.BlingPropostaFluxoViewDto;
import com.aerosuite.security.TenantDataAccess;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;
import java.util.ArrayList;
import java.util.List;
import org.jboss.logging.Logger;

/**
 * Orquestra o fluxo automatizado proposta → pedido Bling → OS → NF-e com rastreio informativo.
 */
@ApplicationScoped
public class BlingPropostaFluxoService {

    public static final String ETAPA_PEDIDO = "PEDIDO_VINCULADO";
    public static final String ETAPA_OS_GERADA = "OS_GERADA";
    public static final String ETAPA_OS_FALHA = "OS_GERACAO_FALHA";
    public static final String ETAPA_OS_CONCLUIDA = "OS_CONCLUIDA";
    public static final String ETAPA_NFE_SOLICITADA = "NFE_SOLICITADA";
    public static final String ETAPA_NFE_EMITIDA = "NFE_EMITIDA";
    public static final String ETAPA_NFE_EXISTENTE = "NFE_JA_EXISTENTE";
    public static final String ETAPA_NFE_FALHA = "NFE_FALHA";

    public static final String STATUS_OK = "OK";
    public static final String STATUS_FAILED = "FAILED";
    public static final String STATUS_SKIPPED = "SKIPPED";
    public static final String STATUS_PENDING = "PENDING";

    private static final Logger LOG = Logger.getLogger(BlingPropostaFluxoService.class);

    @Inject
    PropostaComercialOsBridgeService osBridgeService;

    @Inject
    BlingFiscalSyncService fiscalSyncService;

    @Inject
    TenantBlingFiscalConfigService fiscalConfigService;

    @Inject
    TenantDataAccess tenantDataAccess;

    @Inject
    TenantHibernateScope tenantHibernateScope;

    public BlingPropostaFluxoViewDto viewForProposta(long tenantId, long propostaId) {
        requireProposta(tenantId, propostaId);
        return buildView(tenantId, propostaId);
    }

    public BlingPropostaFluxoViewDto viewForOs(long tenantId, long osId) {
        PropostaComercial proposta = PropostaComercial.findByOsId(tenantId, osId);
        if (proposta == null) {
            return null;
        }
        return buildView(tenantId, proposta.id);
    }

    /**
     * Reprocessa automações pendentes (falhas ou etapas acionáveis) em lote — usado pelo scheduler.
     */
    @Transactional
    public int retryPendingAutomationsBatch(int limit) {
        if (limit <= 0) {
            return 0;
        }
        List<PropostaBlingPedido> pedidos = PropostaBlingPedido.find("order by pushedAt desc")
                .page(Page.of(0, Math.max(limit * 4, 20)))
                .list();
        int processed = 0;
        for (PropostaBlingPedido pedido : pedidos) {
            if (pedido == null || pedido.tenantId == null || pedido.propostaComercialId == null) {
                continue;
            }
            BlingPropostaFluxoViewDto view = buildView(pedido.tenantId, pedido.propostaComercialId);
            if (!view.retryDisponivel) {
                continue;
            }
            try {
                final long tenantId = pedido.tenantId;
                final long propostaId = pedido.propostaComercialId;
                tenantHibernateScope.runInNewTransaction(tenantId, () -> retryAutomations(tenantId, propostaId));
                processed++;
            } catch (Exception e) {
                LOG.warnf(e, "Retry automático falhou proposta %d", pedido.propostaComercialId);
            }
            if (processed >= limit) {
                break;
            }
        }
        return processed;
    }

    @Transactional
    public void runPostPedidoAutomations(long tenantId, PropostaComercial proposta, TenantBlingFiscalConfig fiscal) {
        recordEvent(tenantId, proposta.id, proposta.osId, ETAPA_PEDIDO, STATUS_OK, "Pedido Bling vinculado à proposta", null);

        if (fiscal != null && fiscal.autoOsOnPedido && proposta.osId == null) {
            tryGerarOsAutomatico(tenantId, proposta);
        }
    }

    @Transactional
    public void onOsConcluded(long osId) {
        long tenantId = tenantDataAccess.currentTenantId();
        onOsConcluded(tenantId, osId);
    }

    @Transactional
    public void onOsConcluded(long tenantId, long osId) {
        PropostaComercial proposta = PropostaComercial.findByOsId(tenantId, osId);
        if (proposta == null) {
            return;
        }
        recordEvent(
                tenantId,
                proposta.id,
                osId,
                ETAPA_OS_CONCLUIDA,
                STATUS_OK,
                "Ordem de serviço concluída — serviço finalizado",
                null);
        appendPropostaNota(proposta, "OS concluída — fluxo fiscal Bling em andamento.");

        TenantBlingFiscalConfig fiscal = fiscalConfigService.resolveEffective(tenantId);
        if (!shouldAutoEmitNfeOnOsConcluded(fiscal)) {
            recordEvent(
                    tenantId,
                    proposta.id,
                    osId,
                    ETAPA_NFE_SOLICITADA,
                    STATUS_SKIPPED,
                    "Emissão automática de NF-e desativada nas configurações",
                    null);
            return;
        }
        tryEmitirNfeAutomatico(tenantId, proposta, osId);
    }

    @Transactional
    public BlingFluxoRetryResultDto retryAutomations(long tenantId, long propostaId) {
        PropostaComercial proposta = requireProposta(tenantId, propostaId);
        TenantBlingFiscalConfig fiscal = fiscalConfigService.resolveEffective(tenantId);
        PropostaBlingPedido pedido = PropostaBlingPedido.findByProposta(tenantId, propostaId);

        BlingFluxoRetryResultDto result = new BlingFluxoRetryResultDto();
        List<String> actions = new ArrayList<>();

        if (pedido != null && fiscal.autoOsOnPedido && proposta.osId == null) {
            if (tryGerarOsAutomatico(tenantId, proposta)) {
                actions.add("OS gerada");
            } else {
                actions.add("Falha ao gerar OS");
            }
        }

        proposta = PropostaComercial.findById(propostaId);
        if (proposta != null && pedido != null && fiscal.autoEmitirNfe) {
            OS os = proposta.osId != null ? OS.findById(proposta.osId) : null;
            if (os != null && isOsConcluded(os) && !hasNfeAtiva(tenantId, propostaId)) {
                try {
                    tryEmitirNfeAutomatico(tenantId, proposta, proposta.osId);
                    actions.add("NF-e solicitada");
                } catch (Exception e) {
                    actions.add("Falha NF-e: " + e.getMessage());
                }
            }
        }

        result.fluxo = buildView(tenantId, propostaId);
        result.success = !result.fluxo.automacaoComErro;
        result.message =
                actions.isEmpty()
                        ? ApiI18nMessages.encode(ApiI18nMessages.BLING_FLUXO_RETRY_NOTHING)
                        : ApiI18nMessages.withDetail(
                                ApiI18nMessages.BLING_FLUXO_RETRY_ACTIONS, String.join("; ", actions));
        return result;
    }

    @Transactional
    public void recordOsGeradaManual(long tenantId, long propostaId, long osId) {
        recordEvent(tenantId, propostaId, osId, ETAPA_OS_GERADA, STATUS_OK, "OS gerada manualmente a partir da proposta", null);
    }

  /**
   * Registra NF-e autorizada via webhook/sync quando a emissão não passou pelo fluxo automático da OS.
   */
    @Transactional
    public void recordNfeFromWebhook(long tenantId, long propostaId, BlingNfeDetailDto detail, boolean created) {
        if (detail == null || detail.id == null) {
            return;
        }
        if (hasFluxoNfeEvent(tenantId, propostaId)) {
            return;
        }
        BlingNfeEmitResultDto emit = new BlingNfeEmitResultDto();
        emit.blingNfeId = detail.id;
        emit.numero = detail.numero;
        emit.situacao = detail.situacao;
        emit.chaveAcesso = detail.chaveAcesso;
        emit.danfeUrl = detail.danfeUrl;
        emit.propostaComercialId = propostaId;
        emit.created = created;
        emit.message = created
                ? "NF-e autorizada via webhook Bling"
                : "NF-e atualizada via webhook Bling";
        recordNfeResult(tenantId, propostaId, emit);
    }

    @Transactional
    public void recordNfeResult(long tenantId, long propostaId, BlingNfeEmitResultDto emitResult) {
        if (emitResult == null) {
            return;
        }
        if (emitResult.created) {
            recordEvent(
                    tenantId,
                    propostaId,
                    null,
                    ETAPA_NFE_EMITIDA,
                    STATUS_OK,
                    emitResult.message != null ? emitResult.message : "NF-e emitida via Bling",
                    nfeResumo(emitResult));
        } else {
            recordEvent(
                    tenantId,
                    propostaId,
                    null,
                    ETAPA_NFE_EXISTENTE,
                    STATUS_OK,
                    emitResult.message != null ? emitResult.message : "NF-e já existente para esta proposta",
                    nfeResumo(emitResult));
        }
    }

    @Transactional
    public void recordNfeFailure(long tenantId, long propostaId, Long osId, Exception error) {
        String msg = error != null && error.getMessage() != null ? error.getMessage() : "Falha ao emitir NF-e";
        recordEvent(tenantId, propostaId, osId, ETAPA_NFE_FALHA, STATUS_FAILED, msg, stackSummary(error));
    }

    static boolean shouldAutoEmitNfeOnOsConcluded(TenantBlingFiscalConfig fiscal) {
        return fiscal != null && Boolean.TRUE.equals(fiscal.autoEmitirNfe);
    }

    static boolean shouldRetryNfeAfterOsConcluded(
            TenantBlingFiscalConfig fiscal, PropostaBlingPedido pedido, boolean osConcluded, boolean nfeAtiva) {
        return shouldAutoEmitNfeOnOsConcluded(fiscal) && pedido != null && osConcluded && !nfeAtiva;
    }

    static boolean isOsConcluded(OS os) {
        return os != null && (os.dataConclusaoServ != null || os.dataFechamento != null);
    }

    static boolean transitionedToConcluded(OS before, OS after) {
        return !isOsConcluded(before) && isOsConcluded(after);
    }

    private boolean tryGerarOsAutomatico(long tenantId, PropostaComercial proposta) {
        try {
            osBridgeService.gerarOs(proposta.id);
            PropostaComercial refreshed = PropostaComercial.findById(proposta.id);
            Long osId = refreshed != null ? refreshed.osId : proposta.osId;
            recordEvent(
                    tenantId,
                    proposta.id,
                    osId,
                    ETAPA_OS_GERADA,
                    STATUS_OK,
                    "OS gerada automaticamente após pedido Bling",
                    null);
            if (refreshed != null) {
                appendPropostaNota(refreshed, "OS gerada automaticamente após pedido Bling.");
            }
            return true;
        } catch (Exception e) {
            LOG.warnf(e, "OS automática falhou proposta %d", proposta.id);
            recordEvent(
                    tenantId,
                    proposta.id,
                    null,
                    ETAPA_OS_FALHA,
                    STATUS_FAILED,
                    "Falha ao gerar OS automaticamente",
                    e.getMessage());
            return false;
        }
    }

    private void tryEmitirNfeAutomatico(long tenantId, PropostaComercial proposta, Long osId) {
        PropostaBlingPedido pedido = PropostaBlingPedido.findByProposta(tenantId, proposta.id);
        if (pedido == null) {
            recordEvent(
                    tenantId,
                    proposta.id,
                    osId,
                    ETAPA_NFE_FALHA,
                    STATUS_FAILED,
                    "Proposta sem pedido Bling — impossível emitir NF-e",
                    null);
            return;
        }
        recordEvent(
                tenantId,
                proposta.id,
                osId,
                ETAPA_NFE_SOLICITADA,
                STATUS_PENDING,
                "Solicitando emissão de NF-e na Bling após conclusão da OS",
                null);
        try {
            BlingNfeEmitResultDto emit = fiscalSyncService.emitirNfeForProposta(tenantId, proposta.id);
            recordNfeResult(tenantId, proposta.id, emit);
            appendPropostaNota(
                    proposta,
                    emit.created
                            ? "NF-e solicitada automaticamente após conclusão da OS."
                            : "NF-e já registrada — emissão automática ignorada (idempotente).");
        } catch (Exception e) {
            recordNfeFailure(tenantId, proposta.id, osId, e);
            LOG.warnf(e, "NF-e automática falhou proposta %d após OS concluída", proposta.id);
        }
    }

    private BlingPropostaFluxoViewDto buildView(long tenantId, long propostaId) {
        PropostaComercial proposta = PropostaComercial.findById(propostaId);
        PropostaBlingPedido pedido = PropostaBlingPedido.findByProposta(tenantId, propostaId);
        List<BlingPropostaFluxoEvento> eventos = BlingPropostaFluxoEvento.listByProposta(tenantId, propostaId);

        BlingPropostaFluxoViewDto view = new BlingPropostaFluxoViewDto();
        view.propostaComercialId = propostaId;
        view.osId = proposta != null ? proposta.osId : null;
        view.pedidoVinculado = pedido != null;
        view.osGerada = view.osId != null;
        view.osConcluida = isOsConcludedByProposta(proposta);
        view.nfeEmitida = hasNfeAtiva(tenantId, propostaId);

        for (BlingPropostaFluxoEvento ev : eventos) {
            view.eventos.add(toDto(ev));
        }

        view.ultimoErro = findUltimoErro(eventos);
        TenantBlingFiscalConfig fiscal = fiscalConfigService.resolveEffective(tenantId);
        AutomacaoEstado estado = resolveAutomacaoEstado(fiscal, proposta, pedido, eventos, view);
        view.automacaoMotivo = estado.motivo;
        view.automacaoComErro = estado.comErro;
        view.aguardandoConclusaoOs = estado.aguardandoConclusaoOs;
        view.retryDisponivel = estado.retryDisponivel;
        view.automacaoPendente = estado.automacaoPendente;
        view.passos = buildPassos(view, pedido, eventos);
        return view;
    }

    public record AutomacaoEstado(
            String motivo,
            boolean comErro,
            boolean aguardandoConclusaoOs,
            boolean retryDisponivel,
            boolean automacaoPendente) {}

    private List<BlingPropostaFluxoPassoDto> buildPassos(
            BlingPropostaFluxoViewDto view, PropostaBlingPedido pedido, List<BlingPropostaFluxoEvento> eventos) {
        List<BlingPropostaFluxoPassoDto> passos = new ArrayList<>();

        passos.add(passo(
                "pedido",
                view.pedidoVinculado ? STATUS_OK : STATUS_PENDING,
                pedido != null
                        ? "Pedido Bling #" + (pedido.blingPedidoNumero != null ? pedido.blingPedidoNumero : pedido.blingPedidoId)
                        : "Aguardando pedido na Bling",
                pedido != null ? pedido.blingSituacao : null,
                lastEventAt(eventos, ETAPA_PEDIDO)));

        passos.add(passo(
                "os",
                view.osGerada ? STATUS_OK : stepOsStatus(eventos),
                view.osGerada ? "OS vinculada (id " + view.osId + ")" : "Aguardando geração da OS",
                null,
                lastEventAt(eventos, ETAPA_OS_GERADA, ETAPA_OS_FALHA)));

        passos.add(passo(
                "os_concluida",
                view.osConcluida ? STATUS_OK : (view.osGerada ? STATUS_PENDING : STATUS_PENDING),
                view.osConcluida ? "Serviço concluído na oficina" : "Aguardando conclusão do serviço na OS",
                null,
                lastEventAt(eventos, ETAPA_OS_CONCLUIDA)));

        String nfeStatus = view.nfeEmitida ? STATUS_OK : stepNfeStatus(eventos);
        passos.add(passo(
                "nfe",
                nfeStatus,
                view.nfeEmitida ? "NF-e registrada" : "Aguardando emissão da NF-e",
                null,
                lastEventAt(eventos, ETAPA_NFE_EMITIDA, ETAPA_NFE_EXISTENTE, ETAPA_NFE_FALHA)));

        return passos;
    }

    private static String stepOsStatus(List<BlingPropostaFluxoEvento> eventos) {
        for (int i = eventos.size() - 1; i >= 0; i--) {
            BlingPropostaFluxoEvento ev = eventos.get(i);
            if (ETAPA_OS_FALHA.equals(ev.etapa)) {
                return STATUS_FAILED;
            }
            if (ETAPA_OS_GERADA.equals(ev.etapa)) {
                return STATUS_OK;
            }
        }
        return STATUS_PENDING;
    }

    private static String stepNfeStatus(List<BlingPropostaFluxoEvento> eventos) {
        for (int i = eventos.size() - 1; i >= 0; i--) {
            BlingPropostaFluxoEvento ev = eventos.get(i);
            if (ETAPA_NFE_FALHA.equals(ev.etapa)) {
                return STATUS_FAILED;
            }
            if (ETAPA_NFE_EMITIDA.equals(ev.etapa) || ETAPA_NFE_EXISTENTE.equals(ev.etapa)) {
                return STATUS_OK;
            }
        }
        return STATUS_PENDING;
    }

    static AutomacaoEstado resolveAutomacaoEstado(
            TenantBlingFiscalConfig fiscal,
            PropostaComercial proposta,
            PropostaBlingPedido pedido,
            List<BlingPropostaFluxoEvento> eventos,
            BlingPropostaFluxoViewDto view) {
        if (pedido == null || proposta == null) {
            return new AutomacaoEstado("NENHUM", false, false, false, false);
        }
        if (fiscal == null) {
            return new AutomacaoEstado("NENHUM", false, false, false, false);
        }
        if (hasRecentFailed(eventos, ETAPA_OS_FALHA)) {
            return new AutomacaoEstado("ERRO_OS", true, false, true, true);
        }
        if (hasRecentFailed(eventos, ETAPA_NFE_FALHA)) {
            return new AutomacaoEstado("ERRO_NFE", true, false, true, true);
        }
        if (fiscal.autoOsOnPedido && proposta.osId == null && !view.osGerada) {
            return new AutomacaoEstado("AGUARDANDO_OS", false, false, true, true);
        }
        if (fiscal.autoEmitirNfe && view.osGerada && !view.osConcluida) {
            return new AutomacaoEstado("AGUARDANDO_OS_CONCLUSAO", false, true, false, true);
        }
        if (fiscal.autoEmitirNfe && view.osConcluida && !view.nfeEmitida) {
            return new AutomacaoEstado("AGUARDANDO_NFE", false, false, true, true);
        }
        return new AutomacaoEstado("NENHUM", false, false, false, false);
    }

    private static boolean hasRecentFailed(List<BlingPropostaFluxoEvento> eventos, String etapa) {
        for (int i = eventos.size() - 1; i >= 0; i--) {
            BlingPropostaFluxoEvento ev = eventos.get(i);
            if (etapa.equals(ev.etapa)) {
                return STATUS_FAILED.equals(ev.status);
            }
        }
        return false;
    }

    static boolean hasNfeAtiva(long tenantId, long propostaId) {
        for (BlingNfeRegistro row : BlingNfeRegistro.listByProposta(tenantId, propostaId)) {
            if (isNfeAtiva(row)) {
                return true;
            }
        }
        return false;
    }

    static boolean isNfeAtiva(BlingNfeRegistro row) {
        if (row == null) {
            return false;
        }
        if (row.chaveAcesso != null && !row.chaveAcesso.isBlank()) {
            return true;
        }
        String situacao = row.situacao != null ? row.situacao.toLowerCase() : "";
        if (situacao.contains("cancel") || situacao.contains("rejeit") || situacao.contains("deneg")) {
            return false;
        }
        return situacao.contains("autoriz")
                || situacao.contains("emitid")
                || situacao.contains("aprov")
                || situacao.contains("registr");
    }

    private static boolean isOsConcludedByProposta(PropostaComercial proposta) {
        if (proposta == null || proposta.osId == null) {
            return false;
        }
        OS os = OS.findById(proposta.osId);
        return isOsConcluded(os);
    }

    private void recordEvent(
            long tenantId, long propostaId, Long osId, String etapa, String status, String mensagem, String detalhe) {
        BlingPropostaFluxoEvento row = new BlingPropostaFluxoEvento();
        row.tenantId = tenantId;
        row.propostaComercialId = propostaId;
        row.osId = osId;
        row.etapa = etapa;
        row.status = status;
        row.mensagem = trim(mensagem, 500);
        row.detalhe = detalhe;
        row.persist();
    }

    private PropostaComercial requireProposta(long tenantId, long propostaId) {
        PropostaComercial entity = PropostaComercial.findById(propostaId);
        if (entity == null) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.PROPOSTA_NOT_FOUND, "id", String.valueOf(propostaId)));
        }
        if (!TenantConstants.tenantIdOf(tenantId).equals(entity.tenantId)) {
            throw new jakarta.ws.rs.ForbiddenException(
                    com.aerosuite.i18n.ApiI18nMessages.encode(
                            com.aerosuite.i18n.ApiI18nMessages.PROPOSTA_WRONG_TENANT));
        }
        return entity;
    }

    private static boolean hasFluxoNfeEvent(long tenantId, long propostaId) {
        return hasFluxoNfeEventInList(BlingPropostaFluxoEvento.listByProposta(tenantId, propostaId));
    }

    static boolean hasFluxoNfeEventInList(List<BlingPropostaFluxoEvento> eventos) {
        if (eventos == null || eventos.isEmpty()) {
            return false;
        }
        for (BlingPropostaFluxoEvento ev : eventos) {
            if (ev != null
                    && (ETAPA_NFE_EMITIDA.equals(ev.etapa) || ETAPA_NFE_EXISTENTE.equals(ev.etapa))) {
                return true;
            }
        }
        return false;
    }

    private static BlingPropostaFluxoEventoDto toDto(BlingPropostaFluxoEvento row) {
        BlingPropostaFluxoEventoDto dto = new BlingPropostaFluxoEventoDto();
        dto.id = row.id;
        dto.etapa = row.etapa;
        dto.status = row.status;
        dto.mensagem = row.mensagem;
        dto.detalhe = row.detalhe;
        dto.osId = row.osId;
        dto.createdAt = row.createdAt != null ? row.createdAt.toString() : null;
        return dto;
    }

    private static BlingPropostaFluxoPassoDto passo(
            String codigo, String status, String titulo, String detalhe, String updatedAt) {
        BlingPropostaFluxoPassoDto p = new BlingPropostaFluxoPassoDto();
        p.codigo = codigo;
        p.status = status;
        p.titulo = titulo;
        p.detalhe = detalhe;
        p.updatedAt = updatedAt;
        return p;
    }

    private static String lastEventAt(List<BlingPropostaFluxoEvento> eventos, String... etapas) {
        for (int i = eventos.size() - 1; i >= 0; i--) {
            BlingPropostaFluxoEvento ev = eventos.get(i);
            for (String etapa : etapas) {
                if (etapa.equals(ev.etapa) && ev.createdAt != null) {
                    return ev.createdAt.toString();
                }
            }
        }
        return null;
    }

    private static String findUltimoErro(List<BlingPropostaFluxoEvento> eventos) {
        for (int i = eventos.size() - 1; i >= 0; i--) {
            BlingPropostaFluxoEvento ev = eventos.get(i);
            if (STATUS_FAILED.equals(ev.status)) {
                return ev.mensagem;
            }
        }
        return null;
    }

    private static String nfeResumo(BlingNfeEmitResultDto emit) {
        return "nfeId=" + emit.blingNfeId + ";numero=" + emit.numero + ";situacao=" + emit.situacao;
    }

    private static String stackSummary(Exception error) {
        return error != null ? error.getMessage() : null;
    }

    private static String trim(String s, int max) {
        if (s == null) {
            return null;
        }
        return s.length() <= max ? s : s.substring(0, max);
    }

    private static void appendPropostaNota(PropostaComercial proposta, String line) {
        String block = "[Bling] " + line;
        if (proposta.observacoes == null || proposta.observacoes.isBlank()) {
            proposta.observacoes = block;
        } else if (!proposta.observacoes.contains(block)) {
            proposta.observacoes = proposta.observacoes.trim() + "\n" + block;
        }
    }
}
