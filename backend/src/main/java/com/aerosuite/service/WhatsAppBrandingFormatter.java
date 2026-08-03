package com.aerosuite.service;

import com.aerosuite.security.TenantDataAccess;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.io.InputStream;
import java.util.Base64;
import java.util.Optional;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

/**
 * Formata mensagens WhatsApp no padrão de template Business: logo no cabeçalho (imagem)
 * e corpo/rodapé na legenda — não bloco de texto separado com nome da marca.
 * Propostas comerciais montam texto próprio em {@link PropostaComercialService}.
 */
@ApplicationScoped
public class WhatsAppBrandingFormatter {

    private static final Logger LOG = Logger.getLogger(WhatsAppBrandingFormatter.class);

    /** Logo padrão do produto (mesmo arquivo do frontend {@code assets/Aero_Claro.png}). */
    public static final String DEFAULT_WHATSAPP_LOGO_FILE = "Aero_Claro.png";

    @Inject
    CommercialBrandingService branding;

    @Inject
    EmpresaAssetService empresaAssetService;

    @Inject
    TenantDataAccess tenantDataAccess;

    @ConfigProperty(name = "frontend.url", defaultValue = "https://app.aerosuite.com.br")
    String frontendUrl;

    public record WhatsAppLogoAsset(String base64, String mimeType, String fileName) {}

    /**
     * Logo para cabeçalho: upload do tenant, senão {@link #DEFAULT_WHATSAPP_LOGO_RESOURCE}.
     */
    public Optional<WhatsAppLogoAsset> resolveLogoAsset() {
        try {
            long tenantId = tenantDataAccess.currentTenantId();
            try (InputStream in = empresaAssetService.openLogoForTenant(tenantId)) {
                if (in == null) {
                    return Optional.empty();
                }
                byte[] bytes = in.readAllBytes();
                if (bytes.length == 0) {
                    return Optional.empty();
                }
                String mime = empresaAssetService.guessLogoMediaTypeForTenant(tenantId);
                if (mime == null || mime.contains("svg") || mime.startsWith("application/")) {
                    return Optional.empty();
                }
                boolean custom = empresaAssetService.hasCustomLogoForTenant(tenantId);
                String fileName = custom
                        ? (mime.contains("jpeg") || mime.contains("jpg") ? "logo.jpg" : "logo.png")
                        : DEFAULT_WHATSAPP_LOGO_FILE;
                return Optional.of(new WhatsAppLogoAsset(
                        Base64.getEncoder().encodeToString(bytes), mime, fileName));
            }
        } catch (Exception e) {
            LOG.debugf(e, "Logo WhatsApp indisponível para tenant");
            return Optional.empty();
        }
    }

    /** Corpo + rodapé (sem cabeçalho textual duplicado — a logo cobre o cabeçalho visual). */
    public String formatMessageBody(String body) {
        if (body == null || body.isBlank()) {
            return body;
        }
        if (isAlreadyBranded(body)) {
            return body.trim();
        }
        String name = branding.nameNormal();
        String site = normalizeSiteUrl(frontendUrl);
        StringBuilder sb = new StringBuilder();
        sb.append(body.trim()).append("\n\n");
        sb.append("────────────────\n");
        sb.append("Atenciosamente,\n");
        sb.append("Equipe *").append(name).append("*\n");
        sb.append("🌐 ").append(site);
        String support = branding.supportEmail();
        if (support != null && !support.isBlank() && !support.contains("seudominio")) {
            sb.append("\n📧 ").append(support);
        }
        return sb.toString();
    }

    /** @deprecated Prefer {@link #formatMessageBody(String)} — mantido para compatibilidade interna. */
    @Deprecated(forRemoval = false)
    public String formatOutboundText(String body) {
        return formatMessageBody(body);
    }

    /** Legenda quando o corpo já foi enviado com a logo no cabeçalho (ex.: PDF em seguida). */
    public String formatDocumentAttachmentCaption(String body) {
        return "";
    }

    /** Legenda de mídia principal (PDF/imagem de peça): corpo formatado, sem cabeçalho textual. */
    public String formatMediaCaption(String caption) {
        return formatMessageBody(caption);
    }

    /** Texto puro quando não há logo disponível (fallback). */
    public String formatFallbackPlainText(String body) {
        if (body == null || body.isBlank() || isAlreadyBranded(body)) {
            return formatMessageBody(body);
        }
        String name = branding.nameNormal();
        String tagline = branding.taglineTrimmed();
        StringBuilder sb = new StringBuilder();
        sb.append('*').append(name).append('*').append('\n');
        if (tagline != null && !tagline.isBlank()) {
            sb.append('_').append(tagline).append('_').append("\n\n");
        } else {
            sb.append('\n');
        }
        sb.append(formatMessageBody(body));
        return sb.toString();
    }

    public boolean isAlreadyBranded(String text) {
        if (text == null || text.isBlank()) {
            return false;
        }
        String banner = branding.bannerLine();
        if (banner != null && !banner.isBlank() && text.contains(banner)) {
            return true;
        }
        if (text.contains("📄 *") && (text.contains("Proposta:") || text.contains("Proposal:"))) {
            return true;
        }
        if (text.contains("────────────────") && text.contains("Atenciosamente,")) {
            return true;
        }
        String name = branding.nameNormal();
        return text.startsWith("*" + name + "*");
    }

    private static String normalizeSiteUrl(String url) {
        if (url == null || url.isBlank()) {
            return "https://app.aerosuite.com.br";
        }
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url.trim();
    }
}
