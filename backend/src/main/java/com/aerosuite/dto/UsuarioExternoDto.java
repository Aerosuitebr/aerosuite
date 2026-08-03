package com.aerosuite.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO para usuário externo.
 */
public record UsuarioExternoDto(
    Integer id,
    String nome,
    String email,
    String senha,
    String empresa,
    String telefone,
    String cargo,
    String observacoes,
    String fotoPerfil,
    Boolean ativo,
    Boolean precisaTrocarSenha,
    LocalDate dataCadastro,
    LocalDateTime ultimoAcesso,
    Integer criadoPor,
    String criadoPorNome,
    List<FuncionalidadeExternaDto> funcionalidades,
    List<OSExternaResumoDto> ordensServico,
    Integer totalOS,
    Integer totalDocumentos,
    LocalDateTime conviteEnviadoEm
) {
    // Construtor simplificado para criação
    public UsuarioExternoDto(String nome, String email, String empresa, String telefone, String cargo) {
        this(null, nome, email, null, empresa, telefone, cargo, null, null, true, true,
             null, null, null, null, null, null, null, null, null);
    }

    // Construtor para listagem (sem detalhes)
    public UsuarioExternoDto(
            Integer id,
            String nome,
            String email,
            String empresa,
            Boolean ativo,
            LocalDateTime ultimoAcesso,
            LocalDateTime conviteEnviadoEm,
            Integer totalOS,
            Integer totalDocumentos) {
        this(id, nome, email, null, empresa, null, null, null, null, ativo, null,
             null, ultimoAcesso, null, null, null, null, totalOS, totalDocumentos, conviteEnviadoEm);
    }
}
