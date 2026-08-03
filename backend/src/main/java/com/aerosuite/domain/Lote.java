package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "lote",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_lote_tenant_codigo",
                columnNames = {"tenant_id", "codigo_lote"}))
public class Lote extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @TenantId    @Column(name = "tenant_id", nullable = false)
    public String tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;

    @Column(name = "codigo_lote", nullable = false, length = 50)
    public String codigoLote;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id")
    public Invoice invoice;
    
    @Column(name = "invoice_id", insertable = false, updatable = false)
    public Long invoiceId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fornecedor_id", nullable = false)
    public Fornecedor fornecedor;
    
    @Column(name = "fornecedor_id", insertable = false, updatable = false)
    public Long fornecedorId;
    
    @Column(name = "data_entrada", nullable = false)
    public LocalDate dataEntrada;
    
    @Column(name = "data_validade")
    public LocalDate dataValidade;
    
    @Column(name = "quantidade_total")
    public Integer quantidadeTotal = 0;
    
    @Column(name = "quantidade_disponivel")
    public Integer quantidadeDisponivel = 0;
    
    @Column(name = "localizacao", length = 100)
    public String localizacao;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    public StatusLote status = StatusLote.ATIVO;
    
    @Column(name = "observacoes", columnDefinition = "TEXT")
    public String observacoes;
    
    @Column(name = "is_active")
    public Boolean isActive = true;
    
    @Column(name = "created_at")
    public LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    public LocalDateTime updatedAt;
    
    @Column(name = "created_by")
    public Long createdBy;
    
    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    /**
     * Gera código de lote automático
     */
    public static String gerarCodigoLote() {
        return gerarCodigoLote(TenantConstants.DEFAULT_TENANT_ID);
    }

    public static String gerarCodigoLote(long tenantId) {
        int ano = LocalDate.now().getYear();
        Long count = Lote.count("YEAR(createdAt) = ?1", ano);
        return String.format("LOT-%d-%04d", ano, count + 1);
    }
    
    public enum StatusLote {
        ATIVO, PARCIAL, ESGOTADO, BLOQUEADO, VENCIDO
    }
}
