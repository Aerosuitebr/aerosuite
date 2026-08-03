package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "acesso_auditoria")
public class AcessoAuditoria extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "tenant_id")
    public Long tenantId;

    @Column(name = "usuario_id")
    public Integer usuarioId;

    @Column(name = "email", length = 255)
    public String email;

    @Column(name = "evento", nullable = false, length = 64)
    public String evento;

    @Column(name = "sucesso", nullable = false)
    public Boolean sucesso = false;

    @Column(name = "detalhe", length = 512)
    public String detalhe;

    @Column(name = "ip", length = 64)
    public String ip;

    @Column(name = "user_agent", length = 512)
    public String userAgent;

    @Column(name = "recurso", length = 255)
    public String recurso;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
