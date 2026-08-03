package com.aerosuite.service;

import com.aerosuite.domain.Tenant;
import com.aerosuite.domain.TenantFeature;
import com.aerosuite.dto.TenantFeatureCatalogItemDto;
import com.aerosuite.dto.TenantFeaturesAdminDto;
import com.aerosuite.dto.TenantFeaturesDto;
import com.aerosuite.p1.TenantFeatureCatalog;
import com.aerosuite.p1.TenantFeatureCatalog.FeatureDefinition;
import com.aerosuite.security.InternalUserContext;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import java.util.*;

@ApplicationScoped
public class TenantFeatureService {

    @Inject
    InternalUserContext internalUserContext;
    @Inject
    TenantModuleService tenantModuleService;

    public List<String> enabledCodes(long tenantId) {
        @SuppressWarnings("unchecked")
        List<TenantFeature> rows =
                (List<TenantFeature>) (List<?>) TenantFeature.find("tenantId = ?1 and enabled = true", tenantId).list();
        Set<String> fromDb = new LinkedHashSet<>();
        for (TenantFeature row : rows) {
            if (row.featureCode != null) {
                fromDb.add(TenantFeatureCatalog.normalizeCode(row.featureCode));
            }
        }
        return new ArrayList<>(fromDb);
    }

    public boolean isEnabled(long tenantId, String featureCode) {
        String code = TenantFeatureCatalog.normalizeCode(featureCode);
        if (!TenantFeatureCatalog.isKnown(code)) {
            return false;
        }
        if (!isAllowedForTenantModules(tenantId, code)) {
            return false;
        }
        TenantFeature row = TenantFeature.findForTenant(tenantId, code);
        return row != null && Boolean.TRUE.equals(row.enabled);
    }

    public TenantFeaturesDto featuresForTenant(long tenantId) {
        Tenant tenant = Tenant.findById(tenantId);
        Set<String> enabledModules = tenantModuleService.enabledModules(tenant);
        List<String> codes = new ArrayList<>();
        for (String code : enabledCodes(tenantId)) {
            String modulo = TenantFeatureCatalog.moduloFor(code);
            if (modulo == null || "PLATFORM".equals(modulo)) {
                codes.add(code);
                continue;
            }
            if (enabledModules.contains(modulo)) {
                codes.add(code);
            }
        }
        return new TenantFeaturesDto(codes);
    }

    public TenantFeaturesDto featuresForCurrentUser() {
        Long tenantId = internalUserContext.getTenantId();
        if (tenantId == null) {
            return new TenantFeaturesDto(List.of());
        }
        return featuresForTenant(tenantId);
    }

    public TenantFeaturesAdminDto adminView(long tenantId) {
        Set<String> enabled = new LinkedHashSet<>(enabledCodes(tenantId));
        TenantFeaturesAdminDto dto = new TenantFeaturesAdminDto();
        dto.tenantId = tenantId;
        for (FeatureDefinition def : TenantFeatureCatalog.all()) {
            TenantFeatureCatalogItemDto item = new TenantFeatureCatalogItemDto();
            item.code = def.code();
            item.modulo = def.modulo();
            item.experimental = def.experimental();
            item.owner = def.owner();
            item.pilotTenant = def.pilotTenant();
            item.reviewDate = def.reviewDate();
            item.enabled = enabled.contains(TenantFeatureCatalog.normalizeCode(def.code()));
            dto.items.add(item);
        }
        return dto;
    }

    @Transactional
    public TenantFeaturesAdminDto applyEnabled(long tenantId, List<String> enabledRaw, Integer updatedByUserId) {
        if (enabledRaw == null) {
            enabledRaw = List.of();
        }
        TenantFeatureCatalog.validateCodes(enabledRaw);
        Set<String> desired = new LinkedHashSet<>();
        for (String code : enabledRaw) {
            if (code != null && !code.isBlank()) {
                desired.add(TenantFeatureCatalog.normalizeCode(code));
            }
        }
        Tenant tenant = Tenant.findById(tenantId);
        if (tenant == null) {
            throw new BadRequestException(
                    com.aerosuite.i18n.ApiI18nMessages.encode(
                            com.aerosuite.i18n.ApiI18nMessages.AUTH_TENANT_NOT_FOUND));
        }
        Set<String> modules = tenantModuleService.enabledModules(tenant);
        for (String code : desired) {
            String modulo = TenantFeatureCatalog.moduloFor(code);
            if (modulo != null
                    && !"PLATFORM".equals(modulo)
                    && !modules.contains(modulo)) {
                throw new BadRequestException(
                        "Feature " + code + " exige o módulo " + modulo + " habilitado na organização.");
            }
        }
        for (FeatureDefinition def : TenantFeatureCatalog.all()) {
            upsert(
                    tenantId,
                    def.code(),
                    desired.contains(TenantFeatureCatalog.normalizeCode(def.code())),
                    updatedByUserId);
        }
        return adminView(tenantId);
    }

    private void upsert(long tenantId, String code, boolean enabled, Integer updatedByUserId) {
        String normalized = TenantFeatureCatalog.normalizeCode(code);
        TenantFeature row = TenantFeature.findForTenant(tenantId, normalized);
        if (row == null) {
            if (!enabled) {
                return;
            }
            row = new TenantFeature();
            row.tenantId = tenantId;
            row.featureCode = normalized;
        }
        row.enabled = enabled;
        row.updatedByUsuarioId = updatedByUserId;
        row.persist();
    }

    private boolean isAllowedForTenantModules(long tenantId, String code) {
        String modulo = TenantFeatureCatalog.moduloFor(code);
        if (modulo == null || "PLATFORM".equals(modulo)) {
            return true;
        }
        Tenant tenant = Tenant.findById(tenantId);
        return tenant != null && tenantModuleService.enabledModules(tenant).contains(modulo);
    }
}
