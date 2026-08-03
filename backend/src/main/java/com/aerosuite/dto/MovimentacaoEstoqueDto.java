package com.aerosuite.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class MovimentacaoEstoqueDto {
    public Long id;
    public Long itemEstoqueId;
    public String itemCodigoRastreio;
    public String itemPartNumber;
    
    public String tipoMovimentacao;
    public BigDecimal quantidade;
    public BigDecimal quantidadeAnterior;
    public BigDecimal quantidadePosterior;
    
    public Long invoiceId;
    public Long osId;
    public Long loteId;
    
    public String localizacaoOrigem;
    public String localizacaoDestino;
    
    public Long usuarioId;
    public String usuarioNome;
    
    public String motivo;
    public String observacoes;
    
    public LocalDateTime dataMovimentacao;

    /** OS_FCU_KIT, TROCAS_EVENTUAL */
    public String origemSaida;
    public Integer idProdutoCatalogo;
    public String chaveIdempotencia;
}
