package com.aerosuite.i18n;

/**
 * Assuntos e corpos HTML de e-mails transacionais (4 locales).
 */
public final class TransactionalEmailMessages {

    public record EmailContent(String subject, String htmlBody) {}

    private TransactionalEmailMessages() {}

    public static EmailContent blingNfeAutorizada(
            String locale,
            String clienteNome,
            String numeroNfe,
            String situacao,
            String numeroProposta,
            String danfeUrl) {
        String loc = UserLocaleResolver.normalize(locale);
        String nome = clienteNome != null && !clienteNome.isBlank() ? clienteNome.trim() : greetingName(loc);
        String num = numeroNfe != null && !numeroNfe.isBlank() ? numeroNfe.trim() : "—";
        String sit = situacao != null && !situacao.isBlank() ? situacao.trim() : defaultSituacao(loc);
        String propostaBlock = buildPropostaBlock(loc, numeroProposta);
        String danfeBlock = buildDanfeBlock(loc, danfeUrl);
        return switch (loc) {
            case "en-US" -> new EmailContent(
                    "Invoice #" + num + " authorized — Aero Suite",
                    wrap(
                            loc,
                            "Authorized invoice",
                            "Hello " + esc(nome) + ",",
                            "Your invoice was registered in Bling with status <strong>"
                                    + esc(sit) + "</strong>.",
                            propostaBlock + danfeBlock));
            case "es-ES" -> new EmailContent(
                    "Factura #" + num + " autorizada — Aero Suite",
                    wrap(
                            loc,
                            "Factura autorizada",
                            "Hola " + esc(nome) + ",",
                            "Su factura fue registrada en Bling con situación <strong>"
                                    + esc(sit) + "</strong>.",
                            propostaBlock + danfeBlock));
            case "fr-FR" -> new EmailContent(
                    "Facture n° " + num + " autorisée — Aero Suite",
                    wrap(
                            loc,
                            "Facture autorisée",
                            "Bonjour " + esc(nome) + ",",
                            "Votre facture a été enregistrée dans Bling avec le statut <strong>"
                                    + esc(sit) + "</strong>.",
                            propostaBlock + danfeBlock));
            default -> new EmailContent(
                    "NF-e #" + num + " autorizada — Aero Suite",
                    wrap(
                            loc,
                            "Nota fiscal autorizada",
                            "Olá " + esc(nome) + ",",
                            "Sua NF-e foi registrada na Bling com situação <strong>"
                                    + esc(sit) + "</strong>.",
                            propostaBlock + danfeBlock));
        };
    }

    public static EmailContent passwordReset(String locale, String resetUrl, boolean externalPortal) {
        String loc = UserLocaleResolver.normalize(locale);
        String link = resetLinkBlock(loc, resetUrl);
        return switch (loc) {
            case "en-US" -> new EmailContent(
                    externalPortal ? "Password reset — Client Portal" : "Password reset — Aero Suite",
                    wrap(
                            loc,
                            "Password reset",
                            "Hello,",
                            externalPortal
                                    ? "You requested a password reset for the client portal."
                                    : "You requested a password reset for Aero Suite.",
                            link + ignoreNote(loc) + expireNote(loc)));
            case "es-ES" -> new EmailContent(
                    externalPortal ? "Restablecer contraseña — Portal del cliente" : "Restablecer contraseña — Aero Suite",
                    wrap(
                            loc,
                            "Restablecer contraseña",
                            "Hola,",
                            externalPortal
                                    ? "Solicitó restablecer la contraseña del portal del cliente."
                                    : "Solicitó restablecer la contraseña de Aero Suite.",
                            link + ignoreNote(loc) + expireNote(loc)));
            case "fr-FR" -> new EmailContent(
                    externalPortal ? "Réinitialisation du mot de passe — Portail client" : "Réinitialisation du mot de passe — Aero Suite",
                    wrap(
                            loc,
                            "Réinitialisation du mot de passe",
                            "Bonjour,",
                            externalPortal
                                    ? "Vous avez demandé la réinitialisation du mot de passe du portail client."
                                    : "Vous avez demandé la réinitialisation du mot de passe Aero Suite.",
                            link + ignoreNote(loc) + expireNote(loc)));
            default -> new EmailContent(
                    externalPortal ? "Redefinição de Senha — Portal do Cliente" : "Redefinição de Senha — Aero Suite",
                    wrap(
                            loc,
                            "Redefinição de Senha",
                            "Olá,",
                            externalPortal
                                    ? "Você solicitou a redefinição de senha do portal do cliente."
                                    : "Você solicitou a redefinição de sua senha no Aero Suite.",
                            link + ignoreNote(loc) + expireNote(loc)));
        };
    }

    public static EmailContent backupCompleted(
            String locale, String databaseName, String filePath, String sizeMb, int durationSeconds) {
        String loc = UserLocaleResolver.normalize(locale);
        String db = databaseName != null && !databaseName.isBlank() ? databaseName : dbFallback(loc);
        String extra =
                "<p><strong>DB:</strong> " + esc(db) + "</p>"
                        + "<p><strong>" + fileLabel(loc) + ":</strong> " + esc(filePath) + "</p>"
                        + "<p><strong>" + sizeLabel(loc) + ":</strong> " + esc(sizeMb) + " MB</p>"
                        + "<p><strong>" + durationLabel(loc) + ":</strong> " + durationSeconds + " s</p>";
        return switch (loc) {
            case "en-US" -> new EmailContent("Backup completed — " + db, wrap(loc, "Backup completed", "Hello,", "The scheduled backup finished successfully.", extra));
            case "es-ES" -> new EmailContent("Copia de seguridad completada — " + db, wrap(loc, "Copia completada", "Hola,", "La copia de seguridad programada finalizó con éxito.", extra));
            case "fr-FR" -> new EmailContent("Sauvegarde terminée — " + db, wrap(loc, "Sauvegarde terminée", "Bonjour,", "La sauvegarde planifiée s'est terminée avec succès.", extra));
            default -> new EmailContent("Backup concluído — " + db, wrap(loc, "Backup concluído", "Olá,", "O backup agendado foi concluído com sucesso.", extra));
        };
    }

