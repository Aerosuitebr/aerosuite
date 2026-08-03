package com.aerosuite.dto;

/**
 * Resultado da publicação no portal externo.
 */
public class PropostaDisponibilizarPortalResultDto {
    public PropostaPortalAcessoDto acesso;
    public PropostaComercialDto proposta;
    public boolean usuarioExternoCriado;
    public boolean funcionalidadePropostasConcedida;
    public boolean vinculoClienteAtualizado;
    public boolean jaEstavaVisivel;
    public Long osGeradaId;
    public boolean emailNotificacaoEnviado;
}
