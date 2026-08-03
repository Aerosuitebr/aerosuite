package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;

import com.aerosuite.domain.ClienteProposta;
import com.aerosuite.domain.ClientePropostaBlingMap;
import com.aerosuite.domain.TenantConstants;
import com.aerosuite.dto.ClientePropostaDto;
import com.aerosuite.integration.bling.BlingContactDto;
import com.aerosuite.integration.bling.BlingImportClienteResultDto;
import com.aerosuite.integration.bling.BlingTenantApiClient;
import com.aerosuite.mapping.ClientePropostaMapper;
import com.aerosuite.security.InternalUserContext;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.Locale;
import org.jboss.logging.Logger;

@ApplicationScoped
public class BlingContactSyncService {

    private static final Logger LOG = Logger.getLogger(BlingContactSyncService.class);

    @Inject
    BlingTenantApiClient tenantApiClient;

    @Inject
    ClientePropostaMapper clienteMapper;

    @Inject
    InternalUserContext internalUserContext;

    @Transactional
    public BlingImportClienteResultDto importContact(long tenantId, long blingContatoId, Integer userId) {
        return runInTenant(tenantId, () -> {
            BlingContactDto contact = tenantApiClient.fetchContact(tenantId, blingContatoId);
            if (contact == null || contact.id == null) {
                throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.BLING_CONTACT_NOT_FOUND, "id", String.valueOf(blingContatoId)));
            }
            SyncOutcome outcome = upsertFromBlingContact(tenantId, contact, "IMPORT", userId);
            BlingImportClienteResultDto dto = new BlingImportClienteResultDto();
            dto.blingContatoId = contact.id;
            dto.cliente = clienteMapper.toDto(outcome.cliente);
            dto.created = outcome.created;
            dto.linked = true;
            dto.message = outcome.created
                    ? ApiI18nMessages.encode(ApiI18nMessages.BLING_CONTACT_IMPORTED)
                    : ApiI18nMessages.encode(ApiI18nMessages.BLING_CONTACT_UPDATED);
            return dto;
        });
    }

    @Transactional
    public void processWebhookContactEvent(long tenantId, JsonNode payloadRoot) {
        runInTenant(tenantId, () -> {
            long contatoId = extractContatoId(payloadRoot);
            if (contatoId <= 0) {
                throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.BLING_WEBHOOK_NO_CONTACT_ID));
            }
            BlingContactDto contact = tenantApiClient.fetchContact(tenantId, contatoId);
            if (contact == null) {
                LOG.infof("Contato Bling %d removido ou indisponível — ignorando sync", contatoId);
                return null;
            }
            upsertFromBlingContact(tenantId, contact, "WEBHOOK", null);
            return null;
        });
    }

    @Transactional
    public ClientePropostaDto linkExisting(long tenantId, long blingContatoId, int clientePropostaId) {
        return runInTenant(tenantId, () -> {
            ClienteProposta cliente = ClienteProposta.findById(clientePropostaId);
            if (cliente == null || !Boolean.TRUE.equals(cliente.isActive)) {
                throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.BLING_PROPOSTA_CLIENT_NOT_FOUND));
            }
            ClientePropostaBlingMap existingCliente = ClientePropostaBlingMap.findByClienteProposta(tenantId, clientePropostaId);
            if (existingCliente != null && !existingCliente.blingContatoId.equals(blingContatoId)) {
                throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.BLING_CLIENT_ALREADY_LINKED));
            }
            ClientePropostaBlingMap map = ClientePropostaBlingMap.findByBlingContato(tenantId, blingContatoId);
            if (map == null) {
                map = new ClientePropostaBlingMap();
                map.tenantId = tenantId;
                map.clientePropostaId = clientePropostaId;
                map.blingContatoId = blingContatoId;
            } else {
                map.clientePropostaId = clientePropostaId;
            }
            map.lastSyncAt = LocalDateTime.now();
            map.lastSyncSource = "MANUAL";
            map.persist();
            return clienteMapper.toDto(cliente);
        });
    }

    private SyncOutcome upsertFromBlingContact(long tenantId, BlingContactDto contact, String source, Integer userId) {
        ClientePropostaBlingMap map = ClientePropostaBlingMap.findByBlingContato(tenantId, contact.id);
        ClienteProposta entity;
        boolean created = false;
        if (map != null) {
            entity = ClienteProposta.findById(map.clientePropostaId);
            if (entity == null) {
                map.delete();
                map = null;
            }
        } else {
            entity = null;
        }
        if (map == null) {
            entity = findByCnpjCpf(contact.cnpjCpf);
            if (entity == null) {
                entity = new ClienteProposta();
                entity.tenantId = TenantConstants.tenantIdOf(tenantId);
                entity.isActive = true;
                entity.createdBy = userId;
                created = true;
            }
            map = new ClientePropostaBlingMap();
            map.tenantId = tenantId;
            map.blingContatoId = contact.id;
            map.clientePropostaId = null;
        }
        applyContactFields(entity, contact);
        if (created || entity.id == null) {
            entity.persist();
        }
        map.clientePropostaId = entity.id;
        map.lastSyncAt = LocalDateTime.now();
        map.lastSyncSource = source;
        map.persist();
        return new SyncOutcome(entity, created);
    }

    private ClienteProposta findByCnpjCpf(String cnpjCpf) {
        if (cnpjCpf == null || cnpjCpf.isBlank()) {
            return null;
        }
        String normalized = cnpjCpf.replaceAll("\\D", "");
        ClienteProposta exact = ClienteProposta.find("isActive = true and cnpjCpf = ?1", cnpjCpf.trim())
                .firstResult();
        if (exact != null) {
            return exact;
        }
        if (normalized.isBlank()) {
            return null;
        }
        @SuppressWarnings("unchecked")
        java.util.List<ClienteProposta> list = (java.util.List<ClienteProposta>) (java.util.List<?>)
                ClienteProposta.find("isActive = true and cnpjCpf is not null").list();
        for (ClienteProposta c : list) {
            if (c.cnpjCpf != null && c.cnpjCpf.replaceAll("\\D", "").equals(normalized)) {
                return c;
            }
        }
        return null;
    }

    private static void applyContactFields(ClienteProposta entity, BlingContactDto contact) {
        if (contact.nome != null && !contact.nome.isBlank()) {
            entity.nome = contact.nome.trim();
        }
        if (contact.cnpjCpf != null && !contact.cnpjCpf.isBlank()) {
            entity.cnpjCpf = contact.cnpjCpf.trim();
        }
        if (contact.email != null && !contact.email.isBlank()) {
            entity.email = contact.email.trim();
        }
        if (contact.telefone != null && !contact.telefone.isBlank()) {
            entity.telefone = contact.telefone.trim();
        }
        if (contact.endereco != null && !contact.endereco.isBlank()) {
            entity.endereco = contact.endereco.trim();
        }
        if (contact.cidade != null && !contact.cidade.isBlank()) {
            entity.cidade = contact.cidade.trim();
        }
        if (contact.uf != null && !contact.uf.isBlank()) {
            entity.estado = contact.uf.trim();
        }
    }

    static long extractContatoId(JsonNode root) {
        if (root == null) {
            return 0;
        }
        JsonNode data = root.get("data");
        if (data != null) {
            if (data.has("id")) {
                return data.path("id").asLong(0);
            }
            JsonNode contato = data.get("contato");
            if (contato != null && contato.has("id")) {
                return contato.path("id").asLong(0);
            }
        }
        return root.path("resourceId").asLong(0);
    }

    static boolean isContactEvent(String eventType, JsonNode root) {
        String resource = text(root, "$resource");
        String up = (eventType + " " + (resource != null ? resource : "")).toLowerCase(Locale.ROOT);
        return up.contains("contato") || up.contains("contact");
    }

    private static String text(JsonNode node, String field) {
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

    private record SyncOutcome(ClienteProposta cliente, boolean created) {}
}
