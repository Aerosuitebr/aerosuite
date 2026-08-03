package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ticket_email_digest_item")
public class TicketEmailDigestItem extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "tenant_id", nullable = false)
    public Long tenantId;

    @Column(name = "usuario_id", nullable = false)
    public Integer usuarioId;

    @Column(name = "ticket_id", nullable = false)
    public Long ticketId;

    @Column(name = "evento_tipo", nullable = false, length = 40)
    public String eventoTipo;

    @Column(name = "resumo", length = 500)
    public String resumo;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @Column(name = "sent_at")
    public LocalDateTime sentAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
