package com.aerosuite.service;

import com.aerosuite.domain.Tenant;
import com.aerosuite.domain.TenantBilling;
import com.aerosuite.domain.TenantBillingEvent;
import com.aerosuite.domain.TenantConstants;
import com.aerosuite.domain.Usuario;
import com.aerosuite.domain.UsuarioExterno;
import com.aerosuite.dto.*;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.security.InternalUserContext;
import com.aerosuite.util.DisplayTextRepair;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@ApplicationScoped
public class PlatformControlService {

    private static final List<String> ALLOWED_PLANOS =
            List.of("trial", "professional", "enterprise", "platform");
    private static final List<String> ALLOWED_STATUS =
            List.of("trialing", "active", "canceled", "checkout_pending", "trial_expired", "past_due");

    @Inject
    EntityManager entityManager;

    @Inject
    AccessAuditQueryService accessAuditQueryService;

    @Inject
    TenantProvisioningService tenantProvisioningService;

    @Inject
    TenantBillingService tenantBillingService;

    @Inject
    InternalUserContext internalUserContext;

    @Transactional
    public PlatformControlOverviewDto getOverview() {
        tenantProvisioningService.requirePlatformOperator();

        PlatformControlOverviewDto dto = new PlatformControlOverviewDto();
        @SuppressWarnings("unchecked")
        List<Tenant> all = (List<Tenant>) (List<?>) Tenant.listAll();
        dto.totalTenants = all.size();
        dto.activeTenants = all.stream().filter(t -> Boolean.TRUE.equals(t.ativo)).count();
        dto.suspendedTenants = dto.totalTenants - dto.activeTenants;

        dto.platformStats = aggregatePlatformStats();
        dto.auditSummary = loadAuditSummary24h();
        dto.billingSummary = buildBillingSummary(listBillingRows());
        dto.recentAuditEvents =
                accessAuditQueryService.list(null, null, null, null, null, 8, 0).items;
        return dto;
    }

    @Transactional
    public PlatformBillingListDto listBilling() {
        tenantProvisioningService.requirePlatformOperator();
        List<PlatformBillingRowDto> items = listBillingRows();
        PlatformBillingSummaryDto summary = buildBillingSummary(items);
        return new PlatformBillingListDto(items, summary);
    }