    public static EmailContent testEmail(String locale) {
        String loc = UserLocaleResolver.normalize(locale);
        return switch (loc) {
            case "en-US" -> new EmailContent("Test email — Aero Suite", wrap(loc, "Test email", "Hello,", "If you can read this message, email delivery is working.", ""));
            case "es-ES" -> new EmailContent("Correo de prueba — Aero Suite", wrap(loc, "Correo de prueba", "Hola,", "Si ve este mensaje, el envío de correo funciona correctamente.", ""));
            case "fr-FR" -> new EmailContent("E-mail de test — Aero Suite", wrap(loc, "E-mail de test", "Bonjour,", "Si vous lisez ce message, l'envoi d'e-mails fonctionne.", ""));
            default -> new EmailContent("E-mail de Teste — Aero Suite", wrap(loc, "E-mail de Teste", "Olá,", "Se você está vendo esta mensagem, o envio de e-mail está funcionando.", ""));
        };
    }

    public static EmailContent updateReady(String locale, String nome, String versao, String changelog) {
        return updateMail(locale, nome, versao, changelog, "ready");
    }

    public static EmailContent updateAvailable(String locale, String nome, String versao, String changelog) {
        return updateMail(locale, nome, versao, changelog, "available");
    }

    public static EmailContent updateCompleted(String locale, String nome, String versao) {
        String loc = UserLocaleResolver.normalize(locale);
        String n = blank(nome) ? "" : " " + esc(nome.trim()) + ",";
        return switch (loc) {
            case "en-US" -> new EmailContent(
                    "Update completed — Aero Suite v" + versao,
                    wrap(loc, "Update completed", "Hello" + n, "Aero Suite was updated successfully to version <strong>" + esc(versao) + "</strong>.", accessNote(loc)));
            case "es-ES" -> new EmailContent(
                    "Actualización completada — Aero Suite v" + versao,
                    wrap(loc, "Actualización completada", "Hola" + n, "Aero Suite se actualizó correctamente a la versión <strong>" + esc(versao) + "</strong>.", accessNote(loc)));
            case "fr-FR" -> new EmailContent(
                    "Mise à jour terminée — Aero Suite v" + versao,
                    wrap(loc, "Mise à jour terminée", "Bonjour" + n, "Aero Suite a été mis à jour avec succès vers la version <strong>" + esc(versao) + "</strong>.", accessNote(loc)));
            default -> new EmailContent(
                    "Atualização Concluída — Aero Suite v" + versao,
                    wrap(loc, "Atualização Concluída", "Olá" + n, "O Aero Suite foi atualizado com sucesso para a versão <strong>" + esc(versao) + "</strong>.", accessNote(loc)));
        };
    }

    public static EmailContent ticketResolved(String locale, String numero, String titulo) {
        String loc = UserLocaleResolver.normalize(locale);
        String num = esc(blank(numero) ? "—" : numero.trim());
        String tit = esc(blank(titulo) ? "—" : titulo.trim());
        return switch (loc) {
            case "en-US" -> new EmailContent("[TICKET RESOLVED] " + num, wrap(loc, "Ticket resolved", "Hello,", "Your ticket <strong>" + num + "</strong> (" + tit + ") was marked as resolved.", confirmNote(loc)));
            case "es-ES" -> new EmailContent("[TICKET RESUELTO] " + num, wrap(loc, "Ticket resuelto", "Hola,", "Su ticket <strong>" + num + "</strong> (" + tit + ") fue marcado como resuelto.", confirmNote(loc)));
            case "fr-FR" -> new EmailContent("[TICKET RÉSOLU] " + num, wrap(loc, "Ticket résolu", "Bonjour,", "Votre ticket <strong>" + num + "</strong> (" + tit + ") a été marqué comme résolu.", confirmNote(loc)));
            default -> new EmailContent("[CHAMADO RESOLVIDO] " + num, wrap(loc, "Chamado resolvido", "Olá,", "Seu chamado <strong>" + num + "</strong> (" + tit + ") foi marcado como resolvido.", confirmNote(loc)));
        };
    }

    public static EmailContent ticketReply(String locale, String numero, String titulo, String resposta, String atendente) {
        String loc = UserLocaleResolver.normalize(locale);
        String num = esc(blank(numero) ? "—" : numero.trim());
        String att = esc(blank(atendente) ? "—" : atendente.trim());
        String reply = esc(blank(resposta) ? "—" : resposta.trim());
        String extra = "<p><strong>" + replyLabel(loc) + ":</strong></p><p>" + reply + "</p>";
        return switch (loc) {
            case "en-US" -> new EmailContent("[TICKET UPDATE] " + num, wrap(loc, "New reply on your ticket", "Hello,", att + " replied to ticket <strong>" + num + "</strong> (" + esc(blank(titulo) ? "—" : titulo.trim()) + ").", extra));
            case "es-ES" -> new EmailContent("[ACTUALIZACIÓN] " + num, wrap(loc, "Nueva respuesta en su ticket", "Hola,", att + " respondió al ticket <strong>" + num + "</strong> (" + esc(blank(titulo) ? "—" : titulo.trim()) + ").", extra));
            case "fr-FR" -> new EmailContent("[MISE À JOUR] " + num, wrap(loc, "Nouvelle réponse sur votre ticket", "Bonjour,", att + " a répondu au ticket <strong>" + num + "</strong> (" + esc(blank(titulo) ? "—" : titulo.trim()) + ").", extra));
            default -> new EmailContent("[ATUALIZAÇÃO] " + num, wrap(loc, "Nova resposta no chamado", "Olá,", att + " respondeu ao chamado <strong>" + num + "</strong> (" + esc(blank(titulo) ? "—" : titulo.trim()) + ").", extra));
        };
    }

    public static EmailContent ticketAwaitingUser(String locale, String numero, String titulo, String motivo) {
        String loc = UserLocaleResolver.normalize(locale);
        String num = esc(blank(numero) ? "—" : numero.trim());
        String reason = esc(blank(motivo) ? "—" : motivo.trim());
        String extra = "<p><strong>" + reasonLabel(loc) + ":</strong> " + reason + "</p>";
        return switch (loc) {
            case "en-US" -> new EmailContent("[ACTION REQUIRED] " + num, wrap(loc, "Action required", "Hello,", "Ticket <strong>" + num + "</strong> is waiting for your response.", extra));
            case "es-ES" -> new EmailContent("[ACCIÓN REQUERIDA] " + num, wrap(loc, "Acción requerida", "Hola,", "El ticket <strong>" + num + "</strong> espera su respuesta.", extra));
            case "fr-FR" -> new EmailContent("[ACTION REQUISE] " + num, wrap(loc, "Action requise", "Bonjour,", "Le ticket <strong>" + num + "</strong> attend votre réponse.", extra));
            default -> new EmailContent("[AÇÃO NECESSÁRIA] " + num, wrap(loc, "Ação necessária", "Olá,", "O chamado <strong>" + num + "</strong> aguarda sua resposta.", extra));
        };
    }

