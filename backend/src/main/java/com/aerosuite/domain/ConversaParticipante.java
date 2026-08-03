package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "conversa_participante")
public class ConversaParticipante extends PanacheEntityBase {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversa_id", nullable = false)
    public Conversa conversa;
    
    @Column(name = "usuario_id", nullable = false)
    public Long usuarioId;
    
    @Column(name = "papel", nullable = false, length = 20)
    public String papel = "MEMBRO"; // ADMIN, MEMBRO
    
    @Column(name = "data_entrada", nullable = false)
    public LocalDateTime dataEntrada;
    
    @Column(name = "ultima_leitura")
    public LocalDateTime ultimaLeitura;
    
    @Column(name = "notificacoes_ativas")
    public Boolean notificacoesAtivas = true;
    
    @Column(name = "ativo")
    public Boolean ativo = true;
    
    @PrePersist
    public void prePersist() {
        if (dataEntrada == null) {
            dataEntrada = LocalDateTime.now();
        }
    }
    
    // Métodos de consulta
    public static ConversaParticipante findByConversaAndUsuario(Long conversaId, Long usuarioId) {
        return find("conversa.id = ?1 AND usuarioId = ?2 AND ativo = true", conversaId, usuarioId).firstResult();
    }
    
    public static long countNaoLidas(Long usuarioId) {
        return count("SELECT COUNT(m) FROM Mensagem m " +
                    "JOIN ConversaParticipante cp ON m.conversa.id = cp.conversa.id " +
                    "WHERE cp.usuarioId = ?1 AND cp.ativo = true " +
                    "AND m.ativo = true AND m.remetenteId != ?1 " +
                    "AND (cp.ultimaLeitura IS NULL OR m.dataEnvio > cp.ultimaLeitura)", usuarioId);
    }
}
