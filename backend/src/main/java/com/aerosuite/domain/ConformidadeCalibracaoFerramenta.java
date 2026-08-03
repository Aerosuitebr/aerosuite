package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "conformidade_calibracao_ferramenta")
public class ConformidadeCalibracaoFerramenta extends PanacheEntityBase {

    public enum TipoItem {
        FERRAMENTA,
        INSTRUMENTO
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @TenantId
    @Column(name = "tenant_id", nullable = false)
    public String tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;

    @Column(name = "identificador", nullable = false, length = 80)
    public String identificador;

    @Column(name = "descricao", nullable = false, length = 255)
    public String descricao;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 24)
    public TipoItem tipo = TipoItem.INSTRUMENTO;

    @Column(name = "localizacao", length = 120)
    public String localizacao;

    @Column(name = "data_ultima_calibracao")
    public LocalDate dataUltimaCalibracao;

    @Column(name = "data_proxima_calibracao")
    public LocalDate dataProximaCalibracao;

    @Column(name = "certificado_ref", length = 120)
    public String certificadoRef;

    @Column(name = "observacoes", columnDefinition = "TEXT")
    public String observacoes;

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
        if (tipo == null) {
            tipo = TipoItem.INSTRUMENTO;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
