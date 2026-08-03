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

@Entity
@Table(name = "proposta_bling_pedido")
public class PropostaBlingPedido extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "tenant_id", nullable = false)
    public Long tenantId;

    @Column(name = "proposta_comercial_id", nullable = false)
    public Long propostaComercialId;

    @Column(name = "bling_pedido_id", nullable = false)
    public Long blingPedidoId;

    @Column(name = "bling_pedido_numero", length = 40)
    public String blingPedidoNumero;

    @Column(name = "bling_situacao", length = 80)
    public String blingSituacao;

    @Column(name = "pushed_at", nullable = false)
    public LocalDateTime pushedAt;

    @Column(name = "pushed_by_usuario_id")
    public Integer pushedByUsuarioId;

    @Column(name = "last_sync_at")
    public LocalDateTime lastSyncAt;

    @Column(name = "last_sync_source", length = 32)
    public String lastSyncSource;

    @PrePersist
    void onCreate() {
        if (pushedAt == null) {
            pushedAt = LocalDateTime.now();
        }
    }

    public static PropostaBlingPedido findByProposta(long tenantId, long propostaId) {
        return find("tenantId = ?1 and propostaComercialId = ?2", tenantId, propostaId).firstResult();
    }

    public static PropostaBlingPedido findByBlingPedido(long tenantId, long blingPedidoId) {
        return find("tenantId = ?1 and blingPedidoId = ?2", tenantId, blingPedidoId).firstResult();
    }
}
