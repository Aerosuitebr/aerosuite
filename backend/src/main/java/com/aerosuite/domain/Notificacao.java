package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notificacao")
public class Notificacao extends PanacheEntityBase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "usuario_id", nullable = false)
    public Long usuarioId;

    @Column(name = "tipo", nullable = false, length = 50)
    public String tipo; // TICKET_ABERTO, TICKET_RESPOSTA, TICKET_RESOLVIDO, TICKET_ATRIBUIDO, SISTEMA

    @Column(name = "titulo", nullable = false, length = 255)
    public String titulo;

    @Column(name = "mensagem", columnDefinition = "TEXT")
    public String mensagem;

    @Column(name = "link", length = 500)
    public String link; // URL para navegação

    @Column(name = "referencia_tipo", length = 50)
    public String referenciaTipo; // TICKET, OS, etc.

    @Column(name = "referencia_id")
    public Long referenciaId;

    @Column(name = "lida", nullable = false)
    public Boolean lida = false;

    @Column(name = "data_criacao", nullable = false)
    public LocalDateTime dataCriacao;

    @Column(name = "data_leitura")
    public LocalDateTime dataLeitura;

    @Column(name = "is_active")
    public Boolean isActive = true;

    @PrePersist
    public void prePersist() {
        if (this.dataCriacao == null) {
            this.dataCriacao = LocalDateTime.now();
        }
    }
}
