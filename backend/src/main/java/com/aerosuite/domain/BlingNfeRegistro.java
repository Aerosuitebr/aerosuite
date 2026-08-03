package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "bling_nfe_registro")
public class BlingNfeRegistro extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "tenant_id", nullable = false)
    public Long tenantId;

    @Column(name = "proposta_comercial_id")
    public Long propostaComercialId;

    @Column(name = "bling_pedido_id")
    public Long blingPedidoId;

    @Column(name = "bling_nfe_id", nullable = false)
    public Long blingNfeId;

    @Column(name = "numero", length = 40)
    public String numero;

    @Column(name = "chave_acesso", length = 44)
    public String chaveAcesso;

    @Column(name = "situacao", length = 80)
    public String situacao;

    @Column(name = "danfe_url", length = 500)
    public String danfeUrl;

    @Column(name = "emitted_at")
    public LocalDateTime emittedAt;

    @Column(name = "payload_resumo", length = 1000)
    public String payloadResumo;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    public LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    public static BlingNfeRegistro findByBlingNfe(long tenantId, long blingNfeId) {
        return find("tenantId = ?1 and blingNfeId = ?2", tenantId, blingNfeId).firstResult();
    }

    @SuppressWarnings("unchecked")
    public static List<BlingNfeRegistro> listByProposta(long tenantId, long propostaId) {
        return (List<BlingNfeRegistro>) (List<?>) find(
                        "tenantId = ?1 and propostaComercialId = ?2 order by emittedAt desc, id desc",
                        tenantId,
                        propostaId)
                .list();
    }
}
