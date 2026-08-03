package com.aerosuite.email;

import java.io.InputStream;
import java.util.Base64;

/** Assets HTML para e-mails do plano de controle. */
public final class PlatformOpsAccessEmailBuilder {

    /** Content-ID referenciado no HTML como {@code cid:aerosuite-logo@aerosuite.com}. */
    public static final String LOGO_CONTENT_ID = "aerosuite-logo@aerosuite.com";

    private static volatile byte[] cachedLogoBytes;
    private static volatile String cachedLogoMime = "image/png";

    private PlatformOpsAccessEmailBuilder() {}

    public static String logoImgSrc() {
        return "cid:" + LOGO_CONTENT_ID;
    }

    public static String logoContentIdHeader() {
        return "<" + LOGO_CONTENT_ID + ">";
    }

    public static String logoMimeType() {
        loadLogoBytes();
        return cachedLogoMime;
    }

    public static byte[] loadLogoBytes() {
        if (cachedLogoBytes != null) {
            return cachedLogoBytes;
        }
        synchronized (PlatformOpsAccessEmailBuilder.class) {
            if (cachedLogoBytes != null) {
                return cachedLogoBytes;
            }
            String[] resources = {
                "META-INF/resources/logo-email.png",
                "META-INF/resources/logo_redondo.png",
                "META-INF/resources/logo_redondo.jpg",
                "META-INF/resources/logo.png"
            };
            for (String path : resources) {
                try (InputStream is = Thread.currentThread().getContextClassLoader().getResourceAsStream(path)) {
                    if (is != null) {
                        cachedLogoBytes = is.readAllBytes();
                        cachedLogoMime = mimeForResource(path, cachedLogoBytes);
                        return cachedLogoBytes;
                    }
                } catch (Exception ignored) {
                    // try next
                }
            }
            String svg =
                    "<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'>"
                            + "<rect width='128' height='128' rx='18' fill='#0284c7'/>"
                            + "<text x='64' y='84' font-family='Arial,sans-serif' font-size='56' fill='#fff' "
                            + "text-anchor='middle' font-weight='bold'>A</text></svg>";
            cachedLogoBytes = svg.getBytes(java.nio.charset.StandardCharsets.UTF_8);
            cachedLogoMime = "image/svg+xml";
            return cachedLogoBytes;
        }
    }

    /** @deprecated Prefer {@link #logoImgSrc()} with inline CID attachment in {@link com.aerosuite.service.EmailService}. */
    @Deprecated
    public static String logoDataUri() {
        byte[] bytes = loadLogoBytes();
        return "data:" + cachedLogoMime + ";base64," + Base64.getEncoder().encodeToString(bytes);
    }

