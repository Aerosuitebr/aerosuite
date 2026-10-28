package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;
import java.time.LocalDateTime;

@Entity
@Table(name = "nrc_auditoria")
public class NrcAuditoria extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @TenantId
    @Column(name = "tenant_id", nullable = false, length = 64)
    public String tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nrc_id", nullable = false)
    public Nrc nrc;

    @Column(name = "acao", nullable = false, length = 50)
    public String acao;

    @Column(name = "campo", length = 100)
    public String campo;

    @Column(name = "valor_anterior", columnDefinition = "TEXT")
    public String valorAnterior;

    @Column(name = "valor_novo", columnDefinition = "TEXT")
    public String valorNovo;

    @Column(name = "usuario_id")
    public Long usuarioId;

    @Column(name = "usuario_nome", length = 255)
    public String usuarioNome;

    @Column(name = "data_hora", nullable = false)
    public LocalDateTime dataHora;

    @PrePersist
    public void prePersist() {
        if (dataHora == null) {
            dataHora = LocalDateTime.now();
        }
    }
}
