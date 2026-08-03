package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;
import org.jboss.logging.Logger;
import com.google.auth.oauth2.AccessToken;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.auth.oauth2.UserCredentials;
import com.google.api.client.http.HttpResponseException;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import jakarta.inject.Inject;
import java.io.IOException;
import java.time.Instant;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Serviço para gerenciar tokens OAuth2 do Google para autenticação SMTP
 * Gerencia a obtenção e renovação automática de tokens de acesso
 */
@ApplicationScoped
public class OAuth2TokenManager {
    
    private static final Logger LOG = Logger.getLogger(OAuth2TokenManager.class);
    
    @ConfigProperty(name = "quarkus.mailer.oauth2.enabled", defaultValue = "false")
    boolean oauth2Enabled;
    
    @Inject
    org.eclipse.microprofile.config.Config config;
    
    private String clientId;
    private String clientSecret;
    private String refreshToken;
    
    @ConfigProperty(name = "quarkus.mailer.username")
    String username;
    
    private GoogleCredentials credentials;
    private AccessToken currentAccessToken;
    private final ReentrantLock tokenLock = new ReentrantLock();
    
    @PostConstruct
    void init() {
        if (oauth2Enabled) {
            // Carregar propriedades OAuth2 apenas se estiver habilitado
            clientId = config.getOptionalValue("quarkus.mailer.oauth2.client-id", String.class).orElse(null);
            clientSecret = config.getOptionalValue("quarkus.mailer.oauth2.client-secret", String.class).orElse(null);
            refreshToken = config.getOptionalValue("quarkus.mailer.oauth2.refresh-token", String.class).orElse(null);
            
            try {
                initializeCredentials();
                LOG.info("OAuth2TokenManager inicializado com sucesso");
            } catch (Exception e) {
                LOG.error("Erro ao inicializar OAuth2TokenManager: " + e.getMessage());
                LOG.warn("OAuth2 será desabilitado e o sistema usará autenticação SMTP tradicional");
                LOG.warn("==========================================");
                LOG.warn("AVISO: OAuth2 FALHOU - USANDO SMTP TRADICIONAL");
                LOG.warn("==========================================");
                LOG.warnf(e, "Erro: %s", e.getMessage());
                LOG.warn("O sistema continuará funcionando com autenticação SMTP tradicional.");
                LOG.warn("Para corrigir o OAuth2, veja: GERAR_NOVO_REFRESH_TOKEN.md");
                LOG.warn("==========================================");
                // Desabilitar OAuth2 em vez de lançar exceção
                oauth2Enabled = false;
                credentials = null;
            }
        } else {
            LOG.info("OAuth2 desabilitado - usando autenticação tradicional");
        }
    }
    
