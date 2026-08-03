package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "aero_diretriz")
public class AeroDiretriz extends PanacheEntityBase {

    public enum TipoDiretriz {
        AD,
        SB,
        OUTRO
    }

    public enum StatusDiretriz {
        ABERTA,
        EM_ANDAMENTO,
        CUMPRIDA,
        NAO_APLICAVEL
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @TenantId
    @Column(name = "tenant_id", nullable = false)
    public String tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 16)
    public TipoDiretriz tipo;

    @Column(name = "numero", nullable = false, length = 80)
    public String numero;

    @Column(name = "titulo", nullable = false, length = 500)
    public String titulo;

    @Column(name = "emissor", length = 120)
    public String emissor;

    @Column(name = "ata", length = 32)
    public String ata;

    @Column(name = "fcu_id")
    public Integer fcuId;

    @Column(name = "part_number", length = 100)
    public String partNumber;

    @Column(name = "serial_number", length = 100)
    public String serialNumber;

    @Column(name = "data_emissao")
    public LocalDate dataEmissao;

    @Column(name = "data_limite_cumprimento")
    public LocalDate dataLimiteCumprimento;

    @Column(name = "data_cumprimento")
    public LocalDate dataCumprimento;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    public StatusDiretriz status = StatusDiretriz.ABERTA;

    @Column(name = "os_cumprimento_id")
    public Long osCumprimentoId;

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
            status = StatusDiretriz.ABERTA;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
