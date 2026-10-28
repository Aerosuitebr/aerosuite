package com.aerosuite.dto;



public record NrcEncerramentoRequest(

    String verificacaoEficacia,

    String eficaciaDecisao,

    Boolean eficaciaAtualizarRiscos,

    String eficaciaMudancasSgq

) {}


