package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;

import com.aerosuite.domain.SistemaConfig;
import com.aerosuite.dto.sistema.SistemaConfigDto;
import com.aerosuite.dto.sistema.SistemaConfigWriteDto;
import com.aerosuite.security.BackgroundTenantContext;
import com.aerosuite.security.TenantDataAccess;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

@ApplicationScoped
public class SistemaConfigService {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Inject
    TenantDataAccess tenantDataAccess;

    private String hibernateTenantId() {
        String bgTid = BackgroundTenantContext.currentTenantId();
        if (bgTid != null && !bgTid.isBlank()) {
            return bgTid;
        }
        return tenantDataAccess.currentTenantIdStr();
    }

    private SistemaConfig configForCurrentTenant() {
        String tid = hibernateTenantId();
        SistemaConfig row = SistemaConfig.find("tenantId", tid).firstResult();
        if (row != null && !tid.equals(row.tenantId)) {
            return null;
        }
        return row;
    }

    private static final Set<String> CHAVES_VALORES = Set.of(
            "nome_sistema", "versao_sistema", "timeout_sessao", "manutencao_modo",
            "senha_minima", "tentativas_login", "autenticacao_dupla", "nivel_log",
            "email_smtp", "email_porta", "notificacoes_push",
            "frequencia_backup", "retencao_backup", "backup_criptografado");

    private static final Set<String> CHAVES_AVANCADAS = Set.of(
            "logsDetalhados", "backupAutomatico", "notificacoesEmail");

    public boolean isNotificacoesEmailEnabled() {
        SistemaConfigDto dto = getForCurrentTenant();
        Object flag = dto.avancadas != null ? dto.avancadas.get("notificacoesEmail") : null;
        if (flag instanceof Boolean b) {
            return b;
        }
        return !"false".equalsIgnoreCase(String.valueOf(flag));
    }

    public SistemaConfigDto getForCurrentTenant() {
        SistemaConfigDto dto = new SistemaConfigDto();
        dto.valores = defaultValores();
        dto.avancadas = defaultAvancadas();

        SistemaConfig row = configForCurrentTenant();
        if (row != null) {
            mergeMaps(dto.valores, parseMap(row.valoresJson));
            mergeMaps(dto.avancadas, parseMap(row.avancadasJson));
            dto.updatedAt = row.updatedAt;
        }
        syncLogsFromNivel(dto);
        return dto;
    }

    @Transactional
    public SistemaConfigDto upsert(SistemaConfigWriteDto body, Integer usuarioId) {
        if (body == null) {
            throw new BadRequestException(ApiI18nMessages.domain("sistema.config.error.body_obrigatorio"));
        }
        if (Boolean.TRUE.equals(body.restaurarPadroes)) {
            SistemaConfig existing = configForCurrentTenant();
            if (existing != null) {
                existing.delete();
            }
            return getForCurrentTenant();
        }

        Map<String, Object> valores = sanitizeValores(body.valores);
        Map<String, Object> avancadas = sanitizeAvancadas(body.avancadas);
        applyLogsToNivel(valores, avancadas);

        SistemaConfig row = configForCurrentTenant();
        if (row == null) {
            row = new SistemaConfig();
            row.tenantId = hibernateTenantId();
        } else {
            row.tenantId = hibernateTenantId();
        }
        try {
            row.valoresJson = MAPPER.writeValueAsString(valores);
            row.avancadasJson = MAPPER.writeValueAsString(avancadas);
        } catch (Exception e) {
            throw new BadRequestException(ApiI18nMessages.domain("sistema.config.error.json_invalido"));
        }
        row.updatedByUsuarioId = usuarioId;
        row.persist();

        SistemaConfigDto dto = new SistemaConfigDto();
        dto.valores = valores;
        dto.avancadas = avancadas;
        dto.updatedAt = row.updatedAt;
        return dto;
    }

    private static Map<String, Object> defaultValores() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("nome_sistema", "AEROSUITE CONTROLS");
        m.put("versao_sistema", "1.0.0");
        m.put("timeout_sessao", 30);
        m.put("manutencao_modo", false);
        m.put("senha_minima", 8);
        m.put("tentativas_login", 3);
        m.put("autenticacao_dupla", false);
        m.put("nivel_log", "INFO");
        m.put("email_smtp", "smtp.gmail.com");
        m.put("email_porta", 587);
        m.put("notificacoes_push", true);
        m.put("frequencia_backup", "DIARIO");
        m.put("retencao_backup", 30);
        m.put("backup_criptografado", true);
        return m;
    }

    private static Map<String, Object> defaultAvancadas() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("logsDetalhados", false);
        m.put("backupAutomatico", true);
        m.put("notificacoesEmail", true);
        return m;
    }

    private static Map<String, Object> sanitizeValores(Map<String, Object> input) {
        Map<String, Object> base = defaultValores();
        if (input == null) {
            return base;
        }
        for (String key : CHAVES_VALORES) {
            if (input.containsKey(key) && input.get(key) != null) {
                base.put(key, input.get(key));
            }
        }
        return base;
    }

    private static Map<String, Object> sanitizeAvancadas(Map<String, Object> input) {
        Map<String, Object> base = defaultAvancadas();
        if (input == null) {
            return base;
        }
        for (String key : CHAVES_AVANCADAS) {
            if (input.containsKey(key) && input.get(key) != null) {
                base.put(key, input.get(key));
            }
        }
        return base;
    }

    private static void applyLogsToNivel(Map<String, Object> valores, Map<String, Object> avancadas) {
        Object logs = avancadas.get("logsDetalhados");
        if (Boolean.TRUE.equals(logs instanceof Boolean b ? b : parseBool(logs))) {
            valores.put("nivel_log", "DEBUG");
        }
    }

    private static void syncLogsFromNivel(SistemaConfigDto dto) {
        Object nivel = dto.valores.get("nivel_log");
        if ("DEBUG".equals(String.valueOf(nivel))) {
            dto.avancadas.put("logsDetalhados", true);
        }
    }

    private static boolean parseBool(Object v) {
        if (v instanceof Boolean b) {
            return b;
        }
        return "true".equalsIgnoreCase(String.valueOf(v));
    }

    private static Map<String, Object> parseMap(String json) {
        if (json == null || json.isBlank()) {
            return new LinkedHashMap<>();
        }
        try {
            return MAPPER.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return new LinkedHashMap<>();
        }
    }

    private static void mergeMaps(Map<String, Object> target, Map<String, Object> overlay) {
        if (overlay == null) {
            return;
        }
        for (Map.Entry<String, Object> e : overlay.entrySet()) {
            if (e.getValue() != null) {
                target.put(e.getKey(), e.getValue());
            }
        }
    }
}
