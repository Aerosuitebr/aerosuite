package com.aerosuite.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO para Template de Produto/Serviço
 */
public class TemplateProdutoServicoDto {

    public Long id;
    public String nomeTemplate;
    public String descricaoTemplate;
    public String categoria;

    // Dados do Produto
    public String produtoNome;
    public String produtoPn;
    public String produtoManual;
    public BigDecimal produtoValorBase;
    public String aplicacaoMotor;

    // Dados do Serviço
    public Integer idTipoServico;
    public String tipoServicoNome;
    public String servicoDescricaoPadrao;

    // Condições Padrão
    public String prazoEntregaPadrao;
    public String formaPagamentoPadrao;
    public Integer validadeDias;
    public String condicoesGeraisPadrao;
    public String observacaoPadrao;

    // Metadados
    public Boolean ativo;
    public Integer vezesUtilizado;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
    public String createdBy;

    public TemplateProdutoServicoDto() {}
}