    public static EmailContent ticketNewSupport(String locale, String numero, String titulo, String descricao) {
        String loc = UserLocaleResolver.normalize(locale);
        String num = esc(blank(numero) ? "—" : numero.trim());
        String tit = esc(blank(titulo) ? "—" : titulo.trim());
        String desc = esc(blank(descricao) ? "—" : descricao.trim());
        String extra = "<p><strong>" + descLabel(loc) + ":</strong> " + desc + "</p>";
        return switch (loc) {
            case "en-US" -> new EmailContent("[NEW TICKET] " + num + " — " + tit, wrap(loc, "New support ticket", "Hello,", "Ticket <strong>" + num + "</strong>: " + tit, extra));
            case "es-ES" -> new EmailContent("[NUEVO TICKET] " + num + " — " + tit, wrap(loc, "Nuevo ticket de soporte", "Hola,", "Ticket <strong>" + num + "</strong>: " + tit, extra));
            case "fr-FR" -> new EmailContent("[NOUVEAU TICKET] " + num + " — " + tit, wrap(loc, "Nouveau ticket support", "Bonjour,", "Ticket <strong>" + num + "</strong> : " + tit, extra));
            default -> new EmailContent("[NOVO CHAMADO] " + num + " — " + tit, wrap(loc, "Novo chamado de suporte", "Olá,", "Chamado <strong>" + num + "</strong>: " + tit, extra));
        };
    }

    private static EmailContent updateMail(String locale, String nome, String versao, String changelog, String kind) {
        String loc = UserLocaleResolver.normalize(locale);
        String n = blank(nome) ? "" : " " + esc(nome.trim()) + ",";
        String news = esc(blank(changelog) ? defaultChangelog(loc) : changelog.trim());
        String block = "<p><strong>" + versionLabel(loc) + ":</strong> " + esc(versao) + "</p><p><strong>" + newsLabel(loc) + ":</strong> " + news + "</p>";
        return switch (loc) {
            case "en-US" -> new EmailContent(
                    (kind.equals("ready") ? "Update ready" : "Update available") + " — Aero Suite v" + versao,
                    wrap(
                            loc,
                            kind.equals("ready") ? "Update ready to install" : "New update available",
                            "Hello" + n,
                            kind.equals("ready") ? "An Aero Suite update is ready to install." : "A new Aero Suite version is available.",
                            block + accessNote(loc)));
            case "es-ES" -> new EmailContent(
                    (kind.equals("ready") ? "Actualización lista" : "Actualización disponible") + " — Aero Suite v" + versao,
                    wrap(
                            loc,
                            kind.equals("ready") ? "Actualización lista para instalar" : "Nueva actualización disponible",
                            "Hola" + n,
                            kind.equals("ready") ? "Hay una actualización de Aero Suite lista para instalar." : "Hay una nueva versión de Aero Suite disponible.",
                            block + accessNote(loc)));
            case "fr-FR" -> new EmailContent(
                    (kind.equals("ready") ? "Mise à jour prête" : "Mise à jour disponible") + " — Aero Suite v" + versao,
                    wrap(
                            loc,
                            kind.equals("ready") ? "Mise à jour prête à installer" : "Nouvelle mise à jour disponible",
                            "Bonjour" + n,
                            kind.equals("ready") ? "Une mise à jour Aero Suite est prête à être installée." : "Une nouvelle version d'Aero Suite est disponible.",
                            block + accessNote(loc)));
            default -> new EmailContent(
                    (kind.equals("ready") ? "Atualização pronta" : "Atualização disponível") + " — Aero Suite v" + versao,
                    wrap(
                            loc,
                            kind.equals("ready") ? "Atualização pronta para instalar" : "Nova atualização disponível",
                            "Olá" + n,
                            kind.equals("ready") ? "Uma atualização do Aero Suite está pronta para instalar." : "Uma nova versão do Aero Suite está disponível.",
                            block + accessNote(loc)));
        };
    }

    private static String resetLinkBlock(String loc, String resetUrl) {
        String label =
                switch (UserLocaleResolver.normalize(loc)) {
                    case "en-US" -> "Reset password";
                    case "es-ES" -> "Restablecer contraseña";
                    case "fr-FR" -> "Réinitialiser le mot de passe";
                    default -> "Redefinir senha";
                };
        return "<p><a href=\"" + esc(resetUrl) + "\" style=\"display:inline-block;background:#0ea5e9;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;\">"
                + label + "</a></p>";
    }

    private static String ignoreNote(String loc) {
        return switch (UserLocaleResolver.normalize(loc)) {
            case "en-US" -> "<p>If you did not request this, ignore this email.</p>";
            case "es-ES" -> "<p>Si no solicitó esto, ignore este correo.</p>";
            case "fr-FR" -> "<p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>";
            default -> "<p>Se você não solicitou esta alteração, ignore este e-mail.</p>";
        };
    }

    private static String expireNote(String loc) {
        return switch (UserLocaleResolver.normalize(loc)) {
            case "en-US" -> "<p>This link expires in 24 hours.</p>";
            case "es-ES" -> "<p>Este enlace expira en 24 horas.</p>";
            case "fr-FR" -> "<p>Ce lien expire dans 24 heures.</p>";
            default -> "<p>Este link expira em 24 horas.</p>";
        };
    }

    private static String accessNote(String loc) {
        return switch (UserLocaleResolver.normalize(loc)) {
            case "en-US" -> "<p>Sign in to the application to continue.</p>";
            case "es-ES" -> "<p>Inicie sesión en la aplicación para continuar.</p>";
            case "fr-FR" -> "<p>Connectez-vous à l'application pour continuer.</p>";
            default -> "<p>Acesse o sistema para continuar.</p>";
        };
    }

