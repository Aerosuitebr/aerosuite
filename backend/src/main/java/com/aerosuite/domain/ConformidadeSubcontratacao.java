package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "conformidade_subcontratacao")
public class ConformidadeSubcontratacao extends PanacheEntityBase {

    public enum StatusSubcontratacao {
        ATIVO,
        SUSPENSO,
        ENCERRADO
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @TenantId
    @Column(name = "tenant_id", nullable = false)
    public String tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;

    @Column(name = "razao_social", nullable = false, length = 255)
    public String razaoSocial;

    @Column(name = "certificado_part145", length = 120)
    public String certificadoPart145;

    @Column(name = "escopo", columnDefinition = "TEXT")
    public String escopo;

    @Column(name = "validade_certificado")
    public LocalDate validadeCertificado;

    @Column(name = "os_id")
    public Integer osId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 16)
    public StatusSubcontratacao status = StatusSubcontratacao.ATIVO;

    @Column(name = "observacoes", columnDefinition = "TEXT")
    public String observacoes;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    public LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
        if (status == null) {
            status = StatusSubcontratacao.ATIVO;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
