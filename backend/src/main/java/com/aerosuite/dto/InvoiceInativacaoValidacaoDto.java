package com.aerosuite.dto;

import java.util.ArrayList;
import java.util.List;

public class InvoiceInativacaoValidacaoDto {
    public boolean podeInativar;
    public boolean podeCancelar;
    public boolean jaInativa;
    public boolean jaCancelada;
    public String statusAtual;
    public long qtdItensEstoque;
    public long qtdLotes;
    public List<String> bloqueios = new ArrayList<>();
    public String orientacao;
    public String orientacaoCancelamento;
}
