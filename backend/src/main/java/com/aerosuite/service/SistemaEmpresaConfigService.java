package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;

import com.aerosuite.domain.SistemaEmpresaConfig;
import com.aerosuite.domain.Tenant;
import com.aerosuite.domain.TenantConstants;
import com.aerosuite.dto.sistema.SistemaEmpresaConfigDto;
import com.aerosuite.security.TenantDataAccess;
import com.aerosuite.dto.sistema.SistemaEmpresaConfigWriteDto;
import com.aerosuite.dto.sistema.SistemaEmpresaPublicBrandingDto;
import com.aerosuite.dto.sistema.SistemaEmpresaStatusDto;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

import com.aerosuite.util.EmitenteFiscalHtmlFormatter;
import com.aerosuite.util.BrandColorsUtil;

/**
 * Configuração singleton da empresa operadora (marca, contato, endereço fiscal).
 */
@ApplicationScoped
public class SistemaEmpresaConfigService {

    @Inject
    TenantDataAccess tenantDataAccess;

    private long currentTenantId() {
        return tenantDataAccess.currentTenantId();
    }

    private SistemaEmpresaConfig configForCurrentTenant() {
        return SistemaEmpresaConfig.findForTenant(currentTenantId());
    }

    public record ActiveCommercialSnapshot(
            String displayName,
            String tagline,
            String emailSubjectSuffix,
            String supportEmail
    ) {}