    private static String confirmNote(String loc) {
        return switch (UserLocaleResolver.normalize(loc)) {
            case "en-US" -> "<p>Please confirm the issue is resolved.</p>";
            case "es-ES" -> "<p>Confirme si el problema fue solucionado.</p>";
            case "fr-FR" -> "<p>Veuillez confirmer que le problème est résolu.</p>";
            default -> "<p>Verifique se o problema foi solucionado.</p>";
        };
    }

    private static String dbFallback(String loc) {
        return switch (UserLocaleResolver.normalize(loc)) {
            case "en-US" -> "database";
            case "es-ES" -> "base de datos";
            case "fr-FR" -> "base de données";
            default -> "banco";
        };
    }

    private static String fileLabel(String loc) {
        return switch (UserLocaleResolver.normalize(loc)) {
            case "en-US" -> "File";
            case "es-ES" -> "Archivo";
            case "fr-FR" -> "Fichier";
            default -> "Arquivo";
        };
    }

    private static String sizeLabel(String loc) {
        return switch (UserLocaleResolver.normalize(loc)) {
            case "en-US" -> "Size";
            case "es-ES" -> "Tamaño";
            case "fr-FR" -> "Taille";
            default -> "Tamanho";
        };
    }

    private static String durationLabel(String loc) {
        return switch (UserLocaleResolver.normalize(loc)) {
            case "en-US" -> "Duration";
            case "es-ES" -> "Duración";
            case "fr-FR" -> "Durée";
            default -> "Duração";
        };
    }

    private static String versionLabel(String loc) {
        return switch (UserLocaleResolver.normalize(loc)) {
            case "en-US" -> "Version";
            case "es-ES" -> "Versión";
            case "fr-FR" -> "Version";
            default -> "Versão";
        };
    }

    private static String newsLabel(String loc) {
        return switch (UserLocaleResolver.normalize(loc)) {
            case "en-US" -> "Release notes";
            case "es-ES" -> "Novedades";
            case "fr-FR" -> "Nouveautés";
            default -> "Novidades";
        };
    }

    private static String defaultChangelog(String loc) {
        return switch (UserLocaleResolver.normalize(loc)) {
            case "en-US" -> "Improvements and fixes";
            case "es-ES" -> "Mejoras y correcciones";
            case "fr-FR" -> "Améliorations et corrections";
            default -> "Melhorias e correções";
        };
    }

    private static String replyLabel(String loc) {
        return switch (UserLocaleResolver.normalize(loc)) {
            case "en-US" -> "Reply";
            case "es-ES" -> "Respuesta";
            case "fr-FR" -> "Réponse";
            default -> "Resposta";
        };
    }

    private static String reasonLabel(String loc) {
        return switch (UserLocaleResolver.normalize(loc)) {
            case "en-US" -> "Reason";
            case "es-ES" -> "Motivo";
            case "fr-FR" -> "Motif";
            default -> "Motivo";
        };
    }

    private static String descLabel(String loc) {
        return switch (UserLocaleResolver.normalize(loc)) {
            case "en-US" -> "Description";
            case "es-ES" -> "Descripción";
            case "fr-FR" -> "Description";
            default -> "Descrição";
        };
    }

    private static boolean blank(String s) {
        return s == null || s.isBlank();
    }

    public static EmailContent propostaPortalAvailable(
            String locale, String nome, String numeroProposta, String portalLoginUrl, String portalPropostasUrl) {
        String loc = UserLocaleResolver.normalize(locale);
        String n = blank(nome) ? greetingName(loc) : esc(nome.trim());
        String num = esc(blank(numeroProposta) ? "—" : numeroProposta.trim());
        String links = portalButtons(loc, portalPropostasUrl, portalLoginUrl);
        return switch (loc) {
            case "en-US" -> new EmailContent("Proposal " + num + " available — Aero Suite", wrap(loc, "Proposal on portal", "Hello " + n + ",", "Commercial proposal <strong>" + num + "</strong> is available on the client portal.", links));
            case "es-ES" -> new EmailContent("Propuesta " + num + " disponible — Aero Suite", wrap(loc, "Propuesta en el portal", "Hola " + n + ",", "La propuesta comercial <strong>" + num + "</strong> está disponible en el portal del cliente.", links));
            case "fr-FR" -> new EmailContent("Proposition " + num + " disponible — Aero Suite", wrap(loc, "Proposition sur le portail", "Bonjour " + n + ",", "La proposition commerciale <strong>" + num + "</strong> est disponible sur le portail client.", links));
            default -> new EmailContent("Proposta " + num + " disponível no portal — Aero Suite", wrap(loc, "Proposta no portal", "Olá " + n + ",", "A proposta comercial <strong>" + num + "</strong> está disponível no portal do cliente.", links));
        };
    }

    private static String portalButtons(String loc, String propostasUrl, String loginUrl) {
        String view =
                switch (UserLocaleResolver.normalize(loc)) {
                    case "en-US" -> "View proposal";
                    case "es-ES" -> "Ver propuesta";
                    case "fr-FR" -> "Voir la proposition";
                    default -> "Ver proposta";
                };
        String login =
                switch (UserLocaleResolver.normalize(loc)) {
                    case "en-US" -> "Sign in to portal";
                    case "es-ES" -> "Entrar al portal";
                    case "fr-FR" -> "Se connecter au portail";
                    default -> "Entrar no portal";
                };
        return "<p><a href=\"" + esc(propostasUrl) + "\">" + view + "</a> · "
                + "<a href=\"" + esc(loginUrl) + "\">" + login + "</a></p>";
    }

