package com.aerosuite.dto;

public class TenantSummaryDto {
    public Long id;
    public String codigo;
    public String nome;
    public Boolean ativo;
    public String displayName;
    public String supportEmail;
    public TenantStatsDto stats;

    public TenantSummaryDto() {}
}
