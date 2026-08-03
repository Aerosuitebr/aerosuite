package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;

import java.time.LocalDateTime;

@Entity
@Table(name = "sgq_documento_revisao_historico")
public class SgqDocumentoRevisaoHistorico extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @TenantId
    @Column(name = "tenant_id", nullable = false)
    public String tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;

    @Column(name = "documento_id", nullable = false)
    public Long documentoId;

    @Column(name = "codigo", nullable = false, length = 80)
    public String codigo;

    @Column(name = "revisao_anterior", length = 32)
    public String revisaoAnterior;

    @Column(name = "revisao_nova", nullable = false, length = 32)
    public String revisaoNova;

    @Column(name = "status_anterior", length = 24)
    public String statusAnterior;

    @Column(name = "status_novo", nullable = false, length = 24)
    public String statusNovo;

    @Column(name = "observacao", columnDefinition = "TEXT")
    public String observacao;

    @Column(name = "usuario_email", length = 255)
    public String usuarioEmail;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
