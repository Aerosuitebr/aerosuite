package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "os_solicitacao_troca_item")
public class OsSolicitacaoTrocaItem extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    /** Alinhado ao tipo de `os.id` no MySQL (geralmente INT em bases legadas). */
    @Column(name = "os_id", nullable = false)
    public Integer osId;

    @Column(name = "id_produto")
    public Long idProduto;

    @Column(name = "produto_nome", length = 500)
    public String produtoNome;

    @Column(name = "produto_descricao", columnDefinition = "TEXT")
    public String produtoDescricao;

    @Column(name = "produto_pn", length = 200)
    public String produtoPn;

    @Column(name = "produto_sn", length = 200)
    public String produtoSn;

    @Column(name = "quantidade", nullable = false)
    public Integer quantidade = 1;

    @Column(name = "valor_unitario", precision = 15, scale = 2)
    public BigDecimal valorUnitario;

    @Column(name = "valor_total", precision = 15, scale = 2)
    public BigDecimal valorTotal;

    /** null = pendente; true = pago; false = não pago (ex.: falta em estoque) */
    @Column(name = "pago")
    public Boolean pago;

    @Column(name = "ordem", nullable = false)
    public Integer ordem = 0;

    @Column(name = "created_at")
    public LocalDateTime createdAt;

    @Column(name = "updated_at")
    public LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
