package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "os_notificacao_deficit_troca")
public class OsNotificacaoDeficitTroca extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "usuario_id", nullable = false)
    public Integer usuarioId;

    @Column(name = "os_id", nullable = false)
    public Long osId;

    @Column(name = "id_os")
    public Integer idOs;

    @Column(name = "cliente_nome", length = 500)
    public String clienteNome;

    @Column(name = "detalhe_json", nullable = false, columnDefinition = "TEXT")
    public String detalheJson;

    /** DEFICIT = falta de estoque; SOLICITACAO_TROCA = nova linha de produto na Solicitação de Troca Eventual */
    @Column(name = "kind", nullable = false, length = 32)
    public String kind = "DEFICIT";

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @Column(name = "acknowledged_at")
    public LocalDateTime acknowledgedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
