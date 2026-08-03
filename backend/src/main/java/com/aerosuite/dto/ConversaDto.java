package com.aerosuite.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ConversaDto(
    Long id,
    String tipo,
    String nome,
    String descricao,
    String imagem,
    Long criadorId,
    LocalDateTime dataCriacao,
    LocalDateTime dataAtualizacao,
    Boolean ativo,
    // Campos calculados
    Long naoLidas,
    MensagemDto ultimaMensagem,
    List<ParticipanteResumoDto> participantes
) {
    // Construtor simplificado
    public ConversaDto(Long id, String tipo, String nome, String descricao, String imagem, 
                       Long criadorId, LocalDateTime dataCriacao, LocalDateTime dataAtualizacao, Boolean ativo) {
        this(id, tipo, nome, descricao, imagem, criadorId, dataCriacao, dataAtualizacao, ativo, 0L, null, null);
    }
}