    public Optional<ActiveCommercialSnapshot> activeCommercialSnapshot() {
        SistemaEmpresaConfig c = configForCurrentTenant();
        if (c == null || !Boolean.TRUE.equals(c.onboardingCompleto)) {
            return Optional.empty();
        }
        String dn = trimOrEmpty(c.displayName);
        if (dn.isEmpty()) {
            return Optional.empty();
        }
        String tg = trimOrEmpty(c.tagline);
        String ess = trimOrEmpty(c.emailSubjectSuffix);
        if (ess.isEmpty()) {
            ess = dn;
        }
        String se = trimOrEmpty(c.supportEmail);
        if (se.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(new ActiveCommercialSnapshot(dn, tg, ess, se));
    }

    public Optional<String> primaryColorForCurrentTenant() {
        SistemaEmpresaConfig c = configForCurrentTenant();
        if (c == null) {
            return Optional.empty();
        }
        String color = trimOrEmpty(c.primaryColor);
        return color.isEmpty() ? Optional.empty() : Optional.of(color);
    }

    /**
     * Sem parâmetro {@code tenant} na API pública: nunca inferir tenant de sessão/JWT (S4-34).
     */
    public SistemaEmpresaPublicBrandingDto publicBranding() {
        SistemaEmpresaPublicBrandingDto out = new SistemaEmpresaPublicBrandingDto();
        out.configured = false;
        return out;
    }

    /**
     * Marca pública para ecrã de login (sem JWT), resolvida pelo código do tenant.
     */
    public SistemaEmpresaPublicBrandingDto publicBrandingForTenantCodigo(String tenantCodigo) {
        if (tenantCodigo == null || tenantCodigo.isBlank()) {
            return publicBrandingForTenantId(TenantConstants.DEFAULT_TENANT_ID);
        }
        Tenant tenant = Tenant.find("codigo = ?1 and ativo = true", tenantCodigo.trim()).firstResult();
        if (tenant == null || tenant.id == null) {
            SistemaEmpresaPublicBrandingDto out = new SistemaEmpresaPublicBrandingDto();
            out.configured = false;
            return out;
        }
        return publicBrandingForTenantId(tenant.id);
    }

    private SistemaEmpresaPublicBrandingDto publicBrandingForTenantId(long tenantId) {
        SistemaEmpresaPublicBrandingDto out = new SistemaEmpresaPublicBrandingDto();
        SistemaEmpresaConfig c = SistemaEmpresaConfig.findForTenant(tenantId);
        if (c == null || !Boolean.TRUE.equals(c.onboardingCompleto)) {
            out.configured = false;
            return out;
        }
        out.configured = true;
        out.commercialName = trimOrEmpty(c.displayName);
        out.commercialTagline = trimOrEmpty(c.tagline);
        out.logoUrl = trimOrEmpty(c.logoUrl);
        out.wordmarkUrl = trimOrEmpty(c.wordmarkUrl);
        out.wordmarkLightUrl = resolvePublicWordmarkLightUrl(c);
        out.primaryColor = trimOrEmpty(c.primaryColor);
        out.browserTitleSuffix = trimOrEmpty(c.browserTitleSuffix);
        String copy = trimOrEmpty(c.copyrightEntity);
        out.copyrightEntity = copy.isEmpty() ? out.commercialName : copy;
        out.supportEmail = trimOrEmpty(c.supportEmail);
        out.telefone = trimOrEmpty(c.telefone);
        return out;
    }

    public SistemaEmpresaStatusDto status(boolean canManageConfig) {
        SistemaEmpresaConfig c = configForCurrentTenant();
        SistemaEmpresaStatusDto s = new SistemaEmpresaStatusDto();
        s.canEdit = canManageConfig;
        s.needsCompletion = c == null || !Boolean.TRUE.equals(c.onboardingCompleto)
                || !validationErrorsForComplete(c, false).isEmpty();
        return s;
    }

    public SistemaEmpresaConfigDto getFullConfig() {
        SistemaEmpresaConfig c = configForCurrentTenant();
        SistemaEmpresaConfigDto d = new SistemaEmpresaConfigDto();
        if (c == null) {
            d.onboardingCompleto = false;
            return d;
        }
        d.displayName = c.displayName;
        d.tagline = c.tagline;
        d.emailSubjectSuffix = c.emailSubjectSuffix;
        d.supportEmail = c.supportEmail;
        d.copyrightEntity = c.copyrightEntity;
        d.browserTitleSuffix = c.browserTitleSuffix;
        d.logoUrl = c.logoUrl;
        d.wordmarkUrl = c.wordmarkUrl;
        d.primaryColor = c.primaryColor;
        d.razaoSocial = c.razaoSocial;
        d.cnpj = c.cnpj;
        d.inscricaoEstadual = c.inscricaoEstadual;
        d.inscricaoMunicipal = c.inscricaoMunicipal;
        d.emailNfe = c.emailNfe;
        d.enderecoLogradouro = c.enderecoLogradouro;
        d.enderecoNumero = c.enderecoNumero;
        d.enderecoComplemento = c.enderecoComplemento;
        d.enderecoBairro = c.enderecoBairro;
        d.cidade = c.cidade;
        d.uf = c.uf;
        d.cep = c.cep;
        d.telefone = c.telefone;
        d.siteUrl = c.siteUrl;
        d.lgpdTermosText = c.lgpdTermosText;
        d.lgpdPrivacidadeText = c.lgpdPrivacidadeText;
        d.lgpdTextosCustomizados = Boolean.TRUE.equals(c.lgpdTextosCustomizados);
        d.onboardingCompleto = Boolean.TRUE.equals(c.onboardingCompleto);
        return d;
    }

    /**
     * Dados fiscais em HTML para o cabeçalho do e-mail da proposta (fundo escuro).
     */
    public String htmlEmitenteFiscalForEmailHeader() {
        return emitenteFiscalHtmlBlock(
                "margin-top:6px;",
                "font-size:10px;line-height:1.35;color:rgba(255,255,255,0.92);");
    }

    /**
     * Dados fiscais em HTML para o cabeçalho do PDF da proposta.
     */
    public String htmlEmitenteFiscalForPdfHeader() {
        return emitenteFiscalHtmlBlock(
                "margin-top:4px;",
                "font-size:10px;line-height:1.35;color:#475569;");
    }

    /**
     * Dados fiscais em HTML para o rodapé de contacto do PDF.
     */
    public String htmlEmitenteFiscalForDocumentFooter() {
        return emitenteFiscalHtmlBlock(
                "text-align:right;",
                "font-size:10px;line-height:1.4;color:#64748b;");
    }

    /** Telefone comercial gravado na config (onboarding concluído). */
    public Optional<String> configuredEmpresaTelefone() {
        SistemaEmpresaConfig c = configForCurrentTenant();
        if (c == null || !Boolean.TRUE.equals(c.onboardingCompleto)) {
            return Optional.empty();
        }
        String t = trimOrEmpty(c.telefone);
        return t.isEmpty() ? Optional.empty() : Optional.of(t);
    }

    /** Bloco de texto simples (e-mail em formato text/plain). */
    public String plainTextEmitenteFiscal() {
        SistemaEmpresaConfig c = configForCurrentTenant();
        if (c == null || !Boolean.TRUE.equals(c.onboardingCompleto)) {
            return "";
        }
        String rz = trimOrEmpty(c.razaoSocial);
        if (rz.isEmpty()) {
            return "";
        }
        StringBuilder b = new StringBuilder();
        b.append(rz).append('\n');
        String cnpj = trimOrEmpty(c.cnpj);
        if (!cnpj.isEmpty()) {
            b.append("CNPJ: ").append(cnpj).append('\n');
        }
        String ie = trimOrEmpty(c.inscricaoEstadual);
        if (!ie.isEmpty()) {
            b.append("Inscr. estadual: ").append(ie).append('\n');
        }
        String im = trimOrEmpty(c.inscricaoMunicipal);
        if (!im.isEmpty()) {
            b.append("Inscr. municipal: ").append(im).append('\n');
        }
        String nfe = trimOrEmpty(c.emailNfe);
        if (!nfe.isEmpty()) {
            b.append("E-mail NF-e: ").append(nfe).append('\n');
        }
        String end = EmitenteFiscalHtmlFormatter.formatEnderecoSingleLine(
                trimOrEmpty(c.enderecoLogradouro),
                trimOrEmpty(c.enderecoNumero),
                trimOrEmpty(c.enderecoComplemento),
                trimOrEmpty(c.enderecoBairro),
                trimOrEmpty(c.cidade),
                trimOrEmpty(c.uf),
                trimOrEmpty(c.cep));
        if (!end.isEmpty()) {
            b.append(end).append('\n');
        }
        String tel = trimOrEmpty(c.telefone);
        if (!tel.isEmpty()) {
            b.append("Tel.: ").append(tel).append('\n');
        }
        String mail = trimOrEmpty(c.supportEmail);
        if (!mail.isEmpty()) {
            b.append(mail).append('\n');
        }
        String site = trimOrEmpty(c.siteUrl);
        if (!site.isEmpty()) {
            b.append(site).append('\n');
        }
        return b.toString();
    }

    private String emitenteFiscalHtmlBlock(String wrapperStyle, String lineStyle) {
        SistemaEmpresaConfig c = configForCurrentTenant();
        if (c == null) {
            return "";
        }
        return EmitenteFiscalHtmlFormatter.buildHtml(
                Boolean.TRUE.equals(c.onboardingCompleto),
                c.razaoSocial,
                c.cnpj,
                c.inscricaoEstadual,
                c.inscricaoMunicipal,
                c.emailNfe,
                c.enderecoLogradouro,
                c.enderecoNumero,
                c.enderecoComplemento,
                c.enderecoBairro,
                c.cidade,
                c.uf,
                c.cep,
                c.telefone,
                c.siteUrl,
                c.supportEmail,
                wrapperStyle,
                lineStyle);
    }

    @Transactional
    public SistemaEmpresaConfigDto upsert(SistemaEmpresaConfigWriteDto dto, Integer usuarioId) {
        if (dto == null) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.COMMON_BODY_REQUIRED));
        }
        SistemaEmpresaConfig c = configForCurrentTenant();
        boolean isNew = c == null;
        if (isNew) {
            c = new SistemaEmpresaConfig();
            c.tenantId = TenantConstants.tenantIdOf(currentTenantId());
        }
        applyWrite(c, dto);
        c.updatedByUsuarioId = usuarioId;
        if (dto.concluirOnboarding) {
            List<String> errs = validationErrorsForComplete(c, true);
            if (!errs.isEmpty()) {
                throw new BadRequestException(String.join("; ", errs));
            }
            c.onboardingCompleto = true;
        } else if (isNew) {
            c.onboardingCompleto = false;
        }
        if (isNew) {
            c.persist();
        }
        return getFullConfig();
    }

    @Transactional
    public void updateStoredLogoUrl(String url) {
        SistemaEmpresaConfig c = configForCurrentTenant();
        if (c != null && url != null && !url.isBlank()) {
            c.logoUrl = url.trim();
        }
    }

    @Transactional
    public void updateStoredWordmarkUrl(String url) {
        SistemaEmpresaConfig c = configForCurrentTenant();
        if (c != null && url != null && !url.isBlank()) {
            c.wordmarkUrl = url.trim();
        }
    }

    private static void applyWrite(SistemaEmpresaConfig c, SistemaEmpresaConfigWriteDto dto) {
        c.displayName = trimOrEmpty(dto.displayName);
        c.tagline = nullIfBlank(dto.tagline);
        c.emailSubjectSuffix = nullIfBlank(dto.emailSubjectSuffix);
        c.supportEmail = trimOrEmpty(dto.supportEmail);
        c.copyrightEntity = nullIfBlank(dto.copyrightEntity);
        c.browserTitleSuffix = nullIfBlank(dto.browserTitleSuffix);
        c.logoUrl = nullIfBlank(dto.logoUrl);
        c.wordmarkUrl = nullIfBlank(dto.wordmarkUrl);
        String pc = nullIfBlank(dto.primaryColor);
        c.primaryColor = pc == null ? null : BrandColorsUtil.normalizeHex(pc);
        c.razaoSocial = nullIfBlank(dto.razaoSocial);
        c.cnpj = nullIfBlank(dto.cnpj);
        c.inscricaoEstadual = nullIfBlank(dto.inscricaoEstadual);
        c.inscricaoMunicipal = nullIfBlank(dto.inscricaoMunicipal);
        c.emailNfe = nullIfBlank(dto.emailNfe);
        c.enderecoLogradouro = nullIfBlank(dto.enderecoLogradouro);
        c.enderecoNumero = nullIfBlank(dto.enderecoNumero);
        c.enderecoComplemento = trimMax(dto.enderecoComplemento, 60);
        c.enderecoBairro = nullIfBlank(dto.enderecoBairro);
        c.cidade = nullIfBlank(dto.cidade);
        c.uf = nullIfBlank(dto.uf);
        c.cep = nullIfBlank(dto.cep);
        c.telefone = nullIfBlank(dto.telefone);
        c.siteUrl = nullIfBlank(dto.siteUrl);
        if (dto.lgpdTermosText != null) {
            c.lgpdTermosText = dto.lgpdTermosText.isBlank() ? null : dto.lgpdTermosText.trim();
        }
        if (dto.lgpdPrivacidadeText != null) {
            c.lgpdPrivacidadeText = dto.lgpdPrivacidadeText.isBlank() ? null : dto.lgpdPrivacidadeText.trim();
        }
        if (dto.lgpdTextosCustomizados != null) {
            c.lgpdTextosCustomizados = dto.lgpdTextosCustomizados;
        }
    }

    private static List<String> validationErrorsForComplete(SistemaEmpresaConfig c, boolean strictEmail) {
        List<String> e = new ArrayList<>();
        if (trimOrEmpty(c.displayName).isEmpty()) {
            e.add("Nome comercial é obrigatório");
        }
        if (trimOrEmpty(c.tagline).isEmpty()) {
            e.add("Tagline / slogan é obrigatório");
        }
        String mail = trimOrEmpty(c.supportEmail);
        if (mail.isEmpty()) {
            e.add("E-mail de suporte é obrigatório");
        } else if (strictEmail && !mail.contains("@")) {
            e.add("E-mail de suporte inválido");
        }
        if (trimOrEmpty(c.razaoSocial).isEmpty()) {
            e.add("Razão social é obrigatória");
        }
        String digitsCnpj = digitsOnly(c.cnpj);
        if (digitsCnpj.length() != 14) {
            e.add("CNPJ deve conter 14 dígitos");
        }
        if (trimOrEmpty(c.telefone).isEmpty()) {
            e.add("Telefone é obrigatório");
        }
        if (trimOrEmpty(c.enderecoLogradouro).isEmpty()) {
            e.add("Logradouro é obrigatório");
        }
        if (trimOrEmpty(c.cidade).isEmpty()) {
            e.add("Cidade é obrigatória");
        }
        String uf = trimOrEmpty(c.uf);
        if (uf.length() != 2) {
            e.add("UF deve ter 2 letras");
        }
        if (trimOrEmpty(c.cep).isEmpty()) {
            e.add("CEP é obrigatório");
        }
        return e;
    }

    private static String trimOrEmpty(String s) {
        return s == null ? "" : s.trim();
    }

    private static final String DEFAULT_WORDMARK_LIGHT = "assets/LOGO_LETRA_LIGHT.png";

    /** Wordmark claro para sidebar/rodapé — não repetir o PNG escuro da configuração. */
    private static String resolvePublicWordmarkLightUrl(SistemaEmpresaConfig c) {
        String wordmark = trimOrEmpty(c.wordmarkUrl);
        if (wordmark.isEmpty()) {
            return DEFAULT_WORDMARK_LIGHT;
        }
        String lower = wordmark.toLowerCase(Locale.ROOT);
        if (lower.contains("logo_letra_light")) {
            return wordmark;
        }
        if (lower.contains("logo_letra.png")
                || lower.contains("/api/public/empresa-asset/wordmark")
                || lower.contains("aero_suite_logo")
                || lower.contains("logo_aero.png")) {
            return DEFAULT_WORDMARK_LIGHT;
        }
        return wordmark;
    }

    private static String trimMax(String s, int maxLen) {
        String t = trimOrEmpty(s);
        if (t.isEmpty()) {
            return null;
        }
        return t.length() > maxLen ? t.substring(0, maxLen) : t;
    }

    private static String nullIfBlank(String s) {
        String t = trimOrEmpty(s);
        return t.isEmpty() ? null : t;
    }

    private static String digitsOnly(String s) {
        if (s == null) {
            return "";
        }
        StringBuilder b = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);
            if (ch >= '0' && ch <= '9') {
                b.append(ch);
            }
        }
        return b.toString();
    }

    public static boolean isSuperPerfil(String perfilCodigo, String superPerfisCsv) {
        if (perfilCodigo == null || perfilCodigo.isBlank() || superPerfisCsv == null) {
            return false;
        }
        String p = perfilCodigo.trim().toUpperCase(Locale.ROOT);
        for (String part : superPerfisCsv.split(",")) {
            if (part != null && !part.isBlank() && p.equals(part.trim().toUpperCase(Locale.ROOT))) {
                return true;
            }
        }
        return false;
    }
}
