package com.aerosuite.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Linha do relatório de rastreio de saídas automáticas (kit FCU e trocas eventuais pagas).
 */
public class SaidaProdutoRastreioLinhaDto {
    public Long movimentacaoId;
    public LocalDateTime dataMovimentacao;
    public BigDecimal quantidade;
    public String origemSaida;
    public String chaveIdempotencia;
    public String motivo;
    public String usuarioNome;
    public Long osId;
    public Integer idOs;
    public LocalDate dtAberturaOs;
    public String clienteNome;
    public Integer idFcu;
    /** Mesmo padrão da OS: PN/código do cadastro do FCU. */
    public String fcuPn;
    public String fcuCodigo;
    public String fcuDescription;
    public String partNumber;
    public Long itemEstoqueId;
    public String codigoRastreio;
    public Integer idProdutoCatalogo;
    public String produtoCatalogoNome;
}
