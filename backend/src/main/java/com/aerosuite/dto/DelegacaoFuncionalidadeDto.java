package com.aerosuite.dto;

import java.time.LocalDateTime;

/** Linha de delegação (funcionalidade extra para um utilizador interno). */
public class DelegacaoFuncionalidadeDto {
    public Long id;
    public Integer usuarioGranteeId;
    public String funcionalidadeCodigo;
    public Integer concedidoPorUsuarioId;
    public LocalDateTime dataInicio;
    public LocalDateTime dataFim;
    public Boolean ativo;
    public String observacao;
}
