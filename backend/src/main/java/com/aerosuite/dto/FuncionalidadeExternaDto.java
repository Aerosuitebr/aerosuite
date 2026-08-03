package com.aerosuite.dto;

/**
 * DTO para funcionalidade externa.
 */
public record FuncionalidadeExternaDto(
    Integer id,
    String nome,
    String descricao,
    String codigo,
    String icone,
    String rota,
    Integer ordem,
    Boolean ativo
) {}
