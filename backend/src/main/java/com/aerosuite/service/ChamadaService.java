package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.domain.Chamada;
import com.aerosuite.domain.Usuario;
import com.aerosuite.dto.ChamadaDto;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@ApplicationScoped
public class ChamadaService {

    /**
     * Inicia uma nova chamada
     */
    @Transactional
    public ChamadaDto iniciarChamada(Long conversaId, Long chamadorId, Long receptorId, String ofertaSdp) {
        // Verificar se o receptor já está em uma chamada
        if (Chamada.isUsuarioEmChamada(receptorId)) {
            Chamada chamadaOcupado = new Chamada();
            chamadaOcupado.conversaId = conversaId;
            chamadaOcupado.chamadorId = chamadorId;
            chamadaOcupado.chamadorNome = buscarNomeUsuario(chamadorId);
            chamadaOcupado.receptorId = receptorId;
            chamadaOcupado.receptorNome = buscarNomeUsuario(receptorId);
            chamadaOcupado.status = "OCUPADO";
            chamadaOcupado.ofertaSdp = ofertaSdp;
            chamadaOcupado.dataFim = LocalDateTime.now();
            chamadaOcupado.persist();
            return toDto(chamadaOcupado);
        }
        
        // Verificar se o chamador já está em uma chamada
        if (Chamada.isUsuarioEmChamada(chamadorId)) {
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.CHAMADA_ALREADY_IN_CALL));
        }
        
        Chamada chamada = new Chamada();
        chamada.conversaId = conversaId;
        chamada.chamadorId = chamadorId;
        chamada.chamadorNome = buscarNomeUsuario(chamadorId);
        chamada.receptorId = receptorId;
        chamada.receptorNome = buscarNomeUsuario(receptorId);
        chamada.status = "CHAMANDO";
        chamada.ofertaSdp = ofertaSdp;
        chamada.persist();
        
        return toDto(chamada);
    }
    
    /**
     * Atende uma chamada
     */
    @Transactional
    public ChamadaDto atenderChamada(Long chamadaId, Long receptorId, String respostaSdp) {
        Chamada chamada = Chamada.findById(chamadaId);
        if (chamada == null) {
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.CHAMADA_NOT_FOUND));
        }
        
        if (!chamada.receptorId.equals(receptorId)) {
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.CHAMADA_CANNOT_ANSWER));
        }
        
        if (!"CHAMANDO".equals(chamada.status)) {
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.CHAMADA_NOT_AVAILABLE));
        }
        
        chamada.status = "ATENDIDA";
        chamada.dataAtendimento = LocalDateTime.now();
        chamada.respostaSdp = respostaSdp;
        chamada.persist();
        
        return toDto(chamada);
    }
    
    /**
     * Recusa uma chamada
     */
    @Transactional
    public ChamadaDto recusarChamada(Long chamadaId, Long receptorId) {
        Chamada chamada = Chamada.findById(chamadaId);
        if (chamada == null) {
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.CHAMADA_NOT_FOUND));
        }
        
        if (!chamada.receptorId.equals(receptorId)) {
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.CHAMADA_CANNOT_REJECT));
        }
        
        chamada.status = "RECUSADA";
        chamada.dataFim = LocalDateTime.now();
        chamada.persist();
        
        return toDto(chamada);
    }
    
    /**
     * Encerra uma chamada
     */
    @Transactional
    public ChamadaDto encerrarChamada(Long chamadaId, Long usuarioId) {
        Chamada chamada = Chamada.findById(chamadaId);
        if (chamada == null) {
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.CHAMADA_NOT_FOUND));
        }
        
        if (!chamada.chamadorId.equals(usuarioId) && !chamada.receptorId.equals(usuarioId)) {
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.CHAMADA_CANNOT_END));
        }
        
        chamada.status = "ENCERRADA";
        chamada.dataFim = LocalDateTime.now();
        
        // Calcular duração se foi atendida
        if (chamada.dataAtendimento != null) {
            chamada.duracaoSegundos = ChronoUnit.SECONDS.between(chamada.dataAtendimento, chamada.dataFim);
        }
        
        chamada.persist();
        
        return toDto(chamada);
    }
    
    /**
     * Marca chamada como não atendida
     */
    @Transactional
    public ChamadaDto marcarNaoAtendida(Long chamadaId) {
        Chamada chamada = Chamada.findById(chamadaId);
        if (chamada == null) {
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.CHAMADA_NOT_FOUND));
        }
        
        if ("CHAMANDO".equals(chamada.status)) {
            chamada.status = "NAO_ATENDIDA";
            chamada.dataFim = LocalDateTime.now();
            chamada.persist();
        }
        
        return toDto(chamada);
    }
    
    /**
     * Atualiza ICE candidates do chamador
     */
    @Transactional
    public void atualizarIceCandidatesChamador(Long chamadaId, String iceCandidates) {
        Chamada chamada = Chamada.findById(chamadaId);
        if (chamada != null) {
            chamada.iceCandidatesChamador = iceCandidates;
            chamada.persist();
        }
    }
    
    /**
     * Atualiza ICE candidates do receptor
     */
    @Transactional
    public void atualizarIceCandidatesReceptor(Long chamadaId, String iceCandidates) {
        Chamada chamada = Chamada.findById(chamadaId);
        if (chamada != null) {
            chamada.iceCandidatesReceptor = iceCandidates;
            chamada.persist();
        }
    }
    
    /**
     * Atualiza o SDP de resposta (após o receptor configurar WebRTC)
     */
    @Transactional
    public ChamadaDto atualizarSdpResposta(Long chamadaId, String respostaSdp) {
        Chamada chamada = Chamada.findById(chamadaId);
        if (chamada == null) {
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.CHAMADA_NOT_FOUND));
        }
        
        chamada.respostaSdp = respostaSdp;
        chamada.persist();
        
        return toDto(chamada);
    }
    
    /**
     * Busca chamada por ID
     */
    public ChamadaDto buscarChamada(Long chamadaId) {
        Chamada chamada = Chamada.findById(chamadaId);
        if (chamada == null) {
            return null;
        }
        return toDto(chamada);
    }
    
    /**
     * Busca chamada recebida (tocando) para um usuário
     */
    public ChamadaDto buscarChamadaRecebida(Long receptorId) {
        Chamada chamada = Chamada.findChamadaRecebida(receptorId);
        if (chamada == null) {
            return null;
        }
        return toDto(chamada);
    }
    
    /**
     * Lista histórico de chamadas de um usuário
     */
    public List<ChamadaDto> listarHistorico(Long usuarioId, int page, int size) {
        return Chamada.findByUsuarioId(usuarioId)
                .stream()
                .skip((long) page * size)
                .limit(size)
                .map(this::toDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Verifica se usuário está em chamada
     */
    public boolean isEmChamada(Long usuarioId) {
        return Chamada.isUsuarioEmChamada(usuarioId);
    }
    
    // ==================== HELPERS ====================
    
    private String buscarNomeUsuario(Long usuarioId) {
        Usuario usuario = Usuario.findById(usuarioId);
        if (usuario != null) {
            return usuario.nome;
        }
        return "Usuário";
    }
    
    private ChamadaDto toDto(Chamada chamada) {
        ChamadaDto dto = new ChamadaDto();
        dto.id = chamada.id;
        dto.conversaId = chamada.conversaId;
        dto.chamadorId = chamada.chamadorId;
        dto.chamadorNome = chamada.chamadorNome;
        dto.receptorId = chamada.receptorId;
        dto.receptorNome = chamada.receptorNome;
        dto.status = chamada.status;
        dto.dataInicio = chamada.dataInicio;
        dto.dataAtendimento = chamada.dataAtendimento;
        dto.dataFim = chamada.dataFim;
        dto.duracaoSegundos = chamada.duracaoSegundos;
        dto.ofertaSdp = chamada.ofertaSdp;
        dto.respostaSdp = chamada.respostaSdp;
        dto.iceCandidatesChamador = chamada.iceCandidatesChamador;
        dto.iceCandidatesReceptor = chamada.iceCandidatesReceptor;
        return dto;
    }
}
