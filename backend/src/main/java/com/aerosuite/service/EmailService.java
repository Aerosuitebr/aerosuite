package com.aerosuite.service;

import com.aerosuite.domain.Ticket;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.i18n.UserLocaleResolver;
import io.quarkus.mailer.Mail;
import io.quarkus.mailer.Mailer;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@ApplicationScoped
public class EmailService {

    private static final Logger LOG = Logger.getLogger(EmailService.class);

    @Inject
    Mailer mailer;

    @Inject
    SistemaConfigService sistemaConfigService;

    @Inject
    CommercialBrandingService commercialBrandingService;

    @ConfigProperty(name = "suporte.responsavel.email", defaultValue = "wellemlyra@gmail.com")
    String emailResponsavel;

    @ConfigProperty(name = "suporte.responsavel.locale", defaultValue = "pt-BR")
    String suporteResponsavelLocale;

    @ConfigProperty(name = "quarkus.mailer.from", defaultValue = "noreply@aerosuite.app")
    String emailRemetente;

    @PostConstruct
    void logMailerFrom() {
        LOG.infof("EmailService: remetente (From) configurado = %s", emailRemetente);
    }

    private Mail criarMailHtml(String destino, String assunto, String htmlBody) {
        return Mail.withHtml(destino, assunto, htmlBody)
                .setFrom(emailRemetente);
    }

    private void attachPlatformOpsLogo(Mail mail) {
        byte[] logoBytes = com.aerosuite.email.PlatformOpsAccessEmailBuilder.loadLogoBytes();
        if (logoBytes == null || logoBytes.length == 0) {
            return;
        }
        mail.addInlineAttachment(
                "aerosuite-logo.png",
                logoBytes,
                com.aerosuite.email.PlatformOpsAccessEmailBuilder.logoMimeType(),
                com.aerosuite.email.PlatformOpsAccessEmailBuilder.logoContentIdHeader());
    }

    private void sendPlatformOpsHtml(String destino, com.aerosuite.i18n.TransactionalEmailMessages.EmailContent content) {
        Mail mail = criarMailHtml(destino, content.subject(), content.htmlBody());
        attachPlatformOpsLogo(mail);
        mailer.send(mail);
    }

    private com.aerosuite.i18n.TransactionalEmailMessages.EmailContent branded(
            com.aerosuite.i18n.TransactionalEmailMessages.EmailContent content) {
        return com.aerosuite.i18n.TransactionalEmailMessages.withBrand(
                content, commercialBrandingService.nameNormal());
    }

    private void sendBrandedHtml(String destino, com.aerosuite.i18n.TransactionalEmailMessages.EmailContent content) {
        com.aerosuite.i18n.TransactionalEmailMessages.EmailContent c = branded(content);
        mailer.send(criarMailHtml(destino, c.subject(), c.htmlBody()));
    }

    /** Exposto para serviços internos (ex.: digest diário de chamados). */
    public void sendBrandedHtmlDirect(String destino, com.aerosuite.i18n.TransactionalEmailMessages.EmailContent content) {
        sendBrandedHtml(destino, content);
    }

    public boolean areNotificacoesEmailEnabled() {
        return notificacoesEmailHabilitadas();
    }

    private boolean notificacoesEmailHabilitadas() {
        try {
            return sistemaConfigService.isNotificacoesEmailEnabled();
        } catch (Exception e) {
            LOG.debugf("notificacoesEmail: usando padrão true (%s)", e.getMessage());
            return true;
        }
    }

    private boolean skipNotificacaoEmail(String contexto) {
        if (notificacoesEmailHabilitadas()) {
            return false;
        }
        LOG.infof("E-mail omitido (%s): notificacoesEmail desativado no tenant", contexto);
        return true;
    }

    /**
     * Envia email de reset de senha
     */
    public void sendPasswordResetEmail(String email, String resetUrl) {
        sendPasswordResetEmail(email, resetUrl, UserLocaleResolver.resolveByEmail(email), false);
    }

