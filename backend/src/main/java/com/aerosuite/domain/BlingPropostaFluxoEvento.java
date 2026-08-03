package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "bling_proposta_fluxo_evento")
public class BlingPropostaFluxoEvento extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "tenant_id", nullable = false)
    public Long tenantId;

    @Column(name = "proposta_comercial_id", nullable = false)
    public Long propostaComercialId;

    @Column(name = "os_id")
    public Long osId;

    @Column(name = "etapa", nullable = false, length = 40)
    public String etapa;

    @Column(name = "status", nullable = false, length = 20)
    public String status;

    @Column(name = "mensagem", length = 500)
    public String mensagem;

    @Column(name = "detalhe", columnDefinition = "TEXT")
    public String detalhe;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @PrePersist
    void touch() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    @SuppressWarnings("unchecked")
    public static List<BlingPropostaFluxoEvento> listByProposta(long tenantId, long propostaId) {
        return (List<BlingPropostaFluxoEvento>) (List<?>) find(
                        "tenantId = ?1 and propostaComercialId = ?2 order by createdAt asc, id asc",
                        tenantId,
                        propostaId)
                .list();
    }
}