    public static EmailContent passwordSetupInvite(String locale, String nome, String senhaTemporaria, String setupUrl) {
        String loc = UserLocaleResolver.normalize(locale);
        String n = blank(nome) ? greetingName(loc) : esc(nome.trim());
        String extra = resetLinkBlock(loc, setupUrl);
        if (blank(setupUrl) && !blank(senhaTemporaria)) {
            extra += "<p><strong>" + tempPasswordLabel(loc) + ":</strong> " + esc(senhaTemporaria) + "</p>";
        }
        String bodyText =
                switch (loc) {
                    case "en-US" ->
                            blank(setupUrl)
                                    ? "Your account was created. Use the temporary password below and set a new password."
                                    : "Your account was created. Use the secure link below to set your password (single use, expires soon).";
                    case "es-ES" ->
                            blank(setupUrl)
                                    ? "Su cuenta fue creada. Use la contraseña temporal y defina una nueva contraseña."
                                    : "Su cuenta fue creada. Use el enlace seguro para definir su contraseña (uso único, expira pronto).";
                    case "fr-FR" ->
                            blank(setupUrl)
                                    ? "Votre compte a été créé. Utilisez le mot de passe temporaire et définissez-en un nouveau."
                                    : "Votre compte a été créé. Utilisez le lien sécurisé pour définir votre mot de passe (usage unique, expiration proche).";
                    default ->
                            blank(setupUrl)
                                    ? "Sua conta foi criada. Use a senha temporária abaixo e defina uma nova senha."
                                    : "Sua conta foi criada. Use o link seguro abaixo para definir sua senha (uso único, expira em breve).";
                };
        String portalFooter = portalSupportFooter(loc, setupUrl);
        return switch (loc) {
            case "en-US" -> new EmailContent("Welcome to Aero Suite — set your password", wrap(loc, "Welcome", "Hello " + n + ",", bodyText, extra, portalFooter));
            case "es-ES" -> new EmailContent("Bienvenido a Aero Suite — configure su contraseña", wrap(loc, "Bienvenido", "Hola " + n + ",", bodyText, extra, portalFooter));
            case "fr-FR" -> new EmailContent("Bienvenue sur Aero Suite — définissez votre mot de passe", wrap(loc, "Bienvenue", "Bonjour " + n + ",", bodyText, extra, portalFooter));
            default -> new EmailContent("Bem-vindo ao Aero Suite — configure sua senha", wrap(loc, "Bem-vindo", "Olá " + n + ",", bodyText, extra, portalFooter));
        };
    }

    public static EmailContent organizationWelcome(
            String locale,
            String nomeDestinatario,
            String organizacaoNome,
            String organizacaoCodigo,
            String loginUrl,
            String senhaTemporaria,
            String setupPasswordUrl) {
        String loc = UserLocaleResolver.normalize(locale);
        String n = blank(nomeDestinatario) ? greetingName(loc) : esc(nomeDestinatario.trim());
        String org = esc(blank(organizacaoNome) ? "—" : organizacaoNome.trim());
        String cod = esc(blank(organizacaoCodigo) ? "—" : organizacaoCodigo.trim());
        String senhaBlock = "";
        if (!blank(senhaTemporaria)) {
            senhaBlock = "<p><strong>" + tempPasswordLabel(loc) + ":</strong> " + esc(senhaTemporaria.trim()) + "</p>";
        }
        String setupBtn = "";
        if (!blank(setupPasswordUrl)) {
            String label =
                    switch (loc) {
                        case "en-US" -> "Set password and sign in";
                        case "es-ES" -> "Definir contraseña e ingresar";
                        case "fr-FR" -> "Définir le mot de passe et se connecter";
                        default -> "Definir senha e entrar";
                    };
            setupBtn = "<p><a href=\"" + esc(setupPasswordUrl.trim()) + "\">" + label + "</a></p>";
        }
        String loginBtn =
                switch (loc) {
                    case "en-US" -> "Go to login";
                    case "es-ES" -> "Ir al inicio de sesión";
                    case "fr-FR" -> "Aller à la connexion";
                    default -> "Ir para o login";
                };
        String extra =
                "<p><strong>"
                        + orgCodeLabel(loc)
                        + ":</strong> <code>"
                        + cod
                        + "</code></p>"
                        + senhaBlock
                        + "<p><a href=\""
                        + esc(loginUrl)
                        + "\">"
                        + loginBtn
                        + "</a></p>"
                        + setupBtn;
        return switch (loc) {
            case "en-US" -> new EmailContent(
                    "Welcome to Aero Suite — " + org,
                    wrap(loc, "Welcome", "Hello " + n + "!", "Organization <strong>" + org + "</strong> was provisioned on Aero Suite.", extra));
            case "es-ES" -> new EmailContent(
                    "Bienvenido a Aero Suite — " + org,
                    wrap(loc, "Bienvenido", "Hola " + n + "!", "La organización <strong>" + org + "</strong> fue provisionada en Aero Suite.", extra));
            case "fr-FR" -> new EmailContent(
                    "Bienvenue sur Aero Suite — " + org,
                    wrap(loc, "Bienvenue", "Bonjour " + n + " !", "L'organisation <strong>" + org + "</strong> a été provisionnée sur Aero Suite.", extra));
            default -> new EmailContent(
                    "Bem-vindo à Aero Suite — " + org,
                    wrap(loc, "Bem-vindo", "Olá, " + n + "!", "A organização <strong>" + org + "</strong> foi provisionada na Aero Suite.", extra));
        };
    }

    public static EmailContent ticketUserReplyToSupport(
            String locale, String numero, String titulo, String resposta, String nomeUsuario) {
        String loc = UserLocaleResolver.normalize(locale);
        String num = esc(blank(numero) ? "—" : numero.trim());
        String tit = esc(blank(titulo) ? "—" : titulo.trim());
        String author = esc(blank(nomeUsuario) ? userFallback(loc) : nomeUsuario.trim());
        String reply = esc(blank(resposta) ? "—" : resposta.trim());
        String extra = "<p><strong>" + author + ":</strong></p><p>" + reply + "</p>";
        return switch (loc) {
            case "en-US" -> new EmailContent(
                    "[USER REPLY] " + num + " — " + tit,
                    wrap(loc, "New user reply", "Hello,", "The user replied to ticket <strong>" + num + "</strong> (" + tit + ").", extra));
            case "es-ES" -> new EmailContent(
                    "[RESPUESTA USUARIO] " + num + " — " + tit,
                    wrap(loc, "Nueva respuesta del usuario", "Hola,", "El usuario respondió al ticket <strong>" + num + "</strong> (" + tit + ").", extra));
            case "fr-FR" -> new EmailContent(
                    "[RÉPONSE UTILISATEUR] " + num + " — " + tit,
                    wrap(loc, "Nouvelle réponse utilisateur", "Bonjour,", "L'utilisateur a répondu au ticket <strong>" + num + "</strong> (" + tit + ").", extra));
            default -> new EmailContent(
                    "[RESPOSTA DO USUÁRIO] " + num + " — " + tit,
                    wrap(loc, "Nova resposta do usuário", "Olá,", "O usuário respondeu ao chamado <strong>" + num + "</strong> (" + tit + ").", extra));
        };
    }

