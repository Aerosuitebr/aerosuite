package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;

import java.time.LocalDateTime;

/**
 * Configuração da empresa operadora por tenant (uma linha por instância).
 */
@Entity
@Table(
        name = "sistema_empresa_config",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_sistema_empresa_config_tenant",
                columnNames = {"tenant_id"}))
public class SistemaEmpresaConfig extends PanacheEntityBase {

    /** Legado: primeira linha do tenant default. */
    public static final long SINGLETON_ID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    public Long id;
    @TenantId    @Column(name = "tenant_id", nullable = false)
    public String tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;

    @Column(name = "display_name", nullable = false)
    public String displayName = "";

    @Column(name = "tagline")
    public String tagline;

    @Column(name = "email_subject_suffix")
    public String emailSubjectSuffix;

    @Column(name = "support_email", nullable = false)
    public String supportEmail = "";

    @Column(name = "copyright_entity")
    public String copyrightEntity;

    @Column(name = "browser_title_suffix")
    public String browserTitleSuffix;

    @Column(name = "logo_url")
    public String logoUrl;

    @Column(name = "wordmark_url")
    public String wordmarkUrl;

    @Column(name = "primary_color")
    public String primaryColor;

    @Column(name = "razao_social")
    public String razaoSocial;

    @Column(name = "cnpj")
    public String cnpj;

    @Column(name = "inscricao_estadual")
    public String inscricaoEstadual;

    @Column(name = "inscricao_municipal")
    public String inscricaoMunicipal;

    @Column(name = "email_nfe")
    public String emailNfe;

    @Column(name = "endereco_logradouro")
    public String enderecoLogradouro;

    @Column(name = "endereco_numero")
    public String enderecoNumero;

    @Column(name = "endereco_complemento")
    public String enderecoComplemento;

    @Column(name = "endereco_bairro")
    public String enderecoBairro;

    @Column(name = "cidade")
    public String cidade;

    @Column(name = "uf")
    public String uf;

    @Column(name = "cep")
    public String cep;

    @Column(name = "telefone")
    public String telefone;

    @Column(name = "site_url")
    public String siteUrl;

    @Column(name = "lgpd_termos_text", columnDefinition = "MEDIUMTEXT")
    public String lgpdTermosText;

    @Column(name = "lgpd_privacidade_text", columnDefinition = "MEDIUMTEXT")
    public String lgpdPrivacidadeText;

    @Column(name = "lgpd_textos_customizados", nullable = false)
    public Boolean lgpdTextosCustomizados = false;

    @Column(name = "onboarding_completo", nullable = false)
    public Boolean onboardingCompleto = false;

    /** Prazo orientativo de retenção de registros de manutenção (anos). */
    @Column(name = "retencao_registros_anos", nullable = false)
    public Integer retencaoRegistrosAnos = 5;

    @Column(name = "conformidade_bloquear_calibracao_vencida", nullable = false)
    public Boolean conformidadeBloquearCalibracaoVencida = false;

    @Column(name = "conformidade_bloquear_treino_obrigatorio", nullable = false)
    public Boolean conformidadeBloquearTreinoObrigatorio = false;

    @Column(name = "conformidade_bloquear_subcontratacao_vencida", nullable = false)
    public Boolean conformidadeBloquearSubcontratacaoVencida = false;

    @Column(name = "updated_at")
    public LocalDateTime updatedAt;

    @Column(name = "updated_by_usuario_id")
    public Integer updatedByUsuarioId;

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = LocalDateTime.now();
    }

    public static SistemaEmpresaConfig findForTenant(long tenantId) {
        return findAll().firstResult();
    }

    /** @deprecated usar {@link #findForTenant(long)} */
    @Deprecated
    public static SistemaEmpresaConfig findSingleton() {
        return findForTenant(TenantConstants.DEFAULT_TENANT_ID);
    }
}
