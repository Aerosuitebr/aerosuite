package com.aerosuite.dto;

/**
 * Diagnóstico de visibilidade da proposta no portal externo e acesso do cliente.
 */
public class PropostaPortalAcessoDto {
    public boolean propostaSalva;
    public boolean temEmailCliente;
    public Integer clientePropostaId;
    public String statusAtual;
    public boolean visivelNoPortal;
    public boolean usuarioExternoExiste;
    public boolean usuarioExternoAtivo;
    public Integer usuarioExternoId;
    public String usuarioExternoEmail;
    public String usuarioExternoNome;
    public boolean temAcessoPropostas;
    public boolean podeDisponibilizar;
    public String mensagemBloqueio;
}
