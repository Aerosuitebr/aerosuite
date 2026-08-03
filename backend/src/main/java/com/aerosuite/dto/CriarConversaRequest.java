package com.aerosuite.dto;

import java.util.List;

public record CriarConversaRequest(
    String tipo, // DIRETA ou GRUPO
    String nome, // Nome do grupo (opcional para DIRETA)
    String descricao, // Descrição do grupo
    List<Long> participantesIds // IDs dos participantes
) {}
