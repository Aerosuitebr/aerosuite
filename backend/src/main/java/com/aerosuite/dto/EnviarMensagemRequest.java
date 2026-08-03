package com.aerosuite.dto;

public record EnviarMensagemRequest(
    String conteudo,
    String tipo // TEXTO, ARQUIVO, SISTEMA
) {
    public EnviarMensagemRequest(String conteudo) {
        this(conteudo, "TEXTO");
    }
}
