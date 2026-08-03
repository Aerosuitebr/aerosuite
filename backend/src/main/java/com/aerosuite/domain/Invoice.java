package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "invoice")
public class Invoice extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @TenantId    @Column(name = "tenant_id", nullable = false)
    public String tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;

    @Column(name = "numero_invoice", nullable = false, length = 100)
    public String numeroInvoice;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fornecedor_id", nullable = false)
    public Fornecedor fornecedor;
    
    @Column(name = "fornecedor_id", insertable = false, updatable = false)
    public Long fornecedorId;
    
    @Column(name = "data_emissao", nullable = false)
    public LocalDate dataEmissao;
    
    @Column(name = "data_recebimento")
    public LocalDate dataRecebimento;
    
    @Column(name = "pais_origem", length = 100)
    public String paisOrigem = "Estados Unidos";
    
    @Column(name = "moeda", length = 10)
    public String moeda = "USD";
    
    @Column(name = "valor_total", precision = 15, scale = 2)
    public BigDecimal valorTotal;
    
    @Column(name = "valor_frete", precision = 15, scale = 2)
    public BigDecimal valorFrete;
    
    @Column(name = "valor_seguro", precision = 15, scale = 2)
    public BigDecimal valorSeguro;
    
    @Column(name = "valor_impostos", precision = 15, scale = 2)
    public BigDecimal valorImpostos;
    
    @Column(name = "taxa_cambio", precision = 10, scale = 4)
    public BigDecimal taxaCambio;
    
    @Column(name = "numero_di", length = 50)
    public String numeroDi;
    
    @Column(name = "numero_conhecimento", length = 100)
    public String numeroConhecimento;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "modal_transporte")
    public ModalTransporte modalTransporte = ModalTransporte.AEREO;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    public StatusInvoice status = StatusInvoice.PENDENTE;
    
    @Column(name = "observacoes", columnDefinition = "TEXT")
    public String observacoes;
    
    @Column(name = "arquivo_invoice", length = 500)
    public String arquivoInvoice;
    
    @Column(name = "is_active")
    public Boolean isActive = true;
    
    @Column(name = "created_at")
    public LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    public LocalDateTime updatedAt;
    
    @Column(name = "created_by")
    public Long createdBy;
    
    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<InvoiceItem> itens;
    
    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public enum ModalTransporte {
        AEREO, MARITIMO, RODOVIARIO, COURIER
    }
    
    public enum StatusInvoice {
        PENDENTE, EM_TRANSITO, RECEBIDA, CONFERIDA, ESTOCADA, CANCELADA
    }
}
