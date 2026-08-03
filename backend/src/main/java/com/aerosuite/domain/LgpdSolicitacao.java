package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "lgpd_solicitacao")
public class LgpdSolicitacao extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "tenant_id", nullable = false)
    public Long tenantId;

    @Column(name = "usuario_id")
    public Integer usuarioId;

    @Column(name = "email", nullable = false)
    public String email;

    @Column(name = "tipo", nullable = false, length = 16)
    public String tipo;

    @Column(name = "status", nullable = false, length = 32)
    public String status = "PENDING";

    @Column(name = "observacao", columnDefinition = "TEXT")
    public String observacao;

    /** Caminho relativo em {@code aero.suite.lgpd.storage-dir} (export JSON). */
    @Column(name = "result_artifact", length = 512)
    public String resultArtifact;

    @Column(name = "error_message", columnDefinition = "TEXT")
    public String errorMessage;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @Column(name = "processed_at")
    public LocalDateTime processedAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