    @Transactional
    public PlatformBillingRowDto updateBilling(long tenantId, PlatformUpdateBillingRequest request) {
        tenantProvisioningService.requirePlatformOperator();
        requireTenant(tenantId);
        if (request == null) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.BILLING_NOT_CONFIGURED));
        }
        TenantBilling b = TenantBilling.findByTenantId(tenantId);
        if (b == null) {
            tenantBillingService.initBillingForNewTenant(tenantId, tenantId == TenantConstants.DEFAULT_TENANT_ID);
            b = TenantBilling.findByTenantId(tenantId);
        }
        if (request.planoCodigo != null && !request.planoCodigo.isBlank()) {
            String plano = request.planoCodigo.trim().toLowerCase(Locale.ROOT);
            if (!ALLOWED_PLANOS.contains(plano)) {
                throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.BILLING_NOT_CONFIGURED));
            }
            b.planoCodigo = plano;
        }
        if (request.status != null && !request.status.isBlank()) {
            String status = request.status.trim().toLowerCase(Locale.ROOT);
            if (!ALLOWED_STATUS.contains(status)) {
                throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.BILLING_NOT_CONFIGURED));
            }
            b.status = status;
            if ("active".equals(status)) {
                b.trialEndsAt = null;
            }
        }
        if (request.trialExtensionDays != null && request.trialExtensionDays > 0) {
            LocalDateTime base = b.trialEndsAt != null && b.trialEndsAt.isAfter(LocalDateTime.now())
                    ? b.trialEndsAt
                    : LocalDateTime.now();
            b.trialEndsAt = base.plusDays(request.trialExtensionDays);
            if (!"trialing".equals(b.status) && !"trial_expired".equals(b.status)) {
                b.status = "trialing";
            } else if ("trial_expired".equals(b.status)) {
                b.status = "trialing";
            }
        }
        b.updatedAt = LocalDateTime.now();
        b.persist();
        String detail = buildBillingChangeDetail(request);
        recordBillingEvent(
                tenantId,
                "operator_override",
                "Manual operator override",
                detail,
                b.status,
                null,
                internalUserContext.isAuthenticated() ? internalUserContext.getEmail() : null);
        return toBillingRow(requireTenant(tenantId), b);
    }

    @Transactional
    public PlatformBillingHistoryDto listBillingHistory(long tenantId) {
        tenantProvisioningService.requirePlatformOperator();
        Tenant tenant = requireTenant(tenantId);
        long count = TenantBillingEvent.count("tenantId", tenantId);
        if (count == 0) {
            seedBillingHistoryFromCurrent(tenantId);
        }
        @SuppressWarnings("unchecked")
        List<TenantBillingEvent> events = (List<TenantBillingEvent>) (List<?>)
                TenantBillingEvent.find("tenantId = ?1 ORDER BY createdAt DESC", tenantId).list();
        PlatformBillingHistoryDto dto = new PlatformBillingHistoryDto();
        dto.tenantId = tenant.id;
        dto.tenantCodigo = tenant.codigo;
        dto.tenantNome = tenant.nome;
        dto.events = new ArrayList<>();
        for (TenantBillingEvent e : events) {
            PlatformBillingHistoryEventDto row = new PlatformBillingHistoryEventDto();
            row.id = e.id;
            row.eventType = e.eventType;
            row.title = e.title;
            row.detail = e.detail;
            row.status = e.status;
            row.amountCents = e.amountCents;
            row.operatorEmail = e.operatorEmail;
            row.createdAt = e.createdAt;
            dto.events.add(row);
        }
        return dto;
    }

    private void seedBillingHistoryFromCurrent(long tenantId) {
        TenantBilling b = TenantBilling.findByTenantId(tenantId);
        if (b == null) {
            return;
        }
        TenantBillingEvent e = new TenantBillingEvent();
        e.tenantId = tenantId;
        e.eventType = "status_snapshot";
        e.title = "Current billing state";
        e.detail = "Plan " + b.planoCodigo + " · provider " + b.provedor;
        e.status = resolveEffectiveStatus(b);
        e.amountCents = planAmountCents(b.planoCodigo);
        e.operatorEmail = null;
        e.createdAt = b.updatedAt != null ? b.updatedAt : LocalDateTime.now();
        e.persist();
    }

    private static Long planAmountCents(String planoCodigo) {
        if (planoCodigo == null) {
            return 0L;
        }
        return switch (planoCodigo.toLowerCase(Locale.ROOT)) {
            case "professional" -> 29900L;
            case "enterprise" -> 89900L;
            case "platform" -> 149900L;
            default -> 0L;
        };
    }

    private static String buildBillingChangeDetail(PlatformUpdateBillingRequest request) {
        StringBuilder sb = new StringBuilder();
        if (request.planoCodigo != null && !request.planoCodigo.isBlank()) {
            sb.append("plan=").append(request.planoCodigo.trim().toLowerCase(Locale.ROOT));
        }
        if (request.status != null && !request.status.isBlank()) {
            if (!sb.isEmpty()) {
                sb.append(" · ");
            }
            sb.append("status=").append(request.status.trim().toLowerCase(Locale.ROOT));
        }
        if (request.trialExtensionDays != null && request.trialExtensionDays > 0) {
            if (!sb.isEmpty()) {
                sb.append(" · ");
            }
            sb.append("trial+=").append(request.trialExtensionDays).append("d");
        }
        return sb.isEmpty() ? "Billing updated" : sb.toString();
    }

    private void recordBillingEvent(
            long tenantId,
            String eventType,
            String title,
            String detail,
            String status,
            Long amountCents,
            String operatorEmail) {
        TenantBillingEvent e = new TenantBillingEvent();
        e.tenantId = tenantId;
        e.eventType = eventType;
        e.title = title;
        e.detail = detail;
        e.status = status;
        e.amountCents = amountCents;
        e.operatorEmail = operatorEmail;
        e.createdAt = LocalDateTime.now();
        e.persist();
    }

    public PlatformTenantUserListDto listTenantUsers(long tenantId, String tipo) {
        tenantProvisioningService.requirePlatformOperator();
        Tenant tenant = requireTenant(tenantId);
        String mode = normalizeTipo(tipo);

        PlatformTenantUserListDto dto = new PlatformTenantUserListDto();
        dto.tenantId = tenant.id;
        dto.tenantCodigo = DisplayTextRepair.repair(tenant.codigo);
        dto.tenantNome = DisplayTextRepair.repair(tenant.nome);
        dto.totalInternos = countUsers(tenantId, true);
        dto.totalExternos = countUsers(tenantId, false);
        dto.items = new ArrayList<>();

        if (!"externo".equals(mode)) {
            List<Usuario> internos = entityManager
                    .createQuery(
                            "SELECT u FROM Usuario u LEFT JOIN FETCH u.perfil WHERE u.orgTenantId = :tid ORDER BY u.nome",
                            Usuario.class)
                    .setParameter("tid", tenantId)
                    .getResultList();
            for (Usuario u : internos) {
                dto.items.add(toInternalUser(u));
            }
        }
        if (!"interno".equals(mode)) {
            @SuppressWarnings("unchecked")
            List<UsuarioExterno> externos =
                    (List<UsuarioExterno>) (List<?>) UsuarioExterno.find("orgTenantId = ?1 ORDER BY nome", tenantId)
                            .list();
            for (UsuarioExterno u : externos) {
                dto.items.add(toExternalUser(u));
            }
        }
        return dto;
    }

    @Transactional
    public PlatformTenantUserDto updateTenantUser(
            long tenantId, int userId, String tipo, PlatformUpdateTenantUserRequest request) {
        tenantProvisioningService.requirePlatformOperator();
        requireTenant(tenantId);
        if (request == null || request.ativo == null) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.USER_NOT_FOUND));
        }
        String mode = normalizeTipo(tipo);
        if ("externo".equals(mode)) {
            UsuarioExterno u = UsuarioExterno.findById(userId);
            if (u == null || u.orgTenantId != tenantId) {
                throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.USER_NOT_FOUND));
            }
            u.ativo = request.ativo;
            u.persist();
            return toExternalUser(u);
        }
        Usuario u = Usuario.findById(userId);
        if (u == null || u.orgTenantId != tenantId) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.USER_NOT_FOUND));
        }
        u.ativo = request.ativo;
        u.persist();
        return toInternalUser(u);
    }

    private List<PlatformBillingRowDto> listBillingRows() {
        @SuppressWarnings("unchecked")
        List<Tenant> all = (List<Tenant>) (List<?>) Tenant.listAll();
        List<PlatformBillingRowDto> items = new ArrayList<>();
        for (Tenant t : all) {
            TenantBilling b = TenantBilling.findByTenantId(t.id);
            if (b == null) {
                tenantBillingService.initBillingForNewTenant(t.id, t.id == TenantConstants.DEFAULT_TENANT_ID);
                b = TenantBilling.findByTenantId(t.id);
            }
            items.add(toBillingRow(t, b));
        }
        return items;
    }

    private PlatformBillingRowDto toBillingRow(Tenant t, TenantBilling b) {
        PlatformBillingRowDto row = new PlatformBillingRowDto();
        row.tenantId = t.id;
        row.tenantCodigo = t.codigo;
        row.tenantNome = t.nome;
        row.tenantAtivo = t.ativo;
        row.planoCodigo = b.planoCodigo;
        row.status = b.status;
        row.effectiveStatus = resolveEffectiveStatus(b);
        row.trialEndsAt = b.trialEndsAt;
        row.provedor = b.provedor;
        row.updatedAt = b.updatedAt;
        row.stats = loadStats(t.id);
        return row;
    }

    private static String resolveEffectiveStatus(TenantBilling b) {
        if ("trialing".equals(b.status) && b.trialEndsAt != null && LocalDateTime.now().isAfter(b.trialEndsAt)) {
            return "trial_expired";
        }
        return b.status;
    }

    private PlatformBillingSummaryDto buildBillingSummary(List<PlatformBillingRowDto> items) {
        PlatformBillingSummaryDto s = new PlatformBillingSummaryDto();
        for (PlatformBillingRowDto row : items) {
            String eff = row.effectiveStatus != null ? row.effectiveStatus : "other";
            switch (eff) {
                case "active" -> s.active++;
                case "trialing" -> s.trialing++;
                case "trial_expired" -> s.trialExpired++;
                case "canceled" -> {
                    s.canceled++;
                    s.overdue++;
                }
                case "checkout_pending" -> {
                    s.checkoutPending++;
                    s.overdue++;
                }
                case "past_due" -> s.overdue++;
                default -> s.other++;
            }
        }
        return s;
    }

    private PlatformAuditSummaryDto loadAuditSummary24h() {
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        long loginSuccess = countAuditSince("LOGIN_SUCCESS", since, true);
        long loginFailure = countAuditSince("LOGIN_FAILURE", since, null);
        long rbacDenied = countAuditSince("RBAC_DENIED", since, null);
        long total = countAuditSince(null, since, null);
        return new PlatformAuditSummaryDto(loginSuccess, loginFailure, rbacDenied, total);
    }

    private long countAuditSince(String evento, LocalDateTime since, Boolean sucesso) {
        StringBuilder sql = new StringBuilder("SELECT COUNT(*) FROM acesso_auditoria WHERE created_at >= ?1");
        if (evento != null) {
            sql.append(" AND evento = ?2");
        }
        if (sucesso != null) {
            sql.append(" AND sucesso = ").append(sucesso ? "1" : "0");
        }
        var q = entityManager.createNativeQuery(sql.toString());
        q.setParameter(1, since);
        if (evento != null) {
            q.setParameter(2, evento);
        }
        Object r = q.getSingleResult();
        return r instanceof Number n ? n.longValue() : 0L;
    }

    private TenantStatsDto loadStats(long tenantId) {
        long usuarios = countNative(
                "SELECT COUNT(*) FROM usuario WHERE tenant_id = ?1 AND (ativo IS NULL OR ativo = 1)", tenantId);
        long externos = countNative(
                "SELECT COUNT(*) FROM usuario_externo WHERE tenant_id = ?1 AND (ativo IS NULL OR ativo = 1)",
                tenantId);
        long os = countNative(
                "SELECT COUNT(*) FROM os WHERE tenant_id = ?1 AND (is_active IS NULL OR is_active = 1)", tenantId);
        long propostas = countNative("SELECT COUNT(*) FROM proposta_comercial WHERE tenant_id = ?1", tenantId);
        return new TenantStatsDto(usuarios, externos, os, propostas);
    }

    private TenantStatsDto aggregatePlatformStats() {
        long usuarios = countNative("SELECT COUNT(*) FROM usuario WHERE (ativo IS NULL OR ativo = 1)", null);
        long externos = countNative("SELECT COUNT(*) FROM usuario_externo WHERE (ativo IS NULL OR ativo = 1)", null);
        long os = countNative("SELECT COUNT(*) FROM os WHERE (is_active IS NULL OR is_active = 1)", null);
        long propostas = countNative("SELECT COUNT(*) FROM proposta_comercial", null);
        return new TenantStatsDto(usuarios, externos, os, propostas);
    }

    private long countNative(String sql, Long tenantId) {
        var q = entityManager.createNativeQuery(sql);
        if (tenantId != null) {
            q.setParameter(1, tenantId);
        }
        Object r = q.getSingleResult();
        return r instanceof Number n ? n.longValue() : 0L;
    }

    private long countUsers(long tenantId, boolean interno) {
        String table = interno ? "usuario" : "usuario_externo";
        return countNative("SELECT COUNT(*) FROM " + table + " WHERE tenant_id = ?1", tenantId);
    }

    private static PlatformTenantUserDto toInternalUser(Usuario u) {
        PlatformTenantUserDto d = new PlatformTenantUserDto();
        d.id = u.id;
        d.tipo = "interno";
        d.email = u.email;
        d.nome = DisplayTextRepair.repair(u.nome);
        d.ativo = u.ativo;
        d.dataCadastro = u.dataCadastro;
        d.ultimoAcesso = u.ultimoAcesso;
        d.mfaEnabled = Boolean.TRUE.equals(u.mfaEnabled);
        if (u.perfil != null) {
            d.perfilNome = DisplayTextRepair.repair(u.perfil.getNome());
            d.perfilCodigo = u.perfil.getCodigo();
        }
        return d;
    }

    private static PlatformTenantUserDto toExternalUser(UsuarioExterno u) {
        PlatformTenantUserDto d = new PlatformTenantUserDto();
        d.id = u.id;
        d.tipo = "externo";
        d.email = u.email;
        d.nome = DisplayTextRepair.repair(u.nome);
        d.ativo = u.ativo;
        d.dataCadastro = u.dataCadastro;
        d.ultimoAcesso = u.ultimoAcesso;
        return d;
    }

    private static String normalizeTipo(String tipo) {
        if (tipo == null || tipo.isBlank()) {
            return "todos";
        }
        return tipo.trim().toLowerCase(Locale.ROOT);
    }

    private Tenant requireTenant(long id) {
        Tenant t = Tenant.findById(id);
        if (t == null) {
            throw new NotFoundException(
                    com.aerosuite.i18n.ApiI18nMessages.encode(
                            com.aerosuite.i18n.ApiI18nMessages.TENANT_NOT_FOUND));
        }
        return t;
    }
}
