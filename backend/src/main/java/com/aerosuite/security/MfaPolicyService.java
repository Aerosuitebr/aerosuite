package com.aerosuite.security;

import com.aerosuite.domain.SistemaConfig;
import com.aerosuite.domain.Usuario;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Map;
import java.util.Set;

/** Política MFA: tenant com autenticacao_dupla + perfis críticos Part 145 / admin. */
@ApplicationScoped
public class MfaPolicyService {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private static final Set<String> PERFIS_CRITICOS = Set.of(
            "P145_RT",
            "P145_INSPETOR",
            "ADMIN",
            "ADMINISTRADOR");

    public boolean isMfaRequired(Usuario usuario) {
        if (usuario == null) {
            return false;
        }
        if (!isAutenticacaoDuplaEnabled(usuario.orgTenantId)) {
            return false;
        }
        return isPerfilCritico(usuario);
    }

    public boolean isPerfilCritico(Usuario usuario) {
        if (usuario == null || usuario.perfil == null || usuario.perfil.getCodigo() == null) {
            return false;
        }
        return PERFIS_CRITICOS.contains(usuario.perfil.getCodigo().trim().toUpperCase());
    }

    public boolean isAutenticacaoDuplaEnabled(Long tenantId) {
        if (tenantId == null) {
            return false;
        }
        SistemaConfig row = SistemaConfig.find("tenantId", String.valueOf(tenantId)).firstResult();
        if (row == null || row.valoresJson == null || row.valoresJson.isBlank()) {
            return false;
        }
        try {
            Map<String, Object> valores = MAPPER.readValue(row.valoresJson, new TypeReference<>() {});
            Object flag = valores.get("autenticacao_dupla");
            if (flag instanceof Boolean b) {
                return b;
            }
            return "true".equalsIgnoreCase(String.valueOf(flag));
        } catch (Exception e) {
            return false;
        }
    }
}
