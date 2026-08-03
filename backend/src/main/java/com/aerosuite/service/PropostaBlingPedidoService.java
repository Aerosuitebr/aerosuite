package com.aerosuite.service;

import com.aerosuite.domain.ClientePropostaBlingMap;
import com.aerosuite.domain.PropostaBlingPedido;
import com.aerosuite.domain.PropostaComercial;
import com.aerosuite.domain.PropostaComercialItem;
import com.aerosuite.domain.TenantBlingFiscalConfig;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.integration.bling.BlingPedidoDetailDto;
import com.aerosuite.integration.bling.BlingPropostaPedidoViewDto;
import com.aerosuite.integration.bling.BlingTenantApiClient;
import com.aerosuite.security.InternalUserContext;
import com.aerosuite.security.TenantDataAccess;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.jboss.logging.Logger;

@ApplicationScoped
public class PropostaBlingPedidoService {

    private static final Logger LOG = Logger.getLogger(PropostaBlingPedidoService.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final DateTimeFormatter BLING_DATE = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final String STATUS_APROVADA = "APROVADA";

    @Inject
    BlingTenantApiClient tenantApiClient;

    @Inject
    InternalUserContext internalUserContext;

    @Inject
    TenantDataAccess tenantDataAccess;

    @Inject
    TenantBlingFiscalConfigService fiscalConfigService;

    @Inject
    BlingPropostaFluxoService fluxoService;

    public BlingPropostaPedidoViewDto viewForProposta(long tenantId, long propostaId) {
        BlingPropostaPedidoViewDto dto = new BlingPropostaPedidoViewDto();
        dto.propostaComercialId = propostaId;
        PropostaBlingPedido link = PropostaBlingPedido.findByProposta(tenantId, propostaId);
        if (link == null) {
            dto.linked = false;
            dto.message = ApiI18nMessages.encode(ApiI18nMessages.PROPOSTA_BLING_PEDIDO_NOT_LINKED);
            return dto;
        }
        fillView(dto, link);
        return dto;
    }

    @Transactional
    public BlingPropostaPedidoViewDto criarPedido(long tenantId, long propostaId, Integer userId) {
        return runInTenant(tenantId, () -> {
            PropostaComercial proposta = requireProposta(propostaId);
            PropostaBlingPedido existing = PropostaBlingPedido.findByProposta(tenantId, propostaId);
            if (existing != null) {
                BlingPropostaPedidoViewDto dto = new BlingPropostaPedidoViewDto();
                fillView(dto, existing);
                dto.message = ApiI18nMessages.encode(ApiI18nMessages.PROPOSTA_BLING_PEDIDO_ALREADY_EXISTS);
                return dto;
            }
            if (!STATUS_APROVADA.equalsIgnoreCase(nullToEmpty(proposta.status))) {
                throw new BadRequestException(
                        ApiI18nMessages.encode(
                                ApiI18nMessages.PROPOSTA_BLING_PEDIDO_STATUS_REQUIRED,
                                "status",
                                nullToEmpty(proposta.status)));
            }
            long blingContatoId = resolveBlingContatoId(tenantId, proposta);
            List<PropostaComercialItem> itens = PropostaComercialItem.find(
                            "propostaComercial.id = ?1", Sort.by("ordem").ascending(), proposta.id)
                    .list();
            TenantBlingFiscalConfig fiscal = fiscalConfigService.resolveEffective(tenantId);
            String payload = buildPedidoJson(proposta, blingContatoId, itens, fiscal);
            BlingPedidoDetailDto created = tenantApiClient.createPedidoVenda(tenantId, payload);

            PropostaBlingPedido link = new PropostaBlingPedido();
            link.tenantId = tenantId;
            link.propostaComercialId = proposta.id;
            link.blingPedidoId = created.id;
            link.blingPedidoNumero = created.numero;
            link.blingSituacao = created.situacao;
            link.pushedAt = LocalDateTime.now();
            link.pushedByUsuarioId = userId;
            link.lastSyncAt = LocalDateTime.now();
            link.lastSyncSource = "PUSH";
            link.persist();

            appendPropostaNota(proposta, "Pedido Bling #" + (created.numero != null ? created.numero : created.id)
                    + " criado a partir desta proposta.");

            fluxoService.runPostPedidoAutomations(tenantId, proposta, fiscal);

            BlingPropostaPedidoViewDto dto = new BlingPropostaPedidoViewDto();
            fillView(dto, link);
            dto.message = ApiI18nMessages.encode(ApiI18nMessages.PROPOSTA_BLING_PEDIDO_CREATED);
            LOG.infof("Proposta %d → pedido Bling %d", propostaId, created.id);
            return dto;
        });
    }

    @Transactional
    public void syncPedidoFromWebhook(long tenantId, long blingPedidoId) {
        runInTenant(tenantId, () -> {
            BlingPedidoDetailDto detail = tenantApiClient.fetchPedidoVenda(tenantId, blingPedidoId);
            if (detail == null) {
                throw new IllegalStateException(
                        ApiI18nMessages.encode(
                                ApiI18nMessages.PROPOSTA_BLING_PEDIDO_NOT_FOUND,
                                "id",
                                String.valueOf(blingPedidoId)));
            }
            PropostaBlingPedido link = PropostaBlingPedido.findByBlingPedido(tenantId, blingPedidoId);
            boolean newLink = false;
            if (link == null && detail.numeroLoja != null && !detail.numeroLoja.isBlank()) {
                PropostaComercial proposta = PropostaComercial.find(
                                "numeroProposta = ?1 and tenantId = ?2",
                                detail.numeroLoja.trim(),
                                tenantId)
                        .firstResult();
                if (proposta != null) {
                    link = new PropostaBlingPedido();
                    link.tenantId = tenantId;
                    link.propostaComercialId = proposta.id;
                    link.blingPedidoId = blingPedidoId;
                    link.pushedAt = LocalDateTime.now();
                    link.lastSyncSource = "WEBHOOK";
                    newLink = true;
                }
            }
            if (link == null) {
                LOG.infof("Webhook pedido Bling %d sem proposta vinculada", blingPedidoId);
                return null;
            }
            link.blingPedidoNumero = detail.numero;
            link.blingSituacao = detail.situacao;
            link.lastSyncAt = LocalDateTime.now();
            link.lastSyncSource = "WEBHOOK";
            link.persist();

            PropostaComercial proposta = PropostaComercial.findById(link.propostaComercialId);
            if (proposta != null && detail.situacao != null) {
                appendPropostaNota(proposta, "Bling — pedido "
                        + (detail.numero != null ? detail.numero : blingPedidoId)
                        + " situação: " + detail.situacao);
            }
            if (newLink && proposta != null) {
                TenantBlingFiscalConfig fiscal = fiscalConfigService.resolveEffective(tenantId);
                fluxoService.runPostPedidoAutomations(tenantId, proposta, fiscal);
            }
            return null;
        });
    }

    static String buildPedidoJson(
            PropostaComercial proposta, long blingContatoId, List<PropostaComercialItem> itens) {
        return buildPedidoJson(proposta, blingContatoId, itens, null);
    }

    static String buildPedidoJson(
            PropostaComercial proposta,
            long blingContatoId,
            List<PropostaComercialItem> itens,
            TenantBlingFiscalConfig fiscal) {
        try {
            ObjectNode root = MAPPER.createObjectNode();
            ObjectNode cliente = root.putObject("contato");
            cliente.put("id", blingContatoId);
            ArrayNode itensNode = root.putArray("itens");
            if (itens != null && !itens.isEmpty()) {
                for (PropostaComercialItem item : itens) {
                    ObjectNode row = itensNode.addObject();
                    if (item.produtoPn != null && !item.produtoPn.isBlank()) {
                        row.put("codigo", item.produtoPn.trim());
                    }
                    row.put("descricao", item.produtoNome != null ? item.produtoNome.trim() : "Item proposta");
                    row.put("quantidade", item.quantidade != null ? item.quantidade : 1);
                    row.put("valor", toBrl(item.valorUnitario));
                    applyFiscalToItem(row, fiscal);
                }
            } else {
                ObjectNode row = itensNode.addObject();
                row.put("descricao", proposta.produtoNome != null ? proposta.produtoNome : "Serviço proposta comercial");
                row.put("quantidade", 1);
                row.put("valor", toBrl(proposta.valorTotalFinal != null ? proposta.valorTotalFinal : proposta.produtoValor));
                applyFiscalToItem(row, fiscal);
            }
            if (proposta.numeroProposta != null && !proposta.numeroProposta.isBlank()) {
                root.put("numeroLoja", proposta.numeroProposta.trim());
            }
            if (fiscal != null && fiscal.naturezaOperacao != null && !fiscal.naturezaOperacao.isBlank()) {
                root.put("observacoesInternas", fiscal.naturezaOperacao.trim());
            }
            root.put("observacoes", "Aero Suite — proposta " + nullToEmpty(proposta.numeroProposta));
            String orderDate = LocalDate.now().format(BLING_DATE);
            root.put("data", orderDate);
            double total = computePedidoTotal(proposta, itens);
            ObjectNode parcela = root.putArray("parcelas").addObject();
            parcela.put("dataVencimento", orderDate);
            parcela.put("valor", total);
            return MAPPER.writeValueAsString(root);
        } catch (Exception e) {
            throw new IllegalStateException(
                    ApiI18nMessages.withDetail(ApiI18nMessages.PROPOSTA_BLING_JSON_BUILD_FAILED, e.getMessage()), e);
        }
    }

    private static void applyFiscalToItem(ObjectNode row, TenantBlingFiscalConfig fiscal) {
        com.aerosuite.integration.bling.BlingFiscalPayloadHelper.applyFiscalToItem(row, fiscal);
    }

    static long extractPedidoId(com.fasterxml.jackson.databind.JsonNode root) {
        if (root == null) {
            return 0;
        }
        com.fasterxml.jackson.databind.JsonNode data = root.get("data");
        if (data != null) {
            if (data.has("id")) {
                return data.path("id").asLong(0);
            }
            com.fasterxml.jackson.databind.JsonNode pedido = data.get("pedido");
            if (pedido != null && pedido.has("id")) {
                return pedido.path("id").asLong(0);
            }
        }
        return root.path("resourceId").asLong(0);
    }

    static boolean isPedidoEvent(String eventType, com.fasterxml.jackson.databind.JsonNode root) {
        String resource = text(root, "$resource");
        String up = (nullToEmpty(eventType) + " " + nullToEmpty(resource)).toLowerCase();
        return up.contains("pedido") || up.contains("order") || up.contains("venda");
    }

    private long resolveBlingContatoId(long tenantId, PropostaComercial proposta) {
        if (proposta.clientePropostaId != null) {
            ClientePropostaBlingMap map =
                    ClientePropostaBlingMap.findByClienteProposta(tenantId, proposta.clientePropostaId);
            if (map != null) {
                return map.blingContatoId;
            }
        }
        throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.PROPOSTA_BLING_CLIENTE_NOT_LINKED));
    }

    private PropostaComercial requireProposta(long propostaId) {
        PropostaComercial entity = PropostaComercial.findById(propostaId);
        if (entity == null) {
            throw new NotFoundException(
                    ApiI18nMessages.encode(ApiI18nMessages.PROPOSTA_NOT_FOUND, "id", String.valueOf(propostaId)));
        }
        if (!tenantDataAccess.matchesTenant(entity.tenantId)) {
            throw new jakarta.ws.rs.ForbiddenException(
                    com.aerosuite.i18n.ApiI18nMessages.encode(
                            com.aerosuite.i18n.ApiI18nMessages.PROPOSTA_WRONG_TENANT));
        }
        return entity;
    }

    private static void fillView(BlingPropostaPedidoViewDto dto, PropostaBlingPedido link) {
        dto.linked = true;
        dto.propostaComercialId = link.propostaComercialId;
        dto.blingPedidoId = link.blingPedidoId;
        dto.blingPedidoNumero = link.blingPedidoNumero;
        dto.blingSituacao = link.blingSituacao;
        dto.pushedAt = link.pushedAt != null ? link.pushedAt.toString() : null;
        dto.lastSyncAt = link.lastSyncAt != null ? link.lastSyncAt.toString() : null;
    }

    private static void appendPropostaNota(PropostaComercial proposta, String line) {
        String block = "[Bling] " + line;
        if (proposta.observacoes == null || proposta.observacoes.isBlank()) {
            proposta.observacoes = block;
        } else if (!proposta.observacoes.contains(block)) {
            proposta.observacoes = proposta.observacoes.trim() + "\n" + block;
        }
    }

    private static double computePedidoTotal(PropostaComercial proposta, List<PropostaComercialItem> itens) {
        if (itens != null && !itens.isEmpty()) {
            double sum = 0d;
            for (PropostaComercialItem item : itens) {
                int qty = item.quantidade != null ? item.quantidade : 1;
                sum += toBrl(item.valorUnitario) * qty;
            }
            return sum;
        }
        return toBrl(proposta.valorTotalFinal != null ? proposta.valorTotalFinal : proposta.produtoValor);
    }

    private static double toBrl(BigDecimal value) {
        if (value == null) {
            return 0d;
        }
        return value.doubleValue();
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
    }

    private static String text(com.fasterxml.jackson.databind.JsonNode node, String field) {
        if (node == null || !node.has(field) || node.get(field).isNull()) {
            return null;
        }
        return node.get(field).asText(null);
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
