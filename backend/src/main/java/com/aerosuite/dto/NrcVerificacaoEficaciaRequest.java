package com.aerosuite.dto;

public record NrcVerificacaoEficaciaRequest(
    String verificacaoEficacia,
    String eficaciaDecisao,
    Boolean eficaciaAtualizarRiscos,
    String eficaciaMudancasSgq
) {}
