package com.aerosuite.dto;

/**
 * Publicação da proposta no portal com concessão opcional de acesso externo.
 */
public class PropostaDisponibilizarPortalRequest {
    /** Quando não há usuário externo, criar conta para o cliente. */
    public Boolean criarAcessoExterno;
    /** Nome do contato (usa clienteContato ou clienteNome se vazio). */
    public String nomeContato;
    /** Enviar e-mail ao cliente (proposta no portal e, se novo usuário, primeiro acesso). Padrão: true. */
    public Boolean notificarCliente;
}
