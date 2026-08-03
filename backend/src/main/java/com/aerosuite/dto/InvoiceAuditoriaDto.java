package com.aerosuite.dto;

import java.time.LocalDateTime;

public class InvoiceAuditoriaDto {
    public Long id;
    public Long invoiceId;
    public String numeroInvoice;
    public String acao;
    public String motivo;
    public String statusAnterior;
    public String statusNovo;
    public Boolean isActiveAnterior;
    public Boolean isActiveNovo;
    public Integer qtdItensEstoque;
    public Integer qtdLotes;
    public String detalheBloqueio;
    public Long usuarioId;
    public String usuarioNome;
    public String usuarioEmail;
    public String ipOrigem;
    public LocalDateTime dataHora;
}
