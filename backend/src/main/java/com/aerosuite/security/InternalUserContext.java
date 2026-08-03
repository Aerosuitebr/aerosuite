package com.aerosuite.security;

import jakarta.enterprise.context.RequestScoped;

import java.util.Collections;
import java.util.Locale;
import java.util.Set;

/**
 * Utilizador interno autenticado no pedido atual (preenchido pelo {@link JwtAuthenticationFilter}).
 * Substitui confiança cega em cabeçalhos {@code X-User-Id} / {@code X-User-Name} quando há token válido.
 * Códigos de funcionalidade são preenchidos pelo {@link PermissionAuthorizationFilter} quando o recurso
 * declara {@link RequiresFuncionalidades}.
 */
@RequestScoped
public class InternalUserContext {

    private Integer userId;
    /** Tenant lógico do utilizador autenticado (JWT claim {@code tid} + validação BD). */
    private Long tenantId;
    /** Durante provisão de organização (operação na plataforma), força o tenant Hibernate. */
    private Long provisioningTenantOverride;
    private String email;
    private String nome;
    private boolean authenticated;
    private String perfilCodigo;
    private Set<String> funcionalidadeCodigos = Collections.emptySet();
    /** {@code true} após {@link #applyPermissionSnapshot} neste pedido. */
    private boolean permissionsHydrated;
    /** Sessão elevada do plano de controle ({@code typ=pop} no JWT). */
    private boolean platformOpsElevated;
    /** Epoch seconds da última confirmação MFA no token {@code pop}. */
    private Long platformOpsMfaAtEpochSec;

    public void setInternalUser(Integer userId, String email, String nome, Long tenantId) {
        this.userId = userId;
        this.tenantId = tenantId != null ? tenantId : null;
        this.email = email;
        this.nome = nome;
        this.authenticated = userId != null;
        this.perfilCodigo = null;
        this.funcionalidadeCodigos = Collections.emptySet();
        this.permissionsHydrated = false;
        this.platformOpsElevated = false;
        this.platformOpsMfaAtEpochSec = null;
    }

    /**
     * Atualiza o snapshot de permissões (perfil + códigos de funcionalidade ativos).
     */
    public void applyPermissionSnapshot(String perfilCodigo, Set<String> funcionalidadeCodigos) {
        this.perfilCodigo = perfilCodigo;
        this.funcionalidadeCodigos = funcionalidadeCodigos != null
                ? Collections.unmodifiableSet(funcionalidadeCodigos)
                : Collections.emptySet();
        this.permissionsHydrated = true;
    }

    public boolean isPermissionsHydrated() {
        return permissionsHydrated;
    }

    public void setProvisioningTenant(Long tenantId) {
        this.provisioningTenantOverride = tenantId;
    }

    public void clearProvisioningTenant() {
        this.provisioningTenantOverride = null;
    }

    public void clear() {
        this.userId = null;
        this.tenantId = null;
        this.provisioningTenantOverride = null;
        this.email = null;
        this.nome = null;
        this.authenticated = false;
        this.perfilCodigo = null;
        this.funcionalidadeCodigos = Collections.emptySet();
        this.permissionsHydrated = false;
        this.platformOpsElevated = false;
        this.platformOpsMfaAtEpochSec = null;
    }

    public void setPlatformOpsMfaAtEpochSec(Long platformOpsMfaAtEpochSec) {
        this.platformOpsMfaAtEpochSec = platformOpsMfaAtEpochSec;
    }

    public Long getPlatformOpsMfaAtEpochSec() {
        return platformOpsMfaAtEpochSec;
    }

    public void setPlatformOpsElevated(boolean platformOpsElevated) {
        this.platformOpsElevated = platformOpsElevated;
    }

    public boolean isPlatformOpsElevated() {
        return platformOpsElevated;
    }

    public boolean isAuthenticated() {
        return authenticated;
    }

    public Integer getUserId() {
        return userId;
    }

    public Long getTenantId() {
        return provisioningTenantOverride != null ? provisioningTenantOverride : tenantId;
    }

    public String getEmail() {
        return email;
    }

    public String getNome() {
        return nome;
    }

    public String getPerfilCodigo() {
        return perfilCodigo;
    }

    public Set<String> getFuncionalidadeCodigos() {
        return funcionalidadeCodigos;
    }

    public boolean hasFuncionalidadeCodigo(String codigo) {
        if (codigo == null || codigo.isBlank()) {
            return false;
        }
        String w = codigo.trim().toUpperCase(Locale.ROOT);
        for (String c : funcionalidadeCodigos) {
            if (c != null && c.trim().toUpperCase(Locale.ROOT).equals(w)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Verifica correspondência a uma família de códigos (ex.: prefixo {@code ESTOQUE} aceita
     * {@code ESTOQUE} e {@code ESTOQUE_DASHBOARD}).
     */
    public boolean hasFuncionalidadeCodigoStartingWith(String prefix) {
        if (prefix == null || prefix.isBlank()) {
            return false;
        }
        String p = prefix.trim().toUpperCase(Locale.ROOT);
        for (String c : funcionalidadeCodigos) {
            if (c == null) {
                continue;
            }
            String cu = c.trim().toUpperCase(Locale.ROOT);
            if (cu.equals(p) || cu.startsWith(p + "_")) {
                return true;
            }
        }
        return false;
    }

    public boolean hasAnyFuncionalidadeCodigoIgnoreCase(String... codigos) {
        if (codigos == null) {
            return false;
        }
        for (String wanted : codigos) {
            if (wanted == null || wanted.isBlank()) {
                continue;
            }
            String w = wanted.trim().toUpperCase(Locale.ROOT);
            for (String have : funcionalidadeCodigos) {
                if (have != null && have.trim().toUpperCase(Locale.ROOT).equals(w)) {
                    return true;
                }
            }
        }
        return false;
    }
}
