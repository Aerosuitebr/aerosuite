package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;
import java.time.LocalDateTime;

@Entity
@Table(name = "nrc_responsavel_historico")
public class NrcResponsavelHistorico extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @TenantId
    @Column(name = "tenant_id", nullable = false, length = 64)
    public String tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nrc_id", nullable = false)
    public Nrc nrc;

    @Column(name = "usuario_id", nullable = false)
    public Long usuarioId;

    @Column(name = "usuario_nome", length = 255)
    public String usuarioNome;

    @Column(name = "data_atribuicao", nullable = false)
    public LocalDateTime dataAtribuicao;

    @PrePersist
    public void prePersist() {
        if (dataAtribuicao == null) {
            dataAtribuicao = LocalDateTime.now();
        }
    }
}
