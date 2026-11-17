package com.aerosuite.service;

import com.aerosuite.domain.Tenant;
import com.aerosuite.domain.TenantConstants;
import com.aerosuite.domain.Usuario;
import com.aerosuite.dto.LoginResponse;
import com.aerosuite.dto.UserDto;
import com.aerosuite.model.Funcionalidade;
import com.aerosuite.security.InternalUserContext;
import com.aerosuite.security.JwtTokenService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.NotFoundException;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@ApplicationScoped
public class TenantSupportService {
    public static final String ADMIN_PROFILE = "ADMIN";

    @Inject InternalUserContext context;
    @Inject PlatformOpsAuthService platformAuth;
    @Inject JwtTokenService tokens;
    @Inject AccessAuditRecorder audit;
    @Inject FuncionalidadeService funcionalidades;
    @Inject TenantModuleService modules;
    @Inject TenantFeatureService features;
    @Inject TenantBillingService billing;

    @ConfigProperty(name = "aero.suite.platform.ops.mfa-required", defaultValue = "true")
    boolean mfaRequired;
    @ConfigProperty(name = "aero.suite.platform.ops.mfa-revalidate-minutes", defaultValue = "30")
    int mfaRevalidateMinutes;

    public LoginResponse open(long tenantId, String ip, String userAgent) {
        Instant now = Instant.now();
        Long mfaAt = context.getPlatformOpsMfaAtEpochSec();
        Long parentExpires = context.getPlatformOpsExpiresAtEpochSec();
        if (!context.isPlatformOpsElevated() || !mfaRequired || mfaAt == null || parentExpires == null) {
            throw new ForbiddenException("Use uma sessão elevada com MFA para acessar a organização.");
        }
        long expiry = Math.min(Math.min(parentExpires, mfaAt + Math.max(5, mfaRevalidateMinutes) * 60L),
                now.plusSeconds(15 * 60).getEpochSecond());
        if (expiry <= now.getEpochSecond()) {
            throw new ForbiddenException("Confirme o MFA novamente antes de acessar a organização.");
        }
        Usuario operator = requireOperator();
        Tenant tenant = requireActiveTenant(tenantId);
        UserDto user = sessionUser(operator, tenant);
        audit.persist("PLATFORM_TENANT_SUPPORT_OPEN", true, tenant.id, operator.id, operator.email,
                "Sessão administrativa temporária", ip, userAgent, "/api/platform/control/tenants/" + tenant.id + "/support-session");
        return new LoginResponse(tokens.mintTenantSupportToken(operator, tenant.id, Instant.ofEpochSecond(expiry)), user);
    }

    public void validateRequest() {
        requireOperator();
        requireActiveTenant(context.getTenantId());
        context.applyPermissionSnapshot(ADMIN_PROFILE,
                funcionalidades.listarCodigosParaGestaoRbac().stream().collect(Collectors.toUnmodifiableSet()));
    }

    public UserDto currentSessionUser() {
        return sessionUser(requireOperator(), requireActiveTenant(context.getTenantId()));
    }

    public void auditChange(String method, String path, String ip, String userAgent) {
        audit.persist("PLATFORM_TENANT_SUPPORT_REQUEST", true, context.getTenantId(), context.getUserId(),
                context.getEmail(), method, ip, userAgent, path);
    }

    private Usuario requireOperator() {
        Integer id = context.getUserId();
        Usuario operator = id == null ? null : Usuario.findById(id);
        if (operator == null || !Boolean.TRUE.equals(operator.ativo) || !Boolean.TRUE.equals(operator.mfaEnabled)
                || !Objects.equals(operator.orgTenantId, TenantConstants.DEFAULT_TENANT_ID)
                || !Objects.equals(operator.email, context.getEmail())
                || !platformAuth.isEmailEligible(operator.email)) {
            throw new ForbiddenException("Acesso reservado a operadores ativos do Aero Suite com MFA.");
        }
        return operator;
    }

    private Tenant requireActiveTenant(Long id) {
        Tenant tenant = id == null ? null : Tenant.findById(id);
        if (tenant == null || !Boolean.TRUE.equals(tenant.ativo)) {
            throw new NotFoundException("Organização ativa não encontrada.");
        }
        return tenant;
    }

    private UserDto sessionUser(Usuario operator, Tenant tenant) {
        Set<String> enabledModules = modules.enabledModules(tenant);
        List<Funcionalidade> grants = funcionalidades.listarParaGestaoRbac();
        UserDto user = new UserDto(operator.id, operator.email, operator.nome, ADMIN_PROFILE);
        user.tenantSupport = true;
        user.tenantId = tenant.id;
        user.tenantCodigo = tenant.codigo;
        user.tenantNome = tenant.nome;
        user.perfil = new UserDto.PerfilDto();
        user.perfil.codigo = ADMIN_PROFILE;
        user.perfil.nome = "Suporte Aero Suite";
        user.funcionalidadeCodigos = grants.stream().map(Funcionalidade::getCodigo).distinct().toList();
        user.menuFuncionalidades = funcionalidades.menuSuporte(grants, enabledModules);
        user.modulosHabilitados = List.copyOf(enabledModules);
        user.tenantFeatures = features.featuresForTenant(tenant.id).enabled;
        user.billingStatus = billing.getStatus(tenant.id).status;
        user.lgpdAceitePendente = false;
        return user;
    }
}
