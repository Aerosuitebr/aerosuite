package com.aerosuite.integration.bling;

import java.math.BigDecimal;

public class BlingFiscalConfigDto {
    public Long tenantId;
    public String cfopPadrao;
    public String serieNfe;
    public String naturezaOperacao;
    public String ncmPadrao;
    public BigDecimal aliquotaIcms;
    public BigDecimal aliquotaPis;
    public BigDecimal aliquotaCofins;
    public boolean autoOsOnPedido = true;
    public boolean autoEmitirNfe = true;
    public boolean certificadoConfigurado;
    public String certificadoTipo;
    public String certificadoNome;
    public String certificadoValidoAte;
    public String certificadoUploadedAt;
    public String message;
}