    public static String ticketStatusLabelPublic(String status) {
        return ticketStatusLabel(UserLocaleResolver.normalize("pt-BR"), status);
    }

    public static String ticketStatusLabelPublic(String locale, String status) {
        return ticketStatusLabel(UserLocaleResolver.normalize(locale), status);
    }

    public static EmailContent ticketDailyDigest(String locale, java.util.List<String> linhas) {
        String loc = UserLocaleResolver.normalize(locale);
        int count = linhas != null ? linhas.size() : 0;
        StringBuilder list = new StringBuilder("<ul>");
        if (linhas != null) {
            for (String linha : linhas) {
                if (linha != null && !linha.isBlank()) {
                    list.append("<li>").append(esc(linha.trim())).append("</li>");
                }
            }
        }
        list.append("</ul>");
        String extra = list.toString();
        return switch (loc) {
            case "en-US" -> new EmailContent(
                    "Daily ticket summary (" + count + " update(s))",
                    wrap(
                            loc,
                            "Your ticket updates",
                            "Hello,",
                            "Here is your daily summary of support ticket activity:",
                            extra));
            case "es-ES" -> new EmailContent(
                    "Resumen diario de tickets (" + count + " actualización(es))",
                    wrap(
                            loc,
                            "Actualizaciones de sus tickets",
                            "Hola,",
                            "Este es su resumen diario de actividad en tickets de soporte:",
                            extra));
            case "fr-FR" -> new EmailContent(
                    "Résumé quotidien des tickets (" + count + " mise(s) à jour)",
                    wrap(
                            loc,
                            "Vos mises à jour de tickets",
                            "Bonjour,",
                            "Voici votre résumé quotidien de l'activité sur vos tickets de support :",
                            extra));
            default -> new EmailContent(
                    "Resumo diário de chamados (" + count + " atualização(ões))",
                    wrap(
                            loc,
                            "Atualizações dos seus chamados",
                            "Olá,",
                            "Este é o resumo diário da atividade nos seus chamados de suporte:",
                            extra));
        };
    }

    public static EmailContent ticketStatusChanged(
            String locale, String numero, String titulo, String statusAnterior, String statusNovo) {
        String loc = UserLocaleResolver.normalize(locale);
        String num = esc(blank(numero) ? "—" : numero.trim());
        String tit = esc(blank(titulo) ? "—" : titulo.trim());
        String prev = esc(ticketStatusLabel(loc, statusAnterior));
        String next = esc(ticketStatusLabel(loc, statusNovo));
        String extra = "<p><strong>" + prevStatusLabel(loc) + ":</strong> " + prev + "</p>"
                + "<p><strong>" + newStatusLabel(loc) + ":</strong> " + next + "</p>";
        return switch (loc) {
            case "en-US" -> new EmailContent(
                    "[STATUS UPDATED] " + num + " — " + tit,
                    wrap(loc, "Ticket status updated", "Hello,", "Ticket <strong>" + num + "</strong> (" + tit + ") status changed.", extra));
            case "es-ES" -> new EmailContent(
                    "[ESTADO ACTUALIZADO] " + num + " — " + tit,
                    wrap(loc, "Estado del ticket actualizado", "Hola,", "El estado del ticket <strong>" + num + "</strong> (" + tit + ") cambió.", extra));
            case "fr-FR" -> new EmailContent(
                    "[STATUT MIS À JOUR] " + num + " — " + tit,
                    wrap(loc, "Statut du ticket mis à jour", "Bonjour,", "Le statut du ticket <strong>" + num + "</strong> (" + tit + ") a changé.", extra));
            default -> new EmailContent(
                    "[STATUS ATUALIZADO] " + num + " — " + tit,
                    wrap(loc, "Status do chamado atualizado", "Olá,", "O status do chamado <strong>" + num + "</strong> (" + tit + ") foi alterado.", extra));
        };
    }

    public static EmailContent capacidadeFilaInterno(
            String locale,
            int numeroOs,
            String estagioAnterior,
            String estagioNovo,
            String clienteNome,
            String linkQuadro) {
        String loc = UserLocaleResolver.normalize(locale);
        String client = esc(blank(clienteNome) ? "—" : clienteNome.trim());
        String prev = esc(blank(estagioAnterior) ? "—" : estagioAnterior.trim());
        String next = esc(blank(estagioNovo) ? "—" : estagioNovo.trim());
        String btn =
                switch (loc) {
                    case "en-US" -> "Open board";
                    case "es-ES" -> "Abrir tablero";
                    case "fr-FR" -> "Ouvrir le tableau";
                    default -> "Abrir quadro";
                };
        String extra = "<p>OS <strong>" + numeroOs + "</strong> (" + client + ")</p>"
                + "<p><strong>" + prev + "</strong> → <strong>" + next + "</strong></p>"
                + "<p><a href=\"" + esc(linkQuadro) + "\">" + btn + "</a></p>";
        return switch (loc) {
            case "en-US" -> new EmailContent("WO " + numeroOs + " — queue updated", wrap(loc, "Capacity board", "Hello,", "A work order moved to a new stage.", extra));
            case "es-ES" -> new EmailContent("OS " + numeroOs + " — cola actualizada", wrap(loc, "Tablero de capacidad", "Hola,", "Una orden de servicio cambió de etapa.", extra));
            case "fr-FR" -> new EmailContent("OS " + numeroOs + " — file mise à jour", wrap(loc, "Tableau de capacité", "Bonjour,", "Un ordre de service a changé d'étape.", extra));
            default -> new EmailContent("OS " + numeroOs + " — fila atualizada", wrap(loc, "Quadro de capacidade", "Olá,", "Uma OS mudou de estágio na fila.", extra));
        };
    }

