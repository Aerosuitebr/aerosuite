package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Linha de déficit de estoque do kit FCU detectado ao salvar uma OS.
 * Cada registro representa um P/N do kit cuja quantidade disponível foi menor
 * que a quantidade necessária no momento em que a OS foi salva.
 */
@Entity
@Table(name = "os_kit_fcu_deficit")
public class OsKitFcuDeficit extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "os_id", nullable = false)
    public Long osId;

    @Column(name = "id_fcu")
    public Integer idFcu;

    @Column(name = "id_produto_catalogo")
    public Integer idProdutoCatalogo;

    @Column(name = "product_pn", length = 255)
    public String productPn;

    @Column(name = "product_name", length = 500)
    public String productName;

    @Column(name = "quantidade_necessaria", nullable = false)
    public Integer quantidadeNecessaria;

    @Column(name = "quantidade_disponivel", nullable = false, precision = 18, scale = 3)
    public BigDecimal quantidadeDisponivel;

    @Column(name = "deficit", nullable = false, precision = 18, scale = 3)
    public BigDecimal deficit;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
