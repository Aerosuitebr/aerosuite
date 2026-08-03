package com.aerosuite.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Proposta comercial vista pelo portal do cliente (P4.2).
 */
public class PropostaExternaDto {

    public Long id;
    public String numeroProposta;
    public String status;
    public LocalDate dataProposta;
    public LocalDate validadeProposta;
    public String produtoNome;
    public String produtoPn;
    public String servicoExecutado;
    public BigDecimal valorTotalFinal;
    public BigDecimal totalGeralUsd;
    public String prazoEntrega;
    public String formaPagamento;
    public String observacoes;

    public Long osId;
    public OsVinculoResumo osVinculo;

    public boolean podeAprovar;
    public boolean podeRejeitar;

    public LocalDateTime clienteDecisaoEm;
    public String clienteDecisaoMotivo;

    public List<PropostaAditivoDto> aditivos;
    public List<PropostaAnexoDto> anexos;

    public static class OsVinculoResumo {
        public Long id;
        public LocalDate dtAbertura;
        public LocalDate dataFechamento;
        public String status;
        public String clienteNome;
    }
}
