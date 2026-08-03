package com.aerosuite.dto;

import java.util.ArrayList;
import java.util.List;

/** Vista de administração: catálogo + estado por organização. */
public class TenantFeaturesAdminDto {
    public long tenantId;
    public List<TenantFeatureCatalogItemDto> items = new ArrayList<>();
}
