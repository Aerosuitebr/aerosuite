package com.aerosuite.dto;

public class TenantStatsDto {
    public long usuariosInternos;
    public long usuariosExternos;
    public long ordensServico;
    public long propostasComerciais;

    public TenantStatsDto() {}

    public TenantStatsDto(long usuariosInternos, long usuariosExternos, long ordensServico, long propostasComerciais) {
        this.usuariosInternos = usuariosInternos;
        this.usuariosExternos = usuariosExternos;
        this.ordensServico = ordensServico;
        this.propostasComerciais = propostasComerciais;
    }
}
