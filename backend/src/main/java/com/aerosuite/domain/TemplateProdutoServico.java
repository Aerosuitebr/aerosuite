package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entidade para Templates de Produto/Serviço
 * Permite reutilizar configurações de produtos e serviços em novas propostas
 */
@Entity
@Table(name = "template_produto_servico")
public class TemplateProdutoServico extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    // Nome identificador do template
    @Column(name = "nome_template", length = 200, nullable = false)
    public String nomeTemplate;

    // Descrição do template
    @Column(name = "descricao_template", length = 500)
    public String descricaoTemplate;

    // Categoria/Grupo do template
    @Column(name = "categoria", length = 100)
    public String categoria;

    // ========== DADOS DO PRODUTO ==========
    @Column(name = "produto_nome", length = 200)
    public String produtoNome;

    @Column(name = "produto_pn", length = 100)
    public String produtoPn;

    @Column(name = "produto_manual", length = 200)
    public String produtoManual;

    @Column(name = "produto_valor_base", precision = 15, scale = 2)
    public BigDecimal produtoValorBase;

    @Column(name = "aplicacao_motor", length = 200)
    public String aplicacaoMotor;

    // ========== DADOS DO SERVIÇO ==========
    @Column(name = "id_tipo_servico")
    public Integer idTipoServico;

    @Column(name = "tipo_servico_nome", length = 200)
    public String tipoServicoNome;

    @Column(name = "servico_descricao_padrao", length = 2000)
    public String servicoDescricaoPadrao;

    // ========== CONDIÇÕES PADRÃO ==========
    @Column(name = "prazo_entrega_padrao", length = 100)
    public String prazoEntregaPadrao;

    @Column(name = "forma_pagamento_padrao", length = 200)
    public String formaPagamentoPadrao;

    @Column(name = "validade_dias")
    public Integer validadeDias;

    @Column(name = "condicoes_gerais_padrao", columnDefinition = "TEXT")
    public String condicoesGeraisPadrao;

    // Campo de observação que será replicado para a proposta
    @Column(name = "observacao_padrao", length = 5000)
    public String observacaoPadrao;

    // ========== METADADOS ==========
    @Column(name = "ativo")
    public Boolean ativo = true;

    @Column(name = "vezes_utilizado")
    public Integer vezesUtilizado = 0;

    @Column(name = "created_at")
    public LocalDateTime createdAt;

    @Column(name = "updated_at")
    public LocalDateTime updatedAt;

    @Column(name = "created_by", length = 100)
    public String createdBy;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.ativo == null) this.ativo = true;
        if (this.vezesUtilizado == null) this.vezesUtilizado = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Incrementa contador de uso
     */
    public void incrementarUso() {
        this.vezesUtilizado = (this.vezesUtilizado == null ? 0 : this.vezesUtilizado) + 1;
    }
}
