package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entidade para Itens de Proposta Comercial
 */
@Entity
@Table(name = "proposta_comercial_item")
public class PropostaComercialItem extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_proposta_comercial", nullable = false)
    public PropostaComercial propostaComercial;

    @Column(name = "produto_nome", nullable = false, length = 200)
    public String produtoNome;

    @Column(name = "produto_descricao", columnDefinition = "TEXT")
    public String produtoDescricao;

    @Column(name = "produto_pn", length = 100)
    public String produtoPn;

    @Column(name = "produto_sn", length = 100)
    public String produtoSn;

    @Column(name = "quantidade", nullable = false)
    public Integer quantidade = 1;

    @Column(name = "valor_unitario", nullable = false, precision = 15, scale = 2)
    public BigDecimal valorUnitario = BigDecimal.ZERO;

    @Column(name = "valor_total", nullable = false, precision = 15, scale = 2)
    public BigDecimal valorTotal = BigDecimal.ZERO;

    @Column(name = "ordem", nullable = false)
    public Integer ordem = 0;

    @Column(name = "created_at")
    public LocalDateTime createdAt;

    @Column(name = "updated_at")
    public LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.quantidade == null) {
            this.quantidade = 1;
        }
        if (this.valorUnitario == null) {
            this.valorUnitario = BigDecimal.ZERO;
        }
        if (this.valorTotal == null) {
            this.valorTotal = BigDecimal.ZERO;
        }
        if (this.ordem == null) {
            this.ordem = 0;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
