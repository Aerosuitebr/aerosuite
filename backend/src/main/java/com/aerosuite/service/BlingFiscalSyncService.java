package com.aerosuite.service;

import com.aerosuite.domain.BlingNfeRegistro;
import com.aerosuite.domain.PropostaBlingPedido;
import com.aerosuite.domain.PropostaComercial;
import com.aerosuite.domain.TenantBlingFiscalConfig;
import com.aerosuite.integration.bling.BlingNfeDetailDto;
import com.aerosuite.integration.bling.BlingNfeEmitResultDto;
import com.aerosuite.integration.bling.BlingNfeRegistroDto;
import com.aerosuite.integration.bling.BlingPropostaNfeListDto;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.integration.bling.BlingTenantApiClient;
import com.aerosuite.security.InternalUserContext;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.jboss.logging.Logger;

@ApplicationScoped
public class BlingFiscalSyncService {

    private static final Logger LOG = Logger.getLogger(BlingFiscalSyncService.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Inject
    BlingTenantApiClient tenantApiClient;

    @Inject
    InternalUserContext internalUserContext;

    @Inject
    TenantBlingFiscalConfigService fiscalConfigService;

    @Inject
    BlingNfeAutorizadaNotificationService nfeNotificationService;

    @Inject
    Instance<BlingPropostaFluxoService> fluxoService;

    public BlingPropostaNfeListDto listForProposta(long tenantId, long propostaId) {
        BlingPropostaNfeListDto out = new BlingPropostaNfeListDto();
        out.items = new ArrayList<>();
        for (BlingNfeRegistro row : BlingNfeRegistro.listByProposta(tenantId, propostaId)) {
            out.items.add(toDto(row));
        }
        return out;
    }

    @Transactional
    public BlingNfeEmitResultDto emitirNfeForProposta(long tenantId, long propostaId) {
        return runInTenant(tenantId, () -> {
            PropostaBlingPedido pedidoLink = PropostaBlingPedido.findByProposta(tenantId, propostaId);
            if (pedidoLink == null || pedidoLink.blingPedidoId == null) {
                throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.BLING_NO_PEDIDO_LINKED));
            }
            BlingNfeRegistro existente = findNfeAtivaExistente(tenantId, propostaId);
            if (existente != null) {
                BlingNfeEmitResultDto skipped = new BlingNfeEmitResultDto();
                skipped.blingNfeId = existente.blingNfeId;
                skipped.numero = existente.numero;
                skipped.situacao = existente.situacao;
                skipped.chaveAcesso = existente.chaveAcesso;
                skipped.danfeUrl = existente.danfeUrl;
                skipped.propostaComercialId = propostaId;
                skipped.created = false;
                skipped.message = ApiI18nMessages.encode(ApiI18nMessages.BLING_NFE_ALREADY_REGISTERED);
                return skipped;
            }
            TenantBlingFiscalConfig fiscal = fiscalConfigService.resolveEffective(tenantId);
            if (!fiscal.hasCertificado()) {
                throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.BLING_CERT_NOT_CONFIGURED));
            }
            String payload = buildNfeJson(pedidoLink.blingPedidoId, fiscal);
            BlingNfeDetailDto created = tenantApiClient.createNfe(tenantId, payload);
            if (created == null || created.id == null) {
                throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.BLING_NFE_NOT_RETURNED));
            }
            if (created.situacao == null || created.chaveAcesso == null) {
                try {
                    BlingNfeDetailDto fetched = tenantApiClient.fetchNfe(tenantId, created.id);
                    if (fetched != null) {
                        created = fetched;
                    }
                } catch (Exception e) {
                    LOG.warnf(e, "NF-e %d criada — detalhe completo indisponível", created.id);
                }
            }
            upsertRegistro(tenantId, created);

            BlingNfeEmitResultDto result = new BlingNfeEmitResultDto();
            result.blingNfeId = created.id;
            result.numero = created.numero;
            result.situacao = created.situacao;
            result.chaveAcesso = created.chaveAcesso;
            result.danfeUrl = created.danfeUrl;
            result.propostaComercialId = propostaId;
            result.created = true;
            result.message = ApiI18nMessages.encode(ApiI18nMessages.BLING_NFE_EMITTED);
            return result;
        });
    }

    static BlingNfeRegistro findNfeAtivaExistente(long tenantId, long propostaId) {
        for (BlingNfeRegistro row : BlingNfeRegistro.listByProposta(tenantId, propostaId)) {
            if (BlingPropostaFluxoService.isNfeAtiva(row)) {
                return row;
            }
        }
        return null;
    }

    static String buildNfeJson(long pedidoVendaId, TenantBlingFiscalConfig fiscal) {
        try {
            ObjectNode root = MAPPER.createObjectNode();
            root.put("pedidoVendaId", pedidoVendaId);
            root.put("tipo", 1);
            if (fiscal != null) {
                if (fiscal.naturezaOperacao != null && !fiscal.naturezaOperacao.isBlank()) {
                    root.put("naturezaOperacao", fiscal.naturezaOperacao.trim());
                }
                if (fiscal.serieNfe != null && !fiscal.serieNfe.isBlank()) {
                    root.put("serie", fiscal.serieNfe.trim());
                }
                if (fiscal.cfopPadrao != null && !fiscal.cfopPadrao.isBlank()) {
                    root.put("cfop", fiscal.cfopPadrao.trim());
                }
            }
            return MAPPER.writeValueAsString(root);
        } catch (Exception e) {
            throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.BLING_NFE_JSON_BUILD_FAILED), e);
        }
    }

    @Transactional
    public void processNfeWebhook(long tenantId, JsonNode payloadRoot) {
        runInTenant(tenantId, () -> {
            long nfeId = extractNfeId(payloadRoot);
            if (nfeId <= 0) {
                throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.BLING_NFE_WEBHOOK_NO_ID));
            }
            BlingNfeDetailDto detail;
            try {
                detail = tenantApiClient.fetchNfe(tenantId, nfeId);
            } catch (Exception e) {
                LOG.warnf(e, "NF-e %d — usando payload do webhook", nfeId);
                detail = fromPayload(payloadRoot, nfeId);
            }
            if (detail == null) {
                detail = fromPayload(payloadRoot, nfeId);
            }
            upsertRegistro(tenantId, detail);
            return null;
        });
    }

    @Transactional
    void upsertRegistro(long tenantId, BlingNfeDetailDto detail) {
        if (detail == null || detail.id == null) {
            return;
        }
        BlingNfeRegistro row = BlingNfeRegistro.findByBlingNfe(tenantId, detail.id);
        boolean created = row == null;
        if (row == null) {
            row = new BlingNfeRegistro();
            row.tenantId = tenantId;
            row.blingNfeId = detail.id;
        }
        row.numero = detail.numero;
        row.chaveAcesso = detail.chaveAcesso;
        row.situacao = detail.situacao;
        row.danfeUrl = detail.danfeUrl;
        row.emittedAt = LocalDateTime.now();
        row.payloadResumo = summarize(detail);

        Long pedidoId = detail.pedidoId;
        row.blingPedidoId = pedidoId;
        PropostaBlingPedido pedidoLink = pedidoId != null
                ? PropostaBlingPedido.findByBlingPedido(tenantId, pedidoId)
                : null;
        if (pedidoLink != null) {
            row.propostaComercialId = pedidoLink.propostaComercialId;
            PropostaComercial proposta = PropostaComercial.findById(pedidoLink.propostaComercialId);
            if (proposta != null) {
                appendPropostaNota(proposta, buildNfeNote(detail));
            }
        }
        row.persist();
        LOG.infof("NF-e Bling %d registrada (proposta=%s)", detail.id, row.propostaComercialId);
        if (row.propostaComercialId != null
                && BlingNfeAutorizadaNotificationService.isAuthorized(detail.situacao, detail.chaveAcesso)) {
            try {
                fluxoService.get().recordNfeFromWebhook(tenantId, row.propostaComercialId, detail, created);
            } catch (Exception e) {
                LOG.warnf(e, "NF-e %d — falha ao registrar evento no fluxo da proposta", detail.id);
            }
        }
        try {
            nfeNotificationService.onNfeRegistrada(tenantId, row, detail);
        } catch (Exception e) {
            LOG.warnf(e, "NF-e %d — falha ao notificar autorização", detail.id);
        }
    }

    static boolean isNfeEvent(String eventType, JsonNode root) {
        String resource = text(root, "$resource");
        String up = (nullToEmpty(eventType) + " " + nullToEmpty(resource)).toLowerCase();
        return up.contains("nfe") || up.contains("nota") || up.contains("nf-e") || up.contains("fiscal");
    }

    static long extractNfeId(JsonNode root) {
        if (root == null) {
            return 0;
        }
        JsonNode data = root.get("data");
        if (data != null) {
            if (data.has("id")) {
                return data.path("id").asLong(0);
            }
            JsonNode nfe = data.get("notaFiscal");
            if (nfe != null && nfe.has("id")) {
                return nfe.path("id").asLong(0);
            }
        }
        return root.path("resourceId").asLong(0);
    }

    private static BlingNfeDetailDto fromPayload(JsonNode root, long fallbackId) {
        BlingNfeDetailDto dto = new BlingNfeDetailDto();
        dto.id = fallbackId;
        JsonNode data = root != null ? root.get("data") : null;
        if (data != null) {
            dto.numero = text(data, "numero");
            dto.chaveAcesso = text(data, "chaveAcesso");
            dto.situacao = text(data, "situacao");
            dto.pedidoId = data.path("idPedidoVenda").asLong(0);
            if (dto.pedidoId == 0) {
                dto.pedidoId = null;
            }
        }
        return dto;
    }

    private static BlingNfeRegistroDto toDto(BlingNfeRegistro row) {
        BlingNfeRegistroDto dto = new BlingNfeRegistroDto();
        dto.blingNfeId = row.blingNfeId;
        dto.numero = row.numero;
        dto.chaveAcesso = row.chaveAcesso;
        dto.situacao = row.situacao;
        dto.danfeUrl = row.danfeUrl;
        dto.emittedAt = row.emittedAt != null ? row.emittedAt.toString() : null;
        return dto;
    }

    private static String buildNfeNote(BlingNfeDetailDto detail) {
        StringBuilder sb = new StringBuilder("NF-e ");
        if (detail.numero != null) {
            sb.append("#").append(detail.numero);
        } else {
            sb.append("id ").append(detail.id);
        }
        if (detail.situacao != null) {
            sb.append(" — ").append(detail.situacao);
        }
        if (detail.chaveAcesso != null) {
            sb.append(" (chave ").append(detail.chaveAcesso).append(")");
        }
        return sb.toString();
    }

    private static String summarize(BlingNfeDetailDto detail) {
        return "numero=" + detail.numero + ";situacao=" + detail.situacao;
    }

    private static void appendPropostaNota(PropostaComercial proposta, String line) {
        String block = "[Bling] " + line;
        if (proposta.observacoes == null || proposta.observacoes.isBlank()) {
            proposta.observacoes = block;
        } else if (!proposta.observacoes.contains(block)) {
            proposta.observacoes = proposta.observacoes.trim() + "\n" + block;
        }
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
    }

    private static String text(JsonNode node, String field) {
        if (node == null || !node.has(field) || node.get(field).isNull()) {
            return null;
        }
        return node.get(field).asText(null);
    }

    private void runInTenant(long tenantId, Runnable action) {
        internalUserContext.setProvisioningTenant(tenantId);
        try {
            action.run();
        } finally {
            internalUserContext.clearProvisioningTenant();
        }
    }

    private <T> T runInTenant(long tenantId, java.util.function.Supplier<T> action) {
        internalUserContext.setProvisioningTenant(tenantId);
        try {
            return action.get();
        } finally {
            internalUserContext.clearProvisioningTenant();
        }
    }
}
