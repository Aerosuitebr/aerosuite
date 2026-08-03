package com.aerosuite.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO para envio de proposta comercial por email
 */
public class EnviarPropostaEmailDto {

    public Long propostaId;
    public String emailDestino;
    public String assunto;
    public String mensagemAdicional;
    public String tipoEnvio; // "corpo" ou "anexo"
    public SignatureDto signature;
    public String htmlContent;
    public List<PropostaItemDto> items; // Lista de itens da proposta (produtos com quantidade, P/N, S/N)
    
    // Dados do remetente para assinatura do email (quando tipo="corpo")
    public String telefoneRemetente; // Formato: (XX)9XXXX-XXXX
    public String emailRemetente;

    /** Snapshot da proposta no momento do envio — persiste exatamente o que foi enviado. */
    public LocalDate dataProposta;
    public LocalDate validadeProposta;
    public String moedaProposta;
    public BigDecimal valorTotalFinal;
    public BigDecimal totalGeralBrl;
    public BigDecimal totalGeralEur;
    public BigDecimal totalGeralUsd;
    public BigDecimal freteBrl;
    public BigDecimal maoDeObraBrl;
    public BigDecimal freteUsd;
    public BigDecimal maoDeObraUsd;
    public BigDecimal cotacaoDolar;
    public LocalDateTime dataCotacao;
    public String descontoTipo;
    public BigDecimal descontoPercentual;
    public BigDecimal descontoValorFixo;
    public BigDecimal descontoValorCalculado;

    // DTO interno para assinatura
    public static class SignatureDto {
        public String name;
        public String styleId;
        public String fontFamily;
        public String fontWeight;
        public String fontSize;
        public String color;
        public String letterSpacing;
        public String timestamp;
    }

    // DTO interno para item da proposta
    public static class PropostaItemDto {
        public String produtoNome;
        public String produtoDescricao;
        public String produtoPn;
        public String produtoSn;
        public Integer quantidade;
        public BigDecimal valorUnitario;
        public BigDecimal valorTotal;
    }

    // Construtor padrão
    public EnviarPropostaEmailDto() {}
}
