package com.aerosuite.service;

import com.aerosuite.domain.Tenant;
import com.aerosuite.domain.TenantConstants;
import com.aerosuite.domain.Usuario;
import com.aerosuite.domain.UsuarioExterno;
import com.aerosuite.dto.TenantLoginOptionDto;
import jakarta.enterprise.context.ApplicationScoped;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@ApplicationScoped
public class TenantLoginService {

    private static final DateTimeFormatter TENANT_LABEL_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public record ResolvedLogin<T>(long tenantId, T user) {}

    public long resolveTenantId(String tenantCodigo) {
        if (tenantCodigo == null || tenantCodigo.isBlank()) {
            return TenantConstants.DEFAULT_TENANT_ID;
        }
        String codigo = tenantCodigo.trim().toLowerCase(Locale.ROOT);
        Tenant tenant = Tenant.find("codigo = ?1 and ativo = true", codigo).firstResult();
        if (tenant == null) {
            throw AuthLoginException.of("TENANT_NOT_FOUND");
        }
        return tenant.id;
    }

    public List<TenantLoginOptionDto> listTenantsForInternalEmail(String email) {
        return listTenantsForEmail(email, true);
    }

    public List<TenantLoginOptionDto> listTenantsForExternalEmail(String email) {
        return listTenantsForEmail(email, false);
    }

    private List<TenantLoginOptionDto> listTenantsForEmail(String email, boolean internal) {
        if (email == null || email.isBlank()) {
            return List.of();
        }
        String normalized = normalizeEmail(email);
        Map<Long, TenantLoginOptionDto> byId = new LinkedHashMap<>();
        if (internal) {
            @SuppressWarnings("unchecked")
            List<Usuario> users = (List<Usuario>) (List<?>) Usuario.list(
                    "email = ?1 and ativo = true", normalized);
            for (Usuario u : users) {
                if (u.orgTenantId != null) {
                    addTenantOption(byId, u.orgTenantId);
                }
            }
        } else {
            @SuppressWarnings("unchecked")
            List<UsuarioExterno> users = (List<UsuarioExterno>) (List<?>) UsuarioExterno.list(
                    "email = ?1 and ativo = true", normalized);
            for (UsuarioExterno u : users) {
                if (u.orgTenantId != null) {
                    addTenantOption(byId, u.orgTenantId);
                }
            }
        }
        return byId.values().stream()
                .sorted(Comparator.comparing(t -> t.nome != null ? t.nome : ""))
                .toList();
    }

    private void addTenantOption(Map<Long, TenantLoginOptionDto> byId, long tenantId) {
        if (byId.containsKey(tenantId)) {
            return;
        }
        Tenant t = Tenant.findById(tenantId);
        if (t != null && Boolean.TRUE.equals(t.ativo)) {
            String criadoEm = t.createdAt != null ? TENANT_LABEL_DATE.format(t.createdAt) : null;
            String label = buildTenantLabel(t.nome, t.codigo, criadoEm, t.id);
            byId.put(tenantId, new TenantLoginOptionDto(t.id, t.codigo, t.nome, label, criadoEm));
        }
    }

    private static String buildTenantLabel(String nome, String codigo, String criadoEm, Long id) {
        String n = nome != null && !nome.isBlank() ? nome.trim() : (codigo != null ? codigo.trim() : "Org");
        String c = codigo != null && !codigo.isBlank() ? codigo.trim() : "?";
        StringBuilder sb = new StringBuilder(n).append(" · ").append(c);
        if (criadoEm != null && !criadoEm.isBlank()) {
            sb.append(" · ").append(criadoEm);
        }
        if (id != null) {
            sb.append(" · #").append(id);
        }
        return sb.toString();
    }

    /**
     * Resolve utilizador interno por e-mail + organização (ex.: recuperação de senha).
     */
    public ResolvedLogin<Usuario> resolveInternalUserByEmail(String email, String tenantCodigo) {
        if (email == null || email.isBlank()) {
            throw AuthLoginException.of("INVALID_CREDENTIALS");
        }
        String normalized = normalizeEmail(email);
        @SuppressWarnings("unchecked")
        List<Usuario> active = (List<Usuario>) (List<?>) Usuario.list(
                "email = ?1 and ativo = true", normalized);
        if (active.isEmpty()) {
            throw AuthLoginException.of("INVALID_CREDENTIALS");
        }
        if (tenantCodigo != null && !tenantCodigo.isBlank()) {
            long tid = resolveTenantId(tenantCodigo);
            Usuario match = active.stream()
                    .filter(u -> u.orgTenantId != null && u.orgTenantId == tid)
                    .findFirst()
                    .orElse(null);
            if (match == null) {
                throw AuthLoginException.of("INVALID_CREDENTIALS");
            }
            return new ResolvedLogin<>(tid, match);
        }
        if (active.size() == 1) {
            Usuario u = active.get(0);
            long tid = u.orgTenantId != null ? u.orgTenantId : TenantConstants.DEFAULT_TENANT_ID;
            return new ResolvedLogin<>(tid, u);
        }
        throw AuthLoginException.of("TENANT_REQUIRED");
    }