    public static EmailContent capacidadeFilaExterno(
            String locale, int numeroOs, String estagioAnterior, String estagioNovo, String linkPortal) {
        String loc = UserLocaleResolver.normalize(locale);
        String prev = esc(blank(estagioAnterior) ? "—" : estagioAnterior.trim());
        String next = esc(blank(estagioNovo) ? "—" : estagioNovo.trim());
        String btn =
                switch (loc) {
                    case "en-US" -> "View queue and deadlines";
                    case "es-ES" -> "Ver cola y plazos";
                    case "fr-FR" -> "Voir la file et les délais";
                    default -> "Ver fila e prazos";
                };
        String extra = "<p>OS <strong>" + numeroOs + "</strong></p>"
                + "<p><strong>" + prev + "</strong> → <strong>" + next + "</strong></p>"
                + "<p><a href=\"" + esc(linkPortal) + "\">" + btn + "</a></p>";
        return switch (loc) {
            case "en-US" -> new EmailContent("WO " + numeroOs + " — queue update", wrap(loc, "Work order update", "Hello,", "Your work order moved to a new stage in the shop.", extra));
            case "es-ES" -> new EmailContent("OS " + numeroOs + " — actualización de cola", wrap(loc, "Actualización de su orden", "Hola,", "Su orden de servicio cambió de etapa en el taller.", extra));
            case "fr-FR" -> new EmailContent("OS " + numeroOs + " — mise à jour de la file", wrap(loc, "Mise à jour de votre OS", "Bonjour,", "Votre ordre de service a changé d'étape en atelier.", extra));
            default -> new EmailContent("OS " + numeroOs + " — atualização da fila", wrap(loc, "Atualização da sua ordem de serviço", "Olá,", "A OS mudou de estágio na oficina.", extra));
        };
    }

    private static String orgCodeLabel(String loc) {
        return switch (UserLocaleResolver.normalize(loc)) {
            case "en-US" -> "Organization code";
            case "es-ES" -> "Código de organización";
            case "fr-FR" -> "Code organisation";
            default -> "Código da organização";
        };
    }

    private static String userFallback(String loc) {
        return switch (UserLocaleResolver.normalize(loc)) {
            case "en-US" -> "User";
            case "es-ES" -> "Usuario";
            case "fr-FR" -> "Utilisateur";
            default -> "Usuário";
        };
    }

    private static String prevStatusLabel(String loc) {
        return switch (UserLocaleResolver.normalize(loc)) {
            case "en-US" -> "Previous status";
            case "es-ES" -> "Estado anterior";
            case "fr-FR" -> "Statut précédent";
            default -> "Status anterior";
        };
    }

    private static String newStatusLabel(String loc) {
        return switch (UserLocaleResolver.normalize(loc)) {
            case "en-US" -> "New status";
            case "es-ES" -> "Nuevo estado";
            case "fr-FR" -> "Nouveau statut";
            default -> "Novo status";
        };
    }

    private static String ticketStatusLabel(String loc, String status) {
        if (status == null || status.isBlank()) {
            return "—";
        }
        String code = status.trim().toUpperCase(java.util.Locale.ROOT);
        return switch (UserLocaleResolver.normalize(loc)) {
            case "en-US" -> switch (code) {
                case "ABERTO" -> "Open";
                case "EM_ANALISE" -> "Under review";
                case "EM_ANDAMENTO" -> "In progress";
                case "AGUARDANDO_USUARIO" -> "Awaiting user";
                case "RESOLVIDO" -> "Resolved";
                case "FECHADO" -> "Closed";
                default -> status;
            };
            case "es-ES" -> switch (code) {
                case "ABERTO" -> "Abierto";
                case "EM_ANALISE" -> "En análisis";
                case "EM_ANDAMENTO" -> "En curso";
                case "AGUARDANDO_USUARIO" -> "Esperando usuario";
                case "RESOLVIDO" -> "Resuelto";
                case "FECHADO" -> "Cerrado";
                default -> status;
            };
            case "fr-FR" -> switch (code) {
                case "ABERTO" -> "Ouvert";
                case "EM_ANALISE" -> "En analyse";
                case "EM_ANDAMENTO" -> "En cours";
                case "AGUARDANDO_USUARIO" -> "En attente utilisateur";
                case "RESOLVIDO" -> "Résolu";
                case "FECHADO" -> "Fermé";
                default -> status;
            };
            default -> switch (code) {
                case "ABERTO" -> "Aberto";
                case "EM_ANALISE" -> "Em análise";
                case "EM_ANDAMENTO" -> "Em andamento";
                case "AGUARDANDO_USUARIO" -> "Aguardando usuário";
                case "RESOLVIDO" -> "Resolvido";
                case "FECHADO" -> "Fechado";
                default -> status;
            };
        };
    }

    private static String tempPasswordLabel(String loc) {
        return switch (UserLocaleResolver.normalize(loc)) {
            case "en-US" -> "Temporary password";
            case "es-ES" -> "Contraseña temporal";
            case "fr-FR" -> "Mot de passe temporaire";
            default -> "Senha temporária";
        };
    }

    private static String greetingName(String loc) {
        return switch (UserLocaleResolver.normalize(loc)) {
            case "en-US" -> "customer";
            case "es-ES" -> "cliente";
            case "fr-FR" -> "client";
            default -> "cliente";
        };
    }

    private static String defaultSituacao(String loc) {
        return switch (UserLocaleResolver.normalize(loc)) {
            case "en-US" -> "Authorized";
            case "es-ES" -> "Autorizada";
            case "fr-FR" -> "Autorisée";
            default -> "Autorizada";
        };
    }

    private static String buildPropostaBlock(String loc, String numeroProposta) {
        if (numeroProposta == null || numeroProposta.isBlank()) {
            return "";
        }
        String label =
                switch (UserLocaleResolver.normalize(loc)) {
                    case "en-US" -> "Proposal";
                    case "es-ES" -> "Propuesta";
                    case "fr-FR" -> "Proposition";
                    default -> "Proposta";
                };
        return "<p><strong>" + label + ":</strong> " + esc(numeroProposta.trim()) + "</p>";
    }

    private static String buildDanfeBlock(String loc, String danfeUrl) {
        if (danfeUrl == null || danfeUrl.isBlank()) {
            return "";
        }
        String label =
                switch (UserLocaleResolver.normalize(loc)) {
                    case "en-US" -> "Open DANFE";
                    case "es-ES" -> "Abrir DANFE";
                    case "fr-FR" -> "Ouvrir le DANFE";
                    default -> "Abrir DANFE";
                };
        return "<p><a href=\"" + esc(danfeUrl.trim()) + "\">" + label + "</a></p>";
    }

    private static String wrap(String loc, String title, String hello, String body, String extra) {
        return wrap(loc, title, hello, body, extra, null);
    }

