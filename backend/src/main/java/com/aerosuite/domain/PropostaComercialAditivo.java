package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "proposta_comercial_aditivo")
public class PropostaComercialAditivo extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @TenantId
    @Column(name = "tenant_id", nullable = false)
    public String tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;

    @Column(name = "proposta_id", nullable = false)
    public Long propostaId;

    @Column(nullable = false, columnDefinition = "TEXT")
    public String descricao;

    @Column(precision = 15, scale = 2)
    public BigDecimal valor;

    @Column(nullable = false, length = 30)
    public String status = "PENDENTE";

    @Column(name = "solicitado_por_externo_id")
    public Integer solicitadoPorExternoId;

    @Column(name = "cliente_decisao_em")
    public LocalDateTime clienteDecisaoEm;

    @Column(name = "cliente_decisao_motivo", columnDefinition = "TEXT")
    public String clienteDecisaoMotivo;

    @Column(name = "created_at")
    public LocalDateTime createdAt;

    @Column(name = "updated_at")
    public LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
