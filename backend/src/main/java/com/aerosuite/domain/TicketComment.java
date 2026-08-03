package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ticket_comment")
public class TicketComment extends PanacheEntityBase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", nullable = false)
    public Ticket ticket;

    @Column(name = "conteudo", columnDefinition = "TEXT", nullable = false)
    public String conteudo;

    @Column(name = "tipo", nullable = false, length = 30)
    public String tipo; // COMENTARIO, RESPOSTA, ALTERACAO_STATUS, INTERNO, SOLUCAO

    @Column(name = "visivel_usuario")
    public Boolean visivelUsuario = true; // Comentários internos não são visíveis

    @Column(name = "usuario_id")
    public Long usuarioId;

    @Column(name = "usuario_nome", length = 255)
    public String usuarioNome;

    @Column(name = "usuario_tipo", length = 50)
    public String usuarioTipo; // CLIENTE, ATENDENTE, SISTEMA

    @Column(name = "status_anterior", length = 30)
    public String statusAnterior;

    @Column(name = "status_novo", length = 30)
    public String statusNovo;

    @Column(name = "data_criacao", nullable = false)
    public LocalDateTime dataCriacao;

    @Column(name = "data_edicao")
    public LocalDateTime dataEdicao;

    @Column(name = "is_active")
    public Boolean isActive = true;

    @PrePersist
    public void prePersist() {
        if (this.dataCriacao == null) {
            this.dataCriacao = LocalDateTime.now();
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.dataEdicao = LocalDateTime.now();
    }
}
