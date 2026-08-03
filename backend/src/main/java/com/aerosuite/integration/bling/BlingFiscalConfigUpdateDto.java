package com.aerosuite.integration.bling;

import java.math.BigDecimal;

public class BlingFiscalConfigUpdateDto {
    public String cfopPadrao;
    public String serieNfe;
    public String naturezaOperacao;
    public String ncmPadrao;
    public BigDecimal aliquotaIcms;
    public BigDecimal aliquotaPis;
    public BigDecimal aliquotaCofins;
    public Boolean autoOsOnPedido;
    public Boolean autoEmitirNfe;
}
