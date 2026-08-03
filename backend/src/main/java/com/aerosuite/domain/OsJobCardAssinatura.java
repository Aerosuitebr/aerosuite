package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;

import java.time.LocalDateTime;

@Entity
@Table(name = "os_job_card_assinatura")
public class OsJobCardAssinatura extends PanacheEntityBase {

    public enum PapelAssinatura {
        EXECUCAO,
        INSPECAO
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @TenantId
    @Column(name = "tenant_id", nullable = false)
    public String tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;

    @Column(name = "os_id", nullable = false)
    public Long osId;

    @Enumerated(EnumType.STRING)
    @Column(name = "papel", nullable = false, length = 32)
    public PapelAssinatura papel;

    @Lob
    @Basic(fetch = FetchType.LAZY)
    @Column(name = "assinatura_png", nullable = false, columnDefinition = "LONGBLOB")
    public byte[] assinaturaPng;

    @Column(name = "assinado_em", nullable = false)
    public LocalDateTime assinadoEm;

    @Column(name = "usuario_id")
    public Long usuarioId;

    @Column(name = "usuario_nome")
    public String usuarioNome;

    @Column(name = "assinatura_sha256", length = 64)
    public String assinaturaSha256;

    @Column(name = "assinatura_timestamp_server")
    public LocalDateTime assinaturaTimestampServer;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (assinadoEm == null) {
            assinadoEm = now;
        }
        if (createdAt == null) {
            createdAt = now;
        }
    }
}
