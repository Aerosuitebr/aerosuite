package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "invoice_item")
public class InvoiceItem extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    public Invoice invoice;
    
    @Column(name = "invoice_id", insertable = false, updatable = false)
    public Long invoiceId;
    
    @Column(name = "linha")
    public Integer linha;
    
    @Column(name = "part_number", nullable = false, length = 100)
    public String partNumber;
    
    @Column(name = "descricao", length = 500)
    public String descricao;
    
    @Column(name = "quantidade", nullable = false, precision = 10, scale = 3)
    public BigDecimal quantidade;
    
    @Column(name = "unidade", length = 20)
    public String unidade = "UN";
    
    @Column(name = "valor_unitario", precision = 15, scale = 4)
    public BigDecimal valorUnitario;
    
    @Column(name = "valor_total", precision = 15, scale = 4)
    public BigDecimal valorTotal;
    
    @Column(name = "quantidade_recebida", precision = 10, scale = 3)
    public BigDecimal quantidadeRecebida = BigDecimal.ZERO;
    
    @Column(name = "quantidade_pendente", precision = 10, scale = 3)
    public BigDecimal quantidadePendente;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    public StatusItem status = StatusItem.PENDENTE;
    
    @Column(name = "observacoes", columnDefinition = "TEXT")
    public String observacoes;
    
    @Column(name = "created_at")
    public LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    public LocalDateTime updatedAt;
    
    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (quantidadePendente == null && quantidade != null) {
            quantidadePendente = quantidade;
        }
    }
    
    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public enum StatusItem {
        PENDENTE, PARCIAL, COMPLETO
    }
}
