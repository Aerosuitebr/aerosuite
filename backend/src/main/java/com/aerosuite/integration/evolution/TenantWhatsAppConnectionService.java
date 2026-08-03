package com.aerosuite.integration.evolution;

import com.aerosuite.domain.Tenant;
import com.aerosuite.domain.TenantWhatsAppConnection;
import com.aerosuite.domain.WhatsAppConnectionStatus;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.integration.evolution.dto.TenantWhatsAppConnectionViewDto;
import com.aerosuite.security.SecretCipher;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;
import org.jboss.logging.Logger;

/**
 * Persistência e resolução das credenciais WhatsApp por tenant.
 */
@ApplicationScoped
public class TenantWhatsAppConnectionService {

    private static final Logger LOG = Logger.getLogger(TenantWhatsAppConnectionService.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    @Inject
    EvolutionPlatformConfig platformConfig;

    @Inject
    SecretCipher secretCipher;

    public TenantWhatsAppConnectionViewDto getConnectionView(long tenantId, boolean canManage) {
        TenantWhatsAppConnectionViewDto dto = new TenantWhatsAppConnectionViewDto();
        dto.platformEnabled = platformConfig.isPlatformEnabled();
        dto.platformConfigured = platformConfig.isConfigured();
        dto.canManage = canManage;

        if (!dto.platformEnabled) {
            dto.message = ApiI18nMessages.encode(ApiI18nMessages.EVOLUTION_PLATFORM_DISABLED);
            return dto;
        }
        if (!dto.platformConfigured) {
            dto.message = ApiI18nMessages.encode(ApiI18nMessages.EVOLUTION_PLATFORM_NOT_CONFIGURED);
            return dto;
        }

        TenantWhatsAppConnection conn = TenantWhatsAppConnection.findForTenant(tenantId);
        dto.linked = conn != null;
        if (conn != null) {
            dto.instanceName = conn.whatsappInstanceName;
            dto.status = conn.whatsappStatus;
            dto.connected = conn.statusEnum() == WhatsAppConnectionStatus.CONNECTED;
            dto.connectedAt = conn.connectedAt != null ? conn.connectedAt.toString() : null;
            dto.message = dto.connected
                    ? ApiI18nMessages.encode(ApiI18nMessages.EVOLUTION_STATUS_CONNECTED)
                    : ApiI18nMessages.encode(ApiI18nMessages.EVOLUTION_STATUS_NOT_CONNECTED);
        } else {
            dto.message = ApiI18nMessages.encode(ApiI18nMessages.EVOLUTION_STATUS_NOT_ACTIVATED);
        }
        return dto;
    }

    public Optional<TenantWhatsAppConnection> findForTenant(long tenantId) {
        return Optional.ofNullable(TenantWhatsAppConnection.findForTenant(tenantId));
    }

    public Optional<String> resolveInstanceToken(long tenantId) {
        TenantWhatsAppConnection conn = TenantWhatsAppConnection.findForTenant(tenantId);
        if (conn == null || conn.whatsappTokenEnc == null || conn.whatsappTokenEnc.isBlank()) {
            return Optional.empty();
        }
        try {
            return Optional.of(secretCipher.decrypt(conn.whatsappTokenEnc));
        } catch (Exception e) {
            LOG.warnf(e, "Falha ao decifrar token WhatsApp do tenant %d", tenantId);
            return Optional.empty();
        }
    }

    public boolean isOperational(long tenantId) {
        if (!platformConfig.isConfigured()) {
            return false;
        }
        TenantWhatsAppConnection conn = TenantWhatsAppConnection.findForTenant(tenantId);
        return conn != null && conn.statusEnum() == WhatsAppConnectionStatus.CONNECTED;
    }

    @Transactional
    public TenantWhatsAppConnection saveConnection(
            long tenantId,
            String instanceName,
            String plainToken,
            WhatsAppConnectionStatus status,
            Integer connectedByUsuarioId) {
        TenantWhatsAppConnection conn = TenantWhatsAppConnection.findForTenant(tenantId);
        if (conn == null) {
            conn = new TenantWhatsAppConnection();
            conn.tenantId = tenantId;
        }
        conn.whatsappInstanceName = instanceName;
        conn.whatsappTokenEnc = secretCipher.encrypt(plainToken);
        conn.setStatus(status);
        conn.connectedByUsuarioId = connectedByUsuarioId;
        conn.persist();
        return conn;
    }

    @Transactional
    public void updateStatus(long tenantId, WhatsAppConnectionStatus status) {
        TenantWhatsAppConnection conn = TenantWhatsAppConnection.findForTenant(tenantId);
        if (conn == null) {
            return;
        }
        WhatsAppConnectionStatus previous = conn.statusEnum();
        conn.setStatus(status);
        if (status == WhatsAppConnectionStatus.CONNECTED) {
            conn.connectedAt = LocalDateTime.now();
        }
        conn.persist();
        if (previous != status) {
            LOG.infof("WhatsApp tenant %d: status %s -> %s", tenantId, previous, status);
        }
    }

    @Transactional
    public void updateStatusByInstanceName(String instanceName, WhatsAppConnectionStatus status) {
        TenantWhatsAppConnection conn = TenantWhatsAppConnection.findByInstanceName(instanceName);
        if (conn == null) {
            LOG.warnf("Webhook Evolution: instância desconhecida %s", instanceName);
            return;
        }
        updateStatus(conn.tenantId, status);
    }

    @Transactional
    public void removeConnection(long tenantId) {
        TenantWhatsAppConnection.delete("tenantId", tenantId);
    }

    public String buildInstanceName(Tenant tenant) {
        String codigo = tenant.codigo != null ? tenant.codigo.trim().toLowerCase() : String.valueOf(tenant.id);
        String sanitized = codigo.replaceAll("[^a-z0-9-]", "-").replaceAll("-+", "-");
        if (sanitized.isBlank()) {
            sanitized = "t" + tenant.id;
        }
        return "aerosuite-" + sanitized;
    }

    public String generateInstanceToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
