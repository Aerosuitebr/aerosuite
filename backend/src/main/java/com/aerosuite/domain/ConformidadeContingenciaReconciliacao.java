package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "conformidade_contingencia_reconciliacao")
public class ConformidadeContingenciaReconciliacao extends PanacheEntityBase {

    public enum StatusReconciliacao {
        EM_ANDAMENTO,
        CONCLUIDA
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @TenantId
    @Column(name = "tenant_id", nullable = false)
    public String tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;

    @Column(name = "titulo", nullable = false, length = 255)
    public String titulo;

    @Column(name = "os_id")
    public Long osId;

    @Column(name = "periodo_inicio")
    public LocalDate periodoInicio;

    @Column(name = "periodo_fim")
    public LocalDate periodoFim;

    @Column(name = "checklist_json", nullable = false, columnDefinition = "MEDIUMTEXT")
    public String checklistJson;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    public StatusReconciliacao status = StatusReconciliacao.EM_ANDAMENTO;

    @Column(name = "observacoes", columnDefinition = "TEXT")
    public String observacoes;

    @Column(name = "concluido_em")
    public LocalDateTime concluidoEm;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    public LocalDateTime updatedAt;

    @Column(name = "created_by_usuario_id")
    public Integer createdByUsuarioId;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