    public void sendPasswordResetEmail(String email, String resetUrl, String locale, boolean externalPortal) {
        try {
            LOG.infof("Enviando email de reset de senha para: %s | from: %s", email, emailRemetente);
            com.aerosuite.i18n.TransactionalEmailMessages.EmailContent content =
                    com.aerosuite.i18n.TransactionalEmailMessages.passwordReset(locale, resetUrl, externalPortal);
            sendBrandedHtml(email, content);
            LOG.info("Email de reset de senha enviado com sucesso");
        } catch (Exception e) {
            LOG.errorf("Erro ao enviar email de reset de senha: %s", e.getMessage());
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.EMAIL_SEND_FAILED), e);
        }
    }

    /**
     * E-mail de recuperação de senha do portal externo (cliente).
     */
    public void sendPasswordResetEmailExterno(String email, String resetUrl) {
        sendPasswordResetEmail(email, resetUrl, UserLocaleResolver.resolveByEmail(email), true);
    }

    public void sendPasswordResetEmailExterno(String email, String resetUrl, String locale) {
        sendPasswordResetEmail(email, resetUrl, locale, true);
    }

    /**
     * Envia email de configuração de senha para novo usuário
     */
    public boolean sendPasswordSetupEmail(String email, String nome, String senhaTemporaria, String setupUrl) {
        return sendPasswordSetupEmail(
                email, nome, senhaTemporaria, setupUrl, UserLocaleResolver.resolveByEmail(email));
    }

    public boolean sendPasswordSetupEmail(String email, String nome, String senhaTemporaria, String setupUrl, String locale) {
        try {
            LOG.infof("Enviando email de setup de senha para: %s | from: %s", email, emailRemetente);
            com.aerosuite.i18n.TransactionalEmailMessages.EmailContent content =
                    com.aerosuite.i18n.TransactionalEmailMessages.passwordSetupInvite(locale, nome, senhaTemporaria, setupUrl);
            sendBrandedHtml(email, content);
            LOG.info("Email de setup de senha enviado com sucesso");
            return true;
        } catch (Exception e) {
            LOG.errorf("Erro ao enviar email de setup: %s", e.getMessage());
            if (e.getMessage() != null && (e.getMessage().contains("550") || e.getMessage().contains("Unauthenticated senders not allowed"))) {
                LOG.errorf("Dica: o endereço 'From' (%s) precisa estar verificado no SendGrid e compatível com a conta/API Key em uso.", emailRemetente);
            }
            return false;
        }
    }

    /**
     * Envia email de configuração de senha para usuário externo
     */
    public boolean sendPasswordSetupEmailExterno(String email, String nome, String senhaTemporaria, String setupUrl) {
        return sendPasswordSetupEmail(email, nome, senhaTemporaria, setupUrl);
    }

    public boolean sendPasswordSetupEmailExterno(
            String email, String nome, String senhaTemporaria, String setupUrl, String locale) {
        return sendPasswordSetupEmail(email, nome, senhaTemporaria, setupUrl, locale);
    }

    /**
     * Avisa o cliente de que uma proposta comercial está disponível no portal externo.
     */
    public boolean sendPropostaDisponivelPortalEmail(
            String email,
            String nomeDestinatario,
            String numeroProposta,
            String portalLoginUrl,
            String portalPropostasUrl) {
        return sendPropostaDisponivelPortalEmail(
                email,
                nomeDestinatario,
                numeroProposta,
                portalLoginUrl,
                portalPropostasUrl,
                UserLocaleResolver.resolveByEmail(email));
    }

    public boolean sendPropostaDisponivelPortalEmail(
            String email,
            String nomeDestinatario,
            String numeroProposta,
            String portalLoginUrl,
            String portalPropostasUrl,
            String locale) {
        try {
            LOG.infof("Enviando notificação de proposta no portal para: %s | proposta: %s", email, numeroProposta);
            com.aerosuite.i18n.TransactionalEmailMessages.EmailContent content =
                    com.aerosuite.i18n.TransactionalEmailMessages.propostaPortalAvailable(
                            locale, nomeDestinatario, numeroProposta, portalLoginUrl, portalPropostasUrl);
            sendBrandedHtml(email, content);
            return true;
        } catch (Exception e) {
            LOG.errorf("Erro ao enviar notificação de proposta no portal: %s", e.getMessage());
            return false;
        }
    }

    /**
     * Boas-vindas à nova organização (provisão SaaS): credenciais, código de login e link de acesso.
     */
    public boolean sendOrganizationWelcomeEmail(
            String email,
            String nomeDestinatario,
            String organizacaoNome,
            String organizacaoCodigo,
            String loginUrl,
            String senhaTemporaria,
            String setupPasswordUrl) {
        return sendOrganizationWelcomeEmail(
                email,
                nomeDestinatario,
                organizacaoNome,
                organizacaoCodigo,
                loginUrl,
                senhaTemporaria,
                setupPasswordUrl,
                UserLocaleResolver.resolveByEmail(email));
    }

    public boolean sendOrganizationWelcomeEmail(
            String email,
            String nomeDestinatario,
            String organizacaoNome,
            String organizacaoCodigo,
            String loginUrl,
            String senhaTemporaria,
            String setupPasswordUrl,
            String locale) {
        try {
            LOG.infof("Enviando boas-vindas organização para: %s | org: %s", email, organizacaoCodigo);
            com.aerosuite.i18n.TransactionalEmailMessages.EmailContent content =
                    com.aerosuite.i18n.TransactionalEmailMessages.organizationWelcome(
                            locale,
                            nomeDestinatario,
                            organizacaoNome,
                            organizacaoCodigo,
                            loginUrl,
                            senhaTemporaria,
                            setupPasswordUrl);
            sendBrandedHtml(email, content);
            return true;
        } catch (Exception e) {
            LOG.errorf("Erro ao enviar boas-vindas organização: %s", e.getMessage());
            return false;
        }
    }

    /**
     * Envia email genérico com anexo (para propostas comerciais)
     */
    public boolean sendEmail(String emailDestino, String assunto, String htmlBody, String textBody, byte[] anexo, String nomeAnexo) {
        try {
            LOG.infof("Enviando email para: %s, assunto: %s, from: %s", emailDestino, assunto, emailRemetente);

            Mail mail = criarMailHtml(emailDestino, assunto, htmlBody);
            mail.setText(textBody);

            if (anexo != null && nomeAnexo != null) {
                mail.addAttachment(nomeAnexo, anexo, "application/pdf");
            }

            mailer.send(mail);
            LOG.info("Email enviado com sucesso");
            return true;
        } catch (Exception e) {
            LOG.errorf("Erro ao enviar email: %s", e.getMessage());
            return false;
        }
    }

    /**
     * Envia email de teste
     */
    public void sendBlingNfeAutorizadaEmail(
            String email,
            String clienteNome,
            String numeroNfe,
            String situacao,
            String numeroProposta,
            String danfeUrl) {
        sendBlingNfeAutorizadaEmail(
                email,
                clienteNome,
                numeroNfe,
                situacao,
                numeroProposta,
                danfeUrl,
                UserLocaleResolver.resolveByEmail(email));
    }

    public void sendBlingNfeAutorizadaEmail(
            String email,
            String clienteNome,
            String numeroNfe,
            String situacao,
            String numeroProposta,
            String danfeUrl,
            String locale) {
        if (email == null || email.isBlank() || skipNotificacaoEmail("bling-nfe-autorizada")) {
            return;
        }
        try {
            com.aerosuite.i18n.TransactionalEmailMessages.EmailContent content =
                    com.aerosuite.i18n.TransactionalEmailMessages.blingNfeAutorizada(
                            locale, clienteNome, numeroNfe, situacao, numeroProposta, danfeUrl);
            sendBrandedHtml(email.trim(), content);
        } catch (Exception e) {
            LOG.errorf(e, "Falha ao enviar e-mail NF-e autorizada para %s", email);
        }
    }

    public void sendBackupCompletedEmail(List<String> recipients, String databaseName, String filePath, long fileSizeBytes, int durationSeconds) {
        if (recipients == null || recipients.isEmpty() || skipNotificacaoEmail("backup-concluido")) {
            return;
        }
        String sizeMb = String.format(java.util.Locale.US, "%.2f", fileSizeBytes / 1024.0 / 1024.0);
        for (String email : recipients) {
            if (email == null || email.isBlank()) {
                continue;
            }
            String locale = UserLocaleResolver.resolveByEmail(email.trim());
            com.aerosuite.i18n.TransactionalEmailMessages.EmailContent content =
                    com.aerosuite.i18n.TransactionalEmailMessages.backupCompleted(
                            locale, databaseName, filePath, sizeMb, durationSeconds);
            try {
                sendBrandedHtml(email.trim(), content);
            } catch (Exception e) {
                LOG.errorf(e, "Falha ao enviar e-mail pós-backup para %s", email);
            }
        }
    }

    public void sendTestEmail(String email) {
        sendTestEmail(email, UserLocaleResolver.resolveByEmail(email));
    }

    public void sendTestEmail(String email, String locale) {
        try {
            LOG.infof("Enviando email de teste para: %s | from: %s", email, emailRemetente);
            com.aerosuite.i18n.TransactionalEmailMessages.EmailContent content =
                    com.aerosuite.i18n.TransactionalEmailMessages.testEmail(
                            UserLocaleResolver.normalize(locale));
            sendBrandedHtml(email, content);
            LOG.info("Email de teste enviado com sucesso para: " + email);
        } catch (Exception e) {
            LOG.errorf("Erro ao enviar email de teste: %s", e.getMessage());
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.EMAIL_SEND_FAILED), e);
        }
    }

    public void sendUpdateReadyEmail(String email, String nome, String versao, String changelog) {
        sendUpdateReadyEmail(email, nome, versao, changelog, com.aerosuite.i18n.UserLocaleResolver.resolve((Long) null));
    }

    public void sendUpdateReadyEmail(String email, String nome, String versao, String changelog, String locale) {
        if (skipNotificacaoEmail("update-ready")) {
            return;
        }
        try {
            com.aerosuite.i18n.TransactionalEmailMessages.EmailContent content =
                    com.aerosuite.i18n.TransactionalEmailMessages.updateReady(locale, nome, versao, changelog);
            sendBrandedHtml(email, content);
        } catch (Exception e) {
            LOG.errorf("Erro ao enviar email de atualização pronta: %s", e.getMessage());
        }
    }

    public void sendUpdateAvailableEmail(String email, String nome, String versao, String changelog) {
        sendUpdateAvailableEmail(email, nome, versao, changelog, com.aerosuite.i18n.UserLocaleResolver.resolve((Long) null));
    }

    public void sendUpdateAvailableEmail(String email, String nome, String versao, String changelog, String locale) {
        if (skipNotificacaoEmail("update-available")) {
            return;
        }
        try {
            com.aerosuite.i18n.TransactionalEmailMessages.EmailContent content =
                    com.aerosuite.i18n.TransactionalEmailMessages.updateAvailable(locale, nome, versao, changelog);
            sendBrandedHtml(email, content);
        } catch (Exception e) {
            LOG.errorf("Erro ao enviar email de atualização disponível: %s", e.getMessage());
        }
    }

    public void sendUpdateCompletedEmail(String email, String nome, String versao) {
        sendUpdateCompletedEmail(email, nome, versao, com.aerosuite.i18n.UserLocaleResolver.resolve((Long) null));
    }

    public void sendUpdateCompletedEmail(String email, String nome, String versao, String locale) {
        if (skipNotificacaoEmail("update-completed")) {
            return;
        }
        try {
            com.aerosuite.i18n.TransactionalEmailMessages.EmailContent content =
                    com.aerosuite.i18n.TransactionalEmailMessages.updateCompleted(locale, nome, versao);
            sendBrandedHtml(email, content);
        } catch (Exception e) {
            LOG.errorf("Erro ao enviar email de atualização concluída: %s", e.getMessage());
        }
    }

    public void notificarNovoChamado(Ticket ticket) {
        try {
            String locale = com.aerosuite.i18n.UserLocaleResolver.normalize(suporteResponsavelLocale);
            com.aerosuite.i18n.TransactionalEmailMessages.EmailContent content =
                    com.aerosuite.i18n.TransactionalEmailMessages.ticketNewSupport(
                            locale, ticket.numero, ticket.titulo, ticket.descricao);
            sendBrandedHtml(emailResponsavel, content);
            LOG.infof("Email de novo chamado enviado para %s - Ticket: %s", emailResponsavel, ticket.numero);
        } catch (Exception e) {
            LOG.errorf("Erro ao enviar email de novo chamado: %s", e.getMessage());
        }
    }

    public void notificarChamadoResolvido(Ticket ticket) {
        if (skipNotificacaoEmail("ticket-resolvido")) {
            return;
        }
        if (ticket.usuarioEmail == null || ticket.usuarioEmail.isBlank()) {
            LOG.warn("Email do usuário não informado, notificação não enviada");
            return;
        }
        try {
            String locale = com.aerosuite.i18n.UserLocaleResolver.resolve(ticket.usuarioId);
            com.aerosuite.i18n.TransactionalEmailMessages.EmailContent content =
                    com.aerosuite.i18n.TransactionalEmailMessages.ticketResolved(locale, ticket.numero, ticket.titulo);
            sendBrandedHtml(ticket.usuarioEmail, content);
            LOG.infof("Email de chamado resolvido enviado para %s - Ticket: %s", ticket.usuarioEmail, ticket.numero);
        } catch (Exception e) {
            LOG.errorf("Erro ao enviar email de chamado resolvido: %s", e.getMessage());
        }
    }

    public void notificarNovaResposta(Ticket ticket, String resposta, String nomeAtendente) {
        if (skipNotificacaoEmail("ticket-resposta")) {
            return;
        }
        if (ticket.usuarioEmail == null || ticket.usuarioEmail.isBlank()) {
            LOG.warn("Email do usuário não informado, notificação não enviada");
            return;
        }
        try {
            String locale = com.aerosuite.i18n.UserLocaleResolver.resolve(ticket.usuarioId);
            com.aerosuite.i18n.TransactionalEmailMessages.EmailContent content =
                    com.aerosuite.i18n.TransactionalEmailMessages.ticketReply(
                            locale, ticket.numero, ticket.titulo, resposta, nomeAtendente);
            sendBrandedHtml(ticket.usuarioEmail, content);
            LOG.infof("Email de nova resposta enviado para %s - Ticket: %s", ticket.usuarioEmail, ticket.numero);
        } catch (Exception e) {
            LOG.errorf("Erro ao enviar email de nova resposta: %s", e.getMessage());
        }
    }

    /**
     * Envia email para o suporte quando o usuário responde ao chamado
     */
    public void notificarRespostaUsuario(Ticket ticket, String resposta, String nomeUsuario) {
        try {
            String locale = com.aerosuite.i18n.UserLocaleResolver.normalize(suporteResponsavelLocale);
            com.aerosuite.i18n.TransactionalEmailMessages.EmailContent content =
                    com.aerosuite.i18n.TransactionalEmailMessages.ticketUserReplyToSupport(
                            locale, ticket.numero, ticket.titulo, resposta, nomeUsuario);
            sendBrandedHtml(emailResponsavel, content);
            LOG.infof("Email de resposta do usuário enviado para suporte - Ticket: %s", ticket.numero);
        } catch (Exception e) {
            LOG.errorf("Erro ao enviar email de resposta do usuário: %s", e.getMessage());
        }
    }

    /**
     * Envia email quando o chamado é devolvido ao usuário (aguardando ação)
     */
    public void notificarAguardandoUsuario(Ticket ticket, String motivo) {
        if (skipNotificacaoEmail("ticket-aguardando")) {
            return;
        }
        if (ticket.usuarioEmail == null || ticket.usuarioEmail.isBlank()) {
            LOG.warn("Email do usuário não informado, notificação não enviada");
            return;
        }
        try {
            String locale = com.aerosuite.i18n.UserLocaleResolver.resolve(ticket.usuarioId);
            com.aerosuite.i18n.TransactionalEmailMessages.EmailContent content =
                    com.aerosuite.i18n.TransactionalEmailMessages.ticketAwaitingUser(
                            locale, ticket.numero, ticket.titulo, motivo);
            sendBrandedHtml(ticket.usuarioEmail, content);
            LOG.infof("Email de aguardando usuário enviado para %s - Ticket: %s", ticket.usuarioEmail, ticket.numero);
        } catch (Exception e) {
            LOG.errorf("Erro ao enviar email de aguardando usuário: %s", e.getMessage());
        }
    }

    /**
     * Envia email quando o status do chamado muda
     */
    public void notificarMudancaStatus(Ticket ticket, String statusAnterior, String statusNovo) {
        if (skipNotificacaoEmail("ticket-status")) {
            return;
        }
        if (ticket.usuarioEmail != null && !ticket.usuarioEmail.isBlank()) {
            try {
                String locale = com.aerosuite.i18n.UserLocaleResolver.resolve(ticket.usuarioId);
                com.aerosuite.i18n.TransactionalEmailMessages.EmailContent content =
                        com.aerosuite.i18n.TransactionalEmailMessages.ticketStatusChanged(
                                locale, ticket.numero, ticket.titulo, statusAnterior, statusNovo);
                sendBrandedHtml(ticket.usuarioEmail, content);
                LOG.infof("Email de mudança de status enviado para %s - Ticket: %s", ticket.usuarioEmail, ticket.numero);
            } catch (Exception e) {
                LOG.errorf("Erro ao enviar email de mudança de status: %s", e.getMessage());
            }
        }
    }

    /**
     * P5.3.3c — avisa usuário interno (quadro de capacidade) por e-mail.
     */
    public void sendCapacidadeFilaAtualizacaoInterno(
            String email,
            int numeroOs,
            String estagioAnterior,
            String estagioNovo,
            String clienteNome,
            String linkQuadro) {
        sendCapacidadeFilaAtualizacaoInterno(
                email,
                numeroOs,
                estagioAnterior,
                estagioNovo,
                clienteNome,
                linkQuadro,
                UserLocaleResolver.resolveByEmail(email));
    }

    public void sendCapacidadeFilaAtualizacaoInterno(
            String email,
            int numeroOs,
            String estagioAnterior,
            String estagioNovo,
            String clienteNome,
            String linkQuadro,
            String locale) {
        if (email == null || email.isBlank() || skipNotificacaoEmail("capacidade-interno")) {
            return;
        }
        try {
            com.aerosuite.i18n.TransactionalEmailMessages.EmailContent content =
                    com.aerosuite.i18n.TransactionalEmailMessages.capacidadeFilaInterno(
                            locale, numeroOs, estagioAnterior, estagioNovo, clienteNome, linkQuadro);
            sendBrandedHtml(email.trim(), content);
        } catch (Exception e) {
            LOG.errorf(e, "Capacidade fila interno: falha ao enviar e-mail para %s", email);
        }
    }

    /**
     * P5.3.3c — avisa cliente externo quando a fila da OS muda de estágio.
     */
    public void sendCapacidadeFilaAtualizacaoExterno(
            String email,
            int numeroOs,
            String estagioAnterior,
            String estagioNovo,
            String linkPortal) {
        sendCapacidadeFilaAtualizacaoExterno(
                email,
                numeroOs,
                estagioAnterior,
                estagioNovo,
                linkPortal,
                UserLocaleResolver.resolveByEmail(email));
    }

    public void sendCapacidadeFilaAtualizacaoExterno(
            String email,
            int numeroOs,
            String estagioAnterior,
            String estagioNovo,
            String linkPortal,
            String locale) {
        if (email == null || email.isBlank() || skipNotificacaoEmail("capacidade-externo")) {
            return;
        }
        try {
            com.aerosuite.i18n.TransactionalEmailMessages.EmailContent content =
                    com.aerosuite.i18n.TransactionalEmailMessages.capacidadeFilaExterno(
                            locale, numeroOs, estagioAnterior, estagioNovo, linkPortal);
            sendBrandedHtml(email.trim(), content);
            LOG.infof("Capacidade fila: e-mail enviado para %s (OS %d)", email, numeroOs);
        } catch (Exception e) {
            LOG.errorf(e, "Capacidade fila: falha ao enviar e-mail para %s", email);
        }
    }

    public void sendPlatformOpsAccessGranted(
            String email,
            String locale,
            String nome,
            String emailOperador,
            String perfilLabel,
            String accessUrl,
            String grantedAtLabel) {
        if (email == null || email.isBlank() || skipNotificacaoEmail("platform-ops-grant")) {
            return;
        }
        try {
            com.aerosuite.i18n.TransactionalEmailMessages.EmailContent content =
                    com.aerosuite.i18n.TransactionalEmailMessages.platformOpsAccessGranted(
                            locale, nome, emailOperador, perfilLabel, accessUrl, grantedAtLabel);
            sendPlatformOpsHtml(email.trim(), content);
            LOG.infof("Platform ops: e-mail de concessão enviado para %s", email);
        } catch (Exception e) {
            LOG.errorf(e, "Platform ops: falha ao enviar e-mail de concessão para %s", email);
        }
    }

    public void sendPlatformOpsAccessRevoked(
            String email,
            String locale,
            String nome,
            String emailOperador,
            String perfilLabel,
            String revokedAtLabel,
            String supportEmail) {
        if (email == null || email.isBlank() || skipNotificacaoEmail("platform-ops-revoke")) {
            return;
        }
        try {
            com.aerosuite.i18n.TransactionalEmailMessages.EmailContent content =
                    com.aerosuite.i18n.TransactionalEmailMessages.platformOpsAccessRevoked(
                            locale, nome, emailOperador, perfilLabel, revokedAtLabel, supportEmail);
            sendPlatformOpsHtml(email.trim(), content);
            LOG.infof("Platform ops: e-mail de revogação enviado para %s", email);
        } catch (Exception e) {
            LOG.errorf(e, "Platform ops: falha ao enviar e-mail de revogação para %s", email);
        }
    }

    private static String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}