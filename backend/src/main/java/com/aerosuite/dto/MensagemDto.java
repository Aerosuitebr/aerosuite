package com.aerosuite.dto;

import java.time.LocalDateTime;
import java.util.List;

public record MensagemDto(
    Long id,
    Long conversaId,
    Long remetenteId,
    String remetenteNome,
    String remetenteFoto,
    String conteudo,
    String tipo,
    LocalDateTime dataEnvio,
    LocalDateTime dataEdicao,
    Boolean editada,
    Boolean ativo,
    List<MensagemAnexoDto> anexos
) {
    // Construtor simplificado sem anexos
    public MensagemDto(Long id, Long conversaId, Long remetenteId, String remetenteNome, 
                       String remetenteFoto, String conteudo, String tipo, 
                       LocalDateTime dataEnvio, LocalDateTime dataEdicao, Boolean editada, Boolean ativo) {
        this(id, conversaId, remetenteId, remetenteNome, remetenteFoto, conteudo, tipo, 
             dataEnvio, dataEdicao, editada, ativo, null);
    }
}