    public ResolvedLogin<Usuario> resolveInternalLogin(String email, String password, String tenantCodigo) {
        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            throw AuthLoginException.of("INVALID_CREDENTIALS");
        }
        String normalized = normalizeEmail(email);
        if (tenantCodigo != null && !tenantCodigo.isBlank()) {
            long tid = resolveTenantId(tenantCodigo);
            Usuario match = loadInternalUserForAuth(normalized, tid);
            if (match == null) {
                throw AuthLoginException.of("INVALID_CREDENTIALS");
            }
            return new ResolvedLogin<>(tid, match);
        }
        long activeCount = Usuario.count("email = ?1 and ativo = true", normalized);
        if (activeCount == 0) {
            throw AuthLoginException.of("INVALID_CREDENTIALS");
        }
        if (activeCount > 1) {
            throw AuthLoginException.of("TENANT_REQUIRED");
        }
        Usuario u = Usuario.find("email = ?1 and ativo = true", normalized).firstResult();
        long tid = u.orgTenantId != null ? u.orgTenantId : TenantConstants.DEFAULT_TENANT_ID;
        Usuario loaded = loadInternalUserForAuth(normalized, tid);
        return new ResolvedLogin<>(tid, loaded != null ? loaded : u);
    }

    /** Credenciais — sem JOIN FETCH de funcionalidades (validação de senha). */
    private Usuario loadInternalUserForAuth(String normalizedEmail, long tenantId) {
        return Usuario.find(
                "email = ?1 and ativo = true and orgTenantId = ?2",
                normalizedEmail,
                tenantId)
                .firstResult();
    }

    /** Perfil para DTO — sem JOIN FETCH da coleção de funcionalidades. */
    public Usuario loadInternalUserWithPerfil(String normalizedEmail, long tenantId) {
        return Usuario.find(
                        "SELECT DISTINCT u FROM Usuario u "
                                + "LEFT JOIN FETCH u.perfil p "
                                + "WHERE u.email = ?1 and u.ativo = true and u.orgTenantId = ?2",
                        normalizedEmail,
                        tenantId)
                .firstResult();
    }

    public ResolvedLogin<UsuarioExterno> resolveExternalLogin(String email, String tenantCodigo) {
        if (email == null || email.isBlank()) {
            throw AuthLoginException.of("INVALID_CREDENTIALS");
        }
        String normalized = normalizeEmail(email);
        @SuppressWarnings("unchecked")
        List<UsuarioExterno> active = (List<UsuarioExterno>) (List<?>) UsuarioExterno.list(
                "email = ?1 and ativo = true", normalized);
        if (active.isEmpty()) {
            throw AuthLoginException.of("INVALID_CREDENTIALS");
        }
        if (tenantCodigo != null && !tenantCodigo.isBlank()) {
            long tid = resolveTenantId(tenantCodigo);
            UsuarioExterno match = active.stream()
                    .filter(u -> u.orgTenantId != null && u.orgTenantId == tid)
                    .findFirst()
                    .orElse(null);
            if (match == null) {
                throw AuthLoginException.of("INVALID_CREDENTIALS");
            }
            return new ResolvedLogin<>(tid, match);
        }
        if (active.size() == 1) {
            UsuarioExterno u = active.get(0);
            long tid = u.orgTenantId != null ? u.orgTenantId : TenantConstants.DEFAULT_TENANT_ID;
            return new ResolvedLogin<>(tid, u);
        }
        throw AuthLoginException.of("TENANT_REQUIRED");
    }

    public void enrichUserDtoWithTenant(com.aerosuite.dto.UserDto dto, long tenantId) {
        if (dto == null) {
            return;
        }
        enrichUserDtoWithTenant(dto, Tenant.findById(tenantId));
    }

    public void enrichUserDtoWithTenant(com.aerosuite.dto.UserDto dto, Tenant tenant) {
        if (dto == null) {
            return;
        }
        if (tenant == null) {
            return;
        }
        dto.tenantId = tenant.id;
        dto.tenantCodigo = tenant.codigo;
        dto.tenantNome = tenant.nome;
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
