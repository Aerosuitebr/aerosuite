package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "conformidade_treinamento")
public class ConformidadeTreinamento extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @TenantId
    @Column(name = "tenant_id", nullable = false)
    public String tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;

    @Column(name = "usuario_id", nullable = false)
    public Integer usuarioId;

    @Column(name = "curso", nullable = false, length = 255)
    public String curso;

    @Column(name = "carga_horaria", precision = 6, scale = 2)
    public BigDecimal cargaHoraria;

    @Column(name = "data_conclusao")
    public LocalDate dataConclusao;

    @Column(name = "data_validade")
    public LocalDate dataValidade;

    @Column(name = "certificador", length = 120)
    public String certificador;

    @Column(name = "observacoes", columnDefinition = "TEXT")
    public String observacoes;

    @Column(name = "turma_ref", length = 120)
    public String turmaRef;

    @Column(name = "presente_lista")
    public Boolean presenteLista = true;

    @Column(name = "ativo", nullable = false)
    public Boolean ativo = true;

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
        if (ativo == null) {
            ativo = true;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
