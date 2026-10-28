package com.aerosuite.dto;

public record NrcContencaoRequest(
    Boolean contencaoNaoAplicavel,
    String contencaoOque,
    String contencaoQuem,
    String contencaoQuando,
    String contencaoAcao,
    Long contencaoResponsavelId,
    String contencaoResponsavelNome,
    Boolean concluirContencao
) {}
