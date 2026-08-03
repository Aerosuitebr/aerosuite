package com.aerosuite.dto;

import java.util.List;

public class PlatformTenantUserListDto {
    public Long tenantId;
    public String tenantCodigo;
    public String tenantNome;
    public long totalInternos;
    public long totalExternos;
    public List<PlatformTenantUserDto> items;

    public PlatformTenantUserListDto() {}
}
