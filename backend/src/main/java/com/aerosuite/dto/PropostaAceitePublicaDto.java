package com.aerosuite.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Payload seguro para o portal público de aceite da proposta.
 */
public class PropostaAceitePublicaDto {

    public String oficinaNome;
    public String oficinaContato;
    public Long id;
    public String numeroProposta;
    public String status;
    public String aceiteStatus;
    public boolean podeEditar;
    public boolean podeAceitar;
    public boolean expirada;
    public String mensagem;

    public LocalDate dataProposta;
    public LocalDate validadeProposta;
    public String prazoEntrega;
    public String formaPagamento;
    public String observacoes;
    public String moedaExibicao;
    public BigDecimal totalGeralExibicao;
    public BigDecimal totalGeralUsd;
    public BigDecimal freteUsd;
    public BigDecimal maoDeObraUsd;
    public BigDecimal subtotalProdutosUsd;
    public BigDecimal descontoValorCalculado;
    public BigDecimal cotacaoDolar;

    public String clienteNome;
    public String clienteCidade;
    public String clienteEstado;
    public String clienteContato;

    public String produtoNome;
    public String produtoPn;
    public String produtoSn;
    public String produtoManual;
    public String aplicacaoMotor;
    public String aeronavePrefixo;
    public String servicoExecutado;
    public String tipoServicoNome;

    // FORM-MNT-045
    public String tsn;
    public String tso;
    public String csn;
    public String cso;
    public String pnMotor;
    public String modeloMotor;
    public String tempoDesdeHsi;
    public String servicosFlags;
    public String reporteCliente;
    public Boolean incidenteAcidente;
    public Boolean submersoAgua;
    public String descricaoIncidente;
    public String solicitanteNome;
    public String solicitanteEmpresa;
    public String solicitanteCargo;
    public LocalDate solicitanteData;

    // Evidência (somente leitura após aceite)
    public LocalDateTime aceitoEm;
    public String aceiteNome;
    public String aceiteEmail;
    public String aceiteCargo;
    public String aceiteEmpresa;

    public List<ItemDto> itens;
    public List<String> condicoesGerais;

    public static class ItemDto {
        public String produtoNome;
        public String produtoDescricao;
        public String produtoPn;
        public String produtoSn;
        public Integer quantidade;
        public BigDecimal valorUnitario;
        public BigDecimal valorTotal;
    }
}
