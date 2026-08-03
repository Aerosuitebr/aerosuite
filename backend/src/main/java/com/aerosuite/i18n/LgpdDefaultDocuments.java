package com.aerosuite.i18n;

import com.aerosuite.p1.LgpdDocumentVersions;

/** Textos padrão de termos e privacidade da plataforma (4 locales). */
public final class LgpdDefaultDocuments {

    private LgpdDefaultDocuments() {}

    public static String title(String tipo, String locale) {
        String loc = UserLocaleResolver.normalize(locale);
        boolean termos = "termos".equals(tipo);
        return switch (loc) {
            case "en-US" -> termos ? "Terms of Use" : "Privacy Policy";
            case "es-ES" -> termos ? "Términos de uso" : "Política de privacidad";
            case "fr-FR" -> termos ? "Conditions d'utilisation" : "Politique de confidentialité";
            default -> termos ? "Termos de Uso" : "Política de Privacidade";
        };
    }

    public static String termosBody(String locale) {
        String loc = UserLocaleResolver.normalize(locale);
        String version = LgpdDocumentVersions.TERMOS;
        return switch (loc) {
            case "en-US" -> """
                    Terms of Use — Aero Suite (version %s)

                    1. Aero Suite is SaaS software for MRO, inventory and commercial proposal management.
                    2. Each organization (tenant) has logically isolated data on the platform.
                    3. You are responsible for the accuracy of the data you enter and for keeping your credentials confidential.
                    4. Access may be limited due to non-payment or violation of these terms.
                    5. Changes to these terms will be communicated; continued use may require renewed acceptance.

                    To exercise LGPD/GDPR rights, use the privacy portal in the application.
                    """.formatted(version).trim();
            case "es-ES" -> """
                    Términos de uso — Aero Suite (versión %s)

                    1. Aero Suite es un software SaaS para gestión MRO, inventario y propuestas comerciales.
                    2. Cada organización (tenant) tiene datos aislados lógicamente en la plataforma.
                    3. El usuario es responsable de la veracidad de los datos que ingresa y del sigilo de sus credenciales.
                    4. La suspensión por falta de pago o violación de los términos puede limitar el acceso.
                    5. Los cambios en estos términos serán comunicados; el uso continuado puede exigir un nuevo consentimiento.

                    Para ejercer derechos LGPD, utilice el portal de privacidad en la aplicación.
                    """.formatted(version).trim();
            case "fr-FR" -> """
                    Conditions d'utilisation — Aero Suite (version %s)

                    1. Aero Suite est un logiciel SaaS pour la gestion MRO, des stocks et des propositions commerciales.
                    2. Chaque organisation (tenant) dispose de données isolées logiquement sur la plateforme.
                    3. L'utilisateur est responsable de l'exactitude des données saisies et de la confidentialité de ses identifiants.
                    4. L'accès peut être limité en cas de non-paiement ou de violation des conditions.
                    5. Les modifications seront communiquées ; la poursuite de l'utilisation peut exiger un nouvel accord.

                    Pour exercer vos droits LGPD, utilisez le portail de confidentialité dans l'application.
                    """.formatted(version).trim();
            default -> """
                    Termos de Uso — Aero Suite (versão %s)

                    1. O Aero Suite é um software SaaS para gestão MRO, estoque e propostas comerciais.
                    2. Cada organização (tenant) possui dados isolados logicamente na plataforma.
                    3. O usuário é responsável pela veracidade dos dados que insere e pelo sigilo das credenciais.
                    4. A suspensão por falta de pagamento ou violação dos termos pode limitar o acesso.
                    5. Alterações nestes termos serão comunicadas; o uso continuado pode exigir novo aceite.

                    Para exercer direitos LGPD, utilize o portal de privacidade na aplicação.
                    """.formatted(version).trim();
        };
    }

    public static String privacidadeBody(String locale) {
        String loc = UserLocaleResolver.normalize(locale);
        String version = LgpdDocumentVersions.PRIVACIDADE;
        return switch (loc) {
            case "en-US" -> """
                    Privacy Policy — Aero Suite (version %s)

                    We process identification and contact data, operational data (work orders, inventory, proposals) and access logs.
                    Legal basis: contract performance, legitimate interest and consent where applicable.
                    Retention: for the duration of the contractual relationship and legal periods.
                    Sharing: email subprocessors (e.g. SendGrid) and hosting infrastructure.
                    Data subject rights: access, correction, portability, deletion — via request in the application.
                    DPO: contact the support email configured for your organization.

                    Acceptance record: document version, date/time, IP and user-agent (when available).
                    """.formatted(version).trim();
            case "es-ES" -> """
                    Política de privacidad — Aero Suite (versión %s)

                    Tratamos datos de identificación, contacto, operación (OS, inventario, propuestas) y registros de acceso.
                    Base legal: ejecución de contrato, interés legítimo y consentimiento cuando corresponda.
                    Retención: mientras dure la relación contractual y los plazos legales.
                    Compartición: subprocesadores de correo (p. ej. SendGrid) e infraestructura de alojamiento.
                    Derechos del titular: acceso, corrección, portabilidad, eliminación — mediante solicitud en la aplicación.
                    DPO: contacte el correo de soporte configurado en su organización.

                    Registro de aceptación: versión de los documentos, fecha/hora, IP y user-agent (cuando esté disponible).
                    """.formatted(version).trim();
            case "fr-FR" -> """
                    Politique de confidentialité — Aero Suite (version %s)

                    Nous traitons des données d'identification, de contact, d'exploitation (OS, stocks, propositions) et des journaux d'accès.
                    Base légale : exécution du contrat, intérêt légitime et consentement le cas échéant.
                    Conservation : pendant la relation contractuelle et les délais légaux.
                    Partage : sous-traitants e-mail (ex. SendGrid) et infrastructure d'hébergement.
                    Droits des personnes : accès, rectification, portabilité, suppression — via demande dans l'application.
                    DPO : contactez l'e-mail de support configuré pour votre organisation.

                    Enregistrement du consentement : version des documents, date/heure, IP et user-agent (si disponible).
                    """.formatted(version).trim();
            default -> """
                    Política de Privacidade — Aero Suite (versão %s)

                    Tratamos dados de identificação, contato, operação (OS, estoque, propostas) e logs de acesso.
                    Base legal: execução de contrato, legítimo interesse e consentimento quando aplicável.
                    Retenção: enquanto durar a relação contratual e prazos legais.
                    Compartilhamento: subprocessadores de e-mail (ex.: SendGrid) e infraestrutura de hospedagem.
                    Direitos do titular: acesso, correção, portabilidade, eliminação — via solicitação na aplicação.
                    Encarregado/DPO: contate o e-mail de suporte configurado na sua organização.

                    Registro de aceite: versão dos documentos, data/hora, IP e user-agent (quando disponível).
                    """.formatted(version).trim();
        };
    }
}
