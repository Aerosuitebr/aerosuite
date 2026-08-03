package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;

import java.time.LocalDateTime;

@Entity
@Table(name = "conformidade_release_aceite")
public class ConformidadeReleaseAceite extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @TenantId
    @Column(name = "tenant_id", nullable = false)
    public String tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;

    @Column(name = "versao_app", nullable = false, length = 40)
    public String versaoApp;

    @Column(name = "flyway_ate", length = 16)
    public String flywayAte;

    @Column(name = "tipo_mudanca", nullable = false, length = 32)
    public String tipoMudanca = "EVOLUTIVA";

    @Column(name = "impacto_regulatorio", nullable = false)
    public Boolean impactoRegulatorio = false;

    @Column(name = "checklist_json", nullable = false, columnDefinition = "MEDIUMTEXT")
    public String checklistJson;

    @Column(name = "observacoes", columnDefinition = "TEXT")
    public String observacoes;

    @Column(name = "aceite_usuario_id", nullable = false)
    public Integer aceiteUsuarioId;

    @Column(name = "aceite_usuario_nome", length = 255)
    public String aceiteUsuarioNome;

    @Column(name = "aceite_em", nullable = false)
    public LocalDateTime aceiteEm;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (aceiteEm == null) {
            aceiteEm = LocalDateTime.now();
        }
    }
}
