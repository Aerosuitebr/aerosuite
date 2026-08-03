package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "os_job_card_apontamento")
public class OsJobCardApontamento extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @TenantId
    @Column(name = "tenant_id", nullable = false)
    public String tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;

    @Column(name = "os_id", nullable = false)
    public Long osId;

    @Column(name = "trabalho_em", nullable = false)
    public LocalDate trabalhoEm;

    @Column(name = "horas", nullable = false, precision = 6, scale = 2)
    public BigDecimal horas;

    @Column(name = "descricao", columnDefinition = "TEXT")
    public String descricao;

    @Column(name = "usuario_id")
    public Long usuarioId;

    @Column(name = "usuario_nome")
    public String usuarioNome;

    @Column(name = "ferramenta_identificador", length = 80)
    public String ferramentaIdentificador;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
