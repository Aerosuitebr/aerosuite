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
@Table(name = "cliente_proposta_bling_map")
public class ClientePropostaBlingMap extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "tenant_id", nullable = false)
    public Long tenantId;

    @Column(name = "cliente_proposta_id", nullable = false)
    public Integer clientePropostaId;

    @Column(name = "bling_contato_id", nullable = false)
    public Long blingContatoId;

    @Column(name = "last_sync_at")
    public LocalDateTime lastSyncAt;

    @Column(name = "last_sync_source", length = 32)
    public String lastSyncSource;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public static ClientePropostaBlingMap findByBlingContato(long tenantId, long blingContatoId) {
        return find("tenantId = ?1 and blingContatoId = ?2", tenantId, blingContatoId).firstResult();
    }

    public static ClientePropostaBlingMap findByClienteProposta(long tenantId, int clientePropostaId) {
        return find("tenantId = ?1 and clientePropostaId = ?2", tenantId, clientePropostaId).firstResult();
    }
}
