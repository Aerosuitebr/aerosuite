package com.aerosuite.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import com.aerosuite.util.BrandColorsUtil;
import java.util.Locale;
import java.util.Optional;

/**
 * Nome comercial e textos de white-label: sobrescreve com {@link SistemaEmpresaConfig} quando o onboarding
 * estiver concluído; caso contrário usa {@code aero.suite.commercial.*} / variáveis de ambiente.
 */
@ApplicationScoped
public class CommercialBrandingService {

    @Inject
    SistemaEmpresaConfigService sistemaEmpresaConfigService;

    @ConfigProperty(name = "aero.suite.commercial.display-name", defaultValue = "Aero Suite")
    String displayNameRaw;

    @ConfigProperty(name = "aero.suite.commercial.tagline", defaultValue = "Plataforma de gestão para oficinas MRO")
    String taglineRaw;

    @ConfigProperty(name = "aero.suite.commercial.email-subject-suffix", defaultValue = "Aero Suite")
    String emailSubjectSuffixRaw;

    @ConfigProperty(name = "aero.suite.commercial.support-email", defaultValue = "contato@seudominio.com")
    String supportEmailRaw;

    @ConfigProperty(name = "aero.suite.commercial.primary-color", defaultValue = "#0ea5e9")
    String primaryColorRaw;

    public String displayNameTrimmed() {
        return sistemaEmpresaConfigService.activeCommercialSnapshot()
                .map(SistemaEmpresaConfigService.ActiveCommercialSnapshot::displayName)
                .map(String::trim)
                .orElseGet(() -> displayNameRaw != null ? displayNameRaw.trim() : "");
    }

    /** Nome em forma “normal” (ex.: Aero Suite). */
    public String nameNormal() {
        String d = displayNameTrimmed();
        return d.isEmpty() ? "Aero Suite" : d;
    }

    /** Nome em maiúsculas (ex.: AERO SUITE), para trechos que eram AEROSUITE em capitals. */
    public String nameUpper() {
        return nameNormal().toUpperCase(Locale.ROOT);
    }

    public String taglineTrimmed() {
        Optional<SistemaEmpresaConfigService.ActiveCommercialSnapshot> snap =
                sistemaEmpresaConfigService.activeCommercialSnapshot();
        if (snap.isPresent()) {
            String t = snap.get().tagline() != null ? snap.get().tagline().trim() : "";
            if (!t.isEmpty()) {
                return t;
            }
        }
        return taglineRaw != null ? taglineRaw.trim() : "";
    }

    /** Sufixo de assunto de e-mail (ex.: mesmo nome ou abreviação da marca). */
    public String emailSubjectSuffix() {
        Optional<SistemaEmpresaConfigService.ActiveCommercialSnapshot> snap =
                sistemaEmpresaConfigService.activeCommercialSnapshot();
        if (snap.isPresent()) {
            String s = snap.get().emailSubjectSuffix() != null ? snap.get().emailSubjectSuffix().trim() : "";
            if (!s.isEmpty()) {
                return s;
            }
            return snap.get().displayName().trim();
        }
        String s = emailSubjectSuffixRaw != null ? emailSubjectSuffixRaw.trim() : "";
        return s.isEmpty() ? nameNormal() : s;
    }

    public String supportEmail() {
        return sistemaEmpresaConfigService.activeCommercialSnapshot()
                .map(SistemaEmpresaConfigService.ActiveCommercialSnapshot::supportEmail)
                .map(String::trim)
                .filter(se -> !se.isEmpty())
                .orElseGet(() -> {
                    String s = supportEmailRaw != null ? supportEmailRaw.trim() : "";
                    return s.isEmpty() ? "contato@seudominio.com" : s;
                });
    }

    /** Uma linha “marca — tagline” para rodapés e banners. */
    public String bannerLine() {
        String d = displayNameTrimmed();
        String t = taglineTrimmed();
        if (d.isEmpty()) {
            return t.isEmpty() ? nameNormal() : t;
        }
        return t.isEmpty() ? d : d + " — " + t;
    }

    /** Identificador compacto para User-Agent (apenas letras e números). */
    public String productTokenForHttp() {
        return nameNormal().replaceAll("[^A-Za-z0-9]", "");
    }

    /** Cor primária da marca (tenant ou variável de ambiente). */
    public String primaryColor() {
        return sistemaEmpresaConfigService
                .primaryColorForCurrentTenant()
                .map(BrandColorsUtil::normalizeHex)
                .orElseGet(() -> BrandColorsUtil.normalizeHex(primaryColorRaw));
    }

    /** Tom mais escuro para gradientes e bordas. */
    public String primaryColorDeep() {
        return BrandColorsUtil.darken(primaryColor(), 0.22);
    }

    /** Substitui cores padrão Aero Suite em HTML de proposta/e-mail. */
    public String applyBrandPalette(String html) {
        return BrandColorsUtil.applyBrandPalette(html, primaryColor(), primaryColorDeep());
    }
}
