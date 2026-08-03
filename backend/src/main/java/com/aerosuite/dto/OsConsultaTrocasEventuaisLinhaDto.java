package com.aerosuite.dto;

import java.time.LocalDate;

/**
 * Linha da consulta de OS com Solicitação de Troca Eventual (itens e/ou comentário).
 */
public class OsConsultaTrocasEventuaisLinhaDto {
    public Long id;
    public Integer idOs;
    public String clienteNome;
    public LocalDate dtAbertura;
    /** Quantidade de linhas em os_solicitacao_troca_item */
    public int quantidadeItens;
    public int itensPagoPendente;
    public int itensPagoSim;
    public int itensPagoNao;
    public boolean temComentario;
}
