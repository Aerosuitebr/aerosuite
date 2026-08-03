package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;

import org.jboss.logging.Logger;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.gmail.Gmail;
import com.google.api.services.gmail.model.Message;
import com.google.auth.http.HttpCredentialsAdapter;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.io.ByteArrayOutputStream;
import java.util.Base64;
import java.util.Properties;
import jakarta.mail.Session;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.MessagingException;

/**
 * Serviço para enviar emails usando Gmail API com OAuth2
 * Esta é a forma recomendada e mais confiável de enviar emails com OAuth2
 */
@ApplicationScoped
public class GmailApiService {
    
    private static final Logger LOG = Logger.getLogger(GmailApiService.class);
    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();
    
    @Inject
    CommercialBrandingService commercialBrandingService;
    
    @Inject
    OAuth2TokenManager oauth2TokenManager;
    
    @ConfigProperty(name = "quarkus.mailer.from")
    String mailFrom;
    
    private Gmail gmailService;
    private NetHttpTransport httpTransport;
    
    @PostConstruct
    void init() {
        if (oauth2TokenManager != null && oauth2TokenManager.isOAuth2Enabled()) {
            try {
                httpTransport = GoogleNetHttpTransport.newTrustedTransport();
                HttpCredentialsAdapter credentialsAdapter = 
                    new HttpCredentialsAdapter(oauth2TokenManager.getCredentials());
                gmailService = new Gmail.Builder(httpTransport, JSON_FACTORY, credentialsAdapter)
                    .setApplicationName(commercialBrandingService.nameNormal() + " Email Service")
                    .build();
                LOG.info("GmailApiService inicializado com sucesso");
            } catch (Exception e) {
                LOG.warn("Erro ao inicializar GmailApiService: " + e.getMessage());
                LOG.warn("GmailApiService não estará disponível - usando SMTP tradicional");
                LOG.warn("==========================================");
                LOG.warn("AVISO: Gmail API não disponível - usando SMTP tradicional");
                LOG.warn("==========================================");
                LOG.warnf(e, "Erro: %s", e.getMessage());
                LOG.warn("O sistema continuará funcionando com SMTP tradicional.");
                LOG.warn("==========================================");
                // Não lançar exceção - apenas não inicializar o serviço
                gmailService = null;
                httpTransport = null;
            }
        } else {
            LOG.info("GmailApiService não inicializado - OAuth2 não está habilitado ou disponível");
        }
    }
    
    /**
     * Envia email usando Gmail API
     */
    public boolean sendEmail(String to, String subject, String htmlBody, String textBody) {
        return sendEmail(to, subject, htmlBody, textBody, null, null);
    }

    public boolean sendEmail(String to, String subject, String htmlBody, String textBody, byte[] pdfAnexo, String nomeAnexo) {
        try {
            if (!oauth2TokenManager.isOAuth2Enabled()) {
                throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.OAUTH_NOT_ENABLED));
            }
            
