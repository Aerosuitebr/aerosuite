package com.aerosuite.service;

import com.aerosuite.domain.Tenant;
import com.aerosuite.domain.TenantBlingConnection;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import org.jboss.logging.Logger;

@ApplicationScoped
public class BlingWebhookTenantResolver {

    private static final Logger LOG = Logger.getLogger(BlingWebhookTenantResolver.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    public Long resolve(String rawBody, String tenantCodigo) {
        if (tenantCodigo != null && !tenantCodigo.isBlank()) {
            Tenant tenant = Tenant.find("codigo = ?1 and ativo = true", tenantCodigo.trim()).firstResult();
            if (tenant != null) {
                return tenant.id;
            }
            LOG.warnf("Webhook Bling: tenant código desconhecido %s", tenantCodigo);
        }
        if (rawBody == null || rawBody.isBlank()) {
            return null;
        }
        try {
            JsonNode root = MAPPER.readTree(rawBody);
            String companyId = text(root, "companyId");
            if (companyId == null) {
                companyId = text(root.get("data"), "companyId");
            }
            if (companyId != null && !companyId.isBlank()) {
                TenantBlingConnection conn = TenantBlingConnection.findByBlingCompanyId(companyId.trim());
                if (conn != null) {
                    return conn.tenantId;
                }
                LOG.warnf("Webhook Bling: companyId %s sem tenant mapeado", companyId);
            }
        } catch (Exception e) {
            LOG.warn("Webhook Bling: falha ao resolver tenant", e);
        }
        return null;
    }

    private static String text(JsonNode node, String field) {
        if (node == null || !node.has(field) || node.get(field).isNull()) {
            return null;
        }
        return node.get(field).asText(null);
    }
}
