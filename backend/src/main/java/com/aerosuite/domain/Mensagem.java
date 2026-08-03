package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "mensagem")
public class Mensagem extends PanacheEntityBase {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversa_id", nullable = false)
    public Conversa conversa;
    
    @Column(name = "remetente_id", nullable = false)
    public Long remetenteId;
    
    @Column(name = "conteudo", columnDefinition = "TEXT")
    public String conteudo;
    
    @Column(name = "tipo", nullable = false, length = 20)
    public String tipo = "TEXTO"; // TEXTO, ARQUIVO, SISTEMA
    
    @Column(name = "data_envio", nullable = false)
    public LocalDateTime dataEnvio;
    
    @Column(name = "data_edicao")
    public LocalDateTime dataEdicao;
    
    @Column(name = "editada")
    public Boolean editada = false;
    
    @Column(name = "ativo")
    public Boolean ativo = true;
    
    @OneToMany(mappedBy = "mensagem", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    public List<MensagemAnexo> anexos;
    
    @PrePersist
    public void prePersist() {
        if (dataEnvio == null) {
            dataEnvio = LocalDateTime.now();
        }
    }
    
    // Métodos de consulta
    public static List<Mensagem> findByConversaId(Long conversaId, int page, int size) {
        return find("conversa.id = ?1 AND ativo = true ORDER BY dataEnvio DESC", conversaId)
                .page(page, size)
                .list();
    }
    
    public static long countByConversaId(Long conversaId) {
        return count("conversa.id = ?1 AND ativo = true", conversaId);
    }
    
    public static long countNaoLidasPorConversa(Long conversaId, Long usuarioId, LocalDateTime ultimaLeitura) {
        if (ultimaLeitura == null) {
            return count("conversa.id = ?1 AND ativo = true AND remetenteId != ?2", conversaId, usuarioId);
        }
        return count("conversa.id = ?1 AND ativo = true AND remetenteId != ?2 AND dataEnvio > ?3", 
                    conversaId, usuarioId, ultimaLeitura);
    }
    
    public static Mensagem findUltimaMensagem(Long conversaId) {
        return find("conversa.id = ?1 AND ativo = true ORDER BY dataEnvio DESC", conversaId).firstResult();
    }
}