    private static String wrap(String loc, String title, String hello, String body, String extra, String portalUrl) {
        String footer =
                switch (UserLocaleResolver.normalize(loc)) {
                    case "en-US" -> "Automatic email from Aero Suite.";
                    case "es-ES" -> "Correo automático de Aero Suite.";
                    case "fr-FR" -> "E-mail automatique d'Aero Suite.";
                    default -> "E-mail automático do Aero Suite.";
                };
        String portalBlock = portalSupportFooter(loc, portalUrl);
        return """
                <!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;">
                <div style="max-width:560px;margin:0 auto;padding:24px;">
                <h2>%s</h2>
                <p>%s</p>
                <p>%s</p>
                %s
                <p style="font-size:12px;color:#64748b;">%s%s</p>
                </div></body></html>
                """
                .formatted(esc(title), hello, body, extra, footer, portalBlock);
    }

    private static String portalSupportFooter(String loc, String portalUrl) {
        if (blank(portalUrl)) {
            return "";
        }
        String base = portalUrl.contains("/externo") ? portalUrl.replaceAll("/externo/setup-password.*", "/externo/login") : portalUrl;
        String label =
                switch (UserLocaleResolver.normalize(loc)) {
                    case "en-US" -> "Client portal";
                    case "es-ES" -> "Portal del cliente";
                    case "fr-FR" -> "Portail client";
                    default -> "Portal do cliente";
                };
        String support =
                switch (UserLocaleResolver.normalize(loc)) {
                    case "en-US" -> "Support";
                    case "es-ES" -> "Soporte";
                    case "fr-FR" -> "Assistance";
                    default -> "Suporte";
                };
        return "<br><a href=\"" + esc(base.trim()) + "\">" + label + "</a> · "
                + "<a href=\"mailto:contato@aerosuite.com.br\">" + support + "</a>";
    }

    public static String propostaComercialEmailSubject(
            String locale, String numeroProposta, String brandingSuffix) {
        String loc = UserLocaleResolver.normalize(locale);
        String num = blank(numeroProposta) ? "—" : numeroProposta.trim();
        String brand = blank(brandingSuffix) ? "Aero Suite" : brandingSuffix.trim();
        return switch (loc) {
            case "en-US" -> "Commercial Proposal " + num + " - " + brand;
            case "es-ES" -> "Propuesta comercial " + num + " - " + brand;
            case "fr-FR" -> "Proposition commerciale " + num + " - " + brand;
            default -> "Proposta Comercial " + num + " - " + brand;
        };
    }

    public static String propostaComercialAttachmentDefaultText(String locale) {
        String loc = UserLocaleResolver.normalize(locale);
        return switch (loc) {
            case "en-US" ->
                    "Please find attached the commercial proposal with full details of the products and services offered.\n\n";
            case "es-ES" ->
                    "Adjuntamos la propuesta comercial con todos los detalles de los productos y servicios ofrecidos.\n\n";
            case "fr-FR" ->
                    "Veuillez trouver ci-joint la proposition commerciale avec tous les détails des produits et services proposés.\n\n";
            default ->
                    "Segue em anexo a proposta comercial com todos os detalhes dos produtos e serviços oferecidos.\n\n";
        };
    }

    public static String propostaComercialPdfFilename(String locale, String numeroProposta) {
        String loc = UserLocaleResolver.normalize(locale);
        String num =
                blank(numeroProposta)
                        ? "nova"
                        : numeroProposta.trim().replaceAll("[^a-zA-Z0-9_-]", "_");
        String prefix =
                switch (loc) {
                    case "en-US" -> "Commercial_Proposal_";
                    case "es-ES" -> "Propuesta_Comercial_";
                    case "fr-FR" -> "Proposition_Commerciale_";
                    default -> "Proposta_Comercial_";
                };
        return prefix + num + ".pdf";
    }

    public static EmailContent platformOpsAccessGranted(
            String locale,
            String nome,
            String email,
            String perfilLabel,
            String accessUrl,
            String grantedAtLabel) {
        String loc = UserLocaleResolver.normalize(locale);
        String html =
                com.aerosuite.email.PlatformOpsAccessEmailBuilder.buildGrantedHtml(
                        loc, nome, email, perfilLabel, accessUrl, grantedAtLabel);
        String subject =
                switch (loc) {
                    case "en-US" -> "Privileged access granted — Aero Suite control plane";
                    case "es-ES" -> "Acceso privilegiado concedido — plano de control Aero Suite";
                    case "fr-FR" -> "Accès privilégié accordé — plan de contrôle Aero Suite";
                    default -> "Acesso privilegiado concedido — plano de controle Aero Suite";
                };
        return new EmailContent(subject, html);
    }

    public static EmailContent platformOpsAccessRevoked(
            String locale,
            String nome,
            String email,
            String perfilLabel,
            String revokedAtLabel,
            String supportEmail) {
        String loc = UserLocaleResolver.normalize(locale);
        String html =
                com.aerosuite.email.PlatformOpsAccessEmailBuilder.buildRevokedHtml(
                        loc, nome, email, perfilLabel, revokedAtLabel, supportEmail);
        String subject =
                switch (loc) {
                    case "en-US" -> "Platform access revoked — Aero Suite control plane";
                    case "es-ES" -> "Acceso a la plataforma revocado — plano de control Aero Suite";
                    case "fr-FR" -> "Accès plateforme révoqué — plan de contrôle Aero Suite";
                    default -> "Acesso à plataforma revogado — plano de controle Aero Suite";
                };
        return new EmailContent(subject, html);
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

    private static final String DEFAULT_BRAND = "Aero Suite";

    /** Nome comercial do tenant; fallback para a marca padrão da suíte. */
    public static String resolveCommercialName(String commercialName) {
        return commercialName != null && !commercialName.isBlank()
                ? commercialName.trim()
                : DEFAULT_BRAND;
    }

    /** Substitui a marca padrão por white-label em assunto e corpo (rodapés e sufixos). */
    public static EmailContent withBrand(EmailContent content, String commercialName) {
        if (content == null) {
            return null;
        }
        String brand = resolveCommercialName(commercialName);
        if (DEFAULT_BRAND.equals(brand)) {
            return content;
        }
        String subject = content.subject().replace(DEFAULT_BRAND, brand);
        String html = content.htmlBody().replace(DEFAULT_BRAND, brand);
        return new EmailContent(subject, html);
    }
}
