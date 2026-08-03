package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "conversa")
public class Conversa extends PanacheEntityBase {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    
    @Column(name = "tipo", nullable = false, length = 20)
    public String tipo; // DIRETA, GRUPO
    
    @Column(name = "nome", length = 255)
    public String nome; // Nome do grupo (null para conversas diretas)
    
    @Column(name = "descricao", columnDefinition = "TEXT")
    public String descricao;
    
    @Column(name = "imagem", length = 500)
    public String imagem;
    
    @Column(name = "criador_id", nullable = false)
    public Long criadorId;
    
    @Column(name = "data_criacao", nullable = false)
    public LocalDateTime dataCriacao;
    
    @Column(name = "data_atualizacao")
    public LocalDateTime dataAtualizacao;
    
    @Column(name = "ativo")
    public Boolean ativo = true;
    
    @OneToMany(mappedBy = "conversa", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    public List<ConversaParticipante> participantes;
    
    @OneToMany(mappedBy = "conversa", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("dataEnvio DESC")
    public List<Mensagem> mensagens;
    
    @PrePersist
    public void prePersist() {
        if (dataCriacao == null) {
            dataCriacao = LocalDateTime.now();
        }
        dataAtualizacao = LocalDateTime.now();
    }
    
    @PreUpdate
    public void preUpdate() {
        dataAtualizacao = LocalDateTime.now();
    }
    
    // Métodos de consulta
    public static List<Conversa> findByUsuarioId(Long usuarioId) {
        return find("SELECT c FROM Conversa c JOIN c.participantes p WHERE p.usuarioId = ?1 AND p.ativo = true AND c.ativo = true ORDER BY c.dataAtualizacao DESC", usuarioId).list();
    }
    
    public static Conversa findConversaDireta(Long usuario1Id, Long usuario2Id) {
        return find("SELECT c FROM Conversa c JOIN c.participantes p1 JOIN c.participantes p2 " +
                   "WHERE c.tipo = 'DIRETA' AND c.ativo = true " +
                   "AND p1.usuarioId = ?1 AND p1.ativo = true " +
                   "AND p2.usuarioId = ?2 AND p2.ativo = true", usuario1Id, usuario2Id).firstResult();
    }
}
