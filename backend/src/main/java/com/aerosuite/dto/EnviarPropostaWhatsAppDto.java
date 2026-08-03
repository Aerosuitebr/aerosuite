package com.aerosuite.dto;

/**
 * DTO para envio de proposta comercial via WhatsApp
 */
public class EnviarPropostaWhatsAppDto {

    public Long propostaId;
    public String telefoneDestino;
    public String mensagemAdicional;
    public EnviarPropostaEmailDto.SignatureDto signature;

    // Construtor padrão
    public EnviarPropostaWhatsAppDto() {}
}
