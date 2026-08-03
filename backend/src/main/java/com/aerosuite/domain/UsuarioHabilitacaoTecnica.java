package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "usuario_habilitacao_tecnica")
public class UsuarioHabilitacaoTecnica extends PanacheEntityBase {

    public enum TipoHabilitacao {
        MECANICO,
        INSPETOR,
        RT,
        OUTRO
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @TenantId
    @Column(name = "tenant_id", nullable = false)
    public String tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;

    @Column(name = "usuario_id", nullable = false)
    public Integer usuarioId;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 32)
    public TipoHabilitacao tipo;

    @Column(name = "escopo", length = 255)
    public String escopo;

    @Column(name = "identificador", length = 120)
    public String identificador;

    @Column(name = "emissor", length = 120)
    public String emissor;

    @Column(name = "data_emissao")
    public LocalDate dataEmissao;

    @Column(name = "data_validade")
    public LocalDate dataValidade;

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
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
