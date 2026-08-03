package com.aerosuite.domain;

import com.aerosuite.domain.ConformidadeNaoConformidade.CapaFase;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "conformidade_nc_capa_etapa")
public class ConformidadeNcCapaEtapa extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @TenantId
    @Column(name = "tenant_id", nullable = false)
    public String tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;

    @Column(name = "nc_id", nullable = false)
    public Long ncId;

    @Enumerated(EnumType.STRING)
    @Column(name = "fase", nullable = false, length = 24)
    public CapaFase fase;

    @Column(name = "responsavel_usuario_id")
    public Integer responsavelUsuarioId;

    @Column(name = "responsavel_usuario_nome", length = 255)
    public String responsavelUsuarioNome;

    @Column(name = "prazo")
    public LocalDate prazo;

    @Column(name = "aprovado", nullable = false)
    public Boolean aprovado = false;

    @Column(name = "aprovado_usuario_id")
    public Integer aprovadoUsuarioId;

    @Column(name = "aprovado_usuario_nome", length = 255)
    public String aprovadoUsuarioNome;

    @Column(name = "aprovado_em")
    public LocalDateTime aprovadoEm;

    @Column(name = "aprovacao_observacao", columnDefinition = "TEXT")
    public String aprovacaoObservacao;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    public LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