    private static String mimeForResource(String path, byte[] bytes) {
        if (path.endsWith(".jpg") || path.endsWith(".jpeg")) {
            return "image/jpeg";
        }
        if (path.endsWith(".svg")) {
            return "image/svg+xml";
        }
        if (bytes.length >= 2 && (bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xD8) {
            return "image/jpeg";
        }
        return "image/png";
    }

    public static String buildGrantedHtml(
            String locale,
            String nome,
            String email,
            String perfilLabel,
            String accessUrl,
            String grantedAtLabel) {
        String loc = normalize(locale);
        Copy c = copyGranted(loc);
        String logo = logoImgSrc();
        return """
<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="background:#0f172a;padding:28px 12px;">
<tr><td align="center">
<table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;width:100%%;border-collapse:collapse;">

<tr><td style="background:linear-gradient(145deg,#020617 0%%,#0c1929 35%%,#0f172a 70%%,#1e293b 100%%);border-radius:14px 14px 0 0;padding:32px 36px 28px;text-align:center;border:1px solid #334155;border-bottom:none;">
<img src="%s" alt="Aero Suite" width="88" height="88" style="display:block;margin:0 auto 16px;border:0;object-fit:contain;"/>
<div style="font-size:26px;font-weight:800;color:#f8fafc;line-height:1.1;">Aero Suite</div>
<div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#7dd3fc;margin-top:4px;font-weight:600;">%s</div>
<div style="width:120px;height:3px;background:linear-gradient(90deg,transparent,#0284c7,#38bdf8,transparent);margin:16px auto 0;border-radius:2px;"></div>
<div style="font-size:22px;font-weight:700;color:#f8fafc;line-height:1.3;margin-top:16px;margin-bottom:8px;">%s</div>
<div style="font-size:14px;color:#94a3b8;line-height:1.55;max-width:520px;margin:0 auto;">%s</div>
</td></tr>

<tr><td style="background:#1e293b;padding:28px 36px;border-left:1px solid #334155;border-right:1px solid #334155;">
<p style="margin:0 0 14px;font-size:15px;color:#e2e8f0;line-height:1.6;">%s <strong style="color:#f8fafc;">%s</strong>,</p>
<p style="margin:0 0 20px;font-size:14px;color:#cbd5e1;line-height:1.65;">%s</p>

<table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 20px;border-collapse:collapse;">
<tr><td colspan="2" style="background:#0f172a;border:1px solid #334155;border-radius:10px 10px 0 0;padding:10px 16px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#38bdf8;">%s</td></tr>
<tr><td style="width:38%%;padding:12px 16px;border:1px solid #334155;border-top:none;background:#162032;font-size:12px;color:#94a3b8;">%s</td><td style="padding:12px 16px;border:1px solid #334155;border-top:none;border-left:none;background:#162032;font-size:13px;color:#f8fafc;font-weight:600;">%s</td></tr>
<tr><td style="padding:12px 16px;border:1px solid #334155;border-top:none;background:#1e293b;font-size:12px;color:#94a3b8;">%s</td><td style="padding:12px 16px;border:1px solid #334155;border-top:none;border-left:none;background:#1e293b;font-size:13px;color:#f8fafc;">%s</td></tr>
<tr><td style="padding:12px 16px;border:1px solid #334155;border-top:none;background:#162032;font-size:12px;color:#94a3b8;">%s</td><td style="padding:12px 16px;border:1px solid #334155;border-top:none;border-left:none;background:#162032;font-size:13px;color:#f8fafc;">%s</td></tr>
<tr><td style="padding:12px 16px;border:1px solid #334155;border-top:none;background:#1e293b;font-size:12px;color:#94a3b8;border-radius:0 0 0 10px;">%s</td><td style="padding:12px 16px;border:1px solid #334155;border-top:none;border-left:none;background:#1e293b;font-size:13px;color:#f8fafc;border-radius:0 0 10px 0;">%s</td></tr>
</table>

<table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 22px;background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.35);border-radius:10px;">
<tr><td style="padding:14px 18px;font-size:13px;color:#fcd34d;line-height:1.6;"><strong style="color:#fde68a;">%s</strong><br/>%s</td></tr>
</table>

<table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 22px;border-collapse:collapse;">
<tr><td colspan="2" style="background:#0f172a;border:1px solid #334155;border-radius:10px 10px 0 0;padding:10px 16px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#38bdf8;">%s</td></tr>
<tr><td style="width:36px;padding:12px 8px 12px 16px;border:1px solid #334155;border-top:none;background:#162032;font-size:13px;color:#0284c7;font-weight:800;vertical-align:top;">1</td><td style="padding:12px 16px 12px 8px;border:1px solid #334155;border-top:none;border-left:none;background:#162032;font-size:13px;color:#e2e8f0;line-height:1.55;">%s</td></tr>
<tr><td style="padding:12px 8px 12px 16px;border:1px solid #334155;border-top:none;background:#1e293b;font-size:13px;color:#0284c7;font-weight:800;vertical-align:top;">2</td><td style="padding:12px 16px 12px 8px;border:1px solid #334155;border-top:none;border-left:none;background:#1e293b;font-size:13px;color:#e2e8f0;line-height:1.55;">%s</td></tr>
<tr><td style="padding:12px 8px 12px 16px;border:1px solid #334155;border-top:none;background:#162032;font-size:13px;color:#0284c7;font-weight:800;vertical-align:top;border-radius:0 0 0 10px;">3</td><td style="padding:12px 16px 12px 8px;border:1px solid #334155;border-top:none;border-left:none;background:#162032;font-size:13px;color:#e2e8f0;line-height:1.55;border-radius:0 0 10px 0;">%s</td></tr>
</table>

<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 8px;"><tr>
<td style="background:linear-gradient(90deg,#0369a1,#0284c7);border-radius:8px;padding:0;">
<a href="%s" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:.02em;">%s</a>
</td></tr></table>
<p style="margin:12px 0 0;font-size:12px;color:#64748b;text-align:center;line-height:1.5;">%s<br/><a href="%s" style="color:#38bdf8;">%s</a></p>
</td></tr>

<tr><td style="background:#0f172a;border:1px solid #334155;border-top:none;border-radius:0 0 14px 14px;padding:16px 36px;text-align:center;">
<p style="margin:0;font-size:11px;color:#64748b;line-height:1.5;">%s</p>
</td></tr>

</table></td></tr></table></body></html>
"""
                .formatted(
                        logo,
                        c.areaBadge,
                        c.heroTitle,
                        c.heroSubtitle,
                        c.greeting,
                        esc(nome),
                        c.intro,
                        c.detailsTitle,
                        c.lblOperator,
                        esc(nome),
                        c.lblEmail,
                        esc(email),
                        c.lblProfile,
                        esc(perfilLabel),
                        c.lblGranted,
                        esc(grantedAtLabel),
                        c.responsibilityTitle,
                        c.responsibilityBody,
                        c.stepsTitle,
                        c.step1,
                        c.step2,
                        c.step3,
                        esc(accessUrl),
                        c.cta,
                        c.linkHint,
                        esc(accessUrl),
                        esc(accessUrl),
                        c.footer);
    }

    public static String buildRevokedHtml(
            String locale, String nome, String email, String perfilLabel, String revokedAtLabel, String supportEmail) {
        String loc = normalize(locale);
        Copy c = copyRevoked(loc);
        String logo = logoImgSrc();
        return """
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="background:#0f172a;padding:28px 12px;">
<tr><td align="center">
<table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;width:100%%;">

<tr><td style="background:linear-gradient(145deg,#1c0a0a 0%%,#0f172a 50%%,#1e293b 100%%);border-radius:14px 14px 0 0;padding:30px 36px 24px;text-align:center;border:1px solid #334155;border-bottom:none;">
<img src="%s" alt="Aero Suite" width="72" height="72" style="display:block;margin:0 auto 14px;border:0;object-fit:contain;"/>
<div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#fca5a5;font-weight:600;margin-bottom:8px;">%s</div>
<div style="font-size:21px;font-weight:700;color:#f8fafc;line-height:1.3;">%s</div>
<div style="font-size:14px;color:#94a3b8;margin-top:10px;line-height:1.55;">%s</div>
</td></tr>

<tr><td style="background:#1e293b;padding:28px 36px;border-left:1px solid #334155;border-right:1px solid #334155;">
<p style="margin:0 0 14px;font-size:15px;color:#e2e8f0;">%s <strong style="color:#f8fafc;">%s</strong>,</p>
<p style="margin:0 0 20px;font-size:14px;color:#cbd5e1;line-height:1.65;">%s</p>

<table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 20px;border-collapse:collapse;">
<tr><td colspan="2" style="background:#0f172a;border:1px solid #334155;border-radius:10px 10px 0 0;padding:10px 16px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#f87171;">%s</td></tr>
<tr><td style="width:38%%;padding:12px 16px;border:1px solid #334155;border-top:none;background:#162032;font-size:12px;color:#94a3b8;">%s</td><td style="padding:12px 16px;border:1px solid #334155;border-top:none;border-left:none;background:#162032;font-size:13px;color:#f8fafc;">%s</td></tr>
<tr><td style="padding:12px 16px;border:1px solid #334155;border-top:none;background:#1e293b;font-size:12px;color:#94a3b8;">%s</td><td style="padding:12px 16px;border:1px solid #334155;border-top:none;border-left:none;background:#1e293b;font-size:13px;color:#f8fafc;">%s</td></tr>
<tr><td style="padding:12px 16px;border:1px solid #334155;border-top:none;background:#162032;font-size:12px;color:#94a3b8;border-radius:0 0 0 10px;">%s</td><td style="padding:12px 16px;border:1px solid #334155;border-top:none;border-left:none;background:#162032;font-size:13px;color:#f8fafc;border-radius:0 0 10px 0;">%s</td></tr>
</table>

<table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.3);border-radius:10px;">
<tr><td style="padding:14px 18px;font-size:13px;color:#fecaca;line-height:1.6;">%s</td></tr>
</table>
<p style="margin:18px 0 0;font-size:12px;color:#64748b;text-align:center;">%s <a href="mailto:%s" style="color:#38bdf8;">%s</a></p>
</td></tr>

<tr><td style="background:#0f172a;border:1px solid #334155;border-top:none;border-radius:0 0 14px 14px;padding:16px 36px;text-align:center;">
<p style="margin:0;font-size:11px;color:#64748b;">%s</p>
</td></tr>

</table></td></tr></table></body></html>
"""
                .formatted(
                        logo,
                        c.areaBadge,
                        c.heroTitle,
                        c.heroSubtitle,
                        c.greeting,
                        esc(nome),
                        c.intro,
                        c.detailsTitle,
                        c.lblOperator,
                        esc(nome),
                        c.lblEmail,
                        esc(email),
                        c.lblRevoked,
                        esc(revokedAtLabel),
                        c.notice,
                        c.supportHint,
                        esc(supportEmail),
                        esc(supportEmail),
                        c.footer);
    }

    private static String esc(String s) {
        if (s == null) {
            return "";
        }
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }

    private static String normalize(String locale) {
        if (locale == null || locale.isBlank()) {
            return "pt-BR";
        }
        return locale.trim();
    }

    private record Copy(
            String areaBadge,
            String heroTitle,
            String heroSubtitle,
            String greeting,
            String intro,
            String detailsTitle,
            String lblOperator,
            String lblEmail,
            String lblProfile,
            String lblGranted,
            String lblRevoked,
            String responsibilityTitle,
            String responsibilityBody,
            String stepsTitle,
            String step1,
            String step2,
            String step3,
            String cta,
            String linkHint,
            String notice,
            String supportHint,
            String footer) {}

    private static Copy copyGranted(String loc) {
        return switch (loc) {
            case "en-US" -> new Copy(
                    "Restricted control plane",
                    "Privileged access granted",
                    "You may now enter the Aero Suite oversight center.",
                    "Hello",
                    "Your account has been elevated to platform operations. This area is reserved for infrastructure oversight, billing, and cross-tenant governance.",
                    "Access details",
                    "Operator",
                    "Email",
                    "Profile",
                    "Granted on",
                    null,
                    "Responsibility",
                    "All actions in the control plane are audited. Use this access only for authorized operational duties and protect your MFA credentials.",
                    "How to sign in",
                    "Open the control plane URL and sign in with your corporate email and password.",
                    "Complete MFA with your authenticator app (required on every session).",
                    "Revalidate MFA periodically while working in the restricted area.",
                    "Open control plane",
                    "If the button does not work, copy this link:",
                    null,
                    null,
                    "Automatic message from Aero Suite — restricted area.");
            case "es-ES" -> new Copy(
                    "Área restringida",
                    "Acceso privilegiado concedido",
                    "Ya puede ingresar al centro de fiscalización de Aero Suite.",
                    "Hola",
                    "Su cuenta fue elevada a operaciones de plataforma. Esta área está reservada para supervisión de infraestructura, facturación y gobernanza multi-tenant.",
                    "Detalles del acceso",
                    "Operador",
                    "Correo",
                    "Perfil",
                    "Concedido en",
                    null,
                    "Responsabilidad",
                    "Todas las acciones en el plano de control se auditan. Use este acceso solo para tareas autorizadas y proteja sus credenciales MFA.",
                    "Cómo acceder",
                    "Abra la URL del plano de control e ingrese con su correo corporativo y contraseña.",
                    "Complete MFA con su aplicación autenticadora (obligatorio en cada sesión).",
                    "Revalide MFA periódicamente mientras trabaje en el área restringida.",
                    "Abrir plano de control",
                    "Si el botón no funciona, copie este enlace:",
                    null,
                    null,
                    "Mensaje automático de Aero Suite — área restringida.");
            case "fr-FR" -> new Copy(
                    "Espace restreint",
                    "Accès privilégié accordé",
                    "Vous pouvez maintenant accéder au centre de supervision Aero Suite.",
                    "Bonjour",
                    "Votre compte a été élevé aux opérations plateforme. Cet espace est réservé à la supervision infrastructure, la facturation et la gouvernance multi-tenant.",
                    "Détails de l'accès",
                    "Opérateur",
                    "E-mail",
                    "Profil",
                    "Accordé le",
                    null,
                    "Responsabilité",
                    "Toutes les actions dans le plan de contrôle sont auditées. Utilisez cet accès uniquement pour des missions autorisées et protégez vos identifiants MFA.",
                    "Comment se connecter",
                    "Ouvrez l'URL du plan de contrôle et connectez-vous avec votre e-mail professionnel et mot de passe.",
                    "Complétez la MFA avec votre application d'authentification (obligatoire à chaque session).",
                    "Revalidez la MFA périodiquement dans l'espace restreint.",
                    "Ouvrir le plan de contrôle",
                    "Si le bouton ne fonctionne pas, copiez ce lien :",
                    null,
                    null,
                    "Message automatique Aero Suite — espace restreint.");
            default -> new Copy(
                    "Área restrita",
                    "Acesso privilegiado concedido",
                    "Você agora pode entrar no centro de fiscalização da Aero Suite.",
                    "Olá",
                    "Sua conta foi elevada ao plano de operações da plataforma. Esta área é reservada à fiscalização de infraestrutura, faturamento e governança multi-organização.",
                    "Detalhes do acesso",
                    "Operador",
                    "E-mail",
                    "Perfil",
                    "Concedido em",
                    null,
                    "Responsabilidade",
                    "Todas as ações no plano de controle são auditadas. Utilize este acesso apenas para atividades autorizadas e proteja suas credenciais de MFA.",
                    "Como acessar",
                    "Abra o link do plano de controle e entre com seu e-mail corporativo e senha.",
                    "Conclua a autenticação MFA no aplicativo autenticador (obrigatória em cada sessão).",
                    "Revalide o MFA periodicamente enquanto atuar na área restrita.",
                    "Acessar plano de controle",
                    "Se o botão não funcionar, copie este link:",
                    null,
                    null,
                    "Mensagem automática do Aero Suite — área restrita.");
        };
    }

    private static Copy copyRevoked(String loc) {
        Copy g = copyGranted(loc);
        return switch (loc) {
            case "en-US" -> new Copy(
                    "Restricted control plane",
                    "Platform access revoked",
                    "Your authorization to the oversight center has been removed.",
                    "Hello",
                    "Your privileged access to the Aero Suite control plane was deactivated. You can no longer elevate your session to this restricted area.",
                    "Revocation details",
                    g.lblOperator(),
                    g.lblEmail(),
                    null,
                    null,
                    "Revoked on",
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    "If you believe this is an error, contact platform administration.",
                    "Support:",
                    "Automatic message from Aero Suite — restricted area.");
            case "es-ES" -> new Copy(
                    "Área restringida",
                    "Acceso a la plataforma revocado",
                    "Su autorización al centro de fiscalización fue eliminada.",
                    "Hola",
                    "Su acceso privilegiado al plano de control de Aero Suite fue desactivado. Ya no puede elevar su sesión a esta área restringida.",
                    "Detalles de la revocación",
                    g.lblOperator(),
                    g.lblEmail(),
                    null,
                    null,
                    "Revocado en",
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    "Si cree que es un error, contacte a la administración de la plataforma.",
                    "Soporte:",
                    "Mensaje automático de Aero Suite — área restringida.");
            case "fr-FR" -> new Copy(
                    "Espace restreint",
                    "Accès plateforme révoqué",
                    "Votre autorisation au centre de supervision a été retirée.",
                    "Bonjour",
                    "Votre accès privilégié au plan de contrôle Aero Suite a été désactivé. Vous ne pouvez plus élever votre session vers cet espace restreint.",
                    "Détails de la révocation",
                    g.lblOperator(),
                    g.lblEmail(),
                    null,
                    null,
                    "Révoqué le",
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    "Si vous pensez qu'il s'agit d'une erreur, contactez l'administration plateforme.",
                    "Assistance :",
                    "Message automatique Aero Suite — espace restreint.");
            default -> new Copy(
                    "Área restrita",
                    "Acesso à plataforma revogado",
                    "Sua autorização ao centro de fiscalização foi removida.",
                    "Olá",
                    "Seu acesso privilegiado ao plano de controle da Aero Suite foi desativado. Você não poderá mais elevar sua sessão a esta área restrita.",
                    "Detalhes da revogação",
                    g.lblOperator(),
                    g.lblEmail(),
                    null,
                    null,
                    "Revogado em",
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    "Se acredita que isto é um engano, contate a administração da plataforma.",
                    "Suporte:",
                    "Mensagem automática do Aero Suite — área restrita.");
        };
    }
}
