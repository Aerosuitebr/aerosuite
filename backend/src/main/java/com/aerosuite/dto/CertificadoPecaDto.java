package com.aerosuite.dto;

import java.time.LocalDate;

/** Certificado de conformidade estruturado (material aeronáutico). */
public class CertificadoPecaDto {
    public String certTipo;
    public String certNumero;
    public String certEmissor;
    public LocalDate certDataEmissao;
    public LocalDate dataValidade;
    public String certOrgaoAprovacao;
    public String certificadoConformidade;
    public String certAnexoNome;
    public boolean temAnexo;
    public boolean completo;
}