    private void initializeCredentials() throws IOException {
        if (clientId == null || clientSecret == null || refreshToken == null) {
            throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.OAUTH_CREDENTIALS_NOT_CONFIGURED));
        }
        
        // Log das credenciais (parcialmente mascaradas para segurança)
        LOG.info("Inicializando OAuth2 com Client ID: " + clientId);
        LOG.info("Client Secret: " + (clientSecret != null ? clientSecret.substring(0, Math.min(15, clientSecret.length())) + "..." : "NULO"));
        LOG.info("Refresh Token: " + (refreshToken != null ? refreshToken.substring(0, Math.min(50, refreshToken.length())) + "..." : "NULO"));
        
        // Criar credenciais usando refresh token
        credentials = UserCredentials.newBuilder()
            .setClientId(clientId)
            .setClientSecret(clientSecret)
            .setRefreshToken(refreshToken)
            .build();
        
        // Obter token inicial
        refreshAccessToken();
    }
    
    /**
     * Obtém um token de acesso válido, renovando se necessário
     * @return Token de acesso OAuth2
     */
    public String getAccessToken() {
        if (!oauth2Enabled) {
            throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.OAUTH_NOT_ENABLED));
        }
        
        tokenLock.lock();
        try {
            // Verificar se o token está expirado ou próximo de expirar (renovar 5 minutos antes)
            if (currentAccessToken == null || 
                currentAccessToken.getExpirationTime() == null ||
                currentAccessToken.getExpirationTime().toInstant()
                    .isBefore(Instant.now().plusSeconds(300))) {
                refreshAccessToken();
            }
            
            return currentAccessToken.getTokenValue();
        } finally {
            tokenLock.unlock();
        }
    }
    
    /**
     * Renova o token de acesso usando o refresh token
     * Método privado usado internamente
     */
    private void refreshAccessToken() {
        refreshAccessTokenInternal();
    }
    
    /**
     * Renova o token de acesso usando o refresh token
     * Método público que pode ser chamado externamente (ex: pelo scheduler)
     */
    public void refreshAccessTokenManually() {
        if (!oauth2Enabled) {
            throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.OAUTH_NOT_ENABLED));
        }
        if (credentials == null) {
            throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.OAUTH_CREDENTIALS_NOT_INITIALIZED));
        }
        
        tokenLock.lock();
        try {
            refreshAccessTokenInternal();
        } finally {
            tokenLock.unlock();
        }
    }
    
    /**
     * Implementação interna da renovação do token
     */
    private void refreshAccessTokenInternal() {
        try {
            credentials.refresh();
            currentAccessToken = credentials.getAccessToken();
            
            if (currentAccessToken != null && currentAccessToken.getExpirationTime() != null) {
                LOG.info("Token OAuth2 renovado. Expira em: " + currentAccessToken.getExpirationTime());
            } else {
                LOG.warn("Token OAuth2 renovado, mas sem informação de expiração");
            }
        } catch (Exception e) {
            String errorDetails = "Erro ao renovar token OAuth2: " + e.getMessage();
            if (e.getCause() != null) {
                errorDetails += " | Causa: " + e.getCause().getMessage();
            }
            
            // Log detalhado para debug
            LOG.warn("==========================================");
            LOG.warn("ERRO AO RENOVAR TOKEN OAUTH2");
            LOG.warn("==========================================");
            LOG.warnf("Client ID: %s", (clientId != null ? clientId : "NULO"));
            LOG.warnf("Client Secret completo: %s", (clientSecret != null ? clientSecret : "NULO"));
            LOG.warnf("Refresh Token completo: %s", (refreshToken != null ? refreshToken : "NULO"));
            LOG.warnf(e, "Erro: %s", e.getMessage());
            
            // Capturar detalhes do HttpResponseException se disponível
            Throwable cause = e.getCause();
            while (cause != null) {
                if (cause instanceof HttpResponseException) {
                    HttpResponseException httpEx = (HttpResponseException) cause;
                    LOG.warnf("HTTP Status: %s", httpEx.getStatusCode());
                    LOG.warnf("HTTP Content: %s", httpEx.getContent());
                    LOG.warnf("HTTP Headers: %s", httpEx.getHeaders());
                    errorDetails += " | HTTP Status: " + httpEx.getStatusCode();
                    if (httpEx.getContent() != null) {
                        errorDetails += " | HTTP Content: " + httpEx.getContent();
                    }
                    break;
                }
                cause = cause.getCause();
            }
            
            if (e.getCause() != null) {
                LOG.warnf(e, "Causa: %s", e.getCause().getMessage());
            }
            LOG.warn("==========================================");
            LOG.warn("SOLUÇÃO: O Refresh Token pode ter sido gerado com um Client ID diferente.");
            LOG.warn("Gere um novo Refresh Token usando o Client ID correto:");
            LOG.warnf("  %s", (clientId != null ? clientId : "NULO"));
            LOG.warn("Veja o guia em: GERAR_NOVO_REFRESH_TOKEN.md");
            LOG.warn("==========================================");
            
            LOG.error(errorDetails);
            LOG.warnf(e, "Erro inesperado");
            throw new RuntimeException(
                    ApiI18nMessages.encode(ApiI18nMessages.OAUTH_REFRESH_WRONG_CLIENT, "clientId", clientId), e);
        }
    }
    
    /**
     * Verifica se OAuth2 está habilitado e funcionando
     */
    public boolean isOAuth2Enabled() {
        return oauth2Enabled && credentials != null;
    }
    
    /**
     * Retorna as credenciais Google para uso com Gmail API
     */
    public GoogleCredentials getCredentials() {
        if (!oauth2Enabled) {
            throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.OAUTH_NOT_ENABLED));
        }
        if (credentials == null) {
            throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.OAUTH_CREDENTIALS_NOT_INITIALIZED));
        }
        return credentials;
    }
    
    @PreDestroy
    void cleanup() {
        if (credentials != null) {
            try {
                // Limpar recursos se necessário
                credentials = null;
                currentAccessToken = null;
            } catch (Exception e) {
                LOG.warn("Erro ao limpar recursos OAuth2: " + e.getMessage());
            }
        }
    }
}

