package com.aerosuite.dto;

import com.aerosuite.json.LenientLocalDateTimeDeserializer;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO para Proposta Comercial
 */
public class PropostaComercialDto {

    public Long id;
    public String numeroProposta;

    // ========== DADOS DO PRODUTO ==========
    public String produtoNome;
    public String produtoPn;
    public String produtoSn;
    public String produtoManual;
    public BigDecimal produtoValor;
    public String aplicacaoMotor;
    public String aeronavePrefixo;
    public String servicoExecutado;
    public Integer idTipoServico;
    public String tipoServicoNome;

    // ========== DADOS DO CLIENTE ==========
    public String clienteNome;
    public String clienteCnpjCpf;
    public String clienteEmail;
    public String clienteTelefone;
    public String clienteEndereco;
    public String clienteBairro;
    public String clienteCidade;
    public String clienteEstado;
    public String clienteCep;
    public String clienteContato;
    public String clienteObservacao;
    public Integer clientePropostaId;

    // ========== DADOS DA PROPOSTA ==========
    public LocalDate dataProposta;
    public LocalDate validadeProposta;
    public String prazoEntrega;
    public String formaPagamento;
    public String observacoes;
    public String condicoesGerais;
    public String referenciaCliente;
    public String contatoTecnico;
    public String centroCusto;
    public String status;

    // ========== DADOS DO DESCONTO ==========
    public String descontoTipo; // 'percent' ou 'fixed'
    public BigDecimal descontoPercentual; // Percentual de desconto (0-100)
    public BigDecimal descontoValorFixo; // Valor fixo de desconto
    public BigDecimal descontoValorCalculado; // Valor do desconto calculado
    public BigDecimal valorTotalFinal; // Valor final após desconto

    // ========== CUSTOS ADICIONAIS (BRL) ==========
    public BigDecimal freteBrl;       // Valor do frete em Reais
    public BigDecimal maoDeObraBrl;   // Valor da mão de obra em Reais

    // ========== DADOS DA COTAÇÃO ==========
    public BigDecimal cotacaoDolar;       // Cotação do dólar usada
    /** Vem do BCB/OData em formatos variados; deserialização tolerante evita 400 ao salvar. */
    @JsonDeserialize(using = LenientLocalDateTimeDeserializer.class)
    public LocalDateTime dataCotacao;     // Data/hora da cotação

    // ========== VALORES CONVERTIDOS (USD) ==========
    public BigDecimal freteUsd;            // Frete convertido para USD
    public BigDecimal maoDeObraUsd;        // Mão de obra convertida para USD
    public BigDecimal subtotalProdutosUsd; // Subtotal dos produtos em USD
    public BigDecimal totalGeralUsd;       // Total geral final em USD
    public String moedaProposta;           // USD, BRL ou EUR
    public BigDecimal totalGeralBrl;       // Total geral em BRL (quando moedaProposta=BRL)
    public BigDecimal totalGeralEur;       // Total geral em EUR (quando moedaProposta=EUR)

    // ========== DADOS DA ASSINATURA ==========
    public String assinaturaNome;
    public String assinaturaEstilo;
    public String assinaturaFontFamily;
    public String assinaturaColor;
    public LocalDateTime assinaturaTimestamp;

    // ========== METADADOS ==========
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
    public String createdBy;

    // ========== VÍNCULO OS (P4.1) ==========
    public Long osId;
    public LocalDateTime osGeradaEm;
    public String osGeradaPor;
    /** Preenchido em leitura quando {@link #osId} não é nulo. */
    public LocalDate osResumoDtAbertura;
    public Boolean osResumoAtiva;
    public String osResumoNumOsOriginal;

    /** Decisão no portal externo (P4.2). */
    public LocalDateTime clienteDecisaoEm;
    public String clienteDecisaoMotivo;

    // ========== ITENS DA PROPOSTA ==========
    public List<PropostaItemDto> itens;

    /** P4.2 v1.1 — aditivos e anexos do portal. */
    public List<PropostaAditivoDto> aditivos;
    public List<PropostaAnexoDto> anexos;

    // Construtor padrão
    public PropostaComercialDto() {}

    /** Item da proposta. valorUnitario e valorTotal são em USD (dólar). */
    public static class PropostaItemDto {
        public Long id;
        public String produtoNome;
        public String produtoDescricao;
        public String produtoPn;
        public String produtoSn;
        public Integer quantidade;
        public BigDecimal valorUnitario;  // USD
        public BigDecimal valorTotal;     // USD
        public Integer ordem;
    }
}
