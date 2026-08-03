package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "chamada")
public class Chamada extends PanacheEntityBase {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    
    @Column(name = "conversa_id", nullable = false)
    public Long conversaId;
    
    @Column(name = "chamador_id", nullable = false)
    public Long chamadorId;
    
    @Column(name = "chamador_nome", length = 255)
    public String chamadorNome;
    
    @Column(name = "receptor_id", nullable = false)
    public Long receptorId;
    
    @Column(name = "receptor_nome", length = 255)
    public String receptorNome;
    
    @Column(name = "status", nullable = false, length = 20)
    public String status; // CHAMANDO, ATENDIDA, RECUSADA, ENCERRADA, NAO_ATENDIDA, OCUPADO
    
    @Column(name = "data_inicio", nullable = false)
    public LocalDateTime dataInicio;
    
    @Column(name = "data_atendimento")
    public LocalDateTime dataAtendimento;
    
    @Column(name = "data_fim")
    public LocalDateTime dataFim;
    
    @Column(name = "duracao_segundos")
    public Long duracaoSegundos;
    
    @Column(name = "oferta_sdp", columnDefinition = "LONGTEXT")
    public String ofertaSdp;
    
    @Column(name = "resposta_sdp", columnDefinition = "LONGTEXT")
    public String respostaSdp;
    
    @Column(name = "ice_candidates_chamador", columnDefinition = "LONGTEXT")
    public String iceCandidatesChamador;
    
    @Column(name = "ice_candidates_receptor", columnDefinition = "LONGTEXT")
    public String iceCandidatesReceptor;
    
    @PrePersist
    public void prePersist() {
        if (dataInicio == null) {
            dataInicio = LocalDateTime.now();
        }
        if (status == null) {
            status = "CHAMANDO";
        }
    }
    
    // Métodos de consulta
    
    /**
     * Busca chamada ativa recebida por um usuário
     */
    public static Chamada findChamadaRecebida(Long receptorId) {
        return find("receptorId = ?1 AND status = 'CHAMANDO'", receptorId).firstResult();
    }
    
    /**
     * Busca chamada ativa de um usuário (como chamador ou receptor)
     */
    public static Chamada findChamadaAtiva(Long usuarioId) {
        return find("(chamadorId = ?1 OR receptorId = ?1) AND status IN ('CHAMANDO', 'ATENDIDA')", usuarioId).firstResult();
    }
    
    /**
     * Lista histórico de chamadas de uma conversa
     */
    public static List<Chamada> findByConversaId(Long conversaId) {
        return find("conversaId = ?1 ORDER BY dataInicio DESC", conversaId).list();
    }
    
    /**
     * Lista histórico de chamadas de um usuário
     */
    public static List<Chamada> findByUsuarioId(Long usuarioId) {
        return find("chamadorId = ?1 OR receptorId = ?1 ORDER BY dataInicio DESC", usuarioId).list();
    }
    
    /**
     * Verifica se usuário está em chamada
     */
    public static boolean isUsuarioEmChamada(Long usuarioId) {
        return find("(chamadorId = ?1 OR receptorId = ?1) AND status IN ('CHAMANDO', 'ATENDIDA')", usuarioId).count() > 0;
    }
}
