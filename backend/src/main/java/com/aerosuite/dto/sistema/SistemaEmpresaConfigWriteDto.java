package com.aerosuite.dto.sistema;

/** Escrita (rascunho ou conclusão do assistente). */
public class SistemaEmpresaConfigWriteDto {
    public String displayName;
    public String tagline;
    public String emailSubjectSuffix;
    public String supportEmail;
    public String copyrightEntity;
    public String browserTitleSuffix;
    public String logoUrl;
    public String wordmarkUrl;
    public String primaryColor;
    public String razaoSocial;
    public String cnpj;
    public String inscricaoEstadual;
    public String inscricaoMunicipal;
    public String emailNfe;
    public String enderecoLogradouro;
    public String enderecoNumero;
    public String enderecoComplemento;
    public String enderecoBairro;
    public String cidade;
    public String uf;
    public String cep;
    public String telefone;
    public String siteUrl;
    public String lgpdTermosText;
    public String lgpdPrivacidadeText;
    public Boolean lgpdTextosCustomizados;
    /** Se true, valida campos obrigatórios e grava onboarding como concluído. */
    public boolean concluirOnboarding;
}
