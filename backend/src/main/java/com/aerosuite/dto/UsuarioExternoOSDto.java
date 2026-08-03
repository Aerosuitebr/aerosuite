package com.aerosuite.dto;

import java.time.LocalDateTime;

/**
 * DTO para associação de usuário externo com OS.
 */
public record UsuarioExternoOSDto(
    Integer id,
    Integer usuarioExternoId,
    String usuarioExternoNome,
    Long osId,
    Integer osNumero,
    String osCliente,
    Boolean podeVisualizar,
    Integer concedidoPor,
    String concedidoPorNome,
    LocalDateTime dataConcessao,
    String observacoes
) {}