            if (gmailService == null) {
                throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.GMAIL_NOT_INITIALIZED));
            }
            
            LOG.info("Enviando email via Gmail API para: " + to);
            if (pdfAnexo != null && pdfAnexo.length > 0) {
                LOG.info("Email contém anexo PDF: " + nomeAnexo + " (" + pdfAnexo.length + " bytes)");
            }
            
            // Criar mensagem MIME
            MimeMessage mimeMessage = createMimeMessage(to, subject, htmlBody, textBody, pdfAnexo, nomeAnexo);
            
            // Converter para formato Gmail API
            Message message = createGmailMessage(mimeMessage);
            
            // Enviar via Gmail API
            message = gmailService.users().messages().send("me", message).execute();
            
            LOG.info("Email enviado com sucesso via Gmail API. Message ID: " + message.getId());
            return true;
            
        } catch (Exception e) {
            LOG.error("Erro ao enviar email via Gmail API: " + e.getMessage());
            LOG.warnf(e, "Erro inesperado");
            throw new RuntimeException(ApiI18nMessages.withDetail(ApiI18nMessages.GMAIL_SEND_FAILED, e.getMessage()), e);
        }
    }
    
    /**
     * Cria uma mensagem MIME
     */
    private MimeMessage createMimeMessage(String to, String subject, String htmlBody, String textBody, byte[] pdfAnexo, String nomeAnexo) 
            throws MessagingException {
        Properties props = new Properties();
        Session session = Session.getDefaultInstance(props, null);
        
        MimeMessage email = new MimeMessage(session);
        email.setFrom(new InternetAddress(mailFrom));
        email.addRecipient(jakarta.mail.Message.RecipientType.TO, new InternetAddress(to));
        email.setSubject(subject, "UTF-8");
        
        // Se houver anexo, criar multipart "mixed", caso contrário "alternative"
        jakarta.mail.internet.MimeMultipart rootMultipart;
        if (pdfAnexo != null && pdfAnexo.length > 0 && nomeAnexo != null && !nomeAnexo.isBlank()) {
            // Multipart "mixed" para permitir anexos
            rootMultipart = new jakarta.mail.internet.MimeMultipart("mixed");
            
            // Criar multipart "alternative" para HTML e texto
            jakarta.mail.internet.MimeMultipart alternativeMultipart = new jakarta.mail.internet.MimeMultipart("alternative");
            
            // Parte texto
            jakarta.mail.internet.MimeBodyPart textPart = new jakarta.mail.internet.MimeBodyPart();
            textPart.setText(textBody, "UTF-8");
            alternativeMultipart.addBodyPart(textPart);
            
            // Parte HTML
            jakarta.mail.internet.MimeBodyPart htmlPart = new jakarta.mail.internet.MimeBodyPart();
            htmlPart.setContent(htmlBody, "text/html; charset=UTF-8");
            alternativeMultipart.addBodyPart(htmlPart);
            
            // Adicionar multipart alternative como corpo da mensagem
            jakarta.mail.internet.MimeBodyPart messageBodyPart = new jakarta.mail.internet.MimeBodyPart();
            messageBodyPart.setContent(alternativeMultipart);
            rootMultipart.addBodyPart(messageBodyPart);
            
            // Adicionar anexo PDF
            jakarta.mail.internet.MimeBodyPart attachmentPart = new jakarta.mail.internet.MimeBodyPart();
            try {
                attachmentPart.setFileName(jakarta.mail.internet.MimeUtility.encodeText(nomeAnexo, "UTF-8", null));
            } catch (java.io.UnsupportedEncodingException e) {
                attachmentPart.setFileName(nomeAnexo); // Fallback se encoding falhar
            }
            attachmentPart.setContent(pdfAnexo, "application/pdf");
            attachmentPart.setDisposition(jakarta.mail.Part.ATTACHMENT);
            rootMultipart.addBodyPart(attachmentPart);
        } else {
            // Multipart "alternative" para HTML e texto (sem anexos)
            rootMultipart = new jakarta.mail.internet.MimeMultipart("alternative");
            
            // Parte texto
            jakarta.mail.internet.MimeBodyPart textPart = new jakarta.mail.internet.MimeBodyPart();
            textPart.setText(textBody, "UTF-8");
            rootMultipart.addBodyPart(textPart);
            
            // Parte HTML
            jakarta.mail.internet.MimeBodyPart htmlPart = new jakarta.mail.internet.MimeBodyPart();
            htmlPart.setContent(htmlBody, "text/html; charset=UTF-8");
            rootMultipart.addBodyPart(htmlPart);
        }
        
        email.setContent(rootMultipart);
        return email;
    }
    
    /**
     * Converte MimeMessage para formato Gmail API
     */
    private Message createGmailMessage(MimeMessage mimeMessage) throws Exception {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        mimeMessage.writeTo(buffer);
        byte[] bytes = buffer.toByteArray();
        String encodedEmail = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        
        Message message = new Message();
        message.setRaw(encodedEmail);
        return message;
    }
    
    /**
     * Verifica se o serviço está disponível
     */
    public boolean isAvailable() {
        return oauth2TokenManager.isOAuth2Enabled() && gmailService != null;
    }
}

