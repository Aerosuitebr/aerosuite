package com.aerosuite.dto;

import java.time.LocalDateTime;
import java.util.List;

public record UsuarioPerfisDto(Integer id, String nome, String email, boolean ativo,
                               long revisao, List<Vinculo> perfis) {
    public record Vinculo(Long perfilId, String nome, String descricao, boolean ativo,
                          boolean perfilAtivo, LocalDateTime vinculadoEm) {}

    public record Alteracao(Long perfilId, Boolean ativo) {}

    public record Atualizacao(Long revisao, List<Alteracao> perfis) {}
}
