package com.aerosuite.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CotacaoDolarDto {
    public BigDecimal cotacaoCompra;
    public BigDecimal cotacaoVenda;
    public LocalDateTime dataHoraCotacao;
    public String fonte;
    public boolean estimada;
    public String dataCotacaoConsulta;
}
