package com.aerosuite.dto;



import java.util.List;

public record NrcAnaliseRequest(

    String causaRaiz,

    String metodoCausa,

    String disposicao,

    String disposicaoObservacao,

    String porque1,

    String porque2,

    String porque3,

    String porque4,

    String porque5,

    List<String> porquesExtra,

    String ishikawaMaterial,

    Boolean concluirAnalise

) {}


